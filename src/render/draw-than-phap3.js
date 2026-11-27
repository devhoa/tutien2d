// Vẽ thức Vạn Diệp Quy Căn (src/game/than-phap-thuc3.js; docs/17-THAN-PHAP.md): chín chiếc lá là bản sao CHÍNH HÌNH VŨ KHÍ người diễn phủ màu lá,
// xoáy quanh người có vệt gió xanh và vành xoáy, rồi bay về một chỗ để lại đường cong sáng; nổ ở cội: quầng xanh, vòng sóng, rễ sáng đâm lên.
// Cộng sáng như các thức khác (draw-tp-cu.js), vẽ ở lớp trên cùng.
import { vuKhi, bongVk, vet, vong, quang, ease, kep } from './draw-tp-cu.js';

export const VE3 = {
  'van-diep'(ctx, game, I) {
    const t = I.t, d = I.d, ex = I.e.x, ey = I.e.y - 8;
    if (t < 0.14) {   // vũ khí xoay tít trên tay rồi rụng thành lá
      vuKhi(ctx, game, I, ex, ey - 6, t * 60, 1.2, 1, I.mau, 0.75);
      quang(ctx, ex, ey, 10 + 80 * t, I.mau, 0.5 * (1 - t / 0.14));
    }
    if (t < I.t1 + 0.04) {   // vùng xoáy: vành gió mờ quay, đậm dần rồi tan khi lá bay đi
      const k = kep(t / 0.3), tan = kep((t - I.t1 + 0.12) / 0.16), R = (10 + (d.r - 10) * ease(k));
      quang(ctx, ex, ey, R * 1.05, I.mau, 0.12 * (1 - tan), 0.62);
      for (let j = 0; j < 3; j++) vong(ctx, ex, ey, R * (0.55 + j * 0.22), 1.2, j === 1 ? '#f4ffe0' : I.mau, (0.45 - j * 0.1) * k * (1 - tan), 0.62, t * 9 + j * 2, t * 9 + j * 2 + 2.4);
    }
    for (const L of I.la) {
      if (t < L.ts || t >= I.t2) continue;
      const bay = t >= I.t1, al = bay ? 1 : kep((t - L.ts) / 0.08);
      if (bay) {   // đường cong sáng sau lá đang bay về cội
        const px = L.px ?? L.x, py = L.py ?? L.y;
        vet(ctx, px, py, L.x, L.y, 1.6, I.mau, 0.7, 0.35);
      }
      L.px = L.x; L.py = L.y;
      bongVk(ctx, game, I, L.x - Math.cos(L.a) * 5, L.y - Math.sin(L.a) * 5, L.a, 0.85, 0.35 * al, I.mau);   // bóng nối đuôi
      vuKhi(ctx, game, I, L.x, L.y, L.a, 0.8, 0.9 * al, I.mau, 0.8);
    }
    if (t >= I.t1 - 0.04 && t < I.t2) quang(ctx, I.cx, I.cy, 8 + 26 * ease(kep((t - I.t1) / (I.t2 - I.t1))), I.mau, 0.35);   // cội sáng dần trước khi nổ
    if (t >= I.t2) {   // nổ ở cội: quầng, hai vòng sóng, rễ sáng đâm lên rồi tắt
      const a = t - I.t2, k = kep(a / 0.42), f = 1 - k;
      quang(ctx, I.cx, I.cy, 18 + d.no_r * 1.4 * ease(k), I.mau, 0.55 * f);
      quang(ctx, I.cx, I.cy, 10 + 10 * ease(k), '#ffffff', 0.6 * kep(1 - a / 0.12));
      vong(ctx, I.cx, I.cy + 4, 6 + (d.no_r + 18) * ease(k), 2.4 * f + 0.6, I.mau, f, 0.6);
      vong(ctx, I.cx, I.cy + 4, 4 + (d.no_r + 4) * ease(kep(a / 0.3)), 1.2, '#f4ffe0', kep(1 - a / 0.3), 0.6);
      const mo = kep(a / 0.16), tat = kep((a - 0.3) / 0.25);
      for (const pts of I.re) {
        const n = Math.max(1, Math.round((pts.length - 1) * mo));
        for (let i = 1; i <= n; i++) vet(ctx, I.cx + pts[i - 1][0], I.cy + 6 + pts[i - 1][1], I.cx + pts[i][0], I.cy + 6 + pts[i][1], 2.2 - i * 0.4, I.mau, 0.85 * (1 - tat), 0.5);
      }
    }
  },
};
