// Chạy cả chuỗi nhiệm vụ chính sau phần mở đầu bằng Tự hành và chụp từng mốc ở cỡ điện thoại (docs/14-TRAN-MA-KY.md phần B; cần Playwright):
//   node tools/do-don/thu-nv.mjs <thư mục ra> [giây tối đa]
// Mặc định: bản lưu dựng sẵn vừa hết phần mở đầu (đã thấy cảnh người thân bị bắt), máu quái hạ thấp và nhân vật không gục, để soát NHANH rằng truyện đi tới cuối,
// không kẹt, không lỗi JavaScript, lời nào hiện ra đúng lời ấy. Ra mã lỗi nếu có lỗi JavaScript hoặc chưa tới bước cuối.
//   CU=1      bản lưu người chơi cũ (chưa thấy cảnh mở đầu: không có cờ người thân bị giữ, Tiểu Hỏa bị bắt) → phải ra bản lời thứ hai
//   KQ=thoat  bấm Thoát ở bảng kết quả bí cảnh · KQ=dong đóng bảng · mặc định không ai bấm (Tự hành chờ 14 giây rồi tự dọn bảng)
//   CHON=n    lựa chọn thứ n (0…2) ở câu hỏi của Vân Hạc
//   START=mã  bắt đầu ở bước này thay vì cuối phần mở đầu (chạy nhanh một đoạn truyện viết sau, vd START=nv-tang-chin; cảnh giới tự đủ cho bước đó)
//   CANH=c.t  cảnh giới c tầng t lúc bắt đầu ở START (vd START=nv-gio-den CANH=1.5: Trúc Cơ tầng 5 cho cổng Hắc Phong)
// Nhiệm vụ farm (hạ 3 000 con, đánh 60 phút): đánh vài giây cho thấy số đếm chạy, rồi ghi số gần đủ vào bản lưu (save.nvDem) và TẢI LẠI TRANG,
// soát số đếm còn nguyên sau khi tải lại (đúng đường người chơi thoát game giữa chừng), rồi đánh nốt phần còn lại.
//   THAT=1    người mới THẬT từ giây đầu: chơi cả phần mở đầu rồi tới chuỗi, không sửa máu, không tua tu luyện (đo độ khó và thời gian thật; chừng 12 phút)
// In ra: mỗi lần sang bước một dòng trạng thái, cuối cùng là mọi câu thoại đã hiện theo thứ tự và các cờ truyện đã bật. Không gọi máy chủ thật.
import { mkdirSync } from 'node:fs';
import { serve } from './may-chu.mjs';
const { chromium } = await import('playwright'); const E = process.env, PORT = +(E.PORT || 8797), stop = serve(PORT);
const out = process.argv[2] || 'thu-nv', THAT = !!E.THAT, START = E.START || '', CANH = (E.CANH || '').split('.').map(Number), MAX = +(process.argv[3] || (THAT ? 1300 : 420)), CU = !!E.CU, KQ = E.KQ || (THAT ? 'thoat' : ''), CHON = +(E.CHON || 0);
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: THAT ? 1 : 2, hasTouch: true, isMobile: true, locale: 'vi-VN' });
if (THAT) await ctx.addInitScript(() => { const t = setInterval(() => { if (window.__game) { window.__game.khoaBo = true; clearInterval(t); } }, 20); });   // chặng leo bậc khoá Tự hành: bỏ khoá như tools/playtest.mjs
await ctx.addInitScript(() => { setInterval(() => { const g = window.__game; if (!g?.player) return; const d = g.player.hp <= 0 || !!g.ghost; if (d && !window.__dd) window.__deaths = (window.__deaths || 0) + 1; window.__dd = d; }, 100); });
// Soát truyện (không phải đo độ khó): quái yếu, người không trúng đòn, đặt bằng mã chạy mỗi 0,1 giây trong trang nên còn hiệu lực sau mỗi lần tải lại
// (vòng chính chỉ chạm tới trang mỗi 0,3–0,5 giây: người chơi thử trần trụi 264 máu bị quái Hắc Phong đánh hai nhát trong khe đó là gục, Tự hành dừng, rút về đả tọa)
if (!THAT) await ctx.addInitScript(() => { setInterval(() => { const g = window.__game, p = g?.player; if (!p) return; for (const m of g.mobs || []) if (!m.dead && m.hp > 40) m.hp = 40; if (p.hp > 0 && !g.ghost) { p.hp = p.maxHp; p.invT = Math.max(p.invT || 0, 0.3); } }, 100); });
await ctx.route(/posthog\.com|supabase\.co|workers\.dev|supabase-js/, r => r.abort());
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => { errs.push(e.message); console.log('LỖI JS', e.message, (e.stack || '').split('\n')[1]); });
const ev = (f, a) => p.evaluate(f, a), cho = ms => new Promise(r => setTimeout(r, ms));
const vao = async () => { await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 }); await cho(600); await p.click('#btn-guest'); await p.waitForFunction(() => window.__game?.save && window.__game.map, null, { timeout: 30000 }); };
await p.goto(`http://localhost:${PORT}/?thu=1`); await vao(); await cho(1500);
if (!THAT) {
  await ev(async ([cu, start, canh]) => {
    const g = window.__game, wait = ms => new Promise(r => setTimeout(r, ms)), s = g.save;
    for (let i = 0; i < 40 && !s.gioi; i++) { document.querySelector('#dlg-choices .choice')?.click(); await wait(100); }
    const md = g.data.story.steps.findIndex(x => x.id === g.data.story.mo_dau), st = start ? g.data.story.steps.findIndex(x => x.id === start) : -1;
    Object.assign(s, { step: md, stepDone: true, storyV: 2, element: 'hoa', realm: 0, layer: 5, qi: 0, map: 'thien-kiem-phong', spawn: 'vao', weapon: 'kiem' });
    if (st > md) { Object.assign(s, { step: st, stepDone: false, layer: 8 }, canh.length === 2 ? { realm: canh[0], layer: canh[1] } : {}); s.tiem ??= { toc: 'nhan', goc: {}, cong: {}, tay: 0 }; for (const x of ['kn-pha-van', 'kn-linh-nhan', 'kn-liep-phong', 'da-giong-chuong', 'a-luc-ve', 'dao-ve-cha']) s.flags[x] = true; for (const x of g.data.config.season?.open_flags || []) s.flags[x] = true; s.theChat ??= 'moc-linh'; }   // cờ mở tinh cầu, bí cảnh như người đã chọn linh căn (src/game/story.js chooseElement); thể chất có sẵn để lễ thức tỉnh không chen vào
    s.root ||= 'pham'; (s.ht ??= {}).intro = 1; s.visited = { 'thanh-khe': true, 'thien-kiem-phong': true };
    Object.assign(s.flags, { 'bac-mo-danh': true, 'bac-mo-hanh': true });
    if (!cu) Object.assign(s.flags, { 'lac-tuyet-vang': true, 'bac-xong': true, 'leo-bac': true, 'mat-tieu-hoa': true });
    g.persist();
  }, [CU, START, CANH]);
  await cho(400); await p.reload(); await vao(); await cho(3500);
  await ev(async () => { const g = window.__game, wait = ms => new Promise(r => setTimeout(r, ms)); for (let i = 0; i < 50; i++) { const c = document.querySelector('#dlg-choices .choice'); if (c) c.click(); else if (g.dialog.open) { g.dialog.skip(); g.dialog.skip(); } await wait(60); } });
  await cho(800);
}
const tt = () => ev(() => { const g = window.__game, s = g.save, G = g.story.goal(), h = document.getElementById('nv-hud'), cl = document.getElementById('chu-lon'), st = g.player?.st || {};
  return { step: s.step, bac: s.bac?.i ?? '', id: g.data.story.steps[s.step]?.id, done: s.stepDone, map: g.map?.id, canh: `${s.realm}.${s.layer}`, lc: (document.getElementById('power')?.textContent || '').replace(/\D+/, ''), hp: g.player ? Math.round(g.player.hp) + '/' + Math.round(g.player.maxHp) : '', atk: Math.round(st.atk || 0), chet: window.__deaths || 0,
    pilot: !!g.pilot, busy: g.story.busy, xong: g.story.xong, act: g.actLabel || '', goal: G && `${G.so}|${G.ten}|${G.text}`, hud: h && !h.hidden ? h.innerText.replace(/\s+/g, ' ') + (h.classList.contains('xong') ? ' [✓]' : '') : '(ẩn)',
    chu: cl && !cl.hidden ? cl.innerText.replace(/\s+/g, ' ') : '', kq: !!document.querySelector('.dr-panel:not([hidden])'), dlg: g.dialog.open ? (document.getElementById('dlg-who')?.textContent || '') + ': ' + (document.getElementById('dlg-text')?.textContent || '') : '' }; });
