// Chặn trình duyệt phóng trang khi bấm nhanh liên tục (CSKH #233, 25/11/2026: iPhone bấm nút Đánh liên tục thì vùng quanh nút Đánh bị
// phóng to, che quái). Safari / Chrome trên iPhone bỏ qua user-scalable=no trong thẻ viewport và vẫn phóng khi chạm đôi; pointerdown đã
// preventDefault cũng không chặn được, phải chặn ở touchend. Nút điều khiển (data-act) và khung vẽ chỉ dùng pointer, không dùng click, nên
// chặn touchend ở đó không mất lần bấm nào. Cử chỉ hai ngón (gesturestart), chạm đôi (dblclick) cũng chặn.
const NHANH_MS = 350;   // hai lần nhấc tay cách nhau dưới mức này là chạm đôi

export function chongPhong(canvas) {
  if (typeof document === 'undefined') return;
  let truoc = 0;
  const laDieuKhien = el => el === canvas || !!el?.closest?.('[data-act], #buttons, #joy');
  document.addEventListener('touchend', e => {
    const now = performance.now();
    if (laDieuKhien(e.target) && now - truoc < NHANH_MS && e.cancelable) e.preventDefault();
    truoc = now;
  }, { passive: false, capture: true });
  for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', e => { if (laDieuKhien(e.target)) e.preventDefault(); }, { passive: false });
}
