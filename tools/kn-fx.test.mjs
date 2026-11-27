// Bài thử hiệu ứng riêng của ba kỹ năng đầu game (src/game/kn-fx.js, src/render/draw-kn-fx.js; tools/check.mjs gọi). Chủ dự án 26/11/2026 16:22 chọn
// "Chỉ làm hiệu ứng": số sát thương và vùng trúng của bảy kỹ năng phải GIỮ NGUYÊN (bảng GOC bên dưới chép từ bản trước đợt này; đổi số là bài này đỏ).
// Soát thêm: kỹ năng khai `ve` nào cũng có màn tung, màn trúng, bộ vẽ; vẽ ở mọi lúc của màn diễn không ném lỗi, không đưa số hỏng (NaN) vào khung vẽ,
// save / restore cân nhau (một lần NaN + save treo từng làm trắng màn, 23/11/2026); hạt và màn diễn có trần và tự hết; chỉ rung ở máy người ra chiêu;
// không khựng hình; máy người xem thấy đường lướt đủ dài; tiếng khai trong bảng đều có thật.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = f => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), 'utf8'));
const { knNap } = await import('../src/game/ky-nang.js');
const { knVe, knCast, knHit, knMobHit, updateKnFx, knHat } = await import('../src/game/kn-fx.js');
const { KN_VE, drawKnFx } = await import('../src/render/draw-kn-fx.js');

const KN = read('ky-nang'), TC = read('tieng-chieu'), VFX = read('vfx');
const data = knNap({ skills: { ...read('skills') }, 'ky-nang': KN, vfx: structuredClone(VFX), 'tieng-chieu': structuredClone(TC), art: { sprites: {} }, sounds: read('sounds') });

// ---- 1. số của bảy kỹ năng không đổi ("Chỉ làm hiệu ứng")
const GOC = {
  'pha-van-thuc': { ve: 'pha-van', type: 'projectile', cd: 9, mp: 14, mult: 0.8, speed: 120, range: 160, radius: 6, pierce: true },
  'viem-nhan': { ve: 'viem', type: 'projectile', cd: 12, mp: 18, mult: 0.85, speed: 90, range: 140, radius: 5, explode: 24 },
  'han-nhan': { ve: 'han', type: 'projectile', cd: 10, mp: 16, mult: 0.7, speed: 110, range: 150, radius: 5, slow: 2.5 },
  'dang-nhan': { ve: 'dang', type: 'aoe', cd: 12, mp: 18, mult: 0.55, radius: 36, offset: 22, slow: 3 },
  'kim-nhan': { ve: 'kim', type: 'multi', cd: 11, mp: 16, mult: 0.4, count: 3, spread: 30, speed: 125, range: 150, radius: 4, pierce: true },
  'thach-nhan': { ve: 'thach', type: 'aoe', cd: 13, mp: 20, mult: 0.6, radius: 40, offset: 0, stun: 1 },
  'liep-phong-bo': { ve: 'liep', type: 'dash', cd: 14, mp: 18, mult: 0.7, dist: 72 },
};
const SO = ['type', 'cd', 'mp', 'mult', 'speed', 'range', 'radius', 'pierce', 'explode', 'slow', 'stun', 'count', 'spread', 'offset', 'dist', 'dur', 'tick'];
for (const [id, g] of Object.entries(GOC)) {
  const s = KN.chieu[id];
  assert.ok(s, `data/ky-nang.json thiếu kỹ năng ${id}`);
  for (const k of SO) assert.deepEqual(s[k], g[k], `${id}.${k}: đợt hiệu ứng 26/11/2026 không được đổi số sát thương, vùng trúng (đang ${s[k]}, gốc ${g[k]})`);
  assert.equal(s.ve, g.ve, `${id}: thiếu ve "${g.ve}"`);
}

