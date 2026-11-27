// Vẽ hai thức của truyện Thiên Kim (src/game/than-phap-thuc4.js; docs/17-THAN-PHAP.md): Vạn Kiếm Quy Trủng, Bách Luyện Thiên Chùy.
// Mọi thanh kiếm, cả thanh lớn, là CHÍNH HÌNH VŨ KHÍ người diễn đang cầm (draw-tp-cu.js). Cộng sáng, vẽ ở lớp trên cùng như các thức khác.
import { vuKhi, bongVk, vet, vong, quang, ease, lerp, kep } from './draw-tp-cu.js';

function toiTroi(ctx, game, al) {   // trời tối lại một chút quanh chỗ thức đang diễn
  const v = game.screen?.viewRect?.();
  if (!v || al <= 0.01) return;
  ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = '#0a0818'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore();
}
const daiVk = (game, I, k) => 20 * k * (I.k0 || game.data.heroes.fly.scale);   // bề dài thanh vũ khí trên màn ở cỡ k
// Vết nứt sáng toả từ (x, y): mo 0 → 1 là nứt lan ra, al độ đậm
function nut(ctx, I, x, y, mo, al, mau, w = 2.4) {
  if (al <= 0.01) return;
  for (const pts of I.nut) { const n = Math.max(1, Math.round((pts.length - 1) * mo)); for (let i = 1; i <= n; i++) vet(ctx, x + pts[i - 1][0], y + pts[i - 1][1], x + pts[i][0], y + pts[i][1], w - i * 0.5, mau, al, 0.45); }
}
// Vòng nhiều cạnh dẹt (đe, ấn trận), xoay góc q
function daGiac(ctx, x, y, r, n, q, mau, al, w = 1.4, sq = 0.62) {
  if (al <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al; ctx.strokeStyle = mau; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let i = 0; i <= n; i++) { const a = q + i / n * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * sq; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.stroke(); ctx.restore();
}

export const VE4 = {
  'quy-trung'(ctx, game, I) {
    const t = I.t, d = I.d, px = I.px, py = I.py, ex = I.e.x + I.ca * 8, ey = I.e.y, tn = I.tn;
    toiTroi(ctx, game, 0.22 * kep((t - 0.08) / 0.2) * (1 - kep((t - tn - 0.05) / 0.25)));
    if (t < 0.2) {   // cắm vũ khí xuống đất dưới chân: vòng gợn, đường sáng chạy trên đất tới chỗ địch
      const k = ease(kep(t / 0.09));
      vuKhi(ctx, game, I, ex, ey - 16 + k * 12, Math.PI / 2, 1.15, 1 - kep((t - 0.13) / 0.07), I.mau, 0.75);
      vong(ctx, ex, ey + 2, 4 + 34 * kep(t / 0.2), 1.6, I.mau, 1 - kep(t / 0.2));
    }
    if (t > 0.05 && t < 0.42) { const k = ease(kep((t - 0.05) / 0.13)); vet(ctx, ex, ey + 2, lerp(ex, px, k), lerp(ey + 2, py + 2, k), 2, I.mau, 0.8 * (1 - kep((t - 0.22) / 0.2)), 0.5); }
    if (t > 0.12 && t < tn + 0.1) {   // vòng mộ: vành lớn dần, mười hai cạnh xoay chậm, quầng vàng cũ trên đất
      const k = ease(kep((t - 0.12) / 0.3)), al = 0.85 * (1 - kep((t - tn) / 0.1)), co = t > 0.6 ? 1 - 0.5 * ease(kep((t - 0.6) / (tn - 0.6))) : 1;   // sau khi vây, vành co dần về gò
      quang(ctx, px, py, d.r * 1.25 * co, I.mau, 0.2 * k * al, 0.62);
      vong(ctx, px, py, d.r * (0.4 + 0.6 * k) * co, 1.5, I.mau, al);
      daGiac(ctx, px, py, d.r * 0.78 * k * co, 12, t * 0.9, '#fff6d8', al * 0.55, 1);
      daGiac(ctx, px, py, d.r * 0.5 * k * co, 6, -t * 1.4, I.mau, al * 0.6, 1.2);
    }
    for (const K of I.kiem) {
      if (t < K.ts) continue;
      if (t < K.td) {   // trồi lên khỏi đất, lơ lửng, mũi chĩa trời: cột sáng, vòng gợn ở chân
        const a = t - K.ts, k = ease(kep(a / 0.16)), y = K.y + 8 - k * 30 + Math.sin(t * 9 + K.a) * 1.5;
        vet(ctx, K.x, K.y + 2, K.x, y - 8, 1.8, I.mau, 0.8 * (1 - kep((a - 0.08) / 0.25)), 0.4);
        vong(ctx, K.x, K.y + 2, 3 + 13 * kep(a / 0.22), 1.2, I.mau, 1 - kep(a / 0.26));
        quang(ctx, K.x, K.y + 2, 9, I.mau, 0.28 * k, 0.6);
        bongVk(ctx, game, I, K.x, y + 5, -Math.PI / 2, 0.95, 0.3 * k, I.mau);
        vuKhi(ctx, game, I, K.x, y, -Math.PI / 2, 0.95, k, I.mau, 0.6);
      } else {
        const f = kep((t - K.td) / 0.09), sx = K.x, sy = K.y - 22, tx = K.mx, ty = K.my - 5;
        if (f < 1) {   // lao vào giữa theo đường vồng, để lại vệt sáng
          const x = lerp(sx, tx, f * f), y = lerp(sy, ty, f * f) - Math.sin(f * Math.PI) * 12, a = Math.atan2(ty - sy + 10, tx - sx);
          vet(ctx, sx, sy, x, y, 1.5, I.mau, 0.65 * (1 - f * 0.5), 0.4);
          bongVk(ctx, game, I, x - Math.cos(a) * 6, y - Math.sin(a) * 6, a, 0.95, 0.4, I.mau);
          vuKhi(ctx, game, I, x, y, a, 0.95, 1, I.mau, 0.75);
        } else {   // đã cắm vào gò, mỗi thanh nghiêng một kiểu; kiếm lớn nằm xuống rồi thì chìm dần vào đất
          const tan = kep((t - tn - 0.12) / 0.4), moi = kep(1 - (t - K.td - 0.09) / 0.2);
          vuKhi(ctx, game, I, tx, ty - 3 + tan * 8, Math.PI / 2 + K.ng, 0.9, 1 - tan, I.mau, 0.3 + 0.45 * moi);
        }
      }
    }
    for (let v = 0; v < d.dot; v++) { const a = t - (0.75 + v * 0.1); if (a > 0 && a < 0.24) vong(ctx, px, py + 2, 6 + a * 190, 1.5, v % 2 ? '#ffffff' : I.mau, 1 - a / 0.24, 0.6); }   // mỗi đợt kiếm cắm: một vòng sóng nhỏ
    if (t >= tn - 0.2) {   // thanh kiếm lớn: hiện trên gò mũi chĩa trời, ngả dần rồi NẰM xuống; vòng sóng, vết nứt sáng, rồi tan
      const a = t - tn, len = daiVk(game, I, d.to);
      if (a < 0) {
        const f = kep((t - tn + 0.2) / 0.2), y = lerp(py - 40 - len * 0.3, py - 7, f * f), g = lerp(-Math.PI / 2, 0, ease(f));
        vet(ctx, px, py - 200, px, y, 5 + 6 * f, I.mau, 0.2 * f, 0.2);
        bongVk(ctx, game, I, px, y - 6 * (1 - f), g, d.to, 0.45 * f, I.mau);
        vuKhi(ctx, game, I, px, y, g, d.to, 0.9 * f, I.mau, 0.9);
      } else {
        const tan = kep((a - 0.14) / 0.42), f = 1 - kep(a / 0.5);
        ctx.save(); ctx.globalAlpha = 0.35 * (1 - kep(a / 0.8)); ctx.fillStyle = '#14100a'; ctx.beginPath(); ctx.ellipse(px, py + 2, len * 0.5, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        quang(ctx, px, py, 18 + d.no_r * 1.5 * ease(kep(a / 0.3)), I.mau, 0.5 * f, 0.7);
        quang(ctx, px, py, 14, '#ffffff', 0.75 * kep(1 - a / 0.12));
        for (let j = 0; j < 3; j++) { const b = a - j * 0.07, rr = b * 270, R = d.no_r + 70; if (b > 0 && rr < R) vong(ctx, px, py + 3, rr, 2.8 - j * 0.7, j ? I.mau : '#ffffff', 1 - rr / R, 0.58); }
        nut(ctx, I, px, py + 3, kep(a / 0.14), 0.9 * (1 - kep((a - 0.2) / 0.4)), I.mau);
        vuKhi(ctx, game, I, px, py - 7 + tan * 5, 0, d.to, 0.95 * (1 - tan), I.mau, 0.9 * (1 - tan));
      }
    }
  },
  'bach-luyen'(ctx, game, I) {
    const t = I.t, d = I.d, px = I.px, py = I.py, B = I.bua, toi = I.toi, NONG = ['#ff7a1a', '#ffb040', '#fff0b0'];
    toiTroi(ctx, game, 0.2 * kep(t / 0.2) * (1 - kep((t - toi - 0.1) / 0.25)));
    const nguoi = kep((t - toi) / 0.3), hien = kep(t / 0.15) * (1 - kep((t - toi - 0.25) / 0.22));   // nguoi: 0 đang nóng → 1 đã tôi nguội
    if (hien > 0.01) {   // đe lửa: than hồng dưới đất, vành tám cạnh, vành trong xoay ngược, đậm dần theo từng nhát búa
      const lan = B.filter(b => t >= b).length, soi = 0.5 + 0.17 * lan + 0.06 * Math.sin(t * 22);
      quang(ctx, px, py + 2, d.r * 1.15, NONG[0], 0.42 * soi * hien * (1 - nguoi), 0.6);
      quang(ctx, px, py + 2, d.r * 1.1, '#bfe8ff', 0.3 * hien * nguoi, 0.6);
      daGiac(ctx, px, py + 2, d.r * 0.95, 8, 0.39 + t * 0.3, lerpMau(I.mau, '#bfe8ff', nguoi), 0.9 * hien, 1.8);
      daGiac(ctx, px, py + 2, d.r * 0.6, 8, -t * 0.8, '#fff6d8', 0.5 * hien, 1);
      vong(ctx, px, py + 2, d.r * 0.3, 1, lerpMau(NONG[1], '#dff4ff', nguoi), 0.7 * hien);
    }
    B.forEach((b, j) => {   // mỗi nhát: loé ở chỗ nện, vòng sóng lan (nhát ba rộng hơn)
      const a = t - b;
      if (a <= 0 || a >= 0.32) return;
      const R = j < 2 ? d.r : d.no_r;
      quang(ctx, px, py - 2, 12 + 20 * (j + 1) * ease(kep(a / 0.1)), '#fff6d8', 0.8 * kep(1 - a / 0.15));
      vong(ctx, px, py + 3, 8 + (R + 16) * ease(a / 0.32), 2.6 - a * 6, j === 2 ? '#fff6d8' : NONG[j], 1 - a / 0.32, 0.6);
      if (j === 2) vong(ctx, px, py + 3, 4 + (R + 40) * ease(kep(a / 0.26)), 1.2, NONG[0], kep(1 - a / 0.26), 0.6);
      if (a < 0.16) for (let q = 0; q < 10 + j * 3; q++) {   // tia hoa lửa bắn ra từ chỗ nện, dẹt theo mặt đất, nhát sau dài hơn
        const g = q * 2.399 + j, k = a / 0.16, r0 = 6 + R * 0.5 * k, r1 = r0 + (10 + j * 8) * (1 - k * 0.5), len = Math.sin(g * 3.1) * 0.25 + 1;
        vet(ctx, px + Math.cos(g) * r0, py - 2 + Math.sin(g) * r0 * 0.55 - k * 10 * len, px + Math.cos(g) * r1 * len, py - 2 + Math.sin(g) * r1 * 0.55 * len - k * 16 * len, 1.3, q % 3 ? NONG[1] : '#fff6d8', 0.9 * (1 - k), 0.5);
      }
      if (a < 0.22) vet(ctx, px, py - 4, px, py - 30 - 46 * (j + 1) * ease(kep(a / 0.12)), 5 + 3 * j, NONG[j], 0.55 * (1 - a / 0.22), 0.3);   // cột lửa bật lên theo nhát búa
    });
    if (t > B[2]) nut(ctx, I, px, py + 3, kep((t - B[2]) / 0.12), 0.95 * (1 - nguoi) * (1 - kep((t - toi - 0.2) / 0.2)), NONG[0], 3);   // đất nứt chảy đỏ, tôi xong thì tắt
    // Vũ khí làm búa: giữa hai nhát bay lên ngả ra sau, tới nhịp thì nện xuống, mũi chạm tâm; mỗi nhát lớn và nóng hơn
    const i = Math.min(2, B.findIndex(b => t < b + 0.05) < 0 ? 2 : B.findIndex(b => t < b + 0.05)), b = B[i], truoc = i ? B[i - 1] + 0.05 : 0, S = [1.5, 2.1, 3][i], H = [34, 46, 74][i];
    if (t < B[2] + 0.05) {
      const len = daiVk(game, I, S), nen = kep((t - (b - 0.085)) / 0.085), len0 = kep((t - truoc) / Math.max(0.05, b - 0.085 - truoc));
      const cao = t < b - 0.085 ? ease(len0) * H : (1 - nen * nen) * H, g = t < b - 0.085 ? lerp(1.1, -2.0, ease(len0)) : lerp(-2.0, 1.2, nen * nen);
      const x = px - Math.cos(g) * len * 0.42 * (cao > 1 ? 0.5 : 1), y = py - 4 - cao - Math.sin(g) * len * 0.42 * (cao > 1 ? 0.3 : 1);
      if (t >= b - 0.085) for (let j = 3; j >= 1; j--) bongVk(ctx, game, I, x, y - j * H * 0.16 * (1 - nen), g - j * 0.25 * (1 - nen), S, 0.4 - j * 0.1, NONG[i]);   // bóng nối đuôi lúc nện
      quang(ctx, x, y, 10 + 8 * i, NONG[i], 0.45);
      vuKhi(ctx, game, I, x, y, g, S, kep(t / 0.12), NONG[i], 0.95);
    } else if (t < toi + 0.45) {   // nằm trên đe: trắng nóng, tôi vào nước thì loé lạnh rồi mờ đi (vũ khí thật bay về tay)
      const len = daiVk(game, I, 3), g = 1.2, mo = 1 - kep((t - toi - 0.15) / 0.3);
      vuKhi(ctx, game, I, px - Math.cos(g) * len * 0.42, py - 4 - Math.sin(g) * len * 0.42, g, 3, mo, lerpMau(NONG[2], '#bfe8ff', nguoi), 0.95);
    }
    if (t > toi) {   // tôi: hơi nước trắng lam bung lên, một vòng lạnh lan trên đất
      const a = t - toi, k = kep(a / 0.4);
      quang(ctx, px, py - 8 - 26 * k, 16 + 44 * ease(k), '#dff4ff', 0.55 * (1 - k));
      vong(ctx, px, py + 2, 10 + (d.no_r + 10) * ease(k), 1.8, '#bfe8ff', 1 - k, 0.6);
    }
  },
};
// Pha hai màu #rrggbb theo k (0 → a, 1 → b)
function lerpMau(a, b, k) {
  const h = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = h(a), Bm = h(b);
  return '#' + A.map((v, i) => Math.round(v + (Bm[i] - v) * kep(k)).toString(16).padStart(2, '0')).join('');
}
