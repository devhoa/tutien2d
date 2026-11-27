// Bài thử cơ duyên + Tọa Vong Đan + tỉ lệ luyện đan (chủ dự án 25/11/2026). Chạy: node tools/co-duyen.test.mjs (có trong tools/check.mjs).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const J = f => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), 'utf8'));
const cave = J('cave'), CD = J('co-duyen'), config = J('config'), social = J('social');
const { plan, cdTick } = await import('../src/game/co-duyen.js');
const { uongToaVong, toaVongTick, toaVongCon, toaVongRate, gioPhut } = await import('../src/game/toa-vong.js');
const { medPerSec, medCap } = await import('../src/game/da-toa.js');

// --- tỉ lệ luyện đan: gốc 80%, mỗi phẩm đan trừ 4%, không đan nào vượt trần, đan phẩm cao không dễ hơn đan phẩm thấp
const L = cave.lo, tl = (p, lo = 0, ph = false) => Math.max(L.floor, Math.min(L.max, L.base + L.pham[lo] - L.phat_dan * p + (ph ? L.phuong.them : 0)));
assert.equal(L.base, 0.8); assert.equal(L.phat_dan, 0.04);
assert.ok(Math.abs(tl(0) - 0.8) < 1e-9 && Math.abs(tl(5) - 0.6) < 1e-9, 'tỉ lệ lò Phàm: Phàm 80%, Tiên 60%');
for (let p = 1; p <= 5; p++) assert.ok(tl(p) < tl(p - 1), 'phẩm đan cao phải khó hơn');
assert.ok(tl(0, 6, true) <= L.max);

// --- đan mới và nguyên liệu: có đủ trong data, không bán ở đâu
const pill = cave.pills['toa-vong-dan'];
assert.ok(pill?.use?.toa_vong?.length === 2 && pill.use.toa_vong[0] >= 3600 && pill.use.toa_vong[1] <= 6 * 3600, 'mỗi viên vài tiếng');
for (const id of Object.keys(pill.recipe)) assert.ok(cave.materials[id], `thiếu nguyên liệu ${id}`);
// Đan phương chỉ gồm nguyên liệu cơ duyên, không chung nguyên liệu với đan nào khác: lò chưa biết đan thì ghép mọi đan phương khớp theo
// thứ tự ngẫu nhiên (p2d_luyen_dan2), chung Linh Thảo là dễ ra Hồi Xuân Đan rồi mất trắng Chu Quả.
for (const [k, d] of Object.entries(cave.pills)) if (k !== 'toa-vong-dan' && d.recipe) for (const id of Object.keys(pill.recipe)) assert.ok(!(id in d.recipe), `${k} dùng chung ${id} với Tọa Vong Đan`);
assert.deepEqual(Object.keys(pill.recipe).sort(), Object.values(CD.mon).map(M => M.id).sort(), 'Tọa Vong Đan chỉ luyện từ nguyên liệu cơ duyên');
{   // lò chưa biết đan (máy tự ghép): bỏ đúng hai nguyên liệu cơ duyên thì mẻ chỉ ra Tọa Vong Đan, lần nào cũng vậy
  const { ghep } = await import('../src/game/lo-dan.js');
  for (let i = 0; i < 40; i++) assert.deepEqual(ghep({ data: { cave } }, { 'chu-qua': 4, 'that-diep-linh-chi': 2 }, null), [{ id: 'toa-vong-dan', sets: 2, make: 1 }]);
}
for (const M of Object.values(CD.mon)) { assert.ok(cave.materials[M.id]); assert.ok(pill.recipe[M.id] > 0); assert.ok(CD.server.tran_ngay[M.id] >= M.ngay, 'trần máy chủ không được thấp hơn trần máy khách'); }
const shop = JSON.stringify(J('shop')) + JSON.stringify(J('topup')) + JSON.stringify(J('he-thong').pool) + JSON.stringify(J('nl-roi').pool) + JSON.stringify(cave.mat_drops);
for (const id of ['toa-vong-dan', 'chu-qua', 'that-diep-linh-chi']) assert.ok(!shop.includes(`"${id}"`), `${id} chỉ có nhờ cơ duyên, không được bán / rơi / quay ra`);

