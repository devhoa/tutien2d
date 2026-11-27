// Mục Tiềm năng trong bảng Nhân vật, ngay dưới Trang bị (chủ dự án 21/11/2026 17:23; src/ui/self-panel.js gọi renderTiem).
// Trên: ấn tộc, tên, độ hiếm, một dòng lai lịch, các chỉ số trời cho lúc thức tỉnh, thiên phú (tộc hiếm). Dưới: điểm tiềm năng, mỗi chỉ số một
// dòng có nút cộng; thanh dưới cùng là nút tẩy điểm (chạm hai lần). Tính toán ở src/game/tiem-nang.js, số và chữ ở data/tiem-nang.json. Kiểu: tiem-nang.css.
// Thể chất (chủ dự án 25/11/2026: "thêm 1 mục thể chất ngay bên cạnh ô huyết mạch trong mục huyết mạch"): trên cùng là hai ô cạnh nhau, Huyết mạch và
// Thể chất (ấn, tên, độ hiếm / phẩm; chưa thức tỉnh thì ô mờ ghi mốc thức tỉnh). Chạm ô nào thì phần dưới hiện chi tiết ô đó (st.tnO).
// Nguyên Anh (chủ dự án 27/11/2026 01:21: "nguyên anh sẽ nằm chung mục với thể phách và huyết mạch"): ô thứ ba, chi tiết ở src/ui/tiem-anh.js.
import { goc } from '../core/build.js';
import { TN, tocCua, gocCua, congCua, diemCo, diemCon, tranCua, motDiem, gocPct, congDiem, giaTay, tayDiem } from '../game/tiem-nang.js';
import { TC, tcOn, theCua, phamThe, thePct } from '../game/the-chat.js';
import { addCoins, coins } from '../game/shop.js';
import { naOn } from '../game/nguyen-anh.js';
import { oAnh, chiTietAnh } from './tiem-anh.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));
const so = x => String(Math.round(x * 100) / 100).replace('.', ',');
let cssOn = false;
function css() { if (cssOn) return; cssOn = true; const l = el('link'); l.rel = 'stylesheet'; l.href = goc('src/ui/tiem-nang.css'); document.head.append(l); }

