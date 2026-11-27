// Bài thử CÂU CÁ (chủ dự án 24/11/2026 00:38, docs/18-CAU-CA.md): khách vào game, đứng trên bến câu Thiên Kiếm Tinh.
// Soát: nút Thả câu ở nước thật; cắn câu → kéo → con vật bay về tay, vào giỏ, thẻ nhận hiện và ở lại; loài Địa phẩm giằng co (kéo trúng đủ
// lần thì lên, có lễ nhận quà); cần yếu kéo loài quá phẩm thì đứt dây; mục Câu cá có bốn mục; Lão Ngư Ông bán (khách tính ở máy, rẻ trước,
// con Thượng Cổ không quá trần ngày, bán riêng), khai trai ra châu; Tự câu tự kéo nhiều con; không lỗi JavaScript.
// Chạy ở gốc kho: node tools/kiem/cau-ca.thu.mjs   (cần playwright; NODE_PATH nếu cài chỗ khác)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8797;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
const visited = Object.fromEntries(['thien-kiem-phong', 'thanh-khe', 'dao-xich-dien', 'dao-han-bang'].map(k => [k, true]));
const save = { step: 52, stepDone: true, mua: 2, map: 'thien-kiem-phong', spawn: 'vao', element: 'moc', weapon: 'kiem', realm: 0, layer: 6, qi: 0, gioi: 'nu',
  flags: { 'dong-phu': true }, visited, lingshi: 2000000, tiem: { toc: 'nhan', goc: { atk_pct: 2 }, cong: {}, max: 2 } };
await ctx.route(/supabase-js|posthog/, r => r.abort());
await ctx.addInitScript(s => { try { localStorage.setItem('p2d.save.v1:guest', s); } catch { /* không có bộ nhớ */ } }, JSON.stringify(save));
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
await p.waitForTimeout(800);
await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
await p.waitForFunction(() => !window.__game.cheMan, null, { timeout: 20000 }).catch(() => {});
// hội thoại truyện, bảng của Hệ Thống: đóng liên tục (trừ lúc bài thử đang nói chuyện với Lão Ngư Ông / mở bảng)
await p.evaluate(() => {
  const g = window.__game, d = g.dialog;
  const tat = () => {
    if (!window.__giuThoai) { d.open = false; const box = document.getElementById('dialog'); if (box) box.hidden = true; }
    for (const e of document.querySelectorAll('.ht-back')) e.hidden = true;
    if (!window.__giuUi && g.uiOpen && g.uiOpen !== 'qua') { g.closeAll?.(); g.uiOpen = false; }
  };
  tat(); setInterval(tat, 250);
});
await p.waitForTimeout(1500);

