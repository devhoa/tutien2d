// Treo máy mà không làm gì thì rời thế giới (chủ dự án 23/11/2026 12:43: "nếu k hoạt động thì sẽ đăng xuất chứ treo máy nhưng k làm gì, nó sẽ
// bị hiệu ứng nóng máy và vẫn ghi nhận hoạt động trong khi chỉ đứng 1 chỗ"). Quá phut phút không chạm, không phím, không đi, mà cũng không Tự
// đánh, Tự hành, đả tọa, câu cá, độ kiếp, bay giữa các tinh cầu (dangBan) → còn bao_s giây thì hiện lời báo (chạm bất kỳ đâu là ở lại). Tắt màn
// (src/ui/man-toi.js) mà nhân vật chỉ đứng nghỉ cũng là treo không: màn đen vẫn giữ máy thức. Hết giờ thì lưu ngay, thôi lưu tiếp (như lúc bị đá
// sang máy khác, src/game/net-watch.js), bỏ dấu tự vào lại (src/ui/tu-vao.js) rồi tải lại trang về màn đăng nhập: máy thôi vẽ, thôi nhịp sống,
// phòng thôi đếm giờ online. Phiên đăng nhập giữ nguyên (khách mà đăng xuất là mất tài khoản), màn đăng nhập báo vì sao (bao_dang_nhap), bấm Tiếp
// tục là vào lại. Trang ẩn không tính (lúc ẩn đã không gửi nhịp), mở lại tính là có thao tác. Số và chữ ở data/config.json → treo_may.
import { boDauChoi } from '../ui/tu-vao.js';

export const KEY_TREO = 'p2d-treo-may';

export function dangBan(game) {   // đang có việc thì không tính là treo không
  return !!(game.auto || game.pilot || game.fish || game.tuCau || game.trip || game.trib?.active || game.player?.meditating);
}

// Màn đăng nhập (src/ui/login.js): vừa rời vì treo máy thì trả lời báo (một lần), không thì null
export function baoDangNhap() {
  try { const t = sessionStorage.getItem(KEY_TREO); sessionStorage.removeItem(KEY_TREO); return t || null; } catch { return null; }
}

export function startTreoMay(game, now = () => Date.now()) {
  const C = game.data.config.treo_may, q = String(globalThis.location?.search || '');
  if (!C?.on) return null;
  if (/[?&]thu=1\b/.test(q) && !/[?&]treo=1\b/.test(q)) return null;   // bài thử tự động (?thu=1) chạy lâu không chạm màn: thôi, trừ khi thêm &treo=1
  const T = C.text || {};
  let last = now(), box = null, xong = false, px = null, py = null;
  const an = () => { if (box) box.hidden = true; };
  const cham = () => { last = now(); an(); };
  for (const ev of ['pointerdown', 'pointermove', 'keydown', 'input', 'wheel', 'touchstart']) addEventListener(ev, cham, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) cham(); });

  function bao(chu) {
    if (!box) {
      box = document.createElement('div'); box.id = 'treo-may-bao';
      Object.assign(box.style, { position: 'fixed', left: '50%', top: '40%', transform: 'translate(-50%, -50%)', zIndex: '2147483001', width: 'max-content', maxWidth: '280px',
        padding: '10px 14px', borderRadius: '8px', border: '1px solid #b79bff', background: 'rgba(16, 10, 28, .92)', color: '#f3ecff',
        font: '600 13px/1.45 system-ui, sans-serif', textAlign: 'center', boxShadow: '0 0 14px rgba(150, 110, 255, .45)', pointerEvents: 'none' });
      document.body.append(box);
    }
    box.textContent = chu; box.hidden = false;
  }

  async function roi() {
    xong = true;
    bao(T.dang || '');
    try { game.persist?.(); } catch { /* vẫn rời */ }
    try { await Promise.race([game.cloud?.flush?.(), new Promise(ok => setTimeout(ok, (C.cho_luu_s || 4) * 1000))]); } catch { /* vẫn rời */ }
    game.cloud = null; game.persist = () => {};   // đã lưu xong: thôi lưu tiếp, tu-vao.js thôi ghi dấu đang chơi
    boDauChoi();
    try { sessionStorage.setItem(KEY_TREO, String(T.bao_dang_nhap || '').replace('{phut}', C.phut)); } catch { /* chế độ riêng tư */ }
    location.reload();
  }

  function tick() {
    if (xong) return;
    const p = game.player, t = now();
    if (!game.save || !p || document.hidden) { last = t; px = null; an(); return; }   // chưa vào game, trang ẩn: không tính
    if (px != null && Math.hypot(p.x - px, p.y - py) > (C.di || 2)) last = t;   // đang đi (giữ cần điều khiển, phím)
    px = p.x; py = p.y;
    if (dangBan(game)) last = t;
    const max = C.phut * 60, con = max - (t - last) / 1000;
    if (con <= 0) { roi(); return; }
    if (con <= C.bao_s) bao(String(T.bao || '').replace('{s}', Math.ceil(con))); else an();
  }
  setInterval(tick, 1000);
  return { tick, roi: () => roi() };   // bài thử gọi thẳng
}
