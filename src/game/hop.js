// Đi tới chỗ chạm trên bản đồ tinh cầu (chủ dự án xin 28/10/2026 bay ngay tới; 23/11/2026: "bỏ dịch chuyển tức thời trên map khi ấn vào map"):
// mở Bản đồ, chạm vào chỗ nào trên tinh cầu đang đứng thì nhân vật TỰ ĐI tới đó (src/game/di-toi.js), không dịch chuyển nữa.
// Chạm trúng vách, cây, nước thì đi tới ô đi được gần nhất. Bản đồ vẽ ở src/ui/planet-map.js.
import { batDauDi } from './di-toi.js';

const T = game => game.data.starmap.texts;

// Lý do chưa bay được trên tinh cầu này (null = bay được)
export function hopWhy(game) {
  const def = game.map?.def;
  if (!def?.planet) return T(game).hop_none;
  if (game.trib.active) return 'Đang độ kiếp!';
  if (game.story.busy || game.dialog.open) return 'Đang có chuyện, đợi xong đã.';
  if (game.trip || game.traveling) return T(game).hop_busy;
  return null;
}

// Ô đi được gần (tx, ty) nhất, dò vòng dần ra tới 6 ô; không có thì null
export function landTile(game, tx, ty) {
  const map = game.map, ok = (x, y) => !map.solidTile(x, y) && !map.def.portals.some(pt => !pt.fly && pt.at[0] === x && pt.at[1] === y);
  for (let d = 0; d <= 6; d++) {
    let best = null, bd = Infinity;
    for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== d || !ok(tx + dx, ty + dy)) continue;
      const k = dx * dx + dy * dy;
      if (k < bd) { bd = k; best = [tx + dx, ty + dy]; }
    }
    if (best) return best;
  }
  return null;
}

// Đi tới ô (tx, ty). name: tên chỗ tới để báo (bãi quái, NPC...). Trả về true nếu đã đặt đích.
export function hopTo(game, tx, ty, name) {
  if (hopWhy(game)) return false;
  const land = landTile(game, tx, ty);
  if (!land) return false;
  const to = game.map.center(land[0], land[1]), p = game.player;
  p.meditating = false;
  batDauDi(game, to.x, to.y, name);
  game.sfx('click');
  return true;
}
