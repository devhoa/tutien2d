// Kết giới linh khí bọc tinh hệ và ma tộc công kích rìa (chủ dự án 19/11/2026 02:42–02:52), vẽ ở độ phân giải thật sau nền ma giới:
// mây ma khí, tinh thể ma khí (SpriteCook) ngoài kết giới; vòng kết giới tv.vong (khung 1 là bản sáng) như pháp trận hộ tông: bình
// thường mờ, bị đánh thì sáng lên, đánh dồn càng sáng, rồi mờ nhanh; 8 trụ kiếm; chớp vết nứt và loạt sét đánh vào rìa vào lúc ngẫu nhiên.
// Số ở data/starmap.json → tv. Bản xem trước: tools/art/tinh_vuc_ban_do.py.
import { spriteImage } from './sprites.js';
import { trenVien } from './tv-vien.js';

const TAU = Math.PI * 2;
const hits = [];   // { t, g, kind: 'chop' | 'set', seed }
let nextChop = 0, nextSet = 0;
const rand = (a, b) => a + Math.random() * (b - a);

function sheet(art, id) { const s = art[id]; return s && { s, im: spriteImage(s) }; }
function put(ctx, sp, x, y, k, f = 0, flip = false) {
  if (!sp?.im) return;
  const { s, im } = sp, w = s.w * k, h = s.h * k;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(im, f * s.w, 0, s.w, s.h, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
  ctx.restore();
}
const on = trenVien;   // điểm trên viền kết giới theo góc (elip, hoặc viên thuốc khi v.L)

// Góc trên rìa: phần lớn phía phải (ma khí dày), còn lại phía trái
const goc = D => Math.random() < D.right ? rand(-1.1, 1.1) : rand(Math.PI - 0.9, Math.PI + 0.9);

function lenLich(T, t) {
  const D = T.danh;
  if (!nextChop) { nextChop = t + rand(0.5, D.chop[1]); nextSet = t + rand(1, D.set[1]); }
  if (t >= nextChop) { hits.push({ t, g: goc(D), kind: 'chop' }); nextChop = t + rand(...D.chop); }
  if (t >= nextSet) {
    const g0 = goc(D), n = Math.floor(rand(D.set_n[0], D.set_n[1] + 1));
    for (let i = 0; i < n; i++) hits.push({ t: t + rand(0, 0.5), g: g0 + rand(-0.25, 0.25), kind: 'set', seed: Math.random() * 1e9 });
    nextSet = t + rand(...D.set);
  }
  while (hits.length && t - hits[0].t > 4) hits.shift();
}

// Mây, tinh thể ngoài kết giới: đặt theo góc và hệ số bán kính (tv.may: [góc, ×bán kính, cỡ, hình]); trôi chậm
export function drawNgoai(ctx, art, T, v, t) {
  const k0 = v.rx / 756;   // cỡ theo bản xem trước (kết giới rộng 756 điểm)
  T.may.forEach(([g, kr, c, id], i) => {
    const [x, y] = on(v, g, 0), dx = (x - v.cx) * (kr - 1), dy = (y - v.cy) * (kr - 1);
    put(ctx, sheet(art, 'tv.' + id), x + dx + 10 * k0 * Math.sin(t * 0.25 + i), y + dy + 4 * k0 * Math.sin(t * 0.2 + i * 2), c * k0, 0, Math.cos(g) < 0);
  });
  T.tinh_the.forEach(([g, kr, c], i) => {
    const [x, y] = on(v, g, 0);
    put(ctx, sheet(art, 'tv.tinh-the'), v.cx + (x - v.cx) * kr, v.cy + (y - v.cy) * kr + 6 * k0 * Math.sin(t * 0.3 + i), c * k0 * 1.3);
  });
}

// Tia sét gấp khúc từ ma khí đánh vào điểm góc g trên kết giới; f: tuổi tính bằng khung 12/giây; P: cỡ điểm ảnh
function set(ctx, v, h, f, P) {
  let s = h.seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const [tx, ty] = on(v, h.g), dai = v.rx * (0.2 + r() * 0.25), ga = h.g + (r() - 0.5);
  const pts = [[tx + Math.cos(ga) * dai, ty + Math.sin(ga) * dai * 0.8]];
  for (let j = 1; j < 7; j++) {
    const u = j / 7, j0 = v.rx * 0.035 * (1 - u * 0.6);
    pts.push([pts[0][0] + (tx - pts[0][0]) * u + (r() - 0.5) * 2 * j0, pts[0][1] + (ty - pts[0][1]) * u + (r() - 0.5) * 2 * j0]);
  }
  pts.push([tx, ty]);
  const lop = f < 1 ? [['#9632dc', 6], ['#e66eff', 3], ['#fff0ff', 1.4]] : f < 2 ? [['#9632dc', 4], ['#f08cff', 2]] : f < 3 ? [['#7828be', 2], ['#c864f0', 1]] : [['#5a1e8c', 1]];
  ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
  for (const [c, w] of lop) {
    ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, w * P);
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(Math.round(x / P) * P, Math.round(y / P) * P) : ctx.moveTo(Math.round(x / P) * P, Math.round(y / P) * P)); ctx.stroke();
  }
}

