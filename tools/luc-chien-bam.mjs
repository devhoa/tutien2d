// Mã băm đoạn code tính Lực chiến đã gói cho hàm máy chủ luc-chien (tools/goi-luc-chien.mjs ghi vào dòng đầu game.js, KIEM=1 so lại).
import { createHash } from 'node:crypto';

export const bamCode = code => createHash('sha256').update(code).digest('hex').slice(0, 16);

// Băm từng dòng (8 ký tự) để tìm dòng chép sai khi bản trên máy chủ lệch (hàm luc-chien ?kiem=1 trả cùng danh sách)
export const bamDong = code => code.split('\n').map(l => createHash('sha256').update(l).digest('hex').slice(0, 8));

// Đọc dòng đầu của game.js đã gói: { bam }
export function docDau(text) {
  const m = /^\/\/ luc-chien: (\{.*\})\n/.exec(text);
  return m ? JSON.parse(m[1]) : null;
}
