// Hàng ô Bộ 1–4 trên lưới Túi đồ → Trang bị (data/items.json → bo_do, src/game/bo-do.js; chủ dự án 27/11/2026 00:16).
// Chạm ô đã lưu: mặc cả bộ. Chạm ô chưa lưu: chọn ô đó (bấm Lưu để ghi đồ đang mặc). Ô khoá: hỏi mở bằng Tiên Ngọc (máy chủ trừ).
// Kiểu ở style-self2.css (.bd-…).
import { el } from './bag-detail.js';
import { hoiNho } from './hoi-nho.js';
import { boMo, boDs, boDang, boLuu, boMac, boMoThem, fill } from '../game/bo-do.js';

export function boDoHang(game, changed, refresh) {
  const C = game.data.items.bo_do, T = C.text, row = el('div', 'bd-hang'), mo = boMo(game), ds = boDs(game), dang = boDang(game);
  for (let i = 0; i < C.max; i++) {
    const n = i + 1, b = el('button', 'sv-bbtn bd-o');
    b.type = 'button';
    if (i < mo) {
      b.append(el('span', null, fill(T.bo, { n })));
      if (i === dang) b.classList.add('on');
      if (!ds[i]) b.classList.add('trong');
      b.onclick = () => {
        if (!ds[i]) { game.save.boDo.dang = i; game.toast?.(fill(T.trong, { n }), 2); refresh(); return; }
        const k = boMac(game, i);
        game.sfx?.('shield');
        game.toast?.(k ? fill(T.thieu, { n, k }) : fill(T.mac, { n }), 1.8);
        changed();
      };
    } else {
      const tn = C.gia[n];
      b.classList.add('khoa'); b.append(el('span', null, `🔒${n}`), el('small', null, String(tn))); b.title = fill(T.tn, { tn });   // ô hẹp: chỉ số, giá đủ chữ ở hộp hỏi
      b.disabled = i > mo;   // mở lần lượt: ô 4 chỉ mở sau ô 3
      b.onclick = async () => {
        const r = await hoiNho(fill(T.mo_hoi, { n, tn }), [{ id: 'ok', label: T.mo, gold: true }, { id: 'thoi', label: T.thoi, nho: true }]);
        if (r !== 'ok') return;
        const m = await boMoThem(game, n);
        if (m) game.toast?.(m, 2);
        refresh();
      };
    }
    row.append(b);
  }
  const luu = el('button', 'sv-bbtn gold bd-luu');
  luu.type = 'button'; luu.textContent = T.luu;
  luu.onclick = () => { const i = Math.min(boDang(game), mo - 1); boLuu(game, i); game.toast?.(fill(T.da_luu, { n: i + 1 }), 1.8); refresh(); };
  row.append(luu);
  return row;
}
