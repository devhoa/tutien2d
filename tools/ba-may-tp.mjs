// Bài thử ba máy (22/11/2026 16:5x): thiên phạt do máy chủ phòng làm trọng tài và túi Linh Thạch, qua PHÒNG GIẢ chạy đúng mã cloud/src
// (tools/cloud/phong-gia.mjs), như tools/hai-may.mjs. A (người) và B (ma, 2 điểm) cùng tới Thiên Kiếm Tinh; nhịp thiên phạt rút còn 2 giây cho nhanh:
// hai đạo đầu trừ máu B không gục, A nghe sét, đạo ba B gục còn 1 điểm ma, bay hồn tới tinh cầu khác. Rồi C (người) tới; một túi 250 nghìn cạnh A:
// màu Hiếm, A chạy qua nhặt được, C thấy túi mất. Không ra mạng, không chạm máy chủ thật. Lần đầu chạy bắt được hai lỗi (docs/16-HOA-MA.md).
// Chạy ở gốc kho: node tools/ba-may-tp.mjs (BAY=0 node tools/ba-may-tp.mjs: B chưa học ngự kiếm, phải về làng đầu)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';

const GOC = process.cwd(), PORT = +(process.env.PORT || 8796);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(GOC, file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);

const { taoPhongGia } = await import(join(GOC, 'tools/cloud/phong-gia.mjs'));
const phong = await taoPhongGia();
const { PVP } = await import(join(phong.dir, 'mang-cfg.js'));
const CK = 2; PVP.ma.tp.chu_ky = CK;   // nhịp thật 10 giây; ở đây 2 giây
const { chromium } = await import('playwright').catch(() => createRequire(join(GOC, 'tools/x.mjs'))('playwright'));
const trinh = await chromium.launch();
const kq = [], loi = [];
const ok = (ten, dat, them = '') => { kq.push(dat); console.log(`${dat ? '✅' : '❌'} ${ten}${them ? ' — ' + them : ''}`); };
const cho = async (f, ms = 6000, nhip = 100) => { const het = Date.now() + ms; let v; while (Date.now() < het) { v = await f(); if (v) return v; await new Promise(r => setTimeout(r, nhip)); } return v; };
const ngu = ms => new Promise(r => setTimeout(r, ms));

async function moMay(id) {
  const ctx = await trinh.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'vi-VN' });
  await ctx.route(/supabase-js/, r => r.abort());
  await ctx.route(/posthog/, r => r.abort());
  await ctx.routeWebSocket(u => u.pathname.endsWith('/ws'), ws => { phong.noi(ws, id, 'Thử ' + id); });
  const p = await ctx.newPage();
  p.on('pageerror', e => loi.push(`[${id}] ${e.message} @ ${(e.stack || '').split('\n')[1]?.trim() || ''}`));
  await p.goto(`http://localhost:${PORT}/?thu=1&phong=${id}`);
  await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
  await p.waitForTimeout(600);
  await p.tap('#btn-guest');
  await p.waitForFunction(() => window.__game?.save && window.__game.player, null, { timeout: 30000 });
  await p.evaluate(() => {
    const g = window.__game, d = g.dialog;
    for (const k of Object.keys(d)) if (typeof d[k] === 'function' && k !== 'close') d[k] = async () => null;
    d.open = false; const box = document.getElementById('dialog'); if (box) box.hidden = true;
    g.closeAll?.(); g.auto = false; g.khoaBo = true;
    const goc = g.sfx; window.__tieng = []; g.sfx = (n, ...r) => { window.__tieng.push(n); return goc?.(n, ...r); };
    const gt = g.toast.bind(g); window.__chu = []; g.toast = (t, ...r) => { window.__chu.push(t); return gt(t, ...r); };
  });
  return { id, ctx, p };
}
const toi = X => X.p.evaluate(async () => { const g = window.__game; g.save.visited['thien-kiem-phong'] = true; g.save.realm = 0; g.save.layer = 6;
  await g.travel('thien-kiem-phong', 'vao', false, { force: true }); return g.map.id; });
