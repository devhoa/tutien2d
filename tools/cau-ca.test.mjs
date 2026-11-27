// Bài thử câu cá (chủ dự án 24/11/2026 00:38 – 01:2x; src/game/fishing.js, cau-*.js, data/fishing.json; tài liệu docs/18-CAU-CA.md):
// node tools/cau-ca.test.mjs (tools/check.mjs cũng gọi).
//   - dữ liệu: loài nào cũng có nguyên liệu đúng phẩm, nhóm, giá thu, câu được ở ít nhất một nơi; mồi, cần, món, châu đủ; món cho 1 000 – 20 000
//     linh khí (chủ dự án "linh khí tầm 1000 đến 20k"); quầy, Mua nhanh, migration máy chủ cùng một bảng giá; thôi bán cá ở Mua nhanh
//   - tỉ lệ: câu trần chỉ Phàm, Linh; mồi giun cần trúc hiếm Địa trở lên; Thượng Cổ chỉ cắn Long Tiên Hương; đồ xịn may hơn hẳn
//   - tiền: câu cá bán cho Lão Ngư Ông nhanh hơn hẳn đánh quái cùng cảnh giới (chủ dự án "nhanh gấp đôi hoặc gấp 3"), trần mỗi ngày giữ được
//   - nấu lấy loài nhiều con trước, phóng sinh tăng phúc có trần, bán khách rẻ trước và dừng ở trần ngày, giằng co khó dần theo phẩm
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const F = read('fishing.json'), cave = read('cave.json'), market = read('market.json'), items = read('items.json'), realms = read('realms.json'), weather = read('weather.json');
const maps = Object.fromEntries(readdirSync(new URL('../data/maps/', import.meta.url)).filter(f => f.endsWith('.json')).map(f => [f.slice(0, -5), 1]));
const M = cave.materials, data = { fishing: F, cave, items, realms, maps };
const { canNang, tiLePham, tungCa, tungCm, thoiGianCho } = await import('../src/game/cau-roll.js');
const { nau, nauDuoc, phongSinh, giaThu, tranNgay } = await import('../src/game/cau-mon.js');
const { gcMoi } = await import('../src/game/cau-gc.js');
const { tinhMay } = await import('../src/game/cau-npc.js');
const ph = id => M[id].pham;

