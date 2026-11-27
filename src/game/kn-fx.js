// Hiệu ứng riêng, vẽ bằng code, của ba kỹ năng đầu game (chủ dự án 26/11/2026 16:22: "nhiều người chê 3 kỹ năng đầu game yếu, nhìn không đẹp
// và nhỏ, không đủ lực chưa đủ đã"; bảng câu hỏi: "Chỉ làm hiệu ứng": số sát thương, vùng trúng GIỮ NGUYÊN). Trước đó các kỹ năng này mượn hình
// của chiêu cũ (data/ky-nang.json → hinh) nên chỉ là một viên đạn nhỏ. Nay kỹ năng nào khai `ve` thì có màn diễn riêng:
//   pha-van  Phá Vân Thức: lưỡi kiếm khí dài xé mây, rẽ hai vệt gió, mỗi con bị xuyên một vệt chém
//   viem     Viêm Nhận: lưỡi lửa lưỡi liềm kéo đuôi lửa, trúng thì nổ thành cột lửa, vòng sóng, tàn lửa, vết cháy
//   han      Hàn Nhận: mũi băng dài kéo sương, trúng thì vỡ thành mảnh băng toả ra, hoa tuyết dưới chân quái
//   kim      Kim Nhận: ba lưỡi kim quang kéo vệt sáng dài, quạt sáng lúc tung, mỗi con trúng một dấu chém chéo
//   dang     Đằng Nhận: trận xanh, dây leo có gai trồi khắp vùng, quấn từng con quái, lá bay
//   thach    Thạch Nhận: vòng gai đá trồi quanh mình, đất nứt, sóng chấn, bụi đá
//   liep     Liệp Phong Bộ: dải gió theo đường lướt, bóng mờ nối đuôi, nhát chém chéo ở cuối đường, mỗi con trúng một vệt chém
// Nối vào bộ máy ra chiêu qua ba cửa của src/game/vfx.js (vfxCast, vfxHit, vfxMobHit: máy mình, bản sao So tài, người khác đứng xem đều đi
// qua đó) nên không đổi luật trúng. File này chỉ tạo và cập nhật trạng thái (game.knFx: fx = màn đang diễn, hat = hạt sáng); vẽ ở
// src/render/draw-kn-fx.js (lớp trên cùng, cạnh Thân pháp). Không khựng hình; chỉ rung nhẹ ở máy người ra chiêu.
import { hitSfx } from './skill-sfx.js';

const CAP = 240, R = Math.random, TAU = Math.PI * 2;
const st = game => (game.knFx ??= { fx: [], hat: [] });
export const knVe = (game, id) => (id && game.data?.vfx?.skills?.[id]?.kn) || null;
const rung = (game, who, a, t) => { if (who && who === game.player) game.screen?.shake?.(a, t); };
const them = (game, o) => { const S = st(game); if (S.fx.length >= 70) S.fx.shift(); S.fx.push({ t: 0, life: 0.5, ...o }); };
// Hạt sáng: s cỡ điểm, g trọng lực (âm: bay lên), keo: độ hãm
export function knHat(game, x, y, vx, vy, life, c, s = 1, g = 0, keo = 2.5) {
  const S = st(game), cap = +(globalThis.document?.body?.dataset.perf || 0) >= 3 ? CAP / 2 : CAP;   // máy đã tự hạ mức (src/core/perf.js): nửa số hạt
  if (S.hat.length >= cap) S.hat.shift();
  S.hat.push({ x, y, vx, vy, life, c, s, g, keo, t: 0 });
}
// n hạt toé từ (x, y): mau mảng màu, v0 tốc, len lực bốc lên, g trọng lực; a, mo: chỉ toé trong quạt mo quanh hướng a
function toe(game, x, y, n, mau, v0, len = 0, g = 160, a = 0, mo = TAU) {
  for (let i = 0; i < n; i++) { const q = a + (R() - 0.5) * mo, v = v0 * (0.35 + R() * 0.8); knHat(game, x, y, Math.cos(q) * v, Math.sin(q) * v * 0.6 - len * (0.3 + R()), 0.3 + R() * 0.4, mau[i % mau.length], i % 4 ? 1 : 2, g); }
}
const SANG = '#ffffff';
const MAU = { 'pha-van': ['#c8f6ff', SANG, '#7fd8ff'], viem: ['#ffd27a', '#ff7a3a', '#fff4c8'], han: ['#bfe8ff', SANG, '#5ab8f0'], kim: ['#f2e27a', SANG, '#ffd04a'], dang: ['#8fe07a', '#d8f08a', '#3f9a50'], thach: ['#c08850', '#e8c898', '#7a5a3a'], liep: ['#ffb060', SANG, '#ffe0a8'] };