const thay = (X, id) => X.p.evaluate(i => { const o = window.__game.others.list.get(i); return o && o.x != null ? { x: o.x, y: o.y } : null; }, id);

const A = await moMay('may-a'), B = await moMay('may-b');
await B.p.evaluate(() => { const s = window.__game.save; s.realm = 0; s.layer = 6; });
await B.p.evaluate(() => window.__thu.hoaMa(window.__game));
ok('B hóa ma', !!(await cho(() => B.p.evaluate(() => window.__game.pvp?.ma === 1), 5000)));
phong.datMa('may-b', 2);
const BAY = process.env.BAY !== '0';   // BAY=0: B chưa học ngự kiếm (về làng đầu)
await B.p.evaluate(b => { const f = window.__game.save.flags; if (b) f['ngu-kiem'] = true; else delete f['ngu-kiem']; }, BAY);   // B có 2 điểm ma: gục vì thiên phạt xong vẫn là ma, phải bị đẩy đi
const [ma, mb] = [await toi(A), await toi(B)];
ok('A, B tới Thiên Kiếm Tinh', ma === 'thien-kiem-phong' && mb === 'thien-kiem-phong', `${ma} / ${mb}`);
ok('A thấy B trên Thiên Kiếm Tinh', !!(await cho(() => thay(A, 'may-b'), 6000)));
ok('Điểm ma của B là 2 sau khi vào phòng mới', !!(await cho(() => B.p.evaluate(() => window.__game.pvp?.ma === 2), 5000)), JSON.stringify(await B.p.evaluate(() => window.__game.pvp)));

// Theo dõi máu B mỗi 100 ms tới lúc B bị đẩy khỏi Thiên Kiếm Tinh (hoặc hết 25 giây)
const t0 = Date.now(), dong = [];
let truoc = '';
for (let i = 0; i < 250; i++) {
  const s = await B.p.evaluate(() => { const g = window.__game, p = g.player; return { hp: Math.round(p.hp), max: Math.round(p.maxHp), ghost: !!g.ghost, map: g.map.id, trip: !!g.trip, ma: g.pvp?.ma, chu: window.__chu.slice(-1)[0] || '' }; });
  const k = `${s.hp}|${s.ghost}|${s.map}|${s.trip}|${s.ma}`;
  if (k !== truoc) { dong.push({ t: (Date.now() - t0) / 1000, ...s }); truoc = k; }
  if (s.map !== 'thien-kiem-phong' && !s.trip && !s.ghost) break;
  await ngu(100);
}
for (const d of dong.slice(0, 30)) console.log(`  ${d.t.toFixed(1)}s máu ${d.hp}/${d.max}${d.ghost ? ' gục' : ''}${d.trip ? ' đang bay' : ''} ${d.map} ma ${d.ma} | ${d.chu.slice(0, 70)}`);
const tpXuong = phong.dem.xuong.tp || 0, chuB = await B.p.evaluate(() => window.__chu), tiengA = await A.p.evaluate(() => window.__tieng.filter(n => n === 'thunder').length);
const gucLuc = dong.find(d => d.ghost), hpThap = Math.min(...dong.filter(d => d.t < (gucLuc?.t ?? 1e9) - 0.05).map(d => d.hp));
ok('Hai đạo đầu trừ máu B mà không gục', dong.some(d => !d.ghost && d.hp < d.max) && hpThap >= 1, `máu thấp nhất trước lúc gục ${hpThap}`);
ok('Phòng phát tin đạo cho cả phòng (2 đạo × 2 máy), rồi thôi', tpXuong === 4, `tin tp xuống: ${tpXuong}`);
ok('A thấy sét trên B (tiếng sấm)', tiengA >= 2, `tiếng sấm trên máy A: ${tiengA}`);
ok(`Đạo thứ ${PVP.ma.tp.dao} làm B gục (khoảng ${CK * PVP.ma.tp.dao} giây)`, !!gucLuc && gucLuc.t > CK * PVP.ma.tp.dao - 1.5 && gucLuc.t < CK * PVP.ma.tp.dao + 2.5, gucLuc ? `gục lúc ${gucLuc.t.toFixed(1)}s` : 'không gục');
const chuGuc = await B.p.evaluate(() => window.__game.data.pvp.text.thien_phat_guc.replace('{n}', '1'));
ok('B được báo gục vì thiên phạt, điểm ma còn 1', chuB.includes(chuGuc), chuB.slice(-4).join(' / '));
const cuoi = dong.at(-1);
ok(`B hồi sinh ở tinh cầu khác (${BAY ? 'đã mở' : 'làng đầu'}), vẫn là ma`, (BAY ? cuoi.map !== 'thien-kiem-phong' && cuoi.map !== 'thanh-khe' : cuoi.map === 'thanh-khe') && !cuoi.ghost && cuoi.ma === 1, `${cuoi.map}, ma ${cuoi.ma}`);
ok('Phòng giả giữ điểm ma 1 cho B', (await B.p.evaluate(() => window.__game.pvp?.ma)) === 1);

