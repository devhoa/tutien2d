// Gói đoạn code tính Lực chiến của game cho hàm máy chủ luc-chien (supabase/functions/luc-chien; chủ dự án 23/11/2026 19:58 "làm sao để
// máy chủ có thể kiểm soát tốt việc này", bảng chọn "Hàm Supabase" + "Dùng số máy chủ + ghi"). Máy chủ tính lại Lực chiến từ bản lưu bằng
// ĐÚNG code của game (src/game/stats.js playerStats, src/game/achieve.js power), không chép công thức sang chỗ khác.
// Ra supabase/functions/luc-chien/game.js: một tệp ES module. Cả đoạn code đã gói (esbuild, thu gọn, dòng ≤ ~160 ký tự để chép được) nằm
// trong MỘT hàm LC; mã băm BAN là băm của LC.toString(), nên hàm máy chủ tự băm lại lúc chạy là biết bản đưa lên có đúng từng ký tự không
// (đưa hàm lên Supabase là chép nội dung tệp qua công cụ, chép sai một ký tự là hàm từ chối chạy, không tính sai lặng lẽ).
// --charset=utf8: chữ Việt để nguyên, không viết \uXXXX: bộ gói của Supabase đổi các chuỗi \uXXXX thành chữ thật nên băm lệch (đo 23/11/2026).
// KIEM=1: gói vào chỗ tạm rồi so với tệp đã có trong kho (CI chạy ở bước có esbuild, .github/workflows/check.yml). Chữ giống: đạt. Chữ khác
// thì so KẾT QUẢ trên bộ bản lưu mẫu (tools/luc-chien-mau.mjs): cùng số là đạt (giữ bản trong kho, đúng bản đang chạy trên Supabase); khác số
// là báo đỏ: cách tính đã đổi, gói lại, commit, đưa hàm lên lại Supabase (docs/03-CAU-TRUC.md).
// Chạy ở gốc kho: node tools/goi-luc-chien.mjs   (ESBUILD=đường dẫn nếu máy không có esbuild trong node_modules / npx)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { bamCode, docDau } from './luc-chien-bam.mjs';
import { soSanh } from './luc-chien-mau.mjs';
import { pathToFileURL } from 'node:url';
import { readdirSync } from 'node:fs';

const ROOT = resolve(import.meta.dirname, '..'), OUT = join(ROOT, 'supabase/functions/luc-chien/game.js');
const thu = [process.env.ESBUILD, join(ROOT, 'node_modules/.bin/esbuild'), '/opt/npm-tools/node_modules/esbuild/bin/esbuild'].filter(Boolean);
let ES = thu.find(p => existsSync(p)) ? [thu.find(p => existsSync(p))] : null;
if (!ES) { try { execFileSync('npx', ['--no-install', 'esbuild', '--version'], { stdio: 'ignore' }); ES = ['npx', '--no-install', 'esbuild']; } catch { /* không có */ } }
if (!ES) { console.error('Không thấy esbuild: đặt ESBUILD=… hoặc npm i --no-save esbuild'); process.exit(1); }

const tmp = mkdtempSync(join(tmpdir(), 'luc-chien-')), entry = join(tmp, 'vao.js'), meta = join(tmp, 'meta.json'), out = join(tmp, 'game.js');
writeFileSync(entry, `export { playerStats } from ${JSON.stringify(join(ROOT, 'src/game/stats.js'))};\nexport { power } from ${JSON.stringify(join(ROOT, 'src/game/achieve.js'))};\n`);
execFileSync(ES[0], [...ES.slice(1), entry, '--bundle', '--format=iife', '--global-name=LC', '--platform=neutral', '--minify', '--line-limit=160', '--charset=utf8',
  '--legal-comments=none', `--outfile=${out}`, `--metafile=${meta}`], { stdio: ['ignore', 'ignore', 'inherit'] });
const goi = readFileSync(out, 'utf8');
rmSync(tmp, { recursive: true, force: true });
const m = /^var LC=\(\(\)=>\{([\s\S]*)\}\)\(\);\n?$/.exec(goi);
if (!m) { console.error('luc-chien: esbuild ra dạng lạ (không phải var LC=(()=>{…})();), sửa tools/goi-luc-chien.mjs'); process.exit(1); }
const fn = `()=>{${m[1]}}`, bam = bamCode(fn);
const tep = `// luc-chien: ${JSON.stringify({ bam })}\n// Tệp sinh bằng node tools/goi-luc-chien.mjs (code tính Lực chiến của game cho hàm máy chủ), đừng sửa tay.\n`
  + `const LC=${fn};\nexport const NGUON = LC.toString();\nexport const { playerStats, power } = LC();\nexport const BAN = ${JSON.stringify(bam)};\n`;
async function soKetQua(cu, moi) {
  const dir = mkdtempSync(join(tmpdir(), 'luc-chien-so-')), a = join(dir, 'cu.mjs'), b = join(dir, 'moi.mjs');
  writeFileSync(a, cu); writeFileSync(b, moi);
  try {
    const goc = {};
    for (const f of readdirSync(join(ROOT, 'data'))) if (f.endsWith('.json')) goc[f.slice(0, -5)] = JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8'));
    return soSanh(await import(pathToFileURL(a).href), await import(pathToFileURL(b).href), goc);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
if (process.env.KIEM === '1') {
  const cu = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (cu === tep) { console.log(`luc-chien: khớp (${bam})`); process.exit(0); }
  // Chữ khác: thường chỉ là đổi tên biến vì một tệp không liên quan trong cùng cây import đổi. So KẾT QUẢ trên bộ bản lưu mẫu
  // (tools/luc-chien-mau.mjs): cùng số thì giữ bản trong kho (= bản đang chạy trên Supabase), khỏi phải chép hàm lên lại.
  const khac = cu ? await soKetQua(cu, tep) : ['chưa có game.js'];
  if (khac.length) {
    console.error(`luc-chien: cách tính Lực chiến đã đổi (gói mới ${bam}, trong kho ${docDau(cu)?.bam || 'chưa có'}; ${khac.length} bản lưu mẫu ra số khác, vd ${khac.slice(0, 2).join(' | ')}): chạy node tools/goi-luc-chien.mjs, commit, rồi đưa hàm luc-chien lên lại Supabase`);
    process.exit(1);
  }
  console.log(`luc-chien: gói lại khác chữ nhưng mọi bản lưu mẫu ra cùng số với bản trong kho (${docDau(cu)?.bam}): giữ nguyên, không cần đưa hàm lên lại`);
} else {
  writeFileSync(OUT, tep);
  console.log(`đã gói → ${relative(ROOT, OUT)} (${Math.round(tep.length / 1024)} KB), mã băm ${bam}`);
}
