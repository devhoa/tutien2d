// Đổi cỡ màn / xoay máy (chủ dự án 23/11/2026 03:58: "lỗi nút ngay sau khi xoay ngang và xoay ngược lại, vị trí ấn và nút thực tế không khớp").
// Safari (iPhone) báo sự kiện resize khi xoay máy TRƯỚC khi innerWidth / innerHeight đổi xong, và sau đó không báo thêm: khung vẽ giữ cỡ màn
// ngang (844 × 390 điểm) trong màn dọc, tràn ra ngoài nên trang bị cuộn / phóng, chỗ chạm lệch khỏi chỗ nút. Ở đây: mỗi lần resize, xoay máy,
// khung nhìn đổi cỡ thì gọi fn ngay rồi gọi lại sau 150, 400, 900 ms (lúc cỡ thật đã ổn), và kéo trang về góc trên trái.
// Trừ lúc đang gõ chữ (chủ dự án 23/11/2026 17:25, ảnh iPhone: "Sửa bảng chat đi, k thấy chữ đang chat rồi"): bàn phím ảo bật lên làm khung
// nhìn thật (visualViewport) thấp lại và Safari tự cuộn trang cho ô gõ nổi trên bàn phím; kéo trang về góc là ô gõ chui xuống dưới bàn phím.
// Đang gõ thì không kéo về góc, khung nhìn đổi cỡ vì bàn phím thì bỏ qua; thôi gõ (bàn phím cụp) mới kéo về góc, khỏi lệch chỗ chạm.
const ds = new Set();
let hen = [];
const KHONG_GO = /^(button|checkbox|radio|range|color|file|submit|reset|image|hidden)$/i;
// Ô đang có con trỏ là ô gõ chữ (bàn phím ảo đang mở hoặc sắp mở)
export function dangGo(a = typeof document !== 'undefined' ? document.activeElement : null) {
  if (!a || a.readOnly || a.disabled) return false;
  if (a.isContentEditable || a.tagName === 'TEXTAREA') return true;
  return a.tagName === 'INPUT' && !KHONG_GO.test(a.type || 'text');
}
function veGoc() { if (!dangGo() && (scrollX || scrollY)) scrollTo(0, 0); }
function chay() { for (const fn of ds) { try { fn(); } catch { /* một nơi lỗi không chặn nơi khác */ } } }
function bao(e) {
  if (e?.currentTarget === window.visualViewport && dangGo()) return;   // bàn phím bật / tắt lúc đang gõ: không phải xoay máy
  for (const t of hen) clearTimeout(t);
  chay();
  hen = [150, 400, 900].map(ms => setTimeout(() => { veGoc(); chay(); }, ms));
}
if (typeof window !== 'undefined') {
  addEventListener('resize', bao);
  addEventListener('orientationchange', bao);
  window.visualViewport?.addEventListener('resize', bao);
  screen.orientation?.addEventListener?.('change', bao);
  // thôi gõ: Safari có lúc để trang cuộn dở sau khi bàn phím cụp, chỗ chạm lệch khỏi nút; chờ bàn phím cụp xong rồi kéo về góc
  addEventListener('focusout', () => setTimeout(veGoc, 350));
}
// fn chạy mỗi lần màn đổi cỡ / xoay (kể cả các lần gọi lại muộn). Trả hàm bỏ đăng ký.
export function onXoay(fn) { ds.add(fn); return () => ds.delete(fn); }
