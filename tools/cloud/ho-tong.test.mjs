// Bài thử Hộ Tông gia trì trên máy chủ phòng (cloud/src/ho-tong.js; chủ dự án 26/11/2026 00:19: đứng trên tinh cầu của tông môn mình thì Tông
// chủ +60%, Phó tông chủ +50%, Trưởng lão +40%, Đệ tử +20% sức mạnh), chạy trong Node, đồng hồ giả, không cần wrangler. Soát:
//   1. Bản sao số HO_TONG (mang-cfg.js) khớp data/guild.json → ho_tong; hàm tính phần trăm đúng luật (đúng tinh cầu, đúng chức vụ).
//   2. Hồ sơ (ho-so.js): đọc chức vụ + tinh cầu tông môn qua p2d_bang_vai_toi; máy chủ dữ liệu chưa có hàm mới thì vẫn có tên tông như cũ,
//      không có gia trì; giá trị lạ bị bỏ.
//   3. Cổng vào (index.js): máy khách tự gửi kèm x-chuc, x-tinh không lọt tới phòng.
//   4. Phòng (phong.js): tin chào báo ht cho đúng người, người ngoài và thành viên ở tinh cầu khác không có.
//   5. Trọng tài PvP (pvp.js): đòn và máu của người có gia trì nhân đúng phần trăm.
//   6. Trọng tài quái chung (quai.js): ngân sách sát thương nhân đúng phần trăm.
// Chạy: node tools/cloud/ho-tong.test.mjs
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { chepCloud, GOC_CLOUD as root } from './nap.mjs';
import { khBangQuai } from '../../src/game/kh-bai.js';

const dir = chepCloud('ho-tong-');
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
const ResponseThat = globalThis.Response;
globalThis.Response = class { constructor(body, init) { this.status = init?.status; this.webSocket = init?.webSocket; this.body = body; } };
globalThis.setTimeout = () => 0;
let T = 1e12; Date.now = () => T;

const C = await import(join(dir, 'mang-cfg.js'));
const { hoTongPct, pwCua } = await import(join(dir, 'ho-tong.js'));
const { QUAI } = await import(join(dir, 'quai-cfg.js'));
const G = JSON.parse(readFileSync(resolve(root, '../../data/guild.json'), 'utf8')).ho_tong;

// 1. số và luật
assert.deepEqual(C.HO_TONG, { on: G.on, pct: G.pct }, 'mang-cfg.js HO_TONG lệch data/guild.json ho_tong');
assert.deepEqual(G.pct, { chu: 60, pho: 50, lao: 40, de: 20 }, 'số chủ dự án chốt 26/11/2026: 60 / 50 / 40 / 20');
const NHA = '00000000-0000-4000-8000-00000000aaaa', KHAC = '00000000-0000-4000-8000-00000000bbbb';
assert.deepEqual(['chu', 'pho', 'lao', 'de'].map(c => hoTongPct(NHA, c, NHA)), [60, 50, 40, 20]);
assert.equal(hoTongPct(KHAC, 'chu', NHA), 0, 'ở tinh cầu của tông môn khác: không có');
assert.equal(hoTongPct('dao-moc', 'chu', NHA), 0, 'ở tinh cầu hệ: không có');
assert.equal(hoTongPct(NHA, 'chu', ''), 0, 'tông môn chưa có tinh cầu: không có');
assert.equal(hoTongPct('', 'chu', ''), 0);
for (const la of ['', 'vua', 'constructor', '__proto__', 'toString']) assert.equal(hoTongPct(NHA, la, NHA), 0, `chức vụ lạ "${la}": không có`);
assert.equal(pwCua({ pw: 1000, ht: 60 }), 1600); assert.equal(pwCua({ pw: 1000 }), 1000); assert.equal(pwCua(null), 0);

