// Bài thử PHONG HÀO TRÊN BẢNG XẾP HẠNG và TÊN TÔNG MÔN TRÊN ĐẦU MÌNH (chủ dự án 23/11/2026 23:45, 23:51).
//   1. Tên tông môn « … » trên đầu chính mình (src/render/draw-nguoi.js, game/guild.js tenTongToi): người khác do máy chủ phòng gắn, mình lấy
//      bản tông môn đã tải; nằm giữa danh hiệu và nút tên, danh hiệu lên trên nó; không có tông môn thì danh hiệu về chỗ cũ (title_gap).
//   2. Phong hào trước tên trên tab Xếp hạng (src/ui/rank-view.js, game/phong-hao.js phongHaoDong), cùng luật như trên đầu: tộc (máy chủ trả
//      'toc' mỗi dòng bảng Sức mạnh) + bậc theo hạng bảng Sức mạnh; có tên trên bảng Ma hóa thì phong hào Ma theo hạng bảng đó; bị gắn cờ thì
//      không; dòng của mình y như nhãn tên mình; bảng khác (Cảnh giới…) vẫn theo hạng bảng Sức mạnh. Máy chủ chưa trả tộc (bản cũ): chỉ hiện
//      phong hào Ma và của mình, không đoán tộc.
// Khách chơi thử trong trình duyệt, thư viện Supabase thay bằng bản giả trả bảng xếp hạng dựng sẵn.
// Chạy ở thư mục bản đã gói như CI (node tools/goi.mjs _site; cd _site; node ../tools/kiem/phong-hao-bxh.thu.mjs), hoặc ở gốc kho.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
const PORT = 8796, ANH = process.env.ANH || '';   // ANH=thư mục: chụp ảnh bảng xếp hạng, đầu nhân vật
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const file = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  try { const body = await readFile(join(process.cwd(), file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(PORT);

// Thư viện Supabase giả. Bảng Sức mạnh: k1 hạng 1 Linh tộc, k2 hạng 2 Yêu tộc, mình hạng 3, k4 hạng 4 nhưng đang hóa ma (hạng 1 bảng Ma hóa),
// k5 hạng 5 bị gắn cờ, k6 hạng 40 chưa làm lễ huyết mạch (tộc null). ?cu=1: máy chủ bản cũ, dòng không có trường 'toc'.
const GIA = `
const cu = new URLSearchParams(location.search).has('cu');
const dong = (hang, k, ten, toc, o = {}) => ({ hang, ten, k, gia_tri: 1000000 - hang * 1000, canh_gioi: 2, tang: 3, co: false, la_toi: false, ...(cu ? {} : { toc }), ...o });
const LUC = [dong(1, 'k00000000001', 'Người Một', 'linh'), dong(2, 'k00000000002', 'Người Hai', 'yeu'), dong(3, 'k00000000003', 'Mình', 'nhan', { la_toi: true }),
  dong(4, 'k00000000004', 'Người Ma', 'than'), dong(5, 'k00000000005', 'Người Cờ', 'co', { co: true }), dong(40, 'k00000000006', 'Người Trống', null)];
const CANH = [dong(1, 'k00000000006', 'Người Trống', null), dong(7, 'k00000000001', 'Người Một', 'linh')];
const bang = (fn, a) => {
  if (fn === 'p2d_bxh_het') return { top: a?.p_loai === 'canh_gioi' ? CANH : LUC, toi: { hang: 3 }, danh_hieu: [] };
  if (fn === 'p2d_bxh2_het' && a?.p_loai === 'ma') return { top: [{ hang: 1, ten: 'Người Ma', k: 'k00000000004', gia_tri: 12, co: false, la_toi: false }], toi: null };
  if (fn === 'p2d_bxh2_het') return { top: [], toi: null };
  if (fn === 'p2d_bang_toi') return window.__toi ?? null;
  return null;
};
export function createClient() {
  const sess = { user: { id: 'u-thu' }, access_token: 't' };
  return {
    rpc: async (fn, a) => ({ data: bang(fn, a), error: null }),
    auth: { getSession: async () => ({ data: { session: sess } }), getUser: async () => ({ data: { user: sess.user } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), refreshSession: async () => ({ data: { session: sess } }) },
    channel: () => ({ on() { return this; }, subscribe() { return this; }, send() {}, unsubscribe() {} }), removeChannel() {},
    from: () => ({ select() { return this; }, eq() { return this; }, then: r => r({ data: [], error: null }) }),
  };
}`;

const b = await chromium.launch();
let hong = 0;
const thu = (dk, ten) => { console.log(`${dk ? 'ĐẠT ' : 'HỎNG'}  ${ten}`); if (!dk) hong++; };

async function moTrang(q = '') {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: ANH ? 2 : 1, hasTouch: true, isMobile: true, locale: 'vi-VN' });
  await ctx.addInitScript(() => { const t = setInterval(() => { if (window.__game) { window.__game.khoaBo = true; clearInterval(t); } }, 20); });
  await ctx.route(/supabase-js/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: GIA }));
  await ctx.route(/posthog/, r => r.abort());
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/?thu=1${q}`);
  await p.waitForSelector('#btn-guest:not([disabled])', { timeout: 30000 });
  await p.waitForTimeout(800);
  await p.tap('#btn-guest');
  await p.waitForFunction(() => window.__game?.save && window.__game.map && window.__game.player, null, { timeout: 30000 });
  await p.evaluate(() => {   // bỏ hội thoại truyện, vào mạng giả (mọi lệnh phòng thành rỗng), bản lưu máy chủ giả
    const g = window.__game, d = g.dialog;
    for (const k of Object.keys(d)) if (typeof d[k] === 'function' && k !== 'close') d[k] = async () => null;
    d.open = false; const box = document.getElementById('dialog'); if (box) box.hidden = true; g.closeAll?.(); g.auto = false;
    setInterval(() => { d.open = false; if (box) box.hidden = true; for (const e of document.querySelectorAll('.ht-back')) e.hidden = true; }, 250);
    g.online = g.online || new Proxy({ me: { id: 'u-thu' }, id: 'u-thu' }, { get: (t, k) => (k in t ? t[k] : () => {}) });
    g.cloud = g.cloud || { run: async (job, mirror) => { const r = await job(); mirror?.(r); return r; }, flush: async () => {}, save() {}, mark() {} };
  });
  return { ctx, p, errs };
}

// Bảng xếp hạng đang hiện → { tên: { ph, mau } }
const docBang = p => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#rank-list > div')].filter(d => d.querySelector('span')).map(d => {
  const s = d.querySelector('span .ph'), ten = [...d.querySelector('span').childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  return [ten, s ? { ph: s.textContent, mau: s.style.color, sang: s.classList.contains('sang') } : null];
})));
async function moTab(p, id) {
  await p.evaluate(id => { const g = window.__game; g.closeAll?.(); g.rankKind?.(id); g.openSocial?.('rank'); }, id);
  await p.waitForFunction(() => document.querySelectorAll('#rank-list > div span').length > 0, null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(300);
}

// ===== 1 + 2: máy chủ bản mới =====
{
  const { p, errs } = await moTrang();
  // 1. Tên tông môn trên đầu mình. Ghi lại chữ vẽ trên khung (toạ độ bản đồ).
  await p.evaluate(() => {
    const P = CanvasRenderingContext2D.prototype, f0 = P.fillText;
    window.__chu = [];
    P.fillText = function (t, x, y, ...r) { window.__chu.push({ t: String(t), x, y }); if (window.__chu.length > 400) window.__chu.splice(0, 200); return f0.call(this, t, x, y, ...r); };
    window.__thu.epHoSo({ title: 'dao-van' });   // ép danh hiệu cho dễ soát vị trí
  });
  const doChu = () => p.evaluate(() => new Promise(res => { window.__chu = []; setTimeout(() => {
    const g = window.__game, pl = g.player, ti = g.data.status.titles['dao-van'].name;
    const cua = t => window.__chu.filter(c => c.t === t && Math.abs(c.x - pl.x) < 0.5).map(c => c.y);
    const tong = window.__chu.filter(c => c.t.startsWith('« ') && Math.abs(c.x - pl.x) < 0.5);
    // Lấy lần vẽ CUỐI trong khoảng đo: mấy khung đầu sau khi vào game hình nhân vật chưa nạp xong (pl.top chưa có, vẽ theo mức 24), còn
    // « đỉnh đầu » đo ở cuối khoảng đã theo pl.top thật; lấy lần vẽ đầu thì lệch 15 điểm, bài trượt ngẫu nhiên (gặp 25/11/2026 cả trên main).
    res({ tong: tong.map(c => c.t), tongY: tong.at(-1)?.y ?? null, tiY: cua(ti).at(-1) ?? null, dinh: pl.y - (pl.top || 24), gap: g.data.heroes.title_gap });
  }, 600); }));
  await p.evaluate(() => { window.__toi = { bang: { id: 'b1', ten: 'Thiên Kiếm Các' }, chuc: 'chu', xin: [], tv: [] }; window.__game.guild = { mine: window.__toi, list: [] }; });
  let c = await doChu();
  thu(c.tong.length > 0 && c.tong.every(t => t === '« Thiên Kiếm Các »'), `trên đầu mình có « Thiên Kiếm Các » (${JSON.stringify(c.tong.slice(0, 2))})`);
  thu(c.tongY != null && c.tiY != null && c.tiY < c.tongY - 3, `danh hiệu nằm TRÊN tên tông môn (danh hiệu y ${c.tiY?.toFixed(1)}, tông y ${c.tongY?.toFixed(1)})`);
  thu(c.tongY != null && c.tongY < c.dinh - 8, `tên tông môn nằm trên nút tên (tông y ${c.tongY?.toFixed(1)}, đỉnh đầu ${c.dinh.toFixed(1)})`);
  if (ANH) await p.screenshot({ path: `${ANH}/tong-tren-dau.png` });
  await p.evaluate(() => { window.__toi = null; window.__game.guild.mine = null; });
  c = await doChu();
  thu(!c.tong.length, `rời tông môn: trên đầu mình không còn « … » (${c.tong.length})`);
  thu(c.tiY != null && Math.abs(c.tiY - (c.dinh - c.gap)) < 0.6, `không có tông môn: danh hiệu về chỗ cũ title_gap (${c.tiY?.toFixed(1)} / ${(c.dinh - c.gap).toFixed(1)})`);
  await p.evaluate(() => { window.__toi = { bang: { id: 'b1', ten: 'Thiên Kiếm Các' }, chuc: 'chu', xin: [], tv: [] }; window.__game.guild.mine = window.__toi; window.__game.online = null; });
  c = await doChu();
  thu(!c.tong.length, `mất kết nối phòng (không ai thấy mình): không vẽ tên tông môn (${c.tong.length})`);
  await p.evaluate(() => { window.__game.online = new Proxy({ me: { id: 'u-thu' }, id: 'u-thu' }, { get: (t, k) => (k in t ? t[k] : () => {}) }); });

  // 2. Bảng xếp hạng
  const M = await p.evaluate(() => { const C = window.__game.data.status.phong_hao; return { C, toi: window.__thu.phongHaoToi?.(window.__game)?.chu ?? null }; });
  const C = M.C, ten = (toc, i) => C.ten[toc][i];
  await moTab(p, 'luc_chien');
  let r = await docBang(p);
  const toi = await p.evaluate(() => window.__thu.phongHaoToi(window.__game)?.chu ?? null);
  thu(r['Người Một']?.ph === ten('linh', 0), `Sức mạnh hạng 1 Linh tộc: "${r['Người Một']?.ph}" (đúng: ${ten('linh', 0)})`);
  thu(r['Người Một']?.sang === true && !!r['Người Một']?.mau, `bậc cao phát sáng, có màu bậc (${JSON.stringify(r['Người Một'])})`);
  thu(r['Người Hai']?.ph === ten('yeu', 1), `hạng 2 Yêu tộc: "${r['Người Hai']?.ph}" (đúng: ${ten('yeu', 1)})`);
  thu(r['Người Ma']?.ph === ten('ma', 0), `đang hóa ma (hạng 1 bảng Ma hóa): "${r['Người Ma']?.ph}" (đúng: ${ten('ma', 0)})`);
  thu(r['Người Cờ'] === null, `bị gắn cờ: không phong hào (${JSON.stringify(r['Người Cờ'])})`);
  thu(r['Người Trống']?.ph === ten(C.mac_dinh, 4), `chưa làm lễ huyết mạch (tộc null), hạng 40: "${r['Người Trống']?.ph}" (đúng: ${ten(C.mac_dinh, 4)})`);
  thu(!!toi && r['Mình']?.ph === toi, `dòng của mình y như nhãn tên mình: "${r['Mình']?.ph}" / "${toi}"`);
  if (ANH) await p.screenshot({ path: `${ANH}/bxh-suc-manh.png` });
  await moTab(p, 'canh_gioi');
  r = await docBang(p);
  thu(r['Người Một']?.ph === ten('linh', 0) && r['Người Trống']?.ph === ten(C.mac_dinh, 4), `bảng Cảnh giới vẫn theo hạng bảng Sức mạnh: "${r['Người Một']?.ph}", "${r['Người Trống']?.ph}"`);
  await moTab(p, 'ma');
  r = await docBang(p);
  thu(r['Người Ma']?.ph === ten('ma', 0), `bảng Ma hóa: "${r['Người Ma']?.ph}" (đúng: ${ten('ma', 0)})`);
  if (ANH) await p.screenshot({ path: `${ANH}/bxh-ma-hoa.png` });
  const gach = await p.evaluate(() => { const s = document.querySelector('#rank-list .ph'); return s ? getComputedStyle(s).display : null; });
  thu(gach === 'inline-block', `phong hào là inline-block (gạch chân dòng chạm được không chạy dưới phong hào): ${gach}`);
  if (errs.length) { console.log('LỖI TRANG:', errs.slice(0, 3)); hong++; }
}

// ===== 3: máy chủ bản cũ (chưa trả 'toc') =====
{
  const { p, errs } = await moTrang('&cu=1');
  const C = await p.evaluate(() => window.__game.data.status.phong_hao);
  await moTab(p, 'luc_chien');
  const r = await docBang(p), toi = await p.evaluate(() => window.__thu.phongHaoToi(window.__game)?.chu ?? null);
  thu(r['Người Một'] === null && r['Người Hai'] === null && r['Người Trống'] === null, `máy chủ cũ: không đoán tộc, dòng người thường không phong hào (${JSON.stringify([r['Người Một'], r['Người Hai']])})`);
  thu(r['Người Ma']?.ph === C.ten.ma[0], `máy chủ cũ: phong hào Ma vẫn hiện (không theo tộc): "${r['Người Ma']?.ph}"`);
  thu(!!toi && r['Mình']?.ph === toi, `máy chủ cũ: dòng của mình vẫn hiện: "${r['Mình']?.ph}"`);
  if (errs.length) { console.log('LỖI TRANG:', errs.slice(0, 3)); hong++; }
}

console.log(hong ? `phong-hao-bxh.thu: HỎNG ${hong}` : 'phong-hao-bxh.thu: ok');
await b.close(); server.close(); process.exit(hong ? 1 : 0);
