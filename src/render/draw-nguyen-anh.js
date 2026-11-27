// Vẽ Nguyên Anh (src/game/nguyen-anh.js, lễ Kết Anh src/game/le-anh.js; chủ dự án 27/11/2026: "bản thân như nào nguyên anh như vậy, chỉ khác là màu
// vàng"). Nguyên Anh vẽ bằng ĐÚNG hàm vẽ nhân vật của game (drawHero, vũ khí drawOtherWeapon) theo hồ sơ ngoại hình của chủ nên mặc gì, cầm gì là y
// như vậy; vẽ vào một tấm nháp riêng rồi phủ vàng (source-atop, giữ nét, giữ dáng) và dán lên màn, thêm một lượt cộng sáng cho phát quang.
// Tấm nháp tạo một lần, chỉ to lên khi cần; máy đã tự hạ mức (src/core/perf.js) thì bỏ lượt cộng sáng và bớt hạt. Lớp trên cùng (src/render/draw.js).
import { drawHero, heroLook } from './draw-hero.js';
import { drawOtherWeapon } from './draw-flyweapon.js';
import { naPha } from '../game/nguyen-anh.js';

const TAU = Math.PI * 2;
const kep = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = k => 1 - (1 - k) * (1 - k);
const yeu = () => +(globalThis.document?.body?.dataset?.perf || 0) >= 3;

const tam = [null, null];   // hai tấm nháp: [0] vẽ nhân vật như thường, [1] bản đổi sang vàng
function nhap(i, w, h) {
  let c = tam[i];
  if (!c) { c = tam[i] = globalThis.document?.createElement?.('canvas') || null; if (!c) return null; c.width = 2; c.height = 2; }
  if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
  return c;
}

function quang(ctx, x, y, r, mau, al) {
  if (al <= 0.01 || r <= 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, mau); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
}

// Một bản vàng của nhân vật e (hồ sơ h) cao s lần, đậm a, cộng sáng thêm sang. Trả false khi hình nhân vật chưa tải (khỏi vẽ gì).
// Đổi sang vàng bằng kiểu hoà màu 'color': giữ độ sáng tối của từng điểm ảnh (nét viền, nếp áo, tóc), chỉ thay sắc thành vàng, nên nhìn ra đúng là mình
// bằng vàng (bản đầu phủ vàng đặc nên thành một khối vàng mất nét). Máy không có kiểu hoà màu này thì phủ vàng nhạt (source-atop) như cũ.
export function veVang(ctx, game, e, h, t, a = 1, s = 1, sang = 0) {
  const C = game.data['nguyen-anh'] || {}, M = C.mau || {}, m = ctx.getTransform();
  const sx = Math.hypot(m.a, m.b) || 1, sy = Math.hypot(m.c, m.d) || 1, W = 130 * s, H = 104 * s, x0 = e.x - W / 2, y0 = e.y - H + 22 * s;
  const ox = Math.floor(m.a * x0 + m.c * y0 + m.e), oy = Math.floor(m.b * x0 + m.d * y0 + m.f), pw = Math.ceil(W * sx) + 2, ph = Math.ceil(H * sy) + 2;
  if (!(pw > 2 && ph > 2) || pw > 2400 || ph > 2400 || !Number.isFinite(ox + oy)) return false;
  const c = nhap(0, pw, ph), g = c?.getContext('2d'), v = nhap(1, pw, ph), gv = v?.getContext('2d');
  if (!g || !gv) return false;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, pw, ph);
  g.setTransform(m.a, m.b, m.c, m.d, m.e - ox, m.f - oy);
  if (s !== 1) { g.translate(e.x, e.y); g.scale(s, s); g.translate(-e.x, -e.y); }
  drawOtherWeapon(g, game, e, t, false, h);
  const co = drawHero(g, game, e, t, false, h);
  drawOtherWeapon(g, game, e, t, true, h);
  if (!co) return false;
  g.setTransform(1, 0, 0, 1, 0, 0);
  gv.setTransform(1, 0, 0, 1, 0, 0); gv.globalAlpha = 1; gv.globalCompositeOperation = 'copy'; gv.drawImage(c, 0, 0, pw, ph, 0, 0, pw, ph);
  gv.globalCompositeOperation = 'color';
  const hoa = gv.globalCompositeOperation === 'color';   // máy nhận kiểu hoà màu này
  gv.globalCompositeOperation = hoa ? 'color' : 'source-atop'; gv.globalAlpha = hoa ? 1 : C.phu ?? 0.72;
  gv.fillStyle = M.giua || '#ffcd45'; gv.fillRect(0, 0, pw, ph);   // sắc vàng, giữ sáng tối
  gv.globalAlpha = C.phu ?? 0.72; gv.globalCompositeOperation = hoa ? 'soft-light' : 'source-atop';
  const gr = gv.createLinearGradient(0, 0, 0, ph);
  gr.addColorStop(0, M.sang || '#fff6cf'); gr.addColorStop(0.6, M.giua || '#ffcd45'); gr.addColorStop(1, M.toi || '#b8740e');
  gv.fillStyle = gr; gv.fillRect(0, 0, pw, ph);   // sáng dần lên đầu như ánh từ trên rọi xuống
  gv.globalAlpha = 1; gv.globalCompositeOperation = 'destination-in'; gv.drawImage(c, 0, 0, pw, ph, 0, 0, pw, ph);   // chỉ giữ đúng chỗ có hình
  gv.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = a; ctx.drawImage(v, 0, 0, pw, ph, ox, oy, pw, ph);
  if (sang > 0.01) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * sang; ctx.drawImage(v, 0, 0, pw, ph, ox, oy, pw, ph); }
  ctx.restore();
  return true;
}

