// Kho canvas tạm có giới hạn bộ nhớ (22/11/2026, người chơi báo trên iPhone: chơi lâu thì chân dung trống, bản đồ nhỏ tối, cả trên
// máy tính). Safari giới hạn TỔNG bộ nhớ canvas của trang (khoảng 224–384 MB, máy đời cũ thấp hơn); quá mức thì canvas tạo mới trắng
// trơn hoặc getContext trả null. Trước đây bóng đổ, chớp trắng, ám đỏ giữ một bản sao NGUYÊN TẤM hình cho mỗi hình × màu suốt phiên
// chơi (src/render/sprites.js), đi nhiều tinh cầu, gặp nhiều quái, nhiều người là cộng dồn hàng trăm MB. Nay giữ trong hạn mức
// (data/config.json → perf.canvas_mb, perf.pfx_mb): vượt thì bỏ bản lâu không dùng nhất và trả bộ nhớ ngay (đặt cỡ 0: Safari chỉ trả
// khi canvas có cỡ 0 hoặc đã bị dọn rác).
// 23/11/2026 (iPhone iOS 16 vẫn đen màn sau khi chơi lâu, F5 lại vẫn đen): thêm kho cho tấm đổi màu hiệu ứng (src/render/vfx/pfx-pal.js,
// trước giữ 48 cặp, bỏ mà không trả bộ nhớ) và dọn hết các kho lúc rời trang (pagehide) để lần tải lại có đủ bộ nhớ ngay.
const khoHet = new Set(), donThem = new Set();

// Mỗi mục: giá trị v (canvas hoặc vật chứa canvas), số byte b, hàm trả bộ nhớ tra(v). Mặc định là một canvas.
export function khoCanvas(mb = 48) {
  const m = new Map();   // khoá → { v, b, tra }, thứ tự = lần dùng (cuối là mới nhất)
  let bytes = 0, max = mb * 1048576;
  const bo = (k, e) => { bytes -= e.b; m.delete(k); e.tra(e.v); };
  const kho = {
    get(k) { const e = m.get(k); if (!e) return undefined; m.delete(k); m.set(k, e); return e.v; },
    set(k, v, b = v.width * v.height * 4, tra = traCanvas) {
      const cu = m.get(k); if (cu) { if (cu.v === v) { bytes -= cu.b; m.delete(k); } else bo(k, cu); }
      m.set(k, { v, b, tra }); bytes += b;
      for (const [k2, e] of m) { if (bytes <= max || m.size <= 1) break; bo(k2, e); }
      return v;
    },
    han(v) { if (v > 0) max = v * 1048576; },
    don() { for (const [k, e] of m) bo(k, e); },
    get bytes() { return bytes; }, get size() { return m.size; },
  };
  khoHet.add(kho);
  return kho;
}

// Trả bộ nhớ của canvas không dùng nữa ngay (không chờ dọn rác)
export function traCanvas(c) { if (c) c.width = c.height = 0; }

// Bộ nhớ đệm khác (mảng nền, bản đồ nhỏ) đăng ký hàm dọn để cùng dọn lúc rời trang
export function dangKyDon(fn) { donThem.add(fn); }
export function donHet() {
  for (const k of khoHet) k.don();
  for (const fn of donThem) { try { fn(); } catch { /* bộ nhớ đệm đã gỡ */ } }
  boNhap();
}
if (typeof window !== 'undefined') window.addEventListener('pagehide', donHet);
// CSKH #235 (25/11/2026, Android Chrome, bật Tiết kiệm pin rồi treo máy: một vùng nền đen hẳn, bản đồ nhỏ đen hết): màn tắt / chuyển
// ứng dụng thì Chrome trên điện thoại có thể bỏ bộ nhớ GPU của canvas vẽ sẵn (mảng nền, bản đồ nhỏ, bản đổi màu); quay lại thì các tấm
// đó trống hoặc đen mà game vẫn dùng. Nên trang ẩn từ VE_LAI_S giây trở lên, lúc hiện lại dọn hết kho để mọi tấm vẽ lại từ đầu.
const VE_LAI_S = 1.5;
let anLuc = 0;
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (document.hidden) { anLuc = performance.now(); return; }
  if (anLuc && performance.now() - anLuc >= VE_LAI_S * 1000) donHet();
  anLuc = 0;
});

// Một canvas nháp dùng lại (đọc điểm ảnh một hình), không tạo mới mỗi lần
let nhap = null;
export function canvasNhap(w, h) {
  nhap ??= document.createElement('canvas');
  if (nhap.width !== w || nhap.height !== h) { nhap.width = w; nhap.height = h; }
  const g = nhap.getContext('2d', { willReadFrequently: true });
  if (g) g.clearRect(0, 0, w, h);
  return [nhap, g];
}
// Canvas nháp vẽ không ăn (Safari cấp bộ nhớ hỏng một lần là hỏng mãi): bỏ, lần sau tạo cái mới
export function boNhap() { traCanvas(nhap); nhap = null; }

// Canvas có điểm nào không trong suốt trong vùng (x, y, w, h) không. Không đọc được điểm ảnh thì coi như có.
export function coHinh(g, x, y, w, h) {
  try {
    const d = g.getImageData(x, y, w, h).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true;
    return false;
  } catch { return true; }
}
