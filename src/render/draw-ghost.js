// Bị hạ (chủ dự án 24/11/2026 00:28: "hiệu ứng bị hạ sẽ chờ 5s kể cả auto hồi sinh và khi bị hạ, cả người sẽ biến thành màu đen và héo lại";
// thay bong bóng linh hồn 09/11/2026): trong heo_s giây thân người hoá đen dần, co thấp lại, hẹp đi, gục nghiêng (draw-hero.js đọc e.heo),
// tro đen lẫn vài đốm than bốc lên; số giây còn lại trên đầu (chỉ máy mình). Người khác thấy đúng hình này qua trạng thái guc của hồ sơ phòng
// (src/render/draw-nguoi.js gọi veBiHa). Số ở data/config.json → ghost.
import { drawHero } from './draw-hero.js';

const smooth = x => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };

// Mức héo 0 → 1 sau từng ấy giây bị hạ
export const mucHeo = (game, giay) => smooth(giay / (game.data.config.ghost?.heo_s || 1.1));

// Vẽ thân bị hạ (e: thân, h: hồ sơ ngoại hình, k: mức héo)
export function veBiHa(ctx, game, e, h, k, t) {
  e.heo = k;
  let ok = false;
  try { ok = drawHero(ctx, game, e, t, false, h); } finally { e.heo = 0; }
  veTro(ctx, game, e, k, t);
  return ok;
}

// Tro bốc lên từ thân đã hoá đen: đốm 1 điểm ảnh, vài đốm than đỏ sẫm, mờ dần khi bay cao
function veTro(ctx, game, e, k, t) {
  const G = game.data.config.ghost || {}, n = G.tro ?? 10, cao = (e.top || 24) * (1 - (G.co ?? 0.42) * k);
  if (!(k > 0.05) || !n) return;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.55 + i / n) % 1, s = Math.sin(i * 12.9898) * 0.5 + 0.5, z = i % 3 ? 1 : 1.6;
    const x = e.x + (s - 0.5) * 12 + Math.sin(t * 2 + i) * 2.5 * ph, y = e.y - cao * (0.25 + 0.3 * (i % 3)) - ph * 18;
    ctx.globalAlpha = (1 - ph) * 0.6 * k;
    ctx.fillStyle = i % 4 ? '#1d1a24' : '#6a2a1e';
    ctx.fillRect(x - z / 2, y - z / 2, z, z);
  }
  ctx.restore();
}

export function drawGhost(ctx, game, t) {
  const g = game.ghost, p = game.player, G = game.data.config.ghost || {}, k = mucHeo(game, g.t);
  veBiHa(ctx, game, p, game.hoSo, k, t);
  const left = Math.max(1, Math.ceil(g.sec - g.t)), y = p.y - (p.top || 24) * (1 - (G.co ?? 0.42) * k) - 5;
  ctx.save();
  ctx.font = `bold ${G.font ?? 9}px "Unifont VN", system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.lineWidth = 2; ctx.strokeStyle = '#1b1830'; ctx.strokeText(String(left), p.x, y); ctx.fillStyle = '#e8d8d0'; ctx.fillText(String(left), p.x, y);
  ctx.restore();
}
