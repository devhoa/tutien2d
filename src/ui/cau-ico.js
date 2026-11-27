// Hình đồ câu trong giao diện (ô kho, quầy Lão Ngư Ông, thẻ nhận): ảnh GPT của chủ dự án nếu data/art.json có ui.vk-<mã>, chưa có thì
// hình điểm ảnh vẽ bằng code (src/render/ca-hinh.js) phóng nguyên lần.
import { caHinh, anhCau } from '../render/ca-hinh.js';

export function caIco(data, id, size = 40, cls = 'ico') {
  const spr = anhCau(data, id);
  if (spr) { const i = document.createElement('i'); i.className = cls + ' that'; i.style.setProperty('--ic', `url("${spr.file}?v=${spr.v}")`); return i; }
  const src = caHinh(data, id), cv = document.createElement('canvas');
  cv.width = cv.height = src.width; cv.className = cls + ' ca-px';
  cv.getContext('2d')?.drawImage(src, 0, 0);
  cv.style.width = cv.style.height = size + 'px'; cv.style.imageRendering = 'pixelated';
  return cv;
}

// Mã này là đồ câu (loài, châu, mồi, cần, món) chưa có ảnh: nơi vẽ ô dùng caIco thay ô màu
export function laDoCau(data, id) {
  const F = data.fishing, m = data.cave.materials[id];
  return !!(F?.fish?.[id] || F?.moi?.[id] || F?.can?.[id] || F?.mon?.[id] || m?.loai === 'chau');
}
