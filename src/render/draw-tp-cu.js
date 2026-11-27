// Công cụ vẽ chung của Thân pháp (src/render/draw-than-phap.js, draw-than-phap2.js; docs/17-THAN-PHAP.md): vũ khí của người diễn (đúng hình đang cầm,
// hoSoSprite), bóng sáng của vũ khí, đường sáng, vòng, quầng. Mọi thứ sáng vẽ cộng sáng ('lighter').
import { hoSoSprite, blit } from './draw-flyweapon.js';
import { tintedImage } from './sprites.js';
import { heroLook } from './draw-hero.js';

export const ease = k => 1 - (1 - k) * (1 - k);
export const lerp = (a, b, k) => a + (b - a) * k;
export const kep = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const OFF = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Vũ khí của người diễn tại (x, y), mũi chĩa hướng a, k lần cỡ vũ khí bay thường, al độ đậm; mau: quầng phủ màu cộng sáng (gl độ sáng quầng)
export function vuKhi(ctx, game, I, x, y, a, k = 1, al = 1, mau = null, gl = 0.55) {
  if (al <= 0.01) return;
  const W = I.ws === undefined ? (I.ws = hoSoSprite(game, I.h) || null) : I.ws, kk = k * (I.k0 ??= heroLook(game, I.h || undefined)?.fw_scale || game.data.heroes.fly.scale);
  ctx.save();
  if (!W?.im) {   // chưa có hình (đang tải): một lưỡi sáng thay chỗ
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al; ctx.strokeStyle = mau || '#ffffff'; ctx.lineWidth = 2 * k; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 9 * k, y - Math.sin(a) * 9 * k); ctx.lineTo(x + Math.cos(a) * 9 * k, y + Math.sin(a) * 9 * k); ctx.stroke(); ctx.restore(); return;
  }
  if (mau && gl > 0) {
    const g = tintedImage(W.spr, W.im, mau);
    if (g) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al * gl; const o = Math.max(1, k * 0.8); for (const [ox, oy] of OFF) blit(ctx, W, g, x + ox * o, y + oy * o, a, kk); }
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = al;
  blit(ctx, W, W.im, x, y, a, kk);
  ctx.restore();
}
// Bóng sáng của vũ khí (chỉ màu, cộng sáng): bản sao bằng linh quang, bóng mờ phía sau lúc lao
export function bongVk(ctx, game, I, x, y, a, k, al, mau) {
  const W = I.ws === undefined ? (I.ws = hoSoSprite(game, I.h) || null) : I.ws;
  if (!W?.im || al <= 0.01) return;
  const g = tintedImage(W.spr, W.im, mau);
  if (!g) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al;
  blit(ctx, W, g, x, y, a, k * (I.k0 ??= heroLook(game, I.h || undefined)?.fw_scale || game.data.heroes.fly.scale));
  ctx.restore();
}
// Đường sáng: lớp màu dày cộng sáng + lõi trắng mảnh
export function vet(ctx, x1, y1, x2, y2, w, mau, al, loi = 0.45) {
  if (al <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  ctx.globalAlpha = al * 0.55; ctx.strokeStyle = mau; ctx.lineWidth = w * 1.8; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.globalAlpha = al; ctx.lineWidth = w; ctx.stroke();
  if (loi > 0) { ctx.globalAlpha = al * 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(0.6, w * loi); ctx.stroke(); }
  ctx.restore();
}
// Vòng (bầu dục dẹt theo góc nhìn chéo xuống: sq), có thể chỉ một cung
export function vong(ctx, x, y, r, w, mau, al, sq = 0.62, a0 = 0, a1 = Math.PI * 2) {
  if (al <= 0.01 || r <= 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al; ctx.strokeStyle = mau; ctx.lineWidth = w;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * sq, 0, a0, a1); ctx.stroke(); ctx.restore();
}
// Quầng tròn mềm (cộng sáng)
export function quang(ctx, x, y, r, mau, al, sq = 1) {
  if (al <= 0.01 || r <= 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al; ctx.translate(x, y); ctx.scale(1, sq);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, mau); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
