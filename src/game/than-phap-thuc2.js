// Bốn thức lớn của Thân pháp (cùng khuôn với src/game/than-phap-thuc.js: bat dựng lịch, nhip chạy lịch và tính chỗ vũ khí cho hình vẽ
// src/render/draw-than-phap2.js): Thiên Kiếm Trấn, Liệp Phong Bách Thứ, Huyền Vực Tỏa Hồn, Khai Thiên Nhất Trảm. docs/17-THAN-PHAP.md.
import { gan, tren, danh, dongNhat, hat, tieng, rnd, ev, chay, cho, mucTieu, ease, lerp } from './than-phap-cu.js';

// Rung màn, chớp dịu: chỉ máy của người ra đòn (người đứng xem không bị rung theo đòn của người khác)
const rung = (game, I, a, t) => { if (I.own) game.screen?.shake?.(a, t); };
const chop = (game, I, s) => { if (I.own) game.flashT = Math.max(game.flashT || 0, s); };

const TRAN = {   // Thiên Kiếm Trấn: vũ khí vút lên trời, hoá lớn rồi cắm xuống dưới chân địch, cắm lại làm mốc một lúc
  bat(game, I) {
    const d = I.d, m = dongNhat(game, I.x, I.y, d.tam, d.r * 0.8) || (I.tg0 && !I.tg0.dead ? I.tg0 : null);
    const px = m ? m.x : I.x + I.ca * 70, py = m ? m.y : I.y + 8 + I.sa * 70;
    Object.assign(I, { px, py, T: 1.72, an: Math.min(I.an || 1.25, 1.25), vx: px, vy: py - 10, va: -Math.PI / 2, nut: [] });
    for (let i = 0; i < 9; i++) {   // vết nứt toả ra từ chỗ kiếm cắm: mỗi vết vài đoạn gãy khúc
      const a = i / 9 * Math.PI * 2 + rnd(I) * 0.5, L = 26 + rnd(I) * 34, pts = [[0, 0]];
      for (let k = 1; k <= 4; k++) pts.push([Math.cos(a + (rnd(I) - 0.5) * 0.7) * L * k / 4, Math.sin(a + (rnd(I) - 0.5) * 0.7) * L * k / 4 * 0.6]);
      I.nut.push(pts);
    }
    ev(I, 0, () => tieng(game, I, 'tp.tran_len', 0.85));
    ev(I, 0.56, () => tieng(game, I, 'tp.tran_ha', 0.9));
    ev(I, 0.74, () => {
      tieng(game, I, 'tp.tran_no', 1); rung(game, I, 4.5, 0.32); chop(game, I, 0.1);
      for (const q of gan(game, I.px, I.py, d.r, 30)) danh(game, I, q, d.mul, { stun: d.choang, fx: I.px, fy: I.py });
      for (let i = 0; i < 34; i++) {   // đá vụn, tia vàng, bụi
        const a = rnd(I) * Math.PI * 2, v = 50 + rnd(I) * 140, c = i % 3 === 0 ? '#fff6d8' : i % 3 === 1 ? I.mau : '#9a8a78';
        hat(I, I.px, I.py - 2, Math.cos(a) * v, Math.sin(a) * v * 0.6 - 40 - rnd(I) * 60, 0.5 + rnd(I) * 0.4, c, i % 4 ? 1 : 2, 260, 2.5);
      }
    });
  },
  nhip(game, I, dt) {
    chay(I);
    if (I.t > 0.74 && I.t < 1.3 && Math.random() < dt * 24) hat(I, I.px + (Math.random() - 0.5) * 30, I.py, (Math.random() - 0.5) * 10, -30 - Math.random() * 40, 0.8, Math.random() < 0.5 ? I.mau : '#ffffff', 1, -10, 1.5);   // đốm sáng bốc lên quanh thanh kiếm đang cắm
  },
};

// Bách Thứ khoá con mồi: con mục tiêu của nhát chém nếu còn trong tầm đâm, không thì con gần nhất trước mặt (lệch hướng mặt tối đa 60°)
const lechGoc = a => Math.atan2(Math.sin(a), Math.cos(a));
function khoaMoi(game, I) {
  const d = I.d, x = I.e.x, y = I.e.y - 8, tam = d.tam * (d.khoa || 1.15);
  const trong = m => m && !m.dead && Math.hypot(m.x - x, m.y - y) <= tam + (m.r || 0);
  if (trong(I.tg0)) return I.tg0;
  return gan(game, x, y, tam, 8).find(m => Math.abs(lechGoc(Math.atan2(m.y - y, m.x - x) - I.dir)) <= 1.05) || null;
}
// Ngắm một nhát vào con đang khoá (theo chỗ nó lúc nhát ấy đâm ra): mũi đâm lệch ngang quanh nó trong ±lech lần nửa bề rộng trúng,
// nên khoảng chín phần mười số nhát trúng dù nó đứng gần hay xa (docs/17-THAN-PHAP.md). Con khoá đã gục, chạy khỏi tầm: giữ góc rải đã bốc.
function ngam(I, n, dai) {
  const d = I.d, m = I.moi;
  if (!m || m.dead) return;
  const x = I.e.x, y = I.e.y - 8, D = Math.hypot(m.x - x, m.y - y);
  if (D > d.tam * (d.khoa || 1.15) + (m.r || 0)) return;
  const b = Math.atan2(m.y - y, m.x - x), u = (rnd(I) - 0.5) * 2 * (6 + (m.r || 6)) * (d.lech || 1.12);
  n.a = b + Math.atan2(u, Math.max(D, 8)); n.L = Math.max(d.tam * 0.6, D + dai);
  I.huong = b;
}

