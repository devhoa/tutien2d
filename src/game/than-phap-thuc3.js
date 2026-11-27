// Thức Thân pháp thứ bảy: Vạn Diệp Quy Căn (Mộc Trưởng Lão dạy ở Làng Tinh Linh, truyện Thanh Mộc 23/11/2026; docs/17-THAN-PHAP.md).
// Cùng khuôn với src/game/than-phap-thuc.js: bat dựng lịch, nhip chạy lịch và tính chỗ từng chiếc lá cho hình vẽ src/render/draw-than-phap3.js.
// Vũ khí xoay tít rồi rụng thành chín chiếc lá (bản sao vũ khí phủ màu lá), lá xoáy ra quanh người ba vòng quét: mỗi vòng trúng mọi kẻ địch trong vùng
// xoáy (soft, đẩy nhẹ); rồi lá bay về một chỗ (con mồi, không có thì trước mặt) như lá rụng về cội, nổ ở đó: trúng mạnh mọi con quanh chỗ ấy, rễ sáng
// đâm lên, cánh hoa, lá vụn. Không khựng hình; chỉ rung nhẹ ở máy người ra đòn. Số ở data/than-phap.json → thuc.van-diep.
import { gan, danh, hat, tieng, rnd, ev, chay, mucTieu, ease, lerp } from './than-phap-cu.js';

const rung = (game, I, a, t) => { if (I.own) game.screen?.shake?.(a, t); };

const DIEP = {
  bat(game, I) {
    const d = I.d, tg = mucTieu(game, I, I.x, I.y, d.tam, 1)[0]?.m || (I.tg0 && !I.tg0.dead ? I.tg0 : null);   // con mồi: con đang nhắm, không thì con gần nhất trong tầm
    const cx = tg ? tg.x : I.x + I.ca * d.tam * 0.55, cy = tg ? tg.y - (tg.r || 6) * 0.4 : I.y + I.sa * d.tam * 0.55;
    const n = d.n, la = [];
    for (let i = 0; i < n; i++) la.push({ a0: i / n * Math.PI * 2 + rnd(I) * 0.4, ts: 0.04 + i * 0.018, lech: 0.85 + rnd(I) * 0.3, x: I.x, y: I.y, a: 0 });
    // xoáy 0,08 → 0,62 giây, bay về 0,62 → 0,86, nổ ở 0,86; vũ khí về lưng từ chỗ nổ
    Object.assign(I, { la, m: tg, cx, cy, T: 1.32, an: Math.min(I.an || 1.15, 1.0), t1: 0.62, t2: 0.86, re: [] });
    for (let i = 0; i < 7; i++) {   // rễ sáng đâm lên từ chỗ nổ: mỗi rễ vài đoạn gãy khúc
      const a = i / 7 * Math.PI * 2 + rnd(I) * 0.6, L = 14 + rnd(I) * 18, pts = [[0, 0]];
      for (let k = 1; k <= 3; k++) pts.push([Math.cos(a + (rnd(I) - 0.5) * 0.9) * L * k / 3, Math.sin(a + (rnd(I) - 0.5) * 0.9) * L * k / 3 * 0.6]);
      I.re.push(pts);
    }
    ev(I, 0, () => tieng(game, I, 'tp.diep_xoay', 0.85));
    for (let v = 0; v < d.vong; v++) ev(I, 0.2 + v * 0.16, () => {   // ba vòng quét của lá: mọi con trong vùng xoáy
      for (const m of gan(game, I.e.x, I.e.y - 8, d.r, 24)) danh(game, I, m, d.mul, { soft: true, fx: I.e.x, fy: I.e.y });
    });
    ev(I, I.t1, () => { tieng(game, I, 'tp.diep_tu', 0.85); if (I.m && !I.m.dead) { I.cx = I.m.x; I.cy = I.m.y - (I.m.r || 6) * 0.4; } });
    ev(I, I.t2, () => {
      tieng(game, I, 'tp.diep_no', 1); rung(game, I, 2.4, 0.2);
      for (const m of gan(game, I.cx, I.cy, d.no_r, 24)) danh(game, I, m, d.cuoi, { fx: I.cx, fy: I.cy });
      for (let i = 0; i < 30; i++) {   // cánh hoa hồng, lá xanh, đốm sáng toé lên rồi rơi
        const a = rnd(I) * Math.PI * 2, v = 40 + rnd(I) * 110, c = i % 3 === 0 ? '#ffd0e8' : i % 3 === 1 ? I.mau : '#f4ffe0';
        hat(I, I.cx, I.cy, Math.cos(a) * v, Math.sin(a) * v * 0.6 - 50 - rnd(I) * 40, 0.55 + rnd(I) * 0.4, c, i % 4 ? 1 : 2, 150, 2.2);
      }
    });
    I.va = -Math.PI / 2;
  },
  nhip(game, I, dt) {
    chay(I);
    const d = I.d, t = I.t, ex = I.e.x, ey = I.e.y - 8;
    if (I.m && !I.m.dead && t < I.t2) { I.cx = lerp(I.cx, I.m.x, Math.min(1, dt * 8)); I.cy = lerp(I.cy, I.m.y - (I.m.r || 6) * 0.4, Math.min(1, dt * 8)); }
    for (const L of I.la) {
      if (t < I.t1) {   // xoáy ra: bán kính lớn dần tới d.r, quay nhanh, mỗi lá lệch một chút cho không thành vòng cứng
        const k = ease(Math.max(0, Math.min(1, (t - L.ts) / (I.t1 - L.ts)))), R = (8 + (d.r - 8) * k) * L.lech, g = L.a0 + t * 11;
        L.x = ex + Math.cos(g) * R; L.y = ey + Math.sin(g) * R * 0.62; L.a = g + Math.PI / 2;
      } else if (t < I.t2) {   // bay về một chỗ: đường cong từ chỗ lá đang ở, mũi chĩa vào cội
        const k = ease((t - I.t1) / (I.t2 - I.t1)), g = L.a0 + I.t1 * 11, R = d.r * L.lech;
        const sx = ex + Math.cos(g) * R, sy = ey + Math.sin(g) * R * 0.62, mx = lerp(sx, I.cx, 0.5) + Math.cos(g + 1.2) * 16, my = lerp(sy, I.cy, 0.5) + Math.sin(g + 1.2) * 10;
        const x = lerp(lerp(sx, mx, k), lerp(mx, I.cx, k), k), y = lerp(lerp(sy, my, k), lerp(my, I.cy, k), k);
        L.a = Math.atan2(I.cy - y, I.cx - x); L.x = x; L.y = y;
      } else { L.x = I.cx; L.y = I.cy; }
    }
    if (t < I.t1 && Math.random() < dt * 40) { const L = I.la[(Math.random() * I.la.length) | 0]; hat(I, L.x, L.y, (Math.random() - 0.5) * 20, -10 - Math.random() * 20, 0.4, Math.random() < 0.6 ? I.mau : '#f4ffe0', 1, 20, 2); }   // lá vụn rơi theo xoáy
    I.vx = I.cx; I.vy = I.cy;
  },
};

export const THUC3 = { 'van-diep': DIEP };
