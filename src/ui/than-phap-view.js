// Mục Thân pháp trong bảng Nhân vật → Công pháp (chủ dự án 22/11/2026 04:25: "trong mục công pháp, gần ô công pháp chiêu thức, sẽ thêm 1 ô thân pháp…
// cũng có các ô khảm"; src/ui/self-panel.js gọi renderThanPhap). 23/11/2026 12:43 (chủ dự án: "mấy ô có thể làm nhỏ thì làm nhỏ, thành ô giống kho
// trang bị, ấn vào để xem chi tiết"): trên là chuỗi năm ô nhát (chém → đâm → xuyên → hai ô khảm), dưới là lưới ô khung phẩm các thức
// (data/than-phap.json → thuc.*.pham) như Kho; thức chưa mở mờ, có khoá. Chạm ô khảm: chọn ô đó (vàng) và mở thức đang khảm; chạm một thức:
// tấm chi tiết (cách đánh, sát thương, ai truyền) với nút khảm vào nhát 4 / nhát 5. Biểu tượng vẽ bằng code từ chính hình vũ khí đang cầm.
// Luật ở src/game/than-phap.js; ô, tấm chi tiết dùng chung src/ui/o-luoi.js.
import { TP, tpOn, tpThuc, tpO, tpOMo, tpDat, tpChuoi } from '../game/than-phap.js';
import { hoSoSprite, blit } from '../render/draw-flyweapon.js';
import { goc } from '../core/build.js';
import { el, fill, olCss, khungPham, oVuong, luoi, hinhDau, tamDau, nut, hangNut } from './o-luoi.js';

const so = x => String(Math.round(x * 100) / 100).replace('.', ',');
let cssOn = false;
function css() { if (cssOn) return; cssOn = true; const l = el('link'); l.rel = 'stylesheet'; l.href = goc('src/ui/than-phap.css'); document.head.append(l); }

// Sát thương của một thức, nói bằng lần nhát chém thường (số lấy từ data/than-phap.json)
function satThuong(id, d, X) {
  if (id === 'anh-kiem') return `${d.n} bản sao, ${fill(X.sat, { x: so(d.mul) })}`;
  if (id === 'khai-thien') return `${fill(X.sat1, { x: so(d.mul) })}, mọi kẻ trên đường chém`;
  if (id === 'bach-thu') return `${d.n} nhát, ${fill(X.sat, { x: so(d.mul) })}; nhát cuối ${so(d.cuoi)}`;
  if (id === 'thu-vong') return `Gom và kéo quái về, tổng ${so(d.mul + d.lan2 + d.keo)} lần nhát chém`;
  if (id === 'thien-tran') return `${fill(X.sat1, { x: so(d.mul) })} cả vùng, choáng ${so(d.choang)} giây`;
  if (id === 'huyen-vuc') return `${d.n} nhát chia cho mục tiêu bị khoá, ${fill(X.sat, { x: so(d.mul) })}`;
  return '';
}