// ---- 2. knNap: kỹ năng có ve dùng công thức { kn }, không mượn hình chiêu cũ; tiếng riêng có thật
for (const [id, s] of Object.entries(KN.chieu)) {
  if (!s.ve) { assert.ok(!data.vfx.skills[id]?.kn, `${id}: không khai ve mà lại có công thức kn`); continue; }
  assert.equal(data.vfx.skills[id]?.kn, s.ve, `${id}: knNap chưa đặt công thức kn`);
  assert.ok(data.vfx.skills[id].ghost >= 4, `${id}: cần nhớ ít nhất 4 chỗ đạn bay qua để vẽ đuôi`);
  assert.ok(!data.vfx.px?.[id], `${id}: còn mượn hiệu ứng điểm ảnh của "${s.hinh}" (sẽ vẽ chồng hai bộ)`);
  assert.equal(knVe({ data }, id), s.ve);
  const B = TC.by_skill[id];
  assert.ok(B?.c, `${id}: chưa có tiếng tung riêng trong data/tieng-chieu.json → by_skill (tools/sfx_chieu.py)`);
  for (const v of Object.values(B)) assert.ok(TC.sfx[[].concat(v)[0]], `${id}: tiếng "${v}" không có`);
  if (s.type !== 'heal') assert.ok(B.h, `${id}: chưa có tiếng trúng`);
  if (s.explode) assert.ok(B.b, `${id}: đạn nổ lan mà chưa có tiếng nổ`);
}
assert.ok(!knVe({ data }, 'kiem-khi') && !knVe({ data }, null), 'chiêu không khai ve thì không có màn diễn riêng');

// ---- khung vẽ giả: đếm save / restore, bắt số hỏng
function ctxGia() {
  const C = { sau: 0, goi: 0, loi: [] };
  const so = (ten, a) => { for (const v of a) if (typeof v === 'number' && !Number.isFinite(v)) C.loi.push(`${ten}(${[...a].join(', ')})`); };
  const grad = { addColorStop: (o, c) => { if (!(o >= 0 && o <= 1) || typeof c !== 'string') C.loi.push(`addColorStop(${o}, ${c})`); } };
  C.ctx = new Proxy({}, {
    get: (t, k) => (k in t ? t[k] : (...a) => { C.goi++; so(k, a); if (k === 'save') C.sau++; if (k === 'restore') C.sau--; if (k === 'createRadialGradient' || k === 'createLinearGradient') return grad; }),
    set: (t, k, v) => { if (typeof v === 'number' && !Number.isFinite(v)) C.loi.push(`${String(k)} = ${v}`); t[k] = v; return true; },
  });
  return C;
}
function gameGia() {
  const g = { data, bullets: [], rung: [], tieng: [], player: { x: 100, y: 100, face: { x: 1, y: 0 }, r: 5 } };
  g.screen = { shake: (a, t) => g.rung.push([a, t]) };
  g.sfx = (n, v) => g.tieng.push(n);
  return g;
}
const veHet = (g, ten) => {   // vẽ ở nhiều lúc tới khi mọi màn diễn hết; trả số lần gọi khung vẽ
  let goi = 0;
  for (let i = 0; i < 200 && (g.knFx.fx.length || g.knFx.hat.length); i++) {
    const C = ctxGia(); drawKnFx(C.ctx, g, i * 0.016); goi += C.goi;
    assert.deepEqual(C.loi, [], `${ten}: số hỏng vào khung vẽ ở khung ${i}`);
    assert.equal(C.sau, 0, `${ten}: save / restore lệch ${C.sau} ở khung ${i}`);
    updateKnFx(g, 0.016);
  }
  assert.equal(g.knFx.fx.length + g.knFx.hat.length, 0, `${ten}: màn diễn không tự hết sau 3,2 giây`);
  return goi;
};

