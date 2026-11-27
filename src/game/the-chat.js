// Thể chất (chủ dự án 25/11/2026 10:08, 12:53–12:55; số và chữ ở data/the-chat.json; docs/20-THE-CHAT.md).
// Kết Đan (đạt cảnh giới mo) thì thể phách thức tỉnh: quay đúng MỘT lượt, ra phẩm theo tỉ lệ rồi một thể chất của phẩm đó. Mỗi thể chất
// cộng thẳng % vào vài chỉ số của luật chiến đấu (chi_so, đã cân bằng tools/the-chat-can.mjs: Phàm thêm khoảng 3% lực chiến, Tiên 20%), cộng
// ngoài trần dòng như Tiềm năng (src/game/he-chien.js playerStatsHC, ext.the). Bản lưu chỉ giữ MÃ thể chất (save.theChat), số lấy từ data
// nên sửa bản lưu không lấy được hơn; có tài khoản thì máy chủ quay và giữ kết quả (src/net/the-chat.js).
// Tệp này không đụng giao diện: lễ ở src/game/le-the.js, bảng ở src/ui/tiem-nang-view.js.

export const TC = data => data?.['the-chat'];
export const tcOn = data => !!TC(data)?.on;
export const theCua = (save, data) => (tcOn(data) && typeof save?.theChat === 'string' && TC(data).the[save.theChat]) || null;
export const phamThe = (data, t) => TC(data).pham[t.pham] || TC(data).pham[0];
// Đã tới cảnh giới thức tỉnh chưa (tính theo cảnh giới cao nhất từng đạt: ma bị diệt tụt cảnh giới vẫn giữ)
export const theMo = (save, data) => tcOn(data) && Math.max(save?.realm | 0, save?.tiem?.max | 0) >= (TC(data).mo ?? 2);

// Quay một lượt: mã thể chất. rnd: nguồn số ngẫu nhiên 0–1 (bài thử truyền số cố định).
export function quayThe(data, rnd = Math.random) {
  const C = TC(data), W = C.pham.reduce((s, p) => s + p.w, 0);
  let r = rnd() * W, ph = C.pham.length - 1;
  for (let i = 0; i < C.pham.length; i++) { r -= C.pham[i].w; if (r < 0) { ph = i; break; } }
  const ds = Object.keys(C.the).filter(id => C.the[id].pham === ph).sort();
  return ds[Math.min(ds.length - 1, Math.floor(rnd() * ds.length))];
}

// % cộng vào từng chỉ số của luật chiến đấu (atk_pct, hp_pct, def_pct, crit, crit_dmg, cdr, lifesteal, thorns), kẹp trần từng chỉ số
export function thePct(save, data) {
  const t = theCua(save, data), out = {};
  if (!t) return out;
  const tran = TC(data).tran || {};
  for (const [k, v] of Object.entries(t.chi_so || {})) if (v > 0) out[k] = Math.min(v, tran[k] ?? v);
  return out;
}
