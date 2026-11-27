// Bài thử hiệu ứng riêng của ba kỹ năng đầu game trong trình duyệt (chủ dự án 26/11/2026 16:22; src/game/kn-fx.js, src/render/draw-kn-fx.js), trên bản
// đã gói, chơi khách. Bấm đúng ba nút kỹ năng ở mép phải, lần lượt cả bảy kỹ năng (Phá Vân Thức, năm kỹ năng theo hệ của Lão Thiết, Liệp Phong Bộ):
// mỗi lần bấm phải có màn diễn riêng và đủ hạt; hiệu ứng được vẽ thật (vùng trước mặt nhân vật sáng hẳn lên so với lúc chưa bấm); bắn đúng số đạn;
// quái trước mặt mất máu, cỡ máu mất giữa các kỹ năng vẫn theo mult khai trong data (đợt này chỉ làm hiệu ứng, không đổi sát thương); kêu đúng tiếng
// riêng; không khựng hình; màn diễn tự hết; đổi bản đồ thì dọn sạch; không lỗi JavaScript.
// Chạy: cd _site && node ../tools/kiem/ky-nang-ve.thu.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8817;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.map': 'application/json' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
const doc = async f => JSON.parse(await readFile(join(process.cwd(), f), 'utf8'));
const KN = await doc('data/ky-nang.json'), cfg = await doc('data/config.json'), TC = await doc('data/tieng-chieu.json');
const HE = Object.values(KN.hoc).find(h => h.he).he;   // hệ → kỹ năng Lão Thiết dạy
const BAY = ['pha-van-thuc', ...Object.values(HE), 'liep-phong-bo'];
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
thu(BAY.length === 7 && BAY.every(id => KN.chieu[id]?.ve), `bảy kỹ năng đầu game đều khai màn diễn riêng (${BAY.map(id => KN.chieu[id]?.ve).join(', ')})`);

const b = await chromium.launch(), errs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.route(/supabase-js|posthog/, r => r.abort());
const flags = { ...Object.fromEntries(cfg.season.open_flags.map(f => [f, true])), ...Object.fromEntries(Object.values(KN.hoc).map(h => [h.co, true])) };
const save = { step: 30, stepDone: true, storyV: 2, mua: 2, name: 'Người Thử Chiêu', map: 'dao-xich-dien', spawn: 'vao', element: 'hoa', weapon: 'kiem', realm: 1, layer: 3, qi: 0, gioi: 'nam', flags,
  knSach: Object.fromEntries(BAY.map(k => [k, [1]])), knO: ['pha-van-thuc', HE.hoa, 'liep-phong-bo'],
  visited: { 'thien-kiem-phong': true, 'thanh-khe': true, 'dao-xich-dien': true }, ht: { intro: 1 }, tiem: { toc: 'nhan', goc: { atk_pct: 3, hp_pct: 3, def_pct: 3 }, cong: {}, max: 2 }, theChat: 'moc-linh' };
await ctx.addInitScript(s => { if (!localStorage.getItem('p2d.save.v1:guest')) localStorage.setItem('p2d.save.v1:guest', s); }, JSON.stringify(save));
const p = await ctx.newPage();
p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 }); await p.waitForTimeout(600); await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
await p.evaluate(() => setInterval(() => {   // thoại, bảng lúc vào game: cho qua (hộp thoại mở thì vòng game đứng chờ)
  const g = window.__game;
  if (g.dialog.open) { const c = document.querySelector('#dlg-choices .choice'); if (c && c.offsetParent) c.click(); else g.dialog.skip?.(); }
  for (const e of document.querySelectorAll('.ht-back')) e.click();
}, 150));
// Tới bãi quái Xích Diễm Tinh. Dựng cảnh cố định cho mọi lần bấm (máy CI chậm, quái tự đi lại thì đạn trúng con khác hay trượt: lần đầu bài này đỏ vì
// thế): bốn con quái thường bị ghim thành đội hình ngay trước mặt, các con khác dời ra xa; mình không bạo kích; ghi tiếng game kêu.
await p.evaluate(async () => {
  const g = window.__game, wait = ms => new Promise(q => setTimeout(q, ms));
  if (g.map.id !== 'dao-xich-dien') await g.travel('dao-xich-dien', 'vao', false, { force: true });
  await wait(1500);
  g.auto = false; g.thuTieng = [];
  const cu = g.sfx; g.sfx = (n, v) => { g.thuTieng.push(n); return cu.call(g, n, v); };
  const sp = g.map.def.spawners[0], c = g.map.center(sp.at[0], sp.at[1]), xa = g.map.center(3, 3), CHO = [[-10, 0], [14, -10], [14, 10], [40, 0]];
  window.__dx = -56; window.__giu = 1;
  setInterval(() => {
    const q = g.player; q.hp = q.maxHp; q.mp = q.maxMp ?? 999; q.crit = 0; if (q.st) q.st.crit = 0;
    let i = 0; const bon = [];
    for (const m of g.mobs) { if (m.dead) continue; const o = !m.elite && i < 4 ? CHO[i++] : null; m.x = o ? c.x + o[0] : xa.x; m.y = o ? c.y + o[1] : xa.y; if (o) bon.push(m); }
    window.__bon = bon;
    if (window.__giu) { q.x = c.x + window.__dx; q.y = c.y; q.face = { x: 1, y: 0 }; }
  }, 16);
});
await p.waitForFunction(() => window.__game.mobs.filter(m => !m.dead && !m.elite).length >= 4, null, { timeout: 30000 });

