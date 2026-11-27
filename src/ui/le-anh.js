// Màn thức tỉnh phẩm Nguyên Anh, sau kiếp Kết Anh (chủ dự án 27/11/2026 01:28: "cái thức tỉnh phẩm kết anh sau độ kiếp hiệu ứng phải đỉnh hơn cả thể
// phách và huyết mạch, âm thanh cũng thế"). src/game/le-anh.js gọi game.leAnhUI({ ph, ten, mau, loi }) sau khi cờ na-thuc đã ghi vào bản lưu.
// Trình tự (nhịp ở data/nguyen-anh.json → le.man): màn tối hẳn, kim đan giữa màn đập như tim, nhanh dần, linh khí xoáy vào → kim đan rạn từng vết,
// ánh màu phẩm rỉ qua vết nứt → hít vào (đan co lại) → VỠ: loé trắng cả màn, ba vòng sóng, mảnh vàng văng, màn rung → một Nguyên Anh y hệt mình
// bằng vàng (đúng hàm vẽ nhân vật, src/render/draw-nguyen-anh.js veVang) mọc lên trên đài sen sáng, sau lưng vầng tia màu phẩm xoay hai lớp, vòng
// phù văn chữ cổ xoay, hạt vàng bốc lên, cánh sáng rơi → ấn 元嬰 đóng xuống, tên phẩm hiện từng chữ, lời Hệ Thống về thể phách và Nguyên Anh,
// từng dòng công dụng. Phẩm càng cao: càng nhiều tia, mảnh, vòng phù văn, cánh rơi (ai cũng một màn như nhau, chỉ khác màu và độ dày).
// Chạm trước lúc vỡ: chạy nhanh tới lúc vỡ (không bỏ kết quả). Game đứng yên lúc lễ (game.uiOpen); Tự hành / Tự đánh thì tự nhận sau ít giây.
// Kiểu: le-anh.css. Máy đã tự hạ mức (src/core/perf.js): nửa số hạt, bỏ lượt cộng sáng.
import { goc } from '../core/build.js';
import { NA, naBac, naK } from '../game/nguyen-anh.js';
import { veVang } from '../render/draw-nguyen-anh.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const TAU = Math.PI * 2, kep = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = k => 1 - (1 - k) ** 3, R = Math.random;
const yeu = () => +(document.body?.dataset?.perf || 0) >= 3;
const thay = (s, o) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

function quang(x, cx, cy, r, mau, al) {
  if (al <= 0.01 || r <= 0.5) return;
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, mau); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalAlpha = al; x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
}

