// Bài thử: treo máy mà không làm gì quá treo_may.phut phút thì lưu rồi về màn đăng nhập; còn bao_s giây thì báo trước, chạm là ở lại; Tự đánh,
// Tự hành, đả tọa, câu cá, độ kiếp, bay giữa tinh cầu, đang đi thì không tính (src/game/treo-may.js; chủ dự án 23/11/2026 12:43).
// Chạy: node tools/treo-may.test.mjs (check.mjs gọi)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const nghe = {}, ghi = (o, ev, f) => { (o.ds ||= {})[ev] = [...(o.ds[ev] || []), f]; };
const phat = (o, ev, e = {}) => { for (const f of o.ds?.[ev] || []) f(e); };
const kho = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };
const the = () => ({ style: {}, hidden: false, textContent: '', id: '' });
const doc = { hidden: false, documentElement: { lang: '' }, addEventListener: (ev, f) => ghi(doc, ev, f), createElement: the, body: { con: [], append(e) { this.con.push(e); } } };
globalThis.document = doc;
globalThis.addEventListener = (ev, f) => ghi(nghe, ev, f);
globalThis.localStorage = kho();
globalThis.sessionStorage = kho();
let taiLai = 0;
globalThis.location = { reload: () => { taiLai++; } };
globalThis.setInterval = () => 0;   // bài thử tự gọi tick
const cfg = JSON.parse(readFileSync(new URL('../data/config.json', import.meta.url), 'utf8')).treo_may;
assert.ok(cfg?.on && cfg.phut > 0 && cfg.bao_s > 0 && cfg.bao_s < cfg.phut * 60, 'data/config.json → treo_may thiếu hoặc sai');
for (const k of ['bao', 'dang', 'bao_dang_nhap']) assert.ok(cfg.text?.[k], `treo_may.text.${k} trống`);
assert.ok(cfg.text.bao.includes('{s}') && cfg.text.bao_dang_nhap.includes('{phut}'), 'chữ báo phải có {s}, {phut}');

const { startTreoMay, baoDangNhap, dangBan, KEY_TREO } = await import('../src/game/treo-may.js');
const SONG = 'p2d-dang-choi';
let T = 0;
const now = () => T;
const moi = () => {
  const g = { data: { config: { treo_may: cfg } }, save: {}, player: { x: 100, y: 100 }, luu: 0, day: 0 };
  g.persist = () => { g.luu++; };
  g.cloud = { flush: async () => { g.day++; } };
  return g;
};
const cho = () => new Promise(ok => setTimeout(ok, 5));
const chay = (W, giay, moiGiay) => { for (let i = 0; i < giay; i++) { T += 1000; moiGiay?.(i); W.tick(); } };
const hop = () => doc.body.con.find(e => e.id === 'treo-may-bao');

// 1. Đứng yên: trước bao_s giây chưa báo; tới bao_s thì báo; chạm thì tắt báo, đếm lại từ đầu
let g = moi(), W = startTreoMay(g, now);
chay(W, cfg.phut * 60 - cfg.bao_s - 1);
assert.ok(!hop() || hop().hidden, 'chưa tới lúc mà đã báo');
chay(W, 2);
assert.ok(hop() && !hop().hidden && /\d/.test(hop().textContent) && !hop().textContent.includes('{s}'), 'còn bao_s giây mà không báo');
phat(nghe, 'pointerdown');
assert.ok(hop().hidden, 'chạm rồi mà lời báo vẫn còn');
chay(W, cfg.phut * 60 - 5);
await cho();
assert.ok(taiLai === 0 && g.luu === 0, 'chạm rồi mà vẫn bị đưa ra (không đếm lại)');

