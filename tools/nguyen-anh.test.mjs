// Bài thử Nguyên Anh (data/nguyen-anh.json, src/game/nguyen-anh.js, kiếp Kết Anh data/config.json → ket_anh; docs/21-NGUYEN-ANH.md):
//   node tools/nguyen-anh.test.mjs   (tools/check.mjs cũng gọi)
// Giữ đúng lời chủ dự án 27/11/2026: phẩm Nguyên Anh NGƯỢC phẩm thể phách (01:16); kiếp Kết Anh sét gấp đôi Kết Đan, lâu gấp 3, nhiều vòng nhiều
// màu (01:09); màn thức tỉnh phẩm có đủ nhịp, tiếng, chữ, bản dịch (01:28).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NA, naPham, naK, naMo, naThuc } from '../src/game/nguyen-anh.js';
import { kdCfg, kdPlan, kdTimes } from '../src/game/ket-dan.js';
import { tocCho, theCho } from '../src/game/le-truoc.js';

const read = f => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), 'utf8'));
const C = read('nguyen-anh'), TC = read('the-chat'), cfg = read('config'), R = read('realms'), TG = read('tieng-chieu');
const data = { 'nguyen-anh': C, 'the-chat': TC, config: cfg };

// Phẩm: 6 bậc, bậc sau mạnh hơn (k, ra_s lớn hơn; hoi nhỏ hơn); phẩm Nguyên Anh = 5 − phẩm thể chất; chưa có thể chất thì Huyền
assert.equal(C.pham.length, TC.pham.length, 'số phẩm Nguyên Anh phải bằng số phẩm thể chất');
for (let i = 1; i < C.pham.length; i++) {
  const a = C.pham[i - 1], b = C.pham[i];
  assert.ok(b.k > a.k && b.ra_s >= a.ra_s && b.hoi <= a.hoi, `phẩm ${i}: phải mạnh hơn phẩm trước`);
}
for (const [ma, t] of Object.entries(TC.the)) assert.equal(naPham({ theChat: ma }, data), C.pham.length - 1 - t.pham, `${ma}: phẩm Nguyên Anh phải ngược phẩm thể chất`);
assert.equal(naPham({}, data), 2, 'chưa có thể chất: phẩm giữa');
assert.equal(naPham({ theChat: 'khong-co' }, data), 2, 'mã thể chất lạ: phẩm giữa');

// Mức sát thương theo tầng: Nguyên Anh tầng 1 → 9 tăng dần, cảnh giới sau giữ mức tầng 9
const k = (realm, layer) => naK({ theChat: 'pham-thai', realm, layer }, data);
assert.ok(k(3, 1) < k(3, 9) && Math.abs(k(3, 9) - k(5, 1)) < 1e-9, 'naK: tầng 1 < tầng 9 = cảnh giới sau');
assert.ok(k(3, 9) <= 1, 'Nguyên Anh không đánh mạnh hơn một nhát chém thường');

// Mở: cảnh giới cao nhất từng đạt; đã qua lễ mới có
assert.ok(!naMo({ realm: 2 }, data) && naMo({ realm: 3 }, data) && naMo({ realm: 2, tiem: { max: 3 } }, data), 'naMo theo cảnh giới cao nhất');
assert.ok(!naThuc({ realm: 3, flags: {} }, data) && naThuc({ realm: 3, flags: { 'na-thuc': true } }, data), 'naThuc theo cờ na-thuc');

// Kiếp Kết Anh: số đạo gấp đôi Kết Đan, cả nghi lễ dài gấp 3 (±5%), nhiều vòng và nhiều dải màu hơn; lên Kim Đan vẫn bảng Kết Đan
const dao1 = R.tribulation.by_realm[1].waves, dao2 = R.tribulation.by_realm[2].waves, game = { data: { config: cfg } };
assert.equal(R.tribulation.by_realm[2].kind, 'ket-dan');
assert.equal(dao2, dao1 * 2, 'Kết Anh: sét gấp đôi Kết Đan');
const K1 = kdCfg(game, dao1), K2 = kdCfg(game, dao2), dai = K => { const T = kdTimes(K, kdPlan(K, K === K1 ? dao1 : dao2, 0)); return T.g; };
assert.equal(K1, cfg.ket_dan, 'Kết Đan dùng nguyên bảng ket_dan');
assert.ok(Math.abs(dai(K2) / dai(K1) - 3) < 0.15, `Kết Anh phải dài gấp 3 Kết Đan (đang ${(dai(K2) / dai(K1)).toFixed(2)})`);
assert.ok(K2.rings.length > K1.rings.length && (K2.pals?.length || 0) >= 3 && K2.khi_xa?.n > 0, 'Kết Anh: nhiều vòng, nhiều dải màu, có dòng linh khí');
assert.equal(K2.lien.p, K1.lien.p, 'khoá không ghi đè thì như Kết Đan');

