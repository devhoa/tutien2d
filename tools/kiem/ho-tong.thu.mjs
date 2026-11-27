// Bài thử Hộ Tông gia trì trong game thật (chủ dự án 26/11/2026 00:19: thành viên đứng trên tinh cầu của tông môn mình được cộng sức mạnh theo
// chức vụ, Tông chủ 60%, Phó tông chủ 50%, Trưởng lão 40%, Đệ tử 20%). Ba trình duyệt khách vào một tinh cầu tông môn giả qua PHÒNG GIẢ chạy
// đúng mã máy chủ phòng (tools/cloud/phong-gia.mjs → cloud/src/phong.js, ho-tong.js); phòng giả gắn chức vụ + tinh cầu tông môn cho từng máy
// như cổng vào thật gắn từ máy chủ dữ liệu. Soát: máy tông chủ, máy đệ tử được nhân Công, Sinh lực, Thủ đúng phần trăm, giữ tỉ lệ máu, HUD
// hiện "Hộ Tông +x%" và lực chiến đã nhân; máy người ngoài không đổi gì; rời tinh cầu là hết; không lỗi JS.
// Không ra mạng. Chạy trong bản đã gói: cd _site && node ../tools/kiem/ho-tong.thu.mjs   (ANH=<thư mục> để chụp hình lúc đang có gia trì)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { taoPhongGia } from '../cloud/phong-gia.mjs';

const PORT = +(process.env.PORT || 8813), GOC = resolve(import.meta.dirname, '../..');
const H = JSON.parse(readFileSync(join(GOC, 'data/guild.json'), 'utf8')).ho_tong;
const KH = { id: '00000000-0000-4000-8000-00000000c0de', ten: 'Tinh Cầu Thử', mat_dat: 'co', hat: 4242, cap: 3, vong: 1, goc: 0, trong: false, bang: 'Thử', bay: [], rieng: {} };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
const { chromium } = await import('playwright').catch(() => createRequire(join(GOC, 'tools/x.mjs'))('playwright'));
const phong = await taoPhongGia({ khDs: [KH] }), trinh = await chromium.launch();
const kq = [], loi = [];
const ok = (ten, dat, them = '') => { kq.push(dat); console.log(`${dat ? '✅' : '❌'} ${ten}${them ? ' — ' + them : ''}`); };
const cho = async (f, ms = 8000, nhip = 100) => { const het = Date.now() + ms; let v; while (Date.now() < het) { v = await f(); if (v) return v; await new Promise(r => setTimeout(r, nhip)); } return v; };

// Một máy khách: khách không tài khoản, mã thử id, vào phòng giả; them: header phòng giả gắn (chức vụ, tinh cầu tông môn)
async function moMay(id, them) {
  const ctx = await trinh.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
  await ctx.route(/supabase-js|posthog/, r => r.abort());
  await ctx.routeWebSocket(u => u.pathname.endsWith('/ws'), ws => { phong.noi(ws, id, 'Thử ' + id, { 'x-power': '5000', ...them }); });
  const p = await ctx.newPage();
  p.on('pageerror', e => loi.push(`[${id}] ${e.message}`));
  await p.goto(`http://localhost:${PORT}/?thu=1&phong=${id}`);
  await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
  await p.waitForTimeout(600);
  await p.tap('#btn-guest');
  await p.waitForFunction(() => window.__game?.save && window.__game.player, null, { timeout: 30000 });
  await p.evaluate(kh => {
    const g = window.__game, d = g.dialog;
    for (const k of Object.keys(d)) if (typeof d[k] === 'function' && k !== 'close') d[k] = async () => null;
    d.open = false; const box = document.getElementById('dialog'); if (box) box.hidden = true;
    g.closeAll?.(); g.auto = false; g.khoaBo = true; g.noDeath = true;
    window.__bao = []; const goc = g.toast.bind(g); g.toast = (s, t) => { window.__bao.push(String(s)); return goc(s, t); };
    window.__thu.khState(g).list.push(kh); window.__thu.khRebuild(g, kh.id, kh.bay);   // tinh cầu tông môn giả: dựng như khai-hoang.js khLoad
  }, KH);
  const xem = () => p.evaluate(() => { const g = window.__game, q = g.player; return { map: g.map.id, hp: q.hp, max: q.maxHp, atk: q.atk, def: q.st.def, ht: q.st.hoTong || 0, bao: g.hoTong?.pct || 0,
    sky: document.getElementById('sky').textContent, luc: document.getElementById('power').textContent.replace(/\D/g, ''), tin: window.__bao.slice() }; });
  const di = async map => { await p.evaluate(m => window.__game.travel(m, 'vao', false, { force: true }), map); await cho(async () => (await xem()).map === map, 15000); };
  return { id, p, xem, di, dong: () => ctx.close() };
}
const gan = (a, b) => Math.abs(a - b) <= 1;   // làm tròn từng chỉ số