const THU = {   // Liệp Phong Bách Thứ: hai mươi nhát đâm nhanh dồn vào con mồi đang khoá, nhát cuối xuyên thấu
  bat(game, I) {
    const d = I.d, g = d.goc * Math.PI / 180;
    I.nhat = []; I.moi = khoaMoi(game, I); I.huong = I.dir;
    for (let j = 0; j < d.n; j++) {
      const t = 0.1 + j * 0.029, n = { t, a: I.dir + (rnd(I) - 0.5) * 2 * g, L: d.tam * (0.7 + 0.3 * rnd(I)) };   // không có con nào để khoá: rải hình nón trước mặt
      I.nhat.push(n);
      ev(I, t, () => { tieng(game, I, 'tp.thu', 0.5); ngam(I, n, 10 + rnd(I) * 14); });
      ev(I, t + 0.02, () => { const ex = I.e.x + Math.cos(n.a) * n.L, ey = I.e.y - 8 + Math.sin(n.a) * n.L; for (const m of tren(game, I.e.x, I.e.y - 8, ex, ey, 6)) danh(game, I, m, d.mul, { soft: true }); });
    }
    const tc = 0.1 + d.n * 0.029 + 0.05;
    I.cuoi = { t: tc, a: I.dir, L: d.tam * 1.12 };
    ev(I, tc, () => {
      const c = I.cuoi, m = I.moi;
      if (m && !m.dead) { const x = I.e.x, y = I.e.y - 8, D = Math.hypot(m.x - x, m.y - y); if (D <= d.tam * (d.khoa || 1.15) + (m.r || 0)) { c.a = Math.atan2(m.y - y, m.x - x); c.L = Math.max(c.L, D + 24); I.huong = c.a; } }
      tieng(game, I, 'tp.thu_cuoi', 0.95); rung(game, I, 2.4, 0.16);
      const ex = I.e.x + Math.cos(c.a) * c.L, ey = I.e.y - 8 + Math.sin(c.a) * c.L;
      for (const q of tren(game, I.e.x, I.e.y - 8, ex, ey, 10)) danh(game, I, q, d.cuoi, {});
      for (let i = 0; i < 12; i++) { const a = c.a + (rnd(I) - 0.5) * 2.2, v = 70 + rnd(I) * 120; hat(I, ex, ey, Math.cos(a) * v, Math.sin(a) * v, 0.32, i % 2 ? I.mau : '#fff', i % 3 ? 1 : 2, 0, 4); }
    });
    Object.assign(I, { T: tc + 0.3, an: Math.min(I.an || 0.85, tc + 0.08), va: I.dir });
  },
  nhip(game, I) { chay(I); I.vx = I.e.x + I.ca * 16; I.vy = I.e.y - 8 + I.sa * 16; },
};

