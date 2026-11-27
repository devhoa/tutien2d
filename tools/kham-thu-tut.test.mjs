// CSKH #265 (26/11/2026): khảm Lục Ngọc cấp cao làm Thủ / lực chiến tụt. Gốc: số phẳng Công / Máu / Thủ của bộ đồ, Đạo Vận, đan
// đổi ra % bằng cách chia cho tổng luật cũ, mà tổng đó có cộng ngọc theo bảng cũ: ngọc càng cao, % càng tụt (src/game/he-chien.js
// playerStatsHC, src/game/items.js gemFlat). Bài thử: mọi bản lưu mẫu, mọi loại ngọc Công / Máu / Thủ, nâng cấp ngọc không làm
// chỉ số đó hay lực chiến giảm.
// Chạy ở gốc kho: node tools/kham-thu-tut.test.mjs
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { playerStats } from '../src/game/stats.js';
import { power } from '../src/game/achieve.js';

const data = {};
for (const f of readdirSync('data')) if (f.endsWith('.json')) data[f.slice(0, -5)] = JSON.parse(readFileSync('data/' + f, 'utf8'));
const B = data.items.bases, ids = Object.keys(B).filter(k => !k.startsWith('_'));
const sets = Object.entries(data.gear?.sets || {}).filter(([, s]) => JSON.stringify(s.bonus).match(/"(def|atk|hp)"/));
const G = { 'luc-ngoc': 'def', 'hong-ngoc': 'atk', 'lam-ngoc': 'hp' };
let ca = 0;
for (const [sid] of [...sets, [null]]) {
  const pick = ids.filter(k => sid ? B[k].set === sid : !B[k].set).slice(0, 6);
  for (const realm of [1, 2, 3]) for (const [gem, st] of Object.entries(G)) {
    let prev = null;
    for (const lv of [1, 3, 5, 7, 9]) {
      const bag = pick.map((b, i) => ({ uid: i + 1, base: b, rarity: 'thien', lvl: 25, plus: 10, main: { ...(B[b].main || {}) }, lines: [], sockets: i === 0 ? [`${gem}:${lv}`] : [] }));
      const equip = {}; bag.forEach(it => { if (B[it.base].slot && !equip[B[it.base].slot]) equip[B[it.base].slot] = it.uid; });
      const save = { realm, layer: 5, element: 'tho', weapon: 'kiem', gems: {}, mats: {}, bag, equip, techSlots: [], techs: {} };
      const s = playerStats(save, data), v = { def: s.def, atk: s.atk, hp: s.maxHp }[st], pw = power({ save, data }, s);
      if (prev) { assert.ok(v >= prev.v, `${sid || 'không bộ'} cảnh ${realm} ${gem} ${lv}: ${st} ${prev.v} → ${v}`); assert.ok(pw >= prev.pw, `${sid || 'không bộ'} cảnh ${realm} ${gem} ${lv}: lực chiến ${prev.pw} → ${pw}`); }
      prev = { v, pw }; ca++;
    }
  }
}
console.log(`kham-thu-tut: ${ca} ca, ${sets.length} bộ có số phẳng`);
