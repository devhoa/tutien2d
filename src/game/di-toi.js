// Chạm bản đồ tinh cầu thì nhân vật tự đi tới chỗ đó (chủ dự án 23/11/2026: "bỏ dịch chuyển tức thời trên map khi ấn vào map"). Trước đây chạm
// là ngự kiếm dịch chuyển tức thời tới nơi (src/game/hop.js); giờ hop.js chỉ đặt đích, file này tìm đường theo lưới ô (pilot.js findPath) rồi đi
// từng bước như người chơi tự đi: đang bay (nút Bay) thì bay thẳng. Đẩy cần điều khiển / phím là tự đi tay, thôi đi tới. Đang đi tới thì Tự hành,
// Tự đánh nhường đường (src/game/player.js), tới nơi chạy tiếp; Tự đánh săn quanh chỗ mới. Chữ ở data/starmap.json → texts.di_*.
import { findPath } from './pilot.js';
import { toward } from './auto.js';

const T = game => game.data.starmap.texts;

// Đặt đích (tọa độ điểm ảnh bản đồ) và báo đang đi. sau: việc làm khi tới nơi (Tới pháp trận ở Bản đồ: mở Tinh đồ truyền tống, tran-sang.js)
export function batDauDi(game, x, y, name, sau) {
  game.diToi = { map: game.map.id, x, y, name: name || game.map.def.name, path: null, tinh: 0, ket: 0, sau };
  game.toast?.(String(T(game).di_toi || '').replace('{name}', game.diToi.name), 1.8);
}

export function thoiDi(game, chu) {
  if (!game.diToi) return;
  if (chu) game.toast?.(chu, 1.6);
  game.diToi = null;
}

// Mỗi khung hình: trả { ax } hướng đi khi đang đi tới, null khi không đi
export function diToiStep(game, ax, dt) {
  const d = game.diToi, p = game.player;
  if (!d) return null;
  if (Math.hypot(ax.x, ax.y) > 0.1) { thoiDi(game); return null; }   // tự đi tay
  if (d.map !== game.map.id || game.traveling || game.trip || p.dead || p.hp <= 0) { thoiDi(game); return null; }
  if (Math.hypot(d.x - p.x, d.y - p.y) < 5) {
    if (game.auto) game.autoHome = { x: p.x, y: p.y };   // Tự đánh: săn quanh chỗ mới
    thoiDi(game, String(T(game).di_xong || '').replace('{name}', d.name));
    d.sau?.(game);
    return { ax: { x: 0, y: 0 } };
  }
  if (p.flying) return { ax: toward(p, d.x, d.y) };   // đang bay: thẳng tới
  const Tl = game.map.T;
  if ((d.tinh -= dt) <= 0 || !d.path) { d.tinh = 1; d.path = findPath(game, Math.floor(d.x / Tl), Math.floor(d.y / Tl)); }
  if (!d.path) { thoiDi(game, T(game).di_khong); return null; }
  while (d.path.length && Math.hypot(d.path[0].x - p.x, d.path[0].y - p.y) < 4) d.path.shift();
  const toi = d.path.length ? d.path[0] : d;
  // kẹt (vướng quái, NPC chắn) quá 3 giây không nhích: thôi
  const cach = Math.hypot(d.x - p.x, d.y - p.y);
  if (d.cu != null && d.cu - cach < 0.5) { if ((d.ket += dt) > 3) { thoiDi(game, T(game).di_khong); return null; } } else d.ket = 0;
  d.cu = cach;
  return { ax: toward(p, toi.x, toi.y) };
}
