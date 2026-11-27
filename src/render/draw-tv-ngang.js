// Tinh đồ màn ngang vẽ giống hệt video tinh-do-ngang.mp4 (chủ dự án 19/11/2026 04:08 "chả giống video", 04:09 "làm đi").
// Khung thiết kế 1920×1080 như video, co theo màn; màn rộng hơn 16:9 thì khung rộng ra, mây và tinh thể hai mép dạt ra theo mép.
// Hai hệ mặt trời (chủ dự án 26/11/2026 00:17): thế giới rộng tv.ngang.rong, màn thấy một phần, vuốt kéo ngang; kết giới hình viên thuốc
// (tv.ngang.vong.L, src/render/tv-vien.js); nền chỉ vẽ một ô cửa quanh phần đang thấy. Sắp chỗ: tools/the-gioi/tinh_vuc_hai_he.py.
// Tinh cầu đứng đúng chỗ ảnh mẫu (data/starmap.json → tv.ngang.pos), mặt trăng quay quanh mẹ 1 vòng mỗi 24 giây, khai hoang trên vòng
// theo cấp (cấp cao ra rìa, vượt rìa thì kết giới nở theo). Nền trong kết giới: sao, quỹ đạo chấm, hạt linh khí toả từ Linh Nhật;
// ngoài: ma giới (draw-tv-ma-ngang.js), mây / tinh thể SpriteCook, kết giới bị ma tộc công kích (draw-tv-ket-gioi.js). Màn dọc giữ draw-starmap.js.
import { dangerOf } from '../game/starmap.js';
import { spriteImage } from './sprites.js';
import { drawMangSky } from './draw-mang-sky.js';
import { sprite, khDeco, tongMau } from './draw-starmap.js';
import { maNgang } from './draw-tv-ma-ngang.js';
import { drawKetGioi } from './draw-tv-ket-gioi.js';
import { eVien, trenVien, duongVien } from './tv-vien.js';

