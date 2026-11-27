// Sổ đếm hình tải hỏng trên máy người chơi (26/11/2026 02:00: iPhone chủ dự án vào game mất 74 giây, mất khung bảng trên, icon,
// nền đất, hình nhân vật; tắt mở lại vẫn mất; máy thử Chromium cùng bộ đồ, cùng chỗ đứng thì đủ hình). Trước đây máy không báo gì nên
// không biết hình hỏng vì mạng, vì tấm cũ còn lưu tạm sai cỡ, hay vì máy hết bộ nhớ. Ở đây chỉ ghi; src/game/hinh-bao.js gửi về bảng lỗi.
const so = { hong: new Map(), saiCo: new Map(), rong: new Map(), css: new Map(), lanDau: 0 };

// loai: 'hong' tải lỗi, 'saiCo' tải được mà khác cỡ data/art.json, 'rong' tải xong mà cỡ 0 (trình duyệt không giải mã được), 'css' hình khung CSS
export function ghiHinh(loai, src, them = '') {
  const m = so[loai]; if (!m) return;
  const ten = String(src).split('/').pop().slice(0, 60);
  const cu = m.get(ten);
  m.set(ten, { lan: (cu?.lan || 0) + 1, them: String(them).slice(0, 40) });
  if (!so.lanDau) so.lanDau = Math.round(performance.now() / 100) / 10;
}
// Hình đã tải lại được thì gạch khỏi sổ
export function boHinh(loai, src) { so[loai]?.delete(String(src).split('/').pop().slice(0, 60)); }

export function soHinh() {
  const mau = m => [...m].slice(0, 6).map(([k, v]) => `${k}${v.lan > 1 ? '×' + v.lan : ''}${v.them ? ' ' + v.them : ''}`);
  return { hong: so.hong.size, saiCo: so.saiCo.size, rong: so.rong.size, css: so.css.size, lanDau: so.lanDau,
    mau: { hong: mau(so.hong), saiCo: mau(so.saiCo), rong: mau(so.rong), css: mau(so.css) } };
}