// ---- tung chiêu
const TUNG = {
  'pha-van'(game, s, who, a) {
    const x = who.x + Math.cos(a) * 8, y = who.y - 6 + Math.sin(a) * 8;
    them(game, { k: 'pv-cast', x, y, a, c: s.color, life: 0.32 });
    for (const d of [-1, 1]) toe(game, x, y, 5, MAU['pha-van'], 70, 6, 20, a + d * 1.5, 0.6);   // mây rẽ sang hai bên
    rung(game, who, 1.2, 0.1);
  },
  viem(game, s, who, a) {
    const x = who.x + Math.cos(a) * 8, y = who.y - 6 + Math.sin(a) * 8;
    them(game, { k: 'vm-cast', x, y, a, c: s.color, life: 0.3 });
    toe(game, x, y, 10, MAU.viem, 80, 30, -30, a, 1.6);
    rung(game, who, 1, 0.08);
  },
  han(game, s, who, a) {
    const x = who.x + Math.cos(a) * 8, y = who.y - 6 + Math.sin(a) * 8;
    them(game, { k: 'hn-cast', x, y, a, c: s.color, life: 0.34 });
    toe(game, x, y, 9, MAU.han, 60, 10, 40, a, 2.2);
  },
  kim(game, s, who, a) {
    them(game, { k: 'km-cast', x: who.x, y: who.y - 6, a, n: s.count || 3, mo: (s.spread || 30) * Math.PI / 180, c: s.color, life: 0.3 });
    toe(game, who.x + Math.cos(a) * 10, who.y - 6 + Math.sin(a) * 10, 9, MAU.kim, 90, 10, 40, a, 1.2);
    rung(game, who, 1, 0.08);
  },
  dang(game, s, who, a, info) {
    const x = info.cx ?? who.x, y = info.cy ?? who.y, r = s.radius || 36, day = [];
    for (let i = 0; i < 10; i++) {   // mười dây leo: gốc rải trong vùng, mỗi dây vươn lên, uốn về một phía, có gai
      const g = i / 10 * TAU + R() * 0.5, d = r * (i < 3 ? 0.25 : 0.55 + R() * 0.35), cao = 20 + R() * 16, uon = (R() < 0.5 ? -1 : 1) * (5 + R() * 7);
      day.push({ x: Math.cos(g) * d, y: Math.sin(g) * d * 0.62, cao, uon, tre: i * 0.022, pha: R() * TAU });
    }
    them(game, { k: 'dg-cast', x, y, r, c: s.color, life: 1.0, day });
    for (let i = 0; i < 16; i++) { const g = R() * TAU, d = r * Math.sqrt(R()); knHat(game, x + Math.cos(g) * d, y + Math.sin(g) * d * 0.62, (R() - 0.5) * 30, -40 - R() * 50, 0.6 + R() * 0.5, MAU.dang[i % 3], i % 3 ? 1 : 2, 70, 1.8); }   // lá bật lên rồi rơi
    rung(game, who, 1.4, 0.14);
  },
  thach(game, s, who, a, info) {
    const x = info.cx ?? who.x, y = info.cy ?? who.y, r = s.radius || 40, gai = [], nut = [];
    for (let i = 0; i < 16; i++) {   // mười gai vòng ngoài, sáu gai vòng trong: trồi lần lượt từ phía trước mặt vòng ra sau
      const ngoai = i < 10, n = ngoai ? 10 : 6, g = a + (ngoai ? i : i - 10 + 0.5) / n * TAU, d = r * (ngoai ? 0.74 : 0.4), lech = Math.abs(Math.atan2(Math.sin(g - a), Math.cos(g - a))) / Math.PI;
      gai.push({ x: Math.cos(g) * d, y: Math.sin(g) * d * 0.62, cao: (ngoai ? 20 : 13) + R() * 8, rong: (ngoai ? 9 : 7) + R() * 3, ngh: (R() - 0.5) * 0.5, tre: lech * 0.12 + (ngoai ? 0 : 0.05) });
    }
    for (let i = 0; i < 7; i++) { const g = i / 7 * TAU + R() * 0.6, pts = [[0, 0]]; for (let k = 1; k <= 3; k++) pts.push([Math.cos(g + (R() - 0.5) * 0.8) * r * 0.95 * k / 3, Math.sin(g + (R() - 0.5) * 0.8) * r * 0.95 * k / 3 * 0.62]); nut.push(pts); }
    them(game, { k: 'th-cast', x, y, r, a, c: s.color, life: 0.9, gai, nut });
    for (const G of gai) toe(game, x + G.x, y + G.y, 2, MAU.thach, 50, 50, 300);
    rung(game, who, 2.6, 0.2);
  },
  liep(game, s, who, a, info) {
    const x = info.sx ?? who.x, y = (info.sy ?? who.y) - 6;
    let x2 = who.x, y2 = who.y - 6;
    if (who !== game.player && Math.hypot(x2 - x, y2 - y) < 12) { x2 = x + Math.cos(a) * (s.dist || 60); y2 = y + Math.sin(a) * (s.dist || 60); }   // máy người xem: tin tới lúc họ còn ở đầu đường (src/game/others-cast.js) → vẽ theo hướng và quãng lướt. Máy mình thì không: lướt vào tường là đứng lại, không vẽ dải gió xuyên tường
    them(game, { k: 'lp-cast', x, y, x2, y2, a, c: s.color, life: 0.5 });
    for (let i = 0; i < 14; i++) { const k = R(), px = x + (x2 - x) * k, py = y + (y2 - y) * k; knHat(game, px + (R() - 0.5) * 10, py + (R() - 0.5) * 10, -Math.cos(a) * (30 + R() * 60), -Math.sin(a) * (30 + R() * 60) - 10, 0.3 + R() * 0.3, MAU.liep[i % 3], i % 3 ? 1 : 2, 30, 3); }   // gió, bụi tạt ngược
    toe(game, x2 + Math.cos(a) * 6, y2 + Math.sin(a) * 6, 10, MAU.liep, 100, 10, 60, a, 1.4);
    rung(game, who, 1.6, 0.12);
  },
};
export function knCast(game, id, s, who, info = {}) {
  const f = TUNG[knVe(game, id)];
  if (!f) return false;
  f(game, s, who, Math.atan2(who.face?.y || 0, who.face?.x || 1), info);
  return true;
}