export function renderTiem(game, st, mid, bar, changed) {
  css();
  const D = game.data, T = TN(D), X = T.text, s = game.save, t = tocCua(s, D), H = D['he-chien'], wrap = el('div', 'tn'), ten = k => X.ngan?.[k] || H.ten?.[k] || k;
  const C = TC(D), CX = C?.text || {}, tc = theCua(s, D), co3 = tcOn(D) && naOn(D), tab = tcOn(D) && st.tnO === 'the' ? 'the' : co3 && st.tnO === 'anh' ? 'anh' : 'toc';
  mid.classList.remove('sheet');
  if (tcOn(D)) {   // hai ô cạnh nhau: Huyết mạch | Thể chất
    const hai = el('div', 'tn-hai' + (co3 ? ' ba' : '')), XAM = '#8d8599';
    const o = (id, nhan, an, tenO, phu, mau, khoa) => {
      const b = el('button', 'tn-o' + (tab === id ? ' on' : '') + (khoa ? ' khoa' : '')), c = el('span', 'tn-oc');
      b.type = 'button'; b.style.setProperty('--m', mau); c.append(el('small', '', nhan), el('b', '', tenO), el('i', '', phu)); b.append(el('em', 'tn-oa', an), c);
      b.onclick = () => { if (tab !== id) { st.tnO = id; st.tnHoi = false; game.sfx?.('click'); changed(false); } };
      return b;
    };
    const pt = tc && phamThe(D, tc);
    hai.append(o('toc', X.title, t ? t.han : '?', t ? t.ten : '···', t ? T.hiem[t.hiem].ten : CX.toc_chua_ngan, t ? t.mau : XAM, !t),
      o('the', CX.title, tc ? tc.han : '?', tc ? tc.ten : '···', tc ? pt.ten : CX.chua_ngan, tc ? pt.mau : XAM, !tc));
    if (co3) hai.append(o('anh', ...oAnh(game, XAM)));
    wrap.append(hai);
  }
  if (tab === 'anh') { chiTietAnh(game, wrap); const keep = mid.scrollTop; mid.replaceChildren(wrap); mid.scrollTop = keep; bar.replaceChildren(); bar.hidden = true; return; }
  if (tab === 'the') {   // chi tiết Thể chất
    if (!tc) wrap.append(el('div', 'tn-chua', CX.chua));
    else {
      const pt = phamThe(D, tc), goc0 = el('div', 'tn-goc');
      wrap.style.setProperty('--mau', pt.mau);
      for (const [k, v] of Object.entries(thePct(s, D)).sort((a, b) => b[1] - a[1])) { const c = el('div', 'tn-chip'); c.append(el('span', '', ten(k)), el('b', '', `+${so(v)}%`)); goc0.append(c); }
      wrap.append(el('div', 'tn-dd', tc.dac_diem), el('div', 'tn-loi', tc.loi), el('div', 'tn-nhan', CX.cho), goc0, el('div', 'tn-ghi', CX.khoa));
    }
    const keep = mid.scrollTop; mid.replaceChildren(wrap); mid.scrollTop = keep; bar.replaceChildren(); bar.hidden = true;
    return;
  }
  if (!t) { wrap.append(el('div', 'tn-chua', X.chua)); mid.replaceChildren(wrap); bar.replaceChildren(); bar.hidden = true; return; }
  wrap.style.setProperty('--mau', t.mau);
  if (!tcOn(D)) {   // chưa có Thể chất: đầu mục ấn tộc + tên như cũ
    const hiem = T.hiem[t.hiem], dau = el('div', 'tn-dau'), chu = el('div', 'tn-chu'), the = el('small', 'tn-hiem', hiem.ten);
    the.style.setProperty('--h', hiem.mau); chu.append(el('div', 'tn-ten', t.ten), the); dau.append(el('b', 'tn-an', t.han), chu); wrap.append(dau);
  }
  const goc0 = el('div', 'tn-goc');
  for (const [k, v] of Object.entries(gocCua(s, D)).sort((a, b) => b[1] - a[1])) { const c = el('div', 'tn-chip'); c.append(el('span', '', ten(k)), el('b', '', `+${so(gocPct(D, k, v))}%`)); goc0.append(c); }
  wrap.append(el('div', 'tn-loi', t.loi), el('div', 'tn-nhan', X.goc), goc0);
  if (t.thien_phu) { const p = el('div', 'tn-tp'); p.append(el('b', '', `${X.thien_phu}: ${t.thien_phu.ten}`), el('span', '', t.thien_phu.mo_ta)); wrap.append(p); }
  // Điểm tiềm năng
  const co = diemCo(s, D), con = diemCon(s, D), cong = congCua(s, D), n = T.diem.moi;
  wrap.append(el('div', 'tn-nhan', X.diem), el('div', 'tn-con' + (con > 0 ? ' co' : ''), fill(X.con, { a: con, b: co })));
  const ds = el('div', 'tn-ds');
  for (const k of T.diem.chi_so) {
    const c = cong[k] || 0, tran = tranCua(D, k), row = el('div', 'tn-row'), day = c >= tran, nut = el('button', 'tn-cong', day ? X.day : '+');
    const tk = el('span', 'tn-k', ten(k)), m = motDiem(D, k), v = el('small', c ? 'co' : '', `+${so(c * m)}%`);   // dòng nhỏ: đang có → cộng thêm một điểm thì thành bao nhiêu
    if (!day) v.append(el('i', '', ` → +${so((c + 1) * m)}%`));
    tk.append(v); row.append(tk, nut);
    nut.disabled = day || con < 1; nut.setAttribute('aria-label', `${X.cong} ${ten(k)}`);
    nut.onclick = () => { if (congDiem(game, k)) { st.tnHoi = false; game.sfx?.('click'); changed(); } };
    ds.append(row);
  }
  wrap.append(ds, el('div', 'tn-ghi', co ? fill(X.nguon, { n }) : fill(X.chua_diem, { n })), el('div', 'tn-ghi', X.khoa));
  const keep = mid.scrollTop; mid.replaceChildren(wrap); mid.scrollTop = keep;
  // Thanh dưới: tẩy điểm, chạm hai lần mới làm
  const gia = giaTay(game), daCong = Object.keys(cong).length > 0, tay = el('button', 'tn-tay', st.tnHoi ? X.tay_hoi : gia ? fill(X.tay_gia, { gia: gia.toLocaleString('vi-VN') }) : X.tay_free);
  tay.disabled = !daCong; tay.classList.toggle('hoi', !!st.tnHoi);
  tay.onclick = () => {
    if (!st.tnHoi) { st.tnHoi = true; changed(false); return; }
    st.tnHoi = false;
    if (coins(s) < gia) { game.toast?.(X.thieu_ls, 2); changed(false); return; }
    if (gia) addCoins(game, -gia, 'tay-diem');
    if (tayDiem(game)) game.toast?.(X.tay_ok, 2);
    changed();
  };
  bar.hidden = false; bar.replaceChildren(tay);
}