// Đứng cách đội hình quái một quãng dx, mặt về phía chúng; dọn hồi chiêu; đo độ sáng vùng trước mặt rồi bấm nút ô i và theo dõi từng khung hình 1,25 giây game
const bam = (i, id, dx) => p.evaluate(async ([i, id, dx]) => {
  const g = window.__game, q = g.player, wait = ms => new Promise(r => setTimeout(r, ms)), khung = () => new Promise(r => requestAnimationFrame(r));
  const lo = g.save.knO.slice(); lo[i] = id; g.save.knO = lo;
  window.__dx = dx; window.__giu = 1; q.knCd = [0, 0, 0];
  await wait(250);
  const M0 = 9e7, bon = window.__bon.slice(); for (const m of g.mobs) m.hp = m.maxHp = M0;   // bon: bốn con trong đội hình lúc bấm
  g.knFx = null; g.bullets = []; g.thuTieng.length = 0;
  await wait(120);
  const cv = document.querySelector('canvas'), c2 = document.createElement('canvas'); c2.width = 120; c2.height = 80;
  const x2 = c2.getContext('2d', { willReadFrequently: true }), sang = () => {   // độ sáng trung bình một ô 120 × 80 điểm CSS trước mặt nhân vật (nhân vật ở giữa màn)
    const k = cv.width / cv.clientWidth; x2.drawImage(cv, (cv.clientWidth / 2 - 10) * k, (cv.clientHeight / 2 - 50) * k, 120 * k, 80 * k, 0, 0, 120, 80);
    const d = x2.getImageData(0, 0, 120, 80).data; let s = 0; for (let j = 0; j < d.length; j += 4) s += Math.max(d[j], d[j + 1], d[j + 2]); return s / (120 * 80);
  };
  let truoc = 0; for (let n = 0; n < 4; n++) { await khung(); truoc = Math.max(truoc, sang()); }   // mức sáng nền: lấy khung sáng nhất trước khi bấm
  const nut = document.getElementById('btn-k' + i), r = nut.getBoundingClientRect();
  const o = { ten: g.data.skills[id].name, nut: !!(nut.offsetParent && r.width > 20), truoc, max: truoc, fx: 0, hat: 0, dan: 0, kieu: [], stop: 0 };
  window.__giu = 0;   // thả cho Liệp Phong Bộ lướt đi
  for (const t of ['pointerdown', 'pointerup']) nut.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 1, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }));
  nut.click?.();
  const t1 = performance.now(), g1 = g.time;
  while (g.time - g1 < 1.25 && performance.now() - t1 < 9000) {   // 1,25 giây theo đồng hồ game (máy chậm thì đồng hồ game đi chậm hơn đồng hồ thật)
    await khung();
    const S = g.knFx; o.max = Math.max(o.max, sang()); o.stop = Math.max(o.stop, g.hitstop || 0);
    if (S) { o.fx = Math.max(o.fx, S.fx.length); o.hat = Math.max(o.hat, S.hat.length); for (const f of S.fx) if (!o.kieu.includes(f.k)) o.kieu.push(f.k); }
    o.dan = Math.max(o.dan, g.bullets.filter(x => x.sk === id).length);
  }
  const mat = bon.map(m => M0 - m.hp).filter(v => v > 0 && v < 1e6);   // chỉ tính bốn con trong đội hình (con bị dời ra xa có thể tự hồi về máu gốc)
  o.mat = mat.reduce((a, v) => a + v, 0); o.matMot = Math.max(0, ...mat); o.con = mat.length;   // tổng máu mất, cú nặng nhất vào một con, số con trúng
  o.cd = q.knCd[i]; o.tieng = [...new Set(g.thuTieng)];
  window.__giu = 1;
  const t2 = performance.now(), g2 = g.time;
  while (g.time - g2 < 1.4 && performance.now() - t2 < 9000) await wait(50);
  o.du = (g.knFx?.fx.length || 0) + (g.knFx?.hat.length || 0);
  return o;
}, [i, id, dx]);

