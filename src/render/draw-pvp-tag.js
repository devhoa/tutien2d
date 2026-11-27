// Tên người chơi khác kèm khiên PvP ngay sau tên (chủ dự án 07/11/2026 10:52: dùng hình khiên chủ dự án gửi): còn khiên thì khiên sáng
// (ui.k-khien-bat), đã tắt khiên thì khiên kiếm chéo (ui.k-khien-tat) và tên đỏ. Hình chưa tải xong thì tạm dùng chữ 🛡 / ⚔ như cũ.
// Đang hóa ma (chủ dự án 22/11/2026 02:21: "cái khiên sẽ đổi thành hình dạng đầu lâu"): đầu lâu (ui.k-dau-lau) kèm số điểm ma bên cạnh.
// Nhãn của chính mình là nút HTML (src/ui/pvp-btn.js, pvp.css) dùng cùng các hình.
import { spriteImage } from './sprites.js';
import { maCua } from '../game/pvp-ma.js';

// ph: phong hào đứng ngay trước tên (src/game/phong-hao.js; chủ dự án 23/11/2026 22:47): chữ màu theo bậc, bậc cao phát sáng.
export function drawNameShield(ctx, game, o, ny, q, INK, color, ph) {
  const ma = maCua(o), id = !game.data.pvp ? null : ma ? 'ui.k-dau-lau' : o.pk ? 'ui.k-khien-tat' : 'ui.k-khien-bat';
  const name = o.def.name, spr = id ? game.data.art.sprites[id] : null, im = spr && spriteImage(spr);
  const txt = spr && !im ? `${name} ${ma ? '☠' : o.pk ? '⚔' : '🛡'}` : name, so = im && ma ? String(ma) : '';
  const ih = 8 * q, iw = im ? ih * spr.w / spr.h : 0, w = ctx.measureText(txt).width, sw = so ? ctx.measureText(so).width + q : 0;
  const pw = ph ? ctx.measureText(ph.chu).width + 2 * q : 0;   // phong hào + khoảng cách tới tên
  const x0 = o.x - (iw ? iw + q : 0) / 2 - sw / 2 + pw / 2;   // cả cụm phong hào + tên + khiên (+ điểm ma) canh giữa đầu
  if (ph) veHao(ctx, ph, x0 - w / 2 - pw / 2 - q, ny, q);   // tâm chữ phong hào: mép trái tên lùi khoảng cách 2q rồi lùi nửa chữ
  ctx.strokeText(txt, x0, ny); ctx.fillStyle = color; ctx.fillText(txt, x0, ny);
  if (!im) return;
  ctx.drawImage(im, 0, 0, spr.w, spr.h, x0 + w / 2 + q, ny - ih + 1.5 * q, iw, ih);
  if (so) { const sx = x0 + w / 2 + q + iw + sw / 2; ctx.strokeText(so, sx, ny); ctx.fillStyle = '#ff6a7a'; ctx.fillText(so, sx, ny); }
}

// Chữ phong hào canh giữa tại x: viền mực như tên, bậc có sang thì quầng sáng cùng màu (chỉ vài người top nên không nặng máy)
function veHao(ctx, ph, x, ny, q) {
  ctx.strokeText(ph.chu, x, ny);
  if (ph.sang) { ctx.save(); ctx.shadowColor = ph.mau; ctx.shadowBlur = 4 * q; }
  ctx.fillStyle = ph.mau; ctx.fillText(ph.chu, x, ny);
  if (ph.sang) ctx.restore();
}
