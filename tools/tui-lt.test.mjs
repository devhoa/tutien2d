// Bài thử túi Linh Thạch phía máy khách (src/game/tui-lt.js, vẽ ở src/render/draw-loot.js; chủ dự án 22/11/2026 11:4x, 16:14: ma chết thì Linh Thạch
// rơi xuống đất, ai nhặt được là của người đó; màu "Năm màu như triệu hồi"). Không cần trình duyệt. Chạy: node tools/tui-lt.test.mjs (check.mjs gọi)
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const data = {};
for (const f of readdirSync(new URL('../data/', import.meta.url))) if (f.endsWith('.json')) data[f.slice(0, -5)] = JSON.parse(readFileSync(new URL('../data/' + f, import.meta.url), 'utf8'));
let NOW = 1e12; Date.now = () => NOW;
const hen = []; globalThis.setTimeout = f => { hen.push(f); return hen.length; };
const { tuiBac, tuiTick, tuiTin, tuiMoi, R_NHAT, LAI_MS } = await import('../src/game/tui-lt.js');
const cho = () => new Promise(r => setImmediate(r));

// 1. Màu theo năm bậc Linh Thạch của triệu hồi: dưới 100 nghìn là Thường (xám), 100 nghìn Khá, 200 nghìn Hiếm, 500 nghìn Cực hiếm, từ 1 triệu Truyền thuyết
{
  const B = data['he-thong'].bac.list;
  for (const [so, b] of [[1, 0], [800, 0], [99999, 0], [100000, 1], [199999, 1], [200000, 2], [500000, 3], [999999, 3], [1000000, 4], [2000000, 4], [9e9, 4]]) {
    const r = tuiBac(data, so);
    assert.ok(r.b === b && r.color === B[b].color, `${so} Linh Thạch ra bậc ${r.b} (${r.color}), phải bậc ${b} (${B[b].color})`);
  }
  for (const q of data['he-thong'].pool.filter(q => q.coins)) assert.equal(tuiBac(data, q.coins).b, q.b, `quà triệu hồi ${q.id} bậc ${q.b} mà túi cùng số ra bậc khác`);
}

function moi(map = 'thien-kiem-phong') {
  const g = { data, map: { id: map }, player: { x: 1000, y: 1000, hp: 100 }, chu: [], so: [], tieng: [], gui: [], nhanThu: 0,
    toast(t) { this.chu.push(t); }, number(x, y, t, c) { this.so.push([t, c]); }, sfx(n) { this.tieng.push(n); },
    online: { ltNhat(id) { g.gui.push(id); return true; }, ltMoi() { g.moi = (g.moi || 0) + 1; } },
    tuiNhanThu: async () => { g.nhanThu++; return []; } };
  return g;
}
const hoi = [];
const xem = ds => async map => { hoi.push(map); return ds; };

