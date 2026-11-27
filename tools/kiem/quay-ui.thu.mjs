// Bài thử QUAY CLIP CÓ GIAO DIỆN. 25/11/2026 chủ dự án: quay cả bảng, tên…; 26/11/2026 02:51: "quay clip chi tiết nhưng trong khung hình
// giới hạn ban đầu… quay được cả kho cả bảng xếp hạng khi đang mở… khi quay xong video quá giật lag, không được, video phải chất lượng tốt nhất".
// Chạy hai lượt: (1) dựng sau (data/record.json → cfr.dung_sau, src/core/dung-clip.js): lúc quay chỉ chép trang, dừng quay mới dựng;
// (2) dán ngay (dung_sau tắt, máy không dựng sau được): cách 25/11. Mỗi lượt: khách vào game, quay, mở bảng Bản đồ, cuộn, gõ, dừng. Soát:
// clip đúng dải giữa màn (config.frame), độ phân giải gấp ≥ 2 lần điểm CSS (chữ nét), bảng Bản đồ lên clip từ lúc mở (đầu clip chưa có),
// có chữ góc, lượt 1 dựng xong có báo phần trăm, không lỗi JavaScript. (Đoạn hình đứng yên đo ngoài bài này bằng ffmpeg: xem docs/03 mục quay clip.)
// Chạy trong thư mục đã gói: cd _site && node ../tools/kiem/quay-ui.thu.mjs   (cần playwright; NODE_PATH nếu cài chỗ khác)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8797;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);

let hong = 0;
const ok = (c, m) => { console.log((c ? '  đạt ' : '  HỎNG ') + m); if (!c) hong++; };
const cfgGame = JSON.parse(await readFile(join(process.cwd(), 'data/config.json'), 'utf8')), F = cfgGame.frame;
const b = await chromium.launch();