// Hạt vàng bốc lên quanh thân (không giữ trạng thái: tính theo đồng hồ)
function hat(ctx, x, y, top, t, seed, a, n, mau) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.55 + i / n + seed) % 1, px = x + Math.sin(i * 7.3 + seed * 3) * (6 + (i % 3) * 3), py = y - 2 - ph * (top + 8);
    ctx.globalAlpha = a * Math.sin(ph * Math.PI) * 0.9; ctx.fillStyle = i % 3 ? mau : '#ffffff';
    ctx.fillRect(Math.round(px), Math.round(py), i % 4 ? 1 : 2, i % 4 ? 1 : 2);
  }
  ctx.restore();
}

function vet(ctx, x1, y1, x2, y2, w, mau, al) {
  if (al <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  ctx.globalAlpha = al * 0.55; ctx.strokeStyle = mau; ctx.lineWidth = w * 1.8; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.globalAlpha = al; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(0.6, w * 0.45); ctx.stroke();
  ctx.restore();
}

// Nhát chém vàng ở chỗ con quái (vệt lưỡi liềm quét qua, lõi trắng, vài tia lửa)
function veChem(ctx, c, mau) {
  const k = kep(c.t / c.life), e = ease(kep(c.t / (c.life * 0.55))), R = 11 + 5 * k, a0 = c.a + c.lech * 0.5 - 1.15, a1 = a0 + 2.3 * e;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const [w, m, al] of [[5, mau, 0.6], [2.2, mau, 0.95], [0.9, '#ffffff', 0.95]]) {
    ctx.globalAlpha = al * (1 - k); ctx.strokeStyle = m; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(c.x, c.y, R, a0, a1); ctx.stroke();
  }
  ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) { const g = c.a + (i - 1.5) * 0.5, d = 6 + 14 * k; ctx.fillRect(Math.round(c.x + Math.cos(g) * d), Math.round(c.y + Math.sin(g) * d), 1, 1); }
  ctx.restore();
}

