// Chợ Phiên dạng lưới như Kho (chủ dự án 26/11/2026 08:56: "chợ cũng sẽ hiển thị ở dạng lưới giống trong kho, chỉ khi ấn vào mới có thể
// xem và mua"). Mỗi ô: khung theo phẩm (data-o, như ô kho trang bị), hình món, +cường hoá / số lượng, giá dưới ô. Chạm ô thì tấm chi tiết
// (tên, phẩm, chỉ số đủ, người bán, giá, nút) hiện ở đầu danh sách; ✕ hoặc chạm lại ô là đóng. Kiểu ở src/ui/market-luoi.css.
import { goc } from '../core/build.js';
import { itemName } from '../game/items.js';
import { matInfo } from '../game/cave.js';
import { caUrl } from '../render/ca-hinh.js';
import { icon } from './bag-detail.js';
import { gradeId } from './self-gear.js';
import { itemStats } from './item-stats.js';
import { el, hinhDau, khungPham } from './o-luoi.js';

let cssOn = false;
export function mkCss() { if (cssOn) return; cssOn = true; const l = el('link'); l.rel = 'stylesheet'; l.href = goc('src/ui/market-luoi.css'); document.head.append(l); }

const vn = n => Math.floor(n || 0).toLocaleString('vi-VN');

// Hình và khung của một hàng: món (trang bị) hoặc nguyên liệu { id, n }
function hinh(data, loai, mon) {
  if (loai === 'mon') return { o: gradeId(data, mon), ic: icon(data, mon) };
  const S = data.art.sprites, spr = S['ui.vk-' + mon.id], cu = !spr && caUrl(data, mon.id), m = matInfo(data, mon.id), i = el('i', 'ico');
  if (spr) i.style.setProperty('--ic', `url("${spr.file}?v=${spr.v}")`);
  else if (cu) { i.style.setProperty('--ic', `url("${cu}")`); i.style.imageRendering = 'pixelated'; }
  else { i.classList.add('mat-sq'); i.style.background = m?.color || '#ccc'; }
  return { o: khungPham(data, m?.pham || 0), ic: i };
}

// x = { key, loai, mon, gia?, ten (người bán)? }; sel: đang mở chi tiết
export function oCho(game, x, sel, onClick) {
  const { data } = game, h = hinh(data, x.loai, x.mon), w = el('div', 'mk-o' + (sel ? ' sel' : ''));
  const b = el('button', 'sv-stk');
  if (h.o) b.dataset.o = h.o;
  b.setAttribute('aria-label', x.loai === 'mon' ? itemName(data, x.mon) : (matInfo(data, x.mon.id)?.name || x.mon.id));
  b.append(h.ic);
  if (x.loai === 'mon' && x.mon.plus) b.append(el('b', 'sv-plus sv-cap', '+' + x.mon.plus));
  if (x.loai !== 'mon') b.append(el('small', null, '×' + vn(x.mon.n)));
  b.onclick = onClick;
  w.append(b);
  if (x.gia != null) w.append(el('span', 'mk-o-gia', vn(x.gia)));
  return w;
}

// Lưới 5 cột; lấp ô trống cho đủ hàng
export function luoiCho(cells) {
  const g = el('div', 'mk-luoi');
  g.append(...cells);
  const du = Math.ceil(cells.length / 5) * 5 - cells.length;
  for (let i = 0; i < du; i++) g.append(el('i', 'mk-o trong'));
  return g;
}

// Tấm chi tiết: g = goodsName(), dong: các dòng chữ thêm (người bán, giá), nuts: các nút
export function tamCho(game, x, g, dong, nuts, close) {
  const { data } = game, h = hinh(data, x.loai, x.mon), t = el('div', 'mk-tam');
  const head = el('div', 'mk-tam-dau'), txt = el('div', 'mk-tam-ten'), xb = el('button', 'mk-tam-x', '✕');
  xb.setAttribute('aria-label', 'Đóng chi tiết'); xb.onclick = close;
  const ten = el('b', null, g.name); if (g.color) ten.style.color = g.color;
  txt.append(ten, el('small', null, g.sub));
  const u = h.ic.style.getPropertyValue('--ic');
  head.append(hinhDau(h.o, u || h.ic), txt, xb);
  t.append(head);
  if (x.loai === 'mon') try { t.append(itemStats(game, x.mon)); } catch { /* món lạ: chỉ hiện tên */ }
  else { const m = matInfo(data, x.mon.id); if (m?.desc) t.append(el('p', 'mk-tam-mo', m.desc)); }
  for (const d of dong) if (d) t.append(d);
  if (nuts.length) { const r = el('div', 'mk-tam-nut'); r.append(...nuts); t.append(r); }
  return t;
}