let hong = 0;
const thu = (dk, ten, them = '') => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}${them ? '  (' + them + ')' : ''}`); if (!dk) hong++; };
const cho = async (fn, ms = 4000, buoc = 100) => { for (let t = 0; t < ms; t += buoc) { const v = await p.evaluate(fn); if (v) return v; await p.waitForTimeout(buoc); } return null; };
const bam = () => p.keyboard.press('KeyE');
const dungBen = () => p.evaluate(() => { const g = window.__game, c = g.map.center(35, 99); g.player.x = c.x; g.player.y = c.y; g.player.meditating = false; g.fish = null; g.tuCau = false; });
const nhan = () => p.evaluate(() => window.__game.actLabel);
// thả câu, ép loài kế tiếp, cho cắn ngay (bỏ chờ, bỏ rỉa)
const thaVaCan = async ma => {
  await dungBen(); await p.waitForTimeout(300);
  await bam(); await p.waitForTimeout(400);
  await p.evaluate(ma => { const g = window.__game, f = g.fish; if (!f) return; g.cauEp = ma; f.st = 'cho'; f.t = 0.02; f.ria = []; }, ma);
  return cho(() => window.__game.fish?.st === 'can', 3000);
};

// 1. Nút Thả câu ở bến (nước thật)
await dungBen(); await p.waitForTimeout(400);
const nhanBen = await nhan();
thu(nhanBen === 'Thả câu', 'Đứng trên bến câu: nút hành động là Thả câu', nhanBen);
await p.evaluate(() => { const g = window.__game, s = g.save; s.mats['giun-dat'] = 40; s.cau = { gap: true, moi: 'giun-dat' }; });

// 2. Cắn câu → kéo → bay về tay → vào giỏ, thẻ nhận ở lại
const truocLN = await p.evaluate(() => window.__game.save.mats['linh-ngu'] || 0);
thu(!!(await thaVaCan('linh-ngu')), 'Cá cắn câu (phao chìm, chờ kéo)');
await bam();
const bay = await cho(() => (window.__game.cauBay || []).some(b => b.id === 'linh-ngu'), 1500, 50);
thu(!!bay, 'Kéo: Linh Ngư bay khỏi nước về tay');
const vao = await cho(() => (window.__game.save.mats['linh-ngu'] || 0), 3000);
thu(vao === truocLN + 1 || vao === truocLN + 2, 'Linh Ngư vào giỏ', `${truocLN} → ${vao}`);
const the = await cho(() => { const e = document.getElementById('cau-the'); return e && !e.hidden && e.textContent.includes('Linh Ngư') ? e.textContent.slice(0, 60) : null; }, 3000);
thu(!!the, 'Thẻ nhận hiện tên con vừa câu', the || '');
await p.waitForTimeout(6000);
thu(await p.evaluate(() => { const e = document.getElementById('cau-the'); return !!e && !e.hidden; }), 'Thẻ nhận vẫn ở lại sau 6 giây (chưa bấm đóng)');

// 3. Loài Địa phẩm: giằng co với Hàn Thiết Can, kéo trúng đủ lần thì lên, có lễ nhận quà
await p.evaluate(() => { const g = window.__game; g.save.mats['han-thiet-can'] = 1; g.save.cau.can = 'han-thiet-can'; });
const truocKL = await p.evaluate(() => window.__game.save.mats['kim-ly'] || 0);
await thaVaCan('kim-ly'); await bam();
const gc = await cho(() => window.__game.fish?.st === 'gc' && window.__game.fish.gc.can, 2000, 50);
thu(gc === 2, 'Kim Lý (Địa phẩm): vào giằng co, cần 2 lần kéo trúng', String(gc));
for (let i = 0; i < 3; i++) { await p.evaluate(() => { const g = window.__game.fish?.gc; if (g) g.kim = g.z; }); await bam(); await p.waitForTimeout(150); }
const kl = await cho(() => (window.__game.save.mats['kim-ly'] || 0), 4000);
thu(kl > truocKL, 'Giằng co đủ: Kim Lý vào giỏ', `${truocKL} → ${kl}`);
const le = await cho(() => { const q = document.getElementById('qua'); return q && !q.hidden; }, 4000);
thu(!!le, 'Loài Địa phẩm có lễ nhận quà');
await p.evaluate(() => { for (const e of document.querySelectorAll('#qua .q-btn')) if (!e.hidden) e.click(); });
await p.waitForTimeout(600);

// 4. Cần yếu, loài quá phẩm cần chịu: đứt dây
await p.evaluate(() => { window.__game.save.cau.can = 'truc-can'; });
await thaVaCan('kim-ly'); await bam();
thu(!!(await cho(() => window.__game.fish?.st === 'dut', 1500, 50)), 'Trúc Can kéo Kim Lý: đứt dây');
await p.waitForTimeout(900);

// 5. Mục Câu cá: bốn mục Cá / Mồi / Cần / Món
await p.evaluate(() => { window.__giuUi = true; window.__game.openSelf('ca', 'ca'); });
await p.waitForTimeout(800);
const muc = await p.evaluate(() => [...document.querySelectorAll('.sv-subs .sv-sb')].map(e => e.textContent.trim()));
thu(['Cá', 'Mồi', 'Cần', 'Món'].every(t => muc.some(m => m.includes(t))), 'Mục Câu cá có Cá / Mồi / Cần / Món', muc.join(' | '));
await p.evaluate(() => { window.__game.toggleSelf(); window.__giuUi = false; });
await p.waitForTimeout(500);

// 6. Lão Ngư Ông (khách: tính ở máy như máy chủ): bán riêng con Thượng Cổ = trần ngày, bán hết rẻ trước, khai trai
await p.evaluate(() => { const s = window.__game.save; s.cau.ban = null; s.mats['linh-ngu'] = 30; s.mats['kim-ly'] = 40; s.mats['bac-minh-con'] = 1; s.mats['co-bang'] = 2; });
await p.evaluate(async () => { const d = window.__game.dialog; for (let i = 0; i < 6; i++) { d.cancel?.(); await new Promise(r => setTimeout(r, 120)); } });
await p.evaluate(() => { window.__giuThoai = true; window.__giuUi = true; const g = window.__game, n = g.npcs.find(n => n.id === 'lao-ngu-ong'); g.player.x = n.x - 10; g.player.y = n.y + 2; g.fish = null; });
await p.waitForTimeout(400);
const chon = async re => { const ok = await p.evaluate(src => { const e = [...document.querySelectorAll('#dlg-choices button')].find(e => new RegExp(src).test(e.textContent)); e?.click(); return !!e; }, re); await p.waitForTimeout(900); return ok; };
const qua = async () => { for (let i = 0; i < 14; i++) { if (await p.evaluate(() => document.querySelectorAll('#dlg-choices button').length > 0)) return; await p.evaluate(() => document.getElementById('dialog')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await p.waitForTimeout(350); } };
const loi = () => p.evaluate(() => document.getElementById('dlg-text')?.textContent || '');
const lt = () => p.evaluate(() => window.__game.save.lingshi);
const tran = await p.evaluate(() => window.__game.data.fishing.ban.tran[window.__game.save.realm || 0]);
await bam(); await p.waitForTimeout(1200); await qua();
thu(await chon('Bán đồ câu'), 'Lão Ngư Ông: có mục Bán đồ câu được'); await qua();
const lt0 = await lt();
thu(await chon('Bán riêng'), 'Có nút Bán riêng con Thượng Cổ'); await qua();
const lt1 = await lt();
thu(lt1 - lt0 === tran && (await loi()).includes('dốc hết túi'), 'Bán riêng Bắc Minh Côn: đúng bằng trần ngày', `+${lt1 - lt0}, trần ${tran}`);
await p.evaluate(() => { window.__game.save.cau.ban = null; });   // sang ngày mới (giả)
await chon('Bán đồ câu'); await qua();
await chon('Bán hết'); await qua();
const lt2 = await lt(), con = await p.evaluate(() => ({ ln: window.__game.save.mats['linh-ngu'] || 0, kl: window.__game.save.mats['kim-ly'] || 0 }));
thu(lt2 > lt1 && con.ln === 0 && con.kl === 0, 'Bán hết (rẻ trước): giỏ trống, có Linh Thạch', `+${lt2 - lt1}, ${JSON.stringify(con)}`);
await chon('Khai trai'); await qua(); await chon('Khai trai'); await qua();
const khai = await loi(), chau = await p.evaluate(() => window.__game.save.mats['tran-chau'] || 0);
thu(khai.includes('Khai 2 con') && chau >= 6, 'Khai 2 Cổ Bạng: ra ít nhất 6 Trân Châu', khai.slice(0, 90));
await p.evaluate(() => { window.__game.dialog.cancel?.(); window.__giuThoai = false; window.__giuUi = false; });
await p.waitForTimeout(600);

// 7. Tự câu: tự thả, tự kéo, nhiều con (rút ngắn chờ)
await dungBen(); await p.waitForTimeout(300);
await p.evaluate(() => { const g = window.__game; g.save.cau.can = 'truc-can'; g.save.mats['giun-dat'] = 40; g.cauEp = undefined; });
await bam(); await p.waitForTimeout(500);
await p.evaluate(() => { window.__game.tuCau = true; window.__nhanh = setInterval(() => { const f = window.__game.fish; if (f && (f.st === 'cho' || f.st === 'quang') && f.t > 0.3) f.t = 0.3; if (f) f.ria = []; }, 80); });
const dem0 = await p.evaluate(() => window.__game.save.cau.dem?.n || 0);
await p.waitForTimeout(14000);
const dem1 = await p.evaluate(() => window.__game.save.cau.dem?.n || 0);
await p.evaluate(() => { clearInterval(window.__nhanh); window.__game.tuCau = false; window.__game.fish = null; });
thu(dem1 - dem0 >= 3, 'Tự câu 14 giây: tự kéo được nhiều con', `${dem1 - dem0} con`);

thu(!errs.length, 'Không lỗi JavaScript', errs.slice(0, 3).join(' | '));
await b.close(); server.close();
console.log(hong ? `\n❌ ${hong} mục hỏng` : '\n✅ Câu cá: đạt hết');
process.exit(hong ? 1 : 0);
