// Hình điểm ảnh đồ câu (loài câu được, châu, mồi, cần, món) vẽ bằng code, lưới 32 × 32, nhìn nghiêng quay trái như bộ ảnh cá GPT có sẵn.
// Dùng khi data/art.json chưa có ảnh ui.vk-<mã> (chủ dự án 24/11/2026 00:38: "nếu không có ảnh thì gửi tui lệnh chat để tôi đi tìm GPT đòi ảnh";
// có ảnh rồi thì nơi gọi dùng ảnh). Dáng lấy theo data/fishing.json → fish.*.hinh (mồi, cần, món: theo nhóm). Màu từ data/cave.json.
// Mỗi hình vẽ một lần rồi giữ trong kho nhỏ (caHinh), vẽ ra màn bằng drawImage, phóng nguyên lần, không làm mờ.
const N = 32, kho = new Map();

// Bảng màu một hình: 0 viền, 1 tối, 2 gốc, 3 sáng, 4 loé, 5 mắt đen, 6 mắt trắng, 7 phụ, 8 phụ tối, 9 vàng, 10 gỗ, 11 gỗ tối
function bangMau(hex) {
  const c = hex2(hex), [h, s, l] = hsl(c);
  const m = (dh, ds, dl) => rgb((h + dh + 360) % 360, Math.max(0, Math.min(1, s + ds)), Math.max(0.04, Math.min(0.96, l + dl)));
  return [m(0, 0.1, -0.42), m(-8, 0.05, -0.17), m(0, 0, 0), m(8, -0.05, 0.14), m(15, -0.2, 0.3), '#1a1420', '#f8f4ec', m(40, 0, 0.05), m(40, 0, -0.15), '#f2c94c', '#9a6a3a', '#5a3a1e'];
}
const hex2 = h => { const n = parseInt(String(h || '#888').slice(1).padEnd(6, '8'), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function rgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return `rgb(${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)})`;
}

// ---- nét vẽ trên lưới (ô -1 là trống)
const luoi = () => new Int8Array(N * N).fill(-1);
const dat = (g, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N) g[y * N + x] = c; };
const lay = (g, x, y) => (x >= 0 && y >= 0 && x < N && y < N ? g[y * N + x] : -1);
// Bầu dục, đổ bóng theo chiều dọc: trên sáng, dưới tối
function bau(g, cx, cy, rx, ry, c = 2, bong = true) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
    if (nx * nx + ny * ny > 1) continue;
    dat(g, x, y, !bong ? c : ny < -0.45 ? c + 1 : ny > 0.5 ? c - 1 : c);
  }
}
function tamGiac(g, a, b, d, c) {
  const x0 = Math.min(a[0], b[0], d[0]), x1 = Math.max(a[0], b[0], d[0]), y0 = Math.min(a[1], b[1], d[1]), y1 = Math.max(a[1], b[1], d[1]);
  const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) {
    const p = [x + 0.5, y + 0.5], d1 = s(p, a, b), d2 = s(p, b, d), d3 = s(p, d, a);
    if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) dat(g, x, y, c);
  }
}
function net(g, x0, y0, x1, y1, c, day = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2;
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < day; k++) dat(g, x + (k % 2), y + (k >> 1), c); }
}
const chuNhat = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) dat(g, x, y, c); };
const mat = (g, x, y) => { dat(g, x, y, 6); dat(g, x + 1, y, 6); dat(g, x, y + 1, 5); dat(g, x + 1, y + 1, 6); };
// Viền: ô trống sát ô đã tô thành màu viền
function vien(g) {
  const v = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (lay(g, x, y) < 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => lay(g, x + a, y + b) > 0)) v.push(y * N + x);
  for (const i of v) g[i] = 0;
}

