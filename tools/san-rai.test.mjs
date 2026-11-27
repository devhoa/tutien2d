// Bài thử nhiệm vụ săn rải (src/game/san-rai.js; chủ dự án 26/11/2026 13:40: "làm rải rác ra 1 xíu… mọi người đi tới đó đông quá"; "5.000 con, 6–8 nơi").
// Soát: quái gục trong vòng nơi nào tính nơi đó, ngoài vòng / khác bản đồ / nơi đã đủ thì không tính; đủ mọi nơi mới xong; mỗi người một vòng đi
// riêng nên 200 người Tự hành chia gần đều ra các nơi; bãi nhà của nhiệm vụ farm một bản đồ chỉ lấy bãi thường và cũng chia đều.
// Chạy: node tools/san-rai.test.mjs (nằm trong tools/check.mjs)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sanDa, sanXong, sanNoi, sanO, sanTin, baiNha, lechRieng } from '../src/game/san-rai.js';

const read = f => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), 'utf8'));
const S = read('story'), T = 16;
const game = (map, name, at) => ({ save: { name }, map: { id: map, T, center: (x, y) => ({ x: x * T + T / 2, y: y * T + T / 2 }), def: read('maps/' + map) }, player: at ? { x: at[0] * T + T / 2, y: at[1] * T + T / 2 } : { x: -9999, y: -9999 } });
const ds = S.steps.filter(s => s.until?.san);
assert.ok(ds.length >= 3, `truyện phải có ít nhất ba nhiệm vụ săn rải (đang ${ds.length})`);

for (const s of ds) {
  const u = s.until, c = {}, k0 = u.san[0];
  // 1. tính đúng nơi
  let g = game(k0.in, 'A', k0.at);
  assert.equal(sanO(g, u, c, g.player.x, g.player.y), 0, `${s.id}: quái gục ở tâm nơi đầu phải tính cho nơi đầu`);
  assert.equal(sanO(g, u, c, g.player.x + (k0.r + 3) * T, g.player.y), u.san.findIndex((k, i) => i && k.in === k0.in && Math.hypot(k.at[0] - k0.at[0] - k0.r - 3, k.at[1] - k0.at[1]) <= k.r), `${s.id}: quái gục ngoài vòng nơi đầu không tính cho nơi đầu`);
  const khac = u.san.find(k => k.in !== k0.in);
  if (khac) { const g2 = game(khac.in, 'A', k0.at); assert.notEqual(sanO(g2, u, c, g2.player.x, g2.player.y), 0, `${s.id}: đứng ở bản đồ khác thì không tính cho nơi của bản đồ kia`); }
  // 2. đủ hạn mức thì nơi ấy thôi tính, nơi đang nhắm chuyển đi; đủ mọi nơi mới xong
  c['san:0'] = k0.n;
  assert.notEqual(sanNoi(g, u, c), 0, `${s.id}: nơi đã đủ không còn là nơi đang nhắm`);
  const chong = u.san.findIndex((k, i) => i && k.in === k0.in && Math.hypot(k.at[0] - k0.at[0], k.at[1] - k0.at[1]) <= k.r);   // tâm nơi đầu nằm trong vòng nơi khác thì tính cho nơi ấy
  assert.equal(sanO(g, u, c, g.player.x, g.player.y), chong, `${s.id}: nơi đầu đã đủ thì quái ở tâm nó không tính cho nó nữa`);
  assert.ok(!sanXong(u, c) && sanDa(u, c) === k0.n);
  c['san:0'] = k0.n + 50; assert.equal(sanDa(u, c), k0.n, `${s.id}: số vượt hạn mức không tính vào tổng`);
  u.san.forEach((k, i) => { c['san:' + i] = k.n; });
  assert.ok(sanXong(u, c) && sanDa(u, c) === u.n && sanNoi(g, u, c) === -1 && sanTin(g, u, c) === null, `${s.id}: đủ mọi nơi thì xong, tổng đúng ${u.n}`);
  // 3. 200 người Tự hành mới nhận việc: chia ra các nơi, không nơi nào quá gấp đôi phần đều; đang đứng trong một nơi còn thiếu thì nhắm nơi đó
  const dem = u.san.map(() => 0);
  for (let i = 0; i < 200; i++) dem[sanNoi(game('thien-kiem-phong', 'Đạo hữu ' + i * 7919), u, {})]++;
  assert.ok(Math.max(...dem) <= 200 / u.san.length * 2 && Math.min(...dem) >= 1, `${s.id}: 200 người chia nơi đầu tiên lệch quá (${dem})`);
  for (const [i, k] of u.san.entries()) { g = game(k.in, 'Đạo hữu 1', k.at); const t = sanTin(g, u, {}); assert.ok(t.i === i && t.trong && t.o && t.of === k.n && t.da === 0, `${s.id}: đứng giữa "${k.ten}" thì nhắm chính nơi đó`); }
  // 4. đi hết vòng: lần lượt làm đủ nơi đang nhắm thì qua đúng mọi nơi, mỗi nơi một lần
  { const c2 = {}, qua = []; g = game('thien-kiem-phong', 'Người đi vòng');
    for (let i = 0; i < u.san.length; i++) { const n = sanNoi(g, u, c2); qua.push(n); c2['san:' + n] = u.san[n].n; }
    assert.deepEqual([...qua].sort((a, b) => a - b), u.san.map((_, i) => i), `${s.id}: vòng đi phải qua đủ mọi nơi (${qua})`); assert.ok(sanXong(u, c2)); }
}
// 5. bãi nhà (nhiệm vụ farm một bản đồ: 3 000 con, 60 phút): chỉ bãi thường, mỗi người một bãi, 300 người chia ra mọi bãi thường
for (const s of S.steps.filter(x => x.until?.in && (x.until.phut || (x.until.kill === '*' && x.until.n >= 20)))) {
  const map = s.until.in, def = read('maps/' + map), thuong = def.spawners.filter(q => !q.mul && !q.need && !q.unless && !q.cp);
  if (thuong.length < 2) continue;
  const thay = new Map();
  for (let i = 0; i < 300; i++) { const c = baiNha(game(map, 'Đạo hữu ' + i * 104729)); const k = `${c.x},${c.y}`; thay.set(k, (thay.get(k) || 0) + 1); }
  const hop = new Set(thuong.map(q => `${q.at[0] * T + T / 2},${q.at[1] * T + T / 2}`));
  assert.ok([...thay.keys()].every(k => hop.has(k)), `${s.id}: bãi nhà rơi vào bãi vòng ngoài / bãi có cờ ở ${map}`);
  assert.ok(thay.size === thuong.length && Math.max(...thay.values()) <= 300 / thuong.length * 2.2, `${s.id}: 300 người chỉ rải ra ${thay.size}/${thuong.length} bãi thường của ${map}, bãi đông nhất ${Math.max(...thay.values())}`);
}
assert.equal(lechRieng({ save: { name: 'A' } }, 7), lechRieng({ save: { name: 'A' } }, 7), 'cùng tên thì cùng số lệch');
assert.equal(baiNha({ save: { name: 'A' }, map: { def: { spawners: [{ mob: 'x', at: [1, 1] }] }, center: () => ({}) } }), null, 'bản đồ dưới hai bãi thường: không có bãi nhà');
console.log(`✅ Săn rải: ${ds.length} nhiệm vụ (${ds.map(s => s.until.san.length).join(', ')} nơi), mỗi nhiệm vụ ${ds[0].until.n} con`);
