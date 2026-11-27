// Hộp hỏi nhỏ khung bạc (chủ dự án 23/11/2026 14:34, ảnh hộp hỏi luyện đan: "nó hiển thị sau cái bảng; đồng bộ nó thành khung UI bạc, khung nhỏ thôi";
// 14:35 "Nâng phẩm lò cũng bị ẩn"). Hộp thoại chung (#dialog, src/ui/dialog.js) to và nằm dưới bảng Nhân vật / Túi đồ (z-index 30 < 60), nên các câu hỏi
// mở từ trong bảng dùng hộp này: nổi giữa màn trên mọi bảng, khung 9 mảnh như bảng Nhân vật (assets/art/ui-nv-khung.png), nút như nút trong bảng.
// Kiểu ở style-self2.css (.hn…: tệp CSS gốc nên đường dẫn hình đúng cả lúc chạy mã nguồn lẫn bản gói).
// hoiNho(chu, nut, o): chu: dòng chữ; nut: [{ id, label, desc?, gold?, nho? }] (nho: nút nhỏ hàng dưới, như Thôi); o.ico: hình đặt trước dòng chữ.
// Trả id nút đã bấm; chạm ra ngoài, nút X, phím Esc: null.
import { el } from './bag-detail.js';

export function hoiNho(chu, nut, o = {}) {
  return new Promise(done => {
    const nen = el('div', 'hn-nen'), box = el('div', 'hn'), x = el('button', 'hn-x'), ds = el('div', 'hn-ds'), duoi = el('div', 'hn-duoi');
    x.type = 'button'; x.setAttribute('aria-label', 'Đóng');
    const key = e => { if (e.key === 'Escape') end(null); };
    function end(id) { nen.remove(); removeEventListener('keydown', key); done(id); }
    x.onclick = () => end(null);
    nen.onclick = e => { if (e.target === nen) end(null); };
    const h = el('div', 'hn-h');
    if (o.ico) h.append(o.ico);
    h.append(el('p', 'hn-chu', chu));
    for (const n of nut) {
      const b = el('button', 'sv-bbtn hn-b' + (n.gold ? ' gold' : '') + (n.nho ? ' nho' : ''));
      b.type = 'button'; b.append(el('b', null, n.label));
      if (n.desc) b.append(el('small', null, n.desc));
      b.onclick = () => end(n.id);
      (n.nho ? duoi : ds).append(b);
    }
    box.append(x, h);
    if (ds.childElementCount) box.append(ds);
    if (duoi.childElementCount) box.append(duoi);
    nen.append(box); document.body.append(nen);
    addEventListener('keydown', key);
  });
}