// 1. dữ liệu
const NHOM = ['ca', 'tom', 'trai', 'bau'];
for (const [id, f] of Object.entries(F.fish)) {
  assert.ok(M[id], `${id}: thiếu nguyên liệu`);
  assert.ok(NHOM.includes(f.nhom), `${id}: nhóm sai`);
  assert.ok(!M[id].loai || M[id].loai === f.nhom, `${id}: loai trong cave.json khác nhóm`);
  assert.ok(f.w > 0 && f.cm[0] > 0 && f.cm[1] > f.cm[0], `${id}: w / cm sai`);
  for (const m of f.maps || []) assert.ok(maps[m], `${id}: bản đồ ${m} không có`);
  assert.ok(!f.season || weather.seasons.some(s => s.id === f.season), `${id}: mùa sai`);
  assert.ok(!f.moi || F.moi[f.moi], `${id}: mồi riêng không có`);
  if (f.nhom === 'trai') assert.ok(F.khai[id] && !F.ban.gia[id], `${id}: trai phải khai, không thu mua`);
  else assert.ok(F.ban.gia[id] > 0, `${id}: Lão Ngư Ông không thu`);
}
assert.ok(Object.keys(F.fish).length >= 60, 'ít nhất 60 loài câu được');
for (const n of NHOM) assert.ok(Object.values(F.fish).filter(f => f.nhom === n).length >= 5, `nhóm ${n}: quá ít loài`);
for (const [k, K] of Object.entries(F.khai)) if (k !== '_') {
  assert.equal(F.fish[k]?.nhom, 'trai', `khai.${k}: không phải trai`);
  for (const [ma, p, so] of K.chau) assert.ok(M[ma]?.loai === 'chau' && p > 0 && p <= 1 && so >= 1 && F.ban.gia[ma] > 0, `khai.${k}: châu ${ma} sai`);
  assert.ok(K.ngoc[0] >= 0 && K.ngoc[0] <= 1 && K.ngoc[1] >= 1 && K.ngoc[2] >= K.ngoc[1] && K.ngoc[2] <= items.gems.max_level, `khai.${k}: ngọc sai`);
}
for (const [id, m] of Object.entries(F.moi)) { assert.equal(M[id]?.loai, 'moi', `mồi ${id}: thiếu nguyên liệu`); assert.ok(m.gia > 0 && m.nhanh > 0 && m.may >= 1 && !F.ban.gia[id], `mồi ${id}: số sai`); }
for (const [id, c] of Object.entries(F.can)) {
  assert.equal(M[id]?.loai, 'can', `cần ${id}: thiếu nguyên liệu`);
  assert.ok(c.toi_da >= 2 && c.toi_da <= 6 && c.nhanh > 0 && c.may >= 1 && c.ben >= 1 && !F.ban.gia[id], `cần ${id}: số sai`);
  assert.ok(id === F.can_san ? c.gia === 0 : c.gia > 0, `cần ${id}: giá sai`);
}
const canDs = Object.values(F.can);
canDs.forEach((c, i) => i && assert.ok(c.gia > canDs[i - 1].gia && c.may >= canDs[i - 1].may && c.nhanh <= canDs[i - 1].nhanh && c.toi_da >= canDs[i - 1].toi_da, 'cần đắt hơn phải tốt hơn'));
for (const [id, m] of Object.entries(F.mon)) {
  const P = cave.pills[id];
  assert.ok(P?.mon && !P.recipe && P.pham === m.pham, `món ${id}: thiếu đan hoặc phẩm lệch`);
  assert.ok(P.use.qi >= 1000 && P.use.qi <= 20000, `món ${id}: linh khí ngoài 1 000 – 20 000 (chủ dự án)`);
  assert.ok(m.can >= 1, `món ${id}: số thủy sản sai`);
}
assert.deepEqual(Object.values(F.mon).map(m => m.pham), [0, 1, 2, 3, 4, 5, 6], 'mỗi phẩm một món');
const Q = market.quick.price;
for (const id of Object.keys(F.fish)) assert.ok(!Q[id], `Mua nhanh còn bán ${id} (chủ dự án chọn "Thôi bán cá")`);
for (const x of F.shop) {
  const g = (F.moi[x.ref] || F.can[x.ref]).gia;
  assert.equal(x.price, g * x.n, `quầy ${x.ref}: giá khác ${g} × ${x.n}`);
  assert.equal(Q[x.ref], g, `Mua nhanh ${x.ref}: giá khác quầy (máy chủ p2d_nl_mua dùng bảng này)`);
}
assert.equal(F.ban.tran.length, realms.names.length, 'trần thu mua mỗi cảnh giới một số');
F.ban.tran.forEach((t, i) => i && assert.ok(t > F.ban.tran[i - 1], 'trần thu mua tăng theo cảnh giới'));
// migration máy chủ cùng bảng giá (tools/cau-ca-sql.py)
const sql = readFileSync(new URL('../supabase/migrations/20261124030000_p2d_cau_ca.sql', import.meta.url), 'utf8');
const cfgs = [...sql.matchAll(/v_cfg jsonb := '(\{.*?\})'::jsonb/g)].map(m => JSON.parse(m[1].replace(/''/g, "'")));
assert.equal(cfgs.length, 2, 'migration phải có hai bảng (p2d_nl_mua, p2d_cau_doi)');
assert.deepEqual(cfgs[0].gia, Q, 'p2d_nl_mua lệch data/market.json → quick.price: chạy lại python3 tools/cau-ca-sql.py');
assert.deepEqual({ k: cfgs[1].k, gia: cfgs[1].gia, tran: cfgs[1].tran }, { k: F.ban.k, gia: F.ban.gia, tran: F.ban.tran }, 'p2d_cau_doi lệch data/fishing.json → ban: chạy lại python3 tools/cau-ca-sql.py');
assert.deepEqual(cfgs[1].ngoc, Object.keys(items.gems.types), 'p2d_cau_doi: loại ngọc lệch data/items.json');