// 2. hồ sơ: fetch giả đóng vai máy chủ dữ liệu
{
  const { profileOf } = await import(join(dir, 'ho-so.js'));
  const env = { SUPABASE_URL: 'https://gia', SUPABASE_KEY: 'k' };
  let vai, coHamMoi = true, goi = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url); goi.push(u.split('/').pop().split('?')[0]);
    assert.equal(init.headers.Authorization, 'Bearer ve');
    if (u.includes('/p2d_nhan_vat?')) return { ok: true, json: async () => [{ ten: 'A', luc_chien: 5000, canh_gioi: 2, tang: 3 }] };
    if (u.endsWith('/rpc/p2d_co_toi')) return { ok: true, json: async () => false };
    if (u.endsWith('/rpc/p2d_bang_vai_toi')) return coHamMoi ? { ok: true, json: async () => vai } : { ok: false, status: 404, json: async () => ({ code: 'PGRST202' }) };
    if (u.endsWith('/rpc/p2d_bang_ten_toi')) return { ok: true, json: async () => 'Tông Cũ' };
    throw new Error('fetch lạ: ' + u);
  };
  vai = { ten: 'Thanh Vân', chuc: 'pho', tinh: NHA.toUpperCase() };
  let v = await profileOf('u1', 've', env);
  assert.deepEqual([v.tong, v.chuc, v.tinh, v.power, v.tl], ['Thanh Vân', 'pho', NHA, 5000, 20], 'đọc tên, chức vụ, tinh cầu tông môn (mã về chữ thường)');
  assert.ok(!goi.includes('p2d_bang_ten_toi'), 'có hàm mới thì không hỏi tên riêng nữa');
  vai = null;
  v = await profileOf('u2', 've', env);
  assert.deepEqual([v.tong, v.chuc, v.tinh], ['', '', ''], 'chưa vào tông môn');
  vai = { ten: 'X', chuc: 'vua', tinh: 'khong-phai-ma' };
  v = await profileOf('u3', 've', env);
  assert.deepEqual([v.tong, v.chuc, v.tinh], ['X', '', ''], 'chức vụ, mã tinh cầu lạ bị bỏ');
  vai = { ten: 'Y', chuc: 'chu', tinh: null };
  v = await profileOf('u4', 've', env);
  assert.deepEqual([v.tong, v.chuc, v.tinh], ['Y', 'chu', ''], 'tông môn chưa có tinh cầu');
  coHamMoi = false; goi = [];
  v = await profileOf('u5', 've', env);
  assert.deepEqual([v.tong, v.chuc, v.tinh], ['Tông Cũ', '', ''], 'máy chủ dữ liệu chưa có hàm mới: vẫn có tên tông, không có gia trì');
  assert.ok(goi.includes('p2d_bang_ten_toi'));
}

// 3. cổng vào: header máy khách tự gửi không lọt
{
  const mod = await import(join(dir, 'index.js'));
  let toi = null;
  const env = { DEV_NO_AUTH: '1', ALLOWED_ORIGINS: '', PHONG: { idFromName: n => n, get: () => ({ fetch: async rq => { toi = rq; return 'ok'; } }) } };
  const goc = globalThis.Request;
  globalThis.Request = class { constructor(rq, init) { this.headers = init.headers; } };
  const h = new Headers({ Upgrade: 'websocket', 'Sec-WebSocket-Protocol': 'p2d, ve', 'x-chuc': 'chu', 'x-tinh': NHA, 'x-power': '999999999', 'x-tong': 'Gia' });
  await mod.default.fetch({ url: `https://p/ws?r=dao:${NHA}&l=1&dev_uid=u1`, headers: h }, env);
  globalThis.Request = goc;
  assert.ok(toi, 'cổng phải chuyển vào phòng');
  for (const k of ['x-chuc', 'x-tinh', 'x-power', 'x-tong']) assert.equal(toi.headers.get(k), null, `${k} máy khách tự gửi phải bị gỡ`);
  assert.equal(toi.headers.get('x-map'), NHA);
}

// Phòng thật (mã cloud/src) trên một tinh cầu tông môn giả
const KB = JSON.parse(JSON.stringify(QUAI.kh)), capTo = KB.levels.at(-1).cap;
const tinh = { id: NHA, ten: 'Nhà', mat_dat: 'co', hat: 4242, cap: capTo, vong: 1, goc: 0, trong: false, bang: 'Thanh Vân', bay: [], rieng: {} };
globalThis.fetch = async url => { if (!String(url).endsWith('/rest/v1/rpc/p2d_kh_ds')) throw new Error('fetch lạ: ' + url); return { ok: true, json: async () => [structuredClone(tinh)] }; };
const { Phong } = await import(join(dir, 'phong.js'));
function phongMoi() {
  const ctx = { list: [], setWebSocketAutoResponse() {}, acceptWebSocket(ws, tags) { ws.tags = tags; this.list.push(ws); },
    getWebSockets(tag) { return this.list.filter(w => w.readyState === 1 && (!tag || w.tags?.includes(tag))); } };
  const pks = new Map();
  const env = { SUPABASE_URL: 'https://gia', SUPABASE_KEY: 'k', MANG: { idFromName: () => 'id', get: () => ({ pvp: async () => true,
    pkGet: async u => pks.get(u) || { off: false, immune: 0, at: 0, ma: 0 }, pkSet: async (u, off, immune, at) => { pks.set(u, { off, immune, at, ma: 0 }); } }) } };
  const r = new Phong(ctx, env);
  const vao = async (uid, pw, map, chuc, nha) => {
    await r.fetch({ headers: new Map([['x-uid', uid], ['x-kind', 'dao'], ['x-cap', '40'], ['x-map', map], ['x-power', String(pw)], ['x-co', '0'], ['x-tl', '30'],
      ...(chuc ? [['x-chuc', chuc]] : []), ...(nha ? [['x-tinh', nha]] : [])]) });
    return ctx.list.at(-1);
  };
  return { r, vao, gui: (w, o) => r.webSocketMessage(w, JSON.stringify(o)) };
}
const cuoi = (w, t) => w.out.filter(o => o.t === t).at(-1);

