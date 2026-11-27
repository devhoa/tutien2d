// Bài thử chữ "trần" (chủ dự án 23/11/2026 19:1x, bảng chọn "Hiện chữ trần"): một người chơi đổi giày Giảm hồi chiêu 21% ↔ 14% không thấy
// chỉ số đổi vì phần dòng đã chạm trần 41%. sumStats (src/game/he-chien.js) phải đánh dấu s.tran[k] đúng lúc chạm trần cứng, không đánh
// dấu khi chưa chạm; tranNote (src/ui/tran-chu.js) chỉ nhắc chỉ số của chính món đó.
// Chạy ở gốc kho: node tools/tran-chi-so.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { sumStats } from '../src/game/he-chien.js';

const H = JSON.parse(readFileSync('data/he-chien.json', 'utf8'));
const L = a => a.map(([s, t]) => ({ s, t, v: 1 }));
const bo = giay => [
  { kind: 'mu', pham: 5, ir: 2, plus: 10, lines: L([['cdr', 1], ['cdr', 0], ['crit', 1]]) },
  { kind: 'ngoc-boi', pham: 5, ir: 2, plus: 10, lines: L([['cdr', 6], ['cdr', 0]]) },
  { kind: 'giay', pham: 4, ir: 2, plus: 10, lines: L(giay) },
];
// ca người chơi báo: cả hai đôi giày đều ra 41% và đều chạm trần
for (const g of [[['cdr', 4], ['cdr', 1]], [['cdr', 2], ['cdr', 0]]]) {
  const s = sumStats(H, 2, bo(g));
  assert.equal(Math.round(s.cdr * 10) / 10, H.cap.cdr, 'hai đôi giày đều ra trần');
  assert.equal(s.tran.cdr, H.cap.cdr, 'đánh dấu chạm trần');
}
// bỏ bớt dòng: chưa chạm trần thì không đánh dấu, và đổi giày thì số đổi
const a = sumStats(H, 2, bo([['cdr', 4], ['cdr', 1]]).slice(1)), b = sumStats(H, 2, bo([['cdr', 2], ['cdr', 0]]).slice(1));   // không đội mũ
assert.ok(a.cdr < H.cap.cdr && !a.tran.cdr && !b.tran.cdr, 'chưa chạm trần thì không có chữ trần');
assert.ok(a.cdr - b.cdr > 2, 'chưa chạm trần thì đổi giày số đổi');
// ngọc, công pháp cộng ngoài trần dòng: vẫn đánh dấu trần của phần dòng
const c = sumStats(H, 2, bo([['cdr', 4]]), false, { pct: { cdr: 6 } });
assert.equal(c.tran.cdr, H.cap.cdr); assert.ok(c.cdr > H.cap.cdr, 'phần cộng ngoài vẫn cộng');
// chỉ số khác không bị đánh dấu nhầm
assert.ok(!c.tran.crit && !c.tran.atk_pct, 'không đánh dấu nhầm chỉ số khác');
console.log('tran-chi-so: ok');