// 2. tỉ lệ
const ctx = o => ({ realm: 3, map: 'thien-kiem-phong', noi: 'nuoc', night: false, rain: false, season: 'dong', moi: null, can: 'truc-can', ...o });
const tran = tiLePham(data, ctx());
assert.ok(tran.slice(2).every(x => x === 0), 'câu trần chỉ ra Phàm, Linh');
const re = tiLePham(data, ctx({ moi: 'giun-dat' }));
assert.ok(re[2] > 0.01 && re[2] < 0.04 && re[3] < 0.002 && re[4] < 0.0003 && re[6] === 0, `giun + trúc: Huyền ${re[2]}, Địa ${re[3]}, Thiên ${re[4]}`);
const xin = tiLePham(data, ctx({ moi: 'long-tien', can: 'dinh-hai-can', night: true, rain: true }));
assert.ok(xin[3] > re[3] * 10 && xin[4] > re[4] * 20 && xin[6] > 0 && xin[6] < 0.001, `long tiên + định hải đêm mưa: Địa ${xin[3]}, Thiên ${xin[4]}, Thượng Cổ ${xin[6]}`);
for (const moi of Object.keys(F.moi)) if (moi !== 'long-tien') assert.equal(tiLePham(data, ctx({ moi, can: 'dinh-hai-can', night: true, rain: true }))[6], 0, `Thượng Cổ cắn mồi ${moi}`);
// loài nào cũng có chỗ, lúc, mồi câu được
const MAPS = [...new Set(Object.values(F.fish).flatMap(f => f.maps || []).concat('thien-kiem-phong', 'dao-moc'))];
const gap = new Set();
for (const map of MAPS) for (const noi of ['nuoc', 'hai']) for (const night of [false, true]) for (const rain of [false, true]) for (const season of weather.seasons.map(s => s.id))
  for (const moi of [null, ...Object.keys(F.moi)]) for (const [id] of canNang(data, ctx({ realm: 8, map, noi, night, rain, season, moi, can: 'dinh-hai-can' }))) gap.add(id);
for (const id of Object.keys(F.fish)) assert.ok(gap.has(id), `${id}: không câu được ở đâu cả`);
// tung thật ra đúng phân bố (hạt cố định)
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const dem = [0, 0, 0, 0, 0, 0, 0];
for (let i = 0; i < 20000; i++) dem[ph(tungCa(data, ctx({ moi: 'giun-dat' }), rnd))]++;
assert.ok(Math.abs(dem[0] / 20000 - re[0]) < 0.01 && Math.abs(dem[2] / 20000 - re[2]) < 0.006, 'tung loài lệch bảng tỉ lệ');
for (let i = 0; i < 200; i++) { const id = 'kiem-ngu', cm = tungCm(data, id, rnd), [a, b] = F.fish[id].cm; assert.ok(cm >= a && cm <= b * 1.25 + 0.1, `cỡ ${cm} ngoài ${a}–${b}`); }
assert.ok(thoiGianCho(data, ctx({ moi: 'long-tien', can: 'dinh-hai-can' }), () => 0.5) < thoiGianCho(data, ctx({}), () => 0.5) / 2, 'đồ xịn phải cắn nhanh hơn hẳn');

// 3. tiền: Linh Thạch mỗi giờ (trừ mồi) so với đánh quái (thùng Linh Thạch máy chủ 6 × 1,6^cảnh giới mỗi giây là mức đánh quái hợp lệ)
function moiGio(o, realm) {
  const c = ctx(o), ds = canNang(data, c), tong = ds.reduce((a, [, w]) => a + w, 0), can = F.can[c.can], moi = F.moi[c.moi];
  let ev = 0;
  for (const [id, w] of ds) if (ph(id) <= can.toi_da) ev += w / tong * (F.ban.gia[id] || 0) * (ph(id) >= F.gc.tu ? 0.85 : 1) * (1 + can.doi);
  const vong = 0.5 + (F.wait[0] + F.wait[1]) / 2 * can.nhanh * (moi ? moi.nhanh : F.khong_moi_cham) + 0.45 + F.bay.t + 0.3, lan = 3600 / vong;
  return ev * lan * Math.pow(F.ban.k, realm) - (moi ? moi.gia * lan : 0);
}
const quai = r => 6 * Math.pow(1.6, r) * 3600;
assert.ok(moiGio({ moi: 'giun-dat' }, 2) > quai(2), `giun + trúc ở Kim Đan: ${Math.round(moiGio({ moi: 'giun-dat' }, 2))} Linh Thạch mỗi giờ, phải hơn đánh quái ${quai(2)}`);
const vua = moiGio({ moi: 'da-quang', can: 'han-thiet-can', night: true }, 2);
assert.ok(vua > 2 * quai(2) && vua < 6 * quai(2), `dạ quang + hàn thiết ban đêm ở Kim Đan: ${Math.round(vua)} Linh Thạch mỗi giờ (đánh quái ${quai(2)})`);
for (let r = 0; r < F.ban.tran.length; r++) assert.ok(F.ban.tran[r] >= 2 * quai(r) && F.ban.tran[r] <= 20 * quai(r), `trần thu mua cảnh giới ${r}: ${F.ban.tran[r]}`);

