// Hình pháp trận truyền tống (src/game/truyen-tong.js), vẽ bằng code theo đồng hồ của từng cảnh (game.ttFx), mình và người khác y hệt:
//   drawTtNen   lớp đất, ngay sau đồ phẳng (dưới chân người): quầng trận, ba vòng cổ tự xoay ngược chiều nhau, tám đá cổ tự sáng lần lượt
//   drawTtTren  lớp trên cùng (sau lớp ngày đêm, như hiệu ứng chiêu, đêm vẫn rực): tám cột sáng mờ mọc từ tám đá chọc lên trời, cột sáng giữa
//               ôm người, linh quang bốc lên. Đi: tám cột ngả về giữa rồi tắt, cột giữa bùng trắng nuốt người, vệt sáng phóng lên trời, sóng
//               loang trên đĩa. Tới: cột sáng giáng xuống, loé, sóng loang, tám cột hiện rồi rút xuống đá, linh quang toé ra
//   ttLights    nguồn sáng khoét lớp tối quanh trận (draw-lights.js)
// Cột vẽ theo lưới điểm của nhân vật (nửa đơn vị); quầng, vành sóng mịn. Màu data/config.json → truyen_tong.mau (sáng → đậm).
import { glow, core } from './vfx/glow.js';
import { ttCfg } from '../game/truyen-tong.js';

const TAU = Math.PI * 2;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const smooth = x => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
const snap = v => Math.round(v * 2) / 2;
const VONG = [[0.93, 1, 5], [0.64, -1, 3], [0.38, 1, 2]];   // ba vòng cổ tự: bán kính (phần vòng đá), chiều xoay, độ dài nét

// Vị trí đá thứ i (0: phía bắc, theo chiều kim đồng hồ) trên vòng tám đá
const da = (f, i) => { const a = -Math.PI / 2 + i * Math.PI / 4; return [f.x + Math.cos(a) * f.rx, f.y + Math.sin(a) * f.ry]; };

// Độ sáng trận lúc đang khởi (0…1): của mình theo phần đã tải (truyen-tong.js st.I), người khác theo thời gian
function cuong(game, f, C) {
  if (f.own && game.tt && !game.tt.den && !f.bay) return game.tt.I;
  return smooth((game.time - f.t0) / (C.min || 2));
}

// Danh sách cảnh còn diễn trên bản đồ này (bỏ cảnh đã xong, cảnh của bản đồ khác)
function ds(game, C) {
  const L = game.ttFx, now = game.time;
  if (!L?.length) return null;
  game.ttFx = L.filter(f => f.map === game.map && (f.loai === 'den' ? now - f.t0 < C.den : f.bay ? now - f.bay < C.bay + 0.7 : now - f.t0 < C.cap + 2));
  return game.ttFx.length ? game.ttFx : null;
}

