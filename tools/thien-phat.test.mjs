// Bài thử thiên phạt phía máy khách và ma bị đẩy khỏi Thiên Kiếm Tinh (src/game/thien-phat.js, ghost.js afterGhost; chủ dự án 22/11/2026 11:4x: "ai hoá ma khi ở
// Thiên Kiếm Tinh thì cứ mỗi 10s sẽ bị thiên phạt… ma nhân không còn hồi sinh trên Thiên Kiếm Tinh nữa"). Không cần trình duyệt.
// Chạy: node tools/thien-phat.test.mjs (tools/check.mjs gọi)
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const data = { maps: {} };
for (const f of readdirSync(new URL('../data/', import.meta.url))) if (f.endsWith('.json')) data[f.slice(0, -5)] = JSON.parse(readFileSync(new URL('../data/' + f, import.meta.url), 'utf8'));
for (const f of readdirSync(new URL('../data/maps/', import.meta.url))) if (f.endsWith('.json')) data.maps[f.slice(0, -5)] = JSON.parse(readFileSync(new URL('../data/maps/' + f, import.meta.url), 'utf8'));
globalThis.setTimeout = () => 0;   // tiếng nổ trễ trong hiệu ứng: bỏ

const { thienPhatTick, tpTin, maNoiDen, tinhThanh } = await import('../src/game/thien-phat.js');
const { buildMap } = await import('../src/world/map.js');
const { afterGhost, maHoiSinh } = await import('../src/game/ghost.js');
const TP = data.pvp.ma.thien_phat, TK = tinhThanh({ data }), T = data.pvp.text;
assert.equal(TK, 'thien-kiem-phong', 'thiên phạt gắn với bản đồ của vòng pháp trận an toàn (Thiên Kiếm Tinh)');
const SV = data.pvp.server.ma.tp;
assert.ok(SV.chu_ky === 10 && SV.dao === 3 && TP.pct > 0 && TP.pct <= 0.5 && TP.tang >= 0 && !('chu_ky' in TP), 'nhịp, số đạo do máy chủ phòng giữ (server.ma.tp); máy khách chỉ giữ mức trừ máu');
const dao = n => Math.ceil(400 * TP.pct * (1 + TP.tang * (n - 1)));   // máu mất ở đạo thứ n (máu tối đa 400)

function moi(map = TK, ma = 3) {
  const g = { data, map: { id: map, def: data.maps[map], T: data.config.tile }, pvp: { ma }, player: { x: 1000, y: 1200, hp: 400, maxHp: 400, r: 5 }, fx: [], numbers: [], strikes: [], scorch: [],
    save: { realm: 1, layer: 5, flags: {}, visited: { 'thanh-khe': true, [TK]: true } }, time: 0,
    chu: [], tieng: [], toast(t) { this.chu.push(t); }, sfx(n) { this.tieng.push(n); }, number() {}, screen: { shake() {} } };
  for (const m of Object.values(data.maps)) for (const pt of m.portals || []) if (pt.fly && pt.need) g.save.flags[pt.need] = true;   // cổng bay đã mở (như ai vào game cũng có)
  return g;
}

