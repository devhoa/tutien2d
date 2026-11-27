// Nguyên Anh xuất khiếu (chủ dự án 27/11/2026 00:1x: "nếu nguyên anh cũng giống y như bản thân, bản thân như nào nguyên anh như vậy, chỉ khác là
// màu vàng"; docs/21-NGUYEN-ANH.md). Từ cảnh giới Nguyên Anh (đã qua lễ Kết Anh, src/game/le-anh.js), đang đánh quái thì cứ một quãng Nguyên Anh rời
// thân bay ra đánh cùng: y hệt nhân vật (thời trang, vũ khí, dáng đánh), chỉ khác là bằng vàng. Mỗi nhát đánh thường của mình trúng quái
// (src/game/juice.js comboSwing gọi game.naDanh) thì Nguyên Anh chém theo một nhát vào con gần nó, sát thương = phần k của đòn đánh thường gốc
// (p.dmgGoc, src/game/player.js). Chỉ đánh quái: không có tin đòn PvP nào đi ra từ Nguyên Anh.
// Hình viết MỘT lần cho mình và người khác (src/game/dien.js, hiệu ứng 'na-ra'): máy người xem dựng một Nguyên Anh chỉ để nhìn đi theo người đó, họ
// vung đòn thì nó chém theo (không trừ máu con nào). Số ở data/nguyen-anh.json; vẽ ở src/render/draw-nguyen-anh.js.
import { hieuUng, dien } from './dien.js';
import { hitMob } from './combat.js';
import { updateAnhFx } from './anh-the.js';

export const NA = data => data?.['nguyen-anh'];
export const naOn = data => !!NA(data)?.on;
export const naMo = (save, data) => naOn(data) && Math.max(save?.realm | 0, save?.tiem?.max | 0) >= (NA(data).mo ?? 3);   // cảnh giới cao nhất từng đạt (ma tụt cảnh giới vẫn giữ)
export const naThuc = (save, data) => naMo(save, data) && !!save?.flags?.['na-thuc'];   // đã qua lễ Kết Anh

// Phẩm Nguyên Anh (0 Phàm … 5 Tiên, cùng bảng tên, màu với thể chất data/the-chat.json → pham): NGƯỢC với phẩm thể chất (chủ dự án 27/11/2026 01:16:
// "thể phách càng sịn thì nguyên anh càng đểu và ngược lại"). Không quay: thể chất do máy chủ quay, nên phẩm Nguyên Anh cũng không sửa tay được.
// Chưa bật Thể chất thì phẩm giữa (Huyền).
export function naPham(save, data) {
  const T = data?.['the-chat'], n = (NA(data)?.pham || []).length || 6, t = T?.on && typeof save?.theChat === 'string' ? T.the?.[save.theChat] : null;
  return t ? Math.max(0, Math.min(n - 1, n - 1 - (t.pham | 0))) : Math.min(2, n - 1);
}
export const naBac = (save, data) => NA(data).pham[naPham(save, data)];
export const naTen = (save, data) => data?.['the-chat']?.pham?.[naPham(save, data)] || { ten: '', mau: '#ffcd45' };   // tên, màu phẩm

// Phần sát thương mỗi nhát = k của phẩm × hệ số tầng (Nguyên Anh tầng 1 → 9; cảnh giới sau giữ mức tầng 9; ma bị diệt tụt khỏi Nguyên Anh thì mức tầng 1)
export function naK(save, data) {
  const C = NA(data), [t0, t9] = C.tang || [1, 1], mo = C.mo ?? 3, r = save?.realm | 0, k = naBac(save, data).k;
  if (r > mo) return k * t9;
  if (r < mo) return k * t0;
  const tang = Math.max(1, Math.min(9, (save?.layer | 0) || 1));
  return k * (t0 + (t9 - t0) * (tang - 1) / 8);
}

const VAO = 0.35, VE = 0.45;   // giây rời thân, giây bay về
export const naPha = n => ({ ra: Math.min(1, n.t / VAO), ve: Math.min(1, Math.max(0, (n.life - n.t) / VE)) });
export function st(game) {
  game.naDs ??= []; game.naLe ??= [];
  return (game.naSt ??= { cd: 0, chien: 99 });
}

