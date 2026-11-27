// Công cụ dùng chung của các thức Thân pháp (src/game/than-phap-thuc*.js; luật chung ở src/game/than-phap.js, docs/17-THAN-PHAP.md): tìm quái
// quanh một chỗ, trên một đường; một lần trúng (máy mình trừ máu, máy người xem chỉ toé sáng); hạt sáng; tiếng; số giả ngẫu nhiên theo màn diễn.
// Tệp này không nhập than-phap.js nên các tệp thức nhập nó mà không thành vòng tròn.
import { hitMob } from './combat.js';
import { comboSwing } from './juice.js';

// Quái còn sống trong vòng r quanh (x, y), gần trước
export function gan(game, x, y, r, n = 99) {
  const ds = [];
  for (const m of game.mobs || []) { if (m.dead) continue; const d = Math.hypot(m.x - x, m.y - y); if (d <= r + (m.r || 0)) ds.push([d, m]); }
  return ds.sort((a, b) => a[0] - b[0]).slice(0, n).map(v => v[1]);
}
// Quái chạm đoạn thẳng (x1, y1) → (x2, y2) dày w
export function tren(game, x1, y1, x2, y2, w) {
  const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy || 1, out = [];
  for (const m of game.mobs || []) {
    if (m.dead) continue;
    const k = Math.max(0, Math.min(1, ((m.x - x1) * dx + (m.y - y1) * dy) / l));
    if (Math.hypot(m.x - (x1 + dx * k), m.y - (y1 + dy * k)) <= w + (m.r || 0)) out.push(m);
  }
  return out;
}
// Chỗ đông quái nhất trong tầm r quanh (x, y) (tâm là một con quái có nhiều con khác quanh nó trong vòng rr); không có quái: null
export function dongNhat(game, x, y, r, rr) {
  let best = null, bn = -1;
  for (const m of gan(game, x, y, r, 30)) { let n = 0; for (const k of game.mobs) if (!k.dead && Math.hypot(k.x - m.x, k.y - m.y) <= rr) n++; if (n > bn) { bn = n; best = m; } }
  return best;
}
// Một lần trúng của thức: máy mình trừ máu quái (hitMob, tính bạo kích, Liên Kích như nhát chém thường), máy người xem chỉ toé sáng.
// k: phần sát thương so với một nhát chém thường; o: { soft: nhịp nhỏ đẩy nhẹ, stun, slow, fx, fy: chỗ đòn tới (đẩy lùi theo hướng ấy) }
export function danh(game, I, m, k, o = {}) {
  if (!m || m.dead) return false;
  toe(I, m.x, m.y - (m.r || 6) * 0.5, I.mau, o.soft ? 3 : 6);
  if (!I.own || I.demo || !game.mobs.includes(m)) return true;
  (game.tpTrung || hitMob)(game, m, I.dmg * k, { color: I.mau, normal: true, fromX: o.fx ?? I.x, fromY: o.fy ?? I.y, soft: !!o.soft, stun: o.stun, slow: o.slow, k, nhat: I.tpI, cuoi: I.tpCuoi });   // tpTrung: chỉ bài thử tools/than-phap.test.mjs đặt để đếm đòn
  if (!I.dem) { I.dem = 1; comboSwing(game); }   // Liên Kích: một nhát của chuỗi tính một, dù thức trúng bao nhiêu lần
  return true;
}
// Hạt sáng của màn diễn (vẽ ở draw-than-phap.js): life giây, s cỡ điểm, g trọng lực, keo: độ hãm
export function hat(I, x, y, vx, vy, life, c, s = 1, g = 0, keo = 3) { if (I.hat.length < 160) I.hat.push({ x, y, vx, vy, life, c, s, g, keo, t: 0 }); }
export function toe(I, x, y, c, n) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 90; hat(I, x, y, Math.cos(a) * v, Math.sin(a) * v - 20, 0.22 + Math.random() * 0.2, i % 3 ? c : '#ffffff', i % 2 ? 1 : 2, 60, 4); } }
// Tiếng của màn diễn: người khác ở xa thì thôi, ở gần thì nhỏ hơn tiếng của mình
export function tieng(game, I, ten, v = 1) {
  const p = game.player;
  if (!I.own && (!p || Math.hypot(I.x - p.x, I.y - p.y) > 260)) return;
  game.sfx?.(ten, v * (I.own ? 1 : 0.45));
}
// Số giả ngẫu nhiên theo hạt của màn diễn (cùng một màn, cùng dãy số)
export function rnd(I) { I.seed = (I.seed * 1103515245 + 12345) & 0x7fffffff; return I.seed / 0x7fffffff; }

// Lịch của một màn diễn: ev đặt việc vào giây t, chay làm mọi việc đã tới giờ (gọi đầu mỗi nhip)
export const ev = (I, t, f) => { (I.ev ??= []).push({ t, f }); I.ev.sort((a, b) => a.t - b.t); };
export const chay = I => { while (I.ev?.length && I.ev[0].t <= I.t) I.ev.shift().f(); };
export const ease = k => 1 - (1 - k) * (1 - k);
export const lerp = (a, b, k) => a + (b - a) * k;
// Chỗ của một con quái mục tiêu (nó đã gục hoặc biến mất thì giữ chỗ cuối)
export const cho = q => { if (q.m && !q.m.dead) { q.x = q.m.x; q.y = q.m.y - (q.m.r || 6) * 0.4; } return q; };
// Vài mục tiêu quanh (x, y) trong tầm r, con đang nhắm (tg0) lên trước; không đủ thì thêm chỗ trống phía trước theo hình quạt
export function mucTieu(game, I, x, y, r, n) {
  const ds = gan(game, x, y, r, n), out = [];
  if (I.tg0 && !I.tg0.dead && ds.includes(I.tg0)) out.push(I.tg0);
  for (const m of ds) if (!out.includes(m)) out.push(m);
  return out.map(m => cho({ m, x: m.x, y: m.y }));
}

