// Vẽ bốn thức lớn của Thân pháp (chỗ, giờ tính ở src/game/than-phap-thuc2.js; công cụ vẽ ở draw-tp-cu.js; docs/17-THAN-PHAP.md):
// Thiên Kiếm Trấn, Liệp Phong Bách Thứ, Huyền Vực Tỏa Hồn, Khai Thiên Nhất Trảm. Vũ khí trong mọi thức là đúng hình vũ khí người diễn đang cầm.
import { vuKhi, bongVk, vet, vong, quang, ease, lerp, kep } from './draw-tp-cu.js';

// Trời tối lại một chút quanh chỗ thức đang diễn (đè lên cảnh, dưới ánh kiếm)
function toiTroi(ctx, game, al) {
  const v = game.screen?.viewRect?.();
  if (!v || al <= 0.01) return;
  ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = '#0a0818'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore();
}
// Bề dài thanh vũ khí trên màn ở cỡ k (ước theo hình vũ khí bay: 22 điểm × cỡ vũ khí bay): đặt mũi kiếm khổng lồ đúng chỗ cắm
const daiVk = (game, I, k) => 20 * k * (I.k0 || game.data.heroes.fly.scale);

export const VE2 = {
  'thien-tran'(ctx, game, I) {
    const t = I.t, d = I.d, px = I.px, py = I.py, to = d.to * (I.lon ?? 1);
    if (t < 0.85) toiTroi(ctx, game, 0.24 * kep((t - 0.2) / 0.2) * (1 - kep((t - 0.74) / 0.11)));
    if (t < 0.3) {   // vút lên trời: vệt sáng thẳng đứng
      const k = ease(kep(t / 0.28)), y = I.y - k * 200;
      vet(ctx, I.x, I.y - 6, I.x, y + 10, 2.4, I.mau, 0.9 * (1 - kep((t - 0.22) / 0.08)));
      vuKhi(ctx, game, I, I.x, y, -Math.PI / 2, 1.1 + k * 0.6, 1 - kep((t - 0.24) / 0.06), I.mau, 0.8);
    }
    if (t >= 0.28 && t < 0.78) {   // ấn trận ở chỗ sẽ cắm: vòng lớn dần, vạch ấn xoay, cột sáng mờ từ trời
      const k = ease(kep((t - 0.28) / 0.34)), r = d.r * (0.35 + 0.65 * k), q = t * 2.4, al = 0.85 * (1 - kep((t - 0.74) / 0.04));
      quang(ctx, px, py, r * 1.15, I.mau, 0.28 * k * al, 0.6);
      vong(ctx, px, py, r, 1.6, I.mau, al); vong(ctx, px, py, r * 0.62, 1, '#ffffff', al * 0.7);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al; ctx.strokeStyle = I.mau; ctx.lineWidth = 1.4; ctx.beginPath();
      for (let i = 0; i < 12; i++) { const a = q + i / 12 * Math.PI * 2; ctx.moveTo(px + Math.cos(a) * r * 0.72, py + Math.sin(a) * r * 0.72 * 0.62); ctx.lineTo(px + Math.cos(a) * r * 0.94, py + Math.sin(a) * r * 0.94 * 0.62); }
      ctx.stroke(); ctx.restore();
      vet(ctx, px, py - 230, px, py, 6 + 8 * k, I.mau, 0.12 + 0.16 * k, 0.2);
    }
    const len = daiVk(game, I, to);
    if (t >= 0.6 && t < 0.74) {   // kiếm khổng lồ lao xuống, mũi chúc đất, vệt gió phía trên
      const f = kep((t - 0.6) / 0.14), tip = lerp(py - 300, py, f * f), cy = tip - len * 0.46;
      for (let i = -2; i <= 2; i++) vet(ctx, px + i * len * 0.07, cy - len * 1.2, px + i * len * 0.07, cy - len * 0.3, 1.4, I.mau, 0.55);
      for (let j = 3; j >= 1; j--) bongVk(ctx, game, I, px, cy - j * len * 0.22, Math.PI / 2, to, 0.42 - j * 0.1, I.mau);   // bóng kiếm nối đuôi lúc lao xuống
      vuKhi(ctx, game, I, px, cy, Math.PI / 2, to, 1, I.mau, 0.9);
    }
    if (t >= 0.74) {   // cắm xuống: vòng sóng, vết nứt sáng, hố tối; kiếm cắm lại làm mốc rồi tan thành đốm sáng
      const a = t - 0.74, tan = kep((t - 1.25) / 0.4), sk = 1 - 0.35 * tan;
      ctx.save(); ctx.globalAlpha = 0.4 * (1 - kep(a / 0.9)); ctx.fillStyle = '#14100a'; ctx.beginPath(); ctx.ellipse(px, py, 15, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      for (let j = 0; j < 3; j++) { const b = a - j * 0.07, rr = b * 280; if (b > 0 && rr < 130) vong(ctx, px, py, rr, 2.6 - j * 0.6, j ? I.mau : '#ffffff', 1 - rr / 130, 0.55); }
      const nf = 1 - kep(a / 0.85);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
      for (const [w, c, k2] of [[3.6, I.mau, 0.85], [1.3, '#ffffff', a < 0.25 ? 1 : 0.45]]) {
        ctx.globalAlpha = nf * k2; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
        for (const pts of I.nut) pts.forEach(([x, y], i) => (i ? ctx.lineTo(px + x, py + y) : ctx.moveTo(px + x, py + y)));
        ctx.stroke();
      }
      ctx.restore();
      if (a < 0.12) quang(ctx, px, py, 70, '#ffffff', 0.85 * (1 - a / 0.12), 0.6);
      if (a < 0.6) { const k = a / 0.6; vong(ctx, px, py + 2, 20 + 70 * ease(k), 5 * (1 - k) + 1, '#b8a888', 0.5 * (1 - k), 0.45); }   // vòng bụi đất bung ra
      const al = 1 - tan, cy = py - len * 0.46 * sk + 2 + Math.min(2, a * 8);
      vong(ctx, px, py, 18 + 3 * Math.sin(t * 6), 1.2, I.mau, 0.7 * al, 0.55, t * 2, t * 2 + Math.PI * 1.6);
      vuKhi(ctx, game, I, px, cy, Math.PI / 2, to * sk, al, I.mau, 0.5 + 0.25 * Math.sin(t * 9));
    }
  },
  'bach-thu'(ctx, game, I) {
    const t = I.t, d = I.d, e = I.e, ox = e.x, oy = e.y - 8;
    if (t < 0.1) {   // lấy đà: vũ khí rút về sau, gió dồn lại phía trước
      const k = t / 0.1;
      for (let i = -2; i <= 2; i++) { const a = I.dir + i * 0.28, r1 = lerp(60, 14, k); vet(ctx, ox + Math.cos(a) * r1, oy + Math.sin(a) * r1, ox + Math.cos(a) * (r1 + 14), oy + Math.sin(a) * (r1 + 14), 1, I.mau, 0.6 * k, 0); }
      vuKhi(ctx, game, I, ox - I.ca * 8 * k, oy - I.sa * 8 * k, I.dir, 1, 1, I.mau, 0.6);
      return;
    }
    if (t < I.cuoi.t + 0.1) {   // quạt gió phía trước: khoá được con mồi thì hẹp lại, quay theo hướng nó
      const h = I.huong ?? I.dir, w = d.goc * Math.PI / 180 * (I.moi && !I.moi.dead ? 0.6 : 1.2);
      vong(ctx, ox, oy, d.tam, 1, I.mau, 0.14, 0.62, h - w, h + w);
    }
    let cur = null;
    for (const n of I.nhat) {   // mỗi nhát đâm: vệt sáng vụt ra, bóng vũ khí ở mũi tắt dần
      const a = t - n.t; if (a < 0 || a > 0.16) continue;
      const k = a / 0.16, r = Math.min(1, a / 0.03), x2 = ox + Math.cos(n.a) * n.L * r, y2 = oy + Math.sin(n.a) * n.L * r;
      vet(ctx, ox + Math.cos(n.a) * 6, oy + Math.sin(n.a) * 6, x2, y2, 2.3 * (1 - k) + 0.5, I.mau, 1 - k, 0.5);
      if (k < 0.4) bongVk(ctx, game, I, x2, y2, n.a, 1.2, (1 - k / 0.4) * 0.7, I.mau);
      if (a < 0.03) cur = { x: x2, y: y2, a: n.a };
    }
    const c = I.cuoi, a = t - c.t;
    if (a >= 0 && a < 0.3) {   // nhát cuối: vệt to, vòng nổ ở mũi, tia gió toả
      const k = a / 0.3, x2 = ox + Math.cos(c.a) * c.L * Math.min(1, a / 0.04), y2 = oy + Math.sin(c.a) * c.L * Math.min(1, a / 0.04);
      vet(ctx, ox, oy, x2, y2, 5.6 * (1 - k) + 0.8, I.mau, 1 - k, 0.5);
      vong(ctx, x2, y2, 6 + 30 * ease(k), 2.4, '#ffffff', 1 - k, 0.8);
      vong(ctx, x2, y2, 3 + 20 * ease(k), 1.8, I.mau, 1 - k, 0.8);
      if (a < 0.08) cur = { x: x2, y: y2, a: c.a };
    }
    if (cur) vuKhi(ctx, game, I, cur.x, cur.y, cur.a, 1.25, 1, I.mau, 0.75);
    else if (t < I.an) vuKhi(ctx, game, I, ox + I.ca * 14, oy + I.sa * 14, I.dir, 1, 0.85, I.mau, 0.5);
  },
  'huyen-vuc'(ctx, game, I) {
    const t = I.t, d = I.d, px = I.px, py = I.py, r = I.rv, sq = 0.62;
    if (t > 0.2 && t < 1.5) toiTroi(ctx, game, 0.16 * kep((t - 0.2) / 0.2) * (1 - kep((t - 1.3) / 0.2)));
    if (r > 1) {   // vùng hắc khí: lõi đen đặc, mép tím, vành đỏ thẫm xoay đứt quãng, vệt khói cuộn
      ctx.save(); ctx.translate(px, py); ctx.scale(1, sq);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, 'rgba(6,2,12,0.74)'); g.addColorStop(0.65, 'rgba(22,8,40,0.6)'); g.addColorStop(1, 'rgba(40,10,70,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.85; ctx.strokeStyle = '#2a0f44'; ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) { const q = -t * (1.6 + i * 0.4) + i * 1.7, rr = r * (0.35 + i * 0.16); ctx.beginPath(); ctx.arc(0, 0, rr, q, q + 1.9); ctx.stroke(); }
      ctx.restore();
      vong(ctx, px, py, r, 2.6, I.mau, 0.85, sq);
      ctx.save(); ctx.setLineDash([5, 7]); ctx.lineDashOffset = -t * 40; vong(ctx, px, py, r * 1.06, 1, '#ff3d7e', 0.7, sq); ctx.restore();
    }
    if (t > 0.42 && t < 1.36) for (const q of I.tg) {   // dấu khoá trên đầu mục tiêu
      const x = q.x, y = q.y, s = 8 + 2 * Math.sin(t * 16), a = t * 5;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.85; ctx.strokeStyle = '#ff3d7e'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i < 4; i++) { const b = a + i * Math.PI / 2; ctx.moveTo(x + Math.cos(b) * s, y + Math.sin(b) * s); ctx.lineTo(x + Math.cos(b + Math.PI / 2) * s, y + Math.sin(b + Math.PI / 2) * s); }
      ctx.stroke(); ctx.restore();
    }
    for (const c of I.chem) {   // mỗi nhát chém: dải hắc khí dày, viền tím sáng, lõi trắng lúc vừa chém; dấu chém chéo trên mục tiêu
      const a = t - c.t; if (a < 0 || a > 0.3) continue;
      const k = a / 0.3;
      ctx.save(); ctx.lineCap = 'round'; ctx.globalAlpha = 0.85 * (1 - k); ctx.strokeStyle = '#1c0a30'; ctx.lineWidth = 12 * (1 - k) + 1;
      ctx.beginPath(); ctx.moveTo(c.x1, c.y1); ctx.lineTo(c.x2, c.y2); ctx.stroke(); ctx.restore();
      vet(ctx, c.x1, c.y1, c.x2, c.y2, 3.2 * (1 - k) + 0.8, '#b07cff', 1 - k, a < 0.07 ? 0.6 : 0);
      const s = 11 * (1 - k * 0.6), ag = Math.atan2(c.y2 - c.y1, c.x2 - c.x1) + Math.PI / 2;   // dấu chém chéo đỏ thẫm trên mục tiêu
      vet(ctx, c.hx - Math.cos(ag) * s, c.hy - Math.sin(ag) * s, c.hx + Math.cos(ag) * s, c.hy + Math.sin(ag) * s, 1.8, '#ff3d7e', 1 - k, a < 0.1 ? 0.7 : 0.2);
      if (a < 0.1) quang(ctx, c.hx, c.hy, 14, '#d8b8ff', 0.7 * (1 - a / 0.1));
    }
    if (t < I.an) { if (t < 0.2) vet(ctx, I.x, I.y, I.wx, I.wy, 1.6, I.mau, 0.5); vuKhi(ctx, game, I, I.wx, I.wy, I.wa, 1.3, 1, I.mau, 0.75); }
    if (t > 1.48 && t < 1.7) { const k = (t - 1.48) / 0.22; vong(ctx, px, py, 6 + 60 * ease(k), 2.2, '#d8b8ff', 1 - k, sq); quang(ctx, px, py, 30, '#b07cff', 0.6 * (1 - k), sq); }
  },
  'khai-thien'(ctx, game, I) {
    const t = I.t, d = I.d, e = I.e, ox = e.x, oy = e.y - 8;
    if (t < 0.34) {   // tụ lực: vũ khí vút lên trên đầu, lớn dần, quầng sáng và vòng dưới chân
      const k = ease(kep(t / 0.32)), y = oy - 26 - 8 * k;
      toiTroi(ctx, game, 0.12 * k);
      quang(ctx, ox, y, 18 + 26 * k, I.mau, 0.35 * k);
      vong(ctx, ox, e.y, 10 + 8 * k + Math.sin(t * 30), 1.2, I.mau, 0.7 * k, 0.5);
      vet(ctx, ox, y + 6, ox, y - 120, 3 + 4 * k, I.mau, 0.15 * k, 0.2);
      vuKhi(ctx, game, I, ox, y, -Math.PI / 2, 1 + 2.2 * k * (I.lon ?? 1), 1, I.mau, 0.5 + 0.4 * k);
      return;
    }
    if (t < 0.46) {   // vung: vũ khí khổng lồ quét một cung trước mặt, vệt lưỡi liềm dày
      const k = ease(kep((t - 0.34) / 0.1)), a0 = I.dir - 1.25, a = lerp(a0, I.dir + 1.25, k), R = 26;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (const [w, c, al] of [[16, I.mau, 0.45], [8, I.mau, 0.8], [3, '#ffffff', 0.95]]) { ctx.globalAlpha = al; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(ox, oy, R + 16, (R + 16) * 0.7, 0, a0, a); ctx.stroke(); }
      ctx.restore();
      vuKhi(ctx, game, I, ox + Math.cos(a) * R, oy + Math.sin(a) * R * 0.7, a, 3.2 * (I.lon ?? 1), 1, I.mau, 0.9);
    }
    if (I.sx != null) {   // vầng kiếm quang lan đi, vết chém sáng trên đất
      const S = I.song, tan = kep((t - I.t0 - d.dai / I.v) / 0.3), al = 1 - tan, w = d.rong / 2 * (0.55 + 0.45 * S / d.dai);
      vet(ctx, I.sx, I.sy + 6, I.sx + I.ca * S, I.sy + 6 + I.sa * S, 2.4, I.mau, 0.8 * (1 - kep((t - I.t0) / (I.T - I.t0))), 0.5);   // vết chém trên đất
      for (let j = 0; j < 3; j++) {
        const s = S - j * 13; if (s <= 0) continue;
        const cx = I.sx + I.ca * (s - w * 0.55), cy = I.sy + I.sa * (s - w * 0.55), aa = al * (1 - j * 0.3);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.translate(cx, cy); ctx.rotate(I.dir);
        const rx = w * 0.55;   // lưỡi liềm đặc: cung trước của bầu dục lớn trừ cung bầu dục nhỏ lùi về sau
        ctx.beginPath(); ctx.ellipse(0, 0, rx, w, 0, -1.2, 1.2); ctx.ellipse(-rx * 0.45, 0, rx * 0.6, w * 0.88, 0, 1.2, -1.2, true); ctx.closePath();
        ctx.globalAlpha = aa * (j ? 0.25 : 0.5); ctx.fillStyle = I.mau; ctx.fill();
        for (const [lw, c, k2] of [[15 - j * 4, I.mau, 0.45], [6 - j * 1.5, I.mau, 0.9], [3, '#ffffff', j ? 0.35 : 1]]) { ctx.globalAlpha = aa * k2; ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(0, 0, rx, w, 0, -1.15, 1.15); ctx.stroke(); }
        ctx.restore();
      }
      if (t - I.t0 < 0.1) quang(ctx, I.sx + I.ca * 30, I.sy + I.sa * 30, 50, '#ffffff', 0.5 * (1 - (t - I.t0) / 0.1));
    }
    if (t >= 0.46 && t < I.an) { const k = ease(kep((t - 0.46) / 0.4)); vuKhi(ctx, game, I, I.vx, I.vy, I.dir, lerp(3.2 * (I.lon ?? 1), 1, k), 1 - 0.3 * k, I.mau, 0.6); }
  },
};