// --- game giả
const T = 16, W = 40;
const map = { id: 'thu', T, w: W, h: W, hoi: [{ kind: 'cay', x: 200, y: 200, w: 30, h: 44 }, { kind: 'cay', x: 400, y: 320, w: 30, h: 40 }, { kind: 'nha', x: 90, y: 90, w: 60, h: 60 }],
  def: {}, edge: (tx, ty) => tx < 2 || ty < 2 || tx > W - 3 || ty > W - 3, center: (tx, ty) => ({ x: tx * T + 8, y: ty * T + 8 }), blocked: () => false };
const toasts = [];
const mk = () => ({ data: { 'co-duyen': CD, 'nl-roi': { on: true }, cave, config, items: { materials: {} }, home: {}, social }, map, save: { mats: {}, pills: {}, realm: 2 }, player: { x: 0, y: 0, meditating: true },
  toast: t => toasts.push(t), persist() {}, sfx() {}, numbers: [], loot: [] });

// cùng người cùng khung thì cùng chỗ; hai người khác hạt thì khác nhau; tỉ lệ xuất hiện đúng cỡ p
const g = mk(); g.save.coDuyen = { ngay: 'x', n: {}, keys: [], hat: 'aaaa' };
let co = 0, tren = 0;
for (let s = 0; s < 4000; s++) { const a = plan(g, s, 'qua'), b = plan(g, s, 'qua'); assert.deepEqual(a, b); if (a) { co++; if (a.cay) { tren++; assert.ok(map.hoi.some(h => h.kind === 'cay' && h.x === a.x && h.y === a.y && a.qy < h.y - h.h * 0.4), 'trái phải nằm trên tán cây'); } } }
assert.ok(Math.abs(co / 4000 - CD.mon.qua.p) < 0.04, `tỉ lệ trái ${co / 4000}`);
assert.equal(tren, co, 'bản đồ có cây thì trái luôn kết trên cây');
const g2 = mk(); g2.save.coDuyen = { ngay: 'x', n: {}, keys: [], hat: 'bbbb' };
let khac = 0; for (let s = 0; s < 300; s++) if (JSON.stringify(plan(g, s, 'thao')) !== JSON.stringify(plan(g2, s, 'thao'))) khac++;
assert.ok(khac > 60, 'hai người phải có cơ duyên khác nhau');
const g3 = mk(); g3.map = { ...map, hoi: [] }; g3.save.coDuyen = { ngay: 'x', n: {}, keys: [], hat: 'cccc' };
let dat = 0; for (let s = 0; s < 300; s++) { const a = plan(g3, s, 'qua'); if (a) { dat++; assert.equal(a.cay, false); } }
assert.ok(dat > 60, 'bản đồ không có cây: trái rụng dưới đất');