// 4. nấu, phóng sinh, bán khách, giằng co
const game = (save = {}) => ({ data, save: { realm: 2, mats: {}, pills: {}, gems: {}, ...save }, persist() {}, sfx() {} });
const g1 = game({ mats: { 'linh-ngu': 7, 'ngan-ty-ngu': 12, 'ha-tom': 2, 'trai-song': 4 } });
assert.equal(nauDuoc(g1, 'ca-nuong'), 2, 'trai không phải thủy sản nấu được');
assert.equal(nau(g1, 'ca-nuong', 5), 2);
assert.equal(g1.save.pills['ca-nuong'], 2);
assert.deepEqual([g1.save.mats['ngan-ty-ngu'], g1.save.mats['linh-ngu'], g1.save.mats['ha-tom'], g1.save.mats['trai-song']], [0, 0, 1, 4], 'nấu lấy loài nhiều con trước');
const g2 = game({ mats: { 'kim-ly': 30 }, cau: { phuc: 0 } });
let tong = 0; for (let i = 0; i < 30; i++) tong += phongSinh(g2, 'kim-ly');
assert.equal(g2.save.cau.phuc, F.phuc.max, 'phúc duyên có trần');
assert.ok(tong >= F.phuc.max && g2.save.mats['kim-ly'] > 0, 'đầy phúc thì thôi phóng sinh');
assert.equal(giaThu(game({ realm: 0 }), 'linh-ngu'), F.ban.gia['linh-ngu']);
assert.equal(giaThu(game({ realm: 3 }), 'linh-ngu'), Math.round(F.ban.gia['linh-ngu'] * F.ban.k ** 3));
const g3 = game({ realm: 0, mats: { 'linh-ngu': 100000, 'kim-ly': 50, 'trai-song': 9 } });
const r3 = tinhMay(g3, { 'kim-ly': 50, 'linh-ngu': 100000 }, {});
assert.ok(r3.them.coins <= tranNgay(g3) && r3.them.coins > tranNgay(g3) * 0.9, 'bán khách dừng ở trần ngày');
assert.ok(r3.tru.mats['linh-ngu'] > 0, 'bán rẻ trước');
assert.ok(!tinhMay(g3, { 'trai-song': 9 }, {}).tru.mats['trai-song'], 'trai không bán, chỉ khai');
const g4 = game({ realm: 0, mats: { 'co-bang': 50 } }), r4 = tinhMay(g4, {}, { 'co-bang': 50 });
assert.equal(r4.tru.mats['co-bang'], 50);
assert.ok(Object.keys(r4.them.gems).length && r4.them.mats['tran-chau'] >= 150, 'khai Cổ Bạng ra châu và ngọc');
const gc = p => gcMoi(game(), p, F.can['han-thiet-can']);
assert.ok(gc(3).w > gc(4).w && gc(4).toc < gc(6).toc && gc(6).can > gc(3).can, 'giằng co khó dần theo phẩm');
assert.ok(gcMoi(game(), 4, F.can['dinh-hai-can']).w > gc(4).w, 'cần xịn vùng sáng rộng hơn');
console.log(`✅ câu cá: ${Object.keys(F.fish).length} loài, giun + trúc Huyền ${(re[2] * 100).toFixed(1)}% Địa ${(re[3] * 100).toFixed(2)}%; Kim Đan dạ quang + hàn thiết ${Math.round(vua / 1000)} nghìn Linh Thạch mỗi giờ (đánh quái ${Math.round(quai(2) / 1000)} nghìn)`);
