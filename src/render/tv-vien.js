// Viền kết giới Tinh đồ hai hệ mặt trời (26/11/2026): hình "viên thuốc", hai nửa elip (rx × ry) cách nhau 2L nối bằng hai đoạn thẳng.
// L = 0 (không có L) là elip thường của Tinh đồ một hệ, mọi hàm ở đây khi đó cho đúng kết quả cũ.
const TAU = Math.PI * 2;

// Khoảng cách tới viền: < 1 trong, 1 đúng viền, > 1 ngoài
export const eVien = (x, y, cx, cy, rx, ry, L = 0) => Math.hypot(Math.max(0, Math.abs(x - cx) - L) / rx, (y - cy) / ry);

// Điểm trên viền theo góc g (rad; 0 = mép phải, 90° = đáy, 180° = mép trái, 270° = đỉnh), d: lùi ra ngoài thêm d.
// Có L: đi ĐỀU theo chu vi (đáy giữa và đỉnh giữa vẫn là 90°, 270°) để trụ kiếm, tinh cầu khai hoang rải cả trên hai đoạn thẳng.
export function trenVien(v, g, d = 0) {
  const { cx, cy, rx, ry } = v, L = v.L || 0;
  if (!L) return [cx + Math.cos(g) * (rx + d), cy + Math.sin(g) * (ry + d)];
  const h = Math.PI * Math.sqrt((rx * rx + ry * ry) / 2), P = 2 * h + 4 * L;   // h: nửa chu vi elip (gần đúng)
  let s = (((g / TAU) % 1) + 1) % 1 * P, a;
  if (s < h / 2) a = s / h * Math.PI;                                               // nửa phải, phần dưới
  else if ((s -= h / 2) < 2 * L) return [cx + L - s, cy + ry + d];                  // đáy: phải sang trái
  else if ((s -= 2 * L) < h) return [cx - L + Math.cos(Math.PI / 2 + s / h * Math.PI) * (rx + d), cy + Math.sin(Math.PI / 2 + s / h * Math.PI) * (ry + d)];   // nửa trái
  else if ((s -= h) < 2 * L) return [cx - L + s, cy - ry - d];                      // đỉnh: trái sang phải
  else a = Math.PI * 1.5 + (s - 2 * L) / h * Math.PI;                               // nửa phải, phần trên
  return [cx + L + Math.cos(a) * (rx + d), cy + Math.sin(a) * (ry + d)];
}

// Đường viền (để cắt hình theo kết giới)
export function duongVien(ctx, cx, cy, rx, ry, L = 0) {
  ctx.beginPath();
  if (!L) { ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); return; }
  ctx.moveTo(cx - L, cy - ry); ctx.lineTo(cx + L, cy - ry);
  ctx.ellipse(cx + L, cy, rx, ry, 0, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(cx - L, cy + ry);
  ctx.ellipse(cx - L, cy, rx, ry, 0, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
}
