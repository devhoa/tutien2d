// Bài thử nút "Khảm tốt nhất" (chủ dự án 25/11/2026: món đang mặc có ngọc cấp 1 thì bấm Khảm tốt nhất phải thay bằng ngọc tốt nhất).
// Hồng Ngọc đã chạm trần chỉ số (data/he-chien.json → gem_cap) nên thay cấp 1 bằng cấp 8 không tăng lực chiến: bestStep bỏ qua, upgradeStep
// (src/game/autogem.js) phải thay; lỗ trống được khảm; lực chiến không bao giờ giảm; ngọc cũ về túi. Chạy ở gốc kho: node tools/kham-tot-nhat.test.mjs
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { playerStats } from '../src/game/stats.js';
import { power } from '../src/game/achieve.js';
import { upgradeStep } from '../src/game/autogem.js';
import { socket } from '../src/game/items.js';

const data = {};
for (const f of readdirSync('data')) if (f.endsWith('.json')) data[f.slice(0, -5)] = JSON.parse(readFileSync('data/' + f, 'utf8'));
const save = {
  realm: 2, layer: 9, element: 'hoa', root: Object.keys(data.roots || {})[0], weapon: 'kiem', look: data.heroes.default, mats: {},
  gems: { 'hong-ngoc:8': 2, 'lam-ngoc:3': 1 },
  bag: [
    { uid: 1, base: 'thiet-thuong', rarity: 'thien', lvl: 25, plus: 10, main: { atk: 42 }, lines: [], sockets: ['hong-ngoc:20', 'hong-ngoc:20', 'hong-ngoc:1'] },
    { uid: 2, base: 'van-van-ngoa', rarity: 'thien', lvl: 25, plus: 10, main: { speed: 7 }, lines: [], sockets: ['hong-ngoc:1', null] },
  ],
  equip: { 'vu-khi': 1, giay: 2 }, techSlots: [], techs: {}, flags: {}, phapBao: { items: [], wear: [null, null, null, null] },
};
const game = { data, save };
const pw = () => power(game, playerStats(save, data));
const p0 = pw();
let n = 0, b;
while (n < 50 && (b = upgradeStep(game))) { assert.ok(b.v >= 0, 'không làm giảm lực chiến'); assert.ok(socket(save, b.it.uid, b.i, b.k)); n++; }
assert.ok(pw() >= p0, 'lực chiến không giảm');
assert.deepEqual(save.bag[0].sockets, ['hong-ngoc:20', 'hong-ngoc:20', 'hong-ngoc:8'], 'ngọc cấp 1 trên vũ khí được thay bằng cấp 8');
assert.equal(save.bag[1].sockets[0], 'hong-ngoc:8', 'ngọc cấp 1 trên giày được thay bằng cấp 8');
assert.equal(save.bag[1].sockets[1], 'lam-ngoc:3', 'lỗ trống được khảm');
assert.equal(save.gems['hong-ngoc:1'], 2, 'hai viên cấp 1 về túi');
assert.ok(!save.gems['hong-ngoc:8'] && !save.gems['lam-ngoc:3'], 'đã dùng hết ngọc tốt');
assert.equal(upgradeStep(game), null, 'không còn gì để thay: dừng');
console.log(`kham-tot-nhat: đạt (${n} lần thay, lực chiến ${p0} → ${pw()})`);
