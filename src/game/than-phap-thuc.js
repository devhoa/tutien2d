// Diễn biến từng nhát / thức của Thân pháp (src/game/than-phap.js; docs/17-THAN-PHAP.md). Mỗi kiểu hai hàm: bat(game, I) dựng màn diễn (thời lượng I.T,
// lúc vũ khí về I.an, mục tiêu, lịch các lần trúng), nhip(game, I, dt) chạy lịch và tính chỗ vũ khí / bản sao để hình vẽ đọc (src/render/draw-than-phap*.js).
// Lần trúng đi qua danh() (than-phap-cu.js): máy mình trừ máu, máy người xem chỉ toé sáng. I.vx, I.vy, I.va: chỗ vũ khí kết thúc thức (bay về lưng từ đó).
// Tệp này: đâm (chỉ vệt sáng, sát thương ở player.js), xuyên, Vạn Ảnh Liên Hoàn, Tinh Hải Thu Võng. Bốn thức còn lại: than-phap-thuc2.js.
import { gan, tren, danh, hat, toe, tieng, rnd, ev, chay, cho, mucTieu, ease, lerp } from './than-phap-cu.js';
import { THUC2 } from './than-phap-thuc2.js';
import { THUC3 } from './than-phap-thuc3.js';   // Vạn Diệp Quy Căn (truyện Thanh Mộc, 23/11/2026)
import { THUC4 } from './than-phap-thuc4.js';   // Vạn Kiếm Quy Trủng, Bách Luyện Thiên Chùy (truyện Thiên Kim, 26/11/2026)

const DAM = {   // nhát 2: vệt đâm sáng dài theo vũ khí bay (đòn trúng tính ở player.js lúc vũ khí tới nơi)
  bat(game, I) { I.T = 0.34; I.L = I.R; ev(I, 0.13, () => { tieng(game, I, 'tp.dam', 0.85); const x = I.x + I.ca * I.L, y = I.y + I.sa * I.L; for (let i = 0; i < 7; i++) { const a = I.dir + (rnd(I) - 0.5) * 1.4, v = 60 + rnd(I) * 80; hat(I, x, y, Math.cos(a) * v, Math.sin(a) * v, 0.25, i % 2 ? I.mau : '#fff', 1, 0, 5); } }); },
  nhip(game, I) { chay(I); },
};

const XUYEN = {   // nhát 3: vũ khí xuyên qua xuyên lại lan lượt trên một đường thẳng trước mặt
  bat(game, I) {
    const N = I.d, L = I.R * N.tam, t0 = 0.05, g = 0.11;
    I.L = L; I.T = t0 + g * N.lan + 0.24; I.an = Math.min(I.an || 0.42, t0 + g * N.lan); I.qua = [];
    for (let j = 0; j < N.lan; j++) {
      const di = j % 2 === 0;
      I.qua.push({ t: t0 + j * g, di });
      ev(I, t0 + j * g, () => {
        const ex = I.x + I.ca * L, ey = I.y + I.sa * L;
        tieng(game, I, 'tp.xuyen', 0.75);
        for (const m of tren(game, I.x, I.y, ex, ey, N.rong)) danh(game, I, m, N.mul, { soft: j < N.lan - 1, fx: di ? I.x : ex, fy: di ? I.y : ey });
        for (let i = 0; i < 5; i++) { const k = rnd(I); hat(I, lerp(I.x, ex, k), lerp(I.y, ey, k), (rnd(I) - 0.5) * 50, (rnd(I) - 0.5) * 50 - 15, 0.3, i % 2 ? I.mau : '#fff', 1, 0, 3); }
      });
    }
    const last = (N.lan - 1) % 2 === 0;   // lượt cuối đi tới hay đi về
    I.vx = last ? I.x + I.ca * L : I.x; I.vy = last ? I.y + I.sa * L : I.y; I.va = I.dir;
    I.g = g; I.t0 = t0;
  },
  nhip(game, I) {
    chay(I);
    const j = Math.floor((I.t - I.t0) / I.g), q = I.qua[Math.min(I.qua.length - 1, Math.max(0, j))], k = Math.max(0, Math.min(1, (I.t - I.t0 - Math.max(0, j) * I.g) / I.g));
    const dq = q.di ? ease(k) : 1 - ease(k);
    I.wx = I.x + I.ca * I.L * dq; I.wy = I.y + I.sa * I.L * dq; I.wa = q.di ? I.dir : I.dir + Math.PI;
    I.vet = [{ x: I.wx, y: I.wy }, ...(I.vet || [])].slice(0, 7);
  },
};

const ANH = {   // Vạn Ảnh Liên Hoàn: sáu bản sao xoè sau lưng rồi lần lượt lao vào kẻ địch
  bat(game, I) {
    const d = I.d, n = d.n, tg = mucTieu(game, I, I.x, I.y, d.tam, n);
    I.ban = [];
    for (let i = 0; i < n; i++) {
      const hv = -Math.PI / 2 + (i - (n - 1) / 2) * 0.5 - I.ca * 0.25, r = 30;   // vòng kiếm xoè trên đầu như vành quạt, lệch về sau lưng một chút
      let q = tg.length ? tg[i % tg.length] : null;
      if (!q) { const a = I.dir + (i - (n - 1) / 2) * 0.3, D = 58 + (i % 2) * 10; q = { m: null, x: I.x + Math.cos(a) * D, y: I.y + Math.sin(a) * D }; }
      const b = { hx: Math.cos(hv) * r, hy: Math.sin(hv) * r * 0.8 - 16, ta: 0.02 + i * 0.03, tl: 0.26 + i * 0.085, q };
      I.ban.push(b);
      ev(I, b.tl, () => tieng(game, I, 'tp.phong', 0.5));
      ev(I, b.tl + 0.11, () => { cho(b.q); if (b.q.m) danh(game, I, b.q.m, d.mul, { fx: I.e.x + b.hx, fy: I.e.y + b.hy }); else toe(I, b.q.x, b.q.y, I.mau, 4); });
    }
    ev(I, 0, () => tieng(game, I, 'tp.tach', 0.8));
    const z = I.ban[n - 1];
    I.T = z.tl + 0.11 + 0.2; I.an = Math.min(I.an || 1, z.tl + 0.11);
    I.va = I.dir;
  },
  nhip(game, I) {
    chay(I);
    for (const b of I.ban) cho(b.q);
    const z = I.ban[I.ban.length - 1].q; I.vx = z.x; I.vy = z.y;
  },
};

