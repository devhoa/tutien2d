// Bài thử phong hào trước tên (src/game/phong-hao.js, data/status.json → phong_hao; chủ dự án 23/11/2026 22:47 "7 bậc, ai cũng có phong hào",
// 22:57 ma xét theo hạng bảng Ma hóa): node tools/phong-hao.test.mjs (tools/check.mjs cũng gọi).
//   - số, chữ: 7 bậc, hạng tăng dần, bậc cuối nhận mọi hạng còn lại; chữ tộc đủ bảy tộc của data/tiem-nang.json; hai bảng có thật
//   - hạng → bậc đúng mốc 1 / 3 / 10 / 30 / 100 / 300; chưa có trên bảng vẫn có phong hào (bậc cuối)
//   - người thường xét bảng Sức mạnh, người đang hóa ma xét bảng Ma hóa; bị gắn cờ không có; chưa tải bảng không hiện
//   - tra người khác bằng mã công khai tính từ mã tài khoản (giống p2d_chat_key ở máy chủ); mình lấy dòng "của tôi"
//   - đủ bản dịch en, zh-Hant cho mọi phong hào ghép được
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const status = read('status.json'), C = status.phong_hao, TN = read('tiem-nang.json'), social = read('social.json');
const { docBang, bacCua, phongHao, phongHaoNguoi, phongHaoToi } = await import('../src/game/phong-hao.js');
const { chatKey } = await import('../src/game/social.js');
const { md5 } = await import('../src/core/md5.js');