// ---- 3. tung chiêu: mỗi kiểu ve có màn tung, vẽ được ở mọi hướng mặt
const HUONG = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 0.7, y: -0.7 }, { x: 0, y: 0 }];
for (const [id, s] of Object.entries(KN.chieu)) {
  if (!s.ve) continue;
  for (const face of HUONG) {
    const g = gameGia(); g.player.face = face;
    const info = s.type === 'aoe' ? { cx: 100 + face.x * (s.offset || 0), cy: 100 + face.y * (s.offset || 0) } : s.type === 'dash' ? { sx: 100 - face.x * s.dist, sy: 100 - face.y * s.dist } : {};
    assert.equal(knCast(g, id, s, g.player, info), true, `${id}: knCast không nhận`);
    assert.ok(g.knFx.fx.length >= 1, `${id}: tung chiêu không tạo màn diễn nào`);
    for (const f of g.knFx.fx) assert.ok(KN_VE.VE[f.k], `${id}: màn "${f.k}" chưa có bộ vẽ trong draw-kn-fx.js`);
    assert.ok(g.knFx.hat.length >= 8, `${id}: tung chiêu ít hạt quá (${g.knFx.hat.length}), nhìn sẽ nhỏ`);
    assert.ok(g.rung.length <= 1 && g.rung.every(([a, t]) => a <= 3 && t <= 0.25), `${id}: rung lúc tung phải nhẹ (${JSON.stringify(g.rung)})`);
    assert.ok(veHet(g, id + ' tung') > 20, `${id}: màn tung gần như không vẽ gì`);
    assert.deepEqual(Object.keys(g).filter(k => /stop|freeze|khung|dung/i.test(k)), [], `${id}: không khựng hình (chủ dự án 16/11/2026)`);
  }
}
assert.equal(knCast(gameGia(), 'kiem-khi', data.skills['kiem-khi'], { x: 0, y: 0 }), false, 'chiêu không có ve: knCast phải trả false');

// ---- 4. đạn: có bộ vẽ đạn; trúng, nổ lan, hết đường đều có màn và vẽ được; đuôi hạt khi bay
const dan = (g, id, from = 'player') => { const s = KN.chieu[id]; const b = { from, sk: id, x: 120, y: 96, vx: s.speed, vy: 0, r: s.radius, pierce: !!s.pierce || from === 'see', explode: s.explode, color: s.color, life: 1, hit: new Set(), hist: [100, 96, 105, 96, 110, 96, 115, 96] }; g.bullets.push(b); return b; };
for (const [id, s] of Object.entries(KN.chieu)) {
  if (!s.ve || !['projectile', 'multi'].includes(s.type)) continue;
  assert.ok(KN_VE.DAN[s.ve], `${id}: đạn kiểu "${s.ve}" chưa có bộ vẽ (đạn sẽ tàng hình vì draw-vfx.js bỏ qua đạn có kn)`);
  const g = gameGia(), b = dan(g, id);
  for (let i = 0; i < 12; i++) { b.x += b.vx * 0.016; updateKnFx(g, 0.016); const C = ctxGia(); drawKnFx(C.ctx, g, i * 0.016); assert.deepEqual(C.loi, [], `${id}: đạn đang bay, số hỏng`); assert.equal(C.sau, 0); assert.ok(C.goi > 10, `${id}: đạn gần như không vẽ gì`); }
  assert.ok((g.knFx?.hat.length || 0) >= 2, `${id}: đạn bay không thả hạt đuôi`);
  g.bullets = [];
  // trúng một con (đạn nổ lan: big = bán kính nổ)
  assert.equal(knHit(g, b, 150, 100, s.pierce ? 0 : s.explode || 0), true);
  assert.ok(g.knFx.fx.some(f => KN_VE.VE[f.k]), `${id}: trúng mà không có màn nào`);
  for (const f of g.knFx.fx) assert.ok(KN_VE.VE[f.k], `${id}: màn trúng "${f.k}" chưa có bộ vẽ`);
  assert.ok(g.tieng.length === 1, `${id}: trúng phải kêu đúng một tiếng (đang ${g.tieng})`);
  if (s.explode) { assert.equal(g.tieng[0], TC.by_skill[id].b, `${id}: nổ lan phải kêu tiếng nổ`); const no = g.knFx.fx.find(f => f.r); assert.equal(no.r, s.explode, `${id}: vòng nổ vẽ phải đúng bán kính nổ thật (${s.explode})`); }
  veHet(g, id + ' trúng');
  // hết đường
  const g2 = gameGia(), b2 = dan(g2, id); g2.bullets = []; b2.life = 0;
  assert.equal(knHit(g2, b2, 200, 100, s.explode || 0), true);
  if (s.pierce) assert.equal(g2.tieng.length, 0, `${id}: đạn xuyên bay hết đường chỉ tan, không kêu tiếng trúng`);
  veHet(g2, id + ' hết đường');
  // đạn của người khác (chỉ để nhìn): không rung máy mình
  const g3 = gameGia(), b3 = dan(g3, id, 'see'); b3.life = 0; knHit(g3, b3, 200, 100, s.explode || 0);
  assert.equal(g3.rung.length, 0, `${id}: đạn của người khác nổ mà máy mình rung`);
}

