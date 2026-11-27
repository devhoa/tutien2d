// Loé trắng ngắn ở chỗ đòn bạo kích trúng (chủ dự án 23/11/2026 13:4x chọn "Cả 2", không khựng hình): quầng trắng cộng sáng nở nhanh rồi tắt,
// thêm chữ thập sáng mảnh cho ra cái "chát". Số ở data/juice.json → hit2.loe; thêm ở src/game/hit-feel.js (trong hạn mức tia lửa bạo kích).
// f: { x, y, r: bán kính lớn nhất, a: độ sáng }, k: 0 → 1 theo đời hiệu ứng.
export function drawLoe(ctx, f, k) {
  const e = 1 - (1 - k) * (1 - k), R = f.r * (0.55 + 0.45 * e), a = f.a * (1 - k);
  if (a <= 0.01 || R <= 0.5) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, R);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.45, `rgba(255,250,235,${a * 0.55})`); g.addColorStop(1, 'rgba(255,245,220,0)');
  ctx.globalAlpha = 1; ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(f.x, f.y, R, 0, Math.PI * 2); ctx.fill();
  const L = R * 1.5, w = Math.max(1, 2 * (1 - k));   // chữ thập sáng: ngang dài hơn dọc (nhìn chéo xuống như vệt chém)
  ctx.globalAlpha = a; ctx.fillStyle = '#fff';
  ctx.fillRect(Math.round(f.x - L), Math.round(f.y - w / 2), Math.round(L * 2), Math.max(1, Math.round(w)));
  ctx.fillRect(Math.round(f.x - w / 2), Math.round(f.y - L * 0.6), Math.max(1, Math.round(w)), Math.round(L * 1.2));
  ctx.restore();
}