// Biểu tượng một thức hay một nhát cố định (chem, dam, xuyen): hình vũ khí đang cầm cộng một nét riêng, nền trong (nằm trong khung ô)
function icon(game, id, mau) {
  const c = el('canvas', 'tpv-hinh'), x = c.getContext('2d'), W = 40, ws = hoSoSprite(game, game.hoSo);
  c.width = W; c.height = W;
  if (!x) return c;   // máy hết bộ nhớ canvas: ô vẫn có khung, chỉ thiếu hình
  x.imageSmoothingEnabled = false; x.lineCap = 'round';
  const vk = (cx, cy, a, k, al = 1) => { if (!ws?.im) return; x.save(); x.globalAlpha = al; blit(x, ws, ws.im, cx, cy, a, k); x.restore(); };
  const net = (w, a = 1) => { x.globalAlpha = a; x.strokeStyle = mau; x.lineWidth = w; };
  if (id === 'chem') { net(2.5, 0.85); x.beginPath(); x.arc(20, 23, 15, -2.5, -0.25); x.stroke(); vk(20, 20, -Math.PI / 4, 1); }
  else if (id === 'dam') { net(1.2, 0.75); x.beginPath(); for (let i = 0; i < 4; i++) { x.moveTo(3, 13 + i * 5); x.lineTo(15 - (i % 2) * 4, 13 + i * 5); } x.stroke(); vk(25, 20, 0, 1.05); }
  else if (id === 'xuyen') { net(1, 0.6); x.beginPath(); x.moveTo(3, 20); x.lineTo(37, 20); x.stroke(); for (let i = 0; i < 3; i++) vk(9 + i * 11, 20, i % 2 ? Math.PI : 0, 0.75, 0.35 + 0.3 * i); }
  else if (id === 'anh-kiem') { for (let i = 0; i < 5; i++) vk(8 + i * 6, 26 - Math.abs(i - 2) * 4, -Math.PI / 2 + (i - 2) * 0.35, 0.9, 0.45 + 0.13 * i); }
  else if (id === 'thu-vong') { net(1); x.beginPath(); for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI * 2; x.lineTo(20 + Math.cos(a) * 14, 21 + Math.sin(a) * 10); } for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; x.moveTo(20, 21); x.lineTo(20 + Math.cos(a) * 14, 21 + Math.sin(a) * 10); } x.stroke(); vk(20, 20, -0.8, 0.8); }
  else if (id === 'thien-tran') { net(2, 0.8); x.beginPath(); x.ellipse(20, 33, 12, 4, 0, 0, Math.PI * 2); x.stroke(); vk(20, 18, Math.PI / 2, 1.5); }
  else if (id === 'bach-thu') { net(1, 0.9); x.beginPath(); for (let i = 0; i < 7; i++) { const a = -0.35 + i * 0.12; x.moveTo(6, 20); x.lineTo(6 + Math.cos(a) * 32, 20 + Math.sin(a) * 32); } x.stroke(); vk(26, 20, 0, 0.9); }
  else if (id === 'huyen-vuc') { const g = x.createRadialGradient(20, 22, 2, 20, 22, 17); g.addColorStop(0, '#05020a'); g.addColorStop(0.75, '#2a0f44'); g.addColorStop(1, mau); x.fillStyle = g; x.beginPath(); x.ellipse(20, 22, 17, 12, 0, 0, Math.PI * 2); x.fill(); net(1, 0.9); x.strokeStyle = '#ff3d7e'; x.beginPath(); x.moveTo(9, 14); x.lineTo(31, 30); x.moveTo(31, 14); x.lineTo(9, 30); x.stroke(); vk(20, 20, -0.6, 0.8); }
  else if (id === 'khai-thien') { net(3, 0.85); x.beginPath(); x.ellipse(14, 20, 16, 16, 0, -1.1, 1.1); x.stroke(); net(1.2, 1); x.strokeStyle = '#ffffff'; x.stroke(); vk(13, 20, -Math.PI / 2, 1.1); }
  else if (id === 'quy-trung') { net(1.4, 0.85); x.beginPath(); x.ellipse(20, 31, 15, 5, 0, 0, Math.PI * 2); x.stroke(); for (let i = 0; i < 4; i++) vk(7 + i * 8.6, 13 + (i % 2) * 4, Math.PI / 2, 0.7, 0.75); vk(20, 30, 0, 1.25); }   // vòng mộ, kiếm cắm, một thanh nằm
  else if (id === 'bach-luyen') { net(2, 0.85); x.beginPath(); x.ellipse(20, 33, 13, 4, 0, 0, Math.PI * 2); x.stroke(); net(1, 0.95); x.beginPath(); for (let i = 0; i < 6; i++) { const a = -2.7 + i * 0.45; x.moveTo(22, 30); x.lineTo(22 + Math.cos(a) * (9 + (i % 2) * 5), 30 + Math.sin(a) * (9 + (i % 2) * 5)); } x.stroke(); vk(17, 17, 1.2, 1.4); }   // đe lửa, hoa lửa, vũ khí nện xuống
  return c;
}

const MAU = '#8fd8ff', mauOf = d => d?.mau || MAU;

