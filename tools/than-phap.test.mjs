// Bài thử Thân pháp (docs/17-THAN-PHAP.md; tools/check.mjs gọi): dữ liệu đúng khuôn; mở thức, ô khảm, chuỗi nhát; mỗi thức chạy hết màn diễn trong một game giả,
// đếm đòn (móc game.tpTrung), tổng sát thương vào một con đúng số khai trong data; chuỗi 5 nhát không làm sát thương mỗi giây vào một con tăng quá tay
// (so với chém thường mãi); máy người xem không trúng quái; Thu Võng kéo quái thường, không kéo trùm / quái chung; đổi bản đồ giữa chừng thì thôi trúng;
// tiếng tp.* code gọi đều có thật; truyện dạy thức nào thì thức ấy có thật, cờ mở thức nào cũng có chỗ bật.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const read = f => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), 'utf8'));
const src = f => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
const { TP, tpThuc, tpO, tpDat, tpChuoi, tpNhat, tpTao, tpTick } = await import('../src/game/than-phap.js');
const { doiMoi } = await import('../src/game/doi-moi.js');

const D = { 'than-phap': read('than-phap'), realms: read('realms'), elements: read('elements'), heroes: read('heroes'), story: read('story'), 'ky-nang': read('ky-nang') };
const S = TP(D), T = read('tieng-chieu').sfx;

// ---- 1. dữ liệu
assert.equal(S.nhat.length, 5, 'chuỗi phải đủ năm nhát');
assert.deepEqual(S.nhat.slice(0, 3).map(n => n.id), ['chem', 'dam', 'xuyen'], 'ba nhát đầu: chém, đâm, xuyên (lời chủ dự án 22/11/2026 04:25)');
assert.deepEqual(S.nhat.slice(3).map(n => n.o), [0, 1], 'nhát 4, 5 là hai ô khảm');
for (const [id, d] of Object.entries(S.thuc)) {
  for (const k of ['ten', 'day', 'mo_ta', 'mul', 'cd', 'an']) assert.ok(d[k] != null && d[k] !== '', `thức ${id}: thiếu ${k}`);
  assert.ok(d.cd >= 0.9 && d.cd <= 1.6, `thức ${id}: cd ${d.cd} ngoài 0,9–1,6 giây`);
  assert.ok(d.an <= d.cd + 0.3, `thức ${id}: vũ khí đi làm thức (${d.an} giây) lâu hơn hẳn lúc tới nhát kế (${d.cd})`);
}
// cờ mở thức nào cũng có chỗ bật: kỹ năng theo truyện (data/ky-nang.json → hoc.*.co) hoặc lệnh than_phap trong truyện
const day = new Set(D.story.steps.flatMap(s => (s.do || []).filter(a => a.than_phap).map(a => a.than_phap)));
for (const id of day) assert.ok(S.thuc[id], `truyện dạy thức "${id}" không có trong data/than-phap.json`);
const coKn = new Set(Object.values(D['ky-nang'].hoc).map(h => h.co));
for (const [id, d] of Object.entries(S.thuc)) if (d.mo?.co) assert.ok(coKn.has(d.mo.co) || day.has(id), `thức ${id}: cờ mở "${d.mo.co}" không chỗ nào bật`);
// tiếng: mọi 'tp.xxx' trong code và trong truyện phải có ở data/tieng-chieu.json
const code = readdirSync(new URL('../src/game/', import.meta.url)).filter(f => f.startsWith('than-phap')).map(f => src('game/' + f)).join('\n') + JSON.stringify(D.story);
const ten = new Set([...code.matchAll(/'(tp\.[a-z_]+)'|"(tp\.[a-z_]+)"/g)].map(m => m[1] || m[2]));
assert.ok(ten.size >= 15, `chỉ thấy ${ten.size} tiếng tp.*`);
for (const n of ten) assert.ok(T[n], `tiếng "${n}" không có trong data/tieng-chieu.json (tools/sfx_chieu.py)`);