// Lớp sáng + Nguyên Anh vàng. S: { t: đồng hồ lễ, toc: hệ số chạy, ph, mau, M: bảng vàng, N: nhịp, chu: chữ phù văn, onBung(), e, h, game }
function nen(cv, S) {
  const x = cv.getContext('2d');
  if (!x) return () => {};
  let raf = 0, W = 0, H = 0, cu = performance.now(), du = 0, du2 = 0, flash = 0, bung = false;
  const hat = [], manh = [], song = [], it = yeu() ? 0.5 : 1, N = S.N, ph = S.ph, M = S.M, vang = M.giua || '#ffcd45';
  const nut = (N.nut || []).map((tc, i) => {   // vết nứt: đường gấp khúc từ mép đan ra ngoài
    const g = i * 2.39996 + 0.7, L = 20 + (i % 3) * 9, p = [[0, 0]];
    for (let j = 1; j <= 4; j++) p.push([j / 4 + (R() - 0.5) * 0.06, (R() - 0.5) * 0.22]);
    return { tc, g, L, p };
  });
  const co = () => { const r = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * r); cv.height = Math.round(H * r); x.setTransform(r, 0, 0, r, 0, 0); };
  const vanhChu = (cx, cy, r, q, al, size) => {   // vòng phù văn: chữ cổ xếp vòng, xoay
    const c = S.chu, n = c.length;
    x.globalAlpha = al; x.fillStyle = vang; x.font = `${size}px "Noto Serif CJK TC", "Songti TC", "PMingLiU", serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let i = 0; i < n; i++) { const a = q + i / n * TAU; x.save(); x.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.42); x.rotate(a + Math.PI / 2); x.scale(1, 0.75); x.fillText(c[i], 0, 0); x.restore(); }
    x.strokeStyle = S.mau; x.lineWidth = 1; x.globalAlpha = al * 0.7;
    x.beginPath(); x.ellipse(cx, cy, r - size * 0.8, (r - size * 0.8) * 0.42, 0, 0, TAU); x.stroke();
    x.beginPath(); x.ellipse(cx, cy, r + size * 0.8, (r + size * 0.8) * 0.42, 0, 0, TAU); x.stroke();
  };
  const sen = (cx, cy, k, t) => {   // đài sen sáng dưới chân: hai lớp cánh nở dần
    for (const [n, dai, rong, nghieng, al] of [[9, 46, 15, 0.95, 0.42], [7, 36, 13, 0.55, 0.6]]) {
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i + 0.5) / n * Math.PI, mo = (0.35 + 0.65 * k) * nghieng, L = dai * k, ex = Math.cos(a) * L, ey = Math.sin(a * 1) * L * mo;
        const g = x.createLinearGradient(cx, cy, cx + ex, cy + ey); g.addColorStop(0, S.mau); g.addColorStop(1, '#fffbe6');
        x.globalAlpha = al * k * (0.85 + 0.15 * Math.sin(t * 2 + i)); x.fillStyle = g; x.beginPath(); x.moveTo(cx, cy);
        const nx = -Math.sin(a) * rong * k, ny = Math.cos(a) * rong * k * 0.5;
        x.quadraticCurveTo(cx + ex * 0.55 + nx, cy + ey * 0.55 + ny, cx + ex, cy + ey); x.quadraticCurveTo(cx + ex * 0.55 - nx, cy + ey * 0.55 - ny, cx, cy); x.fill();
      }
    }
    quang(x, cx, cy, 60 * k, S.mau, 0.5 * k);
  };
  const khung = now => {
    raf = requestAnimationFrame(khung);
    if (cv.clientWidth !== W || cv.clientHeight !== H) co();
    const dt0 = Math.min(0.05, (now - cu) / 1000), dt = dt0 * (bung ? 1 : S.toc), t = (S.t += dt), cx = W / 2, cy = H * (H < 760 ? N.tam_thap ?? 0.25 : N.tam ?? 0.33); cu = now;   // màn thấp (9:16): đẩy lên cho chữ bên dưới khỏi đè
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, W, H);
    x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
    const B = N.bung ?? 4.15, HIT = N.hit ?? 3.8;
    if (!bung && t >= B) {   // VỠ
      bung = true; flash = 1; S.onBung?.();
      for (let i = 0; i < (36 + 10 * ph) * it; i++) { const a = R() * TAU, v = 140 + R() * 520; manh.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, q: R() * TAU, vq: (R() - 0.5) * 14, s: 3 + R() * 5, l: 0.9 + R(), t: 0, c: R() < 0.25 ? '#ffffff' : R() < 0.5 ? S.mau : vang }); }
      for (let i = 0; i < 90 * it; i++) { const a = R() * TAU, v = 60 + R() * 380; hat.push({ k: 1, x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0.6 + R() * 1.1, t: 0, s: R() < 0.3 ? 3 : 2, c: R() < 0.4 }); }
      ['#ffffff', vang, S.mau, ...(ph >= 4 ? ['#ffffff'] : [])].forEach((c, i) => song.push({ t: -i * 0.09, c, w: 9 - i * 1.5 }));
    }
    if (!bung) {   // kim đan đập như tim, linh khí xoáy vào, rạn nứt
      const vao = kep(t / 0.8), tb = (N.tim || []).filter(v => v <= t).pop() ?? -9, p = Math.max(0, 1 - (t - tb) / 0.28), k = kep(t / HIT);
      const thu = 1 - 0.62 * ease(kep((t - HIT) / (B - HIT))), r = (17 + 8 * k) * (1 + 0.32 * p) * thu;
      for (du += (20 + 140 * k) * dt * it; du >= 1; du--) { const a = R() * TAU, rr = Math.hypot(W, H) * (0.4 + R() * 0.25); hat.push({ k: 0, a, r: rr, w: (R() < 0.5 ? 1 : -1) * (0.5 + R()), v: 80 + R() * 120, s: R() < 0.2 ? 2 : 1 }); }
      quang(x, cx, cy, r * (4.5 + 2 * p), vang, (0.3 + 0.35 * p) * vao);
      quang(x, cx, cy, r * 9, S.mau, 0.12 * k * vao);
      vanhChu(cx, cy + 30, 110 + 20 * k, t * 0.2, (0.08 + 0.3 * k) * vao * (0.7 + 0.3 * p), 13);   // vòng phù văn mờ dưới đan, sáng dần theo nhịp tim
      if (tb > 0) { const q = t - tb, rr = r + q * 190; x.globalAlpha = 0.5 * Math.max(0, 1 - q / 0.7) * vao; x.strokeStyle = S.mau; x.lineWidth = 2.5; x.beginPath(); x.arc(cx, cy, rr, 0, TAU); x.stroke(); }
      for (const c of nut) {   // ánh màu phẩm rỉ qua vết nứt thành tia dài
        if (t < c.tc) continue;
        const g = ease(kep((t - c.tc) / 0.2)), L = c.L * g, dx = Math.cos(c.g), dy = Math.sin(c.g), nx = -dy, ny = dx, ray = (60 + 200 * k) * g;
        const lg = x.createLinearGradient(cx, cy, cx + dx * ray, cy + dy * ray); lg.addColorStop(0, '#fff6d8'); lg.addColorStop(0.3, S.mau); lg.addColorStop(1, 'rgba(0,0,0,0)');
        x.globalAlpha = 0.55 * g * vao; x.fillStyle = lg; x.beginPath(); x.moveTo(cx + nx * 3, cy + ny * 3); x.lineTo(cx + dx * ray - nx * 9, cy + dy * ray - ny * 9); x.lineTo(cx + dx * ray + nx * 9, cy + dy * ray + ny * 9); x.closePath(); x.fill();
        for (const [w, m, al] of [[4, S.mau, 0.6], [1.4, '#ffffff', 1]]) {
          x.globalAlpha = al * vao; x.strokeStyle = m; x.lineWidth = w; x.beginPath();
          c.p.forEach(([u, v], j) => { const d = r * 0.6 + u * L, px = cx + dx * d + nx * v * c.L, py = cy + dy * d + ny * v * c.L; if (j) x.lineTo(px, py); else x.moveTo(px, py); });
          x.stroke();
        }
      }
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = vao;   // thân kim đan
      const g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r); g.addColorStop(0, '#fffbe6'); g.addColorStop(0.45, vang); g.addColorStop(1, M.toi || '#b8740e');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.globalCompositeOperation = 'lighter';
      quang(x, cx, cy, r * 1.5, '#ffffff', (0.35 + 0.5 * p) * vao);
    } else {   // Nguyên Anh mọc lên trên đài sen
      const q = t - B, k = ease(kep(q / 1.7)), troi = Math.sin(t * 1.8) * 3 * k, s = (N.co ?? 3.1) * (0.3 + 0.7 * k), chan = cy + 52 * k + 12 + troi, dau = chan - 30 * s;
      const nr = (14 + 4 * ph) * (yeu() ? 0.6 : 1), L = Math.min(W * 1.1, H * 0.42) * k, oy = dau + 14 * s;
      quang(x, cx, oy, 190 * k, S.mau, 0.22 * k); quang(x, cx, oy, 120 * k, vang, 0.4 * k);
      const loang = (c0, c1) => { const g = x.createRadialGradient(cx, oy, 0, cx, oy, Math.max(1, L)); g.addColorStop(0, c0); g.addColorStop(0.3, c1); g.addColorStop(1, 'rgba(0,0,0,0)'); return g; };
      const R1 = loang('#fff6d8', S.mau), R2 = loang('#ffffff', vang);
      for (let lop = 0; lop < (ph >= 3 ? 2 : 1) + 1; lop++) for (let i = 0; i < nr; i++) {   // vầng tia xoay: màu phẩm, xen tia vàng mảnh ngược chiều (phẩm cao thêm lớp)
        const a = (lop % 2 ? -t * 0.16 : t * 0.22) + (i + lop * 0.33) / nr * TAU, w = lop ? 0.02 : 0.045, l = L * (i % 2 ? 0.7 : 1) * (lop ? 0.85 : 1);
        x.globalAlpha = (lop ? 0.4 : 0.55) * k; x.fillStyle = lop ? R2 : R1; x.beginPath(); x.moveTo(cx, oy);
        x.lineTo(cx + Math.cos(a - w) * l, oy + Math.sin(a - w) * l); x.lineTo(cx + Math.cos(a + w) * l, oy + Math.sin(a + w) * l); x.closePath(); x.fill();
      }
      const vk = ease(kep((q - 0.5) / 1.2));
      vanhChu(cx, chan - 4, 120 * vk + 20, t * 0.35, 0.75 * vk, 15);
      if (ph >= 2) vanhChu(cx, dau + 6 * s, 96 * vk + 10, -t * 0.25, 0.45 * vk, 11);
      if (ph >= 4) { x.globalAlpha = 0.35 * vk; x.strokeStyle = S.mau; x.lineWidth = 1.5; x.setLineDash([6, 7]); x.lineDashOffset = -t * 30; x.beginPath(); x.ellipse(cx, chan - 4, 170 * vk, 170 * vk * 0.42, 0, 0, TAU); x.stroke(); x.setLineDash([]); }
      sen(cx, chan + 4, ease(kep((q - 0.15) / 1.0)), t);
      x.globalCompositeOperation = 'source-over';
      const e = S.e; e.x = cx; e.y = chan;
      const ve = veVang(x, S.game, e, S.h, t, Math.min(1, k * 1.6), s, yeu() ? 0 : 0.32 + 0.14 * Math.sin(t * 3));
      x.globalCompositeOperation = 'lighter';
      if (!ve) quang(x, cx, dau + 14 * s, 30 * s, vang, 0.9 * k);   // hình nhân vật chưa tải: chỉ còn khối sáng
      for (du += (10 + 4 * ph) * dt0 * it; du >= 1; du--) hat.push({ k: 3, x: cx + (R() - 0.5) * 70 * s / 3, y: chan, vx: (R() - 0.5) * 10, vy: -(30 + R() * 60), l: 1.4 + R(), t: 0, s: R() < 0.3 ? 2 : 1, c: R() < 0.4 });   // hạt vàng bốc lên
      for (du2 += (4 + 3 * ph) * dt0 * it; du2 >= 1; du2--) hat.push({ k: 2, x: R() * W, y: -8, vx: (R() - 0.5) * 16, vy: 24 + R() * 40, l: 9, t: 0, s: 2 + (R() < 0.3), p: R() * 6, q: R() * TAU, c: false });   // cánh sáng rơi
    }
    for (const w of song) {   // vòng sóng lúc vỡ
      w.t += dt0; if (w.t < 0) continue;
      const k = kep(w.t / 0.95), rr = 10 + Math.hypot(W, H) * 0.75 * ease(k);
      x.globalAlpha = 0.85 * (1 - k); x.strokeStyle = w.c; x.lineWidth = w.w * (1 - k) + 1; x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.8, 0, 0, TAU); x.stroke();
    }
    for (let i = manh.length - 1; i >= 0; i--) {   // mảnh vỏ kim đan văng ra, xoay, rơi
      const m = manh[i]; m.t += dt0; if (m.t >= m.l) { manh.splice(i, 1); continue; }
      m.vx *= 1 - 1.6 * dt0; m.vy = m.vy * (1 - 1.6 * dt0) + 160 * dt0; m.x += m.vx * dt0; m.y += m.vy * dt0; m.q += m.vq * dt0;
      x.save(); x.translate(m.x, m.y); x.rotate(m.q); x.globalAlpha = 1 - m.t / m.l; x.fillStyle = m.c; x.beginPath(); x.moveTo(0, -m.s); x.lineTo(m.s * 0.7, m.s * 0.6); x.lineTo(-m.s * 0.8, m.s * 0.4); x.closePath(); x.fill(); x.restore();
    }
    for (let i = hat.length - 1; i >= 0; i--) {
      const q = hat[i];
      if (q.k === 0) {   // linh khí xoáy vào kim đan
        if (bung) { hat.splice(i, 1); continue; }
        const px = cx + Math.cos(q.a) * q.r, py = cy + Math.sin(q.a) * q.r * 0.85;
        q.v += (t > HIT ? 900 : 240) * dt; q.r -= q.v * dt; q.a += q.w * dt * (1 + 70 / Math.max(20, q.r));
        if (q.r < 10) { hat.splice(i, 1); continue; }
        x.globalAlpha = Math.min(1, 0.4 + 60 / q.r); x.strokeStyle = q.s > 1 ? '#fff6d8' : q.w > 0 ? vang : S.mau; x.lineWidth = q.s + 0.4; x.beginPath(); x.moveTo(px, py); x.lineTo(cx + Math.cos(q.a) * q.r, cy + Math.sin(q.a) * q.r * 0.85); x.stroke();
        continue;
      }
      q.t += dt0; if (q.t >= q.l || q.y > H + 10) { hat.splice(i, 1); continue; }
      if (q.k === 1) { q.vx *= 1 - 2.4 * dt0; q.vy = q.vy * (1 - 2.4 * dt0) + 50 * dt0; } else if (q.k === 2) { q.vx += Math.sin(t * 1.5 + q.p) * 10 * dt0; q.q += dt0 * 2; }
      q.x += q.vx * dt0; q.y += q.vy * dt0;
      x.globalAlpha = q.k === 2 ? 0.7 : (1 - q.t / q.l); x.fillStyle = q.c ? '#fff6d8' : q.k === 3 ? vang : S.mau;
      if (q.k === 2) { x.save(); x.translate(q.x, q.y); x.rotate(q.q); x.beginPath(); x.ellipse(0, 0, q.s * 1.6, q.s * 0.7, 0, 0, TAU); x.fill(); x.restore(); } else x.fillRect(q.x, q.y, q.s, q.s);
    }
    if (flash > 0) { x.globalCompositeOperation = 'source-over'; x.globalAlpha = flash; x.fillStyle = '#fffdf2'; x.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt0 * 1.7); }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  };
  co(); raf = requestAnimationFrame(khung);
  return () => cancelAnimationFrame(raf);
}

export function createLeAnhUI(game) {
  const C = NA(game.data);
  if (!C?.le?.man) return;
  const css = el('link'); css.rel = 'stylesheet'; css.href = goc('src/ui/le-anh.css'); document.head.append(css);
  const root = el('div'); root.id = 'le-anh'; root.hidden = true; document.body.append(root);
  game.leAnhUI = ({ ph = 2, ten = '', mau = '#ffcd45', loi = '' } = {}) => new Promise(xong => {
    const L = C.le.man, N = L.nhip || {}, sfx = (k, v) => { if (L.sfx?.[k]) game.sfx?.(L.sfx[k], v); }, s = game.save, B = naBac(s, game.data), A = C.anh || {};
    root.textContent = ''; root.className = ''; root.style.setProperty('--mau', mau);
    const cv = el('canvas', 'la-cv'), goi = el('div', 'la-goi', L.goi_dau), duoi = el('div', 'la-duoi');
    root.append(cv, goi, duoi);
    const wasOpen = game.uiOpen; game.uiOpen = true; root.hidden = false; sfx('u');
    const S = { t: 0, toc: 1, ph, mau, M: C.mau || {}, N, chu: [...(L.phu_van || '元嬰出竅金丹化嬰')], game, h: game.hoSo,
      e: { na: true, face: { x: 1, y: 0 }, lookX: 1, swingT: 0, moving: false, walkT: 0, heroAnim: null, atkN: 0, top: 26, x: 0, y: 0 } };
    let tm = [], het = false;
    const hen = (giay, fn) => tm.push(setTimeout(fn, giay * 1000));
    const nhip = (moc, fn) => { const lap = () => { if (root.hidden) return; if (S.t >= moc) fn(); else tm.push(setTimeout(lap, 16)); }; lap(); };   // theo đồng hồ lễ (chạm thì nhanh)
    (N.tim || []).forEach((m, i) => nhip(m, () => sfx('tim', 0.55 + 0.45 * i / Math.max(1, N.tim.length - 1))));
    (N.nut || []).forEach((m, i) => nhip(m, () => { if (i % 2 === 0) sfx('nut', 0.6 + 0.1 * i); }));
    S.onBung = () => {
      het = true; root.classList.add('vo'); sfx('bung'); goi.textContent = '';
      hen(1.9, () => { root.classList.add('ra'); goi.textContent = L.goi; ra(); });
    };
    const tat = nen(cv, S);
    const dong = (cls, text, tre) => { const d = el('div', cls, text); d.style.setProperty('--tre', `${tre.toFixed(2)}s`); duoi.append(d); return d; };
    function ra() {   // ấn 元嬰 đóng xuống, tên phẩm hiện từng chữ, công dụng
      sfx('hien');
      dong('la-an', L.an || '元嬰', 0); const tieu = dong('la-ten', '', 0.55), chu = thay(L.ten, { pham: ten });
      [...chu].forEach((c, i) => { const sp = el('span', '', c); sp.style.setProperty('--i', i); tieu.append(sp); });
      const d0 = 0.75 + chu.length * 0.045, dd = L.dong_s ?? 0.45;
      if (loi) dong('la-loi', loi, d0);
      const vals = { ra: B.ra_s, k: Math.round(naK(s, game.data) * 100), hoi: B.hoi, phut: Math.round((A.hoi_s ?? 300) / 60), giu: A.giu_s ?? 30 };
      (L.dong || []).forEach((txt, j) => { const at = d0 + 0.35 + j * dd, d = dong('la-so', '', at); const [a, b] = thay(txt, vals).split('|'); d.append(el('b', '', a), el('span', '', b || '')); hen(at, () => { if (!root.hidden) sfx('dong', 0.8); }); });
      const sau = d0 + 0.35 + (L.dong || []).length * dd;
      dong('la-mot', L.mot_luot, sau + 0.1);
      const nut = el('button', 'la-nut', L.nhan); nut.style.setProperty('--tre', `${(sau + 0.4).toFixed(2)}s`); duoi.append(nut);
      const dong_lai = () => { if (root.hidden) return; tm.forEach(clearTimeout); tm = []; tat(); root.hidden = true; game.uiOpen = wasOpen; sfx('nhan'); xong(); };
      nut.onclick = e => { e.stopPropagation(); dong_lai(); };
      const tu = () => { if (root.hidden) return; if (game.pilot || game.auto) dong_lai(); else tm.push(setTimeout(tu, 500)); };   // Tự hành / Tự đánh: không giữ chân
      hen(sau + 0.4 + (L.tu_dong_s ?? 2.5), tu);
    }
    root.onclick = () => { if (!het) S.toc = 5; };
  });
}
