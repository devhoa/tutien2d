// Vào game đúng chỗ vừa thoát (chủ dự án 23/11/2026: "nếu game có bản cập nhật mới, gamer sẽ bị đưa về đứng tại Thiên Kiếm Tinh, có cách nào để họ
// đăng nhập lại đúng vào vị trí vừa thoát không"). Trước đây (17/11/2026 02:46) ai có động phủ vào game luôn ở pháp trận Thiên Kiếm Tinh (cave.js
// ensureCave, vẫn là chỗ mặc định). Giờ máy ghi chỗ đứng (bản đồ, toạ độ) vào bộ nhớ máy mỗi nhip_s giây và lúc rời trang; vào lại bằng tài khoản đó
// trên máy đó (tải lại vì bản mới, mất kết nối lâu, tự rời vì treo máy, đăng nhập lại) thì đặt đúng chỗ. Chỉ nhớ tinh cầu ngoài trời và động phủ:
// trong bí cảnh, phó bản, đài, vùng boss thế giới thì giữ chỗ ngoài trời trước khi vào (cổng bí cảnh). Không đổi bản lưu máy chủ: vào bằng máy
// khác thì về chỗ mặc định như cũ. Số ở data/config.json → vi_tri.
// 24/11/2026 00:28 chủ dự án: "mất kết nối thì vẫn ở vị trí cũ hoặc có update thì vị trí cũ; còn chết mà bắt hồi sinh hoặc đăng nhập thì sẽ xuất hiện
// tại trận truyền tống của tông môn họ", bảng chọn "Cùng phiên hoặc trong 5 phút": chỉ giữ chỗ cũ khi tải lại trong CÙNG THẺ (bản mới, mất kết
// nối, tự tải lại; dấu ở sessionStorage) hoặc vừa rời chưa quá giu_phut phút (ứng dụng bị tắt rồi mở lại). Còn lại là đăng nhập: người đã có
// động phủ hiện ở pháp trận tinh cầu tông môn, không có thì pháp trận Thiên Kiếm Tinh (src/game/diem-ve.js); đăng xuất thì bỏ dấu cùng thẻ.
import { mapGate } from './map-gate.js';
import { taiTranTong } from './diem-ve.js';
import { hienTaiTran } from './truyen-tong.js';

const KEY = 'p2d-vi-tri', PHIEN = 'p2d-vi-tri-phien';
const C = game => game.data.config.vi_tri || {};

// Bản đồ nhớ chỗ được: tinh cầu ngoài trời hoặc động phủ
export function nhoDuoc(game, id) {
  const d = game.data.maps[id];
  return !!d && !d.rooms?.length && !d.arena && !!(d.planet || id === game.data.home?.map);
}

export function ghiViTri(game) {
  const p = game.player, id = game.map?.id;
  if (C(game).on === false || !game.save || !p || !id || game.traveling || game.trip || game.dangVao || !nhoDuoc(game, id)) return;
  try { localStorage.setItem(KEY, JSON.stringify({ ai: game.owner, map: id, x: Math.round(p.x), y: Math.round(p.y), w: game.map.w, t: Date.now() })); } catch { /* chế độ riêng tư */ }
  try { sessionStorage.setItem(PHIEN, String(game.owner ?? '')); } catch { /* không có sessionStorage */ }
}

// Đăng xuất, đổi tài khoản (src/ui/tu-vao.js boDauChoi): lần vào sau là đăng nhập, không giữ chỗ cũ
export function quenPhien() { try { sessionStorage.removeItem(PHIEN); } catch { /* không sao */ } }

// Giữ chỗ cũ: tải lại trong cùng thẻ của đúng tài khoản đó, hoặc vừa rời chưa quá giu_phut phút
function giuCho(game, r) {
  let phien = false;
  try { phien = sessionStorage.getItem(PHIEN) === String(r.ai ?? ''); } catch { /* không có sessionStorage */ }
  return phien || Date.now() - r.t < (C(game).giu_phut ?? 5) * 60e3;
}

// Chỗ đã nhớ của đúng tài khoản này, còn hạn, vào được (mở theo tu vi); không có thì null
export function layViTri(game) {
  if (C(game).on === false) return null;
  let r = null;
  try { r = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
  if (!r || r.ai !== game.owner || !nhoDuoc(game, r.map) || !(Date.now() - r.t < (C(game).max_h ?? 720) * 3600e3) || !giuCho(game, r)) return null;
  try { if (mapGate(game, r.map)) return null; } catch { return null; }
  return r;
}

// Lúc vào game (src/game/game.js): giữ chỗ thì nạp bản đồ đã nhớ rồi đặt nhân vật đúng chỗ (chỗ đó vướng vật thì ô trống gần nhất); không thì
// người đã có động phủ hiện ở trận tông môn / Thiên Kiếm Tinh (chờ máy chủ tối đa cho_ms), người mới đi truyện vào chỗ của truyện như cũ
export async function viTriVao(game, loadMap) {
  const vt = layViTri(game);
  if (!vt) return vaoTran(game, loadMap);
  game.save.map = vt.map;
  loadMap(game.save.map, game.save.spawn);
  const p = game.player, M = game.map;
  if (!p || M?.id !== vt.map) return;
  // Tinh cầu đã nới vành ngoài (planet.vanh, tools/the-gioi/vanh_ngoai.py): đĩa cũ nằm giữa đĩa mới, chỗ nhớ trước lúc nới (không có w) dịch theo
  const w0 = vt.w ?? M.def.planet?.vanh?.tu ?? M.w, o = (M.w - w0) / 2 * M.T, x = vt.x + o, y = vt.y + o;
  if (!(x >= 0 && y >= 0 && x < M.w * M.T && y < M.h * M.T)) return;
  let c = { x, y };
  if (M.blocked(c.x, c.y, p.r || 5)) c = M.freeNear(Math.floor(c.x / M.T), Math.floor(c.y / M.T), 0, p.r || 5) || null;
  if (!c) return;
  p.x = c.x; p.y = c.y;
  game.screen?.snap?.(c.x, c.y);
}

async function vaoTran(game, loadMap) {
  const dp = !!game.save.flags?.['dong-phu'], tong = dp && C(game).tong !== false ? await taiTranTong(game, C(game).cho_ms ?? 3000) : null;
  if (tong) game.save.map = tong;
  loadMap(game.save.map, tong ? 'phap-tran' : game.save.spawn);
  if (dp && game.map?.def?.phap_tran) hienTaiTran(game, { khoa: false });   // hiện ra giữa trận trong cột sáng (người cùng tinh cầu cũng thấy)
}

export function startViTri(game) {
  if (C(game).on === false) return;
  setInterval(() => ghiViTri(game), (C(game).nhip_s || 3) * 1000);
  addEventListener('pagehide', () => ghiViTri(game));
  document.addEventListener('visibilitychange', () => { if (document.hidden) ghiViTri(game); });
}