const mauPham = (game, i) => game.data['the-chat']?.pham?.[i]?.mau || null;   // phẩm Nguyên Anh: cùng bảng màu với thể chất

function veMot(ctx, game, n, t, C) {
  const h = n.mine ? game.hoSo : n.on, M = C.mau || {}, mp = mauPham(game, n.pham ?? 2) || M.quang || '#ffd27a';
  if (!h) return;
  if (n.swingNew) { const L = heroLook(game, h).attacks || []; if (L.length) n.heroAnim = { name: L[n.atkN++ % L.length], t0: game.time }; n.swingNew = false; }   // động tác đánh kế tiếp, như người khác (draw-nguoi.js)
  const { ra, ve } = naPha(n), k = Math.min(ra, ve), s = (C.co ?? 1) * (0.4 + 0.6 * ease(k)), a = 0.35 + 0.6 * k;
  const lift = (C.bay ?? 7) * k + Math.sin(t * 3 + n.seed) * 1.5, top = (n.top || 26) * s, o = n.on;
  if (k < 1 && o) vet(ctx, o.x, o.y - 10, n.x, n.y - lift - top * 0.45, 1.6, M.quang || '#ffd27a', 0.7 * (1 - k));   // vệt sáng nối đan điền chủ với Nguyên Anh lúc rời thân / bay về
  quang(ctx, n.x, n.y - lift - top * 0.45, top * 0.95, M.quang || '#ffd27a', 0.3 * a);
  quang(ctx, n.x, n.y - lift - top * 0.45, top * (0.75 + 0.06 * (n.pham ?? 2)), mp, (0.14 + 0.04 * (n.pham ?? 2)) * a);   // quầng màu phẩm: phẩm càng cao càng rộng, càng đậm
  const y = n.y; n.y = y - lift;
  veVang(ctx, game, n, h, t, a, s, yeu() ? 0 : (C.sang ?? 0.3) + 0.08 * Math.sin(t * 5 + n.seed));
  n.y = y;
  hat(ctx, n.x, n.y - lift, top, t, n.seed, a, yeu() ? 4 : 7 + (n.pham ?? 2), mp);
  for (const c of n.chem) veChem(ctx, c, M.chem || '#ffe08a');
}