// 1. Máy khách không tự đếm giờ nữa: ma đứng trên Thiên Kiếm Tinh chỉ được báo trước một lần, máu không đổi dù đứng bao lâu; rời đi quay lại thì báo lại
{
  const g = moi();
  for (let i = 0; i < 400; i++) thienPhatTick(g, 0.25);
  assert.equal(g.player.hp, 400, 'máy khách tự giáng thiên phạt (phải để máy chủ phòng làm)');
  assert.equal(g.chu.length, 1, 'báo trước phải đúng một lần');
  assert.ok(g.chu[0].includes(String(SV.chu_ky)), 'chữ báo phải nói nhịp giây');
  g.map = { ...g.map, id: 'dao-xich-dien', def: data.maps['dao-xich-dien'] }; thienPhatTick(g, 0.25);
  g.map = { ...g.map, id: TK, def: data.maps[TK] }; thienPhatTick(g, 0.25);
  assert.equal(g.chu.length, 2, 'quay lại phải báo lại');
  for (const [h, ten] of [[moi(TK, 0), 'người thường'], [moi('dao-xich-dien'), 'ma ở tinh cầu khác']]) { thienPhatTick(h, 0.25); assert.equal(h.chu.length, 0, `${ten} bị báo thiên phạt`); }
}
// 2. Tin đạo từ phòng: đạo của mình trừ đúng mức (đạo sau nặng hơn) nhưng không làm gục (gục là tin 'pd' của phòng); có sét, tiếng sấm
{
  const g = moi(); g.online = { me: { id: 'toi' } }; g.others = { list: new Map() };
  tpTin(g, { t: 'tp', id: 'toi', n: 1 });
  assert.equal(g.player.hp, 400 - dao(1), 'đạo một trừ sai');
  assert.ok(g.fx.length > 0 && g.tieng.includes('thunder'), 'không có sét, tiếng sấm');
  tpTin(g, { t: 'tp', id: 'toi', n: 2 });
  assert.equal(g.player.hp, 400 - dao(1) - dao(2), 'đạo hai trừ sai');
  assert.ok(dao(2) > dao(1), 'đạo sau phải nặng hơn');
  g.player.hp = 30; tpTin(g, { t: 'tp', id: 'toi', n: 2 });
  assert.equal(g.player.hp, 1, 'đạo chưa gục mà máy khách tự làm gục');
  // 3. đạo của người khác: chỉ vẽ trên người đó, máu mình không đổi; người không có trên màn thì thôi
  const h = moi(); h.online = { me: { id: 'toi' } }; h.others = { list: new Map([['khac', { x: 500, y: 600 }]]) };
  tpTin(h, { t: 'tp', id: 'khac', n: 1 });
  assert.ok(h.player.hp === 400 && h.fx.length > 0, 'đạo của người khác trừ máu mình hoặc không vẽ');
  const nfx = h.fx.length; tpTin(h, { t: 'tp', id: 'vang-mat', n: 1 });
  assert.equal(h.fx.length, nfx, 'vẽ sét cho người không có trên màn');
}
// 4. Ma gục trên Thiên Kiếm Tinh: hồi sinh rồi bay hồn tới tinh cầu khác đã mở (không phải Thiên Kiếm Tinh, làng tân thủ, động phủ, bí cảnh…)
{
  const g = moi(), di = new Set(), tq = new Map();
  for (let i = 0; i < 200; i++) { const id = maNoiDen(g, () => i / 200); di.add(id); }
  assert.ok(di.size >= 2 && !di.has(null), `ma gục ở Thiên Kiếm Tinh phải có tinh cầu khác để về (${[...di]})`);
  for (const id of di) {
    const d = data.maps[id];
    assert.ok(id !== TK && id !== data.config.start.map && id !== data.home.map && d.world && d.planet && !(d.rooms || []).length && !d.tower && !d.demon, `nơi về ${id} không hợp lệ`);
  }
  const yeu = moi(); yeu.save.realm = 0; yeu.save.layer = 5;   // Luyện Khí tầng 5: chỉ những tinh cầu đã mở theo tu vi
  for (let i = 0; i < 50; i++) { const id = maNoiDen(yeu, () => i / 50); tq.set(id, (tq.get(id) || 0) + 1); }
  for (const id of tq.keys()) { const need = data.realms.map_open?.[id]; assert.ok(need == null || need <= 4, `ma Luyện Khí tầng 5 bị đẩy tới ${id} (cần tổng tầng ${need})`); }
  const chuaBay = moi(); chuaBay.save.flags = {};   // chưa học ngự kiếm, chưa mở tinh cầu nào khác: về làng đầu, không hồi sinh trên Thiên Kiếm Tinh
  const moSan = new Set([data.config.start.map, ...Object.values(data.maps).flatMap(m => m.portals.filter(pt => pt.fly && !pt.need && !data.realms.map_open?.[pt.to] && pt.to !== TK).map(pt => pt.to)),
    ...data.starmap.bodies.filter(b => b.mo && !((data.realms.map_open?.[b.map] || 0) > chuaBay.save.realm * data.realms.layers + (chuaBay.save.layer - 1))).map(b => b.map)]);   // Bách Luyện Tinh (24/11/2026), tinh cầu farm mới có cờ mo (26/11/2026): ai cũng tới được
  { const noi = maNoiDen(chuaBay); assert.ok(moSan.has(noi), `ma chưa mở tinh cầu nào khác gục ở Thiên Kiếm Tinh mà không về làng đầu hay tinh cầu mở sẵn (về ${noi}; mở sẵn: ${[...moSan]})`); }
  assert.equal(maNoiDen(moi(TK, 0)), null, 'người thường gục ở Thiên Kiếm Tinh: hồi sinh tại chỗ như cũ');
  assert.equal(maNoiDen(moi('dao-xich-dien')), null, 'ma gục ở tinh cầu khác: hồi sinh trên chính tinh cầu đó như cũ');
}
// 5. afterGhost: ma ở Thiên Kiếm Tinh thì hồi sinh xong bay đi (không hỏi về động phủ); người thường như cũ
{
  const g = moi(); let bay = null, hoiSinh = 0;
  g.spawners = [];
  g.travel = async (id, sp, fly) => {   // như game.travel thật: dựng bản đồ, đặt người ở điểm tới sp
    bay = { id, sp, fly }; g.map = buildMap(data.maps[id], data.tiles, data.config.tile, data);
    const v = g.map.def.spawns[sp], c = g.map.center(v[0], v[1]); g.player.x = c.x; g.player.y = c.y;
  };
  let imLang = null;
  afterGhost(g, 'here', o => { hoiSinh++; imLang = !!o?.im; });
  await new Promise(r => setImmediate(r));
  assert.ok(hoiSinh === 1 && bay && bay.id !== TK && bay.fly, `ma gục ở Thiên Kiếm Tinh phải bay hồn đi (${JSON.stringify(bay)})`);
  assert.ok(g.chu.some(t => t.includes(data.maps[bay.id].name)), 'chữ báo nói hồn trôi tới đâu');
  assert.equal(imLang, true, 'bị đẩy đi thì hồi sinh không báo chữ "kéo tới nơi hoang vắng" chồng lên chữ bị đẩy');
  const sp = data.maps[bay.id].spawns.vao, v = g.map.center(sp[0], sp[1]);
  assert.ok(Math.hypot(g.player.x - v.x, g.player.y - v.y) > g.map.T * 8, 'tới nơi thì đứng chỗ xa làng như ma hồi sinh (không đứng giữa làng)');
  const h = moi(TK, 0); let bay2 = null; h.travel = async id => { bay2 = id; };
  let im2 = null; afterGhost(h, 'here', o => { im2 = !!o?.im; });
  assert.equal(im2, false, 'người thường gục: chữ hồi sinh như cũ');
  assert.equal(bay2, null, 'người thường gục ở Thiên Kiếm Tinh không bị đẩy đi');
  assert.equal(typeof maHoiSinh, 'function');
}
// 6. Vòng game thật: updatePvp gọi thienPhatTick, tuiTick; tin phòng 'tp' và tin túi tới đúng chỗ; ghost.js gọi đẩy hồn đi; trả nợ ma_tp có túi
{
  const src = f => readFileSync(new URL('../src/game/' + f, import.meta.url), 'utf8');
  assert.ok(/export function updatePvp[\s\S]{0,240}thienPhatTick\(game, dt\);\s*tuiTick\(game\);/.test(src('pvp.js')), 'pvp.js updatePvp không gọi thienPhatTick / tuiTick');
  assert.ok(/m\.t === 'tp'\) \{ tpTin\(game, m\)/.test(src('pvp.js')), 'pvp.js onPvp không chuyển tin tp');
  assert.ok(/x\.noi === 'ma_tp'[\s\S]{0,200}tuiMoi\(game, x\.tui\)/.test(src('pvp.js')), 'pvp.js settle không lo nợ ma_tp / túi mới');
  assert.ok(/m\.k !== 'tp'/.test(src('pvp-ma.js')), 'pvp-ma.js maPd không nhận gục vì thiên phạt');
  assert.ok(/maNoiDen\(game\)[\s\S]{0,120}respawn\([\s\S]{0,80}maDayDi\(/.test(src('ghost.js')), 'ghost.js afterGhost không đẩy hồn ma đi');
  assert.ok(/!o\?\.im\) game\.toast\(ma \?/.test(readFileSync(new URL('../src/game/game.js', import.meta.url), 'utf8')), 'game.js respawn không nhận o.im');
  const cf = readFileSync(new URL('../src/net/online-cf.js', import.meta.url), 'utf8');
  assert.ok(/m\.t === 'tp' \|\| m\.t === 'ltn'[^\n]*handlers\.onPvp/.test(cf), 'online-cf.js không chuyển tin thiên phạt / túi');
}
console.log(`✅ Thiên phạt (máy khách): báo trước một lần, đạo ${SV.chu_ky} giây một lần theo tin phòng, đạo ${SV.dao} gục do phòng; ma gục ở đó hồi sinh ở tinh cầu khác`);
