// Nút Tái tạo khi đang là Nguyên Anh (src/game/anh-the.js; chủ dự án 27/11/2026 01:1x chọn "Bấm nút Tái tạo"). Giữa màn, trên bảng dưới; hiện số giây còn
// lại trước khi tự tái tạo; bấm được sau cho_s giây. Chữ ở data/nguyen-anh.json → anh.nut.
import { taiTao } from '../game/anh-the.js';

export function createAnhBtn(game) {
  const b = document.createElement('button');
  b.id = 'btn-tai-tao'; b.type = 'button'; b.hidden = true;
  Object.assign(b.style, { position: 'fixed', left: '50%', bottom: '31%', transform: 'translateX(-50%)', zIndex: 40, padding: '9px 22px', borderRadius: '22px',
    border: '2px solid #fff2b8', background: 'linear-gradient(#ffe27a, #e0a22a)', color: '#3a2200', font: '700 16px system-ui, sans-serif',
    boxShadow: '0 0 14px rgba(255, 210, 90, 0.85), inset 0 1px 0 #fff8d8', letterSpacing: '0.5px' });
  const chu = document.createElement('span'), so = document.createElement('small');
  so.style.cssText = 'margin-left:8px;font-weight:600;opacity:.75';
  b.append(chu, so);
  b.onclick = e => { e.stopPropagation(); if (game.anh && game.anh.t >= (game.data['nguyen-anh']?.anh?.cho_s ?? 2)) { taiTao(game); game.sfx?.('click'); } };
  for (const ev of ['pointerdown', 'touchstart']) b.addEventListener(ev, e => e.stopPropagation(), { passive: true });   // không lọt xuống cần gạt
  document.body.append(b);
  let cu = '';
  setInterval(() => {
    const G = game.anh, A = game.data['nguyen-anh']?.anh || {};
    b.hidden = !G;
    if (!G) return;
    const con = Math.max(0, Math.ceil((A.giu_s ?? 30) - G.t)), san = G.t >= (A.cho_s ?? 2), k = `${con}|${san}`;
    if (k === cu) return;
    cu = k; chu.textContent = A.nut || 'Tái tạo'; so.textContent = String(con);
    b.disabled = !san; b.style.opacity = san ? '1' : '0.55';
  }, 100);
}
