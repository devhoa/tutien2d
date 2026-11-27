// Quay clip câu cá ở cỡ điện thoại cho chủ dự án xem (docs/18-CAU-CA.md; docs/10-CAI-HON.md: thứ làm ra phải xem được bằng clip):
//   node tools/do-don/quay-cau-ca.mjs <tệp ra .mp4>      (cần Playwright và ffmpeg)   RONG=<bề ngang, mặc định 480> · CRF=<độ nén, mặc định 26>
// Kịch bản: gặp Lão Ngư Ông (quà giun, quầy mồi / cần, mua Hàn Thiết Can và Dạ Quang Trùng) → ra bến thả câu: phao rỉa, chìm, kéo, cá bay về tay, thẻ
// nhận ở lại → loài Địa phẩm giằng co, lễ nhận quà → cần chưa đủ sức gặp loài Tiên phẩm: đứt dây → Tự câu → mục Câu cá (Giỏ, Sổ câu, Mồi, Cần, Món,
// nấu và ăn) → bán cho Lão Ngư Ông, khai trai. Loài ở mỗi lần thả được ép trước (game.cauEp) cho clip đủ cảnh; giờ chờ cá cắn rút ngắn. Hình lấy từ chính
// trình duyệt (Page.startScreencast), khung đứng bao lâu thì trong clip đứng bấy lâu; đoạn dựng cảnh bị cắt. Chấm tròn trắng là chỗ ngón tay chạm.
// Không tiếng. Không gọi máy chủ thật (chơi khách: bán, khai tính ở máy cùng luật với máy chủ).
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { serve } from './may-chu.mjs';
const { chromium } = await import('playwright'); const stop = serve(8795);
const E = process.env, out = process.argv[2] || 'cau-ca.mp4', dir = out.replace(/\.mp4$/i, '') + '-khung', W = +(E.RONG || 480), H = Math.round(W * 844 / 390 / 2) * 2;
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale: 'vi-VN' });
await ctx.route(/posthog\.com|supabase\.co|workers\.dev|supabase-js/, r => r.abort());
const visited = Object.fromEntries(['thien-kiem-phong', 'thanh-khe', 'dao-xich-dien', 'dao-han-bang'].map(k => [k, true]));
const save = { step: 52, stepDone: true, mua: 2, map: 'thien-kiem-phong', spawn: 'vao', element: 'thuy', weapon: 'kiem', realm: 2, layer: 3, qi: 0, gioi: 'nu',
  flags: { 'dong-phu': true }, visited, lingshi: 3000000, tiem: { toc: 'nhan', goc: { atk_pct: 2 }, cong: {}, max: 4 } };
