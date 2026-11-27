// Ô lưới khung phẩm dùng chung cho các mục tự vẽ trong bảng Nhân vật → Công pháp: Kỹ năng, Thân pháp, Công pháp (chủ dự án 23/11/2026 12:43:
// "công pháp thân pháp kỹ năng chưa đồng bộ, nó khá là khó nhìn… mấy ô có thể làm nhỏ thì làm nhỏ, thành ô giống kho trang bị, ấn vào để xem
// chi tiết"). Ô là .sv-stk (khung ảnh theo phẩm như Kho, style-self.css); tấm chi tiết dùng khuôn .sv-mid.sheet của phần trang bị (d-head,
// d-line, d-grid, act-btn). Kiểu riêng: src/ui/o-luoi.css.
import { goc } from '../core/build.js';
import { uiIco } from './self-gear.js';

export const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
export const fill = (s, o) => String(s ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));
export const so = x => String(Math.round(x * 10) / 10).replace('.', ',');

let cssOn = false;
export function olCss() { if (cssOn) return; cssOn = true; const l = el('link'); l.rel = 'stylesheet'; l.href = goc('src/ui/o-luoi.css'); document.head.append(l); }

// Mã khung phẩm thứ i của items.line_tiers (0 Phàm lục … 6 Thượng Cổ đen); theo cấp: cấp từ mốc moc[i] trở lên dùng khung thứ i
export const khungPham = (data, i) => { const L = data.items.line_tiers.list; return L[Math.max(0, Math.min(L.length - 1, i | 0))].id; };
export const khungCap = (data, moc, lv) => khungPham(data, (moc || [1]).filter(m => lv >= m).length - 1);

// Một ô vuông. a: { o: mã khung, ic: chuỗi url(...) hoặc phần tử (canvas), tl: chữ góc trên trái, br: góc dưới phải, sel, khoa, mang,
// trong (ô trống), moi (vừa mang vào: loé lên), ten, onClick }
export function oVuong(data, a) {
  const b = el('button', 'sv-stk ol-o' + (a.sel ? ' sel' : '') + (a.khoa ? ' khoa' : '') + (a.mang ? ' mang' : '') + (a.trong ? ' trong' : '') + (a.moi ? ' moi' : ''));
  if (a.o) b.dataset.o = a.o;
  if (a.ten) { b.title = a.ten; b.setAttribute('aria-label', a.ten); }
  if (typeof a.ic === 'string' && a.ic) { const i = el('i', 'ico'); i.style.setProperty('--ic', a.ic); b.append(i); }
  else if (a.ic) b.append(a.ic);
  if (a.tl != null && a.tl !== '') b.append(el('b', 'sv-plus sv-cap', String(a.tl)));
  if (a.br != null && a.br !== '') b.append(el('small', null, String(a.br)));
  if (a.khoa) b.append(uiIco(data, 'ui.nv-khoa', 'ol-khoa'));
  if (a.onClick) b.onclick = a.onClick;
  return b;
}

// Lưới 5 cột (như Kho), lấp ô trống cho đủ hàng, ít nhất min ô
export function luoi(cells, min = 10) {
  const g = el('div', 'sv-bag-grid stock ol-luoi');
  g.append(...cells);
  const du = Math.max(min, Math.ceil(cells.length / 5) * 5) - cells.length;
  for (let i = 0; i < du; i++) g.append(el('i', 'sv-empty'));
  return g;
}

// Hình ở đầu tấm chi tiết: ô khung phẩm nhỏ (không bấm)
export function hinhDau(o, ic) {
  const h = el('i', 'ol-dau');
  if (o) h.dataset.o = o;
  if (typeof ic === 'string' && ic) h.style.setProperty('--ic', ic); else if (ic) h.append(ic);
  return h;
}

// Đầu tấm chi tiết: hình, tên, dòng phụ, nút ✕
export function tamDau(hinh, ten, phu, close) {
  const head = el('div', 'd-head'), txt = el('div', 'd-name'), x = el('button', 'd-close', '✕');
  x.setAttribute('aria-label', 'Đóng chi tiết'); x.onclick = close;
  txt.append(el('div', 'd-title', ten), el('div', 'd-sub', phu));
  head.append(hinh, txt, x);
  return head;
}

// Nút thao tác như phần trang bị: hình + tên một dòng + chữ nhỏ
export function nut(data, ten, nho, fn, { chinh, tat, ico } = {}) {
  const b = el('button', 'act-btn' + (chinh ? ' primary' : ''));
  if (ico) b.append(uiIco(data, 'ui.nv-' + ico, 'sv-aico'));
  b.append(el('b', null, ten));
  if (nho) b.append(el('small', null, nho));
  b.disabled = !!tat; b.onclick = fn;
  return b;
}
export const hangNut = (...ds) => { const g = el('div', 'd-grid ol-nut'); g.append(...ds.filter(Boolean)); return g; };
