// Bài thử Thể chất và huyết mạch ở Trúc Cơ (chủ dự án 25/11/2026 12:53–12:55; docs/20-THE-CHAT.md), trên bản đã gói, chơi khách:
// (1) Kim Đan đã có huyết mạch, chưa có thể chất: màn hình yên thì lễ thức tỉnh thể phách tự mở, ra đúng thể chất, bấm Nhận là ghi vào bản
//     lưu, chỉ số tăng đúng như data, lễ không mở lại; mục Huyết mạch có ba ô Huyết mạch | Thể chất | Nguyên Anh (27/11/2026), chạm ô Thể chất thấy tên và chỉ số.
// (2) Luyện Khí chưa có huyết mạch: không lễ nào mở (huyết mạch chờ Trúc Cơ, thể chất chờ Kim Đan), hai ô đều khoá và ghi rõ cảnh giới.
// (3) Vừa lên Trúc Cơ: lễ huyết mạch tự mở; lễ thể chất thì chưa.
// (4) Kim Đan đang treo máy (không ai chạm màn, như lúc trang tự tải lại rồi tự vào game): lễ KHÔNG mở, không câu thoại nào chặn Tự đánh;
//     chạm màn một cái thì lễ mở (src/game/co-mat.js, le.co_mat_s; lỗi bản 25/11/2026 16:44: 6 người treo máy kẹt ở câu thoại của lễ).
// Chạy trong thư mục đã gói: cd _site && node ../tools/kiem/the-chat.thu.mjs   (cần playwright)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8807;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);
const C = JSON.parse(await readFile(join(process.cwd(), 'data/the-chat.json'), 'utf8')), MA = 'kiem-cot', T = C.the[MA];
const b = await chromium.launch();
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };
const errs = [];
const visited = Object.fromEntries(['thien-kiem-phong', 'thanh-khe'].map(k => [k, true]));
const goc = { step: 52, stepDone: true, mua: 2, map: 'thien-kiem-phong', spawn: 'vao', element: 'hoa', weapon: 'kiem', layer: 1, qi: 0, gioi: 'nam', flags: { 'dong-phu': true }, visited, ht: { intro: 1 } };