// Kết giới, trụ kiếm, đòn công kích. Trả về độ sáng hiện tại (0..1+) để chỗ khác dùng nếu cần
export function drawKetGioi(ctx, art, T, v, t, P, truK = 0.75) {
  lenLich(T, t);
  const D = T.danh, V = T.vong;
  let E = 0;
  for (const h of hits) if (t >= h.t) E += (h.kind === 'chop' ? D.chop_e : D.set_e) * Math.exp(-(t - h.t) / D.fade);
  const vg = sheet(art, V.sprite);
  if (vg?.im) {   // ảnh vòng đặt cho đường giữa dải sét trùng elip kết giới
    const sx = v.rx / V.rx, sy = v.ry / V.ry, x0 = v.cx - V.cx * sx, y0 = v.cy - V.cy * sy, { s, im } = vg, L = v.L || 0;
    // Viên thuốc (hai hệ): nửa trái, nửa phải của ảnh vòng đặt ở hai đầu, giữa lát một khúc ngắn quanh đỉnh / đáy vòng (soi gương xen kẽ cho liền mạch)
    const ve = fx => {
      if (!L) { ctx.drawImage(im, fx, 0, s.w, s.h, x0, y0, s.w * sx, s.h * sy); return; }
      ctx.drawImage(im, fx, 0, V.cx, s.h, x0 - L, y0, V.cx * sx, s.h * sy);
      ctx.drawImage(im, fx + V.cx, 0, s.w - V.cx, s.h, v.cx + L, y0, (s.w - V.cx) * sx, s.h * sy);
      const m = 96, n = 2 * Math.ceil(L / (m * sx)), wd = 2 * L / n;
      for (let i = 0; i < n; i++) {
        const xd = v.cx - L + i * wd;
        if (xd + wd < v.x0 || xd > v.x1) continue;   // ngoài màn
        if (i % 2) { ctx.save(); ctx.translate(Math.round(xd + wd), 0); ctx.scale(-1, 1); ctx.drawImage(im, fx + V.cx, 0, m, s.h, 0, y0, Math.ceil(wd) + 1, s.h * sy); ctx.restore(); }
        else ctx.drawImage(im, fx + V.cx, 0, m, s.h, Math.round(xd), y0, Math.ceil(wd) + 1, s.h * sy);
      }
    };
    ctx.globalAlpha = Math.min(1, 0.4 + 0.3 * Math.min(1, E) + 0.04 * Math.sin(t * 0.8));
    ve(0);
    if (E > 0.04) { ctx.globalAlpha = Math.min(1, E * 0.8); ve(s.w); }
    ctx.globalAlpha = 1;
  }
  const tru = sheet(art, 'tv.tru'), kt = v.rx / 756;
  for (let i = 0, n = v.tru || T.tru; i < n; i++) { const [x, y] = on(v, i * TAU / n); put(ctx, tru, x, y - 6 * kt + 3 * kt * Math.sin(t * 0.6 + i), kt * truK); }
  const nut = sheet(art, 'tv.nut');
  for (const h of hits) {
    const f = (t - h.t) * 12;
    if (f < 0) continue;
    if (h.kind === 'chop' && f < 5) { const [x, y] = on(v, h.g); ctx.globalAlpha = [1, 1, 0.8, 0.55, 0.3][Math.floor(f)]; put(ctx, nut, x, y, kt * [1.25, 1.05, 0.85, 0.7, 0.55][Math.floor(f)]); ctx.globalAlpha = 1; }
    if (h.kind === 'set' && f < 4) { set(ctx, v, h, f, P); if (f < 2) { const [x, y] = on(v, h.g); ctx.globalAlpha = 0.9; put(ctx, nut, x, y, kt * (0.45 - 0.1 * Math.floor(f))); ctx.globalAlpha = 1; } }
  }
  return E;
}
