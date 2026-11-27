// Chỗ hiện ra lúc VÀO GAME (đăng nhập) và lúc GỤC mà không bật "Gục thì hồi sinh tại chỗ" (chủ dự án 24/11/2026 00:28: "chết mà bắt hồi sinh
// hoặc đăng nhập thì sẽ xuất hiện tại trận truyền tống của tông môn họ, nếu ai k có tông môn mới xuất hiện tại thiên kiếm tinh"; bảng chọn: bật tự
// hồi sinh thì vẫn hồi sinh tại chỗ, ma cũng về trận tông môn; mất kết nối / bản mới thì đứng chỗ cũ: src/game/vi-tri.js).
// Trận tông môn: pháp trận giữa sân tinh cầu khai hoang của tông môn mình (kh-gen.js phap_tran; máy chủ p2d_kh_toi → tinh). Tông môn chưa có
// tinh cầu, chưa tải được (mạng chậm quá ms) hay chưa mở được theo tu vi (map-gate.js): pháp trận Thiên Kiếm Tinh (data/home.json → start_map).
// Tới nơi: đứng giữa trận, cột sáng giáng xuống như vừa truyền tống tới (truyen-tong.js hienTaiTran), người cùng tinh cầu cũng thấy.
import { khState, khMine, khLoad } from './khai-hoang.js';
import { mapGate } from './map-gate.js';
import { hienTaiTran } from './truyen-tong.js';

// Tinh cầu tông môn mình đã dựng vào data.maps và mở được; không thì null
export function tranTong(game) {
  const id = khState(game).mine?.tinh?.id;
  if (!id || !game.data.maps[id]) return null;
  try { return mapGate(game, id) ? null : id; } catch { return null; }
}

// Hỏi lại máy chủ tông môn mình có tinh cầu nào (p2d_kh_toi); chưa dựng bản đồ tinh cầu đó thì tải danh sách (p2d_kh_ds). Quá ms thì thôi chờ.
export async function taiTranTong(game, ms = 3000) {
  if (!game.online) return tranTong(game);
  const viec = (async () => {
    try { await khMine(game); } catch { return; }
    const id = khState(game).mine?.tinh?.id;
    if (id && !game.data.maps[id]) await khLoad(game).catch(() => {});
  })();
  await Promise.race([viec, new Promise(r => setTimeout(r, ms))]);
  return tranTong(game);
}

// Nơi về: tinh cầu tông môn, không có thì Thiên Kiếm Tinh
export const noiVe = game => tranTong(game) || game.data.home?.start_map?.map || 'thien-kiem-phong';

// Gục xong (game.js respawn đã hồi máu): sang pháp trận nơi về, hiện ra trong cột sáng
export async function veTranTong(game) {
  const id = noiVe(game), T = game.data.config.ghost?.text || {};
  game.toast?.(id === tranTong(game) ? T.ve_tong : T.ve_tk, 2.4);
  if (game.map?.id !== id) await game.travel(id, 'phap-tran', false, { force: true });
  if (game.map?.id === id) hienTaiTran(game);
}