// Dải sáng ngang dựng sẵn một lần (64 × 1 điểm) rồi kéo dọc thành cột, nên cột mờ dần ra hai mép chứ không thành vạch sắc:
// thường: quầng màu rộng + lõi trắng hẹp ở giữa; ong: ống sáng nhìn ngang (giữa nhạt, sáng dày ở hai thành ống, mép ngoài tắt mềm)
const DAI = new Map();
function dai(color, ong) {
  const key = color + (ong ? '|o' : '');
  if (DAI.has(key)) return DAI.get(key);
  const N = 64, c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(N, 1) : Object.assign(document.createElement('canvas'), { width: N, height: 1 });
  const g = c.getContext('2d'), im = g.createImageData(N, 1), n = parseInt(color.slice(1), 16), C = [n >> 16, (n >> 8) & 255, n & 255];
  for (let i = 0; i < N; i++) {
    const x = Math.abs((i + 0.5) / N * 2 - 1);
    const a = ong ? (0.22 + 0.78 * x ** 6) * (1 - smooth((x - 0.86) / 0.14)) : 0.75 * Math.exp(-x * x * 5) + 0.25 * Math.exp(-x * x * 40);
    const tr = ong ? 0.15 * x ** 6 : Math.exp(-x * x * 70);   // phần trắng: lõi cột, thành ống
    for (let k = 0; k < 3; k++) im.data[i * 4 + k] = Math.round(C[k] + (255 - C[k]) * tr);
    im.data[i * 4 + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
  DAI.set(key, c);
  return c;
}

// Một cột sáng đứng từ y0 (chân) lên y1 (ngọn), rộng w (bề ngang quầng là 3w), ngọn lệch ngang lean; vài tia sáng chạy lên dọc cột
function cot(ctx, M, x, y0, y1, w, A, lean, now, seed, tia = 3) {
  if (A <= 0.01 || y0 - y1 < 1) return;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, A);
  const k = lean ? -lean / (y0 - y1) : 0;
  if (k) { ctx.save(); ctx.transform(1, 0, k, 1, -k * y0, 0); }
  ctx.drawImage(dai(M[2]), x - w * 1.5, y1, w * 3, y0 - y1);
  if (k) ctx.restore();
  ctx.fillStyle = M[0];
  for (let j = 0; j < tia; j++) {
    const sp = 70 + hash(seed * 3.1 + j) * 90, L = y0 - y1, u = ((now * sp + hash(seed + j * 7.3) * 900) % L) / L, yy = y0 - u * L;
    ctx.globalAlpha = Math.min(1, 0.6 * A * Math.sin(u * Math.PI)); ctx.fillRect(snap(x + lean * u + (hash(seed + j) - 0.5) * w * 0.5), snap(yy), 0.5, 3 + hash(j + seed * 9) * 4);
  }
}

// Ống sáng mờ bao cả trận chọc lên trời (giữa nhạt, hai thành sáng): "cột sáng mờ xung quanh"
function ong(ctx, M, f, top, A) {
  if (A <= 0.01) return;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, A);
  ctx.drawImage(dai(M[2], true), f.x - f.rx * 1.08, top, f.rx * 2.16, f.y + 2 - top);
}

// Vòng sóng loang trên đĩa (elip theo dáng trận)
function song(ctx, f, M, r, a, lw = 1) {
  if (a <= 0.01) return;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a); ctx.strokeStyle = M[1]; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.ellipse(f.x, f.y, f.rx * r, f.ry * r, 0, 0, TAU); ctx.stroke();
}

// Lớp đất: quầng trận, ba vòng cổ tự xoay, tám đá, kiếm ấn giữa trận
export function drawTtNen(ctx, game) {
  const C = ttCfg(game), L = ds(game, C);
  if (!L) return;
  const M = C.mau, now = game.time;
  ctx.save();
  for (const f of L) {
    const a = now - f.t0, den = f.loai === 'den', b = f.bay ? Math.min(1.3, (now - f.bay) / C.bay) : 0, I = den ? 1 : cuong(game, f, C);
    const mo = den ? 1 - smooth((a - 0.25) / (C.den - 0.25)) : smooth(a / 0.3) * (f.tan ? 1 - smooth(b) : 1 - smooth((b - 0.7) / 0.5));
    if (mo <= 0.01) continue;
    const k = den ? Math.max(0, 1 - a / C.den) : I + 0.6 * b;
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, f.ry / f.rx);
    glow(ctx, 0, 0, f.rx * 1.3, M[2], (0.1 + 0.3 * k) * mo);
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = M[1]; ctx.lineWidth = 0.5 + f.k;
    for (const [fr, dir, dash] of VONG) {
      ctx.setLineDash([dash * f.k * 8, dash * f.k * 5]); ctx.lineDashOffset = a * 26 * dir * (1 + 2 * b);
      ctx.globalAlpha = Math.min(1, (0.16 + 0.5 * k) * mo);
      ctx.beginPath(); ctx.ellipse(f.x, f.y, f.rx * fr, f.ry * fr, 0, 0, TAU); ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let i = 0; i < 8; i++) {
      const [sx, sy] = da(f, i), on = den ? 1 : smooth((a - 0.07 * i) / 0.22), p = 1 + 0.18 * Math.sin(now * 7 + i * 1.3);
      glow(ctx, sx, sy, (5 + 12 * f.k) * p, M[1], on * (0.4 + 0.45 * k) * mo);
      core(ctx, sx, sy, 2 + 5 * f.k, M[0], on * (0.3 + 0.45 * k) * mo);
    }
    core(ctx, f.x, f.y, f.rx * 0.3, M[1], (0.08 + 0.3 * k + 0.4 * Math.min(1, b)) * mo);
  }
  ctx.restore();
}

