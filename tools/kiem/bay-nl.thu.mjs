// Bài thử BAY HÚT NGUYÊN LIỆU (người chơi 23/11/2026 18:52: "đánh nhau bị ma tu rượt, thú chạy chậm mình đổi qua ngự kiếm thì bị như này,
// lần nào cũng bị": cả màn trắng xoá, chỉ còn tên mình và giao diện). Gốc (p2d_loi #145, #153): đang bay thì đồ rơi trong 160 tự hút về
// chân; nguyên liệu rơi bên đường mà đã nhặt đủ phần giờ này thì vẫn bị hút tới đúng chỗ chân (d = 0), chia 0 / 0 ra toạ độ NaN, cột
// sáng gọi createLinearGradient với NaN là ném lỗi giữa ctx.save() và ctx.restore(): lớp vẽ cộng sáng 'lighter' treo lại, mọi khung sau
// vẽ chồng sáng thành trắng; món NaN không bao giờ được nhặt nên lỗi lặp mãi.
// Bài này: khách vào game, đã nhặt đủ nguyên liệu trong giờ, thả một nguyên liệu cạnh chân rồi bật Bay; soát toạ độ món, lỗi khung vẽ,
// màu giữa màn. Thêm: khung vẽ báo lỗi một lần (giả) thì khung sau vẫn vẽ đúng (không treo 'lighter').
// Chạy ở gốc kho: node tools/kiem/bay-nl.thu.mjs   (cần playwright; NODE_PATH nếu cài chỗ khác)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8796;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 384, height: 757 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
// Bản lưu khách đã qua phần mở đầu (23/11/2026: truyện mở đầu dài ra, hội thoại còn mở thì game dừng cập nhật đồ rơi, bài này trượt lúc được lúc không)
const save = { step: 52, stepDone: true, mua: 2, map: 'thanh-khe', element: 'moc', weapon: 'kiem', realm: 2, layer: 5, qi: 0, gioi: 'nu',
  visited: { 'thien-kiem-phong': true, 'thanh-khe': true }, tiem: { toc: 'nhan', goc: { atk_pct: 2 }, cong: {}, max: 2 } };
await ctx.route(/supabase-js|posthog/, r => r.abort());
await ctx.addInitScript(s => { try { localStorage.setItem('p2d.save.v1:guest', s); } catch { /* không có bộ nhớ */ } }, JSON.stringify(save));
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
await p.waitForTimeout(800);
await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
// hội thoại truyện, bảng chọn của Hệ Thống: thôi hiện (bài này chỉ thử bay hút đồ); bật lên giữa chừng thì đóng ngay (như truyen-tong.thu.mjs)
await p.evaluate(() => {
  const g = window.__game, d = g.dialog;
  for (const k of Object.keys(d)) if (typeof d[k] === 'function' && k !== 'close') d[k] = async () => null;
  const tat = () => { d.open = false; const box = document.getElementById('dialog'); if (box) box.hidden = true; g.closeAll?.(); g.uiOpen = false; for (const e of document.querySelectorAll('.ht-back')) e.hidden = true; };
  tat(); setInterval(tat, 250);
});
await p.waitForFunction(() => !window.__game.cheMan, null, { timeout: 20000 }).catch(() => {});

let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
// độ sáng trung bình một dải giữa màn (0–255): trắng xoá thì gần 255
const sang = () => p.evaluate(() => {
  const c = document.querySelector('canvas'), w = c.width, h = c.height, t = document.createElement('canvas');
  t.width = 64; t.height = 64; const g = t.getContext('2d');
  g.drawImage(c, w * 0.2, h * 0.35, w * 0.6, h * 0.3, 0, 0, 64, 64);
  const d = g.getImageData(0, 0, 64, 64).data; let s = 0;
  for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) / 3;
  return Math.round(s / (d.length / 4));
});
await p.waitForTimeout(1500);
const truoc = await sang();

// đã nhặt đủ 8 nguyên liệu trong giờ; một nguyên liệu rơi bên đường cách chân 30; người đứng yên, đủ linh lực, bật Bay
await p.evaluate(() => {
  const g = window.__game, pl = g.player, now = Date.now();
  g.save.nlGot = Array.from({ length: 12 }, (_, i) => ['thu-' + i, now - 1000]);
  g.loot.push({ kind: 'mat', payload: { id: 'linh-thao', n: 1 }, nl: 'thu-moi', map: g.map.id, die: now + 600000, x: pl.x + 30, y: pl.y - 6, t: 1, down: true });
  pl.mp = pl.mpMax || 100; pl.flying = true; pl.flyT = 0;
});
await p.waitForTimeout(3000);
const r = await p.evaluate(() => {
  const g = window.__game, l = g.loot.find(x => x.nl === 'thu-moi');
  return { con: !!l, x: l?.x, y: l?.y, d: l ? Math.hypot(l.x - g.player.x, l.y - g.player.y + 6) : null, bay: g.player.flying };
});
thu(r.con && Number.isFinite(r.x) && Number.isFinite(r.y), `nguyên liệu đã đủ phần giờ, đang bay: toạ độ món còn đúng số (${r.x?.toFixed?.(1)}, ${r.y?.toFixed?.(1)})`);
thu(r.d != null && r.d >= 5, `món nằm yên cách chân (${r.d?.toFixed?.(1)}), không bị hút tới đúng chỗ chân`);
const sau = await sang();
thu(sau < 235 && Math.abs(sau - truoc) < 60, `màn không trắng xoá (độ sáng giữa màn ${truoc} → ${sau})`);
thu(!errs.some(m => /non-finite/i.test(m)), 'không có lỗi createLinearGradient non-finite');

// khung vẽ báo lỗi giữa chừng (giả: cột sáng ném lỗi sau khi đã đặt 'lighter') thì khung sau phải vẽ lại bình thường
await p.evaluate(() => {
  const g = window.__game, pl = g.player;
  g.loot.push({ kind: 'mat', payload: { id: 'linh-thao', n: 1 }, nl: 'thu-nan', map: g.map.id, die: Date.now() + 600000, x: NaN, y: NaN, t: 1, down: true });
  pl.flying = false;
  const c = document.querySelector('canvas').getContext('2d'), goc = c.createLinearGradient.bind(c);
  let lan = 0;
  c.createLinearGradient = (...a) => { if (lan++ < 3 && c.globalCompositeOperation === 'lighter') throw new TypeError('thu: non-finite'); return goc(...a); };
});
await p.waitForTimeout(1500);
const sau2 = await sang();
const r2 = await p.evaluate(() => { const c = document.querySelector('canvas').getContext('2d'); return { op: c.globalCompositeOperation, a: c.globalAlpha, nan: window.__game.loot.some(l => !Number.isFinite(l.x)) }; });
thu(sau2 < 235 && Math.abs(sau2 - truoc) < 60, `sau lỗi khung vẽ: màn vẫn đúng (độ sáng ${sau2}, cách vẽ ${r2.op})`);
thu(!r2.nan, 'món toạ độ hỏng được đặt lại dưới chân');

const khac = errs.filter(m => !/^thu: /.test(m) && !/non-finite/i.test(m));
thu(!khac.length, `không lỗi JavaScript khác${khac.length ? ': ' + khac.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
console.log(hong ? `\n${hong} mục HỎNG` : '\nĐạt hết');
process.exit(hong ? 1 : 0);
