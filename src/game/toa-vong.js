// Tọa Vong Đan (chủ dự án 25/11/2026 10:08: "đan này ăn vào sẽ cộng thời gian để đả tọa, trong thời gian ăn đan và đả tọa, linh khí sẽ
// nhận vào nhiều hơn khi đi farm 1,5 lần… thời gian của mỗi viên đan là random, khoảng vài tiếng… không mua được, chỉ cơ duyên nhặt
// nguyên liệu rồi luyện ra"). save.toaVong: số giây tọa vong còn lại, chỉ trôi lúc đang đả tọa (player.js gọi toaVongTick mỗi nhịp đả
// tọa). Lúc còn giây: linh khí đả tọa mỗi giây = k lần tốc chém quái của cảnh giới mình (da-toa.js medPerSec), không tính vòng quỹ đạo.
// Số ở data/co-duyen.json → toa_vong; chữ ở text. Người khác thấy: hồ sơ st 'tv' (data/dong-bo.json), vẽ ở render/draw-co-duyen.js.
const C = game => game.data['co-duyen']?.toa_vong || {};
const T = game => game.data['co-duyen']?.text || {};
const fill = (s, o) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

export const toaVongCon = game => Math.max(0, +game.save?.toaVong || 0);   // giây còn lại
export function gioPhut(s) {   // 9000 → "2 giờ 30 phút"
  const m = Math.max(1, Math.round(s / 60)), h = Math.floor(m / 60), p = m % 60;
  return h ? (p ? `${h} giờ ${p} phút` : `${h} giờ`) : `${p} phút`;
}

// Linh khí mỗi giây lúc tọa vong (số thật, chưa nhân dòng tăng linh khí của trang bị: chém quái cũng nhân y vậy)
export function toaVongRate(game) {
  const F = game.data.config.meditate.farm_h, r = Math.max(0, Math.min(F.length - 1, game.save?.realm || 0));
  return F[r] / 3600 * (C(game).k || 1.5);
}

// Uống một viên (cave.js usePill): cộng ngẫu nhiên [ít nhất, nhiều nhất] giây. Quỹ đã quá tran_s thì không cho uống (không mất viên).
export function uongToaVong(game, id, u, rnd = Math.random) {
  const s = game.save, c = C(game), con = toaVongCon(game);
  if (con >= (c.tran_s || 43200)) return T(game).day;
  const [a, b] = u.toa_vong, them = Math.round(a + rnd() * (b - a));
  s.pills[id]--; s.toaVong = con + them;
  game.persist();
  return fill(T(game).uong, { gio: gioPhut(them), tong: gioPhut(s.toaVong) });
}

// Mỗi nhịp đả tọa dt giây: trừ quỹ; vừa hết thì báo
export function toaVongTick(game, dt) {
  const con = toaVongCon(game);
  if (!(con > 0)) return;
  game.save.toaVong = Math.max(0, Math.round((con - dt) * 10) / 10);
  if (!(game.save.toaVong > 0)) { delete game.save.toaVong; game.toast(T(game).het, 3); }
}

export const toaVongChu = game => fill(T(game).ngoi, { k: String(C(game).k || 1.5).replace('.', ','), con: gioPhut(toaVongCon(game)) });
