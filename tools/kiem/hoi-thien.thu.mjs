// Bài thử hỏi lại (chủ dự án 25/11/2026, sau CSKH #237: bấm nhầm Phân giải mất kiếm phẩm Thiên +10): ở tấm chi tiết món, món phẩm
// Thiên trở lên bấm Phân giải / Bán / Tẩy luyện phải hiện hộp hỏi nhỏ; Thôi thì món còn nguyên; chọn đúng việc mới làm. Món phẩm thấp
// làm ngay như cũ (src/ui/hoi-thien.js, data/shop.json → hoi_lai).
// Chạy ở gốc kho: node tools/kiem/hoi-thien.thu.mjs   (cần playwright)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8798;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
async function vao() {
  await p.goto(`http://localhost:${PORT}/?thu=1`);
  await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
  await p.waitForTimeout(800);
  await p.tap('#btn-guest');
  await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
}
async function dongThoai() {
  for (let i = 0; i < 40 && await p.evaluate(() => window.__game.dialog.open); i++) {
    const c = await p.$('#dlg-choices .choice');
    if (c && await c.isVisible()) await c.tap().catch(() => {}); else await p.mouse.click(195, 760);
    await p.waitForTimeout(250);
  }
}
await vao(); await dongThoai();
await vao(); await dongThoai();
await p.evaluate(() => window.__game.closeAll?.());

// dựng tấm chi tiết món ngay trên trang (cùng hàm bảng Túi đồ / Nhân vật gọi)
await p.evaluate(async () => {
  const g = window.__game, s = g.save;
  const mk = (uid, rarity, plus) => ({ uid, base: 'thien-mach-kiem', rarity, lvl: 10, main: { atk: 32 }, plus, lines: [{ s: 'atk', t: 0, v: 4 }], cap: 3, sockets: [null, null, null], el: 'hoa' });
  s.bag.push(mk(90001, 'thien', 10), mk(90002, 'pham', 0), mk(90003, 'thien', 0));
  const { renderDetail } = window.__thu;
  const box = document.createElement('div'); box.id = 'thu-chi-tiet'; box.style.cssText = 'position:fixed;inset:0;z-index:70;background:#000;overflow:auto';
  document.body.append(box);
  window.__thuVe = uid => { box.innerHTML = ''; const st = { sel: uid }; renderDetail(g, st, box, () => window.__thuVe(uid), () => {}); };
});
const coMon = uid => p.evaluate(u => window.__game.save.bag.some(x => x.uid === u), uid);
const nut = async chu => { const h = await p.$$('#thu-chi-tiet .act-btn'); for (const x of h) if ((await x.textContent()).startsWith(chu)) return x; return null; };
const hop = () => p.$('.hn-nen');

// (1) Thiên +10: Phân giải → hỏi; Thôi → còn món
await p.evaluate(() => window.__thuVe(90001));
await (await nut('Phân giải')).click();
await p.waitForTimeout(200);
thu(!!await hop(), 'món Thiên +10: bấm Phân giải hiện hộp hỏi lại');
thu(await p.evaluate(() => /Thiên Mạch Kiếm.*\+10/.test(document.querySelector('.hn-chu')?.textContent || '')), 'hộp hỏi ghi tên món và +10');
thu(await coMon(90001), 'đang hỏi: món chưa mất');
await (await p.$('.hn-b.nho')).click();
await p.waitForTimeout(200);
thu(!await hop() && await coMon(90001), 'bấm Thôi: hộp đóng, món còn nguyên');
// chạm ra ngoài hộp cũng là thôi
await (await nut('Bán')).click(); await p.waitForTimeout(200);
thu(!!await hop(), 'món Thiên: bấm Bán hiện hộp hỏi lại');
await p.mouse.click(5, 5); await p.waitForTimeout(200);
thu(!await hop() && await coMon(90001), 'chạm ra ngoài: món còn nguyên');
// Tẩy luyện cũng hỏi
const tay = await nut('Tẩy luyện');
if (tay && !(await tay.isDisabled())) { await tay.click(); await p.waitForTimeout(200); thu(!!await hop(), 'món Thiên: bấm Tẩy luyện hiện hộp hỏi lại'); await (await p.$('.hn-b.nho')).click(); await p.waitForTimeout(200); }
else {
  await p.evaluate(() => { const s = window.__game.save; s.mats['tay-luyen-thach'] = 999; s.lingshi = 9e6; window.__thuVe(90001); });
  const t2 = await nut('Tẩy luyện'); await t2.click(); await p.waitForTimeout(200);
  thu(!!await hop(), 'món Thiên: bấm Tẩy luyện hiện hộp hỏi lại'); await (await p.$('.hn-b.nho')).click(); await p.waitForTimeout(200);
}
thu(await p.evaluate(() => window.__game.save.bag.find(x => x.uid === 90001)?.lines.length === 1), 'Thôi tẩy luyện: món không thêm dòng');
// chọn Phân giải thật
await p.evaluate(() => window.__thuVe(90001));
await (await nut('Phân giải')).click(); await p.waitForTimeout(200);
await (await p.$('.hn-b.gold')).click(); await p.waitForTimeout(300);
thu(!await coMon(90001), 'chọn Phân giải trong hộp: món được phân giải');
// (2) Thiên chưa cường hoá cũng hỏi
await p.evaluate(() => window.__thuVe(90003));
await (await nut('Bán')).click(); await p.waitForTimeout(200);
thu(!!await hop(), 'món Thiên chưa cường hoá: bấm Bán cũng hỏi');
await (await p.$('.hn-b.gold')).click(); await p.waitForTimeout(300);
thu(!await coMon(90003), 'chọn Bán: món được bán');
// (3) Phàm: làm ngay, không hỏi
await p.evaluate(() => window.__thuVe(90002));
await (await nut('Phân giải')).click(); await p.waitForTimeout(300);
thu(!await hop() && !await coMon(90002), 'món Phàm: Phân giải làm ngay, không hỏi');
thu(!errs.length, `không lỗi JavaScript${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
console.log(hong ? `HỎNG ${hong} mục` : 'ĐẠT hết');
process.exit(hong ? 1 : 0);
