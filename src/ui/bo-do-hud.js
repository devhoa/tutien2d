// Ô Bộ 1–4 trên màn chơi, ngay trên cột ba ô Kỹ năng (chủ dự án 27/11/2026 02:15: "để bộ 1 bộ 2, 3, 4 ở chỗ bên trên ô kỹ năng, để họ dễ đổi
// đồ nhanh hơn… bộ trong kho để thiết lập, bộ bên ngoài trên ô kỹ năng để mặc nhanh"). Chỉ để MẶC: lưu bộ, mở ô 3 / 4 bằng Tiên Ngọc vẫn ở
// Túi đồ → Trang bị (src/ui/bo-do-hang.js). Chỉ hiện ô đã mở; ô chưa lưu mờ, chạm thì nhắc chỗ lưu. Logic mặc: src/game/bo-do.js boMac.
// Kiểu ở ky-nang-hud.css (#bo-hud). src/ui/hud.js gọi boDoHud mỗi lần vẽ lại màn chơi; chỉ đụng DOM khi trạng thái đổi.
import { boMo, boDs, boDang, boMac, fill } from '../game/bo-do.js';

let khung = null, ky = '';
export function boDoHud(game) {
  const C = game.data.items?.bo_do;
  if (!C || !game.save) return;
  if (!khung) {
    khung = document.createElement('div'); khung.id = 'bo-hud';
    khung.addEventListener('pointerdown', e => e.stopPropagation());   // không thành cú đẩy cần điều khiển / chạm bản đồ
    (document.getElementById('buttons') || document.body).append(khung);
  }
  const mo = boMo(game), ds = boDs(game), dang = boDang(game);
  const k = mo + '|' + dang + '|' + ds.slice(0, mo).map(b => (b ? 1 : 0)).join('');
  if (k === ky) return;
  ky = k; khung.replaceChildren();
  for (let i = 0; i < mo; i++) {
    const n = i + 1, b = document.createElement('button');
    b.type = 'button'; b.className = 'bo-o' + (i === dang && ds[i] ? ' on' : '') + (ds[i] ? '' : ' trong');
    b.textContent = fill(C.text.bo, { n });
    b.onclick = e => {
      e.stopPropagation();
      if (!boDs(game)[i]) { game.toast?.(fill(C.text.hud_trong, { n }), 2.4); return; }
      const thieu = boMac(game, i);
      game.sfx?.('shield');
      game.toast?.(thieu ? fill(C.text.thieu, { n, k: thieu }) : fill(C.text.mac, { n }), 1.8);
    };
    khung.append(b);
  }
}