// ---- đạn trúng một con / nổ lan / hết đường (src/game/combat.js gọi qua vfxHit). big: bán kính nổ lan
export function knHit(game, b, x, y, big = 0) {
  const k = knVe(game, b.sk);
  if (!k) return false;
  const a = Math.atan2(b.vy, b.vx), het = b.life <= 0 && !big && b.pierce, cua = b.from === 'player' ? game.player : null;   // het: đạn xuyên bay hết đường, tan đi (không phải trúng)
  if (!het) hitSfx(game, b.sk, big ? 0.9 : 0.7, !!big);
  if (k === 'pha-van') {
    if (het) { them(game, { k: 'pv-tan', x, y, a, c: b.color, life: 0.3 }); toe(game, x, y, 8, MAU[k], 70, 6, 30, a, 1.4); }
    else { them(game, { k: 'pv-hit', x, y: y - 6, a: a + (R() - 0.5) * 0.9, c: b.color, life: 0.28 }); toe(game, x, y - 6, 7, MAU[k], 110, 10, 80, a, 1.0); rung(game, cua, 0.9, 0.06); }
  } else if (k === 'viem') {
    const r = big || 24;
    them(game, { k: 'vm-no', x, y, r, c: b.color, life: 0.6 });
    toe(game, x, y - 4, 24, MAU.viem, 130, 70, -20);
    for (let i = 0; i < 8; i++) knHat(game, x + (R() - 0.5) * r, y - R() * 8, (R() - 0.5) * 16, -50 - R() * 60, 0.5 + R() * 0.4, '#5a4a44', 2, -20, 1.5);   // khói
    rung(game, cua, 2.2, 0.16);
  } else if (k === 'han') {
    const manh = []; for (let i = 0; i < 7; i++) manh.push({ a: i / 7 * TAU + R() * 0.5, dai: 13 + R() * 10, rong: 3 + R() * 2 });
    them(game, { k: 'hn-no', x, y: y - 4, c: b.color, life: 0.6, manh });
    for (let i = 0; i < 12; i++) knHat(game, x + (R() - 0.5) * 24, y - 6 - R() * 14, (R() - 0.5) * 20, 6 + R() * 16, 0.6 + R() * 0.5, MAU.han[i % 3], i % 3 ? 1 : 2, 10, 1.2);   // tuyết rơi chậm
    rung(game, cua, 1.2, 0.08);
  } else if (k === 'kim') {
    if (het) them(game, { k: 'pv-tan', x, y, a, c: b.color, life: 0.22, nho: 1 });
    else { them(game, { k: 'km-hit', x, y: y - 6, a, c: b.color, life: 0.26 }); toe(game, x, y - 6, 6, MAU.kim, 100, 10, 80, a, 1.0); rung(game, cua, 0.7, 0.05); }
  } else return false;
  return true;
}

