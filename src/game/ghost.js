// Gục: chờ sec giây rồi mới hồi sinh (chủ dự án 09/11/2026 10:42 "lúc chết thì đợi hồi sinh 3 giây"). Người chơi đứng yên, không trúng đòn,
// quái vẫn chạy; hết sec giây thì hồi sinh (game.js respawn). Vẽ ở src/render/draw-ghost.js.
// 24/11/2026 00:28 chủ dự án: "hiệu ứng bị hạ sẽ chờ 5s kể cả auto hồi sinh và khi bị hạ, cả người sẽ biến thành màu đen và héo lại"
// (thay bong bóng linh hồn), "chết mà bắt hồi sinh… sẽ xuất hiện tại trận truyền tống của tông môn họ"; bảng chọn: "nếu bật auto hồi sinh thì
// vẫn hồi sinh tại chỗ, còn nếu k thì sẽ về trận tông môn", "Ma cũng về trận tông môn". Bảng hỏi "Hồi sinh tại đây / Về động phủ" (09/11 16:19) bỏ.
//   - Gục ngoài trời trên tinh cầu, đã có động phủ, KHÔNG bật Menu → Tự động → "Gục thì hồi sinh tại chỗ" (cả đang hóa ma): về pháp trận tinh cầu
//     tông môn, không có thì pháp trận Thiên Kiếm Tinh (src/game/diem-ve.js).
//   - Bật "Gục thì hồi sinh tại chỗ": hồi sinh ở điểm hồi sinh của tinh cầu đang đứng như cũ; đang là ma thì chỗ ngẫu nhiên xa làng (maHoiSinh,
//     src/game/ma-hoi-sinh.js), gục trên Thiên Kiếm Tinh thì bay hồn sang tinh cầu khác (thien-phat.js, 22/11/2026).
//   - Đài so tài, độ kiếp, bí cảnh, tháp, trong nhà, động phủ, trận Khai Tinh, chưa có động phủ: hồi sinh như cũ.
import { pilotOpt } from './pilotopt.js';
import { toiMa } from './pvp-ma.js';
import { choMa } from './ma-hoi-sinh.js';
import { maNoiDen, maDayDi } from './thien-phat.js';
import { taiTranTong, veTranTong } from './diem-ve.js';
import { hoaAnh } from './anh-the.js';   // từ Nguyên Anh: lần đầu bị hạ thì hoá Nguyên Anh, không gục (27/11/2026)

// Gục ngoài trời: không phải đài so tài, độ kiếp, bí cảnh, tháp, trong nhà, động phủ
const ngoai = game => !game.duel && !game.trib?.active && !game.dungeon && !game.map.def.tower && !game.map.def.indoor && !(game.map.def.rooms || []).length
  && game.map.id !== game.data.home.map;
// Gục mà về pháp trận tông môn: ngoài trời trên tinh cầu (world: không phải trận trùm Khai Tinh), đã có động phủ, không bật tự hồi sinh tại chỗ
const veTran = game => !!(game.save?.flags?.['dong-phu'] && !pilotOpt(game, 'hoi-sinh') && ngoai(game) && game.map.def.planet && game.map.def.world);

// Ma gục trên tinh cầu ngoài trời (đã bật tự hồi sinh tại chỗ): chỗ hồi sinh ngẫu nhiên xa làng, mỗi lần một chỗ khác (chủ dự án 22/11/2026
// 03:2x "Chỗ ngẫu nhiên xa làng"; data/pvp.json → ma.hoi_sinh). null: hồi sinh ở điểm vào như cũ. game.js respawn gọi TRƯỚC khi xử lý đài
// so tài, độ kiếp (lúc đó còn biết đang ở đâu).
export function maHoiSinh(game) {
  const H = game.data.pvp?.ma?.hoi_sinh, z = game.data.pvp?.server?.safe, T = game.map.T;
  if (!H || !toiMa(game) || !game.map.def.planet || !game.map.def.world || !ngoai(game)) return null;   // world: không phải trận trùm Khai Tinh
  const them = z && z.map === game.map.id ? [[z.x / T - 0.5, z.y / T - 0.5]] : [];   // tâm vòng pháp trận an toàn (điểm ảnh → ô)
  return choMa(game.map, { H, r: game.player.r, quai: game.spawners || [], them });
}

export function startGhost(game) {
  if (hoaAnh(game)) return;   // thân hủy, Nguyên Anh còn: không tính là bị hạ (src/game/anh-the.js)
  const G = game.data.config.ghost || { sec: 5 }, p = game.player, ve = veTran(game);
  game.ghost = { t: 0, sec: G.sec, x: p.x, y: p.y, ve };
  p.invT = game.ghost.sec + 2; p.kx = p.ky = 0; p.dashT = 0; p.moving = false;
  if (ve) taiTranTong(game, Math.max(1, G.sec - 0.6) * 1000).catch(() => {});   // trong lúc chờ: hỏi máy chủ tinh cầu tông môn mình
  game.sfx?.('hurt');
}

// false khi còn chờ; 've' (về trận tông môn) / 'here' (hồi sinh như cũ) khi xong (game.js gọi afterGhost)
export function ghostTick(game, dt) {
  const g = game.ghost;
  if (!g) return false;
  g.t += dt;
  game.player.x = g.x; game.player.y = g.y;
  if (g.t < g.sec) return false;
  game.ghost = null;
  return g.ve ? 've' : 'here';
}

// Hồi sinh rồi về trận tông môn; hoặc như cũ: ma gục trên Thiên Kiếm Tinh (chủ dự án 22/11/2026 11:4x: "ma nhân không còn hồi sinh trên Thiên
// Kiếm Tinh nữa") thì hồi sinh rồi bay hồn tới một tinh cầu khác đã mở cho mình, đứng chỗ ngẫu nhiên xa làng (thien-phat.js)
export function afterGhost(game, choice, respawn) {
  if (choice === 've') { respawn({ im: true }); veTranTong(game).catch(() => {}); return; }
  const di = maNoiDen(game);   // tính trước khi hồi sinh (lúc đó còn biết đang là ma, đang ở đâu)
  respawn(di ? { im: true } : undefined);
  if (di) maDayDi(game, di, maHoiSinh);
}