const VONG = {   // Tinh Hải Thu Võng: quăng vũ khí, bung thành lưới sao, gom quái rồi kéo cả về phía mình
  bat(game, I) {
    const d = I.d, tg = mucTieu(game, I, I.x, I.y, d.xa + 34, 1)[0];
    let px = I.x + I.ca * d.xa * 0.9, py = I.y + I.sa * d.xa * 0.9;
    if (tg) { const D = Math.hypot(tg.x - I.x, tg.y - I.y), k = Math.min(1, d.xa / Math.max(1, D)); px = I.x + (tg.x - I.x) * k; py = I.y + (tg.y - I.y) * k; }
    Object.assign(I, { px, py, T: 1.42, an: Math.min(I.an || 1.15, 1.12), bat: [], cham: new Set(), cx: I.x, cy: I.y, rr: 0 });
    ev(I, 0, () => tieng(game, I, 'tp.vong_tung', 0.8));
    ev(I, 0.2, () => tieng(game, I, 'tp.vong_bung', 0.75));
    ev(I, 0.36, () => {
      I.bat = gan(game, I.px, I.py, d.r, 12);
      for (const m of I.bat) { danh(game, I, m, d.mul, { soft: true, fx: I.px, fy: I.py }); I.cham.add(m); }
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; hat(I, I.px + Math.cos(a) * d.r, I.py + Math.sin(a) * d.r * 0.7, Math.cos(a) * 30, Math.sin(a) * 20, 0.5, i % 2 ? '#e8fbff' : I.mau, 1, 0, 2); }
    });
    ev(I, 0.5, () => tieng(game, I, 'tp.vong_keo', 0.8));
    ev(I, 0.8, () => { for (const m of I.bat) danh(game, I, m, d.lan2, { soft: true, fx: I.cx, fy: I.cy }); });
    ev(I, 1.1, () => { tieng(game, I, 'tp.vong_thu', 0.85); for (const m of I.bat) danh(game, I, m, d.keo, { fx: I.e.x, fy: I.e.y }); });
    I.va = I.dir + Math.PI;
  },
  nhip(game, I, dt) {
    chay(I);
    const d = I.d, t = I.t, e = I.e, ox = e.x, oy = e.y - 8;
    if (t < 0.2) { const k = ease(t / 0.2); I.cx = lerp(I.x, I.px, k); I.cy = lerp(I.y, I.py, k); I.rr = 0; }
    else if (t < 0.36) { I.cx = I.px; I.cy = I.py; I.rr = d.r * ease((t - 0.2) / 0.16); }
    else if (t < 0.5) { I.rr = d.r * (1 + 0.05 * Math.sin((t - 0.36) * 40)); }
    else if (t < 1.1) {   // kéo lưới: tâm lưới chạy về phía người quăng (dừng cách người 18), lưới co lại
      const k = ease((t - 0.5) / 0.6), D = Math.hypot(I.px - ox, I.py - oy), st = Math.max(0, D - 18) / Math.max(1, D);
      I.cx = lerp(I.px, I.px + (ox - I.px) * st, k); I.cy = lerp(I.py, I.py + (oy - I.py) * st, k); I.rr = lerp(d.r, 14, k);
      if (I.own && !I.demo) for (const m of I.bat) {   // kéo quái theo lưới (trùm, quái chung, quái của đội trưởng, Mộc Nhân thì không kéo)
        if (m.dead || m.def?.ai === 'boss' || m.qc != null || m.remote || m.dummy || m.wboss) continue;
        const f = Math.min(1, dt * 9); game.map.move(m, (I.cx - m.x) * f, (I.cy + 6 - m.y) * f); m.kx = 0; m.ky = 0;
      }
      if (I.own && !I.demo) for (const m of gan(game, I.cx, I.cy, I.rr, 12)) if (!I.cham.has(m)) { I.cham.add(m); danh(game, I, m, d.lan2, { soft: true, fx: I.cx, fy: I.cy }); }   // quái lưới quét trúng dọc đường kéo
      if (Math.random() < dt * 30) { const a = Math.random() * Math.PI * 2; hat(I, I.cx + Math.cos(a) * I.rr, I.cy + Math.sin(a) * I.rr * 0.7, -Math.cos(a) * 40, -20, 0.35, Math.random() < 0.5 ? '#e8fbff' : I.mau, 1, 30, 3); }
    } else { const k = Math.min(1, (t - 1.1) / 0.12); I.rr = lerp(14, 0, k); }
    I.vx = I.cx; I.vy = I.cy;
  },
};

export const THUC = { dam: DAM, xuyen: XUYEN, 'anh-kiem': ANH, 'thu-vong': VONG, ...THUC2, ...THUC3, ...THUC4 };
