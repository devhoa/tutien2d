// Nút CSKH nhỏ, kéo được (CSKH #286, chủ dự án 26/11/2026 chọn "Thu nhỏ nút CSKH, sát mép" và "Cho kéo nút CSKH"): nút tròn chỉ còn
// biểu tượng, nằm sát mép phải; giữ rồi kéo để dời đi chỗ khác, nhả ra thì nút hút về mép trái / phải gần hơn, chỗ đã kéo nhớ theo
// máy (localStorage p2d_cskh_cho, hỏng thì về chỗ mặc định). Kéo xong không tính là bấm. Luật né nút ✕ (cskh.js neX) vẫn giữ.
const KHOA = 'p2d_cskh_cho', NGUONG = 6;

const doc = () => { try { const v = JSON.parse(localStorage.getItem(KHOA) || 'null'); return v && Number.isFinite(v.y) ? v : null; } catch { return null; } };
const ghi = v => { try { localStorage.setItem(KHOA, JSON.stringify(v)); } catch { /* không lưu được thì thôi */ } };

// Chỗ đã kéo (y tính bằng phần màn, trái / phải): đặt lên nút; trả về top (px) để neX lấy làm gốc
export function choGoc(btn) {
  const v = doc();
  if (!v) { btn.style.left = ''; btn.style.right = ''; return ''; }
  const h = window.innerHeight, b = btn.getBoundingClientRect(), y = Math.max(4, Math.min(h - b.height - 4, v.y * h));
  if (v.trai) { btn.style.left = 'calc(env(safe-area-inset-left) + 2px)'; btn.style.right = 'auto'; }
  else { btn.style.left = ''; btn.style.right = ''; }
  return Math.round(y) + 'px';
}

export function keoCskh(btn) {
  let bat = null, keo = false;
  btn.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const b = btn.getBoundingClientRect();
    bat = { x: e.clientX, y: e.clientY, dy: e.clientY - b.top, dx: e.clientX - b.left, id: e.pointerId }; keo = false;
  });
  window.addEventListener('pointermove', e => {
    if (!bat || e.pointerId !== bat.id) return;
    if (!keo && Math.hypot(e.clientX - bat.x, e.clientY - bat.y) < NGUONG) return;
    if (!keo) { keo = true; try { btn.setPointerCapture(e.pointerId); } catch { /* */ } btn.classList.add('dang-keo'); }
    btn.style.left = Math.round(e.clientX - bat.dx) + 'px'; btn.style.right = 'auto';
    btn.style.top = Math.round(e.clientY - bat.dy) + 'px';
    e.preventDefault();
  }, { passive: false });
  const tha = e => {
    if (!bat || e.pointerId !== bat.id) return;
    bat = null;
    if (!keo) return;
    btn.classList.remove('dang-keo');
    const b = btn.getBoundingClientRect(), w = window.innerWidth, h = window.innerHeight;
    ghi({ y: Math.max(0, Math.min(1, b.top / h)), trai: b.left + b.width / 2 < w / 2 });
    btn.dataset.vuaKeo = '1'; setTimeout(() => { delete btn.dataset.vuaKeo; }, 350);   // nhả tay ra không bật bảng
    btn.style.top = choGoc(btn);
  };
  window.addEventListener('pointerup', tha); window.addEventListener('pointercancel', tha);
  btn.addEventListener('click', e => { if (btn.dataset.vuaKeo) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  return () => keo;
}