// 1. số, chữ
assert.ok(C?.on, 'data/status.json → phong_hao thiếu hoặc đang tắt');
assert.equal(C.bac.length, 7, 'phải có 7 bậc (chủ dự án chọn "7 bậc, ai cũng có phong hào")');
assert.deepEqual(C.bac.map(b => b.ten), ['Tổ', 'Đế', 'Tôn', 'Hoàng', 'Vương', 'Hầu', 'Sĩ'], 'thứ tự bậc từ cao xuống thấp');
C.bac.forEach((b, i) => {
  assert.ok(/^#[0-9a-f]{6}$/i.test(b.mau), `bậc ${b.ten}: màu sai`);
  if (i < C.bac.length - 1) assert.ok(b.den > 0 && (i === 0 || b.den > C.bac[i - 1].den), `bậc ${b.ten}: mốc hạng phải tăng dần`);
  else assert.equal(b.den, null, 'bậc cuối nhận mọi hạng còn lại (den null)');
});
assert.deepEqual(new Set(C.bac.map(b => b.mau)).size, 7, 'mỗi bậc một màu riêng (phong hào thể hiện địa vị)');
assert.deepEqual(Object.keys(C.ten).filter(k => k !== 'ma').sort(), Object.keys(TN.toc).sort(), 'bảng tên phải đủ đúng bảy tộc của data/tiem-nang.json');
assert.ok(C.ten[C.mac_dinh] && C.ten.ma, 'thiếu tên của tộc mặc định hoặc của ma');
for (const [toc, ds] of Object.entries(C.ten)) {
  assert.equal(ds.length, C.bac.length, `ten.${toc}: phải đủ ${C.bac.length} bậc`);
  ds.forEach((t, i) => assert.ok(typeof t === 'string' && t.endsWith(' ' + C.bac[i].ten), `ten.${toc}[${i}] "${t}" phải là tên bậc ${C.bac[i].ten}`));
  assert.equal(new Set(ds).size, ds.length, `ten.${toc}: trùng tên`);
}
const tabs = social.rank.tabs.map(t => t.id);
assert.ok(tabs.includes(C.bxh) && tabs.includes(C.bxh_ma), `bảng ${C.bxh} / ${C.bxh_ma} không có trong data/social.json → rank.tabs`);
assert.ok(C.lam_moi >= 60, 'tải bảng quá dày');

// 2. hạng → bậc
const mong = { 1: 'Tổ', 2: 'Đế', 3: 'Đế', 4: 'Tôn', 10: 'Tôn', 11: 'Hoàng', 30: 'Hoàng', 31: 'Vương', 100: 'Vương', 101: 'Hầu', 300: 'Hầu', 301: 'Sĩ', 5000: 'Sĩ' };
for (const [h, ten] of Object.entries(mong)) assert.equal(bacCua(C, +h)?.ten, ten, `hạng ${h} phải là ${ten}`);
assert.equal(bacCua(C, null)?.ten, 'Sĩ', 'chưa có trên bảng: bậc cuối');

// 3. luồng tra: hai bảng giả, mã công khai tính từ mã tài khoản
assert.equal(chatKey('abc'), md5('chat:abc').slice(0, 12), 'mã công khai phải giống p2d_chat_key = left(md5(chat:uid), 12)');
const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const dong = (n, hang, x = {}) => ({ hang, k: chatKey(uid(n)), ten: 'x', gia_tri: 1, ...x });
const luc = { top: [dong(1, 1), dong(2, 2), dong(3, 15), dong(4, 120, { co: true }), dong(9, 7, { la_toi: true })] };
const maBang = { top: [dong(5, 1), dong(6, 4)], toi: null };
const game = { data: { status }, save: { tiem: { toc: 'yeu' } }, pvp: { ma: 0 } };
assert.equal(phongHaoNguoi(game, { id: uid(1) }, { toc: 'linh' }), null, 'chưa tải bảng thì không hiện phong hào');
game.phongHao = { luc: docBang(luc), ma: docBang(maBang) };
const ph = (n, h) => phongHaoNguoi(game, { id: uid(n) }, h)?.chu ?? null;
assert.equal(ph(1, { toc: 'linh' }), 'Linh Tổ');
assert.equal(ph(2, { toc: 'than' }), 'Thần Đế');
assert.equal(ph(3, {}), 'Nhân Hoàng', 'chưa thức tỉnh huyết mạch: chữ tộc mặc định');
assert.equal(ph(4, { toc: 'co' }), null, 'bị gắn cờ nghi vấn: không phong hào');
assert.equal(ph(7, { toc: 'hu' }), 'Hư Sĩ', 'chưa có trên bảng vẫn có phong hào (bậc cuối)');
assert.equal(ph(5, { toc: 'linh', ma: '3' }), 'Ma Tổ', 'đang hóa ma: xét hạng bảng Ma hóa, chữ Ma');
assert.equal(ph(1, { toc: 'linh', ma: '1' }), 'Ma Sĩ', 'top Sức mạnh mà đang hóa ma: phong hào theo bảng Ma hóa, không theo sức mạnh');
assert.equal(ph(6, { ma: '9' }), 'Ma Tôn');
assert.equal(phongHaoNguoi(game, { id: uid(1) }, { toc: 'linh' }).sang, true, 'bậc Tổ phát sáng');
assert.equal(phongHaoNguoi(game, { id: uid(3) }, {}).mau, C.bac[3].mau, 'màu theo bậc');
assert.equal(phongHaoToi(game)?.chu, 'Yêu Tôn', 'mình: hạng ở dòng "của tôi", tộc trong bản lưu');
game.pvp.ma = 2;
assert.equal(phongHaoToi(game)?.chu, 'Ma Sĩ', 'mình đang hóa ma mà chưa có trên bảng Ma hóa: Ma Sĩ');
game.phongHao.ma = docBang({ top: [], toi: { hang: 2, k: chatKey(uid(9)) } });
assert.equal(phongHaoToi(game)?.chu, 'Ma Đế', 'mình đang hóa ma: hạng bảng Ma hóa ở mục toi');

// 4. bản dịch
for (const lang of ['en', 'zh-Hant']) {
  const d = read(`i18n/${lang}.json`);
  for (const t of Object.values(C.ten).flat()) assert.ok(d[t], `${lang}: thiếu bản dịch "${t}"`);
}
console.log('phong-hao: đạt');
