// Đổi màu hình pfx.* lúc chạy (đòn pháp bảo khảm hệ: cùng một hình kiếm, châu, vụ nổ… mang màu Kim, Mộc, Thuỷ, Hoả, Thổ). Hình dựng bằng
// một dải màu gốc (data/art.json → pal, tối → sáng). Mỗi điểm nằm trên dải gốc (đúng một màu của dải, hoặc màu pha giữa hai màu kề nhau:
// khói, vệt mờ) đổi sang màu cùng vị trí trên dải đích (data/vfx.json → pb.ramps); màu ngoài dải (vàng chắn tay, gỗ, lụa…) giữ nguyên.
// Lớp sáng: giữ độ rực, đổi sắc theo màu cùng bậc của dải đích. Mỗi cặp (hình, dải) làm một lần rồi nhớ, trong hạn mức bộ nhớ
// (data/config.json → perf.pfx_mb; src/render/canvas-kho.js): trước giữ 48 cặp, có lúc gần 80 MB, bỏ mà không trả bộ nhớ nên Safari
// iPhone đời cũ hết bộ nhớ canvas sau trận đông người (23/11/2026).
import { spriteImage } from '../sprites.js';
import { khoCanvas, traCanvas } from '../canvas-kho.js';

const kho = khoCanvas(32), khong = new Set(), hong = new Map(), NEAR = 22 * 22;
export const setPfxMb = mb => kho.han(mb);
export const pfxKho = () => ({ mb: Math.round(kho.bytes / 1048576), so: kho.size });   // bài thử, đo
const coBo = o => (o.c.width * o.c.height + (o.l ? o.l.width * o.l.height : 0)) * 4;
const traBo = o => { traCanvas(o.c); traCanvas(o.l); };
const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const pack = (r, g, b) => (r << 16) | (g << 8) | b;

// Màu (r, g, b) → vị trí trên dải gốc S (0..n) nếu đủ gần đường nối các màu của dải, không thì -1
function locate(r, g, b, S) {
  let best = NEAR + 1, at = -1;
  for (let k = 0; k + 1 < S.length; k++) {
    const A = S[k], B = S[k + 1], dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], L = dx * dx + dy * dy + dz * dz;
    const t = L ? Math.max(0, Math.min(1, ((r - A[0]) * dx + (g - A[1]) * dy + (b - A[2]) * dz) / L)) : 0;
    const ex = A[0] + dx * t - r, ey = A[1] + dy * t - g, ez = A[2] + dz * t - b, d = ex * ex + ey * ey + ez * ez;
    if (d < best) { best = d; at = k + t; }
  }
  return best <= NEAR ? at : -1;
}

function mapColor(r, g, b, S, D) {
  const at = locate(r, g, b, S);
  if (at < 0) return -1;
  const q = at * (D.length - 1) / (S.length - 1), j = Math.min(D.length - 2, Math.floor(q)), f = q - j, A = D[j], B = D[j + 1];
  return pack(Math.round(A[0] + (B[0] - A[0]) * f), Math.round(A[1] + (B[1] - A[1]) * f), Math.round(A[2] + (B[2] - A[2]) * f));
}

// Lớp sáng: sắc của điểm (đã chuẩn hoá về độ rực 1) gần màu bậc nào của dải gốc thì lấy sắc bậc ấy của dải đích, nhân lại độ rực
function mapLight(r, g, b, SN, DN) {
  const M = Math.max(r, g, b);
  if (M < 3) return -1;
  const x = r / M, y = g / M, z = b / M;
  let best = 9, at = 0;
  for (let k = 0; k < SN.length; k++) { const A = SN[k], d = (A[0] - x) ** 2 + (A[1] - y) ** 2 + (A[2] - z) ** 2; if (d < best) { best = d; at = k; } }
  const T = DN[Math.round(at * (DN.length - 1) / (SN.length - 1))];
  return pack(Math.round(T[0] * M), Math.round(T[1] * M), Math.round(T[2] * M));
}

function recolor(im, fn) {
  const c = document.createElement('canvas'); c.width = im.naturalWidth || im.width; c.height = im.naturalHeight || im.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) { traCanvas(c); throw new Error('het_bo_nho'); }   // máy hết bộ nhớ canvas: lần này dùng màu gốc
  g.drawImage(im, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data, memo = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const key = pack(d[i], d[i + 1], d[i + 2]);
    let o = memo.get(key);
    if (o === undefined) { o = fn(d[i], d[i + 1], d[i + 2]); memo.set(key, o); }
    if (o >= 0) { d[i] = o >> 16; d[i + 1] = (o >> 8) & 255; d[i + 2] = o & 255; }
  }
  g.putImageData(id, 0, 0);
  return c;
}

// Trả { c: tấm màu đã đổi, l: tấm sáng đã đổi | null }; null = dùng hình gốc (dải đích trùng dải gốc, hình không đổi màu được); undefined = hình chưa tải xong
export function pfxTint(art, name, ramps, key) {
  const id = name + '|' + key;
  if (khong.has(id)) return null;
  let o = kho.get(id);
  if (o) return o;
  const spr = art.sprites['pfx.' + name], dst = ramps[key];
  if (!spr?.pal || !dst || spr.pal.join() === dst.join()) { khong.add(id); return null; }
  if (performance.now() - (hong.get(id) ?? -1e9) < 3000) return null;   // vừa hỏng: tạm dùng màu gốc, đợi một lúc mới thử lại
  const L = spr.lit ? art.sprites['pfx.' + name + '.l'] : null, im = spriteImage(spr), lim = L && spriteImage(L);
  if (!im || (L && !lim)) return undefined;   // đang tải: khung này vẽ màu gốc (hoặc chưa vẽ gì), lần sau làm
  const S = spr.pal.map(rgb), D = dst.map(rgb), norm = P => P.map(c => { const M = Math.max(c[0], c[1], c[2], 1); return [c[0] / M, c[1] / M, c[2] / M]; });
  const SN = norm(S.slice(2)), DN = norm(D.slice(2));   // bỏ hai bậc tối nhất: sắc của chúng lệch, không dùng để soi sắc ánh sáng
  let c = null;
  try {
    c = recolor(im, (r, g, b) => mapColor(r, g, b, S, D));
    o = { c, l: lim ? recolor(lim, (r, g, b) => mapLight(r, g, b, SN, DN)) : null };
  } catch (e) {
    traCanvas(c);
    if (e?.message === 'het_bo_nho') hong.set(id, performance.now()); else khong.add(id);   // không cho đọc điểm ảnh: giữ màu gốc luôn
    return null;
  }
  hong.delete(id);
  return kho.set(id, o, coBo(o), traBo);
}