const TAU = Math.PI * 2, RAD = Math.PI / 180;
let low = null, cua = null;   // tấm trời sao; ô cửa nền đang vẽ { x, w } (điểm tấm nhỏ)
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Tên ngắn, không khung (chủ dự án 04:27): chữ viền tối; tên đè tên đã đặt thì bỏ (trừ chỗ đang đứng, đang chọn)
function chu(ctx, list, px) {
  ctx.font = `${px}px "Unifont VN", system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
  const boxes = [];
  for (const l of list.sort((a, b) => a.pri - b.pri)) {
    const f = l.small ? Math.max(8, Math.round(px * 0.8)) : px, w = (ctx.font = `${f}px "Unifont VN", system-ui`, ctx.measureText(l.text).width + 4), h = f * 1.2;
    // chỗ đặt tên: dưới hình; vướng tên khác thì thử trên hình, bên phải, bên trái, thấp hơn (chủ dự án 19/11/2026 11:07: vài tinh cầu không hiện tên)
    const up = l.top != null ? l.top - h : l.y - h * 2, side = (l.r || h) + w / 2 + 2;
    const tries = l.must ? [[l.x, l.y]] : [[l.x, l.y], [l.x, up], [l.x + side, l.y - h], [l.x - side, l.y - h], [l.x, l.y + h]];
    let at = null;
    const cw = ctx.canvas.width / (ctx.getTransform().a || 1);
    for (const [x0, y] of tries) {
      const x = Math.min(cw - w / 2 - 2, Math.max(w / 2 + 2, x0));   // không cắt chữ ở mép
      const bx = { x0: x - w / 2, x1: x + w / 2, y0: y, y1: y + h };
      if (l.must || !boxes.some(o => bx.x0 < o.x1 && bx.x1 > o.x0 && bx.y0 < o.y1 && bx.y1 > o.y0)) { at = [x, y]; boxes.push(bx); break; }
    }
    if (!at) continue;
    ctx.lineWidth = Math.max(2, f * 0.3); ctx.strokeStyle = 'rgba(14,8,24,.95)'; ctx.strokeText(l.text, at[0], at[1]);
    ctx.fillStyle = l.color; ctx.fillText(l.text, at[0], at[1]);
  }
}

function put(ctx, art, id, x, y, k, flip) {
  const s = art[id], im = s && spriteImage(s); if (!im) return;
  const w = s.w * k, h = s.h * k;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(im, 0, 0, s.w, s.h, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
  ctx.restore();
}

// Nền trong kết giới (tấm nhỏ = thiết kế / 3): trời tối, sao nhấp nháy, quỹ đạo chấm quanh từng mặt trời, hạt linh khí bay ra.
// Như ma giới: tấm chỉ là ô cửa rộng W ở X0 của thế giới rộng Wt (điểm tấm nhỏ), vẽ theo toạ độ thế giới, 12 lần mỗi giây.
function trong(c, W, Hl, X0, Wt, suns, e, t, k = 1) {   // suns: [[x, y]…] các mặt trời (toạ độ thiết kế đã cộng ox, oy); k: độ co của hệ (hai hệ: 0,66)
  const X1 = X0 + W, o = (x, y) => { if (x >= X0 && x < X1) c.fillRect(Math.round(x), Math.round(y), 1, 1); };
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#0c0a1e'; c.fillRect(0, 0, W, Hl);
  c.setTransform(1, 0, 0, 1, -X0, 0);
  const a = t / 24 * TAU;
  for (let i = 0; i < 380 * Wt / 640; i++) {
    const x = Math.floor(hash(i) * Wt), y = Math.floor(hash(i + 1) * Hl), s = hash(i + 2);
    if (x < X0 - 3 || x > X1 + 3 || Math.sin(a * 2 + s * 40) <= -0.3) continue;
    c.fillStyle = s > 0.85 ? '#fff4d8' : '#968cc8'; c.fillRect(x, y, 1, 1);
    if (s > 0.97) { c.fillStyle = '#c8b4ff'; c.fillRect(x - 2, y, 5, 1); c.fillRect(x, y - 2, 1, 5); }
  }
  suns.forEach((sun, n) => {
    c.fillStyle = 'rgb(120,100,80)';
    for (let q = 1; q < 8; q++) {
      const rx = (95 + q * 92) * k / 3, ry = rx * 0.6, m = Math.floor(rx * 1.5);
      if (sun[0] / 3 + rx < X0 || sun[0] / 3 - rx > X1) continue;
      for (let j = 0; j < m; j += 2) { const g = j / m * TAU, x = sun[0] / 3 + Math.cos(g) * rx, y = sun[1] / 3 + Math.sin(g) * ry; if (e(x, y) < 0.93) o(x, y); }
    }
    for (let i = 0; i < 90; i++) {   // hạt linh khí từ mặt trời toả ra
      const g = hash(i + 50 + n * 200) * TAU, q = (hash(i + 51 + n * 200) + t / 24 * (0.8 + hash(i + 52) * 0.6)) % 1;
      c.fillStyle = q < 0.4 ? (n ? '#cfe6ff' : '#faf0aa') : (n ? '#7ab8ff' : '#96dc5a');
      const x = sun[0] / 3 + Math.cos(g) * (130 + q * 596) * k / 3, y = sun[1] / 3 + Math.sin(g) * (80 + q * 365) * k / 3;
      if (e(x, y) < 0.97) o(x, y);
    }
  });
}

// st như drawStarmap; trả về chỗ chạm được (toạ độ màn)
export function drawNgang(ctx, w, h, sm, bodies, st) {
  const T = sm.tv, N = T.ngang, art = st.art || {}, t = st.t, view = st.view, z = view?.z || 1, V = N.vong, L = V.L || 0;
  // Khai hoang: vòng theo cấp; cấp cao vượt rìa thì kết giới nở theo
  const kh = bodies.filter(b => b.kh), khR = cap => N.kh[0] + N.kh[1] * (Math.max(1, cap) - 1);
  const no = Math.max(1, ...kh.map(b => (khR(b.cap) + 0.1) / 0.92)), vrx = V.rx * no, vry = V.ry * no;
  // Khung THẾ GIỚI rộng WW (hai hệ: tv.ngang.rong, kết giới nở thì rộng theo), màn chỉ thấy Wv; phần thừa hai bên thì vuốt kéo ngang
  // (view.ex: quãng kéo được mỗi bên, src/ui/pan-zoom.js). Một hệ (không có rong): WW = 1920 như cũ.
  const WW = N.rong ? Math.max(N.rong, 2 * (L + vrx + 110)) : 1920, Wv = Math.max(w < h ? 1560 : 1920, 1080 * w / h),   // màn dọc: cắt bớt hai mép cho kết giới to ra
    Hd = Math.max(1080, (w < h ? 1560 : 1920) * h / w), Wd = Math.max(WW, Wv), ox = (Wd - (N.rong || 1920)) / 2, oy = (Hd - 1080) / 2;
  const s0 = Math.min(w / Wv, h / Hd), s = s0 * z, cx = V.cx + ox, cy = V.cy + oy;
  // Chỗ từng thiên thể (toạ độ thiết kế)
  const pts = [], at = {}, a = t / 24 * TAU;
  for (const b of bodies) {
    if (b.parent) continue;
    let q;
    if (b.kh) { const r = khR(b.cap), [x, y] = trenVien({ cx, cy, rx: V.rx * r, ry: V.ry * r, L }, b.angle * RAD); q = { b, x, y, D: N.kh_d[0] + N.kh_d[1] * (b.cap || 1) }; }
    else { const p = N.pos[b.id]; if (!p) continue; q = { b, x: p[0] + ox, y: p[1] + oy, D: p[2] }; }
    pts.push(q); at[b.id] = q;
  }
  for (const b of bodies) {
    const m = b.parent && N.trang[b.map], pm = m && at[m[0]];
    if (!pm) continue;
    const g = m[2] + m[4] * a, r = pm.D / 2 * m[1] + m[3] / 2;
    pts.push({ b, x: pm.x + Math.cos(g) * r, y: pm.y + Math.sin(g) * r * 0.55, D: m[3], back: Math.sin(g) < 0, zz: pm.y });
  }
  if (view) {   // mở Tinh đồ (view.canh): canh ngang vào chỗ đang đứng; chạm mũi tên mép (view.toi): lướt tới
    view.ex = Math.max(0, (Wd - Wv) / 2 * s0);
    const o = view.canh && pts.find(p => p.b.map && p.b.map === st.here);
    if (o) view.x = Math.max(-view.ex, Math.min(view.ex, (Wd / 2 - o.x) * s0));
    view.canh = false;
    if (view.toi != null) { const d = Math.max(-view.ex, Math.min(view.ex, view.toi)) - view.x; view.x += Math.abs(d) < 1.5 ? d : d * 0.2; if (Math.abs(d) < 1.5) view.toi = null; }
  }
  const tx = w / 2 + (view?.x || 0) - Wd / 2 * s, ty = h / 2 + (view?.y || 0) - Hd / 2 * s;
  // Màn rộng / cao hơn 16:9: mây, tinh thể ở mép vẽ thêm một bản dạt ra sát mép màn, khỏi lộ chỗ trống
  const mep = (x, y) => {
    const Ls = [], px = Math.max(0, ox), dx = x < 480 ? -px : x > (N.rong || 1920) - 480 ? px : 0, dy = y < 200 ? -oy : y > 880 ? oy : 0;
    if (Math.abs(dy) > 40) { Ls.push([x + ox, y + oy + dy]); if (Math.abs(dy) > 160) Ls.push([x + ox, y + oy + dy / 2]); }   // màn dọc: lấp trên dưới
    if (Math.abs(dx) > 40) Ls.push([x + ox + dx, y + oy]);
    Ls.push([x + ox, y + oy]); return Ls; };
  const trx = vrx * 720 / 756, try_ = vry * 450 / 475;   // phần trời sao bên trong vòng kết giới (720 × 450 của vòng 756 × 475)
  const e = (x, y) => eVien(x, y, cx / 3, cy / 3, trx / 3, try_ / 3, L / 3);
  ctx.save(); ctx.setTransform(ctx.getTransform().multiply(new DOMMatrix([s, 0, 0, s, tx, ty])));
  ctx.imageSmoothingEnabled = false;
  const x0 = -tx / s, x1 = (w - tx) / s, thay = (x, r) => x + r > x0 && x - r < x1;   // phần thế giới đang thấy; thay(): có nằm trong màn không
  // Nền: ma giới ngoài, trời sao trong (cắt theo kết giới). Hai tấm nền chỉ vẽ một Ô CỬA quanh phần đang thấy (rộng bằng màn + lề LE), không vẽ
  // cả thế giới: hai hệ rộng gấp đôi mà không nặng thêm. Kéo ngang trong lề thì dùng lại tấm cũ; phần thấy ra khỏi ô mới dời ô (cua).
  const Wl = Math.ceil(Wd / 3), Hl = Math.ceil(Hd / 3), LE = 48, Wb = Math.min(Wl, Math.ceil(Wv / 3) + 2 * LE);
  const va = Math.max(0, Math.floor(x0 / 3)), vb = Math.min(Wl, Math.ceil(x1 / 3));
  if (!cua || cua.w !== Wb || va < cua.x || vb > cua.x + Wb || cua.x + Wb > Wl) cua = { w: Wb, x: Math.max(0, Math.min(Wl - Wb, Math.round((va + vb) / 2 - Wb / 2))) };
  const X0 = cua.x, f12 = Math.floor(t * 12);
  ctx.drawImage(maNgang(art, Wb, Hl, cx / 3, cy / 3, trx / 3, try_ / 3, t, ox / 3, X0, Wl, L / 3), X0 * 3, 0, Wb * 3, Hl * 3);
  if (!low) low = document.createElement('canvas');
  if (low.width !== Wb || low.height !== Hl) { low.width = Wb; low.height = Hl; low.khoa = ''; }
  const khoa = `${f12}|${X0}|${Math.round(trx)}|${Math.round(cx)}|${Math.round(cy)}`;
  if (low.khoa !== khoa) {   // trời sao trong kết giới: 12 lần mỗi giây như ma giới, giữa hai lần dùng lại tấm cũ
    low.khoa = khoa;
    const suns = (N.he?.sun || ['sun']).map(k => N.pos[k]).filter(Boolean).map(p => [p[0] + ox, p[1] + oy]);
    trong(low.getContext('2d'), Wb, Hl, X0, Wl, suns, e, f12 / 12, N.he?.k || 1);
  }
  ctx.save(); duongVien(ctx, cx, cy, trx, try_, L); ctx.clip();
  ctx.drawImage(low, X0 * 3, 0, Wb * 3, Hl * 3); ctx.restore();
  // Mây, tinh thể ma khí (SpriteCook) đúng chỗ video
  N.may.forEach(([id, x, y, k, lat], i) => { for (const [X, Y] of mep(x, y)) if (thay(X, 300 * k)) put(ctx, art, 'tv.' + id, X + 10 * Math.sin(t / 24 * TAU + i), Y + 4 * Math.sin(t / 12 * TAU + i * 2), k, !!lat); });
  if (oy > 40) (N.may_doc || []).forEach(([id, x, y, k, lat], i) => { if (thay(x + ox, 300 * k)) put(ctx, art, 'tv.' + id, x + ox + 8 * Math.sin(t / 24 * TAU + i), y + oy + 3 * Math.sin(t / 12 * TAU + i), k, !!lat); });   // màn dọc: mây lấp trên dưới
  N.tinh_the.forEach(([x, y, ph]) => { for (const [X, Y] of mep(x, y)) if (thay(X, 120)) put(ctx, art, 'tv.tinh-the', X, Y + 8 * Math.sin(t / 24 * TAU + ph), 1.3); });
  drawKetGioi(ctx, art, T, { cx, cy, rx: vrx, ry: vry, L, tru: N.tru, x0, x1 }, t, 3, N.tru_k * 756 / vrx);
  // Thiên thể
  const order = pts.filter(p => thay(p.x, p.D * 1.5)).sort((p, q) => (p.zz ?? p.y) - (q.zz ?? q.y) || (p.b.parent ? (p.back ? -1 : 1) : 0) - (q.b.parent ? (q.back ? -1 : 1) : 0));
  for (const p of order) {
    const dim = !p.b.sun && p.b.kind !== 'lost' && !st.seen(p.b);
    if (p.b.kh) khDeco(ctx, p.b, p.x, p.y, p.D, t, true);
    sprite(ctx, art, p.b, p.x, p.y, p.D * 1.18 / 1.1, t, dim);
    if (p.b.kh) khDeco(ctx, p.b, p.x, p.y, p.D, t, false);
    if (p.b.id === 'thien-kiem-phong') {   // quầng xanh và kiếm trấn phía trên như video
      ctx.fillStyle = '#78e65a';
      for (let j = 0; j < 40; j++) { const g = j / 40 * TAU + a * 4; ctx.fillRect(Math.round(p.x + Math.cos(g) * p.D * 0.78), Math.round(p.y + 8 + Math.sin(g) * p.D * 0.3), 3, 3); }
      put(ctx, art, 'tv.tru', p.x, p.y - p.D * 0.95 + 3 * Math.sin(a * 8), 0.6);
    }
  }
  for (const p of order) {   // chỗ đang đứng (vàng nhấp nháy), chỗ đang chọn (trắng đứt)
    const here = p.b.map && p.b.map === st.here, sel = p.b.id === st.sel;
    if (!here && !sel) continue;
    const rr = p.D * 0.62 + (here ? 8 + (Math.sin(t * 4) > 0 ? 4 : 0) : 14);
    ctx.fillStyle = here ? '#ffd24a' : '#ffffff';
    for (let i = 0; i < 40; i++) if (here || i % 3) { const g = i / 40 * TAU; ctx.fillRect(Math.round(p.x + Math.cos(g) * rr) - 2, Math.round(p.y + Math.sin(g) * rr) - 2, 4, 4); }
  }
  ctx.restore();
  // Ra toạ độ màn: chỗ chạm, rắn chín đầu, tên (thiên thể ngoài màn: không tên, không chạm)
  const S = (x, y) => [tx + x * s, ty + y * s], out = order.map(p => { const [x, y] = S(p.x, p.y); return { b: p.b, x, y, r: Math.max(8, p.D * 0.5 * s) }; }), labels = [];
  if (st.mang) {
    const mv = out.find(p => p.b.id === 'ma-vuong'), [ccx, ccy] = S(cx, cy);
    const m = drawMangSky(ctx, st.mang.spr, st.mang.sky, { cx: ccx, cy: ccy, rx: (L * 1.12 + vrx * 1.3) * s, ry: vry * s * 1.3 }, mv ? mv.r : Math.max(8, 43 * s), t);
    if (m && st.mang.name && m.x > -40 && m.x < w + 40) labels.push({ text: N.ten['thon-thien-mang'] || st.mang.name, x: m.x, y: m.y + m.r * 0.95, color: '#e0a8ff', pri: 2 });
    if (m) out.push({ b: { id: 'thon-thien-mang', mang: true, name: st.mang.name }, x: m.x, y: m.y, r: m.r * 0.8 });
  }
  for (const p of out) {
    const b = p.b, here = b.map && b.map === st.here, sel = b.id === st.sel;
    if (b.mang || p.x < -p.r || p.x > w + p.r) continue;
    if (here) labels.push({ text: sm.texts.here, x: p.x, y: p.y - p.r - N.chu * s * 1.6 - 4, color: '#ffd24a', pri: 0, must: true });
    const seen = st.seen(b), dg = seen && dangerOf(b, st.realm);   // mặt trăng cũng hiện tên (chữ nhỏ hơn, nhường tinh cầu lớn)
    labels.push({ text: seen ? (N.ten[b.id] || b.name) + (b.kh && !b.trong && b.cap ? ` ${b.cap}` : '') : '?', x: p.x, y: p.y + p.r * 1.05, top: p.y - p.r * 1.05, r: p.r, small: !!b.parent && !sel && !here && z < 1.8,
      color: dg ? st.hint[dg] : b.sun ? (b.color || '#ffe48a') : b.kh && !b.trong ? tongMau(b) : '#f4ead8',
      pri: here || sel ? 1 : b.sun ? 5 : b.parent ? 20 : 10 - (b.size || 0) / 2, must: here || sel });
  }
  chu(ctx, labels, Math.max(9, Math.round(N.chu * s)));
  const ex = view?.ex || 0, vx = view?.x || 0;
  if (ex > 4 && z < 1.05) {   // còn phần thế giới nằm ngoài màn: mũi tên nhấp nháy ở mép; vuốt ngang hoặc chạm mũi tên để xem (src/ui/world-map.js)
    const k = Math.max(6, Math.round(h * 0.013)), y = h / 2, al = 0.5 + 0.3 * Math.sin(t * 3.2);
    for (const [co, x, d] of [[vx < ex - 4, 9, -1], [vx > -ex + 4, w - 9, 1]]) {
      if (!co) continue;
      ctx.save(); ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(x - d * k, y - k * 1.3); ctx.lineTo(x + d * k * 0.6, y); ctx.lineTo(x - d * k, y + k * 1.3); ctx.closePath();
      ctx.fillStyle = '#ffe9a8'; ctx.strokeStyle = 'rgba(14,8,24,.95)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fill(); ctx.restore();
    }
  }
  return out;
}