// 4. tin chào
{
  const { vao } = phongMoi();
  const chu = await vao('chu', 1000, NHA, 'chu', NHA), de = await vao('de', 1000, NHA, 'de', NHA);
  const ngoai = await vao('ngoai', 1000, NHA), khach = await vao('khach', 1000, NHA, 'chu', KHAC);   // khách: tông chủ tông môn khác tới chơi
  assert.equal(cuoi(chu, 'w').ht, 60); assert.equal(chu.att.ht, 60);
  assert.equal(cuoi(de, 'w').ht, 20);
  for (const [w, ten] of [[ngoai, 'người không tông môn'], [khach, 'tông chủ tông môn khác']]) { assert.ok(!('ht' in cuoi(w, 'w')), `${ten}: tin chào không có ht`); assert.ok(!('ht' in w.att)); }
  const s = phongMoi(), xa = await s.vao('chu', 1000, 'dao-moc', 'chu', NHA);
  assert.ok(!('ht' in cuoi(xa, 'w')), 'tông chủ ở tinh cầu hệ: không có gia trì');
}

// 5. PvP: hai người cùng lực chiến 10.000, một là tông chủ đang ở nhà
{
  const { vao, gui } = phongMoi(), P = C.PVP, PW = 10000;
  const a = await vao('a', PW, NHA, 'chu', NHA), b = await vao('b', PW, NHA);
  await gui(a, { t: 'm', x: 300, y: 300 }); await gui(b, { t: 'm', x: 340, y: 300 });
  await gui(a, { t: 'bv', off: true }); await gui(b, { t: 'bv', off: true });
  T += 2000;
  await gui(a, { t: 'h', to: 'b', x: 300, y: 300 });
  const pa = cuoi(b, 'ph');
  assert.equal(pa.n, Math.round(PW * 1.6 * P.dps_k * P.gap_s), 'đòn của tông chủ ở nhà = lực chiến × 1,6');
  assert.equal(pa.r, +((PW * P.hp_k - pa.n) / (PW * P.hp_k)).toFixed(3), 'máu người ngoài tính theo lực chiến gốc');
  T += 2000;
  await gui(b, { t: 'h', to: 'a', x: 340, y: 300 });
  const pb = cuoi(a, 'ph');
  assert.equal(pb.to, 'a'); assert.equal(pb.n, Math.round(PW * P.dps_k * P.gap_s), 'đòn của người ngoài không đổi');
  assert.equal(pb.r, +((PW * 1.6 * P.hp_k - pb.n) / (PW * 1.6 * P.hp_k)).toFixed(3), 'máu PvP của tông chủ ở nhà = lực chiến × 1,6 × hp_k');
}

// 6. quái chung: ngân sách sát thương đầu trận (K × 2, K = max(1000, lực chiến) × dps_k)
{
  const B = khBangQuai(KB, tinh), bai = B.s.reduce((x, y) => (y[3] > x[3] ? y : x)), [i0, n, , hp0, x0, y0] = bai, PW = 1000, NS = PW * QUAI.dps_k * 2;
  assert.ok(n * hp0 > NS * 1.6, `bãi thử phải trâu hơn ngân sách (${n} × ${hp0} so ${NS * 1.6}); đổi tinh cầu thử`);
  const don = () => Array.from({ length: n }, (_, j) => [i0 * 64 + j, 1e9]);
  const nhan = w => cuoi(w, 'qa').h.reduce((s, [, con]) => s + (hp0 - Math.max(0, con)), 0);   // tổng máu phòng chịu trừ cho một tin đòn
  for (const [chuc, k] of [['lao', 1.4], ['pho', 1.5], [null, 1]]) {
    const { vao, gui } = phongMoi(), w = await vao('x', PW, NHA, chuc, chuc ? NHA : null);
    await gui(w, { t: 'q', n: 1, x: x0, y: y0, h: don() });
    assert.equal(Math.round(nhan(w)), Math.round(NS * k), `${chuc || 'người ngoài'}: ngân sách × ${k}`);
  }
}
globalThis.Response = ResponseThat;
console.log('✅ Hộ Tông gia trì: số khớp data, hồ sơ, cổng vào, tin chào, PvP, quái chung đều đúng luật');
