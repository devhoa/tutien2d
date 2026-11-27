// Bài thử Thể chất (data/the-chat.json, src/game/the-chat.js; docs/20-THE-CHAT.md): node tools/the-chat.test.mjs (tools/check.mjs cũng gọi).
// Giữ đúng lời chủ dự án 25/11/2026: "các loại thể chất từ yếu tới mạnh, nhưng từ phàm tới tiên, chỉ số được buff tổng thể không chênh lệch
// nhau vượt quá 20%"; Kết Đan mới thức tỉnh, một đời một lượt; và bản lưu bị sửa tay không lấy được hơn luật cho phép.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TC, tcOn, theCua, theMo, quayThe, thePct, phamThe } from '../src/game/the-chat.js';
import { tocMo } from '../src/game/le-toc.js';
import { leThe, createLeThe } from '../src/game/le-the.js';
import { coMat } from '../src/game/co-mat.js';
import { powerOf, sumStats, stdList } from '../src/game/he-chien.js';
import { can, lucThem } from './the-chat-can.mjs';

const read = f => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), 'utf8'));
const C = read('the-chat'), H = read('he-chien'), T = read('tiem-nang'), data = { 'the-chat': C, 'he-chien': H, 'tiem-nang': T };
const PCT = ['atk_pct', 'hp_pct', 'def_pct', 'crit', 'crit_dmg', 'cdr', 'lifesteal', 'thorns'];
let seed = 20261125; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

