// Chỉ chơi màn dọc (chủ dự án 23/11/2026 03:38–03:4x: "chỉ áp dụng màn hình dọc", bảng chọn "Báo xoay dọc"). Điện thoại, máy tính bảng
// (màn cảm ứng) cầm ngang: màn đen che cả game cùng chữ "Xoay dọc màn hình để chơi"; xoay dọc lại là chơi tiếp, không tải lại (game vẫn
// chạy phía sau). Máy tính đã có khung dọc cố định (src/core/khung-doc.js). Xét theo hướng của MÁY (screen.orientation), không theo khung
// nhìn, để lúc bàn phím ảo bật lên (khung nhìn thấp lại) không che nhầm.
const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

function ngang() {
  const t = screen.orientation?.type;
  if (t) return t.startsWith('landscape');
  if (typeof window.orientation === 'number') return Math.abs(window.orientation) === 90;
  const dangGo = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '');
  return !dangGo && innerWidth > innerHeight;
}

export function startXoayDoc() {
  if (!coarse || document.getElementById('xoay-doc')) return;
  const box = document.createElement('div');
  box.id = 'xoay-doc'; box.hidden = true;
  box.innerHTML = '<div class="xd-dt"></div><b></b><p></p>';
  box.querySelector('b').textContent = 'Xoay dọc màn hình để chơi';
  box.querySelector('p').textContent = 'Pixel 2D Tu Tiên chỉ chơi ở màn dọc.';
  const S = document.createElement('style');
  S.textContent = '#xoay-doc{position:fixed;inset:0;z-index:2147483000;background:#000;color:#f3ead2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;font:600 16px system-ui,sans-serif;padding:24px}'
    + '#xoay-doc[hidden]{display:none}#xoay-doc p{margin:0;font-size:13px;color:#bcb2d0}'
    + '#xoay-doc .xd-dt{width:34px;height:58px;border:3px solid #e2c07a;border-radius:7px;animation:xd-xoay 1.8s ease-in-out infinite}'
    + '@keyframes xd-xoay{0%,25%{transform:rotate(-90deg)}55%,100%{transform:rotate(0deg)}}';
  document.head.append(S); document.body.append(box);
  const xet = () => { box.hidden = !ngang(); };
  xet();
  screen.orientation?.addEventListener?.('change', xet);
  addEventListener('orientationchange', () => setTimeout(xet, 50));
  addEventListener('resize', xet);
}
