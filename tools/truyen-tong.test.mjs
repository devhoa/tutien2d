// Bài thử pháp trận truyền tống (src/game/truyen-tong.js, data/config.json → truyen_tong; chủ dự án 23/11/2026 19:31: mỗi khu một pháp trận,
// chạy vào trận có nút Dịch chuyển, mở Tinh đồ chọn tinh cầu, cột sáng 2–5 giây, tinh cầu mới tải trong lúc trận chạy):
// node tools/truyen-tong.test.mjs (tools/check.mjs cũng gọi). Phần chạy thật trong trình duyệt: tools/kiem/truyen-tong.thu.mjs.
//   - số, chữ, tiếng đủ; thời gian trận đúng 2–5 giây
//   - mọi tinh cầu (bản đồ planet + world) và mọi tinh cầu tông môn đều có trận; Tinh đồ tới được tinh cầu nào thì tinh cầu đó có trận
//   - vùng đứng giữa trận đi tới được từ điểm vào, không ô chắn; không nhà, cây, NPC đứng trên đĩa trận
//   - tâm trận tính theo hình thật trên bản đồ (Thiên Kiếm Tinh: hình bày trong hoi.do)
//   - luồng trận: chưa đứng giữa trận thì không đi được; trận chạy đủ min giây; chưa tải xong thì chờ; gục thì trận tan
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { buildMap } from '../src/world/map.js';
import { genPlanet } from '../src/game/kh-gen.js';

const read = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const data = { tiles: read('tiles.json'), 'le-hoi': read('le-hoi.json'), art: read('art.json'), config: read('config.json'), npcs: read('npcs.json'), starmap: read('starmap.json'),
  'khai-hoang': read('khai-hoang.json'), sounds: read('sounds.json'), 'tieng-chieu': read('tieng-chieu.json'), realms: read('realms.json') };
const C = data.config.truyen_tong, T = data.config.tile, S = data.art.sprites;
const { tranCua, trongTran, TRAN_IDX } = await import('../src/game/truyen-tong.js');

// 1. số, chữ, tiếng
assert.ok(C && C.on !== false, 'data/config.json → truyen_tong thiếu hoặc đang tắt');
for (const k of ['act', 'title', 'sub', 'go', 'khoi', 'roi', 'ban', 'tan', 'cham']) assert.ok(C.texts?.[k], `truyen_tong.texts.${k} thiếu`);
assert.ok(C.texts.khoi.includes('{name}'), 'texts.khoi phải có {name}');
assert.ok(C.min >= 2 && C.max <= 5 && C.min < C.max && C.max < C.cap, `thời gian trận phải trong 2–5 giây (min ${C.min}, max ${C.max}, cap ${C.cap})`);
assert.ok(C.keo > 0 && C.keo < C.min && C.bay > 0 && C.bay <= 0.8 && C.den > 0 && C.khoa > 0 && C.khoa < C.den && C.vang > 0, 'keo, bay, den, khoa, vang');
assert.ok(C.r > 0 && C.r < 1 && C.s > 0 && C.da.length === 2 && C.tam.length === 2 && C.mau.length === 4, 'r, s, da, tam, mau');
const sp = S[C.spr];
assert.ok(sp?.file && sp.anchor, `hình trận ${C.spr} không có trong data/art.json`);
assert.ok(C.tam[0] > 0 && C.tam[0] < sp.w && C.tam[1] > 0 && C.tam[1] < sp.h && C.da[0] < sp.w / 2 && C.da[1] < sp.h / 2, 'tâm / vòng đá nằm ngoài hình trận');
for (const k of ['tt.khoi', 'tt.vang', 'tt.bay', 'tt.den']) assert.ok(data['tieng-chieu'].sfx[k], `tiếng ${k} chưa có (python3 -I tools/sfx_chieu.py)`);