const may = { chu: await moMay('chu', { 'x-chuc': 'chu', 'x-tinh': KH.id, 'x-tong': encodeURIComponent('Thử') }), de: await moMay('de', { 'x-chuc': 'de', 'x-tinh': KH.id, 'x-tong': encodeURIComponent('Thử') }), ngoai: await moMay('ngoai') };
for (const [vai, m] of Object.entries(may)) {
  const pct = H.pct[vai] || 0, k = 1 + pct / 100;
  await m.p.evaluate(() => { const q = window.__game.player; q.hp = Math.round(q.maxHp / 2); });   // nửa máu: vào ra không được hồi máu
  const g0 = await m.xem();
  ok(`[${vai}] ở Thiên Kiếm Tinh chưa có gia trì`, g0.ht === 0 && !g0.sky.includes('Hộ Tông'), `máu ${g0.hp}/${g0.max}, công ${g0.atk}, thủ ${g0.def}`);
  await m.di(KH.id);
  const co = await cho(async () => { const v = await m.xem(); return (pct ? v.ht === pct : v.bao === 0 && v.map === KH.id) && v; }, 8000);
  const v = co || await m.xem();
  // HUD vẽ lại sau chỉ số một nhịp (lúc đang chuyển cảnh còn chậm hơn): chờ tới khi HUD theo kịp rồi mới soát, không soát đúng khung vừa đổi
  const u = (pct ? await cho(async () => { const x = await m.xem(); return x.ht === pct && x.sky.includes('Hộ Tông') && gan(+x.luc, +g0.luc * k) && x.tin.some(s => s.includes(`+${pct}%`)) && x; }, 8000) : null) || (await m.p.waitForTimeout(1200), await m.xem());
  if (pct) {
    ok(`[${vai}] phòng báo +${pct}%, máy nhân Công, Sinh lực, Thủ × ${k}`, u.ht === pct && gan(u.max, g0.max * k) && gan(u.atk, g0.atk * k) && gan(u.def, g0.def * k), `máu tối đa ${g0.max} → ${u.max}, công ${g0.atk} → ${u.atk}, thủ ${g0.def} → ${u.def}`);
    ok(`[${vai}] giữ tỉ lệ máu (không hồi máu nhờ vào ra)`, Math.abs(v.hp / v.max - g0.hp / g0.max) < 0.03, `${g0.hp}/${g0.max} → ${v.hp}/${v.max}`);
    ok(`[${vai}] HUD: dòng trời có "Hộ Tông +${pct}%", lực chiến × ${k}`, u.sky.includes(H.text.hud.replace('{pct}', pct)) && gan(+u.luc, +g0.luc * k), `"${u.sky}", lực chiến ${g0.luc} → ${u.luc}`);
    ok(`[${vai}] có một dòng báo gia trì`, u.tin.filter(s => s.includes(`+${pct}%`)).length === 1);
    if (process.env.ANH) await m.p.screenshot({ path: `${process.env.ANH}/ho-tong-${vai}.png` });
    await m.di('thien-kiem-phong');
    const r = await cho(async () => { const x = await m.xem(); return x.ht === 0 && +x.luc === +g0.luc && !x.sky.includes('Hộ Tông') && x.tin.includes(H.text.off) && x; }, 10000) || await m.xem();   // chờ cả HUD lẫn dòng báo theo kịp
    ok(`[${vai}] rời tinh cầu tông môn: chỉ số về gốc, giữ tỉ lệ máu`, r.ht === 0 && gan(r.max, g0.max) && gan(r.atk, g0.atk) && gan(r.def, g0.def) && Math.abs(r.hp / r.max - g0.hp / g0.max) < 0.03 && !r.sky.includes('Hộ Tông') && +r.luc === +g0.luc,
      `máu ${r.hp}/${r.max}, công ${r.atk}, lực chiến ${r.luc}`);
    ok(`[${vai}] có dòng báo hết gia trì`, r.tin.includes(H.text.off));
  } else ok(`[${vai}] người ngoài tới tinh cầu tông môn: không đổi gì`, u.ht === 0 && u.bao === 0 && u.max === g0.max && u.atk === g0.atk && u.def === g0.def && !u.sky.includes('Hộ Tông') && u.luc === g0.luc && !u.tin.some(s => s.includes('Hộ Tông')), `máu tối đa ${u.max}, công ${u.atk}`);
}
ok('không lỗi JS', !loi.length, loi.slice(0, 3).join(' | '));
for (const m of Object.values(may)) await m.dong();
await trinh.close(); server.close();
const hong = kq.filter(x => !x).length;
console.log(hong ? `\n❌ ${hong} chỗ hỏng` : '\n✅ Hộ Tông gia trì chạy đúng trên game: tông chủ, đệ tử được cộng ở tinh cầu tông môn; người ngoài và nơi khác thì không');
process.exit(hong ? 1 : 0);
