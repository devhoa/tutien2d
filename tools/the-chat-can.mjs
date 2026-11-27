// Cân chỉ số 24 thể chất (data/the-chat.json): mỗi thể chất chia theo huong, đổi điểm ra % bằng tỷ giá của Tiềm năng (data/tiem-nang.json →
// quy), kẹp trần từng chỉ số (tran), rồi dò số điểm sao cho lực chiến thêm trên tu sĩ chuẩn đúng bằng pham.*.luc của phẩm đó. Mức thêm đo ở
// từng cảnh giới trong do.canh_gioi rồi lấy mức CAO NHẤT: thể chất Tiên phẩm không thêm quá 20% lực chiến ở bất cứ cảnh giới nào.
// Chủ dự án 25/11/2026: "từ phàm tới tiên, chỉ số được buff tổng thể không chênh lệch nhau vượt quá 20%".
// Chạy: node tools/the-chat-can.mjs          → in bảng, báo chi_so trong data có khớp không (tools/the-chat.test.mjs gọi hàm can)
//       node tools/the-chat-can.mjs --ghi    → ghi chi_so vào data/the-chat.json
import { readFileSync, writeFileSync } from 'node:fs';
import { powerOf, sumStats, stdList } from '../src/game/he-chien.js';

const duong = f => new URL(`../data/${f}.json`, import.meta.url);
const doc = f => JSON.parse(readFileSync(duong(f), 'utf8'));
const lam = x => Math.round(x * 10) / 10;

// Lực chiến thêm (%) của bảng % pct trên tu sĩ chuẩn: mức cao nhất trong các cảnh giới đo
export function lucThem(H, C, pct) {
  return Math.max(...C.do.canh_gioi.map(r => powerOf(H, sumStats(H, r, stdList(H, r), true, { pct })) / powerOf(H, sumStats(H, r, stdList(H, r), true)) - 1)) * 100;
}

// Bảng % của một thể chất ở mức s điểm
const bang = (C, Q, huong, s) => Object.fromEntries(Object.entries(huong).map(([k, p]) => [k, lam(Math.min(C.tran[k] ?? 999, s * p * (Q[k] ?? 1)))]).filter(([, v]) => v > 0));

// Trả { mã: { chi_so, luc } } cho cả 24 thể chất
export function can(C, H, Q) {
  const out = {};
  for (const [id, t] of Object.entries(C.the)) {
    const dich = C.pham[t.pham].luc;
    let lo = 0, hi = 400;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (lucThem(H, C, bang(C, Q, t.huong, m)) < dich) lo = m; else hi = m; }
    // làm tròn 0,1% có thể lệch một chút: thử quanh điểm dò, lấy bảng sát đích nhất mà không vượt đích
    let tot = null;
    for (let d = -3; d <= 1.5; d += 0.01) { const b = bang(C, Q, t.huong, hi + d), l = lucThem(H, C, b); if (l <= dich + 1e-9 && (!tot || l > tot.luc)) tot = { chi_so: b, luc: l }; }
    out[id] = tot;
  }
  return out;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const C = doc('the-chat'), H = doc('he-chien'), Q = doc('tiem-nang').quy, K = can(C, H, Q);
  let lech = 0;
  for (const [id, t] of Object.entries(C.the)) {
    const k = K[id], khop = JSON.stringify(k.chi_so) === JSON.stringify(t.chi_so);
    if (!khop) lech++;
    console.log(`${C.pham[t.pham].ten.padEnd(11)} ${t.ten.padEnd(24)} +${k.luc.toFixed(2)}%  ${Object.entries(k.chi_so).map(([s, v]) => `${s} ${v}`).join(', ')}${khop ? '' : '   ← khác data'}`);
  }
  if (process.argv.includes('--ghi')) {
    for (const id of Object.keys(C.the)) C.the[id].chi_so = K[id].chi_so;
    writeFileSync(duong('the-chat'), JSON.stringify(C, null, 1) + '\n');
    console.log(`đã ghi chi_so cho ${Object.keys(K).length} thể chất`);
  } else if (lech) { console.log(`${lech} thể chất có chi_so khác bản cân: chạy lại với --ghi`); process.exitCode = 1; }
}