// Túi Linh Thạch: C (người) tới Thiên Kiếm Tinh; đặt một túi 250 nghìn cạnh A (cách 60: chưa nhặt, thấy số), chụp; rồi A bước tới nhặt
const C = await moMay('may-c'); await toi(C);
await cho(() => thay(A, 'may-c'), 6000);
const vt = await A.p.evaluate(() => { const p = window.__game.player; return { x: Math.round(p.x), y: Math.round(p.y) }; });
const TUI = { id: 901, map: 'thien-kiem-phong', x: vt.x + 60, y: vt.y, so: 250000 };
phong.tui.set(TUI.id, { ...TUI });
for (const X of [A, C]) await X.p.evaluate(async t => { const m = await import('/src/game/tui-lt.js'); m.tuiMoi(window.__game, t); }, TUI);   // đường thật lúc máy người gục trả nợ ra túi
await A.p.evaluate(() => { const g = window.__game; g.screen?.snap?.(g.player.x + 30, g.player.y); });
await ngu(700);
const mau = await A.p.evaluate(() => window.__game.tui.ds[0]);
ok('Túi 250 nghìn có màu bậc Hiếm như triệu hồi', mau.b === 2, `bậc ${mau.b}, màu ${mau.color}`);
await A.p.evaluate(t => { const p = window.__game.player; p.x = t.x - 8; p.y = t.y; }, TUI);
const nhat = await cho(() => A.p.evaluate(() => !window.__game.tui.ds.length && window.__chu.some(c => c.includes('Nhặt được túi'))), 4000);
ok('A chạy qua túi thì nhặt được (phòng → lõi Mang giả → ltn)', !!nhat, (await A.p.evaluate(() => window.__chu.slice(-2).join(' / '))));
ok('Lõi Mang giả ghi người nhặt là A', phong.tui.get(TUI.id).nhat === 'may-a');
ok('C thấy túi mất (lt-)', !!(await cho(() => C.p.evaluate(() => !window.__game.tui.ds.length), 3000)));
await ngu(300);
ok('Không lỗi JavaScript ở máy nào', !loi.length, loi.slice(0, 4).join(' | '));
console.log(`Tin qua phòng giả — lên: ${JSON.stringify(phong.dem.len)}; xuống: ${JSON.stringify(phong.dem.xuong)}`);
await trinh.close(); server.close();
const truot = kq.filter(x => !x).length;
console.log(truot ? `❌ trượt ${truot}/${kq.length}` : `✅ đạt ${kq.length}/${kq.length}`);
process.exit(truot ? 1 : 0);