// Dựng một Nguyên Anh đi theo thân e (mình: game.player; người khác: bản đang thấy của họ), sống life giây
function them(game, e, life) {
  const C = NA(game.data), S = st(game), mine = e === game.player;
  const cu = game.naDs.find(n => n.on === e);
  if (cu) { cu.life = Math.max(cu.life, cu.t + life); return cu; }
  if (!mine && game.naDs.filter(n => !n.mine).length >= (C.hien_toi_da ?? 4)) return null;   // nhiều người cùng xuất khiếu: chỉ dựng vài cái (nhẹ máy)
  const n = { on: e, mine, na: true, x: e.x, y: e.y - 8, face: { ...(e.face || { x: 1, y: 0 }) }, lookX: e.lookX || 1, t: 0, life, swingT: 0, swingNew: false,
    atkN: 0, heroAnim: null, moving: false, walkT: 0, q: [], chem: [], oSw: e.swingT || 0, seed: Math.random() * 10, element: e.element || null };
  game.naDs.push(n);
  const T = C.tieng || {};
  if (T.ra) game.sfx?.(T.ra, mine ? 0.8 : 0.35);
  if (mine) game.screen?.shake?.(1.2, 0.12);   // nhẹ, chỉ máy mình; không khựng hình
  S.x = n.x;
  return n;
}
hieuUng('na-ra', { gap: 1, ve(game, e, h, a, b) {
  if (!naOn(game.data)) return;
  const n = them(game, e, Math.max(1, Math.min(20, Math.round(a * 200) / 10)));
  if (n) n.pham = Math.max(0, Math.min(5, Math.round(b * 10)));
} });

// Nhát đánh thường của mình vừa trúng quái (juice.js comboSwing)
export function naDanh(game) {
  const C = NA(game.data);
  if (!C?.on) return;
  const S = st(game), n = game.naDs.find(x => x.mine);
  S.chien = 0;
  if (n && n.t > VAO && n.t < n.life - VE && n.q.length < 3) n.q.push(game.time + (C.tre ?? 0.14));
}

const gan = (game, n, R) => {   // con quái sống gần Nguyên Anh nhất, trong tầm R (cộng bán kính quái)
  let best = null, bd = R;
  for (const m of game.mobs || []) { if (m.dead || m.hp <= 0) continue; const d = Math.hypot(m.x - n.x, m.y - n.y) - (m.r || 6); if (d < bd) { bd = d; best = m; } }
  return best;
};
const mucCua = (game, o) => {   // con mồi của chủ: con gần chủ nhất trong 90
  let best = null, bd = 90;
  for (const m of game.mobs || []) { if (m.dead || m.hp <= 0) continue; const d = Math.hypot(m.x - o.x, m.y - o.y); if (d < bd) { bd = d; best = m; } }
  return best;
};

function chem(game, n, C) {
  n.swingT = 0.18; n.swingNew = true;
  const m = gan(game, n, (C.tam ?? 22) + 10);
  const a = m ? Math.atan2(m.y - n.y, m.x - n.x) : Math.atan2(n.face.y, n.face.x);
  if (m) n.face = { x: Math.cos(a), y: Math.sin(a) };
  n.chem.push({ x: m ? m.x : n.x + Math.cos(a) * 18, y: m ? m.y - (m.r || 6) * 0.6 : n.y - 6 + Math.sin(a) * 18, a, t: 0, life: 0.24, lech: Math.random() < 0.5 ? -1 : 1 });
  if (n.chem.length > 6) n.chem.shift();
  if (n.mine && m) {   // chỉ máy mình trừ máu; máy người xem chỉ vẽ
    const p = game.player, k = naK(game.save, game.data);
    hitMob(game, m, (p.dmgGoc || p.atk || 1) * k, { color: C.mau?.chem || '#ffe08a', fromX: n.x, fromY: n.y, na: true });
  }
}

