// Bài thử hàm máy chủ luc-chien (supabase/functions/luc-chien; chủ dự án 23/11/2026 19:58, máy chủ tự tính Lực chiến):
// (1) đoạn code đã gói (game.js) cho ĐÚNG số như code game đang chạy (src/game/stats.js + achieve.js) trên nhiều kiểu bản lưu;
// (2) danh sách tệp data hàm tải về (TEP trong index.ts) đủ mọi tệp code tính Lực chiến đọc tới, thiếu là báo đỏ (hàm sẽ tính sai lặng lẽ);
// (3) bản lưu hỏng / thiếu trường không làm hàm ném lỗi giữa chừng mà ra một số (hoặc lỗi riêng của người đó, người khác vẫn tính);
// (4) BAN đúng là băm của LC.toString(): hàm máy chủ băm lại lúc chạy để biết bản đã chép lên có đúng từng ký tự.
// Chạy ở gốc kho: node tools/luc-chien.test.mjs
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { playerStats as psNguon } from '../src/game/stats.js';
import { power as powNguon } from '../src/game/achieve.js';
import { playerStats as psGoi, power as powGoi, BAN, NGUON } from '../supabase/functions/luc-chien/game.js';
import { bamCode } from './luc-chien-bam.mjs';
import { mauLuu, soSanh } from './luc-chien-mau.mjs';

const goc = {};
for (const f of readdirSync('data')) if (f.endsWith('.json')) goc[f.slice(0, -5)] = JSON.parse(readFileSync('data/' + f, 'utf8'));
const TEP = JSON.parse(/const TEP = (\[[^\]]*\])/.exec(readFileSync('supabase/functions/luc-chien/index.ts', 'utf8'))[1].replace(/'/g, '"').replace(/\s+/g, ''));
const doc = new Set(), data = new Proxy(goc, { get(t, k) { if (typeof k === 'string') doc.add(k); return t[k]; } });

const mau = mauLuu(goc);
// (1) bản gói ra đúng số code game: chạy qua proxy đếm tệp data đọc tới, trên mọi bản lưu mẫu
const khac = soSanh({ playerStats: psNguon, power: powNguon }, { playerStats: psGoi, power: powGoi }, data, mau);
assert.deepEqual(khac, [], `bản gói khác code game: ${khac.slice(0, 3).join(' | ')}`);
let n = 0;
for (const { s } of mau) { try { const v = powNguon({ data: goc }, psNguon({ ...structuredClone(s), gems: {}, mats: {} }, goc)); if (Number.isFinite(v) && v >= 0) n++; } catch { /* bản lưu hỏng: lỗi riêng người đó */ } }
assert.ok(n >= mau.length * 0.9, `ít nhất 90% bản lưu mẫu ra số (được ${n}/${mau.length})`);
const thieu = [...doc].filter(k => goc[k] && !TEP.includes(k));
assert.deepEqual(thieu, [], `TEP trong supabase/functions/luc-chien/index.ts thiếu tệp data code đọc tới: ${thieu.join(', ')}`);
assert.match(BAN, /^[0-9a-f]{16}$/);
assert.equal(bamCode(NGUON), BAN, 'BAN phải là băm của LC.toString() (hàm máy chủ tự kiểm bằng cách này)');
console.log(`luc-chien: ok (${n} bản lưu, đọc ${[...doc].filter(k => goc[k]).length} tệp data, bản gói ${BAN})`);