// hái: lại gần thì vào túi, đủ trần ngày thì thôi, không hái lại món đã hái; sang ngày mới (giờ Việt Nam) thì hái tiếp được.
// Hạt cố định, đồng hồ giả bắt đầu 00:01 giờ Việt Nam: bài thử ra cùng một kết quả mọi lần chạy (bản đầu để hạt ngẫu nhiên và đồng hồ
// giả bắt đầu 15:00, hạt xui thì vòng lặp chạy qua nửa đêm, sổ ngày đặt lại, đếm ra 7–12 trái: trượt ngẫu nhiên cỡ 1/20 lần, 25/11/2026).
const h = mk(), slot = CD.slot_s * 1000, thuc = Date.now;
h.save.coDuyen = { ngay: 'x', n: {}, keys: [], hat: 'dddd' };
const NUA_DEM = Date.UTC(2027, 0, 14, 17, 0, 0);   // 00:00 ngày 15/01/2027 giờ Việt Nam
let gio = NUA_DEM + 60000; Date.now = () => gio;
const buoc = () => { gio += slot * 0.2; cdTick(h, 1); for (const q of h.coDuyen) if (q.loai === 'qua') { h.player.x = q.x; h.player.y = q.y + 10; } cdTick(h, 1); };
let du = 0;
while (gio < NUA_DEM + 23.5 * 3600e3) { buoc(); if (toasts.some(t => String(t).includes('cạn'))) du++; }   // trọn một ngày, 5 nhịp mỗi khung
const hai = h.save.mats['chu-qua'] || 0;
assert.equal(hai, CD.mon.qua.ngay, `một ngày hái tối đa ${CD.mon.qua.ngay} Chu Quả, đã hái ${hai}`);
assert.ok(du > 0, 'đủ trần thì báo cơ duyên đã cạn');
const keys = [...h.save.coDuyen.keys]; assert.equal(new Set(keys).size, keys.length, 'một món không ghi hai lần');
while (gio < NUA_DEM + 47.5 * 3600e3) buoc();   // ngày hôm sau: sổ ngày đặt lại, hái thêm đúng một ngày nữa
assert.equal(h.save.mats['chu-qua'], CD.mon.qua.ngay * 2, `sang ngày mới hái tiếp được ${CD.mon.qua.ngay} Chu Quả nữa, tổng đang là ${h.save.mats['chu-qua']}`);
Date.now = thuc;

// --- Tọa Vong Đan
const v = mk(); v.save.pills['toa-vong-dan'] = 3;
let m = uongToaVong(v, 'toa-vong-dan', pill.use, () => 0); assert.equal(toaVongCon(v), pill.use.toa_vong[0]); assert.equal(v.save.pills['toa-vong-dan'], 2); assert.ok(m.includes('giờ'));
m = uongToaVong(v, 'toa-vong-dan', pill.use, () => 0.999999); assert.ok(Math.abs(toaVongCon(v) - pill.use.toa_vong[0] - pill.use.toa_vong[1]) <= 1);
const F = config.meditate.farm_h[2] / 3600;
assert.ok(Math.abs(toaVongRate(v) - F * CD.toa_vong.k) < 1e-9, 'tốc tọa vong = k lần tốc chém quái');
assert.ok(Math.abs(medPerSec(v) - F * 1.5) < 1e-9 && medPerSec(v) > medCap(v) * 2.9, 'đang có dược lực: đả tọa nhanh bằng 1,5 lần chém quái (gấp 3 đả tọa thường)');
const truoc = toaVongCon(v); toaVongTick(v, 0.5); assert.ok(Math.abs(truoc - toaVongCon(v) - 0.5) < 1e-6, 'mỗi nhịp đả tọa trừ đúng số giây');
v.save.toaVong = 0.4; toaVongTick(v, 0.5); assert.equal(toaVongCon(v), 0); assert.ok(toasts.some(t => String(t).includes('tan hết')));
v.save.toaVong = CD.toa_vong.tran_s; const con = v.save.pills['toa-vong-dan']; uongToaVong(v, 'toa-vong-dan', pill.use); assert.equal(v.save.pills['toa-vong-dan'], con, 'quỹ đầy thì không mất viên');
assert.equal(gioPhut(9000), '2 giờ 30 phút'); assert.equal(gioPhut(7200), '2 giờ');

// --- sư đồ: số trong data khớp chữ người chơi đọc
const S = social.su_do;
assert.ok(S.text.luat.includes(`${S.cach} cảnh giới`) && S.text.luat.includes(`${S.toi_da} đồ đệ`) && S.text.luat.includes(`+${S.qi * 100}% linh khí`) && S.text.luat.includes(`+${S.lt * 100}% Linh Thạch`), 'chữ luật sư đồ lệch số');
console.log('co-duyen.test: đạt');
