// Dòng linh khí mỏng bay về phía người đang độ kiếp Kết Anh (chủ dự án 27/11/2026 01:09: "mọi ng đều có thể thấy linh khí đang bay về hướng người độ
// kiếp"). Hỏi "có làm mọi người lag không": không gửi thêm tin nào, mỗi máy tự vẽ từ nghi lễ đang diễn (của mình: game.kd, của người cùng tinh cầu:
// game.kdSee, dựng từ tin kd-bd đã có, src/game/ket-dan.js); số hạt có trần (data/config.json → ket_anh.khi_xa.n, máy đã tự hạ mức thì một nửa), hạt
// không giữ trạng thái (tính theo đồng hồ của nghi lễ), chỉ vẽ phần nằm trong màn. Người độ kiếp ở ngoài màn thì dòng khí vẫn chảy ngang màn về
// hướng người đó. Chỉ lúc tụ khí, chịu sét, đợt tụ khí cuối. Lớp trên cùng (src/render/draw.js).
const hash = x => { const s = Math.sin(x) * 43758.5453; return s - Math.floor(s); };
const yeu = () => +(globalThis.document?.body?.dataset?.perf || 0) >= 3;

export function drawKaKhi(ctx, game) {
  const L = [game.kd, ...(game.kdSee || [])].filter(s => s?.K?.khi_xa && s.who);
  if (!L.length) return;
  const m = ctx.getTransform(), cv = ctx.canvas;
  if (!m.a || !m.d || !cv) return;
  const x0 = -m.e / m.a, y0 = -m.f / m.d, x1 = (cv.width - m.e) / m.a, y1 = (cv.height - m.f) / m.d, W = x1 - x0, H = y1 - y0;   // khung nhìn (đơn vị bản đồ)
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const st of L) {
    const K = st.K, X = K.khi_xa, T = st.T, e = st.t, w = st.who;
    if (!(e < T.z + 0.6 || (e >= T.x && e < T.y))) continue;
    const vao = Math.min(1, e / 2.5), tx = w.x, ty = w.y - (K.dan_y || 9) - (w.kdLift || 0);
    const n = Math.round((X.n ?? 150) * (yeu() ? 0.5 : 1) * vao), P = K.pals || [K.pal_khi], dai = X.dai ?? 9, sd = st.sd || 0;
    const tay = X.tay ?? 7, xoay = X.xoay ?? 1.4, toc = X.toc ?? 170;
    const R0 = Math.min(1600, 40 + Math.max(Math.hypot(x0 - tx, y0 - ty), Math.hypot(x1 - tx, y0 - ty), Math.hypot(x0 - tx, y1 - ty), Math.hypot(x1 - tx, y1 - ty)));
    const goc = r => xoay * 0.45 * Math.log(R0 / Math.max(r, 16));   // xoắn ốc: càng gần người độ kiếp càng cuộn
    for (let i = 0; i < n; i++) {
      const arm = i % tay, h1 = hash(i * 12.9898 + sd * 7.1), h2 = hash(i * 78.233 + sd * 3.3), h3 = hash(i * 37.719 + 9.1);
      const f = (e * toc * (0.75 + 0.5 * h3) / R0 + h1) % 1, r = R0 * (1 - f);   // từ vòng ngoài khung nhìn chảy vào
      if (r < 14) continue;
      const nen = sd * 2.4 + arm * 6.2832 / tay + (h2 - 0.5) * 0.42 + 0.05 * Math.sin(e * 1.7 + i);   // mỗi dải một hướng, dải nở rộng ở xa
      const g = nen + goc(r), px = tx + Math.cos(g) * r, py = ty + Math.sin(g) * r;
      if (px < x0 - 12 || px > x1 + 12 || py < y0 - 12 || py > y1 + 12) continue;
      const r2 = r + dai * (1 + 2 * (1 - r / R0)), g2 = nen + goc(r2), qx = tx + Math.cos(g2) * r2, qy = ty + Math.sin(g2) * r2;
      const a = 0.34 * Math.min(1, f / 0.08) * Math.min(1, (r - 14) / 40), pal = P[(arm + sd) % P.length];
      if (a <= 0.01) continue;
      ctx.globalAlpha = a; ctx.strokeStyle = pal[1]; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
      ctx.globalAlpha = Math.min(1, a * 1.8); ctx.fillStyle = pal[0]; ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
    }
  }
  ctx.restore();
}