// Lớp trên cùng: cột sáng, linh quang, bùng, giáng
export function drawTtTren(ctx, game) {
  const C = ttCfg(game), L = game.ttFx?.length ? game.ttFx : null;
  if (!L) return;
  const M = C.mau, now = game.time, top = Math.floor(game.screen.viewRect().y0) - 6;
  ctx.save();
  for (const f of L) {
    if (f.map !== game.map) continue;
    if (f.loai === 'den') den(ctx, game, f, C, M, now, top); else di(ctx, game, f, C, M, now, top);
  }
  ctx.restore();
}

function di(ctx, game, f, C, M, now, top) {
  const a = now - f.t0, I = cuong(game, f, C), b = f.bay ? Math.min(1.3, (now - f.bay) / C.bay) : 0;
  const mo = smooth(a / 0.25) * (f.tan ? 1 - smooth(b) : 1), tat = f.tan ? 1 : 1 - smooth((b - 0.15) / 0.55);
  if (mo <= 0.01) return;
  for (let i = 0; i < 8; i++) {   // tám cột sáng mờ từ tám đá chọc lên trời; lúc bùng ngọn ngả về giữa rồi tắt
    const [sx, sy] = da(f, i), len = (sy - top) * smooth((a - 0.07 * i - 0.1) / 0.6);
    const A = mo * tat * (0.25 + 0.55 * I) * (0.85 + 0.15 * Math.sin(now * 6 + i * 1.7));
    cot(ctx, M, sx, sy, sy - len, 3 + 6 * f.k, A, smooth(b / 0.6) * (f.x - sx) * 0.7, now, i + f.seed);
    glow(ctx, sx, sy - 1, 6 + 10 * f.k, M[2], 0.5 * A);
  }
  ong(ctx, M, f, top, mo * tat * (0.15 + 0.35 * I) * smooth((a - 0.35) / 0.8));
  const W = f.rx * (0.42 + 0.2 * I) * (1 - 0.6 * smooth(b / 0.7)), Ac = mo * (f.tan ? 0.1 + 0.2 * I : 0.1 + 0.22 * I + 0.75 * smooth((b - 0.3) / 0.6));
  cot(ctx, M, f.x, f.y + 2, top, W, Ac, 0, now, 40 + f.seed, 5);   // cột giữa ôm người
  const n = Math.round(10 + 26 * I);   // linh quang bốc lên từ đĩa, xoáy dần vào giữa
  for (let j = 0; j < n; j++) {
    const h1 = hash(j * 3.1 + f.seed), h2 = hash(j * 7.7 + f.seed), u = (a * (0.35 + 0.45 * h2) + h1) % 1, an = h1 * TAU + a * 0.6, rr = 0.25 + 0.7 * Math.sqrt(h2);
    const gx = f.x + Math.cos(an) * f.rx * rr, gy = f.y + Math.sin(an) * f.ry * rr, y = gy - u * (26 + 40 * h1 + 50 * I);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, Math.sin(u * Math.PI) * (0.35 + 0.6 * I) * mo * tat); ctx.fillStyle = j % 3 ? M[1] : M[0];
    ctx.fillRect(snap(gx + (f.x - gx) * u * 0.45), snap(y), j % 4 ? 0.5 : 1, j % 4 ? 0.5 : 1);
  }
  if (!b || f.tan) return;
  for (let i = 0; i < 8; i++) {   // linh khí từ tám đá dồn về giữa dọc mặt trận
    const [sx, sy] = da(f, i), u = smooth(b / 0.45), x = sx + (f.x - sx) * u, y = sy + (f.y - sy) * u;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - u) * 0.8; ctx.strokeStyle = M[0]; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (f.x - sx) * 0.12, y + (f.y - sy) * 0.12); ctx.stroke();
  }
  song(ctx, f, M, 0.3 + 1.2 * smooth(b), 0.85 * (1 - smooth(b)), 1.5);
  const w = smooth((b - 0.45) / 0.45);   // bùng trắng nuốt người, vệt sáng phóng lên trời
  core(ctx, f.x, f.y - 10, 14 + 26 * w + 18 * f.k, M[0], w);
  glow(ctx, f.x, f.y - 6, f.rx * (1 + w), M[1], 0.5 * w);
  if (w > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = w; ctx.fillStyle = M[0]; ctx.fillRect(snap(f.x - 0.75), top, 1.5, f.y - 14 - top); }
}