// ---- từng dáng
const ca = (g, o = {}) => {
  const ry = o.ry || 6.5, rx = o.rx || 10;
  tamGiac(g, [23, 16], [30, 8], [27, 16], 7); tamGiac(g, [23, 16], [30, 24], [27, 16], 7);
  bau(g, 15, 16, rx, ry);
  tamGiac(g, [11, 16 - ry + 1], [21, 16 - ry + 1], [18, 16 - ry - 3], 7);
  tamGiac(g, [14, 21], [19, 21], [18, 25], 8);
  net(g, 11, 13, 11, 19, 1); mat(g, 8, 14); dat(g, 5, 17, 1);
  if (o.vay) for (let y = 13; y <= 19; y += 2) for (let x = 13 + (y % 4 ? 0 : 1); x < 22; x += 3) dat(g, x, y, 3);
};
const DANG = {
  ca,
  ly: g => { ca(g, { ry: 7.5, rx: 11, vay: true }); net(g, 6, 18, 3, 22, 9); net(g, 7, 18, 6, 23, 9); },
  kiem: g => { ca(g, { ry: 5, rx: 9 }); net(g, 7, 16, 0, 15, 3, 2); tamGiac(g, [12, 11], [22, 11], [14, 4], 7); },
  la: g => {
    for (let y = 9; y <= 23; y++) for (let x = 4; x <= 28; x++) { const nx = Math.abs(x - 16) / 12, ny = Math.abs(y - 16) / 7; if (nx + ny <= 1) dat(g, x, y, y < 14 ? 3 : y > 18 ? 1 : 2); }
    net(g, 5, 16, 27, 16, 1); tamGiac(g, [27, 16], [31, 12], [31, 20], 7); mat(g, 8, 14);
  },
  luon: g => { for (let x = 4; x <= 28; x++) { const y = 16 + 4 * Math.sin(x / 4); for (let k = -2; k <= 2; k++) dat(g, x, y + k, k < 0 ? 3 : k > 1 ? 1 : 2); dat(g, x, y - 3, 7); } mat(g, 5, 15); },
  'hai-dau': g => { bau(g, 16, 16, 13, 6.5); bau(g, 22, 16, 7, 6.5, 8, false); mat(g, 4, 14); mat(g, 26, 14); tamGiac(g, [13, 10], [19, 10], [16, 5], 7); },
  con: g => {
    bau(g, 15, 18, 13, 8); tamGiac(g, [25, 17], [31, 8], [29, 18], 1); tamGiac(g, [25, 17], [31, 26], [29, 18], 1);
    for (let x = 6; x <= 22; x += 3) net(g, x, 21, x + 1, 24, 3); mat(g, 6, 15); net(g, 3, 19, 10, 20, 0);
    for (const [x, y] of [[12, 13], [17, 12], [20, 15], [14, 16]]) dat(g, x, y, 4);
  },
  long: g => {
    for (let x = 7; x <= 29; x++) { const y = 17 + 3.5 * Math.sin(x / 3.5); for (let k = -3; k <= 3; k++) dat(g, x, y + k, k < -1 ? 3 : k > 1 ? 1 : 2); if (x % 3 === 0) tamGiac(g, [x, y - 3], [x + 2, y - 3], [x + 1, y - 6], 7); }
    bau(g, 6, 15, 5, 4.5); net(g, 6, 11, 9, 5, 9); net(g, 4, 11, 4, 5, 9); net(g, 2, 17, 0, 24, 9); mat(g, 4, 13);
  },
  tom: g => {
    for (let i = 0; i < 7; i++) { const a = -0.6 + i * 0.4, x = 16 + Math.cos(a) * 9 - 4, y = 14 + Math.sin(a) * 7; bau(g, x, y, 4 - i * 0.3, 3.4 - i * 0.25); }
    tamGiac(g, [17, 23], [11, 29], [21, 29], 7); net(g, 9, 10, 1, 3, 3); net(g, 10, 9, 5, 1, 3); mat(g, 11, 10);
    for (let x = 12; x <= 22; x += 3) net(g, x, 19, x - 1, 23, 1);
  },
  cua: g => {
    bau(g, 16, 18, 9.5, 6.5); for (const s of [-1, 1]) { bau(g, 16 + s * 11, 10, 3.5, 3, 7); net(g, 16 + s * 7, 15, 16 + s * 10, 12, 8, 2); for (let k = 0; k < 3; k++) net(g, 16 + s * 8, 19 + k * 2, 16 + s * 13, 23 + k * 2, 1); }
    dat(g, 4, 9, -1); dat(g, 28, 9, -1); net(g, 13, 13, 13, 9, 1); net(g, 19, 13, 19, 9, 1); mat(g, 12, 8); mat(g, 18, 8);
  },
  oc: g => { bau(g, 13, 24, 11, 3.5, 7); bau(g, 18, 15, 8.5, 8.5); for (let a = 0; a < 12; a += 0.25) dat(g, 18 + Math.cos(a) * a * 0.62, 15 + Math.sin(a) * a * 0.62, 1); net(g, 4, 22, 2, 17, 7); net(g, 6, 22, 5, 17, 7); dat(g, 2, 16, 5); dat(g, 5, 16, 5); },
  sua: g => { for (let y = 5; y <= 16; y++) for (let x = 5; x <= 27; x++) { const nx = (x - 16) / 11, ny = (y - 16) / 11; if (nx * nx + ny * ny <= 1) dat(g, x, y, y < 10 ? 3 : 2); } for (let i = 0; i < 5; i++) { const x0 = 8 + i * 4; for (let y = 17; y < 30; y++) dat(g, x0 + Math.sin(y / 2 + i) * 1.4, y, i % 2 ? 7 : 3); } dat(g, 12, 8, 4); dat(g, 13, 8, 4); },
  muc: g => { bau(g, 16, 11, 8, 7.5); mat(g, 12, 11); mat(g, 18, 11); for (let i = 0; i < 6; i++) { const x0 = 9 + i * 2.8; for (let y = 17; y < 29; y++) dat(g, x0 + Math.sin(y / 2.5 + i) * 1.8, y, 2); } },
  trai: g => { for (let y = 8; y <= 25; y++) for (let x = 3; x <= 29; x++) { const nx = (x - 16) / 13, ny = (y - 17) / 8.5; if (nx * nx + ny * ny <= 1) dat(g, x, y, y < 14 ? 3 : y > 21 ? 1 : 2); } for (let k = -4; k <= 4; k++) net(g, 16, 25, 16 + k * 3, 9, 1); net(g, 5, 18, 27, 18, 0); bau(g, 16, 17, 2.4, 1.6, 4, false); },
  chau: g => { bau(g, 16, 16, 9, 9); bau(g, 13, 12, 3, 2.5, 4, false); dat(g, 21, 21, 3); },
  giay: g => { bau(g, 16, 22, 13, 4); net(g, 6, 21, 12, 13, 10, 2); net(g, 18, 21, 22, 14, 10, 2); net(g, 11, 14, 22, 14, 11, 2); dat(g, 25, 23, -1); dat(g, 26, 22, -1); },
  rong: g => { for (let i = 0; i < 6; i++) { const x0 = 7 + i * 3.5; for (let y = 6 + (i % 3) * 2; y < 28; y++) { dat(g, x0 + Math.sin(y / 3 + i) * 2, y, i % 2 ? 2 : 3); dat(g, x0 + 1 + Math.sin(y / 3 + i) * 2, y, 1); } } },
  binh: g => { bau(g, 16, 20, 9, 8); chuNhat(g, 13, 6, 19, 12, 2); chuNhat(g, 12, 5, 20, 6, 3); net(g, 13, 14, 20, 24, 0); tamGiac(g, [20, 13], [26, 15], [24, 20], -1); },
  'kiem-gay': g => { net(g, 9, 23, 22, 10, 3, 2); net(g, 10, 24, 23, 11, 1); tamGiac(g, [22, 9], [25, 10], [23, 13], -1); net(g, 4, 21, 12, 29, 9, 2); net(g, 3, 28, 8, 23, 10, 2); },
  sach: g => { chuNhat(g, 7, 8, 25, 25, 2); chuNhat(g, 7, 8, 9, 25, 1); chuNhat(g, 24, 10, 25, 24, 4); chuNhat(g, 12, 12, 21, 13, 3); for (const x of [12, 17, 22]) chuNhat(g, x, 26, x, 27 + (x % 2), 7); },
  ruong: g => { chuNhat(g, 4, 14, 27, 27, 10); chuNhat(g, 4, 9, 27, 14, 11); for (let x = 5; x <= 26; x++) dat(g, x, 8, 10); for (const x of [8, 23]) chuNhat(g, x, 8, x + 1, 27, 3); chuNhat(g, 14, 13, 17, 17, 9); for (const [x, y] of [[6, 26], [12, 25], [20, 26]]) dat(g, x, y, 7); },
  an: g => { chuNhat(g, 9, 17, 23, 27, 2); chuNhat(g, 9, 17, 23, 18, 3); bau(g, 16, 12, 5, 5); net(g, 12, 9, 10, 5, 9); net(g, 20, 9, 22, 5, 9); mat(g, 14, 11); },
  // mồi
  giun: g => { for (let x = 5; x <= 27; x++) { const y = 16 + 5 * Math.sin(x / 3.2); for (let k = -1; k <= 1; k++) dat(g, x, y + k, k < 0 ? 3 : 2); } dat(g, 27, 16 + 5 * Math.sin(27 / 3.2), 4); },
  me: g => { bau(g, 16, 17, 9, 8.5); for (const [x, y] of [[12, 13], [18, 12], [15, 18], [20, 19], [11, 20]]) { dat(g, x, y, 4); dat(g, x + 1, y, 3); } },
  trung: g => { for (let i = 0; i < 5; i++) bau(g, 8 + i * 4.5, 16 + Math.sin(i) * 1.5, 3.4, 4 - i * 0.2); mat(g, 6, 14); for (let i = 0; i < 5; i++) dat(g, 8 + i * 4.5, 12, 3); },
  sa: g => { bau(g, 16, 19, 10, 9); chuNhat(g, 13, 7, 19, 11, 1); net(g, 11, 11, 21, 11, 9, 2); for (const [x, y] of [[12, 17], [19, 15], [16, 22], [21, 21]]) { dat(g, x, y, 4); dat(g, x - 1, y, 3); dat(g, x + 1, y, 3); dat(g, x, y - 1, 3); dat(g, x, y + 1, 3); } },
  nhuc: g => { bau(g, 16, 17, 11, 8); bau(g, 13, 14, 4, 2.5, 4, false); net(g, 9, 21, 23, 19, 8); },
  huong: g => { chuNhat(g, 8, 18, 24, 27, 9); chuNhat(g, 8, 18, 24, 19, 4); net(g, 16, 18, 16, 6, 10, 1); for (let y = 2; y < 9; y++) dat(g, 16 + Math.sin(y) * 2, y, 3); },
  // cần câu: chéo từ góc dưới trái lên góc trên phải, dây rủ xuống, lưỡi câu
  can: g => { net(g, 4, 28, 27, 4, 2, 2); net(g, 4, 28, 9, 23, 11, 2); bau(g, 9, 24, 2.6, 2.6, 7, false); for (let y = 5; y < 22; y++) dat(g, 28 + Math.sin(y / 3) * 0.6, y, 4); net(g, 26, 21, 28, 23, 3); dat(g, 26, 20, 3); },
  // món: bát, đĩa
  mon: (g, o = {}) => {
    bau(g, 16, 23, 13, 5, o.bat ?? 7); chuNhat(g, 5, 18, 27, 21, o.bat ?? 7); bau(g, 16, 18, 11, 2.5, 3, false);
    bau(g, 15, 15, 8, 3.5); tamGiac(g, [21, 15], [26, 11], [26, 19], 2); mat(g, 9, 14);
    for (let i = 0; i < 3; i++) for (let y = 3; y < 10; y++) dat(g, 9 + i * 6 + Math.sin(y / 1.5 + i) * 1.2, y, 4);
  },
};
const MOI = { 'giun-dat': 'giun', 'linh-me': 'me', 'hoa-trung': 'trung', 'bang-ha': 'tom', 'kim-sa': 'sa', 'da-quang': 'trung', 'huyet-nhuc': 'nhuc', 'tinh-sa': 'sa', 'long-tien': 'huong' };