await ctx.addInitScript(s => { try { localStorage.setItem('p2d.save.v1:guest', s); } catch { /* không có bộ nhớ */ } }, JSON.stringify(save));
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => { errs.push(e.message); console.log('LỖI JS', e.message); });
const ev = (f, a) => p.evaluate(f, a), cho = ms => new Promise(r => setTimeout(r, ms)), T0 = Date.now(), log = (...a) => console.log(((Date.now() - T0) / 1000).toFixed(1) + 's', ...a);
const doi = async (f, a, ms = 20000) => { for (const t = Date.now(); Date.now() - t < ms;) { if (await ev(f, a)) return true; await cho(60); } log('HẾT GIỜ chờ', String(f).slice(0, 90)); return false; };
await p.goto('http://localhost:8795/?thu=1');
await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 }); await cho(600); await p.tap('#btn-guest');
await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
await doi(() => !window.__game.cheMan, null, 20000);
// truyện, Hệ Thống: đóng liên tục trừ lúc clip đang nói chuyện với Lão Ngư Ông / mở bảng; chấm ngón tay
await ev(() => {
  const g = window.__game, d = g.dialog;
  const tat = () => {
    if (!window.__giuThoai) { d.open = false; const box = document.getElementById('dialog'); if (box) box.hidden = true; }
    for (const e of document.querySelectorAll('.ht-back, .ht-tip')) e.hidden = true;
    if (!window.__giuUi && g.uiOpen && g.uiOpen !== 'qua') { g.closeAll?.(); g.uiOpen = false; }
  };
  tat(); setInterval(tat, 200);
  const st = document.createElement('style'); st.textContent = '.q-cham{position:fixed;z-index:99999;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid #fff;pointer-events:none;animation:q-cham .55s ease-out forwards}@keyframes q-cham{from{transform:scale(.5);opacity:1}to{transform:scale(1.25);opacity:0}}';
  document.head.append(st);
  window.__cham = (x, y) => { const e = document.createElement('div'); e.className = 'q-cham'; e.style.left = x + 'px'; e.style.top = y + 'px'; document.body.append(e); setTimeout(() => e.remove(), 600); };
  // clip: cá cắn nhanh hơn thật (chờ 1,6–2,4 giây, rỉa một lần), Tự câu thả lại sớm
  setInterval(() => { const f = g.fish; if (f && f.st === 'cho' && !f.clip) { f.clip = 1; f.t = Math.min(f.t, 1.6 + Math.random() * 0.8); f.ria = [0.7]; } }, 50);
});
await cho(1200);
// chạm vào phần tử (chọn theo CSS, lọc theo chữ nếu có): hiện chấm ngón tay rồi chạm thật
const cham = async (q, re) => {
  const r = await ev(([q, re]) => { const e = [...document.querySelectorAll(q)].find(e => e.offsetParent !== null && (!re || new RegExp(re).test(e.textContent))); if (!e) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, [q, re || '']);
  if (!r) { log('không thấy', q, re || ''); return false; }
  await ev(([x, y]) => window.__cham(x, y), r); await cho(160); await p.touchscreen.tap(r[0], r[1]); return true;
};
const chamThoai = async () => { const r = await ev(() => { const e = document.getElementById('dialog'); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return [r.left + r.width * 0.5, r.top + r.height * 0.6]; }); if (r) { await ev(([x, y]) => window.__cham(x, y), r); await cho(150); await p.touchscreen.tap(r[0], r[1]); } };
// đọc hết lời thoại tới khi có nút chọn
const toiNut = async (doc = 1900) => { for (let i = 0; i < 12; i++) { if (await ev(() => document.querySelectorAll('#dlg-choices button').length > 0)) return; await cho(doc); await chamThoai(); } };
const dungBen = () => ev(() => { const g = window.__game, c = g.map.center(35, 99); g.player.x = c.x; g.player.y = c.y; g.player.meditating = false; });
const canNgay = ma => ev(ma => { window.__game.cauEp = ma; }, ma);
const choCan = () => doi(() => window.__game.fish?.st === 'can', null, 12000);

// ---- quay: mỗi khung trình duyệt vẽ ra ghi thành một ảnh kèm giờ; ghi = false là đang cắt ----
let ghi = false, catKe = false;
const cdp = await ctx.newCDPSession(p), khung = [];
cdp.on('Page.screencastFrame', f => { cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  if (!ghi) return;
  const n = `f-${String(khung.length + 1).padStart(6, '0')}.jpg`; writeFileSync(`${dir}/${n}`, Buffer.from(f.data, 'base64')); khung.push([n, f.metadata.timestamp, catKe]); catKe = false; });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: W, maxHeight: H, everyNthFrame: 2 });
const cat = async fn => { ghi = false; await fn(); await cho(500); catKe = true; ghi = true; };

// 1. Gặp Lão Ngư Ông: quà ra mắt, quầy mồi / cần
await cat(async () => {
  await ev(() => { window.__giuThoai = true; window.__giuUi = true; const g = window.__game, n = g.npcs.find(n => n.id === 'lao-ngu-ong'); g.player.x = n.x - 14; g.player.y = n.y + 4; g.player.meditating = false; });
  await ev(async () => { const d = window.__game.dialog; for (let i = 0; i < 6; i++) { d.cancel?.(); await new Promise(r => setTimeout(r, 100)); } });
});
await cho(1400);
await cham('#btn-act'); await cho(400);
if (E.SHOT) await p.screenshot({ path: E.SHOT + '-1.png' });
log('nhãn', await ev(() => { const g = window.__game, n = g.npcs.find(n => n.id === 'lao-ngu-ong'); return [g.actLabel, g.map.id, Math.round(g.player.x), Math.round(g.player.y), n && Math.round(n.x), n && Math.round(n.y), g.data.config.interact_range]; }));
await toiNut(2300); await cho(1500);
if (E.SHOT) await p.screenshot({ path: E.SHOT + '-2.png' });
await cham('#dlg-choices button', 'Mua mồi'); await cho(1800);
log('cần', await cham('#dlg-choices button', 'Hàn Thiết')); await cho(2000);
await cham('#dlg-choices button', 'Dạ Quang'); await cho(1300);
log('×1', await cham('#dlg-choices button', '^×1600'));
await cho(1600);
await cham('#dlg-choices button', '^Thôi'); await cho(900);
await toiNut(800);
await cham('#dlg-choices button', '^Thôi'); await cho(700);
await ev(() => { window.__giuThoai = false; window.__giuUi = false; const g = window.__game; g.save.cau.moi = 'da-quang'; g.cauTheVe?.(); });