// 2. tinh cầu nào cũng có trận; tâm trận, vùng đứng, đĩa trận sạch
const maps = Object.fromEntries(readdirSync(new URL('../data/maps/', import.meta.url)).map(f => { const d = read('maps/' + f); return [d.id, d]; }));
const tinhCau = Object.values(maps).filter(d => d.planet && d.world && !d.indoor);
assert.ok(tinhCau.length >= 10, `chỉ thấy ${tinhCau.length} tinh cầu`);
const tinhDo = [];
for (const b of data.starmap.bodies) { if (b.map) tinhDo.push(b.map); for (const m of b.moons || []) if (m.map) tinhDo.push(m.map); }
for (const id of tinhDo) { const d = maps[id]; if (d?.planet && d.world && !d.indoor) assert.ok(d.phap_tran, `${id}: Tinh đồ tới được mà chưa có pháp trận`); }

function soat(def, ten) {
  assert.ok(def.phap_tran?.at, `${ten}: chưa có phap_tran`);
  const map = buildMap(def, data.tiles, T, data), game = { data, map, player: null };
  const tr = tranCua(game);
  assert.ok(tr && tr.r > 8 && tr.rx > tr.r, `${ten}: không tính được tâm trận`);
  const it = map.hoi.find(h => h.idx === TRAN_IDX) || map.hoi.find(h => h.id === C.spr);
  assert.ok(it, `${ten}: bản đồ không có hình trận`);
  assert.ok(it.foot.flat, `${ten}: hình trận phải nằm phẳng (kiểu chân phang)`);
  assert.equal(map.hoi.filter(h => h.idx === TRAN_IDX).length + (def.phap_tran.ve === false ? 0 : 0), def.phap_tran.ve === false ? 0 : 1, `${ten}: hình trận thêm sai số lần`);
  const [ax, ay] = def.phap_tran.at;
  assert.ok(Math.hypot(tr.x - (ax + 0.5) * T, tr.y - (ay + 0.5) * T) < 16, `${ten}: tâm hình trận lệch ô khai (${tr.x}, ${tr.y})`);
  // vùng đứng: mọi ô trong vùng không chắn, và đi tới được từ điểm vào (loang bốn hướng)
  const W = map.w, toi = new Set(), vao = def.spawns.vao, hang = [vao];
  toi.add(vao[1] * W + vao[0]);
  while (hang.length) {
    const [x, y] = hang.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * W + nx;
      if (nx < 0 || ny < 0 || nx >= W || ny >= map.h || toi.has(k) || map.solidTile(nx, ny)) continue;
      toi.add(k); hang.push([nx, ny]);
    }
  }
  for (let ty = Math.floor((tr.y - tr.r) / T); ty <= Math.floor((tr.y + tr.r) / T); ty++) for (let tx = Math.floor((tr.x - tr.r) / T); tx <= Math.floor((tr.x + tr.r) / T); tx++) {
    const c = map.center(tx, ty);
    if (Math.hypot(c.x - tr.x, (c.y - tr.y) * tr.rx / tr.ry) > tr.r) continue;
    assert.ok(!map.solidTile(tx, ty), `${ten}: ô (${tx}, ${ty}) trong vùng đứng giữa trận bị chắn`);
    assert.ok(toi.has(ty * W + tx), `${ten}: ô (${tx}, ${ty}) giữa trận không đi tới được từ điểm vào`);
  }
  assert.ok(!map.blocked(tr.x, tr.y, 5), `${ten}: tâm trận bị chắn`);
  // không nhà, cây đứng trên đĩa; không NPC đứng trong vùng đứng (nút Dịch chuyển đè nút Nói chuyện)
  const tren = map.hoi.filter(h => h !== it && !h.foot.flat && !h.foot.walk && Math.hypot(h.x - tr.x, (h.y - tr.y) * tr.rx / tr.ry) < tr.rx * 0.85);
  assert.deepEqual(tren.map(h => h.id), [], `${ten}: đồ đứng trên đĩa trận`);
  const npc = (def.npcs || []).filter(n => Math.hypot((n.at[0] + 0.5) * T - tr.x, ((n.at[1] + 0.5) * T - tr.y) * tr.rx / tr.ry) < tr.r * 1.3);
  assert.deepEqual(npc.map(n => n.id), [], `${ten}: NPC đứng giữa trận`);
  // đứng ở tâm: trong vùng; ra xa hai lần bán kính: không
  assert.ok(trongTran({ ...game, player: { x: tr.x, y: tr.y } }) && !trongTran({ ...game, player: { x: tr.x + tr.r * 2, y: tr.y } }), `${ten}: vùng đứng sai`);
  return tr;
}
const tk = soat(maps['thien-kiem-phong'], 'thien-kiem-phong');
assert.ok(tk.k === 0.5 && tk.rx > 70, 'Thiên Kiếm Tinh: trận lớn giữa quảng trường (hình bày trong hoi.do, cỡ 0,5)');
const Z = read('pvp.json').server.safe;
assert.ok(Z.map === 'thien-kiem-phong' && Math.hypot(tk.x - Z.x, tk.y - Z.y) + tk.r < Z.r, 'vùng đứng trận Thiên Kiếm Tinh phải nằm trong vòng an toàn PvP');
for (const d of tinhCau) if (d.id !== 'thien-kiem-phong') soat(d, d.id);