// 2. Vào tinh cầu: hỏi danh sách một lần, bỏ dòng hỏng, gắn màu
{
  const g = moi(), ds = [{ id: 1, x: 1010, y: 1000, so: 3800 }, { id: 2, x: 2000, y: 1000, so: 250000 }, { id: 3, x: 'x', y: 1, so: 5 }, { id: 4, x: 1, y: 1, so: 0 }];
  tuiTick(g, xem(ds)); tuiTick(g, xem(ds));
  await cho();
  assert.deepEqual(hoi, ['thien-kiem-phong'], 'vào tinh cầu phải hỏi đúng một lần');
  assert.deepEqual(g.tui.ds.map(t => [t.id, t.b]), [[1, 0], [2, 2]], 'danh sách túi sai: ' + JSON.stringify(g.tui.ds));
  // 3. đứng trong R_NHAT thì gửi nhặt (túi 1 cách 10), túi xa thì không; chưa đủ LAI_MS thì không gửi lại; gục / đang là hồn thì không nhặt
  tuiTick(g); assert.deepEqual(g.gui, [1]);
  tuiTick(g); assert.deepEqual(g.gui, [1], 'gửi nhặt dồn');
  NOW += LAI_MS + 1; tuiTick(g); assert.deepEqual(g.gui, [1, 1], 'phòng chưa trả lời mà không gửi lại');
  NOW += LAI_MS + 1; g.player.hp = 0; tuiTick(g); g.player.hp = 100; g.ghost = {}; tuiTick(g); delete g.ghost;
  assert.deepEqual(g.gui, [1, 1], 'gục / đang là hồn mà vẫn nhặt');
  g.player.x = 1010 + R_NHAT + 1; NOW += LAI_MS + 1; tuiTick(g);
  assert.deepEqual(g.gui, [1, 1], 'ngoài tầm nhặt mà vẫn gửi');
  // 4. nhặt được: bỏ túi, số bay lên, chữ báo, nhận Hòm thư ngay
  tuiTin(g, { t: 'ltn', id: 1, so: 3800 });
  assert.ok(!g.tui.ds.some(t => t.id === 1) && g.so.length === 1 && g.so[0][0].includes('3.800') && g.chu.at(-1).includes('3.800') && g.nhanThu === 1 && g.tieng.includes('pickup'),
    'nhặt được mà thiếu: ' + JSON.stringify({ so: g.so, chu: g.chu, thu: g.nhanThu }));
  // 5. người khác nhặt / túi hết thì bỏ; báo "xa" thì giữ
  tuiTin(g, { t: 'ltx', id: 2, e: 'xa' }); assert.ok(g.tui.ds.some(t => t.id === 2), 'báo xa mà bỏ túi');
  tuiTin(g, { t: 'ltx', id: 2, e: 'het' }); assert.ok(!g.tui.ds.some(t => t.id === 2), 'túi đã hết mà còn vẽ');
  g.tui.ds.push({ id: 9, x: 1, y: 1, so: 5, b: 0 }); tuiTin(g, { t: 'lt-', id: 9, by: 'X', so: 5 });
  assert.equal(g.tui.ds.length, 0, 'người khác nhặt mà túi còn');
  assert.equal(g.so.length, 1, 'người khác nhặt mà máy mình hiện số');
  // 6. phòng báo túi mới: hỏi lại sau một quãng ngẫu nhiên (không hỏi ngay), giữ dấu đã gửi nhặt của túi cũ
  g.tui.ds.push({ id: 7, x: 3000, y: 3000, so: 10, b: 0, thu: NOW });
  tuiTin(g, { t: 'ltm' }); tuiTick(g, xem([{ id: 7, x: 3000, y: 3000, so: 10 }, { id: 8, x: 5, y: 5, so: 1200000 }]));
  assert.equal(hoi.length, 1, 'túi mới: hỏi ngay, cả phòng sẽ hỏi cùng lúc');
  NOW += 1600; tuiTick(g, xem([{ id: 7, x: 3000, y: 3000, so: 10 }, { id: 8, x: 5, y: 5, so: 1200000 }]));
  await cho();
  assert.equal(hoi.length, 2, 'túi mới mà không hỏi lại');
  assert.deepEqual(g.tui.ds.map(t => [t.id, t.b]), [[7, 0], [8, 4]]);
  assert.ok(g.tui.ds[0].thu > 0, 'hỏi lại làm mất dấu đã gửi nhặt');
}
// 7. Đổi tinh cầu: bỏ túi tinh cầu cũ, hỏi tinh cầu mới; trả lời của tinh cầu cũ tới muộn thì bỏ
{
  const g = moi(); let tra;
  tuiTick(g, () => new Promise(r => { tra = r; }));
  g.map = { id: 'dao-xich-dien' }; tuiTick(g, xem([]));
  tra([{ id: 1, x: 1, y: 1, so: 5 }]); await cho();
  assert.ok(g.tui.map === 'dao-xich-dien' && !g.tui.ds.length, 'túi của tinh cầu cũ lọt sang tinh cầu mới');
}
// 8. Máy mình vừa trả nợ ra túi: đúng tinh cầu thì hiện ngay và báo phòng; khác tinh cầu, trùng, hỏng thì thôi
{
  const g = moi(); tuiTick(g, xem([])); await cho();
  tuiMoi(g, { id: 11, map: 'thien-kiem-phong', x: 5, y: 6, so: 600000 });
  tuiMoi(g, { id: 11, map: 'thien-kiem-phong', x: 5, y: 6, so: 600000 });
  tuiMoi(g, { id: 12, map: 'dao-xich-dien', x: 5, y: 6, so: 1 });
  tuiMoi(g, { id: 'x', map: 'thien-kiem-phong', x: 5, y: 6, so: 1 });
  assert.deepEqual(g.tui.ds.map(t => [t.id, t.b]), [[11, 3]]);
  assert.equal(g.moi, 1, 'túi mới phải báo phòng đúng một lần');
  // trả nợ ra túi khi chưa từng hỏi danh sách tinh cầu: hiện ngay, khung sau vẫn hỏi để thấy túi khác
  const h = moi(); h.map = { id: 'dao-xich-dien' }; const n0 = hoi.length;
  tuiMoi(h, { id: 21, map: 'dao-xich-dien', x: 1, y: 1, so: 50 });
  tuiTick(h, xem([{ id: 21, x: 1, y: 1, so: 50 }, { id: 22, x: 9, y: 9, so: 60 }])); await cho();
  assert.ok(hoi.length === n0 + 1 && h.tui.ds.length === 2, 'túi đầu tiên làm máy bỏ hỏi danh sách tinh cầu');
}
// 9. Trả lời tới muộn: túi mình thêm trong lúc chờ không mất, túi đã biết là hết không sống lại, có tin túi mới lúc đang hỏi thì hỏi thêm lần nữa
{
  const g = moi(); let tra;
  tuiTick(g, () => new Promise(r => { tra = r; }));
  NOW += 10; tuiMoi(g, { id: 31, map: 'thien-kiem-phong', x: 1, y: 1, so: 5 });
  tuiTin(g, { t: 'lt-', id: 32 });
  tuiTin(g, { t: 'ltm' }); NOW += 2000; tuiTick(g, xem([]));
  tra([{ id: 32, x: 2, y: 2, so: 7 }, { id: 33, x: 3, y: 3, so: 8 }]); await cho();
  assert.deepEqual(g.tui.ds.map(t => t.id).sort(), [31, 33], 'trả lời muộn đè mất túi mới hoặc làm túi đã hết sống lại: ' + JSON.stringify(g.tui.ds.map(t => t.id)));
  const n0 = hoi.length; NOW += 600; tuiTick(g, xem([{ id: 31, x: 1, y: 1, so: 5 }, { id: 33, x: 3, y: 3, so: 8 }, { id: 34, x: 4, y: 4, so: 9 }])); await cho();
  assert.ok(hoi.length === n0 + 1 && g.tui.ds.some(t => t.id === 34), 'tin túi mới tới lúc đang hỏi dở mà không hỏi lại');
}
// 10. Nối dây: vẽ túi trong draw-loot.js, thư nhặt túi không hiện kép (market.js), chữ và nhãn thư có đủ, có bản dịch
{
  const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
  assert.ok(/drawTui\(ctx, game, t, C\);/.test(src('src/render/draw-loot.js')), 'draw-loot.js không vẽ túi');
  assert.ok(/m\.ly_do !== 'lt_nhat'/.test(src('src/game/market.js')), 'thư nhặt túi hiện kép (market.js chuyển cho chienLoi)');
  const T = data.pvp.text;
  for (const k of ['lt_nhat', 'lt_roi_dat', 'ma_lost_dat', 'thien_phat_guc']) assert.ok(T[k], 'thiếu chữ ' + k);
  assert.ok(data.pvp.mail.lt_nhat, 'thiếu nhãn thư lt_nhat');
  const en = JSON.parse(src('data/i18n/en.json')), zh = JSON.parse(src('data/i18n/zh-Hant.json'));
  for (const v of [T.lt_nhat, T.lt_roi_dat, T.ma_lost_dat, T.thien_phat_guc, data.pvp.mail.lt_nhat]) assert.ok(en[v] && zh[v], 'thiếu bản dịch: ' + v);
}
console.log('✅ Túi Linh Thạch (máy khách): năm màu như triệu hồi, nhặt khi chạy qua, nhận thư ngay, hỏi lại khi có túi mới');