export function renderThanPhap(game, st, mid, bar) {
  css(); olCss();
  const D = game.data, S = TP(D), X = S?.text || {}, wrap = el('div', 'ol');
  bar.hidden = true; bar.replaceChildren();
  if (!tpOn(game)) { mid.classList.remove('sheet'); mid.replaceChildren(wrap); return; }
  const o = tpO(game), co = tpThuc(game), chuoi = tpChuoi(game);
  if (!(st.tpSlot >= 0 && st.tpSlot < o.length) || !tpOMo(game, st.tpSlot)) st.tpSlot = 0;
  const veLai = () => renderThanPhap(game, st, mid, bar);
  if (st.tpSel && (S.thuc[st.tpSel] || S.nhat.some(n => n.id === st.tpSel))) { chiTiet(game, st, mid, st.tpSel, veLai); return; }
  st.tpSel = null;
  mid.classList.remove('sheet');
  wrap.append(el('div', 'ol-ghi vang', fill(X.tieu_de, { n: chuoi.length })));
  // Chuỗi năm nhát: ba nhát cố định, hai ô khảm
  const hang = el('div', 'ol-hang ol-chuoi');
  S.nhat.forEach((n, i) => {
    if (i) hang.append(el('i', 'ol-mui', '›'));
    const o2 = el('span');
    if (n.o == null) {
      o2.append(oVuong(D, { o: khungPham(D, 0), ic: icon(game, n.id, '#cfd8ff'), tl: i + 1, ten: n.ten, onClick: () => { st.tpSel = n.id; game.sfx?.('click'); veLai(); } }), el('small', 'ol-nhan', n.ten));
    } else {
      const mo = tpOMo(game, n.o), id = o[n.o], d = id && S.thuc[id];
      o2.append(oVuong(D, { o: d ? khungPham(D, d.pham) : null, ic: d ? icon(game, id, mauOf(d)) : null, tl: i + 1, sel: mo && st.tpSlot === n.o, trong: mo && !d, khoa: !mo, moi: st.olMoi === 'tp' + n.o,
        ten: d ? d.ten : mo ? X.o_trong : X.khoa,
        onClick: () => { if (!mo) { game.toast?.(S.o[n.o].mo_ghi || X.khoa, 2.5); return; } st.tpSlot = n.o; st.tpSel = id || null; game.sfx?.('click'); veLai(); } }),
      el('small', 'ol-nhan', !mo ? X.khoa : d ? d.ten : X.o_trong));
    }
    hang.append(o2);
  });
  wrap.append(hang, el('div', 'ol-ghi', fill(X.ghi, { s: so(S.cua_so) }))); st.olMoi = null;
  // Các thức
  wrap.append(luoi(Object.entries(S.thuc).map(([id, d]) => oVuong(D, { o: co.includes(id) ? khungPham(D, d.pham) : null, ic: icon(game, id, mauOf(d)), khoa: !co.includes(id), mang: o.includes(id), ten: d.ten,
    onClick: () => { st.tpSel = id; game.sfx?.('click'); veLai(); } }))));
  const keep = mid.scrollTop; mid.replaceChildren(wrap); mid.scrollTop = keep;
}

// Tấm chi tiết một thức (hay một nhát cố định)
function chiTiet(game, st, mid, id, veLai) {
  const D = game.data, S = TP(D), X = S.text || {}, box = el('div', 'ol-tam'), dong = () => { st.tpSel = null; veLai(); };
  mid.classList.add('sheet');
  const nh = S.nhat.findIndex(n => n.id === id);
  if (nh >= 0) {   // nhát cố định: chém, đâm, xuyên
    const n = S.nhat[nh];
    box.append(tamDau(hinhDau(khungPham(D, 0), icon(game, id, '#cfd8ff')), n.ten, fill(X.nhat, { i: nh + 1 }), dong), el('div', 'd-line', n.mo_ta || ''));
    mid.replaceChildren(box); return;
  }
  const d = S.thuc[id], o = tpO(game), mo = tpThuc(game).includes(id), dang = o.indexOf(id);
  const phu = dang >= 0 ? fill(X.dang_o, { i: S.nhat.findIndex(n => n.o === dang) + 1 }) : !mo ? X.khoa : '';
  box.append(tamDau(hinhDau(mo ? khungPham(D, d.pham) : null, icon(game, id, mauOf(d))), d.ten, phu, dong));
  box.append(el('div', 'd-line', fill(X.day, { ai: d.day })), el('div', 'd-line', d.mo_ta || ''), el('div', 'd-line', satThuong(id, d, X)));
  if (!mo) { box.append(el('div', 'd-line', d.mo_ghi || '')); mid.replaceChildren(box); return; }
  // Khảm vào ô: mỗi ô khảm một nút, ô đang chọn là nút chính
  box.append(hangNut(...o.map((cu, i) => {
    const omo = tpOMo(game, i), nhat = S.nhat.findIndex(n => n.o === i) + 1;
    return nut(D, fill(X.nhat, { i: nhat }), cu === id ? fill(X.dang_o, { i: nhat }) : !omo ? X.khoa : cu ? S.thuc[cu].ten : X.o_trong, () => {
      if (tpDat(game, i, id)) { st.tpSlot = i; st.tpSel = null; st.olMoi = 'tp' + i; game.sfx?.('pickup'); veLai(); }   // về chuỗi, ô vừa khảm loé lên
    }, { chinh: omo && i === st.tpSlot && cu !== id, tat: !omo || cu === id, ico: 'kham' });
  })));
  const keep = mid.scrollTop; mid.replaceChildren(box); mid.scrollTop = keep;
}