// Dáng của mã: loài theo fishing.fish.*.hinh; châu, mồi, cần, món theo nhóm
export function dangCua(data, id) {
  const F = data.fishing, m = data.cave.materials[id];
  if (F.fish[id]) return F.fish[id].hinh || 'ca';
  if (F.moi?.[id]) return MOI[id] || 'giun';
  if (F.can?.[id]) return 'can';
  if (F.mon?.[id]) return 'mon';
  return m?.loai === 'chau' ? 'chau' : 'ca';
}
const mauCua = (data, id) => data.cave.materials[id]?.color || data.cave.pills?.[id]?.color || '#8ab0d0';

// Canvas 32 × 32 của mã (giữ trong kho, đừng vẽ lên nó)
export function caHinh(data, id) {
  if (kho.has(id)) return kho.get(id);
  const g = luoi(), d = dangCua(data, id);
  (DANG[d] || ca)(g, {});
  vien(g);
  const pal = bangMau(mauCua(data, id)), cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const c = cv.getContext('2d');
  if (c) for (let i = 0; i < N * N; i++) if (g[i] >= 0) { c.fillStyle = pal[g[i]]; c.fillRect(i % N, Math.floor(i / N), 1, 1); }
  kho.set(id, cv);
  return cv;
}

// Ảnh GPT của mã nếu có (data/art.json → ui.vk-<mã>), không thì null
export const anhCau = (data, id) => data.art?.sprites?.['ui.vk-' + id] || null;

// Ảnh dạng chuỗi data: cho nơi chỉ nhận ảnh nền (uiIco, ô kho); mã không phải đồ câu thì null
const url = new Map();
export function caUrl(data, id) {
  const F = data.fishing, m = data.cave.materials[id];
  if (!F || !(F.fish?.[id] || F.moi?.[id] || F.can?.[id] || F.mon?.[id] || m?.loai === 'chau')) return null;
  if (!url.has(id)) { try { url.set(id, caHinh(data, id).toDataURL()); } catch { return null; } }
  return url.get(id);
}
