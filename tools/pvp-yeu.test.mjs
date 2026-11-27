// Bài thử chữ báo "đánh người yếu hơn: đánh được, không có lợi" (chủ dự án 23/11/2026; data/pvp.json → _yeu, yeu; src/game/pvp-yeu.js).
// Máy chủ dữ liệu mới là nơi quyết (migration 20261123110000_p2d_ha_yeu_khong_loi.sql, đã thử trong giao dịch huỷ ngược trên máy chủ thật);
// ở đây chỉ soát máy người chơi đoán đúng chiều để báo chữ, và tắt luật (cach 0) thì không báo gì.
// Chạy ở gốc kho: node tools/pvp-yeu.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { kemMinh, honMinh } from '../src/game/pvp-yeu.js';

const pvp = JSON.parse(readFileSync('data/pvp.json', 'utf8'));
assert.ok(pvp.yeu?.cach >= 1, 'data/pvp.json → yeu.cach phải bật (≥ 1)');
for (const k of ['yeu_ke', 'yeu_ma', 'yeu_nan']) assert.ok(pvp.text[k], `thiếu chữ text.${k}`);
const game = (realm, cach = pvp.yeu.cach) => ({ save: { realm }, data: { pvp: { ...pvp, yeu: { cach } } } });
// mình Kim Đan (2)
assert.equal(kemMinh(game(2), { ri: 1 }), true, 'Trúc Cơ kém Kim Đan');
assert.equal(kemMinh(game(2), { ri: 2 }), false, 'ngang cảnh giới vẫn có lợi');
assert.equal(kemMinh(game(2), { ri: 3 }), false);
assert.equal(honMinh(game(1), { ri: 2 }), true, 'Kim Đan hơn Trúc Cơ');
assert.equal(honMinh(game(2), { ri: 2 }), false);
assert.equal(kemMinh(game(2), {}), false, 'không biết cảnh giới người kia: không đoán');
assert.equal(kemMinh(game(2), null), false);
assert.equal(kemMinh(game(5, 0), { ri: 0 }), false, 'cach 0: tắt luật');
assert.equal(kemMinh(game(3, 2), { ri: 2 }), false, 'cach 2: chênh một chưa đủ');
assert.equal(kemMinh(game(3, 2), { ri: 1 }), true);
// máy chủ dữ liệu cũng nhận đúng số này qua dòng cấu hình 'ma'
const sql = readFileSync('supabase/migrations/20261123110000_p2d_ha_yeu_khong_loi.sql', 'utf8');
assert.match(sql, new RegExp(`"yeu":\\{"cach":${pvp.yeu.cach}\\}`), 'migration phải mang đúng yeu.cach của data/pvp.json');
console.log('pvp-yeu: ok');