const VUC = {   // Huyền Vực Tỏa Hồn: ném vũ khí, hắc khí bung thành vùng tối khoá mục tiêu, vũ khí chém qua lại giữa chúng mười lần
  bat(game, I) {
    const d = I.d, q0 = mucTieu(game, I, I.x, I.y, d.xa + 40, 1)[0];
    let px = I.x + I.ca * d.xa, py = I.y + I.sa * d.xa;
    if (q0) { const D = Math.hypot(q0.x - I.x, q0.y - I.y), k = Math.min(1, (d.xa + 20) / Math.max(1, D)); px = I.x + (q0.x - I.x) * k; py = I.y + (q0.y - I.y) * k; }
    Object.assign(I, { px, py, T: 1.76, an: Math.min(I.an || 1.55, 1.52), tg: [], chem: [], rv: 0, wx: I.x, wy: I.y, va: I.dir + Math.PI });
    ev(I, 0, () => tieng(game, I, 'tp.vuc_nem', 0.7));
    ev(I, 0.2, () => tieng(game, I, 'tp.vuc_mo', 0.9));
    ev(I, 0.42, () => { I.tg = gan(game, I.px, I.py, d.r, 6).map(m => cho({ m, x: m.x, y: m.y })); });
    let tr = { x: px, y: py };
    for (let s = 0; s < d.n; s++) {
      const t = 0.46 + s * 0.085;
      ev(I, t, () => {
        const q = I.tg.length ? cho(I.tg[s % I.tg.length]) : { x: I.px + (rnd(I) - 0.5) * d.r * 1.4, y: I.py + (rnd(I) - 0.5) * d.r };
        const a = Math.atan2(q.y - tr.y, q.x - tr.x), ra = { x: q.x + Math.cos(a) * 16, y: q.y + Math.sin(a) * 16 };   // chém xuyên qua mục tiêu, dừng sau lưng nó
        I.chem.push({ t, x1: tr.x, y1: tr.y, x2: ra.x, y2: ra.y, hx: q.x, hy: q.y });
        tr = ra;
        tieng(game, I, 'tp.vuc_chem', 0.5);
        if (q.m) danh(game, I, q.m, d.mul, { soft: s < d.n - 1, fx: I.px, fy: I.py });
      });
    }
    ev(I, 1.32, () => tieng(game, I, 'tp.vuc_dong', 0.85));
    ev(I, 1.5, () => { rung(game, I, 2.2, 0.18); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; hat(I, I.px, I.py, Math.cos(a) * 110, Math.sin(a) * 70, 0.35, i % 2 ? '#d8b8ff' : '#ff3d7e', 1, 0, 4); } });
  },
  nhip(game, I, dt) {
    chay(I);
    const d = I.d, t = I.t;
    I.rv = t < 0.2 ? 0 : t < 0.42 ? d.r * ease((t - 0.2) / 0.22) : t < 1.32 ? d.r : d.r * (1 - ease(Math.min(1, (t - 1.32) / 0.2)));
    if (t < 0.2) { const k = ease(t / 0.2); I.wx = lerp(I.x, I.px, k); I.wy = lerp(I.y, I.py, k); I.wa = t * 30; }
    else { const c = I.chem[I.chem.length - 1]; if (c) { const k = Math.min(1, (t - c.t) / 0.05); I.wx = lerp(c.x1, c.x2, k); I.wy = lerp(c.y1, c.y2, k); I.wa = Math.atan2(c.y2 - c.y1, c.x2 - c.x1); } else { I.wx = I.px; I.wy = I.py; I.wa = -Math.PI / 2; } }
    if (t > 1.32) { const k = ease(Math.min(1, (t - 1.32) / 0.18)); I.wx = lerp(I.wx, I.px, k); I.wy = lerp(I.wy, I.py, k); }
    I.vx = I.wx; I.vy = I.wy;
    if (I.rv > 4 && Math.random() < dt * 40) { const a = Math.random() * Math.PI * 2, r = I.rv * (0.4 + Math.random() * 0.6); hat(I, I.px + Math.cos(a) * r, I.py + Math.sin(a) * r * 0.62, -Math.sin(a) * 26, Math.cos(a) * 16 - 12, 0.6, Math.random() < 0.7 ? '#1a0d26' : '#7a3cff', 2, -8, 1); }   // hắc khí cuộn
  },
};

const KHAI = {   // Khai Thiên Nhất Trảm: vũ khí vút lên hoá lớn, chém một vầng kiếm quang khổng lồ lan về phía trước
  bat(game, I) {
    const d = I.d, v = 430, t0 = 0.36;
    Object.assign(I, { T: 1.36, an: Math.min(I.an || 1, 1.0), v, t0, trung: new Set(), song: 0, va: I.dir });
    ev(I, 0, () => tieng(game, I, 'tp.khai_tu', 0.85));
    ev(I, 0.31, () => tieng(game, I, 'tp.khai_chem', 1));
    ev(I, t0, () => { rung(game, I, 3.6, 0.24); chop(game, I, 0.07); I.sx = I.e.x; I.sy = I.e.y - 8; });
  },
  nhip(game, I, dt) {
    chay(I);
    const d = I.d, t = I.t, e = I.e;
    if (t < 0.32 && Math.random() < dt * 60) { const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 26, x = e.x + Math.cos(a) * r, y = e.y - 30 + Math.sin(a) * r * 0.7; hat(I, x, y, (e.x - x) * 3.2, (e.y - 30 - y) * 3.2, 0.3, Math.random() < 0.5 ? I.mau : '#ffffff', 1, 0, 0.5); }   // linh khí tụ về thanh kiếm
    if (I.sx != null) {   // vầng kiếm quang lan tới: quái nằm trong dải trước mặt, đã bị mép sóng vượt qua thì trúng một lần
      I.song = Math.min(d.dai, (t - I.t0) * I.v);
      const w = d.rong / 2 * (0.55 + 0.45 * I.song / d.dai);
      if (I.own) for (const m of gan(game, I.sx, I.sy, I.song + 20, 40)) {
        if (I.trung.has(m)) continue;
        const dx = m.x - I.sx, dy = m.y - I.sy, along = dx * I.ca + dy * I.sa, perp = Math.abs(-dx * I.sa + dy * I.ca);
        if (along > -8 && along <= I.song + 6 && perp <= w + (m.r || 0)) { I.trung.add(m); danh(game, I, m, d.mul, { fx: I.sx, fy: I.sy }); }
      }
      else for (const m of gan(game, I.sx, I.sy, I.song + 6, 20)) if (!I.trung.has(m)) { I.trung.add(m); danh(game, I, m, 0, {}); }
    }
    I.vx = e.x + I.ca * 18; I.vy = e.y - 14 + I.sa * 18;
  },
};

export const THUC2 = { 'thien-tran': TRAN, 'bach-thu': THU, 'huyen-vuc': VUC, 'khai-thien': KHAI };
