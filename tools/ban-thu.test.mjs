// Bài thử báo tiền bán hàng ở Chợ Phiên (src/game/ban-thu.js; chủ dự án 23/11/2026 22:2x chọn "Báo rõ tiền bán hàng" sau khi một người chơi bán món
// 1 triệu Linh Thạch mà tưởng không nhận được tiền). Đi đúng đường của game: Hòm thư giả → src/game/market.js claimMail → báo.
// Chạy: node tools/ban-thu.test.mjs (tools/check.mjs gọi)
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const data = {};
for (const f of readdirSync(new URL('../data/', import.meta.url))) if (f.endsWith('.json')) data[f.slice(0, -5)] = JSON.parse(readFileSync(new URL('../data/' + f, import.meta.url), 'utf8'));
globalThis.setTimeout = f => { f(); return 0; };   // tiếng thứ hai (lấp lánh) kêu ngay

const { chuBaoBan, tenHangBan } = await import('../src/game/ban-thu.js');
const { claimMail } = await import('../src/game/market.js');
const { itemName } = await import('../src/game/items.js');
const T = data.market, lt = data.shop.name, fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

const base = Object.keys(data.items.bases).find(k => !k.startsWith('_'));
const mon = { uid: 7, base, rarity: data.items.rarities[0].id, lvl: 20, main: {}, lines: [], sockets: [] };
const mat = Object.keys(data.cave.materials).find(k => !k.startsWith('_'));
const thuBan = (id, coins, sold) => ({ id, ly_do: 'ban', noi_dung: { coins, sold } });

// 1. Chữ báo: một món trang bị, một nguyên liệu, nhiều thư gộp, thư không có tiền
{
  assert.equal(tenHangBan(data, mon), itemName(data, mon), 'tên món trang bị như trong túi');
  assert.ok(tenHangBan(data, { id: mat, n: 5 }).endsWith('×5'), 'tên nguyên liệu kèm số lượng');
  assert.equal(tenHangBan(data, { base: 'khong-co' }), '', 'món lạ: không tên');
  const b1 = chuBaoBan(data, [thuBan(1, 900000, mon)]);
  assert.equal(b1.text, fill(T.ban_bao, { mon: itemName(data, mon), n: '900.000', lt }), `một món: "${b1.text}"`);
  assert.equal(b1.n, 900000);
  const b2 = chuBaoBan(data, [thuBan(1, 18000, mon), thuBan(2, 900000, { id: mat, n: 3 })]);
  assert.equal(b2.text, fill(T.ban_bao_nhieu, { k: 2, n: '918.000', lt }), `nhiều thư gộp một lần: "${b2.text}"`);
  const b3 = chuBaoBan(data, [thuBan(1, 500, { base: 'khong-co' })]);
  assert.equal(b3.text, fill(T.ban_bao_tien, { n: '500', lt }), 'món lạ: vẫn báo số tiền');
  assert.equal(chuBaoBan(data, [thuBan(1, 0, mon)]), null, 'thư không có tiền: không báo');
  assert.equal(chuBaoBan(data, []), null);
}

// 2. Nhận thư qua claimMail: tiền vào túi, Lịch sử ghi "Bán ở Chợ Phiên" (cho-ban), số bay lên, tiếng nhặt, chữ báo rõ 5 giây; dòng chữ thư thường không lặp lại
function homThu(thu) {
  return {
    peekMail: async () => thu.filter(x => !x.nhan).map(({ id, ly_do, noi_dung }) => ({ id, ly_do, noi_dung })),
    takeMail: async ids => ({ thu: thu.filter(x => ids.includes(x.id) && !x.nhan).map(x => { x.nhan = true; return { id: x.id, ly_do: x.ly_do, noi_dung: x.noi_dung }; }) }),
  };
}
function moi() {
  return { data, save: { bag: [], nextUid: 100, lingshi: 300000, mats: {}, gems: {}, pills: {}, stats: { coins: 0 }, flags: {} }, player: { x: 50, y: 60 },
    cloud: { run: async (fn, ok) => ok(await fn()) }, chu: [], so: [], tieng: [],
    toast(t, s) { this.chu.push([t, s]); }, number(...a) { this.so.push(a); }, sfx(n) { this.tieng.push(n); }, refreshStats() {}, persist() {} };
}
{
  const g = moi(), N = homThu([thuBan(11, 900000, mon), { id: 12, ly_do: 'he_thong_qua', noi_dung: { coins: 5000, tieu_de: 'Quà' } }]);
  const got = await claimMail(g, N);
  assert.equal(g.save.lingshi, 300000 + 900000 + 5000, 'tiền bán và quà đều vào túi');
  const bao = g.chu.find(([t]) => t.includes(itemName(data, mon)));
  assert.ok(bao && bao[0].includes('900.000') && bao[1] >= 5, `chữ báo bán món gì, được bao nhiêu, giữ ≥ 5 giây (${JSON.stringify(g.chu)})`);
  assert.ok(g.so.some(a => String(a[2]).includes('+900.000')), 'số +900.000 bay lên trên đầu');
  assert.ok(g.tieng.includes('pickup') && g.tieng.includes('sparkle'), 'có tiếng nhặt + lấp lánh');
  assert.ok(!got.some(l => l.includes('900000')), `thư tiền bán không lặp ở dòng chữ thư thường (${got})`);
  assert.ok(got.some(l => l.includes('5000')), 'thư khác vẫn báo như cũ');
  assert.equal(g.chu.filter(([t]) => t.includes('900.000')).length, 1, 'báo một lần');
}
// 3. Hai thư tiền bán cùng lượt: một lần báo gộp, một số bay lên
{
  const g = moi(), N = homThu([thuBan(21, 18000, mon), thuBan(22, 900000, mon)]);
  await claimMail(g, N);
  assert.equal(g.so.length, 1, 'một số bay lên cho cả lượt');
  assert.ok(String(g.so[0][2]).includes('+918.000'), 'số là tổng tiền bán');
  assert.ok(g.chu.some(([t]) => t === fill(T.ban_bao_nhieu, { k: 2, n: '918.000', lt })), `chữ báo gộp (${JSON.stringify(g.chu)})`);
}
// 4. Lượt không có thư tiền bán: không báo gì thêm
{
  const g = moi();
  await claimMail(g, homThu([{ id: 31, ly_do: 'mua', noi_dung: { item: { ...mon, uid: 0 } } }]));
  assert.equal(g.so.length, 0, 'nhận hàng đã mua: không có số tiền bay lên');
}
// 5. Lịch sử Linh Thạch có chữ cho mã cho-ban
assert.ok(data.shop.coin_log.why['cho-ban'], 'data/shop.json coin_log.why thiếu cho-ban');
assert.ok(readFileSync(new URL('../src/game/market.js', import.meta.url), 'utf8').includes("'cho-ban'"), 'claimMail phải ghi lý do cho-ban cho thư bán hàng');
console.log('ban-thu: đạt');