const DX = { projectile: -56, multi: -56, aoe: -34, dash: -52 };   // chỗ đứng so với tâm đội hình quái (con gần nhất ở -10)
const kq = {};
for (const id of BAY) {
  const s = KN.chieu[id], i = id === 'pha-van-thuc' ? 0 : id === 'liep-phong-bo' ? 2 : 1;
  const o = kq[id] = await bam(i, id, s.type === 'aoe' && !s.offset ? -22 : DX[s.type]);
  thu(o.nut && o.cd > 0, `${o.ten}: nút ô ${i + 1} bấm được, vào hồi chiêu`);
  thu(o.fx >= 1 && o.kieu.length >= 1 && o.hat >= 8, `${o.ten}: có màn diễn riêng (${o.kieu.join(', ')}; nhiều nhất ${o.hat} hạt)`);
  thu(o.max - o.truoc > 8, `${o.ten}: hiệu ứng được vẽ thật, vùng trước mặt sáng hẳn lên lúc ra chiêu (${o.truoc.toFixed(0)} → ${o.max.toFixed(0)})`);
  if (s.type === 'projectile' || s.type === 'multi') thu(o.dan === (s.count || 1), `${o.ten}: bắn đúng ${s.count || 1} viên đạn (đang ${o.dan})`);
  thu(o.mat > 0 && o.con >= 1, `${o.ten}: quái trước mặt mất máu (${o.con} con, tổng ${Math.round(o.mat)})`);
  const B = TC.by_skill[id], can = [B.c, s.explode ? B.b : B.h].map(v => [].concat(v)[0]);
  thu(can.every(n => o.tieng.includes(n)), `${o.ten}: kêu tiếng riêng (${can.join(', ')}; đã kêu ${o.tieng.filter(n => /^(kn|sk)\./.test(n)).join(', ')})`);
  thu(o.stop === 0, `${o.ten}: không khựng hình (game.hitstop cao nhất ${o.stop})`);
  thu(o.du === 0, `${o.ten}: màn diễn tự hết sau 2,6 giây game (còn ${o.du})`);
}
// Sát thương giữ nguyên: cùng công, cú nặng nhất vào một con chia cho mult của các kỹ năng phải cùng cỡ (Phá Vân Thức làm mốc). Mỗi đòn dao động ngẫu nhiên nên chỉ
// bắt lệch lớn (một đòn bị tính hai lần, hệ số bị đổi); số mult từng kỹ năng đã có tools/kn-fx.test.mjs ghim.
{
  const moc = kq['pha-van-thuc'].matMot / KN.chieu['pha-van-thuc'].mult;
  for (const id of ['han-nhan', 'liep-phong-bo', 'thach-nhan', 'dang-nhan']) {
    const tl = kq[id].matMot / KN.chieu[id].mult / moc;
    thu(tl > 0.6 && tl < 1.6, `${kq[id].ten}: một cú vào một con đúng cỡ theo mult ${KN.chieu[id].mult} (lệch ${(tl * 100 - 100).toFixed(0)}% so với Phá Vân Thức)`);
  }
}
// Đổi bản đồ: dọn sạch màn diễn dở
const don = await p.evaluate(async () => {
  const g = window.__game, wait = ms => new Promise(r => setTimeout(r, ms));
  g.player.knCd = [0, 0, 0]; window.__giu = 0;
  const nut = document.getElementById('btn-k1'), r = nut.getBoundingClientRect();
  for (const t of ['pointerdown', 'pointerup']) nut.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 1, clientX: r.x + 5, clientY: r.y + 5 }));
  await wait(120);
  const co = (g.knFx?.fx.length || 0) + (g.knFx?.hat.length || 0);
  await g.travel('thien-kiem-phong', 'vao', false, { force: true });
  return { co, sau: (g.knFx?.fx.length || 0) + (g.knFx?.hat.length || 0) };
});
thu(don.co > 0 && don.sau === 0, `đổi bản đồ giữa màn diễn: dọn sạch (trước ${don.co}, sau ${don.sau})`);
await p.waitForTimeout(800);
thu(errs.length === 0, `không lỗi JavaScript${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
console.log(hong ? `\n${hong} mục HỎNG` : '\nKỹ năng đầu game: đạt hết');
process.exit(hong ? 1 : 0);
