// Chớp mắt lúc đứng nghỉ (chủ dự án 23/11/2026: "đứng im phải thêm hiệu ứng chớp mắt nữa").
// Hình trang phục có 8 khung đứng nhắm mắt nối sau các khung khác (data/art.json hero.tp-NN → chop: khung nhắm đầu tiên,
// làm bằng tools/art/chop_mat.py, không tốn credit). Thỉnh thoảng thay khung đứng bằng bản nhắm của đúng khung đó trong một nhịp ngắn.
// Nhịp riêng cho từng người (lưu trên chính đối tượng p), số ở data/heroes.json → chop_mat. Chỉ để nhìn: không gửi qua mạng,
// máy người xem tự chớp cho người khác như cho mình.
const lay = ([a, b]) => a + Math.random() * (b - a);

export function chopFrame(game, p, spr, look, name, f, t) {
  const C = game.data.heroes?.chop_mat;
  if (!C || spr.chop == null || name !== 'idle') return f;
  const idx = look.anims.idle.indexOf(f);
  if (idx < 0) return f;
  if (p.chopNext == null || t < (p.chopT0 ?? -1e9) || t - p.chopNext > 10) {   // lần đầu, hoặc đồng hồ lùi / nhảy xa (bản xem thử, quay lại thẻ)
    p.chopT0 = -1e9; p.chopNext = t + lay(C.cach); return f;
  }
  if (t >= p.chopNext) {
    p.chopT0 = p.chopNext; p.chopDoi = Math.random() < C.doi; p.chopNext = t + lay(C.cach);
  }
  const k = t - p.chopT0;
  const nham = k < C.nham || (p.chopDoi && k >= C.doi_cach && k < C.doi_cach + C.nham);
  return nham ? spr.chop + idx : f;
}