// 2. Ra bến, thả câu: phao rỉa rồi chìm, kéo, cá bay về tay, thẻ nhận
await cat(async () => { await dungBen(); });
await cho(900);
await canNgay('kiem-ngu');
await cham('#btn-act'); await choCan(); await cho(350);
await cham('#btn-act'); await cho(3400);
// 3. Loài Địa phẩm: giằng co, bấm khi kim vào vùng sáng; lễ nhận quà
await canNgay('kiem-van-ly');
await cham('#btn-act'); await choCan(); await cho(300);
await cham('#btn-act'); await doi(() => window.__game.fish?.st === 'gc', null, 3000); await cho(900);
for (let i = 0; i < 4; i++) {
  if (!(await ev(() => window.__game.fish?.st === 'gc'))) break;
  await doi(() => { const g = window.__game.fish?.gc; return !g || Math.abs(g.kim - g.z) < g.w * 0.3; }, null, 5000);
  await cham('#btn-act'); await cho(700);
}
await doi(() => { const q = document.getElementById('qua'); return q && !q.hidden; }, null, 6000); await cho(3000);
await cham('#qua .q-btn'); await cho(1200);
// 4. Cần chưa đủ sức, loài Tiên phẩm cắn: đứt dây
await canNgay('cuu-vi-ly');
await cham('#btn-act'); await choCan(); await cho(300);
await cham('#btn-act'); await cho(2600);
// 5. Tự câu (nút trên thẻ nhận)
await ev(() => { window.__game.cauEp = undefined; });
await cham('#cau-the .ct-tu'); await cho(16000);
await cham('#cau-the .ct-tu'); await cho(1500);
await ev(() => { window.__game.fish = null; });

// 6. Mục Câu cá: Giỏ, chạm một con, Sổ câu, Mồi, Cần, Món (nấu, ăn)
await cat(async () => { await ev(() => { const g = window.__game, s = g.save; s.mats['linh-ngu'] = (s.mats['linh-ngu'] || 0) + 12; s.mats['so-diep'] = 3; s.mats['co-bang'] = 1; window.__giuUi = true; g.openSelf('ca', 'ca'); }); });
await cho(2200);
await cham('.sv-mid .ol-o'); await cho(2600);
await cham('.d-close'); await cho(800);
await cham('.cau-hang button', 'Sổ'); await cho(2600);
await cham('.sv-subs .sv-sb', 'Mồi'); await cho(2000);
await cham('.sv-subs .sv-sb', 'Cần'); await cho(2000);
await cham('.sv-subs .sv-sb', 'Món'); await cho(1500);
await cham('.sv-mid .ol-o'); await cho(1800);
await cham('.act-btn', '^Nấu'); await cho(1800);
await cham('.act-btn', '^Ăn'); await cho(2400);
await ev(() => { window.__game.toggleSelf(); window.__giuUi = false; });

// 7. Bán cho Lão Ngư Ông, khai trai
await cat(async () => {
  await ev(() => { window.__giuThoai = true; window.__giuUi = true; const g = window.__game, n = g.npcs.find(n => n.id === 'lao-ngu-ong'); g.player.x = n.x - 14; g.player.y = n.y + 4; g.player.meditating = false; });
  await ev(async () => { const d = window.__game.dialog; for (let i = 0; i < 6; i++) { d.cancel?.(); await new Promise(r => setTimeout(r, 100)); } });
});
await cho(900);
await cham('#btn-act'); await cho(400); await toiNut(1500); await cho(900);
await cham('#dlg-choices button', 'Bán đồ câu'); await toiNut(1500); await cho(1800);
await cham('#dlg-choices button', '^Bán hết'); await toiNut(2600); await cho(2600);
await cham('#dlg-choices button', 'Khai trai'); await toiNut(1500); await cho(1200);
await cham('#dlg-choices button', 'Khai trai'); await toiNut(3200); await cho(3200);
ghi = false; await cdp.send('Page.stopScreencast').catch(() => {});
const kq = await ev(() => { const s = window.__game.save; return { so: Object.keys(s.cau?.so || {}).length, dem: s.cau?.dem?.n, lt: s.lingshi }; });
await b.close(); stop();

// ---- ghép: mỗi khung đứng đúng khoảng giờ tới khung kế; chỗ cắt thì khung trước đứng 0,12 giây ----
let list = '', dai = 0;
khung.forEach(([n, t], i) => { const ke = khung[i + 1], d = !ke ? 1.2 : ke[2] ? 0.12 : Math.min(1.5, Math.max(0.01, ke[1] - t)); dai += d; list += `file '${n}'\nduration ${d.toFixed(4)}\n`; });
list += `file '${khung.at(-1)[0]}'\n`; writeFileSync(`${dir}/list.txt`, list);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-vf', `fps=30,scale=${W}:${H}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(E.CRF || 26), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
rmSync(dir, { recursive: true, force: true });
console.log(`✅ ${out}: ${khung.length} khung, ${dai.toFixed(0)} giây · ${JSON.stringify(kq)} · ${errs.length} lỗi JavaScript`);
if (errs.length) process.exit(1);
