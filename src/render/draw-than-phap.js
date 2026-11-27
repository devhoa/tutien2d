// Vẽ Thân pháp (src/game/than-phap*.js tính chỗ, giờ; docs/17-THAN-PHAP.md): mọi nhát, mọi thức vẽ bằng CHÍNH HÌNH VŨ KHÍ người diễn đang cầm
// (hồ sơ: draw-flyweapon.js hoSoSprite), thêm vệt sáng cộng sáng, vòng sóng, hạt sáng. Vẽ ở lớp trên cùng (src/render/draw.js), trên cả lớp tối ban đêm,
// nên ánh kiếm sáng rõ trong đêm. Tệp này: công cụ vẽ chung, đâm, xuyên, Vạn Ảnh, Thu Võng; bốn thức lớn ở draw-than-phap2.js.
import { vuKhi, bongVk, vet, vong, quang, ease, lerp, kep } from './draw-tp-cu.js';
import { VE2 } from './draw-than-phap2.js';
import { VE3 } from './draw-than-phap3.js';   // Vạn Diệp Quy Căn
import { VE4 } from './draw-than-phap4.js';   // Vạn Kiếm Quy Trủng, Bách Luyện Thiên Chùy (truyện Thiên Kim)

// Hạt sáng của màn diễn (than-phap-cu.js hat): màu tối (hắc khí) vẽ đè, màu sáng cộng sáng
function veHat(ctx, I) {
  if (!I.hat.length) return;
  ctx.save();
  for (const q of I.hat) {
    const k = q.t / q.life, s = q.s;
    ctx.globalCompositeOperation = q.c < '#4' ? 'source-over' : 'lighter';
    ctx.globalAlpha = (1 - k) * (q.c < '#4' ? 0.75 : 1); ctx.fillStyle = q.c;
    ctx.fillRect(Math.round(q.x - s / 2), Math.round(q.y - s / 2), s, s);
  }
  ctx.restore();
}

