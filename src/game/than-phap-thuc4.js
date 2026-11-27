// Hai thức Thân pháp của truyện Thiên Kim (chủ dự án 26/11/2026 13:40: "thêm vài thân pháp hiệu ứng cao đẹp hơn"; docs/17-THAN-PHAP.md):
// Vạn Kiếm Quy Trủng (Kiếm Lão, người giữ mộ) và Bách Luyện Thiên Chùy (Thiết Lan, thợ rèn). Cùng khuôn với src/game/than-phap-thuc2.js:
// bat dựng lịch (tiếng, lần trúng, hạt), nhip chạy lịch và rắc hạt; hình vẽ ở src/render/draw-than-phap4.js tính theo I.t.
// Không khựng hình; chỉ rung và chớp dịu ở máy người ra đòn. Số ở data/than-phap.json → thuc.quy-trung, thuc.bach-luyen.
import { gan, danh, hat, tieng, rnd, ev, chay, dongNhat } from './than-phap-cu.js';

const rung = (game, I, a, t) => { if (I.own) game.screen?.shake?.(a, t); };
const chop = (game, I, s) => { if (I.own) game.flashT = Math.max(game.flashT || 0, s); };
// Chỗ diễn: chỗ đông quái nhất trong tầm, không thì con đang nhắm, không thì khoảng đất trước mặt
function tam(game, I, d) {
  const m = dongNhat(game, I.x, I.y, d.tam, d.r * 0.8) || (I.tg0 && !I.tg0.dead ? I.tg0 : null);
  return m ? [m.x, m.y] : [I.x + I.ca * d.tam * 0.6, I.y + 8 + I.sa * d.tam * 0.6];
}
// Vết nứt toả ra từ tâm: mỗi vết vài đoạn gãy khúc (toạ độ lệch so với tâm)
function vetNut(I, n, dai) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + rnd(I) * 0.5, L = dai * (0.55 + rnd(I) * 0.6), pts = [[0, 0]];
    for (let k = 1; k <= 3; k++) pts.push([Math.cos(a + (rnd(I) - 0.5) * 0.8) * L * k / 3, Math.sin(a + (rnd(I) - 0.5) * 0.8) * L * k / 3 * 0.6]);
    out.push(pts);
  }
  return out;
}
const toe = (I, x, y, n, mau, v0, len, g) => {   // n hạt toé lên từ (x, y): mau là mảng màu, len: lực bốc lên, g: trọng lực
  for (let i = 0; i < n; i++) { const a = rnd(I) * Math.PI * 2, v = v0 * (0.35 + rnd(I)); hat(I, x, y, Math.cos(a) * v, Math.sin(a) * v * 0.55 - len * (0.4 + rnd(I)), 0.4 + rnd(I) * 0.45, mau[i % mau.length], i % 4 ? 1 : 2, g, 2.4); }
};

