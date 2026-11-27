// Bài thử thiên phạt và túi Linh Thạch ở máy chủ phòng (cloud/src/thien-phat.js, tui.js, ma.js maTp; chủ dự án 22/11/2026 11:4x, 16:14).
// Đồng hồ giả có hẹn giờ thật theo mốc (bài pvp.test xả mọi hẹn giờ cùng lúc nên không thử được nhịp 10 giây). Chạy: node tools/cloud/thien-phat.test.mjs
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { chepCloud, GOC_CLOUD as root } from './nap.mjs';

const dir = chepCloud('tp-');
globalThis.WebSocketRequestResponsePair = class { constructor(a, b) { this.a = a; this.b = b; } };
class FakeWS {
  constructor() { this.readyState = 1; this.out = []; this.att = null; }
  send(s) { if (this.readyState !== 1) throw new Error('closed'); this.out.push(JSON.parse(s)); }
  close(code) { this.readyState = 3; this.closed = code; }
  accept() {}
  serializeAttachment(a) { this.att = structuredClone(a); }
  deserializeAttachment() { return this.att ? structuredClone(this.att) : null; }
}
globalThis.WebSocketPair = class { constructor() { this[0] = new FakeWS(); this[1] = new FakeWS(); } };
globalThis.Response = class { constructor(body, init) { this.status = init?.status; this.webSocket = init?.webSocket; } };
let T = 1e12, seq = 0;
const hen = [];
Date.now = () => T;
globalThis.setTimeout = (f, ms = 0) => { const id = ++seq; hen.push({ id, at: T + Math.max(0, ms), f }); return id; };
globalThis.clearTimeout = id => { const i = hen.findIndex(h => h.id === id); if (i >= 0) hen.splice(i, 1); };
// chạy đồng hồ tới T + ms, gọi hẹn giờ tới hạn đúng thứ tự (kể cả hẹn giờ mới đặt trong lúc chạy)
async function chay(ms) {
  const den = T + ms;
  for (;;) {
    hen.sort((a, b) => a.at - b.at);
    const h = hen[0];
    if (!h || h.at > den) break;
    hen.shift(); T = Math.max(T, h.at);
    await h.f();
    await new Promise(r => setImmediate(r));
  }
  T = den;
}

const { Phong } = await import(join(dir, 'phong.js'));
const C = await import(join(dir, 'mang-cfg.js'));
const PV = JSON.parse(readFileSync(resolve(root, '../../data/pvp.json'), 'utf8'));
assert.deepEqual(C.PVP.ma.tp, PV.server.ma.tp, 'mang-cfg.js lệch data/pvp.json server.ma.tp');
const TK = C.PVP.safe.map, CK = C.PVP.ma.tp.chu_ky * 1000, DAO = C.PVP.ma.tp.dao;
assert.ok(CK === 10000 && DAO === 3, 'thiên phạt: 10 giây một đạo, đạo thứ ba gục (lời chủ dự án 11:4x, chọn 16:14)');

function phongMoi(map = TK) {
  const ctx = { list: [], setWebSocketAutoResponse() {}, acceptWebSocket(ws, tags) { ws.tags = tags; this.list.push(ws); },
    getWebSockets(tag) { return this.list.filter(w => w.readyState === 1 && (!tag || w.tags?.includes(tag))); },
    storage: { getAlarm: async () => null, setAlarm: async () => {} } };
  const maDb = new Map(), maEv = [], lt = [], st = { ltTra: { so: 1234, id: 5 } }, pks = new Map();
  const env = { MANG: { idFromName: () => 'id', get: () => ({
    pvp: async () => true,
    pkGet: async u => pks.get(u) || { off: false, immune: 0, at: 0, ma: 0 },
    pkSet: async (u, off, immune, at, ma) => { pks.set(u, { off, immune, at, ma: typeof ma === 'number' ? ma : pks.get(u)?.ma || 0 }); },
    ma: async (e, ke, nan, noi, m, p) => {
      maEv.push([e, ke, nan, noi, m, p]);
      if (e === 'hoa') { maDb.set(ke, Math.max(maDb.get(ke) || 0, 1)); return { ma: maDb.get(ke) }; }
      const ai = e === 'tp' ? ke : nan, n = Math.max(0, (maDb.get(ai) || 0) - 1); maDb.set(ai, n);
      return e === 'tp' ? { ma: n, no: true } : { ma: n, cd: 1, no: true };
    },
    ltNhat: async (u, id, m, x, y) => { lt.push([u, id, m, x, y]); return st.ltTra; } }) } };
  let r = new Phong(ctx, env);
  const hh = (uid, pw, tl = 20) => new Map([['x-uid', uid], ['x-kind', 'dao'], ['x-cap', '40'], ['x-map', map], ['x-name', encodeURIComponent('N' + uid)], ['x-power', String(pw)], ['x-co', '0'], ['x-tl', String(tl)]]);
  const vao = async (uid, pw = 1000) => { await r.fetch({ headers: hh(uid, pw) }); return ctx.list.at(-1); };
  const gui = (w, o) => r.webSocketMessage(w, JSON.stringify(o));
  return { get r() { return r; }, ctx, maDb, maEv, lt, st, pks, vao, gui, ngu() { for (const h of [...hen]) clearTimeout(h.id); r = new Phong(ctx, env); } };
}
const tin = (w, t) => w.out.filter(o => o.t === t);

