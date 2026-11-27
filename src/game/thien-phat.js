// Thiên phạt và ma bị đẩy khỏi Thiên Kiếm Tinh (chủ dự án 22/11/2026 11:4x: "ai hoá ma khi ở Thiên Kiếm Tinh thì cứ mỗi 10s sẽ bị thiên phạt…
// sau đó hồi sinh ở hành tinh khác, bây giờ ma nhân không còn hồi sinh trên Thiên Kiếm Tinh nữa"; người mới kêu bị ma đánh mãi ở chỗ vào game).
// - Đang là ma mà đứng trên Thiên Kiếm Tinh (bản đồ của vòng pháp trận an toàn, data/pvp.json → server.safe.map; trong vòng cũng bị: vòng che
//   người, không che ma khí): cứ server.ma.tp.chu_ky giây một đạo sét trời, đạo thứ server.ma.tp.dao là gục. Từ 22/11/2026 16:14 máy chủ phòng làm
//   trọng tài (cloud/src/thien-phat.js; chủ dự án đồng ý chuyển để máy bị sửa không né được): phòng phát tin { t: 'tp', id, n } cho cả phòng mỗi
//   đạo chưa gục (tpTin: mọi máy vẽ sét lên người đó, máy của ma tự trừ ma.thien_phat.pct × (1 + tang × (n − 1)) máu tối đa nhưng không làm gục),
//   đạo cuối là tin gục 'pd' k 'tp' (pvp-ma.js maPd: −1 điểm ma, 1% tu vi, 1% Linh Thạch rơi thành túi ở chỗ gục, như bị diệt). Máy mình chỉ báo
//   trước một lần khi vừa tới (thienPhatTick).
// - Ma gục trên Thiên Kiếm Tinh (bị diệt, bị thiên phạt, cách nào cũng vậy) thì hồi sinh ở một tinh cầu khác đã mở cho mình, chỗ ngẫu nhiên xa làng
//   (ghost.js afterGhost → maDayDi). Điểm ma, tu vi, Linh Thạch của lần bị diệt vẫn theo luật cũ (máy chủ phòng, p2d_pvp_tra).
import { tribBolt } from './trib-sky.js';
import { addFx, addNumber } from './combat.js';
import { whyNot } from './starmap.js';
import { toiMa } from './pvp-ma.js';

const P = game => game.data.pvp;
const C = game => P(game)?.ma?.thien_phat;
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const PAL = ['#ffffff', '#fff2a8', '#ffc83a'];   // sét trời: trắng lõi, vàng kim (khác sét kiếp theo cảnh giới)
export const tinhThanh = game => P(game)?.server?.safe?.map;   // Thiên Kiếm Tinh

// Hình sét thiên phạt giáng vào thân e (mình hoặc người khác đang thấy). Chỉ để nhìn: không đổi máu ai
export function veTp(game, e) {
  tribBolt(game, e.x, e.y - 4, { pal: PAL, fade: 2 });
  addFx(game, { type: 'ring', x: e.x, y: e.y - 8, r: 34, color: PAL[2], life: 0.55, fill: true });
  addFx(game, { type: 'ring', x: e.x, y: e.y - 8, r: 56, color: PAL[0], life: 0.4 });
  game.sfx?.('thunder', e === game.player ? 1 : 0.6);
}

// Tin một đạo chưa gục từ phòng: vẽ sét lên người đó (mình hoặc người khác có mặt); đạo của mình thì trừ máu, chừa 1 (gục là tin 'pd' của phòng)
export function tpTin(game, m) {
  const me = game.online?.me?.id, p = game.player, c = C(game);
  const e = m.id === me ? p : game.others?.list?.get(m.id);
  if (!e || e.x == null || e.y == null) return;
  veTp(game, e);
  if (e !== p || !c || p.hp <= 0) return;
  const n = Math.max(1, Math.ceil(p.maxHp * c.pct * (1 + (c.tang || 0) * (Math.max(1, m.n | 0) - 1))));
  p.hp = Math.max(1, p.hp - n); p.flash = 0.18;
  addNumber(game, p.x, p.y - 16, n, PAL[1], true);
  game.screen?.shake(5, 0.3);
}

// Mỗi khung (pvp.js updatePvp): ma vừa tới Thiên Kiếm Tinh thì báo trước một lần (đếm giờ, giáng, gục đều do phòng)
export function thienPhatTick(game) {
  const s = game.pvp, p = game.player;
  if (!s || !p) return;
  if (!toiMa(game) || game.map?.id !== tinhThanh(game) || game.ghost || game.trip || p.hp <= 0) { s.tpBao = false; return; }
  if (s.tpBao) return;
  s.tpBao = true;
  game.toast(fill(P(game).text.thien_phat_bao, { s: P(game).server?.ma?.tp?.chu_ky ?? 10 }), 5);
  game.sfx?.('thunder', 0.5);
}

// Chưa mở tinh cầu nào khác (chưa học ngự kiếm): về làng đầu (config.start), cũng đứng chỗ xa làng; ma không hồi sinh trên Thiên Kiếm Tinh nữa
// (thử đầu-cuối 22/11/2026 16:5x: không có chỗ đi thì ma hồi sinh tại chỗ, bị đánh gục lại mỗi 30 giây tới hết điểm ma).
export function maNoiDen(game, rnd = Math.random) {
  if (!toiMa(game) || game.map?.id !== tinhThanh(game)) return null;
  const D = game.data, lang = D.config.start?.map, cam = new Set([tinhThanh(game), D.home?.map]), ds = [];
  let veLang = null;
  for (const b of D.starmap.bodies) for (const x of [b, ...(b.moons || [])]) {
    const d = x.map && D.maps[x.map];
    if (!d || cam.has(x.map) || x.kh || !d.world || !d.planet || d.demon || d.tower || d.indoor || d.arena || (d.rooms || []).length) continue;
    if (whyNot(game, x === b ? b : { ...x, parent: b })) continue;
    if (x.map === lang) veLang = lang; else ds.push(x.map);
  }
  return ds.length ? ds[Math.floor(rnd() * ds.length) % ds.length] : veLang;
}

// Bay hồn ma tới tinh cầu id (đã hồi sinh tại chỗ trên Thiên Kiếm Tinh), tới nơi thì đứng ở chỗ ngẫu nhiên xa làng như ma hồi sinh (choCho: ghost.js maHoiSinh)
export async function maDayDi(game, id, choCho) {
  const T = P(game).text, name = game.data.maps[id]?.name || id;
  game.toast(fill(T.ma_bi_day, { name }), 4);
  await game.travel(id, 'vao', true, { text: fill(T.ma_bi_day_bay, { name }), kind: 'flight' });
  const c = game.map?.id === id ? choCho(game) : null, p = game.player;
  if (c && p) { p.x = c.x; p.y = c.y; game.screen?.snap?.(c.x, c.y); }
}
