// Bài thử Bộ trang bị (chủ dự án 27/11/2026 00:16; data/items.json → bo_do, src/game/bo-do.js, src/ui/bo-do-hang.js): lưu đồ đang mặc vào
// Bộ 1, Bộ 2; chạm Bộ 1 là mặc lại đúng món; món đã bán thì bỏ qua ô đó; ô khoá chơi khách không mở được (máy chủ mới trừ Tiên Ngọc);
// bản lưu tự nâng boMo thì máy khách vẫn không quá max.
// Chạy ở gốc kho: node tools/kiem/bo-do.thu.mjs   (cần playwright)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8806;
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
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
await p.waitForTimeout(800);
await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
await p.evaluate(() => window.__game.closeAll?.());

await p.evaluate(async () => {
  const g = window.__game, s = g.save;
  const mk = (uid, base) => ({ uid, base, rarity: 'pham', lvl: 1, main: { atk: 3 }, plus: 0, lines: [], cap: 1, sockets: [null], el: 'kim' });
  s.bag.push(mk(91001, 'thiet-kiem'), mk(91002, 'thien-mach-kiem'), mk(91003, 'thiet-khoi'));
  s.equip['vu-khi'] = 91001; s.equip.mu = 91003;
  const { boDoHang } = window.__thu;
  const box = document.createElement('div'); box.id = 'thu-bd'; box.style.cssText = 'position:fixed;inset:0;z-index:70;background:#000';
  document.body.append(box);
  window.__thuVe = () => { box.innerHTML = ''; box.append(boDoHang(g, window.__thuVe, window.__thuVe)); };
  window.__thuVe();
});
const o = async i => (await p.$$('#thu-bd .bd-o'))[i];
const luu = () => p.click('#thu-bd .bd-luu');
const eq = () => p.evaluate(() => ({ ...window.__game.save.equip }));

