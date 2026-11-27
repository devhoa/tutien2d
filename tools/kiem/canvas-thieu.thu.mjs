// Bài thử BỘ NHỚ CANVAS (src/render/canvas-kho.js, docs/03-CAU-TRUC.md mục "Nhẹ máy" đợt 4). 22/11/2026 người chơi iPhone báo chơi lâu thì
// chân dung trống, bản đồ nhỏ tối chỉ còn một chấm, nền đất tối: Safari giới hạn tổng bộ nhớ canvas của trang, quá mức thì canvas tạo mới
// vẽ không ăn và bộ nhớ đệm giữ tấm trắng mãi. Bài này:
//  (1) phủ màu mọi hình quái, nhân vật, thú cưỡi, NPC, trùm, pháp tượng như lúc đánh (bóng, chớp trắng, ám đỏ): kho phải nằm trong hạn mức;
//  (2) giả Safari hết bộ nhớ: canvas tạo trong lúc "thiếu" có ngữ cảnh nhưng vẽ không ăn, đọc ra toàn điểm trong suốt (hỏng mãi). Đổi tinh
//      cầu và đổi Lv trong lúc thiếu, hết thiếu thì chân dung, bản đồ nhỏ phải tự vẽ lại.
//  (3) đổi màu hiệu ứng đủ hình × đủ hệ: kho hiệu ứng trong hạn mức; (4) getContext trả null cho canvas mới và cho khung vẽ chính: game
//      không lỗi, vẫn chạy, hết thiếu thì vẽ lại; (5) rời trang thì mọi kho trả bộ nhớ.
// Chạy ở gốc kho: node tools/kiem/canvas-thieu.thu.mjs   (cần playwright). Lỗi 'addColorStop' trong lúc thiếu là do bản giả, bỏ qua.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8795;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.route(/posthog\.com|supabase\.co|workers\.dev/, r => r.abort());
await ctx.addInitScript(() => {
  window.__thieu = false;
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (t, ...a) { const el = ce.call(this, t, ...a); if (String(t).toLowerCase() === 'canvas') { el.__sau = window.__thieu; el.__nullMoi = window.__nullMoi; } return el; };
  const gc0 = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...a) {
    if (window.__khungNull && this.id === 'game') return null;   // giả khung vẽ chính không xin được (iOS 16 ngay sau F5)
    if (window.__nullMoi && this.__nullMoi) return null;          // giả getContext trả null cho canvas tạo lúc thiếu
    const g = gc0.apply(this, a);
    if (!this.__sau || !g || a[0] !== '2d') return g;
    return new Proxy(g, { get(t, k) { const v = t[k]; if (k === 'getImageData') return (x, y, w, h) => new ImageData(w, h); if (k === 'canvas') return t.canvas; return typeof v === 'function' ? () => undefined : v; }, set() { return true; } });
  };
});
const p = await ctx.newPage(), loiJs = [];
p.on('pageerror', e => loiJs.push(e.message));
await p.goto(`http://localhost:${PORT}/?thu=1`);
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 60000 });
await p.waitForTimeout(800); await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.player, null, { timeout: 60000 });
await p.evaluate(() => { const g = window.__game, d = g.dialog; for (const k of Object.keys(d)) if (typeof d[k] === 'function' && k !== 'close') d[k] = async () => null; d.open = false; const box = document.getElementById('dialog'); if (box) box.hidden = true; g.closeAll?.(); });
await p.waitForTimeout(4000);

let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };

const r1 = await p.evaluate(async () => {
  const S = await import('/src/render/sprites.js'), sp = window.__game.data.art.sprites, han = window.__game.data.config.perf.canvas_mb;
  const ids = Object.keys(sp).filter(k => /^(mob|hero|mount|npc|boss|pt)\./.test(k));
  const ims = await Promise.all(ids.map(k => new Promise(ok => { const t0 = Date.now(); const f = () => { const im = S.spriteImage(sp[k]); if (im || Date.now() - t0 > 20000) ok([k, im]); else setTimeout(f, 50); }; f(); })));
  let neu = 0, null_ = 0;
  for (const [k, im] of ims) {
    if (!im) continue;
    for (const col of ['rgba(20,16,36,1)', '#ffffff', '#ff3a3a']) { if (!S.tintedImage(sp[k], im, col)) null_++; neu += im.naturalWidth * im.naturalHeight * 4 / 1048576; }
    S.flashImage(sp[k], im); neu += im.naturalWidth * im.naturalHeight * 4 / 1048576;
  }
  return { hinh: ims.filter(x => x[1]).length, neu: Math.round(neu), kho: S.canvasKho(), han, null_ };
});
console.log(`  ${r1.hinh} hình; giữ hết như bản cũ: ${r1.neu} MB; kho: ${r1.kho.mb} MB / ${r1.kho.so} tấm (hạn ${r1.han} MB)`);
thu(r1.hinh > 100 && r1.kho.mb <= r1.han && r1.null_ === 0, 'phủ màu mọi hình: kho trong hạn mức, không tấm nào hỏng');

