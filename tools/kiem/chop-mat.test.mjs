// Bài thử chớp mắt lúc đứng nghỉ (src/render/chop-mat.js, data/heroes.json → chop_mat, khung nhắm ở data/art.json → hero.tp-NN.chop).
// Chạy: node tools/kiem/chop-mat.test.mjs (tools/check.mjs gọi).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chopFrame } from '../../src/render/chop-mat.js';

const heroes = JSON.parse(readFileSync('data/heroes.json', 'utf8'));
const art = JSON.parse(readFileSync('data/art.json', 'utf8')).sprites;
const fashion = JSON.parse(readFileSync('data/fashion.json', 'utf8')).list;
const game = { data: { heroes } }, C = heroes.chop_mat;
assert.ok(C && C.cach[0] > 0.5 && C.cach[1] > C.cach[0] && C.nham > 0.05 && C.nham < 0.3, 'chop_mat thiếu hoặc số lạ');

// mọi trang phục có khung nhắm: đủ 8 khung sau khung chop, idle là 8 khung đầu
for (const [id, it] of Object.entries(fashion)) {
  const spr = art[it.look?.sprite];
  if (!spr || spr.chop == null) continue;
  assert.equal(it.look.anims.idle.length, 8, `${id}: idle phải 8 khung`);
  assert.ok(spr.chop + 8 <= spr.frames, `${id}: thiếu khung nhắm (chop ${spr.chop}, frames ${spr.frames})`);
}

// mô phỏng 60 giây ở 60 khung mỗi giây: có chớp, mỗi lần nhắm ngắn, không nhắm khi đang chạy / đánh
const spr = art['hero.tp-10'], look = fashion['tp-10'].look;
assert.ok(spr.chop != null, 'hero.tp-10 chưa có khung nhắm');
const p = {}; let closed = 0, runs = 0, run = 0, longest = 0;
for (let n = 0; n < 3600; n++) {
  const t = 100 + n / 60, f = look.anims.idle[n % 8], g = chopFrame(game, p, spr, look, 'idle', f, t);
  if (g !== f) { assert.equal(g, spr.chop + (n % 8), 'khung nhắm phải đúng khung đứng tương ứng'); closed++; run++; }
  else if (run) { runs++; longest = Math.max(longest, run); run = 0; }
  assert.equal(chopFrame(game, {}, spr, look, 'walk', 9, t), 9, 'đang chạy thì không đổi khung');
}
assert.ok(runs >= 60 / C.cach[1] && runs <= 60 / C.cach[0] * 2 + 2, `số lần chớp trong 60 giây lạ: ${runs}`);
assert.ok(longest <= Math.ceil(C.nham * 60) + 1, `nhắm quá lâu: ${longest} khung`);
assert.ok(closed / 3600 < 0.1, 'nhắm quá nhiều thời gian');
console.log(`chớp mắt: ${runs} lần trong 60 giây, nhắm dài nhất ${longest} khung`);