// Lên Hóa Thần TẠM KHOÁ (chủ dự án 27/11/2026 04:38: "ấn cái là 100 tia cùng dí xuống thất bại ngay lập tức"): khối khoa ở kiếp Nguyên Anh → Hóa Thần,
// chỉ ở đó (các kiếp khác vẫn qua được), có lời báo đã dịch
const KH = R.tribulation.by_realm[3].khoa;
assert.equal(R.names[4], 'Hóa Thần'); assert.ok(KH && KH.tia === 100 && KH.bao, 'kiếp lên Hóa Thần phải còn khoá (100 tia)');
assert.ok(R.tribulation.by_realm.every((b, i) => i === 3 || !b.khoa), 'chỉ kiếp lên Hóa Thần bị khoá');

// Thức tỉnh trước, chúc mừng sau (04:38): lên Trúc Cơ chưa có huyết mạch thì lễ huyết mạch chờ; lên Kim Đan có huyết mạch, chưa có thể phách thì lễ thể phách chờ
{
  const TN = read('tiem-nang'), D = { ...data, 'tiem-nang': TN };
  const g = (realm, o = {}) => ({ data: D, save: { element: 'kim', realm, flags: {}, ...o } });
  assert.ok(tocCho(g(1)) && !tocCho(g(0)) && !tocCho(g(1, { tiem: { toc: 'nhan' } })), 'lễ huyết mạch chờ khi vừa lên Trúc Cơ');
  assert.ok(theCho(g(2, { tiem: { toc: 'nhan' } })) && !theCho(g(1, { tiem: { toc: 'nhan' } })) && !theCho(g(2, { tiem: { toc: 'nhan' }, theChat: 'pham-thai' })), 'lễ thể phách chờ khi vừa lên Kim Đan');
}

// Màn thức tỉnh phẩm: nhịp tăng dần, vỡ sau tim và vết nứt cuối; mọi tiếng có trong data/tieng-chieu.json; dòng công dụng có nhãn
const M = C.le.man, N = M.nhip;
for (const a of [N.tim, N.nut]) for (let i = 1; i < a.length; i++) assert.ok(a[i] > a[i - 1], 'nhịp tim, vết nứt phải tăng dần');
assert.ok(N.hit > N.tim.at(-1) - 0.5 && N.bung > N.hit && N.bung > N.nut.at(-1), 'vỡ sau nhịp tim và vết nứt cuối');
for (const [k2, ten] of Object.entries(M.sfx)) assert.ok(TG.sfx[ten], `tiếng ${k2} (${ten}) chưa có trong data/tieng-chieu.json`);
for (const ten of Object.values(C.tieng)) assert.ok(TG.sfx[ten], `tiếng ${ten} chưa có`);
for (const d of M.dong) assert.equal(d.split('|').length, 2, `dòng công dụng phải có dạng "nhãn|lời": ${d}`);

// Bản dịch: chữ người chơi thấy của Nguyên Anh có đủ en, zh-Hant
const chu = [KH.bao, C.le.truoc, ...C.le.sau, M.goi_dau, M.ten, ...M.dong, M.mot_luot, C.text.chua_ngan, C.text.cho_le, C.text.chua, C.text.nghich, C.anh.nut, C.anh.bao, C.anh.xong];
for (const ng of ['en', 'zh-Hant']) { const d = JSON.parse(readFileSync(new URL(`../data/i18n/${ng}.json`, import.meta.url), 'utf8')); for (const s of chu) assert.ok(d[s], `${ng}: chưa dịch "${s.slice(0, 40)}"`); }

console.log('nguyen-anh: đạt', `· Kết Anh ${dai(K2).toFixed(1)} giây (Kết Đan ${dai(K1).toFixed(1)}) · ${dao2} đạo`);