// tinh cầu tông môn: trận giữa sân (phủ ô cổng cũ), trận Khai Tinh (bản đồ đánh trùm) không có
const K = data['khai-hoang'];
for (const mat of Object.keys(K.grounds)) for (const cap of [1, 3, 6]) {
  const p = { id: `kh-thu-${mat}-${cap}`, ten: 'Thử', mat_dat: mat, hat: 4242 + cap, cap, bay: [], rieng: {} };
  const { def } = genPlanet(K, p, { data });
  soat({ ...def, npcs: [] }, `tông môn ${mat} cấp ${cap}`);
  const { def: fight } = genPlanet(K, p, { fight: true, cap, data });
  assert.ok(!fight.phap_tran, 'trận Khai Tinh không có pháp trận');
}

// 3. luồng trận (máy giả: không vẽ, không mạng)
globalThis.Image ??= class { constructor() { this.complete = false; this.naturalWidth = 0; } };   // Node không có ảnh: coi như chưa tải xong (bài giả số phần đã tải)
const { batDauTruyen, ttTick, ttChan, huyTruyen } = await import('../src/game/truyen-tong.js');
function gia(id) {
  const def = maps[id], map = buildMap(def, data.tiles, T, data), tr = tranCua({ data, map });
  const g = { data: { ...data, maps, mobs: {}, starmap: data.starmap }, map, time: 0, traveling: false, trip: null, duel: null, ghost: null, trib: { active: false }, story: { busy: false },
    player: { x: tr.x + 6, y: tr.y + 4, hp: 100, maxHp: 100, r: 5, face: { x: 1, y: 0 } }, input: { clear() {} }, screen: { shake() {}, snap() {}, viewRect: () => ({ y0: 0 }) },
    save: { visited: Object.fromEntries(Object.keys(maps).map(k => [k, true])), realm: 7, layer: 9, flags: {} }, hoSo: {}, toasts: [], sfx() {}, toast(t) { this.toasts.push(t); } };
  g.travel = (to, spawn) => { const d = maps[to]; g.map = buildMap(d, data.tiles, T, data); const t2 = tranCua(g); g.player.x = t2.x; g.player.y = t2.y; g.traveling = false; g.denLan = spawn; return Promise.resolve(); };
  return g;
}
const body = id => data.starmap.bodies.find(b => b.map === id) || { map: id, name: maps[id].name };
{
  const g = gia('thien-kiem-phong');
  g.player.x += 200;
  assert.equal(ttChan(g, body('dao-xich-dien')), C.texts.roi, 'chưa đứng giữa trận thì phải báo roi');
  g.player.x -= 200;
  assert.equal(ttChan(g, body('thien-kiem-phong')), data.starmap.texts.here, 'chọn chính tinh cầu đang đứng thì báo here');
  assert.ok(batDauTruyen(g, body('dao-xich-dien')), 'không khởi được trận');
  assert.ok(g.tt && g.traveling, 'trận khởi phải bật traveling (các hệ khác đứng chờ)');
  g.tt.td = { chinh: 1, phu: 1 }; g.tt.dem = 99;   // giả đã tải xong
  let t = 0;
  while (g.map.id === 'thien-kiem-phong' && t < 20) { g.time += 0.05; t += 0.05; ttTick(g, 0.05); }
  assert.equal(g.map.id, 'dao-xich-dien', 'trận không đưa tới nơi');
  assert.ok(t >= C.min + C.bay - 0.06 && t <= C.min + C.bay + 0.2, `đã tải xong thì trận chạy đúng min + bay giây (${t.toFixed(2)})`);
  assert.equal(g.denLan, 'phap-tran', 'tới nơi phải đứng ở pháp trận bên kia');
  assert.ok(g.ttFx.some(f => f.loai === 'den'), 'tới nơi phải có cảnh cột sáng giáng');
  for (let i = 0; i < 40; i++) { g.time += 0.05; ttTick(g, 0.05); }
  assert.ok(!g.tt && !g.traveling, 'tới nơi chốc lát phải đi được');
}
{
  const g = gia('dao-han-bang');
  g.player.x -= 6; g.player.y -= 4;
  batDauTruyen(g, body('thien-kiem-phong'));
  let t = 0;
  while (g.map.id === 'dao-han-bang' && t < 8) { g.tt.td = { chinh: t < 3.6 ? 0.5 : 1, phu: 1 }; g.tt.dem = 99; g.time += 0.05; t += 0.05; ttTick(g, 0.05); }
  assert.equal(g.map.id, 'thien-kiem-phong', 'trận chờ tải xong rồi phải đi');
  assert.ok(t >= 3.6 + C.bay - 0.06, `chưa tải xong thì trận phải chờ (đi sau ${t.toFixed(2)} giây)`);
}
{
  const g = gia('dao-han-bang');
  g.player.x -= 6; g.player.y -= 4;
  batDauTruyen(g, body('dao-xich-dien'));
  g.tt.td = { chinh: 0.3, phu: 0 }; g.tt.dem = 99;
  let t = 0;
  while (g.map.id === 'dao-han-bang' && t < C.cap + 2) { g.tt.td = { chinh: 0.3, phu: 0 }; g.tt.dem = 99; g.time += 0.05; t += 0.05; ttTick(g, 0.05); }
  assert.ok(g.map.id === 'dao-xich-dien' && t <= C.cap + C.bay + 0.1, 'quá cap giây vẫn chưa tải xong thì phải đi luôn');
  assert.ok(g.toasts.includes(C.texts.cham), 'mạng chậm phải báo vì sao lâu');
}
{
  const g = gia('dao-han-bang');
  g.player.x -= 6; g.player.y -= 4;
  batDauTruyen(g, body('dao-xich-dien'));
  for (let i = 0; i < 10; i++) { g.time += 0.05; ttTick(g, 0.05); }
  g.player.hp = 0; g.time += 0.05; ttTick(g, 0.05);
  assert.ok(!g.tt && !g.traveling && g.map.id === 'dao-han-bang', 'gục lúc trận chạy thì trận tan, không bị đưa đi');
  assert.ok(g.ttFx.some(f => f.loai === 'di' && f.tan), 'trận tan thì cột sáng tắt dần');
  g.player.hp = 100;
  assert.equal(huyTruyen(g), undefined);
}