// ---- 2. mở thức, ô khảm, chuỗi
const game = (o = {}) => ({ data: D, save: { realm: 0, layer: 1, flags: {}, element: 'thuy', ...o }, persist() {}, toast() {}, sfx() {}, time: 0, mobs: [], map: { id: 'm' } });
let g = game();
assert.deepEqual(tpThuc(g), ['anh-kiem'], 'người mới: chỉ Vạn Ảnh');
assert.deepEqual(tpO(g), ['anh-kiem', null], 'người mới: ô nhát 5 chưa mở');
assert.deepEqual(tpChuoi(g), ['chem', 'dam', 'xuyen', 'anh-kiem'], 'người mới: chuỗi bốn nhát');
g = game({ flags: { 'kn-pha-van': true } });
assert.deepEqual(tpO(g), ['anh-kiem', 'khai-thien'], 'có thức thứ hai: ô nhát 5 mở và tự khảm');
assert.ok(tpDat(g, 0, 'khai-thien'));
assert.deepEqual(tpO(g), ['khai-thien', 'anh-kiem'], 'khảm thức đang ở ô kia: đổi chỗ hai ô');
assert.ok(!tpDat(g, 1, 'thu-vong'), 'thức chưa mở không khảm được');
g.save.tpO = ['huyen-vuc', 'huyen-vuc'];
assert.deepEqual(tpO(g), ['anh-kiem', 'khai-thien'], 'bản lưu sửa tay (thức chưa mở, trùng ô) không ăn');
g = game({ realm: 1, layer: 5 }); assert.ok(!tpThuc(g).includes('huyen-vuc'), 'Huyền Vực không tự mở ở Trúc Cơ tầng 5 nữa: Mặc Ảnh dạy (22/11/2026)');
g = game({ realm: 1, layer: 5, flags: { 'tp-huyen-vuc': true } }); assert.ok(tpThuc(g).includes('huyen-vuc'), 'Huyền Vực mở khi Mặc Ảnh dạy (cờ tp-huyen-vuc)');
{ const hv = game({ realm: 1, layer: 5 }); hv.data = { ...D, items: { bag: [] }, pets: { mounts: {} } }; doiMoi(hv); assert.ok(hv.save.flags['tp-huyen-vuc'], 'bản lưu đã tới Trúc Cơ tầng 5 trước đợt đổi: giữ Huyền Vực');
  const moi = game({ realm: 1, layer: 4 }); moi.data = hv.data; doiMoi(moi); assert.ok(!moi.save.flags['tp-huyen-vuc'] && moi.save.flags['tp-hv-xet'], 'chưa tới Trúc Cơ tầng 5: không được tặng, đánh dấu đã xét');
  moi.save.layer = 5; doiMoi(moi); assert.ok(!moi.save.flags['tp-huyen-vuc'], 'lên Trúc Cơ tầng 5 sau đợt đổi: phải theo truyện'); }
// nhịp chuỗi
g = game({ flags: { 'kn-pha-van': true } }); g.player = { x: 0, y: 0 };
const kiem = { attack: 'arc', cooldown: 0.62 }, cung = { attack: 'shot', cooldown: 0.8 };
const seq = []; for (let i = 0; i < 6; i++) { seq.push(tpNhat(g, kiem).id); g.time += 0.6; }
assert.deepEqual(seq, ['chem', 'dam', 'xuyen', 'anh-kiem', 'khai-thien', 'chem'], 'chuỗi nhát chạy vòng');
g.time += S.cua_so + 0.1; assert.equal(tpNhat(g, kiem).id, 'chem', 'ngưng tay quá cua_so giây: về nhát 1');
assert.equal(tpNhat(g, cung).ra, false, 'vũ khí bắn: nhát 2 vẫn bắn như thường');
g.player.riding = true; assert.equal(tpNhat(g, kiem), null, 'đang cưỡi: thú đánh, không có chuỗi');

