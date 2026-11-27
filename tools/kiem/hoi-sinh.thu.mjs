// Bài thử HỒI SINH / VÀO GAME (chủ dự án 24/11/2026 00:28 + bảng chọn: "nếu bật auto hồi sinh thì vẫn hồi sinh tại chỗ, còn nếu k thì sẽ về trận
// tông môn"; "Cùng phiên hoặc trong 5 phút"; "Ma cũng về trận tông môn"; "hiệu ứng bị hạ sẽ chờ 5s… cả người sẽ biến thành màu đen và héo lại").
//   1. Gục ngoài trời, không bật "Gục thì hồi sinh tại chỗ", tông môn chưa có tinh cầu: chờ 5 giây (thân hoá đen, co thấp), hồi sinh giữa pháp trận
//      Thiên Kiếm Tinh, đủ máu, có cột sáng giáng xuống.
//   2. Bật tự hồi sinh tại chỗ: vẫn chờ 5 giây, hồi sinh ở điểm hồi sinh của tinh cầu đang đứng.
//   3. Tông môn có tinh cầu (tinh cầu giả dựng như khai-hoang.js khLoad): hồi sinh giữa pháp trận tinh cầu tông môn. Đang hóa ma cũng vậy.
//   4. Vào game: tải lại trong cùng thẻ thì đứng đúng chỗ cũ; thẻ mới mà vừa rời 2 phút cũng vậy; thẻ mới sau 6 phút là đăng nhập: giữa pháp trận.
// Khách chơi thử (không mạng: thư viện Supabase, PostHog bị chặn), bản lưu khách dựng sẵn đã có động phủ.
// Chạy ở thư mục bản đã gói như CI (node tools/goi.mjs _site; cd _site; node ../tools/kiem/hoi-sinh.thu.mjs), hoặc ở gốc kho.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8797, ANH = process.env.ANH || '';   // ANH=thư mục: chụp ảnh lúc bị hạ
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);

const SAVE = { step: 52, stepDone: true, mua: 2, map: 'thien-kiem-phong', spawn: 'vao', element: 'moc', weapon: 'kiem', realm: 4, layer: 6, qi: 0, gioi: 'nu',
  flags: { 'dong-phu': true, 'ngu-kiem': true }, visited: { 'thien-kiem-phong': true }, tiem: { toc: 'yeu', goc: { atk_pct: 2, hp_pct: 2, def_pct: 2 }, cong: {}, max: 4 } };
const XA = 'dao-han-bang';   // tinh cầu farm để gục (ngoài trời; nền tuyết sáng nên thân hoá đen dễ đo)
const KH = { id: '00000000-0000-4000-8000-00000000c0de', ten: 'Tinh Cầu Thử', mat_dat: 'co', hat: 4242, cap: 3, vong: 1, goc: 0, trong: false, bang: 'Thử', bay: [], rieng: {} };

const b = await chromium.launch();
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: ANH ? 2 : 1, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.route(/supabase-js|posthog|supabase\.co|workers\.dev/, r => r.abort());
await ctx.addInitScript(s => { if (!sessionStorage.getItem('thu-da-dat')) { localStorage.setItem('p2d.save.v1:guest', s); sessionStorage.setItem('thu-da-dat', '1'); } }, JSON.stringify(SAVE));
const errs = [];