function den(ctx, game, f, C, M, now, top) {
  const u = now - f.t0, roi = smooth(u / 0.14), v = u - 0.12, tat = 1 - smooth(v / (C.den - 0.12)), gy = f.y + 2;
  const yb = top + (gy - top) * roi, W = f.rx * (0.6 - 0.32 * smooth(v / 0.9));
  cot(ctx, M, f.x, yb, top, W, roi >= 1 ? 1.25 * tat : 1, 0, now, 60 + f.seed, 6);   // cột sáng giáng xuống, chạm đất thì nhạt dần
  core(ctx, f.x, yb - 4, 10 + 14 * f.k, M[0], roi >= 1 ? 0 : 1);   // đầu cột đang giáng
  core(ctx, f.x, f.y - 10, 22 + 20 * f.k, M[0], 0.95 * (1 - smooth((u - 0.16) / 0.45)));   // người hiện dần trong lõi sáng (che từ khung đầu: cột giáng vào đúng chỗ đó)
  ong(ctx, M, f, top, 0.4 * tat * roi);
  if (v < 0) return;
  glow(ctx, f.x, f.y - 4, f.rx * (1.1 + 0.8 * smooth(v / 0.25)), M[1], 0.85 * (1 - smooth(v / 0.6)));   // loé lúc chạm
  song(ctx, f, M, 0.25 + 1.35 * smooth(v / 0.65), 0.9 * (1 - smooth(v / 0.65)), 1.5);
  song(ctx, f, M, 0.2 + 0.9 * smooth((v - 0.12) / 0.6), 0.6 * (1 - smooth((v - 0.12) / 0.6)));
  for (let i = 0; i < 8; i++) {   // tám cột hiện đủ cao rồi rút xuống đá
    const [sx, sy] = da(f, i), len = (sy - top) * (1 - smooth((v - 0.05 - 0.03 * i) / 0.55));
    cot(ctx, M, sx, sy, sy - len, 3 + 6 * f.k, 0.9 * tat, 0, now, i + f.seed);
  }
  for (let j = 0; j < 28; j++) {   // linh quang toé ra khỏi tâm rồi rơi
    const h1 = hash(j * 5.3 + f.seed), h2 = hash(j * 2.9 + f.seed), an = h1 * TAU, s = smooth(v / (0.5 + 0.4 * h2));
    const x = f.x + Math.cos(an) * f.rx * (0.15 + 1.05 * s * (0.6 + 0.4 * h2)), y = f.y + Math.sin(an) * f.ry * (0.15 + 1.05 * s * (0.6 + 0.4 * h2)) - 18 * Math.sin(s * Math.PI) * h1;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, (1 - s) * 0.9); ctx.fillStyle = j % 3 ? M[1] : M[0];
    ctx.fillRect(snap(x), snap(y), j % 4 ? 0.5 : 1, j % 4 ? 0.5 : 1);
  }
}

// Nguồn sáng quanh trận (khoét lớp tối ngày đêm, hầm): sáng theo độ khởi trận, lúc tới sáng rồi tắt dần
export function ttLights(game, out) {
  const C = ttCfg(game), now = game.time;
  for (const f of game.ttFx || []) {
    if (f.map !== game.map) continue;
    const a = f.loai === 'den' ? 1 - smooth((now - f.t0) / C.den) : (0.35 + 0.55 * cuong(game, f, C)) * (f.bay ? 1 - smooth((now - f.bay) / C.bay) : 1);
    if (a > 0.02) out.push({ x: f.x, y: f.y - 6, r: f.rx * 2.2, c: '120,220,255', a, soft: true });
  }
}
