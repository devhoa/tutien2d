// Bài thử Cổ Thụ Ngàn Năm ở máy chủ phòng (cloud/src/co-thu.js; chủ dự án 23/11/2026 15:33): ma ngồi đả tọa trong vòng sáng mỗi phút −1 điểm ma,
// người thường ngồi được chia linh khí cây, trong vòng không ai đánh ai, thiên phạt dừng mà không đếm lại. Chạy: node tools/cloud/co-thu.test.mjs
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { chepCloud, GOC_CLOUD as root } from './nap.mjs';

const dir = chepCloud('ct-');
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
const CO = C.PVP.ma.co, PH = CO.phut_s * 1000;
assert.deepEqual(CO, PV.server.ma.co, 'mang-cfg.js lệch data/pvp.json server.ma.co');
assert.ok(PH === 60000 && CO.map === TK, 'Cổ Thụ: một phút một điểm ma, ở Thiên Kiếm Tinh (lời chủ dự án 15:33)');
const GOC = { x: CO.x, y: CO.y + 10 }, NGOAI = { x: CO.x + CO.r + 60, y: CO.y };

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
      if (e === 'sh') { const n = Math.max(0, (maDb.get(ke) || 0) - 1); maDb.set(ke, n); return { ma: n, no: true }; }
      if (e === 'hoa') { maDb.set(ke, Math.max(maDb.get(ke) || 0, 1)); return { ma: maDb.get(ke) }; }
      const ai = e === 'tp' ? ke : nan, n = Math.max(0, (maDb.get(ai) || 0) - 1); maDb.set(ai, n);
      return e === 'tp' ? { ma: n, no: true } : { ma: n, cd: 1, no: true };
    },
    ltNhat: async (u, id, m, x, y) => { lt.push([u, id, m, x, y]); return st.ltTra; },
    coThu: async ids => { st.hap = (st.hap || 0) + 1; st.ids = ids; return { lk: 100, h: Object.fromEntries(ids.map(i => [i, 10])) }; } }) } };
  let r = new Phong(ctx, env);
  const hh = (uid, pw, tl = 30) => new Map([['x-uid', uid], ['x-kind', 'dao'], ['x-cap', '40'], ['x-map', map], ['x-name', encodeURIComponent('N' + uid)], ['x-power', String(pw)], ['x-co', '0'], ['x-tl', String(tl)]]);
  const vao = async (uid, pw = 1000) => { await r.fetch({ headers: hh(uid, pw) }); return ctx.list.at(-1); };
  const gui = (w, o) => r.webSocketMessage(w, JSON.stringify(o));
  return { get r() { return r; }, ctx, maDb, maEv, lt, st, pks, vao, gui, ngu() { for (const h of [...hen]) clearTimeout(h.id); r = new Phong(ctx, env); } };
}
const tin = (w, t) => w.out.filter(o => o.t === t);


const ngoi = (gui, w, o = GOC) => gui(w, { t: 'm', x: o.x, y: o.y }).then(() => gui(w, { t: 'p', p: { name: 'x', st: 'toa' } }));
const dung = (gui, w) => gui(w, { t: 'p', p: { name: 'x' } });

