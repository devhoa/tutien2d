// Vẽ cơ duyên (src/game/co-duyen.js) và hiệu ứng tọa vong (src/game/toa-vong.js). Chủ dự án 25/11/2026 10:08.
// Cơ duyên: hình món (ui.vk-<mã>) thu nhỏ đặt trên tán cây / mặt đất, quầng sáng thở, vài đốm sáng bay lên, cột sáng mảnh cho dễ thấy.
// Tọa vong: người đang đả tọa có dược lực (mình: save.toaVong; người khác: hồ sơ st 'tv') thì linh khí từ bốn phía xoáy vào người,
// vòng sáng co dần về đan điền ("có hiệu ứng hấp thu linh khí"). Mọi thứ tính theo đồng hồ t, không giữ trạng thái.
import { spriteImage } from './sprites.js';
import { toaVongCon } from '../game/toa-vong.js';

const nho = new Map();
function hinh(spr, px) {   // thu hình to về tấm nhỏ một lần rồi giữ
  const key = spr.file + '|' + px;
  let c = nho.get(key);
  if (c) return c;
  const im = spriteImage(spr);
  if (!im) return null;
  const k = px / Math.max(spr.w, spr.h), w = Math.max(1, Math.round(spr.w * k)), h = Math.max(1, Math.round(spr.h * k));
  c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(im, 0, 0, spr.w, spr.h, 0, 0, w, h);
  nho.set(key, c);
  return c;
}
const rgba = (c, a) => { const n = parseInt(String(c).slice(1, 7), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`; };

export function drawCoDuyen(ctx, game, t) {
  const S = game.data.art.sprites, M = game.data.cave.materials;
  for (const q of game.coDuyen || []) {
    if (!Number.isFinite(q.qx + q.qy)) continue;
    const x = Math.round(q.qx), y = Math.round(q.qy + Math.sin(t * 2.2 + q.qx) * 1.2), mau = M[q.id]?.color || '#ffd56a', tho = 0.5 + 0.5 * Math.sin(t * 3 + q.qx);
    ctx.save();
    const b = ctx.createLinearGradient(0, y, 0, y - 78);   // cột sáng: thấy được từ xa, cả trên nền sáng
    b.addColorStop(0, rgba(mau, 0.55)); b.addColorStop(0.5, rgba('#ffffff', 0.22)); b.addColorStop(1, rgba(mau, 0));
    ctx.fillStyle = b; ctx.fillRect(x - 2, y - 78, 4, 78);
    const g = ctx.createRadialGradient(x, y - 5, 0, x, y - 5, 15 + tho * 4);   // quầng sáng thở
    g.addColorStop(0, rgba('#fff6d0', 0.75)); g.addColorStop(0.45, rgba(mau, 0.38)); g.addColorStop(1, rgba(mau, 0));
    ctx.fillStyle = g; ctx.fillRect(x - 20, y - 25, 40, 40);
    ctx.strokeStyle = rgba('#fff3c4', 0.35 + 0.4 * tho); ctx.lineWidth = 1;   // vòng sáng co giãn
    ctx.beginPath(); ctx.arc(x, y - 5, 9 + tho * 3, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 4; i++) {   // tia sao bốn cánh quay chậm
      const a = t * 0.9 + i * Math.PI / 2, r = 12 + tho * 4;
      ctx.strokeStyle = rgba('#ffffff', 0.5 + 0.3 * tho); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 7, y - 5 + Math.sin(a) * 7); ctx.lineTo(x + Math.cos(a) * r, y - 5 + Math.sin(a) * r); ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {   // đốm sáng bay lên
      const ph = (t * 0.5 + i / 6) % 1, dx = Math.sin(i * 2.4 + t * 1.3) * 8;
      ctx.fillStyle = rgba(i % 2 ? '#ffffff' : mau, (1 - ph) * 0.95); ctx.fillRect(Math.round(x + dx), Math.round(y - 5 - ph * 30), 2, 2);
    }
    ctx.restore();
    const spr = S['ui.vk-' + q.id], c = spr && hinh(spr, 32);
    if (c) { const s = 14, w = c.width * s / 32, h = c.height * s / 32; ctx.drawImage(c, Math.round(x - w / 2), Math.round(y - h + 2), w, h); }
    else { ctx.fillStyle = mau; ctx.fillRect(x - 3, y - 7, 6, 6); }
  }
  for (const f of game.coDuyenFx || []) {   // chớp sáng lúc hái
    const k = f.t / 0.8;
    ctx.save(); ctx.strokeStyle = rgba('#fff6d0', 1 - k); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(f.x, f.y - 5, 4 + k * 26, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = rgba(f.mau, (1 - k) * 0.8); ctx.beginPath(); ctx.arc(f.x, f.y - 5, 2 + k * 16, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}

// Linh khí xoáy vào người đang tọa vong. e: thân (x, y); N đốm đi theo đường xoắn co dần, vòng sáng co về đan điền. Không dùng
// phép cộng sáng (nền sân đá sáng nuốt hết): đốm có viền tối, vẽ thường.
function hut(ctx, e, t, F) {
  const x = e.x, y = e.y - 9, N = F.hat || 36, mau = F.mau || ['#7ad0ff', '#bff4ff', '#ffffff'], V = F.vong || 3;
  ctx.save();
  const g = ctx.createRadialGradient(x, y + 2, 0, x, y + 2, 26);   // quầng lam quanh người, sáng nhịp thở
  g.addColorStop(0, rgba(mau[1], 0.5 + 0.15 * Math.sin(t * 4))); g.addColorStop(0.5, rgba(mau[0], 0.22)); g.addColorStop(1, rgba(mau[0], 0));
  ctx.fillStyle = g; ctx.fillRect(x - 26, y - 24, 52, 52);
  for (let k = 0; k < V; k++) {   // vòng sáng co dần về đan điền
    const ph = (t * 0.45 + k / V) % 1, r = 46 * (1 - ph) + 5;
    ctx.strokeStyle = rgba(k % 2 ? mau[1] : mau[0], 0.2 + ph * 0.7); ctx.lineWidth = 1 + ph;
    ctx.beginPath(); ctx.ellipse(x, y + 7, r, r * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
  }
  for (let i = 0; i < N; i++) {   // dòng linh khí xoắn từ bốn phía vào người: đốm 2 điểm có đuôi
    const ph = (t * 0.5 + i / N + (i * 0.37) % 1) % 1, r = 64 * (1 - ph) ** 1.2 + 4, a = i * 2.39996 + t * 0.8 + ph * 5.5, c = mau[i % mau.length];
    const px = x + Math.cos(a) * r, py = y + 2 + Math.sin(a) * r * 0.62, al = Math.min(1, ph * 4);
    for (let d = 1; d <= 3; d++) {   // đuôi mờ dần phía ngoài
      const rr = r + d * 3.2, aa = a - d * 0.09;
      ctx.fillStyle = rgba(c, al * (0.5 - d * 0.13)); ctx.fillRect(Math.round(x + Math.cos(aa) * rr), Math.round(y + 2 + Math.sin(aa) * rr * 0.62), 1, 1);
    }
    ctx.fillStyle = rgba('#1c5a8a', al * 0.55); ctx.fillRect(Math.round(px), Math.round(py) + 1, 2, 2);   // viền tối: thấy được trên nền sáng
    ctx.fillStyle = rgba(c, al); ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
  }
  for (let i = 0; i < 5; i++) {   // linh khí bốc lên từ đỉnh đầu
    const ph = (t * 0.7 + i / 5) % 1;
    ctx.fillStyle = rgba('#ffffff', (1 - ph) * 0.9); ctx.fillRect(Math.round(x + Math.sin(i * 1.9 + t * 2) * 5), Math.round(y - 8 - ph * 20), 1, 2);
  }
  ctx.restore();
}

export function drawToaVong(ctx, game, t) {
  const F = game.data['co-duyen']?.toa_vong?.fx;
  if (!F) return;
  const p = game.player;
  if (p?.meditating && toaVongCon(game) > 0 && Number.isFinite(p.x + p.y)) hut(ctx, p, t, F);
  for (const o of game.others?.visible?.() || []) if (o.toaVong && o.meditating && Number.isFinite(o.x + o.y)) hut(ctx, o, t, F);
}
