// Số sát thương của mình nảy lên và đổi màu theo nhát của chuỗi Thân pháp (chủ dự án 23/11/2026 13:4x chọn "Cả 2"; số ở data/juice.json → so).
// Nhát 1, 2, 3, 4 lấy màu so.mau[0..3] (trắng → lam → tím → hồng); nhát cuối chuỗi "bung vàng": chữ vàng viền cam, to hơn, tia vàng toả ra.
// Bạo kích vẫn vàng #ffd84a như cả game (kỹ năng, pháp bảo cũng vậy); bạo kích đúng nhát cuối thì vừa to vừa bung.
// Số tính trong combat.js hitMob (soMau, soCuoi), vẽ ở src/render/draw-numbers.js (soNay, drawBung).
const S = game => game.data.juice?.so;
export const soOn = game => !!S(game)?.on;

// Màu số của một đòn: own (đòn của mình), crit (bạo kích), nhat (nhát thứ mấy của chuỗi, 0 = Chém), cuoi (nhát cuối chuỗi)
export function soMau(game, own, crit, nhat, cuoi) {
  if (!own) return '#b8d8ff';
  if (crit) return '#ffd84a';
  const s = S(game);
  if (!s?.on || nhat == null) return '#fff';
  return cuoi ? s.bung.mau : s.mau[Math.min(nhat, s.mau.length - 1)] || '#fff';
}

// Số vừa hiện: cỡ k (vọt to rồi co về, nảy qua lại một nhịp) và dy (nhảy lên rồi rơi về đường bay). n.t: giây đã hiện.
export function soNay(game, n) {
  const s = S(game);
  if (!s?.on || n.v == null || !n.ref) return null;
  const T = n.bung ? s.bung.t : s.nay_t, u = n.t / T;
  if (u >= 1) return { k: n.bung ? s.bung.k : 1, dy: 0 };
  const K = n.bung ? s.bung.k * s.nay_k : s.nay_k, base = n.bung ? s.bung.k : 1;
  return { k: base + (K - base) * Math.exp(-5 * u) * Math.cos(2.5 * Math.PI * u), dy: -s.nhay * Math.sin(Math.PI * u) * (n.bung ? 1.4 : 1) };
}

// Tia vàng toả quanh số nhát cuối (vẽ trước chữ): s.bung.tia tia dài dần tới tia_len rồi tắt trong bung.t giây.
// fs: cỡ chữ của số (điểm): tia bắt đầu ngoài mép chữ để không bị chữ che, số càng to tia càng xa.
export function drawBung(ctx, game, n, x, y, fs = 12) {
  const s = S(game)?.bung, u = s ? n.t / s.t : 1;
  if (u >= 1) return;
  const half = fs * 0.32 * Math.max(1, String(n.text).length), L = (3 + s.tia_len * (1 - (1 - u) * (1 - u))) * Math.min(1.6, fs / 12), r0 = half + 2 + 5 * u;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - u) * 0.9; ctx.strokeStyle = s.mau; ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < s.tia; i++) {
    const a = (i / s.tia) * Math.PI * 2 + (n.seed || 0), ca = Math.cos(a), sa = Math.sin(a) * 0.75;
    ctx.moveTo(x + ca * r0, y + sa * r0); ctx.lineTo(x + ca * (r0 + L), y + sa * (r0 + L));
  }
  ctx.stroke();
  ctx.restore();
}