// Mở game bằng một bản lưu chơi khách cho sẵn; thoại nào hiện ra thì chạm cho qua (trừ lúc màn lễ đang mở)
async function mo(save) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
  await ctx.route(/supabase-js|posthog/, r => r.abort());
  await ctx.addInitScript(s => { localStorage.setItem('p2d.save.v1:guest', s); }, JSON.stringify(save));
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/?thu=1`);
  await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
  await p.waitForTimeout(800);
  await p.tap('#btn-guest');
  await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
  await p.evaluate(() => { window.__thoai = setInterval(() => {
    const g = window.__game, le = ['#le-the', '#le-toc'].some(s => { const e = document.querySelector(s); return e && !e.hidden; });
    if (g.dialog.open && !le) {   // lựa chọn thì bấm lựa chọn đầu, câu thoại thì chạm hộp thoại (hộp thoại nghe pointerdown, src/ui/dialog.js)
      const c = document.querySelector('#dlg-choices .choice');
      if (c && c.offsetParent) c.click(); else document.querySelector('#dialog')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    }
    for (const e of document.querySelectorAll('.ht-back')) e.click();
  }, 300); });
  await cham(p);   // người chơi đang ngồi trước máy
  return { p, dong: () => ctx.close() };
}
// Một cú chạm THẬT (isTrusted) vào chỗ không có nút: lễ chỉ tự mở khi vừa có chạm trong le.co_mat_s giây (src/game/co-mat.js)
let chamN = 0;
async function cham(p) { chamN++; await p.mouse.move(2 + chamN % 5, 2); await p.mouse.move(8 + chamN % 5, 3); }
const mo_ = s => document.querySelector(s) && !document.querySelector(s).hidden;

// (1) Kim Đan, đã có huyết mạch
{
  const { p, dong } = await mo({ ...goc, realm: 2, tiem: { toc: 'nhan', goc: { atk_pct: 3, hp_pct: 3, def_pct: 3 }, cong: {}, max: 2 } });
  const truoc = await p.evaluate(ma => { const g = window.__game; g.theEp = ma; return { cm: g.player.st.critMult, the: g.save.theChat ?? null }; }, MA);
  thu(truoc.the === null, 'Kim Đan vào game: bản lưu chưa có thể chất');
  const mo1 = await p.waitForSelector('#le-the:not([hidden])', { timeout: 40000 }).then(() => true, () => false);
  thu(mo1, 'màn hình yên thì lễ thức tỉnh thể phách tự mở');
  thu(await p.evaluate(ma => window.__game.save.theChat === ma, MA), 'kết quả đã ghi vào bản lưu trước khi màn lễ chạy xong');
  await p.evaluate(() => document.querySelector('#le-the').click());   // chạm: chạy nhanh tới kết quả
  const ra = await p.waitForSelector('#le-the.ra .lh-nut', { timeout: 20000 }).then(() => true, () => false);
  const chu = await p.evaluate(() => document.querySelector('#le-the')?.textContent || '');
  thu(ra && chu.includes(T.ten) && chu.includes(T.dac_diem), `màn kết quả hiện tên, đặc điểm (${T.ten})`);
  // 26/11/2026 (chủ dự án: "tắt các ô hiện phẩm cấp khi đang thức tỉnh thể phách để người chơi đỡ so sánh"): màn lễ không còn tháp bậc phẩm, không chữ tên phẩm nào
  thu(!C.pham.some(q => chu.includes(q.ten)) && await p.evaluate(() => !document.querySelector('#le-the .lh-bac, #le-the .lh-pham, #le-the .lh-thap')), 'màn lễ không hiện ô phẩm cấp nào (tháp bậc, tên phẩm)');
  thu(await p.evaluate(n => document.querySelectorAll('#le-the .lh-huyet.sang').length === n, C.le.huyet), `đủ ${C.le.huyet} khiếu sáng trước khi ra ấn (ai cũng như nhau)`);
  thu(await p.evaluate(n => document.querySelectorAll('#le-the .lh-so').length === n, Object.keys(T.chi_so).length), 'đủ các dòng chỉ số trời cho');
  await p.waitForTimeout(Math.round((1.1 + Object.keys(T.chi_so).length * C.le.dong_s + 0.9) * 1000));
  await p.evaluate(() => document.querySelector('#le-the .lh-nut').click());
  await p.waitForTimeout(600);
  const sau = await p.evaluate(() => { const g = window.__game; return { an: document.querySelector('#le-the').hidden, cm: g.player.st.critMult, the: g.save.theChat }; });
  thu(sau.an && sau.the === MA, 'bấm Nhận: màn lễ đóng, bản lưu giữ mã thể chất');
  thu(Math.abs(sau.cm - truoc.cm - T.chi_so.crit_dmg / 100) < 0.011, `sát thương bạo tăng đúng ${T.chi_so.crit_dmg}% (${truoc.cm.toFixed(3)} → ${sau.cm.toFixed(3)})`);
  await p.waitForTimeout((C.le.yen_s + 5) * 1000);
  thu(!await p.evaluate(mo_, '#le-the'), 'lễ không mở lại lần hai');
  await p.evaluate(() => { const g = window.__game; g.closeAll?.(); g.openSelf('tiem'); });
  await p.waitForSelector('.tn-hai .tn-o', { timeout: 8000 }).catch(() => {});
  const o = await p.evaluate(() => [...document.querySelectorAll('.tn-hai .tn-o')].map(e => e.textContent));
  thu(o.length === 3 && o[1].includes(T.ten), 'mục Huyết mạch có ba ô (Huyết mạch, Thể chất, Nguyên Anh từ 27/11/2026), ô Thể chất ghi tên thể chất');
  await p.evaluate(() => document.querySelectorAll('.tn-hai .tn-o')[1].click());
  await p.waitForTimeout(500);
  const ct = await p.evaluate(() => document.querySelector('.tn')?.textContent || '');
  thu(ct.includes(T.dac_diem) && ct.includes(String(T.chi_so.crit_dmg).replace('.', ',')), 'chạm ô Thể chất: thấy đặc điểm và chỉ số trời cho');
  await dong();
}

// (2) Luyện Khí chưa có huyết mạch: không lễ nào mở, hai ô đều khoá
{
  const { p, dong } = await mo({ ...goc, realm: 0, layer: 5 });
  await p.waitForTimeout((C.le.yen_s + 8) * 1000);
  thu(!await p.evaluate(mo_, '#le-toc') && !await p.evaluate(mo_, '#le-the'), 'Luyện Khí: không lễ huyết mạch, không lễ thể chất');
  thu(await p.evaluate(() => !window.__game.save.tiem?.toc && !window.__game.save.theChat), 'Luyện Khí: bản lưu chưa có huyết mạch, chưa có thể chất');
  await p.evaluate(() => { const g = window.__game; g.closeAll?.(); g.openSelf('tiem'); });
  await p.waitForSelector('.tn-hai .tn-o', { timeout: 8000 }).catch(() => {});
  const o = await p.evaluate(() => [...document.querySelectorAll('.tn-hai .tn-o')].map(e => e.textContent));
  thu(o.length === 3 && o[0].includes(C.text.toc_chua_ngan) && o[1].includes(C.text.chua_ngan), `ô khoá ghi "${C.text.toc_chua_ngan}" và "${C.text.chua_ngan}" (ô thứ ba: Nguyên Anh)`);
  // (3) lên Trúc Cơ: lễ huyết mạch mở, lễ thể chất chưa. Không ai chạm màn thì lễ chờ; chạm một cái mới mở.
  await p.evaluate(() => { const g = window.__game; g.closeAll?.(); g.chamLuc = 0; g.save.realm = 1; g.save.layer = 1; g.refreshStats(); });
  await p.waitForTimeout((C.le.yen_s + 5) * 1000);
  thu(!await p.evaluate(mo_, '#le-toc') && await p.evaluate(() => !window.__game.save.tiem?.toc && !window.__game.dialog.open), 'lên Trúc Cơ mà không ai chạm màn: lễ huyết mạch chờ');
  await cham(p);
  const moToc = await p.waitForSelector('#le-toc:not([hidden])', { timeout: 40000 }).then(() => true, () => false);
  thu(moToc, 'lên Trúc Cơ: lễ huyết mạch tự mở');
  thu(!await p.evaluate(mo_, '#le-the') && await p.evaluate(() => !window.__game.save.theChat), 'Trúc Cơ: thể chất chưa thức tỉnh');
  await dong();
}

// (4) Kim Đan đang treo Tự đánh, không ai chạm màn (trang tự tải lại rồi tự vào game): lễ không mở, không thoại nào chặn; chạm thì mở
{
  const { p, dong } = await mo({ ...goc, realm: 2, tiem: { toc: 'nhan', goc: { atk_pct: 3, hp_pct: 3, def_pct: 3 }, cong: {}, max: 2 } });
  await p.evaluate(ma => { const g = window.__game; g.theEp = ma; g.chamLuc = 0; g.auto = true; }, MA);
  await p.waitForTimeout((C.le.yen_s + 8) * 1000);
  const treo = await p.evaluate(() => { const g = window.__game; return { thoai: g.dialog.open, the: g.save.theChat ?? null, dung: !!g.paused, le: !!g.leDang }; });
  thu(!await p.evaluate(mo_, '#le-the') && !treo.thoai && treo.the === null && !treo.le, 'treo máy không ai chạm màn: lễ thể chất không mở, chưa quay');
  thu(!treo.dung, 'treo máy: game không bị câu thoại nào chặn (Tự đánh chạy tiếp)');
  await p.evaluate(() => { window.__game.auto = false; });
  await cham(p);
  const mo4 = await p.waitForSelector('#le-the:not([hidden])', { timeout: 30000 }).then(() => true, () => false);
  thu(mo4 && await p.evaluate(ma => window.__game.save.theChat === ma, MA), 'người chơi quay lại chạm màn: lễ mở, ra đúng thể chất');
  await dong();
}

thu(errs.length === 0, `không lỗi JS${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); server.close();
if (hong) { console.error(`${hong} bước hỏng`); process.exit(1); }
console.log('✅ Thể chất: lễ, bảng, huyết mạch ở Trúc Cơ đều đạt');
