// Bài thử Tự đánh về chỗ săn đi vòng vật cản (CSKH #236, 25/11/2026: tinh cầu tông môn, Tự đánh đứng im kẹt vào cây). Hết quái thì
// trước đây đi thẳng về chỗ săn, cây chắn giữa đường là đẩy vào đó mãi. Chạy ở gốc kho: node tools/auto-ve-cho.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildMap } from '../src/world/map.js';
import { autoStep } from '../src/game/auto.js';

const read = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const data = { tiles: read('tiles.json'), config: read('config.json'), weapons: read('weapons.json'), pets: read('pets.json') };
const T = data.config.tile;
// bức tường đá (#) dọc giữa, chừa lối ở hàng dưới cùng; người đứng trái, chỗ săn bên phải tường
const wall = Object.keys(data.tiles.types).find(k => data.tiles.types[k].solid && !data.tiles.types[k].flat && !data.tiles.types[k].void);
const grid = [];
for (let y = 0; y < 9; y++) { let r = ''; for (let x = 0; x < 13; x++) r += x === 6 && y < 8 ? wall : '.'; grid.push(r); }
const def = { id: 'thu-ve-cho', grid, portals: [], spawns: {} };
const map = buildMap(def, data.tiles, T, null);
const p = { x: 3.5 * T, y: 2.5 * T, r: 5 };
const game = { data, map, player: p, mobs: [], loot: [], others: [], auto: true, save: {}, trib: {}, screen: null, autoHome: { x: 9.5 * T, y: 2.5 * T }, autoHomeMap: 'thu-ve-cho', time: 0 };
let toi = false;
for (let i = 0; i < 1200 && !toi; i++) {
  const r = autoStep(game, { x: 0, y: 0 }, 1 / 30);
  const n = Math.hypot(r.ax.x, r.ax.y) || 1;
  map.move(p, r.ax.x / n * 2, r.ax.y / n * 2);
  toi = Math.hypot(p.x - game.autoHome.x, p.y - game.autoHome.y) < 10;
}
assert.ok(toi, `không về được chỗ săn sau tường (đứng ở ${(p.x / T).toFixed(1)}, ${(p.y / T).toFixed(1)})`);
// chỗ săn không có đường tới (bọc kín): thôi đẩy, lấy chỗ đang đứng
const grid2 = grid.map((r, y) => (y === 8 ? r.slice(0, 6) + wall + r.slice(7) : r));
const map2 = buildMap({ ...def, grid: grid2 }, data.tiles, T, null);
const p2 = { x: 3.5 * T, y: 2.5 * T, r: 5 };
const g2 = { ...game, map: map2, player: p2, autoHome: { x: 9.5 * T, y: 2.5 * T }, autoHomePath: null, unstuck: null };
autoStep(g2, { x: 0, y: 0 }, 1 / 30);
assert.ok(Math.hypot(g2.autoHome.x - p2.x, g2.autoHome.y - p2.y) < 1, 'không có đường thì chỗ săn phải là chỗ đang đứng');
console.log('auto-ve-cho: đạt');