async function luot(sau) {
  console.log(sau ? 'Lượt 1: dựng sau khi dừng quay' : 'Lượt 2: dán giao diện ngay lúc quay (máy không dựng sau được)');
  const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true, locale: 'vi-VN' });
  const save = { step: 52, stepDone: true, mua: 2, map: 'thanh-khe', element: 'moc', weapon: 'kiem', realm: 0, layer: 5, qi: 0, gioi: 'nu',
    visited: { 'thien-kiem-phong': true, 'thanh-khe': true } };
  await ctx.route(/supabase-js|posthog/, r => r.abort());
  await ctx.route(/data\/record\.json/, async r => { const res = await r.fetch(); const j = await res.json(); j.cfr.dung_sau = sau; await r.fulfill({ response: res, json: j }); });
  await ctx.addInitScript(s => { try { localStorage.setItem('p2d.save.v1:guest', s); } catch { /* không có bộ nhớ */ } }, JSON.stringify(save));
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/?thu=1`);
  await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
  await p.waitForTimeout(800);
  await p.tap('#btn-guest');
  await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
  await p.waitForSelector('#btn-rec', { timeout: 15000 });
  await p.evaluate(() => {
    const g = window.__game, d = g.dialog;
    for (const k of Object.keys(d)) if (typeof d[k] === 'function' && k !== 'close') d[k] = async () => null;
    d.close?.(); g.closeAll?.();
    const o = URL.createObjectURL; window.__clip = []; URL.createObjectURL = x => { if (x instanceof Blob && /video/.test(x.type)) window.__clip.push(x); return o.call(URL, x); };
    window.__toast = []; const t = g.toast; g.toast = (s, n) => { window.__toast.push(String(s)); return t(s, n); };
  });
  // bảng Hệ Thống tự mở lúc vào game (lời chào ký chủ cũ): thu nhỏ, không thì nó che dải giữa
  for (let k = 0; k < 10; k++) {
    await p.waitForTimeout(600);
    const co = await p.evaluate(() => { const b = document.querySelector('.ht-back'); if (!b || b.hidden || !b.getClientRects().length) return false; b.click(); return true; });
    if (!co && k >= 2) break;
  }

  await p.dispatchEvent('#btn-rec', 'pointerdown');
  await p.waitForFunction(() => window.__thu?.lopUi?.lan >= 1 || window.__thu?.lopUi?.hong, null, { timeout: 15000 }).catch(() => {});
  const truoc = await p.evaluate(() => ({ lan: window.__thu?.lopUi?.lan || 0, hong: !!window.__thu?.lopUi?.hong, ghi: Array.isArray(window.__thu?.lopUi?.ds) }));
  ok(truoc.lan >= 1 && !truoc.hong, `lớp giao diện chép / chụp được lúc bắt đầu quay (${truoc.lan} lần, hỏng: ${truoc.hong})`);
  ok(truoc.ghi === sau, sau ? 'đang chép để dựng sau (không vẽ ảnh lúc quay)' : 'đang dán ngay (máy không dựng sau)');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { document.getElementById('world').hidden = false; });
  await p.waitForFunction(n => (window.__thu?.lopUi?.lan || 0) > n, truoc.lan, { timeout: 8000 }).catch(() => {});
  ok(await p.evaluate(n => (window.__thu?.lopUi?.lan || 0) > n, truoc.lan), 'bảng hiện ra thì chép / chụp lại');
  // cuộn trong bảng: lượt dựng sau phải chép lại theo (chạm cuộn trên điện thoại không có pointerup)
  const n1 = await p.evaluate(() => window.__thu.lopUi.lan);
  await p.evaluate(() => { const e = [...document.querySelectorAll('#world *')].find(x => x.scrollHeight > x.clientHeight + 10); if (e) { e.scrollTop = 40; e.dispatchEvent(new Event('scroll')); } else document.dispatchEvent(new Event('scroll')); });
  await p.waitForTimeout(900);
  if (sau) ok(await p.evaluate(n => window.__thu.lopUi.lan > n, n1), 'cuộn trong bảng thì chép lại');
  await p.waitForTimeout(1200);
  await p.dispatchEvent('#btn-rec', 'pointerdown');
  await p.waitForFunction(() => window.__clip.length, null, { timeout: 60000 }).catch(() => {});

  const kq = await p.evaluate(async F => {
    const bl = window.__clip[0]; if (!bl) return null;
    const v = document.createElement('video'); v.muted = true; v.src = URL.createObjectURL(bl);
    await new Promise((r, j) => { v.onloadeddata = r; v.onerror = () => j(new Error('video')); });
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    const tim = async t => {
      v.currentTime = t; await new Promise(r => { v.onseeked = r; });
      g.drawImage(v, 0, 0);
      // khung tím của bảng Bản đồ: trong dải giữa chỉ thấy hai cạnh bên, đếm ở dải 10% mép trái
      const d = g.getImageData(0, 0, Math.round(c.width * 0.1), c.height).data; let n = 0, vang = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 60 && d[i + 2] > 110 && d[i + 1] < d[i] * 0.75 && d[i + 2] > d[i + 1] * 1.6) n++;
      // chữ góc: vàng #ffd86b ở góc dưới phải
      const k = g.getImageData(Math.round(c.width * 0.55), Math.round(c.height * 0.85), Math.round(c.width * 0.45), Math.round(c.height * 0.15)).data;
      for (let i = 0; i < k.length; i += 4) if (k[i] > 230 && k[i + 1] > 190 && k[i + 2] < 140) vang++;
      return { tim: n / (d.length / 4), vang };
    };
    const dau = await tim(0.05), cuoi = await tim(Math.max(0.5, v.duration - 0.3));
    return { w: v.videoWidth, h: v.videoHeight, dau, cuoi, ti: innerWidth / (innerHeight * (F.bottom - F.top)), cssW: innerWidth, dur: v.duration };
  }, F);
  ok(!!kq, 'có clip sau khi dừng');
  if (kq) {
    ok(Math.abs(kq.w / kq.h - kq.ti) < 0.03, `clip đúng dải giữa màn ${F.top}–${F.bottom} (${kq.w}×${kq.h})`);
    ok(kq.w >= kq.cssW * 2, `clip nét: rộng ${kq.w} điểm cho ${kq.cssW} điểm CSS`);
    ok(kq.cuoi.tim > kq.dau.tim + 0.01, `bảng Bản đồ lên clip từ lúc mở (điểm tím: đầu ${(kq.dau.tim * 100).toFixed(1)}%, cuối ${(kq.cuoi.tim * 100).toFixed(1)}%)`);
    ok(kq.dau.vang > 30 && kq.cuoi.vang > 30, `có chữ góc (điểm vàng: đầu ${kq.dau.vang}, cuối ${kq.cuoi.vang})`);
  }
  if (sau) {
    const dc = await p.evaluate(() => ({ ...window.__thu.dungClip, toast: window.__toast.filter(s => /%/.test(s)) }));
    ok(dc?.khung > 0 && !dc.uiHong, `đã dựng lại clip (${dc?.khung} khung, ${dc?.ui} lần chép giao diện, máy dựng ${dc?.rieng ? 'luồng riêng' : 'luồng game'}, ${dc?.ms} ms)`);
    ok(dc.toast.length > 0, `báo phần trăm lúc dựng (${dc.toast.slice(-1)[0] || 'không có'})`);
  }
  ok(!errs.length, `không lỗi JavaScript${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
  await ctx.close();
}

await luot(true);
await luot(false);
await b.close(); server.close();
console.log(hong ? `QUAY CLIP: HỎNG ${hong} mục` : 'QUAY CLIP: đạt hết');
if (hong) process.exit(1);