// 4. Bản đồ chỉ để xem (chủ dự án 23/11/2026 21:41, bảng chọn "Bỏ bay ở Tinh hệ": sang tinh cầu khác chỉ bằng pháp trận, Tự hành vẫn tự bay)
{
  const { nutSang, nutTong } = await import('../src/game/tran-sang.js');
  const { diToiStep } = await import('../src/game/di-toi.js');
  const { guideList } = await import('../src/game/guide.js');
  for (const k of ['di', 'xa', 'ghi']) assert.ok(C.texts?.[k], `truyen_tong.texts.${k} thiếu`);
  const src = f => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
  for (const f of ['ui/world-map.js', 'ui/kh-view.js']) assert.ok(!/\.travel\(/.test(src(f)), `${f}: Bản đồ / bảng Tông môn không được bay thẳng sang tinh cầu khác (game.travel)`);
  assert.ok(!/khFly/.test(src('ui/kh-view.js') + src('game/khai-hoang.js').replace(/\/\/.*$/gm, '')), 'khFly (bay thẳng tới tinh cầu tông môn) đã bỏ');
  const g = gia('thien-kiem-phong'), tr = tranCua(g);
  g.dialog = { open: false }; g.npcs = []; g.mobs = []; g.pickups = [];
  let mo = null;
  g.worldMap = { open(o) { mo = o; } };
  // đứng giữa trận: Dịch chuyển luôn
  g.player.x = tr.x; g.player.y = tr.y;
  let n = nutSang(g, body('dao-xich-dien'));
  assert.ok(n.chu === C.texts.go && !n.tat && n.tt && !n.di, `giữa trận: nút phải là Dịch chuyển (${n.chu})`);
  // ra khỏi trận: Tới pháp trận, đi bộ tới giữa trận, tới nơi mở Tinh đồ truyền tống chọn sẵn nơi đã chọn
  g.player.x = tr.x + 200;
  n = nutSang(g, body('dao-xich-dien'));
  assert.ok(n.chu === C.texts.di && !n.tat && n.di, `ngoài trận: nút phải là Tới pháp trận (${n.chu})`);
  n.lam();
  assert.ok(g.diToi && Math.hypot(g.diToi.x - tr.x, g.diToi.y - tr.y) < 1 && !g.tt, 'Tới pháp trận: phải đi bộ tới giữa trận, chưa khởi trận');
  g.player.x = tr.x; g.player.y = tr.y;
  diToiStep(g, { x: 0, y: 0 }, 0.05);
  assert.ok(!g.diToi && mo?.tt && mo.chon === 'dao-xich-dien', 'tới giữa trận phải mở Tinh đồ truyền tống, chọn sẵn nơi đã chọn');
  // tông môn: nút như Bản đồ; chưa tải tinh cầu tông môn thì bấm mới tải; đang đứng ở đó thì "Bạn ở đây"
  g.player.x = tr.x + 200;
  assert.equal(nutTong(g, { id: 'dao-moc', ten: 'Thử' }).chu, C.texts.di, 'bảng Tông môn: ngoài trận là Tới pháp trận');
  const chua = nutTong(g, { id: 'kh-chua-tai', ten: 'Thử' });
  assert.ok(chua.chu === C.texts.di && !chua.tat && chua.lam, 'bảng Tông môn: tinh cầu chưa tải vẫn bấm được (tải rồi mới đi)');
  assert.equal(nutTong(g, { id: 'thien-kiem-phong', ten: 'Thử' }).chu, data.starmap.texts.here, 'bảng Tông môn: đang đứng ở tinh cầu đó');
  // nơi không có trận (động phủ): nút tắt
  const g2 = gia('thien-kiem-phong');
  g2.dialog = { open: false };
  g2.map = buildMap(maps['dong-phu'], data.tiles, T, data);
  n = nutSang(g2, body('dao-xich-dien'));
  assert.ok(n.tat && n.chu === C.texts.xa, `nơi không có trận: nút tắt, chữ "${C.texts.xa}" (${n.chu})`);
  // mũi tên chỉ đường: truyện đòi sang tinh cầu khác thì trỏ giữa trận; cùng tinh cầu, bí cảnh, động phủ thì không
  const muiTen = toi => { g.story = { busy: false, goal: () => ({ text: 'x', toi }) }; return guideList(g)[0]?.pos; };
  const pos = muiTen('dao-han-bang');
  assert.ok(pos && Math.hypot(pos.x - tr.x, pos.y - tr.y) < 1, 'truyện bảo sang Hàn Băng Tinh: mũi tên phải trỏ giữa pháp trận');
  for (const to of ['thien-kiem-phong', 'hoa-quat', 'dong-phu']) assert.equal(muiTen(to), null, `mũi tên không trỏ trận khi đích là ${to}`);
  // chữ người chơi thấy không còn bảo bay bằng Bản đồ / Tinh đồ
  for (const s of read('story.json').steps) if (s.goal && maps[s.until?.map]?.planet) assert.ok(!/bay|Tinh đồ/i.test(s.goal), `truyện ${s.id}: "${s.goal}" còn bảo bay`);
  assert.ok(!/bay/i.test(read('hints.json').buttons['btn-world'].tip), 'lời nhắc nút Bản đồ còn bảo bay');
}
console.log('truyen-tong: đạt');