// ---- 5. chiêu vùng / đường lướt trúng từng con
for (const id of ['dang-nhan', 'thach-nhan', 'liep-phong-bo']) {
  const g = gameGia(), m = { x: 130, y: 110, r: 7 };
  assert.equal(knMobHit(g, id, m), true, `${id}: knMobHit không nhận`);
  assert.ok(g.knFx.hat.length >= 4, `${id}: quái trúng mà không toé hạt`);
  assert.equal(g.tieng[0], [].concat(TC.by_skill[id].h)[0], `${id}: quái trúng phải kêu tiếng trúng riêng`);
  if (id === 'dang-nhan') { m.x = 160; updateKnFx(g, 0.016); assert.equal(g.knFx.fx.find(f => f.k === 'dg-troi').x, 160, 'dây quấn phải bám theo con quái'); m.dead = true; }
  veHet(g, id + ' quái trúng');
}
assert.equal(knMobHit(gameGia(), 'kiem-khi', { x: 0, y: 0 }), false);
{   // máy mình lướt vào tường (không nhích được): không vẽ dải gió xuyên tường
  const g = gameGia(), s = KN.chieu['liep-phong-bo'];
  knCast(g, 'liep-phong-bo', s, g.player, { sx: g.player.x, sy: g.player.y });
  const f = g.knFx.fx.find(x => x.k === 'lp-cast');
  assert.ok(Math.hypot(f.x2 - f.x, f.y2 - f.y) < 1, 'lướt vào tường: dải gió phải dừng ở chỗ mình đứng');
  veHet(g, 'lướt vào tường');
}

// ---- 6. máy người xem: không rung; đường lướt vẽ đủ dài dù tin tới lúc họ còn ở đầu đường
for (const [id, s] of Object.entries(KN.chieu)) {
  if (!s.ve) continue;
  const g = gameGia(), who = { x: 300, y: 200, face: { x: 0, y: 1 } };
  knCast(g, id, s, who, s.type === 'dash' ? { sx: 300, sy: 200 } : s.type === 'aoe' ? { cx: 300, cy: 200 + (s.offset || 0) } : {});
  assert.equal(g.rung.length, 0, `${id}: người khác ra chiêu mà máy mình rung`);
  if (s.type === 'dash') { const f = g.knFx.fx.find(x => x.k === 'lp-cast'); assert.ok(Math.abs(Math.hypot(f.x2 - f.x, f.y2 - f.y) - s.dist) < 1, 'máy người xem: đường lướt phải dài đúng quãng lướt'); }
  veHet(g, id + ' người xem');
}

// ---- 7. trần: bấm liên tục cũng không phình bộ nhớ
{
  const g = gameGia();
  for (let i = 0; i < 400; i++) { knCast(g, 'thach-nhan', KN.chieu['thach-nhan'], g.player, {}); knHat(g, 0, 0, 1, 1, 1, '#ffffff'); }
  assert.ok(g.knFx.fx.length <= 70 && g.knFx.hat.length <= 240, `trần màn diễn 70 / hạt 240 bị vượt (${g.knFx.fx.length} / ${g.knFx.hat.length})`);
  const C = ctxGia(); drawKnFx(C.ctx, g, 0); assert.deepEqual(C.loi, []); assert.equal(C.sau, 0);
  updateKnFx({ bullets: [] }, 0.016);   // chưa có trạng thái: không ném lỗi
  drawKnFx(ctxGia().ctx, { bullets: [], data }, 0);
}
console.log('kn-fx: đạt');
