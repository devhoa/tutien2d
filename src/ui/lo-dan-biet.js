// Túi đồ → Luyện đan: dải "Đan đã biết" (chủ dự án 23/11/2026, góp ý #187 chọn đúng loại đan, #175 luyện nhanh, #179 đan phương).
// Đan đã biết (từng luyện thành, đã mua đan phương, hoặc có trong túi) hiện thành hàng ô; chạm một đan: bỏ tối đa số bộ / chọn số bộ (lò chỉ
// luyện đúng đan đó), hoặc mua đan phương. Đan chưa biết vẫn mò như cũ. Luật ở src/game/lo-dan.js.
import { el } from './bag-detail.js';
import { uiIco } from './self-gear.js';
import { bietDan, coPhuong, giaPhuong, toiDaBo, loRate, muaPhuong } from '../game/lo-dan.js';
import { hoiNho } from './hoi-nho.js';   // hộp hỏi nhỏ khung bạc, nổi trên bảng (23/11/2026 14:34)

const vn = n => Math.floor(n || 0).toLocaleString('vi-VN');
const pct = x => Math.round(x * 100);
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

// Bỏ nguyên liệu đúng n bộ của đan id vào lò, đánh dấu mẻ chọn đan
export function chonDan(game, ld, id, n) {
  const r = game.data.cave.pills[id]?.recipe || {};
  ld.put = Object.fromEntries(Object.entries(r).map(([k, x]) => [k, x * n]));
  ld.dan = id; ld.danN = n; ld.last = '';
}

// Chữ dòng thông tin khi đang chọn đan
export function chonInfo(game, ld) {
  const p = game.data.cave.pills[ld.dan];
  return p ? fill(game.data.cave.lo.text.chon_info, { name: p.name, n: ld.danN, tl: pct(loRate(game, ld.danN, ld.dan)) }) : '';
}

export function renderBiet(game, ld, col, refresh, askQty, ico) {
  const D = game.data, T = D.cave.lo.text, ids = bietDan(game);
  const ghi = T.biet_ghi ? el('div', 'ld-ghi', T.biet_ghi) : null;   // luyện thành một lần mới mua được đan phương (CSKH #268 26/11/2026)
  if (!ids.length) { if (ghi) { const h0 = el('div', 'ld-h'); h0.append(el('span', null, T.biet)); col.append(h0, ghi); } return; }
  const head = el('div', 'ld-h'); head.append(el('span', null, T.biet));
  const row = el('div', 'ld-kho ld-biet');
  for (const id of ids) {
    const p = D.cave.pills[id], b = el('button', 'ld-mat' + (ld.dan === id ? ' chon' : '') + (coPhuong(game, id) ? ' phuong' : ''));
    b.title = p.name;
    b.append(ico(D, id, 'ld-ico'), el('small', null, vn(game.save.pills?.[id] || 0)));   // số viên đang có, như ô nguyên liệu; tên ở title
    b.onclick = () => { if (!ld.busy) hoi(game, ld, id, refresh, askQty, ico); };
    row.append(b);
  }
  col.append(head, ...(ghi ? [ghi] : []), row);
}

async function hoi(game, ld, id, refresh, askQty, ico) {
  const D = game.data, C = D.cave.lo, T = C.text, p = D.cave.pills[id], n = toiDaBo(game, id), co = coPhuong(game, id), ph = C.phuong || {};
  const opts = [];
  if (n >= 1) {
    opts.push({ id: 'max', label: fill(T.biet_max, { n: vn(n) }), desc: fill(T.biet_max_d, { m: p.make || 1, tl: pct(loRate(game, n, id)) }), gold: true });
    if (n > 1) opts.push({ id: 'so', label: T.biet_so, desc: '' });
  } else opts.push({ id: 'thoi', label: T.biet_thieu, desc: '' });
  if (!co) opts.push({ id: 'mua', label: fill(T.biet_mua, { gia: vn(giaPhuong(game, id)) }), desc: fill(T.biet_mua_d, { them: pct(ph.them), ps: pct(ph.per_set), ps0: pct(C.per_set) }) });
  else opts.push({ id: 'thoi', label: T.biet_co, desc: '' });   // đã có đan phương: một dòng báo, chạm là đóng
  opts.push({ id: 'thoi', label: T.biet_thoi, nho: true });
  const pick = await hoiNho(fill(T.biet_hoi, { name: p.name, co: vn(game.save.pills?.[id] || 0), tl: pct(loRate(game, Math.max(1, n), id)), n: vn(Math.max(1, n)) }), opts, { ico: ico?.(D, id, 'ld-ico') });
  if (pick === 'max') { chonDan(game, ld, id, n); refresh(); }
  else if (pick === 'so') { const k = await askQty(game, id, n); if (k > 0) { chonDan(game, ld, id, k); refresh(); } }
  else if (pick === 'mua') {
    const gia = giaPhuong(game, id);
    if ((await hoiNho(fill(T.mua_phuong_hoi, { name: p.name, gia: vn(gia) }), [{ id: 'ok', label: T.mua_btn, gold: true }, { id: 'no', label: T.sl_no, nho: true }], { ico: ico?.(D, id, 'ld-ico') })) !== 'ok') return;
    const r = await muaPhuong(game, id);
    if (r.err) game.toast(r.err === 'poor' ? T.poor : r.err === 'da_co' ? T.mua_phuong_da : T.net, 2);
    else game.toast(fill(T.mua_phuong_ok, { name: p.name, them: pct(ph.them) }), 2.4);
    refresh();
  }
}