// ---- một con trúng chiêu vùng / đường lướt (vfxMobHit)
export function knMobHit(game, id, m) {
  const k = knVe(game, id);
  if (!k) return false;
  hitSfx(game, id, 0.5);
  const y = m.y - (m.r || 6) * 0.5, c = game.data.skills[id]?.color;
  if (k === 'dang') { them(game, { k: 'dg-troi', on: m, x: m.x, y, r: (m.r || 6) + 3, c, life: 0.9 }); toe(game, m.x, y, 5, MAU.dang, 50, 30, 90); }
  else if (k === 'thach') toe(game, m.x, y, 6, MAU.thach, 70, 50, 320);
  else if (k === 'liep') { them(game, { k: 'lp-hit', x: m.x, y, a: R() * Math.PI, c, life: 0.28 }); toe(game, m.x, y, 6, MAU.liep, 100, 10, 80); }
  else return false;
  return true;
}

// ---- mỗi khung: màn diễn, hạt; đạn của kỹ năng thả hạt đuôi
export function updateKnFx(game, dt) {
  const S = game.knFx;
  for (const b of game.bullets || []) {
    const k = knVe(game, b.sk);
    if (!k) continue;
    b.knT = (b.knT || 0) + dt; b.knA = (b.knA || 0) + dt * (k === 'viem' ? 46 : k === 'kim' ? 16 : 30);
    while (b.knA >= 1) {
      b.knA--; const M = MAU[k], sp = Math.hypot(b.vx, b.vy) || 1, nx = -b.vy / sp, ny = b.vx / sp, d = (R() - 0.5) * (k === 'viem' ? 12 : 9);
      knHat(game, b.x + nx * d - b.vx / sp * 6, b.y + ny * d - b.vy / sp * 6, -b.vx * 0.12 + nx * d * 3, -b.vy * 0.12 + ny * d * 3 - (k === 'viem' ? 26 : 0), 0.3 + R() * 0.3, M[(R() * M.length) | 0], R() < 0.25 ? 2 : 1, k === 'viem' ? -40 : k === 'han' ? 30 : 0, 2.5);
    }
  }
  if (!S) return;
  for (const f of S.fx) { f.t += dt; if (f.on && !f.on.dead) { f.x = f.on.x; f.y = f.on.y - (f.on.r || 6) * 0.5; } }
  S.fx = S.fx.filter(f => f.t < f.life);
  for (const q of S.hat) { q.t += dt; q.vy += q.g * dt; const h = Math.max(0, 1 - q.keo * dt); q.vx *= h; q.vy *= q.g ? 1 : h; q.x += q.vx * dt; q.y += q.vy * dt; }
  S.hat = S.hat.filter(q => q.t < q.life);
}