async function vao(p) {
  await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
  await p.waitForTimeout(600);
  await p.tap('#btn-guest');
  await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
  await p.evaluate(() => {   // hội thoại truyện, bảng của Hệ Thống: thôi hiện, bật lên giữa chừng thì đóng ngay (như bay-nl.thu.mjs)
    const g = window.__game, d = g.dialog; g.khoaBo = true; g.auto = false;
    for (const k of Object.keys(d)) if (typeof d[k] === 'function' && k !== 'close') d[k] = async () => null;
    const tat = () => { d.open = false; const box = document.getElementById('dialog'); if (box) box.hidden = true; g.closeAll?.(); g.uiOpen = false; for (const e of document.querySelectorAll('.ht-back')) e.hidden = true; };
    tat(); setInterval(tat, 250);
  });
  await p.waitForFunction(() => !window.__game.cheMan, null, { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(500);
}
const cachTran = p => p.evaluate(() => { const g = window.__game, z = g.map.def.phap_tran?.at, T = g.map.T; return z ? Math.hypot(g.player.x - (z[0] + 0.5) * T, g.player.y - (z[1] + 0.5) * T) / T : 99; });

// Độ sáng trung bình (0–255) một ô 6 × 6 điểm màn giữa phần dưới thân mình (ô này luôn nằm trong thân, cả khi đã co héo), kèm trạng thái chờ
// hồi sinh. Đứng ở nền tuyết trống của Hàn Băng (không đèn màu chập chờn như dung nham, không nằm trên pháp trận sáng).
const doSang = () => {
  const g = window.__game, cv = document.getElementById('game'), p = g.player, s = g.screen.toScreen(p.x, p.y - (p.top || 24) * 0.3);
  const r = cv.getBoundingClientRect(), kx = cv.width / r.width, ky = cv.height / r.height;
  let tong = 0, n = 0;
  try {
    const d = cv.getContext('2d').getImageData(Math.round((s.x - 3) * kx), Math.round((s.y - 3) * ky), Math.max(1, Math.round(6 * kx)), Math.max(1, Math.round(6 * ky))).data;
    for (let i = 0; i < d.length; i += 4) { n++; tong += 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; }
  } catch { /* khung vẽ không đọc được */ }
  return { con: !!g.ghost, sec: g.ghost?.sec, ve: g.ghost?.ve, sang: n ? tong / n : null };
};

// Gục một lần trên tinh cầu `noi` (đã có sẵn thì thôi đi), đo: thời gian chờ, độ đen giữa chừng, nơi hồi sinh
async function guc(p, noi, { tuHoi = false, ma = 0, chup = '' } = {}) {
  await p.evaluate(async ([noi, tuHoi, ma]) => {
    const g = window.__game;
    (g.save.pilotOpt ??= {})['hoi-sinh'] = tuHoi;
    g.pvp = { ...(g.pvp || {}), ma };
    if (g.map.id !== noi) await g.travel(noi, 'vao', false, { force: true });
    const M = g.map, c = M.freeNear(Math.floor(g.player.x / M.T) - 6, Math.floor(g.player.y / M.T) + 5, 0, g.player.r || 5);   // ra khỏi pháp trận sáng
    if (c) { g.player.x = c.x; g.player.y = c.y; g.screen.snap?.(c.x, c.y); }
  }, [noi, tuHoi, ma]);
  await p.waitForFunction(() => !window.__game.cheMan && !window.__game.traveling, null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(1200);   // màn che lúc sang tinh cầu tan hẳn
  const sang0 = await p.evaluate(doSang);   // thân lúc còn sống
  const t0 = await p.evaluate(() => { const g = window.__game; g.player.hp = 0; return performance.now(); });
  await p.waitForFunction(() => !!window.__game.ghost, null, { timeout: 3000 });
  await p.waitForTimeout(1800);
  const giua = await p.evaluate(doSang);   // giữa lúc bị hạ: độ sáng quanh thân (hoá đen) và trạng thái chờ
  if (chup) await p.screenshot({ path: chup });
  await p.waitForFunction(() => !window.__game.ghost && window.__game.player.hp > 0, null, { timeout: 9000 });
  const t1 = await p.evaluate(() => performance.now());
  await p.waitForTimeout(900);
  const sau = await p.evaluate(() => { const g = window.__game; return { map: g.map.id, hp: g.player.hp, max: g.player.maxHp, cot: (g.ttFx || []).some(f => f.loai === 'den' && f.own), ma: g.pvp?.ma || 0 }; });
  return { cho: (t1 - t0) / 1000, sang0: sang0.sang, giua, sau, cach: await cachTran(p) };
}

const p = await ctx.newPage();
p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${PORT}/?thu=1`);
await vao(p);
const G = await p.evaluate(() => ({ sec: window.__game.data.config.ghost.sec, tk: window.__game.data.home.start_map.map }));
thu(G.sec === 5, `bị hạ chờ 5 giây (ghost.sec = ${G.sec})`);

// 1. Không bật tự hồi sinh, chưa có tinh cầu tông môn → pháp trận Thiên Kiếm Tinh
let r = await guc(p, XA, { chup: ANH && `${ANH}/bi-ha.png` });
thu(r.giua.con && r.giua.ve === true, `gục ngoài trời (không bật tự hồi sinh): chờ về trận tông môn (${JSON.stringify(r.giua)})`);
// Thân bị hạ vẽ riêng (không nền, không đèn: đo đúng hình nhân vật): hoá đen hẳn, co thấp lại (ít điểm hơn)
const than = await p.evaluate(() => ({ song: window.__thu.veThan(window.__game, null), ha: window.__thu.veThan(window.__game, 1) }));
thu(than.song.diem > 50 && than.ha.sang != null && than.ha.sang < Math.min(45, than.song.sang * 0.4), `thân bị hạ hoá đen (độ sáng các điểm có màu ${than.song.sang?.toFixed(0)} → ${than.ha.sang?.toFixed(0)})`);
thu(than.ha.diem < than.song.diem * 0.95, `thân bị hạ co héo lại (số điểm ${than.song.diem} → ${than.ha.diem})`);
thu(r.cho >= 4.8 && r.cho <= 6.5, `chờ đủ 5 giây rồi mới hồi sinh (${r.cho.toFixed(2)} giây)`);
thu(r.sau.map === G.tk && r.cach < 1.5, `chưa có tinh cầu tông môn: hồi sinh giữa pháp trận Thiên Kiếm Tinh (${r.sau.map}, cách tâm trận ${r.cach.toFixed(2)} ô)`);
thu(r.sau.hp === r.sau.max && r.sau.cot, `đủ máu, có cột sáng giáng xuống (${Math.round(r.sau.hp)}/${Math.round(r.sau.max)}, cột ${r.sau.cot})`);

// 2. Bật tự hồi sinh tại chỗ → vẫn 5 giây, hồi sinh ở điểm hồi sinh của tinh cầu đang đứng
r = await guc(p, XA, { tuHoi: true });
thu(r.giua.ve === false && r.cho >= 4.8, `bật tự hồi sinh: vẫn chờ 5 giây (${r.cho.toFixed(2)} giây)`);
thu(r.sau.map === XA, `bật tự hồi sinh: hồi sinh tại tinh cầu đang đứng (${r.sau.map})`);

// 3. Tông môn có tinh cầu → giữa pháp trận tinh cầu tông môn; đang hóa ma cũng vậy
await p.evaluate(kh => { const g = window.__game, s = window.__thu.khState(g); s.list.push(kh); window.__thu.khRebuild(g, kh.id, kh.bay); s.mine = { tinh: { id: kh.id, ten: kh.ten } }; }, KH);
r = await guc(p, XA);
thu(r.sau.map === KH.id && r.cach < 1.5, `có tinh cầu tông môn: hồi sinh giữa pháp trận tinh cầu tông môn (${r.sau.map === KH.id ? 'tinh cầu tông môn' : r.sau.map}, cách tâm trận ${r.cach.toFixed(2)} ô)`);
r = await guc(p, XA, { ma: 2 });
thu(r.giua.ve === true && r.sau.map === KH.id && r.cach < 1.5, `đang hóa ma: cũng về pháp trận tông môn (${r.sau.map === KH.id ? 'tinh cầu tông môn' : r.sau.map}, cách ${r.cach.toFixed(2)} ô)`);
await p.evaluate(() => { const g = window.__game; g.pvp = { ...(g.pvp || {}), ma: 0 }; window.__thu.khState(g).mine = null; });

// 4. Vào game: đứng ở một chỗ trên tinh cầu farm rồi tải lại cùng thẻ → đúng chỗ cũ
await p.evaluate(async xa => { const g = window.__game; await g.travel(xa, 'vao', false, { force: true }); g.player.x += 3 * g.map.T; }, XA);
await p.waitForTimeout(3800);   // vi-tri.js ghi chỗ đứng mỗi 3 giây
const cu = await p.evaluate(() => ({ map: window.__game.map.id, x: Math.round(window.__game.player.x), y: Math.round(window.__game.player.y), ai: JSON.parse(localStorage.getItem('p2d-vi-tri') || 'null')?.ai, w: JSON.parse(localStorage.getItem('p2d-vi-tri') || 'null')?.w }));
await p.reload();
await vao(p);
let o = await p.evaluate(() => ({ map: window.__game.map.id, x: Math.round(window.__game.player.x), y: Math.round(window.__game.player.y) }));
thu(o.map === cu.map && Math.hypot(o.x - cu.x, o.y - cu.y) < 24, `tải lại cùng thẻ (bản mới, mất kết nối): đứng đúng chỗ cũ (${o.map} ${o.x},${o.y} / ${cu.map} ${cu.x},${cu.y})`);
await p.close();

// Thẻ mới (mở game lại): chỗ cũ ghi cách đây `phut` phút
async function theMoi(phut) {
  const q = await ctx.newPage();
  q.on('pageerror', e => errs.push(e.message));
  await q.addInitScript(([cu, phut]) => { localStorage.setItem('p2d-vi-tri', JSON.stringify({ ai: cu.ai, map: cu.map, x: cu.x, y: cu.y, w: cu.w, t: Date.now() - phut * 60e3 })); }, [cu, phut]);
  await q.goto(`http://localhost:${PORT}/?thu=1`);
  await vao(q);
  const kq = { ...(await q.evaluate(() => ({ map: window.__game.map.id, x: Math.round(window.__game.player.x), y: Math.round(window.__game.player.y) }))), cach: await cachTran(q) };
  await q.close();
  return kq;
}
o = await theMoi(2);
thu(o.map === cu.map && Math.hypot(o.x - cu.x, o.y - cu.y) < 24, `mở lại trong 5 phút: đứng đúng chỗ cũ (${o.map} ${o.x},${o.y})`);
o = await theMoi(6);
thu(o.map === G.tk && o.cach < 1.5, `mở game sau 6 phút (đăng nhập): giữa pháp trận Thiên Kiếm Tinh (${o.map}, cách tâm trận ${o.cach.toFixed(2)} ô)`);

if (errs.length) { console.log('LỖI TRANG:', errs.slice(0, 3)); hong++; }
console.log(hong ? `hoi-sinh.thu: HỎNG ${hong}` : 'hoi-sinh.thu: ok');
await b.close(); server.close(); process.exit(hong ? 1 : 0);