thu((await p.$$('#thu-bd .bd-o')).length === 4, 'có 4 ô Bộ');
thu(await p.evaluate(() => document.querySelectorAll('#thu-bd .bd-o.khoa').length === 2), 'ô 3, 4 khoá (2 ô miễn phí)');
await luu(); await p.waitForTimeout(100);
thu(await p.evaluate(() => window.__game.save.boDo.ds[0]?.eq['vu-khi'] === 91001), 'Lưu: Bộ 1 ghi kiếm đang mặc');
await (await o(1)).click(); await p.waitForTimeout(100);   // Bộ 2 trống: chọn
thu(await p.evaluate(() => window.__game.save.boDo.dang === 1), 'chạm Bộ 2 trống: chọn Bộ 2');
await p.evaluate(() => { const s = window.__game.save; s.equip['vu-khi'] = 91002; delete s.equip.mu; });
await luu(); await p.waitForTimeout(100);
await (await o(0)).click(); await p.waitForTimeout(100);
let e = await eq();
thu(e['vu-khi'] === 91001 && e.mu === 91003, 'chạm Bộ 1: mặc lại kiếm và mũ của Bộ 1');
await (await o(1)).click(); await p.waitForTimeout(100);
e = await eq();
thu(e['vu-khi'] === 91002 && e.mu === undefined, 'chạm Bộ 2: kiếm của Bộ 2, tháo mũ');
await p.evaluate(() => { const s = window.__game.save; s.bag = s.bag.filter(x => x.uid !== 91003); });   // bán mũ
await (await o(0)).click(); await p.waitForTimeout(100);
e = await eq();
thu(e['vu-khi'] === 91001 && e.mu === undefined, 'mũ đã bán: Bộ 1 vẫn mặc kiếm, bỏ qua ô mũ');
// 27/11/2026 03:21: Lưu ghi cả kỹ năng, thân pháp, công pháp, linh thú, thú cưỡi, khôi lỗi; dùng bộ thì đổi theo
const them = await p.evaluate(async () => {
  const g = window.__game, s = g.save;
  const kn = window.__thu.bo, tp = kn, bo = kn;   // bản đã gói không có tệp rời /src/…: hàm treo ở window.__thu (src/game/thu-moc.js)
  const KN = Object.keys(g.data['ky-nang'].chieu), TPS = Object.keys(g.data['than-phap'].thuc), TC = Object.keys(g.data.techniques.list || {});
  const PET = Object.keys(g.data.pets.pets), MT = Object.keys(g.data.pets.mounts), KL = Object.keys(g.data.pets.shop.puppets);
  for (const id of KN.slice(0, 4)) kn.nhanSach(g, id);
  for (const id of TPS.slice(0, 3)) tp.tpHoc?.(g, id);
  s.techs ??= {}; for (const id of TC.slice(0, 4)) s.techs[id] ??= { lv: 1, exp: 0 };
  s.pets ??= {}; s.pets[PET[0]] ??= { lv: 1, exp: 0 }; s.pets[PET[1]] ??= { lv: 1, exp: 0 };
  s.mounts ??= {}; s.mounts[MT[0]] = true; s.mounts[MT[1]] = true;
  s.comps ??= {}; s.comps[KL[0]] = { lv: 1, exp: 0 }; s.comps[KL[1]] = { lv: 1, exp: 0 };
  const dat = k => {   // cấu hình k (0 hoặc 1)
    kn.knDat(g, 0, KN[k]); kn.knDat(g, 1, KN[2 + k]);
    s.techSlots = [TC[k], TC[2 + k]];
    s.pet = PET[k]; s.mount = MT[k]; s.mountKey = MT[k];
    s.companion = KL[k]; s.companion2 = null;
    s.equip['vu-khi'] = k ? 91002 : 91001; tp.tpDat(g, 1, TPS[1 + k]);
  };
  const doc = () => ({ kn: kn.knO(g).slice(0, 2), cp: (s.techSlots || []).slice(), pet: s.pet, mk: s.mountKey, kl: s.companion, vk: s.equip['vu-khi'], tp: tp.tpO(g).slice() });
  dat(0); bo.boLuu(g, 0); const a = doc();
  dat(1); bo.boLuu(g, 1); const b = doc();
  bo.boMac(g, 0); const a2 = doc();
  bo.boMac(g, 1); const b2 = doc();
  delete s.pets[PET[0]];   // linh thú của Bộ 1 đã mất
  const k = bo.boMac(g, 0), a3 = doc();
  return { a, b, a2, b2, a3, k, khac: JSON.stringify(a) !== JSON.stringify(b) };
});
thu(them.khac && JSON.stringify(them.a2) === JSON.stringify(them.a), 'Bộ 1: kỹ năng, công pháp, linh thú, thú cưỡi, khôi lỗi, vũ khí về đúng lúc lưu ' + JSON.stringify(them.a2));
thu(JSON.stringify(them.b2) === JSON.stringify(them.b), 'Bộ 2: cũng đổi đủ ' + JSON.stringify(them.b2));
thu(them.k >= 1 && them.a3.kn[0] === them.a.kn[0] && them.a3.mk === them.a.mk && them.a3.pet === them.b.pet, `linh thú Bộ 1 đã mất: bỏ qua (${them.k} thứ), phần khác vẫn đổi`);
await (await o(2)).click(); await p.waitForTimeout(300);
const hop = await p.$('.hn-nen');
thu(!!hop && /60/.test(await p.textContent('.hn-chu')), 'ô 3 khoá: hỏi mở với 60 Tiên Ngọc');
await p.click('.hn-b.gold'); await p.waitForTimeout(300);
thu(await p.evaluate(() => !(window.__game.save.boMo > 2)), 'chơi khách: không tự mở được ô (máy chủ mới trừ Tiên Ngọc)');
thu(await p.evaluate(() => document.querySelectorAll('#thu-bd .bd-o')[3].disabled), 'ô 4 chưa mở được khi ô 3 còn khoá');
await p.evaluate(() => { window.__game.save.boMo = 99; window.__thuVe(); });
thu(await p.evaluate(() => document.querySelectorAll('#thu-bd .bd-o.khoa').length === 0 && document.querySelectorAll('#thu-bd .bd-o').length === 4), 'boMo lố: vẫn chỉ 4 ô');
thu(errs.length === 0, 'không lỗi JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
await b.close(); server.close();
console.log(hong ? `\n${hong} mục HỎNG` : '\nĐạt hết');
process.exit(hong ? 1 : 0);
