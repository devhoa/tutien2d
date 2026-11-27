// Bảng linh khí THẬT của 81 tầng theo đúng công thức máy khách (src/game/stats.js qiNeed), để so với máy chủ
// (p2d_lk_can_that, migration 20261126040000_p2d_lk_tang_that: bộ hãm linh khí tính mỗi lần lên tầng theo bảng này).
//   node tools/lk-that.mjs            in bảng (dán vào phần tự kiểm tra của migration mới khi đổi need_mul / need_layer)
//   node tools/lk-that.mjs --thu 400  in SQL các lần lưu ngẫu nhiên của người chơi thật cho tools/may-chu-thu/lk-that.sh
// tools/check.mjs gọi bangLkThat để so data/realms.json với bảng trong migration mới nhất có dấu "lk_that_81".
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function bangLkThat(R) {
  const need = n => {
    const realm = Math.floor(n / R.layers), layer = n % R.layers + 1, soft = R.qi_soft_from ?? Infinity, mul = R.need_mul?.[realm] ?? 1, T = R.need_layer?.[realm];
    if (T) return Math.round(T[Math.max(1, Math.min(layer, T.length)) - 1] * mul);
    return Math.round(R.qi_base * Math.pow(R.qi_growth, Math.min(n, soft)) * Math.pow(R.qi_soft_growth || 1, Math.max(0, n - soft)) * mul);
  };
  return Array.from({ length: R.names.length * R.layers }, (_, n) => need(n));
}

// Số ngẫu nhiên có hạt (bài thử chạy lại ra đúng các ca cũ)
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const R = JSON.parse(readFileSync(new URL('../data/realms.json', import.meta.url), 'utf8')), B = bangLkThat(R);
  const i = process.argv.indexOf('--thu');
  if (i < 0) { console.log(JSON.stringify(B)); process.exit(0); }
  // Người chơi thật: ở tầng n1 có q1, được thêm G (không quá thùng), máy khách tự lên tầng trong cùng cảnh giới như addQi
  // (tầng cuối thì giữ đầy). Máy chủ phải nhận nguyên và trừ thùng đúng phần linh khí thật vừa được.
  const N = +process.argv[i + 1] || 200, r = rng(20261126), out = ["select set_config('thu.pha', 'sau', false);"];
  for (let k = 0; k < N; k++) {
    const realm = Math.floor(r() * 5), n1 = realm * 9 + Math.floor(r() * 9), q1 = Math.floor(r() * B[n1] * 0.999);
    const xo = 450000, G = Math.floor(r() * r() * 440000);
    let n = n1, q = q1 + G, duoc = G;
    while (q >= B[n]) { if (n % 9 === 8) { duoc -= q - B[n]; q = B[n]; break; } q -= B[n]; n++; }
    out.push(`select thu.that(${n1}, ${q1}, ${n}, ${q}, ${xo}, ${duoc});`);
  }
  console.log(out.join('\n'));
}