// Lễ Kết Anh (src/game/le-anh.js): tụ → nứt → bùng, Nguyên Anh bay ra → lơ lửng → hạ về đan điền
function veLe(ctx, game, l, t, C) {
  const o = l.on, h = l.mine ? game.hoSo : o, M = C.mau || {}, T = l.t, top = o.top || 26, cx = o.x, cy = o.y - top * 0.4;
  if (!h) return;
  const vang = M.giua || '#ffcd45', sang = mauPham(game, l.pham ?? 2) || M.sang || '#fff6cf';   // tia sáng sau lưng Nguyên Anh: màu phẩm
  if (T < 2.1) {   // kim đan ở đan điền sáng dần, linh khí xoáy vào, ba vòng co về
    const k = kep(T / 1.6);
    quang(ctx, cx, cy, 5 + 14 * k, vang, 0.35 + 0.5 * k);
    quang(ctx, cx, cy, 2 + 4 * k, '#ffffff', 0.5 + 0.5 * k);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.4;
    for (let j = 0; j < 3; j++) { const r = (1 - ((k * 1.6 + j / 3) % 1)) * 42; ctx.globalAlpha = 0.6 * (1 - r / 42); ctx.strokeStyle = vang; ctx.beginPath(); ctx.ellipse(cx, cy + 4, r, r * 0.45, 0, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < 14; i++) { const ph = (k * 2.2 + i / 14) % 1, g = l.seed + i * 2.4 + k * 3, d = (1 - ph) * 40; ctx.globalAlpha = 0.9 * ph; ctx.fillStyle = i % 2 ? vang : '#ffffff'; ctx.fillRect(Math.round(cx + Math.cos(g) * d), Math.round(cy + Math.sin(g) * d * 0.6), 2, 2); }
    ctx.restore();
  }
  if (T >= 1.6 && T < 2.6) {   // kim đan nứt: tám vệt sáng gấp khúc toả ra
    const k = ease(kep((T - 1.6) / 0.5)), tat = 1 - kep((T - 2.2) / 0.4);
    for (let i = 0; i < 8; i++) {
      const g = l.seed + i * TAU / 8, L = (14 + (i % 3) * 6) * k;
      const m1 = { x: cx + Math.cos(g) * L * 0.5 + Math.sin(i * 5.1) * 2, y: cy + Math.sin(g) * L * 0.5 * 0.8 };
      vet(ctx, cx, cy, m1.x, m1.y, 1.4, vang, 0.9 * tat); vet(ctx, m1.x, m1.y, cx + Math.cos(g + 0.2) * L, cy + Math.sin(g + 0.2) * L * 0.8, 1.1, vang, 0.8 * tat);
    }
  }
  if (T >= 2.1 && T < 2.9) {   // bùng sáng: loé trắng, vòng sóng vàng
    const k = kep((T - 2.1) / 0.8);
    quang(ctx, cx, cy, 30 + 30 * k, '#ffffff', 0.7 * kep(1 - (T - 2.1) / 0.18));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.8 * (1 - k); ctx.strokeStyle = vang; ctx.lineWidth = 3 * (1 - k) + 0.5;
    ctx.beginPath(); ctx.ellipse(cx, cy + 6, 8 + 70 * ease(k), (8 + 70 * ease(k)) * 0.45, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
  if (T >= 2.1) {   // Nguyên Anh: bay ra khỏi thân → lơ lửng trên đầu → hạ về
    const up = ease(kep((T - 2.1) / 0.5)), xuong = ease(kep((T - 4.4) / 1.0)), cao = (top + 8) * up * (1 - xuong) + Math.sin(t * 3 + l.seed) * 1.2 * up;
    const s = (C.co ?? 1) * (0.45 + 0.55 * up) * (1 - 0.55 * xuong), a = Math.min(1, up * 1.4) * (1 - xuong);
    const e = (l.e ??= { na: true, face: { x: 1, y: 0 }, swingT: 0, moving: false, walkT: 0, heroAnim: null, atkN: 0 });
    e.x = o.x; e.y = o.y - cao; e.lookX = o.lookX || 1; e.face = { x: e.lookX, y: 0 };
    if (T < 4.6) {   // sau lưng Nguyên Anh: tia sáng xoay
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 10; i++) { const g = t * 0.6 + i * TAU / 10, L = (22 + 8 * Math.sin(t * 2 + i)) * up; ctx.globalAlpha = 0.22 * a; ctx.strokeStyle = sang; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(e.x, e.y - top * 0.5 * s); ctx.lineTo(e.x + Math.cos(g) * L, e.y - top * 0.5 * s + Math.sin(g) * L); ctx.stroke(); }
      ctx.restore();
    }
    quang(ctx, e.x, e.y - top * 0.5 * s, top * 1.1 * s, M.quang || '#ffd27a', 0.45 * a);
    if (a > 0.02) veVang(ctx, game, e, h, t, a, s, yeu() ? 0 : 0.4);
    hat(ctx, e.x, e.y, top * s, t, l.seed, a, yeu() ? 5 : 12, vang);
    if (T > 5.0) quang(ctx, cx, cy, 10, '#ffffff', 0.8 * (1 - kep((T - 5.0) / 0.4)));   // về tới đan điền: chớp nhỏ
  }
}

// Thân hủy, Nguyên Anh còn (src/game/anh-the.js): người đang là Nguyên Anh vẽ thành chính họ bằng vàng, trong suốt, lơ lửng, hạt vàng bốc lên.
// Gọi từ hàm vẽ nhân vật dùng chung (draw-nguoi.js) khi hồ sơ báo st 'anh', nên mình và người khác cùng thấy.
export function veAnhThe(ctx, game, e, h, t) {
  const C = game.data['nguyen-anh'] || {}, M = C.mau || {}, A = C.anh || {}, top = e.top || 26, lift = 5 + Math.sin(t * 3) * 1.6, nhap = 0.5 + 0.5 * Math.sin(t * 5);
  const cu = e.na, y = e.y;
  quang(ctx, e.x, y - lift - top * 0.45, top * 1.05, M.quang || '#ffd27a', 0.22 + 0.06 * nhap);
  e.na = true; e.y = y - lift;   // na: không bóng đổ, không pháp tượng (draw-hero.js)
  veVang(ctx, game, e, h, t, (A.do_trong ?? 0.5) + 0.08 * nhap, 1, yeu() ? 0 : 0.2);
  e.y = y; e.na = cu;
  hat(ctx, e.x, y - lift, top, t, (e.x % 7) * 0.1, 0.9, yeu() ? 4 : 10, M.giua || '#ffcd45');
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(e.x, y + 1, 6, 2, 0, 0, TAU); ctx.fill(); ctx.restore();   // bóng mờ nhỏ: cho biết chỗ đứng
}

// Thân vỡ (hoa): mảnh vàng văng ra, vòng sáng; thân dựng lại (tao): ánh vàng tụ vào, loé
function veFx(ctx, game, f, C) {
  const o = f.on, M = C.mau || {}, mp = mauPham(game, f.pham) || M.quang || '#ffd27a', k = kep(f.t / f.life), top = o.top || 26, cx = o.x, cy = o.y - top * 0.45;
  if (f.kieu === 'hoa') {
    quang(ctx, cx, cy, 16 + 30 * ease(k), '#ffffff', 0.7 * (1 - k));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) {
      const g = f.seed + i * TAU / 16, d = (6 + (i % 4) * 5) * ease(k) * 2.2, x = cx + Math.cos(g) * d, y = cy + Math.sin(g) * d * 0.8 + 16 * k * k;
      ctx.globalAlpha = 1 - k; ctx.fillStyle = i % 3 ? M.giua || '#ffcd45' : '#ffffff'; ctx.fillRect(Math.round(x), Math.round(y), i % 2 ? 2 : 3, i % 2 ? 2 : 3);
    }
    ctx.globalAlpha = 0.8 * (1 - k); ctx.strokeStyle = mp; ctx.lineWidth = 2.5 * (1 - k) + 0.5;
    ctx.beginPath(); ctx.ellipse(cx, o.y + 2, 8 + 46 * ease(k), (8 + 46 * ease(k)) * 0.45, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  } else {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const g = f.seed + i * TAU / 14 + k * 2, d = (1 - ease(k)) * 34; ctx.globalAlpha = 0.9 * k; ctx.fillStyle = i % 2 ? M.giua || '#ffcd45' : '#ffffff'; ctx.fillRect(Math.round(cx + Math.cos(g) * d), Math.round(cy + Math.sin(g) * d * 0.7), 2, 2); }
    ctx.restore();
    quang(ctx, cx, cy, 10 + 18 * k, mp, 0.5 * k);
    if (k > 0.75) quang(ctx, cx, cy, 30, '#ffffff', 0.8 * (1 - (k - 0.75) / 0.25));
  }
}

export function drawNguyenAnh(ctx, game, t = 0) {
  const C = game.data?.['nguyen-anh'];
  if (!C?.on) return;
  for (const f of game.naFx || []) if (Number.isFinite(f.on?.x + f.on?.y)) veFx(ctx, game, f, C);
  for (const l of game.naLe || []) if (Number.isFinite(l.on?.x + l.on?.y)) veLe(ctx, game, l, t, C);
  for (const n of game.naDs || []) if (Number.isFinite(n.x + n.y)) veMot(ctx, game, n, t, C);
}
