// Vẽ hiệu ứng riêng của ba kỹ năng đầu game (trạng thái ở src/game/kn-fx.js; chủ dự án 26/11/2026 16:22: "nhìn không đẹp và nhỏ, không đủ
// lực"). Vẽ bằng code ở lớp trên cùng, cộng sáng như Thân pháp: đạn của kỹ năng (lưỡi kiếm khí, lưỡi lửa, mũi băng, lưỡi kim quang), màn tung
// chiêu, màn trúng, hạt sáng. File này không nhập module nào của trình duyệt để bài thử Node (tools/kn-fx.test.mjs) chạy được từng hàm vẽ.
import { knVe } from '../game/kn-fx.js';

const TAU = Math.PI * 2, SANG = '#ffffff';
const kep = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = k => 1 - (1 - k) * (1 - k);
const nay = k => (k < 1 ? 1 + 0.28 * Math.sin(k * Math.PI) - (1 - k) * (1 - k) : 1);   // trồi lên có đà: vọt quá một chút rồi về
// Đường sáng: lớp màu dày + lõi trắng mảnh (cộng sáng)
function vet(ctx, x1, y1, x2, y2, w, mau, al, loi = 0.45) {
  if (al <= 0.01 || w <= 0.05) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  ctx.globalAlpha = al * 0.55; ctx.strokeStyle = mau; ctx.lineWidth = w * 1.9; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.globalAlpha = al; ctx.lineWidth = w; ctx.stroke();
  if (loi > 0) { ctx.globalAlpha = al * 0.9; ctx.strokeStyle = SANG; ctx.lineWidth = Math.max(0.6, w * loi); ctx.stroke(); }
  ctx.restore();
}
// Cung tròn dẹt (sq), có lõi trắng
function cung(ctx, x, y, r, a0, a1, w, mau, al, sq = 1, loi = 0.4) {
  if (al <= 0.01 || r <= 0.5 || w <= 0.05) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.translate(x, y); ctx.scale(1, sq);
  ctx.globalAlpha = al * 0.55; ctx.strokeStyle = mau; ctx.lineWidth = w * 1.9; ctx.beginPath(); ctx.arc(0, 0, r, a0, a1); ctx.stroke();
  ctx.globalAlpha = al; ctx.lineWidth = w; ctx.stroke();
  if (loi > 0) { ctx.globalAlpha = al * 0.9; ctx.strokeStyle = SANG; ctx.lineWidth = Math.max(0.6, w * loi); ctx.stroke(); }
  ctx.restore();
}
// Quầng tròn mềm (cộng sáng), dẹt theo sx, sy, xoay góc rot
function quang(ctx, x, y, r, mau, al, sx = 1, sy = 1, rot = 0) {
  if (al <= 0.01 || r <= 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al; ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx, sy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, mau); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.restore();
}
// Mảng nhiều cạnh quanh (x, y), xoay theo a: pts [[dọc, ngang], ...]
function mang(ctx, x, y, a, pts, mau, al, sang = true) {
  if (al <= 0.01) return;
  const c = Math.cos(a), s = Math.sin(a);
  ctx.save(); ctx.globalCompositeOperation = sang ? 'lighter' : 'source-over'; ctx.globalAlpha = al; ctx.fillStyle = mau; ctx.beginPath();
  pts.forEach(([u, v], i) => { const px = x + c * u - s * v, py = y + s * u + c * v; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.closePath(); ctx.fill(); ctx.restore();
}
// Đường đạn đã bay (src/game/vfx.js nhớ mỗi khung một chỗ), từ xa nhất tới viên đạn: [[x, y, k]], k 0 → 1
function duong(b) {
  const h = b.hist || [], n = h.length >> 1, P = [];
  for (let i = 0; i < n; i++) P.push([h[i * 2], h[i * 2 + 1], i / n]);
  P.push([b.x, b.y, 1]);
  return P;
}
// Dải sáng dọc một đường gấp khúc (từ đuôi tới đầu), một nét vẽ: tắt dần về đuôi (cộng sáng nên màu đen là không vẽ gì)
function dai(ctx, P, w, mau, al) {
  const n = P.length;
  if (n < 2 || al <= 0.01) return;
  const g = ctx.createLinearGradient(P[0][0], P[0][1], P[n - 1][0], P[n - 1][1]);
  g.addColorStop(0, '#000000'); g.addColorStop(1, mau);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = g; ctx.globalAlpha = al; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(P[i][0], P[i][1]);
  ctx.stroke(); ctx.restore();
}

// ---- đạn đang bay
const DAN = {
  'pha-van'(ctx, b, a, t) {   // lưỡi kiếm khí dài: hai vệt gió rẽ mây phía sau, quầng lam, lưỡi trắng nhọn, vành lưỡi liềm ở mũi
    const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c, mo = ease(kep((b.knT || 0) / 0.09)), P = duong(b);
    dai(ctx, P, 7, b.color, 0.3);
    for (const d of [-1, 1]) { const Q = P.map(([x, y, k]) => { const o = d * (4 + (1 - k) * 13); return [x + nx * o, y + ny * o]; }); dai(ctx, Q, 2.4, b.color, 0.75); dai(ctx, Q, 0.9, SANG, 0.7); }   // hai vệt gió rẽ ra phía sau
    quang(ctx, b.x - c * 4, b.y - s * 4, 34 * mo, b.color, 0.5, 1, 0.3, a);
    mang(ctx, b.x, b.y, a, [[30 * mo, 0], [8, -6], [-26 * mo, 0], [8, 6]], b.color, 0.6);
    mang(ctx, b.x, b.y, a, [[26 * mo, 0], [8, -2.6], [-20 * mo, 0], [8, 2.6]], SANG, 0.95);
    cung(ctx, b.x + c * 4, b.y + s * 4, 15 * mo, a - 1.05, a + 1.05, 3.2, b.color, 0.9);
    cung(ctx, b.x - c * 6, b.y - s * 6, 13 * mo, a - 0.8, a + 0.8, 1.6, b.color, 0.45, 1, 0);
    quang(ctx, b.x + c * 22 * mo, b.y + s * 22 * mo, 6 + 1.5 * Math.sin(t * 40), SANG, 0.8);
  },
  viem(ctx, b, a, t) {   // lưỡi lửa lưỡi liềm, đuôi lửa cam ngả đỏ
    const c = Math.cos(a), s = Math.sin(a), lap = 1 + 0.12 * Math.sin(t * 46), mo = ease(kep((b.knT || 0) / 0.09)), P = duong(b);
    dai(ctx, P, 9, '#e8431a', 0.5); dai(ctx, P, 4, '#ffb040', 0.6);
    for (let i = P.length - 1; i > 0; i -= 3) { const [x, y, k] = P[i]; quang(ctx, x, y - (1 - k) * 5, 3 + 8 * k, k > 0.6 ? '#ffb040' : '#e8431a', 0.5 * k); }   // lửa bốc dọc đuôi
    quang(ctx, b.x, b.y, 22 * lap, '#ff7a3a', 0.55);
    cung(ctx, b.x - c * 8, b.y - s * 8, 15 * mo * lap, a - 1.2, a + 1.2, 6.5, '#ff5a1a', 0.95, 1, 0);
    cung(ctx, b.x - c * 7, b.y - s * 7, 15 * mo, a - 1.0, a + 1.0, 3.6, '#ffc24a', 1, 1, 0.45);
    mang(ctx, b.x, b.y, a, [[12 * mo, 0], [2, -4], [-16, 0], [2, 4]], '#fff4c8', 0.85);
    quang(ctx, b.x + c * 6, b.y + s * 6, 7 * lap, SANG, 0.75);
  },
  han(ctx, b, a, t) {   // mũi băng dài sáu cạnh, kéo dải sương
    const c = Math.cos(a), s = Math.sin(a), mo = ease(kep((b.knT || 0) / 0.09)), P = duong(b);
    dai(ctx, P, 11, '#5ab8f0', 0.3); dai(ctx, P, 5, '#bfe8ff', 0.45); dai(ctx, P, 1.4, SANG, 0.6);   // dải sương lạnh
    quang(ctx, b.x, b.y, 26, b.color, 0.4, 1, 0.42, a);
    mang(ctx, b.x, b.y, a, [[22 * mo, 0], [9, -5.5], [-12, -4.2], [-18, 0], [-12, 4.2], [9, 5.5]], '#3f8fd0', 0.95, false);
    mang(ctx, b.x, b.y, a, [[20 * mo, 0], [9, -4], [-11, -3], [-15, 0], [-11, 3], [9, 4]], '#bfe8ff', 0.95, false);
    mang(ctx, b.x, b.y, a, [[20 * mo, 0], [9, -4], [-15, 0]], SANG, 0.75, false);   // mặt băng hắt sáng
    quang(ctx, b.x + c * 18 * mo, b.y + s * 18 * mo, 5 + 1.2 * Math.sin(t * 34), SANG, 0.85);
  },
  kim(ctx, b, a, t) {   // lưỡi kim quang: vệt sáng dài, lưỡi thoi vàng, tia loé ở mũi
    const c = Math.cos(a), s = Math.sin(a), mo = ease(kep((b.knT || 0) / 0.08)), P = duong(b);
    dai(ctx, P, 5, b.color, 0.5); dai(ctx, P, 2.2, '#ffd04a', 0.85); dai(ctx, P, 0.9, SANG, 0.8);
    quang(ctx, b.x, b.y, 16, b.color, 0.45, 1, 0.4, a);
    mang(ctx, b.x, b.y, a, [[17 * mo, 0], [2, -4.4], [-14, 0], [2, 4.4]], '#ffd04a', 0.85);
    mang(ctx, b.x, b.y, a, [[15 * mo, 0], [2, -1.8], [-11, 0], [2, 1.8]], SANG, 0.95);
    const lx = b.x + c * 15 * mo, ly = b.y + s * 15 * mo, L = 5 + 2 * Math.sin(t * 38 + b.x);
    vet(ctx, lx - L, ly, lx + L, ly, 1, SANG, 0.8, 0); vet(ctx, lx, ly - L, lx, ly + L, 1, SANG, 0.8, 0);
  },
};

// ---- màn tung chiêu, màn trúng (f: một mục của game.knFx.fx; k = f.t / f.life)
const VE = {
  'pv-cast'(ctx, f, k) {   // vung một vòng cung sáng, một vệt sáng phóng tới trước
    const c = Math.cos(f.a), s = Math.sin(f.a), e = ease(k);
    cung(ctx, f.x - c * 12, f.y - s * 12, 18 + 16 * e, f.a - 1.35, f.a + 1.35, 5.5 * (1 - k), f.c, 1 - k);
    vet(ctx, f.x, f.y, f.x + c * (26 + 50 * e), f.y + s * (26 + 50 * e), 4.5 * (1 - k), f.c, 1 - k);
    quang(ctx, f.x, f.y, 16 + 14 * e, f.c, 0.6 * (1 - k));
  },
  'pv-hit'(ctx, f, k) {   // vệt chém xuyên qua thân quái
    const L = 20 * ease(kep(f.t / 0.07)), c = Math.cos(f.a), s = Math.sin(f.a);
    vet(ctx, f.x - c * L, f.y - s * L, f.x + c * L, f.y + s * L, 3.6 * (1 - k), f.c, 1 - k);
    vet(ctx, f.x + s * 7, f.y - c * 7, f.x - s * 7, f.y + c * 7, 1.6 * (1 - k), SANG, 0.8 * (1 - k), 0);
    quang(ctx, f.x, f.y, 13, SANG, 0.7 * kep(1 - f.t / 0.1));
  },
  'pv-tan'(ctx, f, k) {   // hết đường: tan thành một vòng sáng
    const R = f.nho ? 12 : 22;
    cung(ctx, f.x, f.y, 4 + R * ease(k), 0, TAU, 2.4 * (1 - k), f.c, 1 - k, 1, 0);
    cung(ctx, f.x, f.y, 8 + R * 0.6 * ease(k), f.a - 1, f.a + 1, 3 * (1 - k), f.c, 0.8 * (1 - k));
  },
  'vm-cast'(ctx, f, k) {
    const c = Math.cos(f.a), s = Math.sin(f.a), e = ease(k);
    cung(ctx, f.x - c * 12, f.y - s * 12, 17 + 14 * e, f.a - 1.3, f.a + 1.3, 6 * (1 - k), '#ff5a1a', 1 - k, 1, 0.3);
    quang(ctx, f.x, f.y, 18 + 14 * e, '#ff7a3a', 0.7 * (1 - k));
  },
  'vm-no'(ctx, f, k) {   // nổ: vết cháy, quả cầu lửa, lõi trắng, cột lửa bật lên, lưỡi lửa toả, vòng sóng
    const r = f.r, e = ease(kep(f.t / 0.16)), tat = 1 - k;
    ctx.save(); ctx.globalAlpha = 0.4 * tat; ctx.fillStyle = '#1a0f0a'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 3, r * 0.95, r * 0.5, 0, 0, TAU); ctx.fill(); ctx.restore();
    quang(ctx, f.x, f.y - 3, r * (0.6 + 1.1 * e), '#ff6a1a', 0.75 * tat);
    quang(ctx, f.x, f.y - 3, r * (0.3 + 0.6 * e), '#ffd27a', 0.8 * kep(1 - f.t / 0.3));
    quang(ctx, f.x, f.y - 3, r * 0.6, SANG, 0.9 * kep(1 - f.t / 0.11));
    const cao = (26 + r * 1.3) * e;
    vet(ctx, f.x, f.y, f.x, f.y - cao, 3 + 9 * kep(1 - f.t / 0.32), '#ff7a1a', 0.85 * kep(1 - f.t / 0.36), 0.35);
    for (let i = 0; i < 8; i++) { const g = i / 8 * TAU + 0.4, r0 = r * 0.35 * e, r1 = r * (0.6 + 0.6 * e); vet(ctx, f.x + Math.cos(g) * r0, f.y - 3 + Math.sin(g) * r0 * 0.6, f.x + Math.cos(g) * r1, f.y - 3 + Math.sin(g) * r1 * 0.6 - 10 * k, 3.2 * tat, i % 2 ? '#ffb040' : '#ff5a1a', 0.85 * kep(1 - f.t / 0.3), 0.3); }
    cung(ctx, f.x, f.y + 2, 6 + (r + 14) * ease(kep(f.t / 0.3)), 0, TAU, 3 * kep(1 - f.t / 0.3), '#ffc24a', kep(1 - f.t / 0.3), 0.6);
  },
  'hn-cast'(ctx, f, k) {
    const e = ease(k);
    cung(ctx, f.x, f.y, 5 + 16 * e, 0, TAU, 2.4 * (1 - k), f.c, 1 - k, 1, 0.3);
    for (let i = 0; i < 6; i++) { const g = f.a + i / 6 * TAU; vet(ctx, f.x + Math.cos(g) * 4, f.y + Math.sin(g) * 4, f.x + Math.cos(g) * (10 + 10 * e), f.y + Math.sin(g) * (10 + 10 * e), 1.6 * (1 - k), '#bfe8ff', 1 - k, 0.5); }
    quang(ctx, f.x, f.y, 16 + 8 * e, f.c, 0.5 * (1 - k));
  },
  'hn-no'(ctx, f, k) {   // vỡ băng: mảnh băng toả ra rồi tan, vòng sương, hoa tuyết in dưới chân
    const e = ease(kep(f.t / 0.12)), tan = 1 - kep((f.t - 0.28) / 0.3);
    quang(ctx, f.x, f.y, 14 + 18 * e, f.c, 0.55 * (1 - k));
    quang(ctx, f.x, f.y, 10, SANG, 0.8 * kep(1 - f.t / 0.1));
    cung(ctx, f.x, f.y + 6, 5 + 24 * ease(kep(f.t / 0.3)), 0, TAU, 2.4 * kep(1 - f.t / 0.34), '#bfe8ff', kep(1 - f.t / 0.34), 0.6, 0.3);
    for (let i = 0; i < 3; i++) { const g = i / 3 * Math.PI + 0.26, L = 13 * e; vet(ctx, f.x - Math.cos(g) * L, f.y + 7 - Math.sin(g) * L * 0.55, f.x + Math.cos(g) * L, f.y + 7 + Math.sin(g) * L * 0.55, 1.4, '#dff4ff', 0.75 * tan, 0.5); }
    for (const M of f.manh) {
      const d0 = 3 + 9 * e, cx = f.x + Math.cos(M.a) * d0, cy = f.y + Math.sin(M.a) * d0 * 0.8;
      mang(ctx, cx, cy, M.a, [[M.dai * e, 0], [0, -M.rong], [-3, 0], [0, M.rong]], '#3f8fd0', 0.9 * tan, false);
      mang(ctx, cx, cy, M.a, [[M.dai * e - 1.5, 0], [0, -M.rong + 1], [-2, 0], [0, M.rong - 1]], '#dff4ff', 0.95 * tan, false);
    }
  },
  'km-cast'(ctx, f, k) {   // quạt kim quang: mỗi lưỡi một tia, một cung sáng nối đầu các tia
    const e = ease(k), n = f.n;
    for (let i = 0; i < n; i++) { const g = f.a + (n > 1 ? (i / (n - 1) - 0.5) * f.mo : 0); vet(ctx, f.x + Math.cos(g) * 6, f.y + Math.sin(g) * 6, f.x + Math.cos(g) * (20 + 34 * e), f.y + Math.sin(g) * (20 + 34 * e), 3.6 * (1 - k), f.c, 1 - k); }
    cung(ctx, f.x, f.y, 16 + 18 * e, f.a - f.mo / 2 - 0.35, f.a + f.mo / 2 + 0.35, 3.6 * (1 - k), f.c, 0.9 * (1 - k));
    quang(ctx, f.x + Math.cos(f.a) * 8, f.y + Math.sin(f.a) * 8, 16 + 10 * e, f.c, 0.6 * (1 - k));
  },
  'km-hit'(ctx, f, k) {   // dấu chém chéo vàng
    const L = 12 * ease(kep(f.t / 0.07));
    for (const d of [-0.75, 0.75]) { const c = Math.cos(f.a + d), s = Math.sin(f.a + d); vet(ctx, f.x - c * L, f.y - s * L, f.x + c * L, f.y + s * L, 2.8 * (1 - k), f.c, 1 - k); }
    quang(ctx, f.x, f.y, 11, SANG, 0.7 * kep(1 - f.t / 0.1));
  },
  'dg-cast'(ctx, f, k, t) {   // trận xanh hai vành xoay ngược, dây leo có gai trồi khắp vùng, đung đưa, rồi rút xuống
    const r = f.r, vao = kep(f.t / 0.12), ra = kep((f.t - (f.life - 0.25)) / 0.25), al = vao * (1 - ra);
    quang(ctx, f.x, f.y, r * 1.15, f.c, 0.26 * al, 1, 0.62);
    for (let j = 0; j < 8; j++) { const g = t * 1.6 + j / 8 * TAU; cung(ctx, f.x, f.y, r, g, g + 0.5, 2, f.c, 0.9 * al, 0.62, 0); }
    for (let j = 0; j < 5; j++) { const g = -t * 2.2 + j / 5 * TAU; cung(ctx, f.x, f.y, r * 0.58, g, g + 0.7, 1.4, '#d8f08a', 0.7 * al, 0.62, 0); }
    for (const D of [...f.day].sort((a, b) => a.y - b.y)) {
      const cao = D.cao * ease(kep((f.t - D.tre) / 0.2)) * (1 - ra);
      if (cao < 1) continue;
      const bx = f.x + D.x, by = f.y + D.y, N = 6, P = [[bx, by]];
      for (let j = 1; j <= N; j++) { const u = j / N; P.push([bx + D.uon * Math.sin(u * 2.8) * u + Math.sin(t * 5 + D.pha + u * 2) * 1.8 * u, by - cao * u]); }
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [w, c2, a2] of [[4.2, '#1f5a2e', 0.95], [2.2, '#5fd07a', 1]]) {   // thân dây: viền đậm, ruột sáng, thon dần lên ngọn
        for (let j = 1; j <= N; j++) { ctx.globalAlpha = a2; ctx.strokeStyle = c2; ctx.lineWidth = w * (1.15 - 0.6 * j / N); ctx.beginPath(); ctx.moveTo(P[j - 1][0], P[j - 1][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke(); }
      }
      ctx.strokeStyle = '#d8f08a'; ctx.lineWidth = 1; ctx.globalAlpha = 0.9;
      for (let j = 1; j < N; j += 2) { const d = j % 4 === 1 ? 1 : -1; ctx.beginPath(); ctx.moveTo(P[j][0], P[j][1]); ctx.lineTo(P[j][0] + d * 3.2, P[j][1] - 2.2); ctx.stroke(); }   // gai
      ctx.restore();
      mang(ctx, P[N][0], P[N][1], -Math.PI / 2 + D.uon * 0.05, [[5, 0], [0, -2.4], [-3, 0], [0, 2.4]], '#b8f08a', 0.95, false);   // lá ở ngọn
    }
  },
  'dg-troi'(ctx, f, k, t) {   // dây quấn quanh thân quái
    const al = kep(f.t / 0.1) * (1 - kep((f.t - f.life + 0.3) / 0.3));
    for (let j = 0; j < 3; j++) cung(ctx, f.x, f.y - 3 + j * 4, f.r * (1 - j * 0.08), t * 3 + j * 2.1, t * 3 + j * 2.1 + 4.4, 2.2, j % 2 ? '#5fd07a' : '#2f7a3e', al, 0.42, 0);
  },
  'th-cast'(ctx, f, k) {   // đất nứt, sóng chấn, vòng gai đá trồi lên rồi sụp xuống
    const r = f.r, tat = 1 - kep((f.t - 0.45) / 0.45), mo = kep(f.t / 0.14), ra = kep((f.t - (f.life - 0.3)) / 0.3);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2a1c12'; ctx.globalAlpha = 0.65 * tat; ctx.lineWidth = 2.4;
    for (const pts of f.nut) { const n = Math.max(1, Math.round((pts.length - 1) * mo)); ctx.beginPath(); ctx.moveTo(f.x + pts[0][0], f.y + pts[0][1]); for (let i = 1; i <= n; i++) ctx.lineTo(f.x + pts[i][0], f.y + pts[i][1]); ctx.stroke(); }
    ctx.restore();
    quang(ctx, f.x, f.y, r * 1.1, '#c08850', 0.3 * tat, 1, 0.62);
    cung(ctx, f.x, f.y, r * (0.25 + 0.95 * ease(kep(f.t / 0.28))), 0, TAU, 3.4 * kep(1 - f.t / 0.32), '#e8c898', kep(1 - f.t / 0.32), 0.62, 0.3);
    cung(ctx, f.x, f.y, r * (0.15 + 0.7 * ease(kep(f.t / 0.2))), 0, TAU, 1.6, SANG, 0.7 * kep(1 - f.t / 0.2), 0.62, 0);
    for (const G of [...f.gai].sort((a, b) => a.y - b.y)) {
      const h = G.cao * nay(kep((f.t - G.tre) / 0.16)) * (f.t > G.tre ? 1 : 0) * (1 - ra * 0.92);
      if (h < 1) continue;
      const bx = f.x + G.x, by = f.y + G.y, w = G.rong * (1 - ra * 0.3), tx = bx + G.ngh * h, ty = by - h;
      ctx.save(); ctx.globalAlpha = 0.35 * (1 - ra); ctx.fillStyle = '#14100a'; ctx.beginPath(); ctx.ellipse(bx, by + 1, w * 0.9, w * 0.35, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1 - ra * 0.6;
      ctx.fillStyle = '#6a4a30'; ctx.beginPath(); ctx.moveTo(bx - w / 2, by); ctx.lineTo(tx, ty); ctx.lineTo(bx + w * 0.1, by + 1.5); ctx.closePath(); ctx.fill();   // mặt tối
      ctx.fillStyle = '#c9a070'; ctx.beginPath(); ctx.moveTo(bx + w * 0.1, by + 1.5); ctx.lineTo(tx, ty); ctx.lineTo(bx + w / 2, by); ctx.closePath(); ctx.fill();   // mặt sáng
      ctx.strokeStyle = '#f4e0b8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx + w * 0.1, by + 1.5); ctx.lineTo(tx, ty); ctx.stroke();   // sống đá hắt sáng
      ctx.strokeStyle = '#2a1c12'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - w / 2, by); ctx.lineTo(tx, ty); ctx.lineTo(bx + w / 2, by); ctx.stroke();
      ctx.restore();
    }
  },
  'lp-cast'(ctx, f, k) {   // dải gió theo đường lướt, bóng mờ nối đuôi, vòng gió ở chỗ xuất phát, nhát chém chéo ở cuối đường
    const dx = f.x2 - f.x, dy = f.y2 - f.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, tat = 1 - k;
    quang(ctx, f.x + dx * 0.5, f.y + dy * 0.5, L * 0.62, f.c, 0.5 * kep(1 - f.t / 0.26), 1, 0.2, Math.atan2(dy, dx));   // dải gió dày dọc đường lướt
    for (const [o, w] of [[-6, 2.6], [6, 2.6], [0, 5]]) vet(ctx, f.x + nx * o + dx * k * 0.5, f.y + ny * o + dy * k * 0.5, f.x2 + nx * o, f.y2 + ny * o, w * tat, f.c, 0.9 * tat, o ? 0.2 : 0.5);
    for (let i = 0; i < 4; i++) { const u = 0.12 + i * 0.26, al = 0.5 * kep(1 - (f.t - u * 0.1) / 0.32); quang(ctx, f.x + dx * u, f.y + dy * u - 2, 15, f.c, al, 0.5, 1); }
    cung(ctx, f.x, f.y + 6, 5 + 20 * ease(k), 0, TAU, 2.2 * tat, f.c, tat, 0.5, 0.2);
    const e = ease(kep(f.t / 0.1)), ex = f.x2 + Math.cos(f.a) * 8, ey = f.y2 + Math.sin(f.a) * 8, tc = kep(1 - f.t / 0.34);
    for (const d of [-0.85, 0.85]) { const c = Math.cos(f.a + d), s = Math.sin(f.a + d); vet(ctx, ex - c * 18 * e, ey - s * 18 * e, ex + c * 18 * e, ey + s * 18 * e, 4.4 * tc, f.c, tc); }
    quang(ctx, ex, ey, 14 + 10 * e, SANG, 0.6 * kep(1 - f.t / 0.14));
  },
  'lp-hit'(ctx, f, k) {
    const L = 16 * ease(kep(f.t / 0.07)), c = Math.cos(f.a), s = Math.sin(f.a);
    vet(ctx, f.x - c * L, f.y - s * L, f.x + c * L, f.y + s * L, 3.2 * (1 - k), f.c, 1 - k);
    quang(ctx, f.x, f.y, 11, SANG, 0.65 * kep(1 - f.t / 0.1));
  },
};
export const KN_VE = { DAN, VE };   // bài thử soát đủ kiểu

export function drawKnFx(ctx, game, t = 0) {
  for (const b of game.bullets || []) {
    const k = knVe(game, b.sk);
    if (k && DAN[k] && Number.isFinite(b.x + b.y + b.vx + b.vy)) DAN[k](ctx, b, Math.atan2(b.vy, b.vx), t);   // toạ độ hỏng thì bỏ (một lần NaN vào khung vẽ từng làm trắng màn, 23/11/2026)
  }
  const S = game.knFx;
  if (!S) return;
  for (const f of S.fx) if (Number.isFinite(f.x + f.y)) VE[f.k]?.(ctx, f, f.t / f.life, t);
  if (!S.hat.length) return;
  ctx.save();
  for (const q of S.hat) {
    const toi = q.c < '#6';   // màu tối (khói): vẽ đè, không cộng sáng
    ctx.globalCompositeOperation = toi ? 'source-over' : 'lighter';
    ctx.globalAlpha = (1 - q.t / q.life) * (toi ? 0.6 : 1); ctx.fillStyle = q.c;
    ctx.fillRect(Math.round(q.x - q.s / 2), Math.round(q.y - q.s / 2), q.s, q.s);
  }
  ctx.restore();
}