let key = '', shots = 0, cur = '', curId = '', nhip = Date.now(); const t0 = Date.now(), seen = new Set(), lines = [], [cuoi, soBuoc] = await ev(() => { const S = window.__game.data.story.steps; return [S.at(-1).id, S.length]; });
const chup = async ten => { await p.screenshot({ path: `${out}/${String(++shots).padStart(2, '0')}-${ten}.png` }).catch(() => {}); };
while ((Date.now() - t0) / 1000 < MAX) {
  await ev(([kq, chon, that]) => {
    const g = window.__game; if (!g.player) return;
    if (!that) { for (const m of g.mobs) if (!m.dead && m.hp > 40) m.hp = 40; g.player.hp = g.player.maxHp; }
    const cs = document.querySelectorAll('#dlg-choices .choice'); if (cs.length) { cs[Math.min(chon, cs.length - 1)].click(); return; }
    const dr = document.querySelector('.dr-panel:not([hidden])');
    if (!dr) window.__kqT = null;
    else if (kq) { window.__kqT ??= performance.now(); if (performance.now() - window.__kqT > 2500) { if (kq === 'dong') g.closeAll(); else [...dr.querySelectorAll('button')].find(x => /Thoát/.test(x.textContent))?.click(); window.__kqT = null; } }
    if (g.dialog.open && !g.pilot) g.dialog.skip();   // hội thoại ngoài truyện (lễ huyết mạch, thư…) mở lúc Tự hành chưa bật: lật qua, kẻo không bật được Tự hành
    if (!g.pilot && !g.dialog.open && !g.story.busy && !g.story.xong) { if (that && window.__thu?.togglePilot) window.__thu.togglePilot(g); else document.getElementById('nv-hud')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }
    if (that && g.trib?.canStart?.() && !g.trib.active) g.trib.start();   // người chơi bấm Độ thiên kiếp
  }, [KQ, THAT ? 1 : CHON, THAT]);
  const s = await tt(), T = ((Date.now() - t0) / 1000).toFixed(1) + 's';
  if (s.dlg !== cur) { if (cur && !s.dlg.startsWith(cur)) lines.push(`[${curId}] ${cur}`); cur = s.dlg; curId = s.id; }   // chữ đang gõ dần: chỉ ghi lại câu khi nó đã đổi sang câu khác
  for (const [k, ten] of [[s.chu && 'chu:' + s.chu, 'chu-lon'], [s.hud.includes('[✓]') && 'xong:' + s.id, 'the-xong'], [s.act && s.act === await ev(() => window.__game.story.viec()) && 'tay:' + s.act, 'nut-viec'], [s.kq && 'kq' + s.step, 'bang-ket-qua']])
    if (k && !seen.has(k)) { seen.add(k); await cho(300); await chup(ten + '-' + s.id); console.log(T, '·', k); }
  const k = `${s.step}/${s.bac}/${(s.goal || '').replace(/\d+\/\d+\)?$/, '')}`;
  if (k !== key) { key = k; nhip = Date.now(); console.log(T, JSON.stringify({ ...s, dlg: undefined, chu: undefined })); await cho(700); await chup(s.id); }
  else if (Date.now() - nhip > 20000) { nhip = Date.now(); console.log(T, '…', JSON.stringify({ map: s.map, trip: await ev(() => !!window.__game.trip), goal: s.goal, hud: s.hud, act: s.act, pilot: s.pilot, xong: s.xong, busy: s.busy, dlg: s.dlg, kq: s.kq })); }   // lâu không sang bước: in trạng thái để thấy kẹt ở đâu
  if (!THAT && s.done && s.goal?.includes('tầng 9') && !seen.has('t9')) { seen.add('t9'); await cho(1500); await ev(() => { window.__game.save.layer = 9; }); }   // nhiệm vụ cuối chờ tu luyện: cho đủ tầng để nghe câu kết
  if (!THAT && s.done && s.goal?.includes('đột phá Trúc Cơ') && !seen.has('tc')) { seen.add('tc'); await cho(1500); await ev(() => { const g = window.__game; Object.assign(g.save, { realm: 1, layer: 1, qi: 0 }); g.refreshStats?.(); }); }   // độ kiếp Trúc Cơ: cho thẳng cảnh giới (bài này soát truyện, không soát kiếp)
  if (!THAT && s.done && s.goal?.includes('Kim Đan') && !seen.has('kd')) { seen.add('kd'); await cho(1500); await ev(() => { const g = window.__game; Object.assign(g.save, { realm: 2, layer: 1, qi: 0 }); g.refreshStats?.(); }); }
  const FARM = { 'nv-dep-gio': { 'kill:*': 2990 }, 'nv-gio-yeu': { phut: 3540 }, 'nv-mui-nang': { 'kill:*': 2990 }, 'nv-bong-duoi-goc': { phut: 3540 } }[s.id];
  if (!THAT && s.done && !s.busy && FARM && !seen.has('ff:' + s.id)) {   // nhiệm vụ farm: thấy số chạy, ghi số gần đủ, tải lại trang, số phải còn
    seen.add('ff:' + s.id); let truoc = 0;
    for (let i = 0; i < 45 && !(truoc > 0); i++) {   // chờ con đầu tiên được đếm (Tự hành còn đi tới bãi quái); việc theo phút thì phút đầu vẫn là 0
      await cho(1000);
      truoc = (await ev(() => { const g = window.__game; for (const m of g.mobs) if (!m.dead && m.hp > 40) m.hp = 40; g.player.hp = g.player.maxHp; return g.story.goal()?.n; })) || 0;   // chờ mà vẫn giữ quái yếu, người không gục như vòng chính
      if (FARM.phut && i >= 3) break;
    }
    await ev(([id, c]) => { const g = window.__game; g.save.nvDem = { s: id, c }; g.persist(); }, [s.id, FARM]);
    await cho(400); await p.reload(); await vao(); await cho(3000);
    await ev(async () => { const g = window.__game, wait = ms => new Promise(r => setTimeout(r, ms)); for (let i = 0; i < 30 && g.dialog.open; i++) { g.dialog.skip(); await wait(60); } });
    const sau = await ev(() => { const G = window.__game.story.goal(); return G && { n: G.n, of: G.of, hud: document.getElementById('nv-hud')?.innerText.replace(/\s+/g, ' ') }; });
    const can = FARM.phut ? Math.floor(FARM.phut / 60) : FARM['kill:*'];
    console.log(`tua nhanh ${s.id}: trước khi ghi đếm được ${truoc} · sau khi tải lại ${JSON.stringify(sau)}`);
    if (!(truoc > 0 || FARM.phut) || !sau || sau.n < can) { errs.push(`nhiệm vụ farm ${s.id}: số đếm không giữ qua lần tải lại (${JSON.stringify(sau)})`); console.log('LỖI', errs.at(-1)); }
    await chup('tua-' + s.id);
  }
  // Săn rải (26/11/2026, src/game/san-rai.js): chờ con đầu tiên được tính ở nơi Tự hành tự chọn, rồi ghi đủ mọi nơi trừ MỘT nơi ở tinh cầu khác
  // (còn thiếu 6 con), tải lại trang: số từng nơi phải còn, thẻ phải chỉ đúng nơi còn thiếu, Tự hành phải tự bay sang tinh cầu ấy đánh nốt.
  const sanDs = !THAT && s.done && !s.busy && !seen.has('ff:' + s.id) ? await ev(() => window.__game.story.current()?.until?.san?.map(k => ({ in: k.in, n: k.n, ten: k.ten })) || null) : null;
  if (sanDs) {
    seen.add('ff:' + s.id); let truoc = 0;
    for (let i = 0; i < 120 && !(truoc > 0); i++) {
      await cho(1000);
      truoc = (await ev(() => { const g = window.__game; for (const m of g.mobs) if (!m.dead && m.hp > 40) m.hp = 40; g.player.hp = g.player.maxHp; if (!g.pilot && !g.dialog.open) document.getElementById('nv-hud')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return g.story.goal()?.n; })) || 0;
    }
    const dang = await ev(() => { const G = window.__game.story.goal(); return { i: G?.san?.i ?? 0, map: window.__game.map.id, hud: document.getElementById('nv-hud')?.innerText.replace(/\s+/g, ' ') }; });
    const khac = sanDs.findIndex(k => k.in !== sanDs[dang.i].in), j = khac < 0 ? dang.i : khac, c = { san: 0 };
    sanDs.forEach((k, i) => { c['san:' + i] = i === j ? k.n - 6 : k.n; c.san += c['san:' + i]; });
    await ev(([id, c]) => { const g = window.__game; g.story.notify = () => {}; g.save.nvDem = { s: id, c }; g.persist(); }, [s.id, c]);   // thôi nghe tin hạ quái trước khi ghi: một con gục lúc chờ tải lại sẽ ghi đè số vừa đặt
    await cho(400); await p.reload(); await vao(); await cho(3000);
    await ev(async () => { const g = window.__game, wait = ms => new Promise(r => setTimeout(r, ms)); for (let i = 0; i < 30 && g.dialog.open; i++) { g.dialog.skip(); await wait(60); } });
    const sau = await ev(() => { const G = window.__game.story.goal(); return G && { n: G.n, of: G.of, noi: G.san?.ten, da: G.san?.da, hud: document.getElementById('nv-hud')?.innerText.replace(/\s+/g, ' ') }; });
    console.log(`săn rải ${s.id}: con đầu tiên tính ở "${sanDs[dang.i].ten}" (${dang.map}) · thẻ lúc đó: ${dang.hud} · sau khi tải lại ${JSON.stringify(sau)} · nơi còn thiếu "${sanDs[j].ten}" (${sanDs[j].in})`);
    if (!(truoc > 0) || !sau || sau.n !== c.san || sau.noi !== sanDs[j].ten || sau.da !== sanDs[j].n - 6) { errs.push(`săn rải ${s.id}: số đếm / nơi đang nhắm không đúng sau lần tải lại (${JSON.stringify(sau)})`); console.log('LỖI', errs.at(-1)); }
    await chup('san-' + s.id);
  }
  if (!THAT && s.done && /\|Tu luyện tới Nguyên Anh$/.test(s.goal || '') && !seen.has('na')) { seen.add('na'); await cho(1500); await ev(() => { const g = window.__game; Object.assign(g.save, { realm: 3, layer: 1, qi: 0 }); g.refreshStats?.(); }); }   // Thiên Kim: đích cuối là Nguyên Anh
  { const kd = !THAT && s.done && /Kim Đan tầng (\d)/.exec(s.goal || '');   // Thanh Mộc: tu tới Kim Đan tầng 4 / tầng 7 (Rễ Mẫu Thụ, Thiên Kim)
    if (kd && !seen.has('kd' + kd[1])) { seen.add('kd' + kd[1]); await cho(1500); await ev(t => { const g = window.__game; Object.assign(g.save, { realm: 2, layer: t }); g.refreshStats?.(); }, +kd[1]); } }
  if (!THAT && s.done && s.goal?.includes('Trúc Cơ tầng 5') && !seen.has('tc5')) { seen.add('tc5'); await cho(1500); await ev(() => { const g = window.__game; Object.assign(g.save, { realm: 1, layer: 5 }); g.refreshStats?.(); }); }
  if (s.id === cuoi && s.done) { await cho(1000); break; }
  await cho(250);
}
if (cur) lines.push(`[${curId}] ${cur}`);
const s = await tt(), co = await ev(() => Object.keys(window.__game.save.flags).filter(k => /^(vi-ai|da-giong|dat-the|a-luc|dao-ve|den-cua|tp-|kn-|thiet-lan|dai-vai|biet-nam)/.test(k)));
console.log('--- lời đã hiện ---\n' + lines.join('\n'));
console.log(`cuối ${((Date.now() - t0) / 1000).toFixed(0)}s: bước ${s.id}${s.done ? ' (xong)' : ''}, cảnh giới ${s.canh}, lực chiến ${s.lc}, gục ${s.chet} lần · cờ: ${co.join(', ')} · ${errs.length} lỗi JavaScript`);
await p.screenshot({ path: `${out}/99-cuoi.png` }).catch(() => {});
await b.close(); stop();
const ok = !errs.length && (THAT ? s.step >= soBuoc - 2 : s.id === cuoi);   // người mới thật: tới được nhiệm vụ cuối (chờ tu luyện) là đạt
console.log(ok ? '✅ Chuỗi nhiệm vụ chạy tới nơi' : '❌ Chưa tới bước cuối hoặc có lỗi JavaScript');
process.exit(ok ? 0 : 1);