// Dữ liệu: 6 phẩm, tỉ lệ cộng lại 100, phẩm sau hiếm hơn và mạnh hơn phẩm trước; 24 thể chất, mỗi phẩm 4, tên và chữ ấn không trùng
assert.equal(C.pham.length, 6); assert.equal(Object.keys(C.the).length, 24);
assert.equal(C.pham.reduce((s, p) => s + p.w, 0), 100, 'tỉ lệ các phẩm phải cộng lại 100');
for (let i = 1; i < C.pham.length; i++) assert.ok(C.pham[i].w < C.pham[i - 1].w && C.pham[i].luc > C.pham[i - 1].luc, `phẩm ${C.pham[i].ten}: phải hiếm hơn và mạnh hơn phẩm trước`);
for (const p of C.pham) assert.ok(p.id && p.ten && /^#[0-9a-f]{6}$/i.test(p.mau), `phẩm ${p.id}: thiếu tên hoặc màu`);
for (let i = 0; i < 6; i++) assert.equal(Object.values(C.the).filter(t => t.pham === i).length, 4, `phẩm ${C.pham[i].ten} phải có đúng 4 thể chất`);
assert.equal(new Set(Object.values(C.the).map(t => t.ten)).size, 24, 'tên thể chất trùng nhau');
assert.equal(new Set(Object.values(C.the).map(t => t.han)).size, 24, 'chữ ấn trùng nhau');
for (const [id, t] of Object.entries(C.the)) {
  assert.match(id, /^[a-z0-9-]+$/, `${id}: mã chỉ gồm chữ thường, số, gạch nối`);
  assert.ok(t.ten && [...t.han].length === 1 && t.dac_diem && t.loi, `${id}: thiếu tên, chữ ấn, đặc điểm hoặc lai lịch`);
  assert.ok(Math.abs(Object.values(t.huong).reduce((s, x) => s + x, 0) - 1) < 1e-6, `${id}: các phần trong huong phải cộng lại 1`);
  for (const k of Object.keys(t.huong)) assert.ok(PCT.includes(k) && H.line_f[k], `${id}: chỉ số ${k} không có trong luật chiến đấu`);
  for (const [k, v] of Object.entries(t.chi_so)) assert.ok(k in t.huong && v > 0 && v <= C.tran[k], `${id}: ${k} ${v} ngoài hướng hoặc quá trần ${C.tran[k]}`);
}
for (const k of ['truoc', 'chu_lon', 'goi', 'nhan', 'mot_luot']) assert.ok(C.le[k], `le.${k}: thiếu chữ`);
assert.equal(C.le.sau.length, 6); for (const c of C.le.sau) assert.ok(c.includes('{the}'), 'le.sau: mỗi phẩm một câu có {the}');

// Cân: chi_so trong data đúng là bản tools/the-chat-can.mjs cân ra; mức lực chiến thêm cao nhất qua các cảnh giới của mỗi thể chất sát mức của
// phẩm mình (pham.*.luc) và không vượt
const K = can(C, H, T.quy);
for (const [id, t] of Object.entries(C.the)) {
  assert.deepEqual(t.chi_so, K[id].chi_so, `${id}: chi_so khác bản cân, chạy node tools/the-chat-can.mjs --ghi`);
  const l = lucThem(H, C, thePct({ theChat: id }, data));
  assert.ok(l <= C.pham[t.pham].luc + 1e-9 && l >= C.pham[t.pham].luc - C.do.sai, `${id}: thêm ${l.toFixed(2)}% lực chiến, phẩm ${C.pham[t.pham].ten} phải sát ${C.pham[t.pham].luc}% và không vượt`);
}

// Không chênh quá 20%: ở từng cảnh giới (cả ngoài mấy cảnh giới dùng để cân), người có thể chất mạnh nhất so với người có thể chất yếu nhất,
// và so với người chưa có thể chất, lực chiến không hơn quá 20%
let lechMax = 0, lechKhong = 0;
for (const realm of [2.2, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5]) {
  const luc = id => powerOf(H, sumStats(H, realm, stdList(H, realm), true, { pct: id ? thePct({ theChat: id }, data) : {} }));
  const goc = luc(null), all = Object.keys(C.the).map(luc);
  for (const [i, id] of Object.keys(C.the).entries()) assert.ok(all[i] > goc, `${id}: có thể chất mà lực chiến không tăng (cảnh giới ${realm})`);
  lechMax = Math.max(lechMax, Math.max(...all) / Math.min(...all) - 1); lechKhong = Math.max(lechKhong, Math.max(...all) / goc - 1);
  // phẩm cao hơn không bao giờ yếu hơn phẩm thấp hơn
  const theoPham = i => Object.keys(C.the).filter(id => C.the[id].pham === i).map(luc);
  for (let i = 1; i < 6; i++) assert.ok(Math.min(...theoPham(i)) > Math.max(...theoPham(i - 1)), `cảnh giới ${realm}: có thể chất ${C.pham[i].ten} yếu hơn thể chất ${C.pham[i - 1].ten}`);
}
assert.ok(lechMax <= 0.20, `thể chất mạnh nhất hơn yếu nhất ${(lechMax * 100).toFixed(1)}% lực chiến, quá 20%`);
assert.ok(lechKhong <= 0.20, `thể chất mạnh nhất hơn người chưa có ${(lechKhong * 100).toFixed(1)}% lực chiến, quá 20%`);

// Quay: 40000 lượt, phẩm ra gần đúng tỉ lệ, thể chất nào cũng ra, trong một phẩm chia đều
const dem = {}, N = 40000;
for (let i = 0; i < N; i++) { const ma = quayThe(data, rnd); assert.ok(C.the[ma], `quay ra mã lạ ${ma}`); dem[ma] = (dem[ma] || 0) + 1; }
for (const [i, p] of C.pham.entries()) {
  const ds = Object.keys(C.the).filter(id => C.the[id].pham === i), n = ds.reduce((s, id) => s + (dem[id] || 0), 0);
  assert.ok(Math.abs(n / N * 100 - p.w) < Math.max(0.6, p.w * 0.08), `phẩm ${p.ten}: quay ${N} lượt ra ${(n / N * 100).toFixed(2)}%, tỉ lệ ${p.w}%`);
  for (const id of ds) assert.ok(dem[id] > n / 4 * 0.7 && dem[id] < n / 4 * 1.3, `${id}: ra ${dem[id]} lượt, không đều trong phẩm (${n} lượt chia 4)`);
}
assert.equal(C.the[quayThe(data, () => 0)].pham, 0); assert.equal(C.the[quayThe(data, () => 0.999999999)].pham, 5);

// Cảnh giới: thể chất mở ở Kim Đan (mo = 2), huyết mạch mở ở Trúc Cơ (le.mo = 1); tính theo cảnh giới cao nhất từng đạt
assert.equal(C.mo, 2); assert.equal(T.le.mo, 1);
assert.equal(theMo({ realm: 1 }, data), false); assert.equal(theMo({ realm: 2 }, data), true); assert.equal(theMo({ realm: 5 }, data), true);
assert.equal(theMo({ realm: 1, tiem: { max: 2 } }, data), true, 'từng lên Kim Đan rồi tụt vẫn được thức tỉnh');
assert.equal(tocMo({ data, save: { realm: 0 } }), false); assert.equal(tocMo({ data, save: { realm: 1 } }), true); assert.equal(tocMo({ data, save: { realm: 0, tiem: { max: 1 } } }), true);

// Bản lưu sửa tay: chỉ nhận MÃ có trong data; gắn số vào bản lưu không có tác dụng; tắt tính năng thì không cộng gì
assert.deepEqual(thePct({ theChat: 'khong-co' }, data), {});
assert.deepEqual(thePct({ theChat: { ten: 'x', chi_so: { atk_pct: 999 } } }, data), {});
assert.deepEqual(thePct({ theChat: ['thai-so'] }, data), {});
assert.deepEqual(thePct({}, data), {});
assert.deepEqual(thePct({ theChat: 'thai-so', theChatSo: { atk_pct: 999 } }, data), C.the['thai-so'].chi_so);
assert.equal(theCua({ theChat: 'thai-so' }, data), C.the['thai-so']); assert.equal(phamThe(data, C.the['thai-so']).id, 'tien');
assert.deepEqual(thePct({ theChat: 'thai-so' }, { ...data, 'the-chat': { ...C, on: false } }), {}); assert.equal(tcOn({}), false); assert.equal(TC(data), C);
// Lễ (src/game/le-the.js leThe): có tài khoản thì CHỈ máy chủ quay, và bản lưu phải được gửi lên trước khi gọi quay (máy chủ cần thấy cảnh giới
// mới); máy chủ lỗi hoặc trả mã lạ thì hoãn lễ, không nói gì, không ghi gì, không quay tạm tại máy; chơi khách thì quay tại máy
{
  const dung = (them = {}) => { const nk = []; const g = { data, save: { realm: 2, element: 'hoa' }, nk, dialog: { say: async l => { nk.push('noi'); } }, refreshStats: () => nk.push('chi-so'),
    persist: () => nk.push('luu'), leTheUI: async ma => { nk.push('le:' + ma); }, chuLon: o => nk.push('chu:' + o.cau), ...them }; return g; };
  let g = dung({ cloud: { flush: async () => { g.nk.push('gui'); } }, quayTheMayChu: async () => { g.nk.push('quay'); return { ma: 'kiem-cot' }; } });
  assert.equal(await leThe(g), true); assert.equal(g.save.theChat, 'kiem-cot'); assert.equal(g.leDang, false);
  assert.deepEqual(g.nk, ['gui', 'quay', 'noi', 'chi-so', 'luu', 'le:kiem-cot', 'chu:' + C.the['kiem-cot'].ten, 'noi'], 'thứ tự lễ: gửi bản lưu, máy chủ quay, báo, ghi, màn lễ, chữ lớn, câu kết');
  assert.equal(await leThe(g), false, 'đã có thể chất thì không làm lễ lần hai');
  for (const quay of [async () => { throw new Error('net'); }, async () => ({ ma: 'khong-co' }), async () => null]) {
    g = dung({ cloud: { flush: async () => {} }, quayTheMayChu: quay });
    assert.equal(await leThe(g), false); assert.equal(g.save.theChat, undefined, 'máy chủ chưa trả mã hợp lệ: không tự quay tại máy');
    assert.deepEqual(g.nk, [], 'hoãn lễ thì không thoại, không ghi'); assert.ok(g.leTheCho > Date.now() + (C.le.thu_lai_s - 5) * 1000, 'hoãn rồi thử lại sau thu_lai_s'); assert.equal(g.leDang, false);
  }
  g = dung({ cloud: { flush: async () => { throw new Error('mat_mang'); } }, quayTheMayChu: async () => ({ ma: 'kiem-cot' }) });
  assert.equal(await leThe(g), false, 'gửi bản lưu hỏng thì cũng hoãn'); assert.equal(g.save.theChat, undefined);
  g = dung({ cloudDown: true });
  assert.equal(await leThe(g), false, 'đã đăng nhập mà máy chủ đang lỗi (cloudDown): chờ, không quay tại máy'); assert.equal(g.save.theChat, undefined);
  g = dung();
  assert.equal(await leThe(g), true, 'chơi khách: quay tại máy'); assert.ok(C.the[g.save.theChat]);
  g = dung({ theEp: 'thai-so' }); assert.equal(await leThe(g), true); assert.equal(g.save.theChat, 'thai-so');
  g = dung({ theEp: 'thai-so', cloud: { flush: async () => {} }, quayTheMayChu: async () => ({ ma: 'pham-thai' }) });
  assert.equal(await leThe(g), true); assert.equal(g.save.theChat, 'pham-thai', 'có tài khoản: theEp không có tác dụng, máy chủ quyết');
  g = dung(); g.save.realm = 1; assert.equal(await leThe(g), false, 'Trúc Cơ chưa được làm lễ thể chất'); assert.equal(g.save.theChat, undefined);
  g = dung(); delete g.save.element; assert.equal(await leThe(g), false, 'chưa có linh căn thì chưa làm lễ');

  // Lễ tự mở (createLeThe) chỉ khi người chơi vừa chạm màn trong le.co_mat_s giây (src/game/co-mat.js). 25/11/2026 16:44 bản đầu không có luật
  // này: người đang treo Tự đánh được trang tự tải lại, lễ mở lúc không ai ngồi đó, câu thoại đứng mãi làm Tự đánh đứng theo.
  assert.ok(C.le.co_mat_s >= C.le.yen_s + 5 && C.le.co_mat_s <= 60, 'co_mat_s: đủ cho một cú chạm rồi yên yen_s giây, nhưng không dài tới mức người vừa bỏ đi vẫn tính là có mặt');
  assert.ok(read('tiem-nang').le.co_mat_s > 0, 'lễ huyết mạch cũng chờ người chơi có mặt');
  assert.equal(coMat({}, 15), false, 'chưa chạm lần nào: không có mặt'); assert.equal(coMat({ chamLuc: Date.now() - 14000 }, 15), true); assert.equal(coMat({ chamLuc: Date.now() - 16000 }, 15), false);
  assert.equal(coMat({}, 0), true, 'co_mat_s = 0: không xét'); assert.equal(coMat({}, undefined), true);
  const nhip = g2 => { const goc = globalThis.setInterval; let f; globalThis.setInterval = fn => { f = fn; return 0; }; try { createLeThe(g2); } finally { globalThis.setInterval = goc; } return f; };
  const lang = () => new Promise(r => setTimeout(r, 5));
  g = dung({ theEp: 'kiem-cot' }); g.save.tiem = { toc: 'nhan' };
  let tick = nhip(g);
  for (let i = 0; i < C.le.yen_s + 6; i++) tick();
  await lang(); assert.deepEqual(g.nk, [], 'treo máy (chưa chạm lần nào): màn yên bao lâu lễ cũng không mở'); assert.equal(g.save.theChat, undefined);
  g.chamLuc = Date.now() - (C.le.co_mat_s + 2) * 1000;
  for (let i = 0; i < C.le.yen_s + 6; i++) tick();
  await lang(); assert.deepEqual(g.nk, [], 'chạm lần cuối đã quá co_mat_s giây: vẫn chờ'); assert.equal(g.save.theChat, undefined);
  g.chamLuc = Date.now();
  for (let i = 0; i < C.le.yen_s - 1; i++) tick();
  await lang(); assert.equal(g.save.theChat, undefined, 'vừa chạm nhưng màn chưa yên đủ yen_s giây: chưa mở');
  tick(); await lang(); assert.equal(g.save.theChat, 'kiem-cot', 'vừa chạm, màn yên đủ yen_s giây: lễ mở');
  g = dung({ theEp: 'kiem-cot', chamLuc: Date.now(), mobs: [{ aggro: true, hp: 5 }] }); g.save.tiem = { toc: 'nhan' }; tick = nhip(g);
  for (let i = 0; i < C.le.yen_s + 6; i++) tick();
  await lang(); assert.equal(g.save.theChat, undefined, 'có mặt nhưng quái đang đuổi: không chen vào trận đánh');
}
// Hồ sơ đạo hữu (src/ui/profile-side.js; chủ dự án 25/11/2026 23:50 "hiển thị cả linh căn thể phách và huyết mạch"): đủ chữ cho dòng Huyết mạch, Thể chất
// (đã / chưa thức tỉnh), có bản dịch. Mã thể chất, tộc của người được xem do game/profile.js lọc (tools/ho-so.test.mjs).
{
  const P = read('duel').profile, src = readFileSync(new URL('../src/ui/profile-side.js', import.meta.url), 'utf8');
  assert.ok(P.toc.includes('{name}') && P.the.includes('{name}') && P.the.includes('{pham}') && P.toc_none && P.the_none, 'data/duel.json → profile: toc, toc_none, the, the_none');
  for (const k of ['T.toc,', 'T.toc_none', 'T.the,', 'T.the_none', 'theCua(s, data)', 'phamThe(data, t)']) assert.ok(src.includes(k), `profile-side.js dùng ${k}`);
  for (const ng of ['en', 'zh-Hant']) { const d = JSON.parse(readFileSync(new URL(`../data/i18n/${ng}.json`, import.meta.url), 'utf8')); for (const k of [P.toc, P.toc_none, P.the, P.the_none]) assert.ok(d[k], `thiếu bản dịch ${ng}: ${k}`); }
}
console.log(`✅ Thể chất: 24 thể chất, 6 phẩm; mạnh nhất hơn yếu nhất ${(lechMax * 100).toFixed(1)}%, hơn người chưa có ${(lechKhong * 100).toFixed(1)}% lực chiến`);