// ---- 3. mỗi thức chạy trong game giả: đếm đòn vào từng con
function san(o = {}) {
  const G = game({ realm: 1, layer: 9, flags: Object.fromEntries(Object.values(S.thuc).filter(d => d.mo?.co).map(d => [d.mo.co, true])) });
  G.player = { x: 100, y: 100, face: { x: 1, y: 0 }, fw: { x: 100, y: 80, a: 0, trail: [] } };
  G.mobs = (o.mobs || [[150, 92]]).map(([x, y], i) => ({ id: 'q' + i, x, y, r: 6, dead: false, def: { ai: o.boss === i ? 'boss' : 'chase' }, qc: o.qc === i ? 7 : undefined }));
  G.map = { id: 'm', move(m, dx, dy) { m.x += dx; m.y += dy; } };
  G.screen = { shake() {} }; G.hit = []; G.hoSo = {};
  G.tpTrung = (game, m, dmg, opt) => G.hit.push([m.id, opt.k]);
  return G;
}
function chay(G, kind, own = true) {
  const I = tpTao(G, kind, G.player, {}, 0, own, { dmg: 1, R: 36, tg: G.mobs[0] });
  assert.ok(I, `${kind}: không dựng được màn diễn`);
  let t = 0;
  while (G.tpFx.length && t < 3) { tpTick(G, 1 / 60); G.time += 1 / 60; t += 1 / 60; }
  assert.ok(t < 2.2, `${kind}: màn diễn dài ${t.toFixed(2)} giây (quá 2,2)`);
  return G.hit.reduce((a, [id, k]) => ((a[id] = (a[id] || 0) + k), a), {});
}
// Tổng sát thương vào một con đứng trước mặt (lần nhát chém). Bách Thứ rải hai mươi nhát ngẫu nhiên trong nón nên số nhát trúng một con
// đổi theo hạt của màn diễn (một lần lẻ 1,6–1,9): lấy trung bình nhiều lần, và cố định Math.random cho bài thử lần nào cũng ra cùng số
// (22/11/2026: lấy một lần lẻ làm bài thử lúc đạt lúc trượt, CI main trượt ×1.02 ở cặp Bách Thứ + Thu Võng).
{ let h = 20261122; Math.random = () => (h = (h * 1103515245 + 12345) & 0x7fffffff) / 0x80000000; }
const MOT = {}, LAN = { 'bach-thu': 400 };
for (const kind of ['xuyen', ...Object.keys(S.thuc)]) {
  let tong = 0;
  for (let i = 0; i < (LAN[kind] || 1); i++) {
    const G = san(), q = chay(G, kind).q0 || 0;
    assert.ok(q > 0, `${kind}: không trúng con quái đứng ngay trước mặt`);
    tong += q;
  }
  MOT[kind] = tong / (LAN[kind] || 1);
}
// Số sát thương đổi màu theo nhát (23/11/2026, src/game/so-nay.js): mọi lần trúng của thức mang đúng nhát thứ mấy và cờ nhát cuối đã truyền vào.
// Bản đầu đặt hai giá trị ấy vào I.nhat / I.cuoi, trùng tên Bách Thứ đang dùng: số của Bách Thứ ở nhát 4 bung vàng như nhát cuối.
for (const kind of ['xuyen', ...Object.keys(S.thuc)]) for (const [i, cuoi] of [[3, false], [4, true]]) {
  const G = san(), ds = [];
  G.tpTrung = (game, m, dmg, opt) => ds.push(opt);
  tpTao(G, kind, G.player, {}, 0, true, { dmg: 1, R: 36, tg: G.mobs[0], nhat: i, cuoi });
  for (let t = 0; G.tpFx.length && t < 3; t += 1 / 60) { tpTick(G, 1 / 60); G.time += 1 / 60; }
  const sai = ds.find(o => o.nhat !== i || o.cuoi !== cuoi);
  assert.ok(ds.length && !sai, `${kind}: lần trúng mang nhát ${JSON.stringify(sai?.nhat)}, cuối ${JSON.stringify(sai?.cuoi)} (phải nhát ${i}, cuối ${cuoi})`);
}
const N = S.nhat[2], A = S.thuc;
const gan = (a, b, tol, ten) => assert.ok(Math.abs(a - b) <= tol, `${ten}: ${a.toFixed(2)} lần nhát chém, khai ${b.toFixed(2)}`);
gan(MOT.xuyen, N.lan * N.mul, 0.01, 'xuyên');
gan(MOT['anh-kiem'], A['anh-kiem'].n * A['anh-kiem'].mul, 0.01, 'Vạn Ảnh (một con: cả sáu bản sao vào nó)');
gan(MOT['khai-thien'], A['khai-thien'].mul, 0.01, 'Khai Thiên');
gan(MOT['thien-tran'], A['thien-tran'].mul, 0.01, 'Thiên Kiếm Trấn');
gan(MOT['thu-vong'], A['thu-vong'].mul + A['thu-vong'].lan2 + A['thu-vong'].keo, 0.01, 'Thu Võng');
gan(MOT['huyen-vuc'], A['huyen-vuc'].n * A['huyen-vuc'].mul, 0.01, 'Huyền Vực (một con: cả mười nhát vào nó)');
gan(MOT['quy-trung'], A['quy-trung'].vay + A['quy-trung'].dot * A['quy-trung'].mul + A['quy-trung'].cuoi, 0.01, 'Quy Trủng (vây + bốn đợt cắm + kiếm lớn nằm xuống)');
gan(MOT['bach-luyen'], A['bach-luyen'].mul + A['bach-luyen'].lan2 + A['bach-luyen'].cuoi, 0.01, 'Bách Luyện (ba nhát búa)');
assert.ok(MOT['bach-thu'] >= A['bach-thu'].cuoi + 0.5 && MOT['bach-thu'] <= A['bach-thu'].n * A['bach-thu'].mul + A['bach-thu'].cuoi + 0.01, `Bách Thứ: ${MOT['bach-thu'].toFixed(2)}`);
// Bách Thứ dồn trúng con đang khoá (chủ dự án chọn 22/11/2026 10:10): trung bình ít nhất 16/20 nhát vào nó dù đứng sát, đứng xa hay lệch hướng mặt
{ const B = A['bach-thu'], tb = (mob, lan = 200) => { let s = 0; for (let i = 0; i < lan; i++) s += chay(san({ mobs: [mob] }), 'bach-thu').q0 || 0; return s / lan; };
  for (const [mob, ten] of [[[150, 92], 'đứng sát'], [[185, 92], 'đứng xa'], [[140, 122], 'lệch hướng mặt']]) {
    const b = tb(mob); assert.ok(b >= B.cuoi + 16 * B.mul, `Bách Thứ ${ten}: trung bình ${b.toFixed(2)} lần nhát chém, dưới 16/20 nhát trúng con đang khoá`);
  } }