// 2. Hết giờ: lưu, gửi máy chủ, thôi lưu tiếp, bỏ dấu tự vào lại, để lời báo cho màn đăng nhập, tải lại một lần
localStorage.setItem(SONG, JSON.stringify({ t: Date.now() }));
chay(W, 10);
await cho();
assert.equal(taiLai, 1, 'hết giờ mà không tải lại về màn đăng nhập');
assert.ok(g.luu === 1 && g.day === 1, 'chưa lưu tiến độ trước khi rời');
assert.equal(g.cloud, null, 'rời rồi mà vẫn còn lưu lên máy chủ');
g.persist(); assert.equal(g.luu, 1, 'rời rồi mà vẫn còn lưu');
assert.equal(localStorage.getItem(SONG), null, 'còn dấu đang chơi: tải lại xong sẽ tự vào game lại');
chay(W, 30); await cho();
assert.equal(taiLai, 1, 'tải lại hai lần');
const bao = baoDangNhap();
assert.ok(bao && bao.includes(String(cfg.phut)) && !bao.includes('{phut}'), 'màn đăng nhập không có lời báo vì sao');
assert.equal(baoDangNhap(), null, 'lời báo phải hiện một lần thôi');
assert.equal(sessionStorage.getItem(KEY_TREO), null);

// 3. Treo có việc, đang đi, trang ẩn: không tính
const viec = { auto: g => { g.auto = {}; }, pilot: g => { g.pilot = {}; }, fish: g => { g.fish = {}; }, trip: g => { g.trip = {}; },
  trib: g => { g.trib = { active: true }; }, ngoi: g => { g.player.meditating = true; } };
for (const [ten, bat] of Object.entries(viec)) {
  taiLai = 0; g = moi(); bat(g); assert.ok(dangBan(g), `${ten}: dangBan sai`);
  W = startTreoMay(g, now); chay(W, cfg.phut * 60 * 3); await cho();
  assert.equal(taiLai, 0, `${ten}: đang treo có việc mà bị đưa ra`);
}
g = moi(); g.manToi = true; assert.ok(!dangBan(g), 'Tắt màn mà chỉ đứng nghỉ thì vẫn là treo không');
taiLai = 0; g = moi(); W = startTreoMay(g, now);
chay(W, cfg.phut * 60 * 2, i => { g.player.x += i % 2 ? 6 : -6; });
await cho(); assert.equal(taiLai, 0, 'đang đi mà bị đưa ra');
doc.hidden = true; chay(W, cfg.phut * 60 * 2); await cho(); assert.equal(taiLai, 0, 'trang ẩn mà vẫn đếm');
doc.hidden = false; chay(W, 3); await cho(); assert.equal(taiLai, 0, 'mở lại mà tính luôn thời gian ẩn');
g.save = null; chay(W, cfg.phut * 60 * 2); await cho(); assert.equal(taiLai, 0, 'chưa vào game mà vẫn đếm');

// 4b. Bài thử tự động (?thu=1) chạy lâu không chạm màn: không đưa ra, trừ khi thêm &treo=1
location.search = '?thu=1'; assert.equal(startTreoMay(moi(), now), null, '?thu=1 mà vẫn bật treo máy: bài thử tự động sẽ bị đưa ra giữa chừng');
location.search = '?thu=1&treo=1'; assert.ok(startTreoMay(moi(), now), '&treo=1 phải bật lại để thử'); location.search = '';
// 4. Tắt trong config thì thôi hẳn
assert.equal(startTreoMay({ data: { config: { treo_may: { ...cfg, on: false } } } }, now), null, 'treo_may.on = false mà vẫn chạy');

// 5. Đã nối vào game và màn đăng nhập (màn đăng nhập không tự vào lại khi vừa rời vì treo máy)
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
assert.match(main, /startTreoMay\(game\)/, 'src/main.js chưa gọi startTreoMay');
const login = readFileSync(new URL('../src/ui/login.js', import.meta.url), 'utf8');
assert.match(login, /baoDangNhap\(\)/, 'src/ui/login.js chưa hiện lời báo treo máy');
assert.match(login, /!treo && opts\.tuVao/, 'màn đăng nhập vẫn tự vào lại sau khi rời vì treo máy');
console.log('✅ Treo máy: đứng yên quá giờ thì lưu, về màn đăng nhập, báo trước, treo có việc không tính');
