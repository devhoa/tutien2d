// Bài thử 26/11/2026: thưởng linh khí theo % tầng (việc ngày, Mốc quà) phải cộng ĐÚNG số ghi, không nhân dòng Hấp thu linh khí, linh căn,
// Thăng Linh Đan, đạo lữ, sư đồ. Máy chủ chỉ cho hạn mức đúng phần quà + 10% (p2d_qi_thuong): máy khách nhân thêm thì lần lưu kế vượt hạn
// mức, bị cắt và cắm cờ linh_khi (một người chơi Nguyên Anh bị cờ đỏ oan sáng 26/11). Chạy ở gốc kho: node tools/qua-linh-khi.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const src = f => readFileSync(f, 'utf8');
// 1) gainQi có nhánh thuan bỏ mọi hệ số nhân
const g = src('src/game/game.js'), m = g.match(/game\.gainQi = \(amount, x, y, quiet, raw, real, thuan\) => \{[^\n]*\n\s*if \(!thuan\) amount = ([^\n]+)/);
assert.ok(m, 'game.gainQi phải có tham số thuan và chỉ nhân hệ số khi không thuan');
for (const k of ['qiMul', 'qiX2', 'daoLuMul', 'suDoQiMul']) assert.ok(m[1].includes(k), `hệ số ${k} phải nằm trong nhánh !thuan`);
// 2) dựng lại đúng hàm từ mã nguồn rồi đo: thưởng 5% tầng với mọi hệ số bật vẫn ra đúng 5%
const than = g.slice(g.indexOf('game.gainQi = (amount'), g.indexOf('if (broke > 0)', g.indexOf('game.gainQi = (amount')));
let cong = 0;
const game = { player: { st: { qiMul: 1.6 } }, save: { qiX2: Date.now() + 1e6 }, daoLuMul: () => 1.05, suDoQiMul: () => 1.1 };
const data = { realms: { qi_rate: 0.1 } }, addQi = (s, r, n) => { cong += n; return 0; }, gainTechExp = () => {}, gainPetExp = () => {}, gainCompExp = () => {}, addNumber = () => {};
new Function('game', 'data', 'addQi', 'gainTechExp', 'gainPetExp', 'gainCompExp', 'addNumber', than + '};')(game, data, addQi, gainTechExp, gainPetExp, gainCompExp, addNumber);
const can = 3962477, qua = Math.round(can * 0.05);
cong = 0; game.gainQi(qua, 0, 0, true, true, true, true);
assert.equal(cong, qua, `thưởng thuần phải đúng ${qua}, ra ${cong}`);
assert.ok(cong <= Math.ceil(can * 0.05 * 1.1), 'thưởng thuần phải nằm trong hạn mức máy chủ (phần quà + 10%)');
cong = 0; game.gainQi(qua, 0, 0, true, true, true);
assert.ok(cong > qua * 1.5, 'không thuan thì vẫn nhân hệ số như cũ (quái, đan)');
// 3) mọi chỗ cộng thưởng theo % tầng đều gọi thuan
for (const [f, n] of [['src/ui/he-thong-nv.js', 2], ['src/ui/he-thong-moc.js', 1]]) {
  const goi = [...src(f).matchAll(/game\.gainQi\(([^;]*?)\);/g)].map(x => x[1]);
  assert.equal(goi.length, n, `${f}: số chỗ gọi gainQi đổi (${goi.length}), soát lại bài thử`);
  for (const a of goi) assert.ok(/, false, true, true, true$/.test(a.trim()), `${f}: thưởng theo % tầng phải gọi gainQi(…, false, true, true, true): ${a}`);
}
console.log(`qua-linh-khi: đạt (thưởng 5% tầng = ${qua.toLocaleString('vi-VN')}, không nhân thêm)`);