// Sát thương mỗi giây vào một con, cả vòng năm nhát so với chém thường mãi (vũ khí kiếm): thêm vừa phải, không lố
const DPS = [Infinity, 0];
for (const a of Object.keys(A)) for (const b of Object.keys(A)) {
  if (a === b) continue;
  const thoi = kiem.cooldown * 2 + N.cd + A[a].cd + A[b].cd, sat = 1 + S.nhat[1].mul + MOT.xuyen + MOT[a] + MOT[b], k = (sat / thoi) / (1 / kiem.cooldown);
  assert.ok(k > 1.02 && k < 1.32, `chuỗi chém-đâm-xuyên-${a}-${b}: sát thương mỗi giây ×${k.toFixed(3)} so với chém thường (cho phép 1,02–1,32)`);
  DPS[0] = Math.min(DPS[0], k); DPS[1] = Math.max(DPS[1], k);
}
// Hai thức Thiên Kim trúng cả đám quanh chỗ diễn, và kẻ đứng ngoài tầm lớn nhất thì không trúng
for (const kind of ['quy-trung', 'bach-luyen']) { const G = san({ mobs: [[150, 92], [170, 100], [140, 80], [162, 84], [330, 92]] }); const h = chay(G, kind); assert.ok(h.q0 && h.q1 && h.q2 && h.q3 && !h.q4, `${kind}: phải trúng bốn con quanh chỗ diễn và không trúng con ở xa (${JSON.stringify(h)})`); }
// Đám đông: Thiên Kiếm Trấn, Khai Thiên trúng cả đám
{ const G = san({ mobs: [[150, 92], [160, 100], [150, 108], [140, 98], [165, 90]] }); const h = chay(G, 'thien-tran'); assert.ok(Object.keys(h).length >= 4, `Thiên Kiếm Trấn chỉ trúng ${Object.keys(h).length}/5 con đứng sát nhau`); }
{ const G = san({ mobs: [[140, 92], [190, 100], [240, 90], [120, 110]] }); const h = chay(G, 'khai-thien'); assert.ok(Object.keys(h).length >= 4, `Khai Thiên chỉ trúng ${Object.keys(h).length}/4 con trên đường chém`); }
// Máy người xem: chỉ vẽ, không trúng
for (const kind of Object.keys(A)) { const G = san(); chay(G, kind, false); assert.equal(G.hit.length, 0, `${kind}: máy người xem lại trừ máu quái`); }
// Thu Võng kéo quái thường về phía người quăng, không kéo trùm, không kéo quái chung
{ const G = san({ mobs: [[180, 100], [182, 92], [178, 108]], boss: 1, qc: 2 }), x0 = G.mobs.map(m => m.x); chay(G, 'thu-vong');
  assert.ok(G.mobs[0].x < x0[0] - 20, `Thu Võng không kéo quái thường về (x ${x0[0]} → ${G.mobs[0].x.toFixed(0)})`);
  assert.equal(G.mobs[1].x, x0[1], 'Thu Võng kéo cả trùm'); assert.equal(G.mobs[2].x, x0[2], 'Thu Võng kéo cả quái chung (máy chủ phòng giữ chỗ quái chung)'); }
// Đổi bản đồ giữa chừng: thôi trúng
{ const G = san(), I = tpTao(G, 'thien-tran', G.player, {}, 0, true, { dmg: 1, R: 36 }); tpTick(G, 0.3); G.map = { id: 'khac', move() {} }; for (let i = 0; i < 120; i++) tpTick(G, 1 / 60);
  assert.equal(G.hit.length, 0, 'đổi bản đồ giữa thức mà vẫn trúng quái'); assert.ok(I && !G.tpFx.length, 'đổi bản đồ: màn diễn chưa dọn'); }

console.log(`✅ Thân pháp: ${Object.keys(A).length} thức, chuỗi ${S.nhat.length} nhát, một con: ${Object.entries(MOT).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', ')}; cả vòng so với chém thường ×${DPS[0].toFixed(2)}–${DPS[1].toFixed(2)}`);