// Một khung của một Nguyên Anh: bay theo con mồi của chủ (đứng phía bên kia con mồi, kẹp hai bên), chém theo nhịp, cuối thì bay về đan điền
function buoc(game, n, dt, C) {
  const o = n.on;
  if (!o || o.x == null || (n.mine ? o !== game.player || game.ghost : !(game.others?.visible?.() || []).includes(o))) { n.het = true; return; }
  n.t += dt; n.swingT = Math.max(0, n.swingT - dt); n.walkT += dt;
  for (const c of n.chem) c.t += dt;
  n.chem = n.chem.filter(c => c.t < c.life);
  if (n.t >= n.life) {
    n.het = true;
    const T = C.tieng || {};
    if (T.ve) game.sfx?.(T.ve, n.mine ? 0.6 : 0.25);
    return;
  }
  const { ra, ve } = naPha(n), ai = ve < 1 ? null : mucCua(game, o);
  let gx, gy;
  if (ve < 1) { gx = o.x; gy = o.y - 8; }   // bay về đan điền
  else if (ai) {
    let dx = ai.x - o.x, dy = ai.y - o.y, d = Math.hypot(dx, dy);
    if (d < 4) { dx = o.face?.x || 1; dy = o.face?.y || 0; d = Math.hypot(dx, dy) || 1; }
    const R = (C.canh ?? 20) + (ai.r || 6);
    gx = ai.x + dx / d * R; gy = ai.y + dy / d * R;
  } else { const fx = o.face?.x || 0, sd = (o.lookX || 1) > 0 ? -1 : 1; gx = o.x + sd * 16 - fx * 4; gy = o.y - 2; }   // không có mồi: đứng sau vai chủ
  if (ra < 1) { gx = o.x + (gx - o.x) * ra; gy = o.y - 8 + (gy - o.y + 8) * ra; }   // vừa rời thân: nhích dần từ ngực chủ ra
  const ex = gx - n.x, ey = gy - n.y, d = Math.hypot(ex, ey);
  if (d > 220) { n.x = gx; n.y = gy; }
  else if (d > 0.5) { const s = Math.min(d, ((C.toc ?? 240) * 0.35 + d * 7) * dt); n.x += ex / d * s; n.y += ey / d * s; }
  n.moving = d > 3;
  const nhin = ai || (d > 3 ? { x: gx, y: gy } : null);
  if (nhin && Math.hypot(nhin.x - n.x, nhin.y - n.y) > 1) { const a = Math.atan2(nhin.y - n.y, nhin.x - n.x); n.face = { x: Math.cos(a), y: Math.sin(a) }; }
  if (Math.abs(n.face.x) > 0.2) n.lookX = Math.sign(n.face.x);
  if (!n.mine) {   // người khác: họ vừa vung đòn (others.js đặt swingT 0.18) thì Nguyên Anh của họ chém theo
    const sw = o.swingT || 0;
    if (sw > n.oSw + 0.01 && ra >= 1 && ve >= 1 && n.q.length < 3) n.q.push(game.time + (C.tre ?? 0.14));
    n.oSw = sw;
  }
  while (n.q.length && n.q[0] <= game.time) { n.q.shift(); if (ra >= 1 && ve >= 1) chem(game, n, C); }
}

function buocLe(game, l, dt) {
  const o = l.on;
  if (!o || o.x == null || (l.mine ? o !== game.player : !(game.others?.visible?.() || []).includes(o))) { l.het = true; return; }
  const t0 = l.t; l.t += dt;
  for (const [moc, ten, v, rung] of l.nhip) if (t0 < moc && l.t >= moc) { if (ten) game.sfx?.(ten, l.mine ? v : v * 0.45); if (rung && l.mine) game.screen?.shake?.(rung, 0.2); }
  if (l.t >= l.life) l.het = true;
}
// Lễ Kết Anh (src/game/le-anh.js): hình viết một lần, người cùng tinh cầu cùng thấy
hieuUng('na-le', { gap: 3, ve(game, e, h, a, b) {
  const C = NA(game.data);
  if (!C?.on) return;
  const S = st(game), T = C.tieng || {}, L = C.le || {};
  if (game.naLe.some(l => l.on === e)) return;
  game.naLe.push({ on: e, mine: e === game.player, t: 0, life: L.dai_s ?? 5.4, seed: Math.random() * 10, pham: Math.max(0, Math.min(5, Math.round((b || 0) * 10))),
    nhip: [[0.01, T.le, 0.9, 0], [1.6, null, 0, 1.6], [2.1, T.ra, 1, 2.4], [4.4, T.ve, 0.8, 0]] });
  S.le = true;
} });

export function updateNguyenAnh(game, dt) {
  const C = NA(game.data);
  if (!C?.on) return;
  const S = st(game), p = game.player;
  S.cd = Math.max(0, S.cd - dt); S.chien += dt;
  if (p && !game.ghost && !game.anh && !game.duel && !p.meditating && !game.leAnhDang && S.cd <= 0 && S.chien < (C.chien_s ?? 3) && !game.naDs.some(n => n.mine) && naThuc(game.save, game.data)) {
    const B = naBac(game.save, game.data);
    S.cd = B.hoi + B.ra_s;
    dien(game, 'na-ra', B.ra_s / 20, naPham(game.save, game.data) / 10);   // b: phẩm (màu quầng ở máy người xem)
  }
  updateAnhFx(game, dt);
  for (const n of game.naDs) buoc(game, n, dt, C);
  for (const l of game.naLe) buocLe(game, l, dt);
  if (game.naDs.some(n => n.het)) game.naDs = game.naDs.filter(n => !n.het);
  if (game.naLe.some(l => l.het)) game.naLe = game.naLe.filter(l => !l.het);
}

export function createNguyenAnh(game) {
  st(game);
  game.naDanh = () => naDanh(game);
}
export const NA_THU = { buoc, chem, them, VAO, VE };   // bài thử (tools/nguyen-anh.test.mjs)
