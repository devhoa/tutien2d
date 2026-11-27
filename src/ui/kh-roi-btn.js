// Nút "Rời trận" lúc đang ở bản đồ trận Khai Tinh (kt-*) (CSKH #267, chủ dự án 26/11/2026 chọn "Nút Rời trận"): bản đồ trận không có
// pháp trận, từ 23/11 bỏ Bay tới nên thua / chưa hạ trùm là kẹt. Bấm hai lần (lần đầu chỉ nhắc): rời trận (tông chủ rời thì máy chủ tính
// thua, src/game/khai-hoang.js khQuit) rồi về pháp trận tông môn / Thiên Kiếm Tinh như lúc gục (src/game/diem-ve.js veTranTong).
// Dùng chung kiểu nút Rời đài (.duel-quit, src/ui/pvp.css).
import { khQuit } from '../game/khai-hoang.js';
import { veTranTong } from '../game/diem-ve.js';
import { every } from '../core/ticker.js';

export const trongTranKt = game => !!game.map?.def?.kh?.fight;

export function createKhRoiBtn(game) {
  const T = game.data['khai-hoang']?.text;
  if (!T?.roi) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'duel-quit kh-roi'; b.textContent = T.roi; b.hidden = true;
  let hoiT = 0, dang = false;
  b.addEventListener('pointerdown', e => e.stopPropagation());
  b.addEventListener('click', async e => {
    e.stopPropagation();
    if (dang) return;
    if (Date.now() - hoiT > 3000) { hoiT = Date.now(); game.toast?.(T.roi_hoi, 3); return; }
    dang = true; b.hidden = true;
    try {
      await khQuit(game);
      game.toast?.(T.roi_msg, 2);
      await veTranTong(game);
    } finally { dang = false; hoiT = 0; }
  });
  document.body.append(b);
  every(() => { const on = trongTranKt(game) && !game.traveling && !game.duel && !dang; if (b.hidden === on) b.hidden = !on; }, 300);
}