// Vạn Kiếm Quy Trủng: cắm vũ khí xuống đất; mười hai thanh kiếm (bản sao vũ khí) lần lượt trồi lên thành vòng mộ quanh kẻ địch, vây chúng lại;
// rồi từng đợt ba thanh lao vào giữa cắm thành một gò kiếm; cuối cùng một thanh kiếm lớn hiện ra trên gò, ngả xuống NẰM YÊN: đất rung,
// vòng sóng, vết nứt sáng, rồi cả gò tan thành đốm sáng bay lên. "Cắm cho nó đứng thì dễ. Cắm cho nó chịu nằm mới khó."
const TRUNG = {
  bat(game, I) {
    const d = I.d, [px, py] = tam(game, I, d), kiem = [];
    for (let i = 0; i < d.n; i++) {
      const a = i / d.n * Math.PI * 2 + rnd(I) * 0.2, rm = 5 + rnd(I) * 10;
      kiem.push({ a, x: px + Math.cos(a) * d.r, y: py + Math.sin(a) * d.r * 0.62, ts: 0.16 + i * 0.03, td: 0.66 + (i % d.dot) * 0.1, mx: px + Math.cos(a) * rm, my: py + Math.sin(a) * rm * 0.6, ng: (rnd(I) - 0.5) * 0.9 });
    }
    Object.assign(I, { px, py, kiem, T: 1.78, an: Math.min(I.an || 1.35, 1.35), vx: px, vy: py - 8, va: -Math.PI / 2, nut: vetNut(I, 9, d.no_r * 1.2), tn: 1.16 });
    ev(I, 0, () => tieng(game, I, 'tp.trung_cam', 0.9));
    ev(I, 0.16, () => tieng(game, I, 'tp.trung_troi', 0.9));
    for (const K of kiem) ev(I, K.ts, () => toe(I, K.x, K.y + 2, 5, [I.mau, '#fff6d8', '#8a7a62'], 40, 60, 220));   // đất bật lên chỗ kiếm trồi
    ev(I, 0.56, () => { for (const m of gan(game, px, py, d.r + 8, 30)) danh(game, I, m, d.vay, { soft: true, slow: d.cham, fx: 2 * m.x - px, fy: 2 * m.y - py }); });   // vòng mộ khép: vây, làm chậm, dồn nhẹ vào giữa
    for (let v = 0; v < d.dot; v++) ev(I, 0.75 + v * 0.1, () => {   // một đợt kiếm cắm vào gò
      tieng(game, I, 'tp.trung_ha', 0.8);
      for (const m of gan(game, px, py, d.r * 0.75, 30)) danh(game, I, m, d.mul, { soft: true, fx: 2 * m.x - px, fy: 2 * m.y - py });
      toe(I, px, py, 8, [I.mau, '#ffffff'], 70, 50, 200);
    });
    ev(I, I.tn, () => {   // thanh kiếm lớn nằm xuống
      tieng(game, I, 'tp.trung_nam', 1); rung(game, I, 4.2, 0.3); chop(game, I, 0.08);
      for (const m of gan(game, px, py, d.no_r, 30)) danh(game, I, m, d.cuoi, { stun: d.choang, fx: px, fy: py });
      toe(I, px, py - 2, 36, ['#fff6d8', I.mau, '#9a8a78'], 150, 70, 260);
    });
  },
  nhip(game, I, dt) {
    chay(I);
    const t = I.t;
    if (t > 0.2 && t < 0.66 && Math.random() < dt * 30) { const K = I.kiem[(Math.random() * I.kiem.length) | 0]; if (t > K.ts) hat(I, K.x + (Math.random() - 0.5) * 6, K.y - 6, 0, -30 - Math.random() * 30, 0.5, Math.random() < 0.6 ? I.mau : '#ffffff', 1, -10, 1.5); }   // linh quang bốc theo kiếm đang lơ lửng
    if (t > I.tn + 0.1 && t < I.tn + 0.55 && Math.random() < dt * 60) hat(I, I.px + (Math.random() - 0.5) * 44, I.py + (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, -36 - Math.random() * 46, 0.9, Math.random() < 0.55 ? I.mau : '#ffffff', Math.random() < 0.25 ? 2 : 1, -14, 1.2);   // gò kiếm tan thành đốm sáng bay lên
  },
};

// Bách Luyện Thiên Chùy: vũ khí bay tới trên đe lửa hiện giữa đám địch, nung đỏ dần; ba nhát nện từ trên xuống, nhát sau lớn và nóng hơn
// nhát trước (cam → vàng → trắng), mỗi nhát toé hoa lửa, vòng sóng; nhát thứ ba làm đất nứt chảy đỏ; rồi TÔI: hơi nước trắng lam bung lên,
// vết nứt nguội đi, vũ khí loé lạnh. "Thép phải qua lửa, qua búa, qua nước."
const LUYEN = {
  bat(game, I) {
    const d = I.d, [px, py] = tam(game, I, d), LUA = ['#ffd27a', '#ff8a2a', '#fff4c8'];
    Object.assign(I, { px, py, T: 1.7, an: Math.min(I.an || 1.3, 1.3), vx: px, vy: py - 10, va: -Math.PI / 2, nut: vetNut(I, 8, d.no_r * 0.95), bua: [0.3, 0.6, 0.96], toi: 1.16 });
    ev(I, 0, () => tieng(game, I, 'tp.luyen_lua', 0.85));
    const dap = (i, r, k, o) => () => {
      tieng(game, I, i < 2 ? 'tp.luyen_bua' : 'tp.luyen_bua3', i < 2 ? 0.8 + i * 0.2 : 1); rung(game, I, 1.5 + i * 1.5, 0.12 + i * 0.09);
      if (i === 2) chop(game, I, 0.07);
      for (const m of gan(game, px, py, r, 30)) danh(game, I, m, k, { ...o, fx: px, fy: py });
      toe(I, px, py - 3, 22 + i * 18, LUA, 120 + i * 55, 90 + i * 34, 380);
    };
    ev(I, I.bua[0], dap(0, d.r, d.mul, { soft: true }));
    ev(I, I.bua[1], dap(1, d.r, d.lan2, { soft: true }));
    ev(I, I.bua[2], dap(2, d.no_r, d.cuoi, { stun: d.choang }));
    ev(I, I.toi, () => {   // tôi vào nước: hơi bốc
      tieng(game, I, 'tp.luyen_toi', 0.9);
      for (let i = 0; i < 26; i++) hat(I, px + (rnd(I) - 0.5) * 40, py - rnd(I) * 6, (rnd(I) - 0.5) * 26, -40 - rnd(I) * 70, 0.6 + rnd(I) * 0.5, i % 3 ? '#dff4ff' : '#ffffff', i % 3 ? 2 : 1, -30, 1.6);
    });
  },
  nhip(game, I, dt) {
    chay(I);
    if (I.t < I.toi && Math.random() < dt * 34) hat(I, I.px + (Math.random() - 0.5) * I.d.r * 1.3, I.py + (Math.random() - 0.5) * I.d.r * 0.6, (Math.random() - 0.5) * 8, -24 - Math.random() * 36, 0.7, Math.random() < 0.5 ? '#ff8a2a' : '#ffd27a', 1, -8, 1.2);   // tàn lửa bốc từ đe
  },
};

export const THUC4 = { 'quy-trung': TRUNG, 'bach-luyen': LUYEN };