const anh = () => p.evaluate(() => {
  const px = sel => { const cv = document.querySelector(sel); if (!cv) return -1; const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && (d[i] > 60 || d[i + 1] > 60 || d[i + 2] > 60)) n++; return n; };
  return { map: window.__game.map.id, ava: px('#uk-ava canvas'), mm: px('#mini-map canvas') };
});
const a0 = await anh();
thu(a0.ava > 1000 && a0.mm > 3000, `trước: có chân dung (${a0.ava}), có bản đồ nhỏ (${a0.mm})`);
await p.evaluate(() => { window.__thieu = true; const g = window.__game; g.save.layer = (g.save.layer || 1) + 1; });
await p.evaluate(() => window.__game.travel('dao-han-bang', null, false, { force: true }));
await p.waitForTimeout(4000);
const a1 = await anh();
console.log(`  đang thiếu ở ${a1.map}: chân dung ${a1.ava}, bản đồ nhỏ ${a1.mm}`);
await p.evaluate(() => { window.__thieu = false; });
await p.waitForTimeout(4500);
const a2 = await anh();
thu(a2.map === 'dao-han-bang' && a2.ava > 1000, `hết thiếu: chân dung vẽ lại (${a2.ava})`);
thu(a2.mm > 3000, `hết thiếu: bản đồ nhỏ vẽ lại (${a2.mm})`);

// (3) tấm đổi màu hiệu ứng pháp bảo: đủ hình × đủ dải màu → kho trong hạn mức
const r3 = await p.evaluate(async () => {
  const P = await import('/src/render/vfx/pfx-pal.js'), S = await import('/src/render/sprites.js'), g = window.__game, art = g.data.art, ramps = g.data.vfx.pb.ramps;
  const names = Object.keys(art.sprites).filter(k => k.startsWith('pfx.') && art.sprites[k].pal).map(k => k.slice(4));
  for (const n of names) { const L = art.sprites['pfx.' + n + '.l']; await new Promise(ok => { const t0 = Date.now(); const f = () => (S.spriteImage(art.sprites['pfx.' + n]) && (!L || S.spriteImage(L))) || Date.now() - t0 > 20000 ? ok() : setTimeout(f, 50); f(); }); }
  let lam = 0;
  for (const n of names) for (const k of Object.keys(ramps)) if (P.pfxTint(art, n, ramps, k)) lam++;
  return { hinh: names.length, lam, kho: P.pfxKho(), han: g.data.config.perf.pfx_mb };
});
console.log(`  hiệu ứng: ${r3.hinh} hình, ${r3.lam} lần đổi màu; kho ${r3.kho.mb} MB / ${r3.kho.so} cặp (hạn ${r3.han} MB)`);
thu(r3.hinh >= 20 && r3.lam > 100 && r3.kho.mb <= r3.han, 'đổi màu hiệu ứng mọi hình × mọi hệ: kho trong hạn mức');

// (4) getContext trả null cho canvas mới (biểu tượng ô túi, ngọc, vầng sáng nhận quà) rồi khung vẽ chính không xin được: không lỗi,
//     game vẫn chạy; hết thiếu thì vẽ lại
const t0 = await p.evaluate(() => window.__game.time);
await p.evaluate(async () => {
  window.__nullMoi = true;
  const { spriteIcon } = await import('/src/ui/sprite-icon.js'), { gemIcon } = await import('/src/ui/gem-icon.js'), { createRays } = await import('/src/ui/reward-rays.js');
  const g = window.__game, id = Object.keys(g.data.art.sprites).find(k => k.startsWith('mob.'));
  window.__ico = spriteIcon(g, id, 0, 34); window.__gem = gemIcon(g, 'hong-ngoc:3', 28); document.body.append(window.__ico, window.__gem);
  createRays('#ffcc33', 2).draw(0.5, 1);
  window.__khungNull = true; const s = g.screen; s.__that = s.ctx; s.ctx = null;
});
await p.waitForTimeout(1500);
const giua = await p.evaluate(() => ({ ve: !!window.__game.screen.ctx, t: window.__game.time }));
await p.evaluate(() => { window.__nullMoi = false; window.__khungNull = false; });
await p.waitForTimeout(2500);
const sau = await p.evaluate(() => {
  const px = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; };
  const s = window.__game.screen; return { ve: s.ctx === s.__that, t: window.__game.time, ico: px(window.__ico), gem: px(window.__gem) };
});
thu(!giua.ve && giua.t > t0 && sau.ve && sau.t > giua.t, `khung vẽ chính mất ngữ cảnh: game vẫn chạy, xin lại được (${t0.toFixed(1)} → ${sau.t.toFixed(1)} giây)`);
thu(sau.ico > 0 && sau.gem > 0, `biểu tượng ô túi / ngọc tạo lúc thiếu tự vẽ lại (${sau.ico}, ${sau.gem} điểm)`);

// (5) rời trang (pagehide): mọi kho trả bộ nhớ; ở lại (bfcache) thì tự dựng lại
const r5 = await p.evaluate(async () => {
  const S = await import('/src/render/sprites.js'), P = await import('/src/render/vfx/pfx-pal.js');
  window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
  const a = { kho: S.canvasKho().so, pfx: P.pfxKho().so };
  await new Promise(r => setTimeout(r, 1500));
  return { a, b: { kho: S.canvasKho().so } };
});
thu(r5.a.kho === 0 && r5.a.pfx === 0 && r5.b.kho > 0, `rời trang dọn hết kho (${r5.a.kho}, ${r5.a.pfx}), quay lại tự dựng lại (${r5.b.kho} tấm)`);
const loiThat = loiJs.filter(m => !/addColorStop|createLinearGradient|createRadialGradient/.test(m));   // lỗi do bản giả Proxy
thu(loiThat.length === 0, `không lỗi JavaScript (${loiThat.length}${loiThat.length ? ': ' + loiThat.slice(0, 3).join(' | ') : ''})`);
await b.close(); server.close();
console.log(hong ? `❌ ${hong} mục hỏng` : '✅ Bộ nhớ canvas đạt');
process.exit(hong ? 1 : 0);