// 1. Ma ở Thiên Kiếm Tinh: đạo 1, 2 ở giây 10, 20 phát cho cả phòng; giây 30 gục: báo lõi Mang 'tp' kèm chỗ gục, cả phòng nhận 'pd' k 'tp'
{
  const { maDb, maEv, vao, gui, pks } = phongMoi();
  maDb.set('ma1', 3); pks.set('ma1', { off: true, immune: 0, at: 0, ma: 3 });
  const nhin = await vao('xem1'), m1 = await vao('ma1');
  await gui(m1, { t: 'm', x: 900, y: 1500, fx: 1, fy: 0 });
  await chay(CK - 100);
  assert.equal(tin(nhin, 'tp').length, 0, 'chưa đủ 10 giây đã giáng');
  await chay(200);
  assert.deepEqual(tin(nhin, 'tp'), [{ t: 'tp', id: 'ma1', n: 1 }]);
  assert.deepEqual(tin(m1, 'tp'), [{ t: 'tp', id: 'ma1', n: 1 }], 'máy của ma phải nhận đạo của mình để tự trừ máu');
  await chay(CK);
  assert.deepEqual(tin(nhin, 'tp').map(o => o.n), [1, 2]);
  assert.equal(tin(nhin, 'pd').length, 0, 'đạo hai đã gục');
  await chay(CK);
  const pd = tin(nhin, 'pd');
  assert.equal(pd.length, 1, 'đạo thứ ba phải gục');
  assert.deepEqual({ ...pd[0] }, { t: 'pd', from: '', to: 'ma1', n: 0, by: '', loot: 1, k: 'tp', ma: 2 });
  const tpEv = maEv.filter(e => e[0] === 'tp');
  assert.equal(tpEv.length, 1, 'lõi Mang phải nhận đúng một lần gục vì thiên phạt');
  assert.deepEqual(tpEv[0].slice(0, 5), ['tp', 'ma1', null, 'thuong', TK]);
  const p = tpEv[0][5];
  assert.ok(p && p[0] === 900 && p[1] === 1500, 'chỗ gục gửi lõi Mang phải là chỗ ma đứng');
  const a = m1.deserializeAttachment();
  assert.ok(!a.tpAt && a.immune > T, 'gục rồi phải thôi đếm và được miễn');
  assert.equal(tin(nhin, 'tp').length, 2, 'đạo thứ ba không phát thành tin tp (đã là tin gục)');
  // 2. vừa hồi sinh (miễn 10 giây) vẫn ở đây, máy vẫn gửi vị trí trong lúc miễn: hết miễn mới đếm lại từ đầu
  await chay(1000); await gui(m1, { t: 'm', x: 905, y: 1500 });
  await chay(C.PVP.immune_s * 1000 + CK - 1500);
  assert.equal(tin(nhin, 'tp').length, 2, 'đang miễn mà vẫn giáng');
  await chay(1000);
  assert.deepEqual(tin(nhin, 'tp').at(-1), { t: 'tp', id: 'ma1', n: 1 }, 'hết miễn phải đếm lại từ đạo một');
  // 3. rời phòng: thôi giáng, không lỗi
  const truoc = tin(nhin, 'tp').length + tin(nhin, 'pd').length;
  m1.close(1000);
  await chay(CK * 4);
  assert.equal(tin(nhin, 'tp').length + tin(nhin, 'pd').length, truoc, 'ma đã đi mà vẫn bị giáng');
}
// 4. Người thường ở Thiên Kiếm Tinh, ma ở tinh cầu khác: không bị
{
  const { vao, gui } = phongMoi();
  const ng = await vao('ng1'); await gui(ng, { t: 'm', x: 1, y: 1 });
  await chay(CK * 4);
  assert.equal(tin(ng, 'tp').length + tin(ng, 'pd').length, 0, 'người thường bị thiên phạt');
  const b = phongMoi('dao-xich-dien');
  b.maDb.set('ma2', 2); b.pks.set('ma2', { off: true, immune: 0, at: 0, ma: 2 });
  const m2 = await b.vao('ma2'); await b.gui(m2, { t: 'm', x: 1, y: 1 });
  await chay(CK * 4);
  assert.equal(tin(m2, 'tp').length + tin(m2, 'pd').length, 0, 'ma ở tinh cầu khác bị thiên phạt');
}
// 5. Hóa ma ngay trên Thiên Kiếm Tinh: đếm từ lúc hóa ma; ma hết điểm ở đạo cuối thì khiên bật lại, thôi đếm
{
  const { maDb, vao, gui } = phongMoi();
  const ng = await vao('hm1'); await gui(ng, { t: 'm', x: 300, y: 300 });
  await chay(CK * 2);
  await gui(ng, { t: 'mh', x: 300, y: 300 });
  assert.equal(maDb.get('hm1'), 1);
  await chay(CK * 2 + 100);
  assert.deepEqual(tin(ng, 'tp').map(o => o.n), [1, 2], 'đếm phải bắt đầu từ lúc hóa ma');
  await chay(CK);
  const pd = tin(ng, 'pd');
  assert.ok(pd.length === 1 && pd[0].ma === 0, JSON.stringify(pd));
  assert.equal(ng.deserializeAttachment().pk, false, 'hết điểm ma mà khiên còn tắt');
  await chay(CK * 5);
  assert.equal(tin(ng, 'tp').length, 2, 'hết là ma mà vẫn bị giáng');
}
// 6. Phòng ngủ giữa chừng (bộ nhớ mất, phần đính kèm còn): tin kế của ma hẹn lại, đạo giữ đúng mốc cũ
{
  const P = phongMoi();
  P.maDb.set('ma3', 2); P.pks.set('ma3', { off: true, immune: 0, at: 0, ma: 2 });
  const m3 = await P.vao('ma3'), t0 = T;
  await chay(CK + 50);
  assert.equal(tin(m3, 'tp').length, 1);
  P.ngu();
  await chay(CK - 2000);
  await P.gui(m3, { t: 'm', x: 5, y: 5 });   // tin của ma: phòng thức, hẹn lại
  await chay(3000);
  assert.deepEqual(tin(m3, 'tp').map(o => o.n), [1, 2], 'phòng ngủ dậy mất nhịp thiên phạt');
  assert.ok(T - t0 >= 2 * CK);
}
// 7. Diệt ma gửi kèm chỗ ma gục (túi rơi ở đó)
{
  const { maDb, maEv, vao, gui, pks } = phongMoi('dao-xich-dien');
  maDb.set('ma4', 2); pks.set('ma4', { off: true, immune: 0, at: 0, ma: 2 });
  const ng = await vao('dt4', 100000), m4 = await vao('ma4', 100);
  await gui(ng, { t: 'm', x: 100, y: 100 }); await gui(m4, { t: 'm', x: 150, y: 120 });
  await chay(1000);
  await gui(ng, { t: 'h', to: 'ma4', x: 100, y: 100 });
  const d = maEv.find(e => e[0] === 'diet');
  assert.ok(d && d[4] === 'dao-xich-dien' && d[5]?.[0] === 150 && d[5]?.[1] === 120, 'diệt ma không kèm chỗ gục: ' + JSON.stringify(d));
}
// 8. Nhặt túi: lấy chỗ gửi kèm, lõi Mang ký; nhặt được thì người nhặt nhận ltn, người khác lt-; chặn nhặt dồn trong 0,4 giây; lỗi trả ltx
{
  const P = phongMoi('dao-xich-dien');
  const a = await P.vao('nh1'), b = await P.vao('nh2');
  await P.gui(a, { t: 'lt', id: 5, x: 1000, y: 1200 });
  assert.deepEqual(P.lt.at(-1), ['nh1', 5, 'dao-xich-dien', 1000, 1200]);
  assert.deepEqual(tin(a, 'ltn'), [{ t: 'ltn', id: 5, so: 1234 }]);
  assert.deepEqual(tin(b, 'lt-'), [{ t: 'lt-', id: 5, by: 'Nnh1', so: 1234 }]);
  assert.equal(tin(a, 'lt-').length, 0, 'người nhặt nhận cả tin lt- của chính mình');
  await P.gui(a, { t: 'lt', id: 6, x: 1000, y: 1200 });
  assert.equal(P.lt.length, 1, 'nhặt dồn trong 0,4 giây vẫn gửi Supabase');
  await chay(500);
  P.st.ltTra = { loi: 'het' };
  await P.gui(b, { t: 'lt', id: 5, x: 1000, y: 1200 });
  assert.deepEqual(tin(b, 'ltx'), [{ t: 'ltx', id: 5, e: 'het' }]);
  P.st.ltTra = null;
  await chay(500);
  await P.gui(b, { t: 'lt', id: 7, x: 1, y: 1 });
  assert.deepEqual(tin(b, 'ltx').at(-1), { t: 'ltx', id: 7, e: 'loi' });
  await chay(500);
  await P.gui(b, { t: 'lt', id: 'x' }); await P.gui(b, { t: 'lt', id: -1 });
  assert.equal(P.lt.length, 3, 'mã túi hỏng mà vẫn gửi');
  // 9. túi mới: chuyển cho người khác, không gửi lại người báo
  await P.gui(a, { t: 'ltm' });
  assert.equal(tin(b, 'ltm').length, 1); assert.equal(tin(a, 'ltm').length, 0);
}
console.log(`thien-phat (máy chủ phòng): ok · ${C.PVP.ma.tp.chu_ky} giây một đạo, đạo ${DAO} gục, túi qua lõi Mang`);