// 1. Ma ngồi đả tọa trong vòng sáng: mỗi phút −1 điểm ma (lõi Mang 'sh'), không thiên phạt; hết điểm thì thành người, khiên bật lại
{
  const { maDb, maEv, vao, gui, pks } = phongMoi();
  maDb.set('ma1', 3); pks.set('ma1', { off: true, immune: 0, at: 0, ma: 3 });
  const nhin = await vao('xem1'), m1 = await vao('ma1');
  await ngoi(gui, m1);
  await chay(PH - 100);
  assert.equal(tin(m1, 'sh').length, 0, 'chưa đủ phút đã trừ');
  await chay(200);
  assert.deepEqual(tin(m1, 'sh'), [{ t: 'sh', id: 'ma1', ma: 2, no: 1 }]);
  await chay(PH * 2);
  assert.deepEqual(tin(m1, 'sh').map(o => o.ma), [2, 1, 0], 'ba phút ba điểm');
  assert.equal(tin(nhin, 'tp').length + tin(nhin, 'pd').length, 0, 'ngồi trong vòng sáng mà vẫn bị thiên phạt');
  assert.deepEqual(tin(nhin, 'pk').at(-1), { t: 'pk', id: 'ma1', on: 0, ma: 0 }, 'hết điểm ma: cả phòng phải thấy khiên bật lại');
  assert.ok(!m1.deserializeAttachment().pk, 'hết điểm ma mà vẫn tắt khiên');
  await chay(PH * 3);
  assert.equal(maEv.filter(e => e[0] === 'sh').length, 3, 'hết là ma rồi mà vẫn gửi sh');
}
// 2. Đứng dậy giữa phút: phút chưa đủ không tính, phút đã đủ giữ; ngồi lại đếm từ lúc ngồi
{
  const { maDb, maEv, vao, gui, pks } = phongMoi();
  maDb.set('ma2', 5); pks.set('ma2', { off: true, immune: 0, at: 0, ma: 5 });
  const m = await vao('ma2');
  await ngoi(gui, m);
  await chay(PH + 30000); await dung(gui, m);
  await chay(PH * 2);
  assert.equal(maEv.filter(e => e[0] === 'sh').length, 1, 'đứng dậy rồi vẫn trừ');
  await ngoi(gui, m);
  await chay(PH - 100);
  assert.equal(maEv.filter(e => e[0] === 'sh').length, 1, 'ngồi lại phải đếm từ đầu phút');
  await chay(200);
  assert.equal(maEv.filter(e => e[0] === 'sh').length, 2);
  // ra khỏi vòng (vẫn ngồi theo hồ sơ): thôi đếm
  await gui(m, { t: 'm', x: NGOAI.x, y: NGOAI.y });
  await chay(PH * 2);
  assert.equal(maEv.filter(e => e[0] === 'sh').length, 2, 'ngồi ngoài vòng sáng mà vẫn trừ');
}
// 3. Thiên phạt dừng trong vòng, không đếm lại từ đầu: vào vòng ở giây 5, ở 100 giây, ra thì 5 giây sau đạo một
{
  const { maDb, vao, gui, pks } = phongMoi();
  maDb.set('ma3', 9); pks.set('ma3', { off: true, immune: 0, at: 0, ma: 9 });
  const nhin = await vao('xem3'), m = await vao('ma3');
  await gui(m, { t: 'm', x: NGOAI.x, y: NGOAI.y });
  await chay(5000);
  await gui(m, { t: 'm', x: GOC.x, y: GOC.y });
  await chay(100000);
  assert.equal(tin(nhin, 'tp').length, 0, 'đứng trong vòng mà vẫn bị giáng');
  await gui(m, { t: 'm', x: NGOAI.x, y: NGOAI.y });
  await chay(4800);
  assert.equal(tin(nhin, 'tp').length, 0, 'ra khỏi vòng: giáng sớm hơn phần còn lại của 10 giây');
  await chay(400);
  assert.deepEqual(tin(nhin, 'tp'), [{ t: 'tp', id: 'ma3', n: 1 }], 'ra khỏi vòng: đếm tiếp chứ không đếm lại');
}
// 4. Người thường ngồi trong vòng: mỗi phút một lần chia (gom cả phòng), người nhận nhận ct, cả phòng nhận ctl; người ngồi ngoài vòng không có
{
  const { st, vao, gui } = phongMoi();
  const a = await vao('ng1'), b = await vao('ng2'), c = await vao('ng3');
  await ngoi(gui, a); await ngoi(gui, b, { x: GOC.x - 20, y: GOC.y });
  await ngoi(gui, c, NGOAI);
  await chay(PH + 100);
  assert.equal(st.hap, 1, 'hai người đủ phút cùng lúc phải gom một lần gọi');
  assert.deepEqual([...st.ids].sort(), ['ng1', 'ng2']);
  assert.deepEqual(tin(a, 'ct'), [{ t: 'ct', q: 10 }]);
  assert.equal(tin(c, 'ct').length, 0, 'ngồi ngoài vòng mà được chia');
  assert.deepEqual(tin(c, 'ctl'), [{ t: 'ctl', lk: 100 }], 'cả phòng phải thấy linh khí cây còn lại');
  // phòng ngủ dậy (quên hẹn giờ, quên vị trí): tin kế của người ngồi hẹn lại, phút vẫn tính từ lúc ngồi
  {
    const p = phongMoi(); const x = await p.vao('ng9'); await ngoi(p.gui, x);
    await chay(30000); p.ngu();
    await p.gui(x, { t: 'p', p: { name: 'x', st: 'toa' } });
    await chay(PH - 30000 + 100);
    assert.equal(p.st.hap, 1, 'phòng ngủ dậy: phút đang ngồi phải tính tiếp từ lúc ngồi');
  }
}
// 5. Trong vòng không ai đánh ai: ma đứng ngoài đánh người ngồi trong vòng (trong tầm) không trúng; người ra khỏi vòng thì trúng
{
  const { maDb, vao, gui, pks } = phongMoi();
  maDb.set('ma5', 4); pks.set('ma5', { off: true, immune: 0, at: 0, ma: 4 });
  const ng = await vao('ng5'), m = await vao('ma5');
  const R = CO.r;
  await gui(ng, { t: 'm', x: CO.x + R - 10, y: CO.y });
  await gui(m, { t: 'm', x: CO.x + R + 60, y: CO.y });
  await chay(1000);
  await gui(m, { t: 'h', to: 'ng5', x: CO.x + R + 60, y: CO.y });
  assert.equal(tin(ng, 'ph').length, 0, 'đánh trúng người trong vòng sáng');
  await gui(ng, { t: 'm', x: CO.x + R + 20, y: CO.y });
  await chay(1500);
  await gui(m, { t: 'h', to: 'ng5', x: CO.x + R + 60, y: CO.y });
  assert.equal(tin(ng, 'ph').length, 1, 'ra khỏi vòng mà không đánh được (bài thử sai?)');
  // ma đứng trong vòng cũng không đánh được ai
  await gui(m, { t: 'm', x: CO.x, y: CO.y });
  await chay(1500);
  await gui(m, { t: 'h', to: 'ng5', x: CO.x, y: CO.y });
  assert.equal(tin(ng, 'ph').length, 1, 'ma đứng trong vòng sáng mà vẫn đánh được');
}
console.log('co-thu.test: đạt');