const VE = {
  dam(ctx, game, I) {   // vệt đâm: tia sáng dài vụt ra theo mũi vũ khí, vòng nổ nhỏ ở mũi
    const t = I.t; if (t < 0.07) return;
    const k = kep((t - 0.07) / 0.08), f = kep((t - 0.15) / 0.19), L = I.L * k, x2 = I.x + I.ca * L, y2 = I.y + I.sa * L;
    vet(ctx, I.x + I.ca * 6, I.y + I.sa * 6, x2, y2, 3.4 * (1 - f) + 0.8, I.mau, 1 - f);
    if (t > 0.12) vong(ctx, x2, y2, 4 + 16 * ease(f), 1.8, I.mau, (1 - f) * 0.9, 1);
  },
  xuyen(ctx, game, I) {   // vũ khí xuyên qua xuyên lại: đường xuyên sáng lên mỗi lượt, bóng vũ khí nối đuôi
    const t = I.t, ex = I.x + I.ca * I.L, ey = I.y + I.sa * I.L, het = I.t0 + I.g * I.qua.length;
    const nhip = I.qua.reduce((a, q) => (t >= q.t ? Math.max(a, 1 - (t - q.t) / 0.16) : a), 0), tan = kep((t - het) / 0.24);
    vet(ctx, I.x, I.y, ex, ey, 1.6 + 3.2 * nhip, I.mau, (0.35 + 0.65 * nhip) * (1 - tan));
    if (t < het) {
      (I.vet || []).forEach((q, i) => { if (i) bongVk(ctx, game, I, q.x, q.y, I.wa, 1.2, 0.5 - i * 0.07, I.mau); });
      vuKhi(ctx, game, I, I.wx, I.wy, I.wa, 1.25, 1, I.mau, 0.7);
    }
  },
  'anh-kiem'(ctx, game, I) {   // sáu bản sao: hiện ra sau lưng thành hình quạt, lần lượt lao vào mục tiêu, vỡ thành mảnh sáng
    const t = I.t, e = I.e;
    if (t < 0.16) { quang(ctx, I.x, I.y, 14 + 60 * t, I.mau, (1 - t / 0.16) * 0.7); vong(ctx, I.x, I.y, 8 + 170 * t, 2, '#ffffff', 1 - t / 0.16); }
    I.ban.forEach((b, i) => {
      if (t < b.ta) return;
      const hx = e.x + b.hx, hy = e.y + b.hy + Math.sin(t * 11 + i) * 1.3, q = b.q, aT = Math.atan2(q.y - hy, q.x - hx);
      if (t < b.tl) {   // đứng chờ sau lưng, mũi chĩa về mục tiêu, nhấp nháy
        const v = kep((t - b.ta) / 0.07);
        if (v < 1) vong(ctx, hx, hy, 3 + 9 * v, 1.2, '#ffffff', 1 - v, 1);
        bongVk(ctx, game, I, hx, hy, aT, 1.35, 0.22 + 0.12 * Math.sin(t * 20 + i), I.mau);
        vuKhi(ctx, game, I, hx, hy, aT, 1.25, 0.9 * v, I.mau, 0.32);
        return;
      }
      const k = kep((t - b.tl) / 0.11);
      if (k < 1) {   // lao: nhanh dần, vệt sáng nối từ chỗ đứng
        const kk = k * k, x = lerp(hx, q.x, kk), y = lerp(hy, q.y, kk);
        vet(ctx, lerp(hx, q.x, Math.max(0, kk - 0.45)), lerp(hy, q.y, Math.max(0, kk - 0.45)), x, y, 2.8, I.mau, 0.9);
        bongVk(ctx, game, I, x, y, aT, 1.45, 0.4, I.mau);
        vuKhi(ctx, game, I, x, y, aT, 1.3, 0.95, I.mau, 0.4);
        return;
      }
      const f = kep((t - b.tl - 0.11) / 0.2);   // trúng: vòng nổ, tia chéo
      vong(ctx, q.x, q.y, 6 + 26 * ease(f), 2.2, I.mau, 1 - f, 0.7);
      vet(ctx, q.x - Math.cos(aT + 0.8) * 9 * (1 - f), q.y - Math.sin(aT + 0.8) * 9 * (1 - f), q.x + Math.cos(aT + 0.8) * 9 * (1 - f), q.y + Math.sin(aT + 0.8) * 9 * (1 - f), 1.4, '#ffffff', 1 - f, 0);
    });
  },
  'thu-vong'(ctx, game, I) {   // lưới sao: tám bản sao trên vành lưới, dây lưới nối vành và nan hoa, lưới co lại khi kéo về
    const t = I.t, n = 8, cx = I.cx, cy = I.cy, r = I.rr, quay = t * 1.3;
    if (t < 0.2) { vuKhi(ctx, game, I, cx, cy, t * 28, 1.25, 1, I.mau, 0.7); vet(ctx, lerp(I.x, cx, 0.5), lerp(I.y, cy, 0.5), cx, cy, 1.4, I.mau, 0.6); return; }
    const het = t > 1.1 ? kep((t - 1.1) / 0.3) : 0, al = 1 - het, pts = [];
    for (let i = 0; i < n; i++) { const a = quay + i / n * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.66, a]); }
    quang(ctx, cx, cy, r * 1.1, I.mau, 0.13 * al, 0.66);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
    for (const [w, c, a2] of [[3, I.mau, 0.55], [0.9, '#e8fbff', 0.5]]) {   // vành ngoài, vành trong, nan hoa
      ctx.globalAlpha = a2 * al; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      pts.forEach(([x, y]) => { ctx.moveTo(cx, cy); ctx.lineTo(x, y); });
      pts.forEach(([x, y], i) => { const hx = lerp(cx, x, 0.5), hy = lerp(cy, y, 0.5); if (i) ctx.lineTo(hx, hy); else ctx.moveTo(hx, hy); }); ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
    pts.forEach(([x, y, a], i) => { quang(ctx, x, y, 4, '#e8fbff', (0.3 + 0.3 * Math.sin(t * 18 + i * 1.7)) * al); vuKhi(ctx, game, I, x, y, a, 1.05, 0.9 * al, I.mau, 0.35); });
    if (t > 0.36 && t < 1.15) for (const m of I.bat) if (!m.dead) vong(ctx, m.x, m.y - 2, (m.r || 6) + 3, 1, '#e8fbff', 0.55 + 0.3 * Math.sin(t * 20), 0.6);
  },
};

export function drawThanPhap(ctx, game) {
  const L = game.tpFx;
  if (!L?.length) return;
  for (const I of L) {
    if (I.map !== game.map?.id) continue;
    const f = VE[I.kind] || VE2[I.kind] || VE3[I.kind] || VE4[I.kind];
    if (f) f(ctx, game, I);
    veHat(ctx, I);
  }
}
