// Nấu món từ thủy sản, phóng sinh, giá Lão Ngư Ông thu (data/fishing.json → mon, phuc, ban). Món là đan linh khí trong data/cave.json → pills
// (mon: true): ăn bằng usePill (src/game/cave.js), chung đan độc với đan, canh (chủ dự án 24/11/2026 01:2x "linh khí tầm 1000 đến 20k,
// có giới hạn độc đan"); món phẩm cao cần đủ cảnh giới (use.realm).
import { FC, cauOf, phamOf } from './cau-do.js';

// Thủy sản (cá, tôm cua) phẩm p đang có: [[mã, số]] nhiều trước
export function thuySan(game, p) {
  const F = FC(game), s = game.save;
  return Object.keys(F.fish).filter(id => F.mon_nhom.includes(F.fish[id].nhom) && phamOf(game.data, id) === p && (s.mats?.[id] || 0) > 0)
    .map(id => [id, s.mats[id]]).sort((a, b) => b[1] - a[1]);
}
export const tongThuySan = (game, p) => thuySan(game, p).reduce((a, [, n]) => a + n, 0);
export function nauDuoc(game, mon) {
  const m = FC(game).mon[mon];
  return m ? Math.floor(tongThuySan(game, m.pham) / m.can) : 0;
}

// Nấu k phần món mon: lấy loài nhiều con trước; trả số phần đã nấu
export function nau(game, mon, k = 1) {
  const m = FC(game).mon[mon], s = game.save;
  k = Math.min(k, nauDuoc(game, mon));
  if (!m || k < 1) return 0;
  let can = m.can * k;
  for (const [id] of thuySan(game, m.pham)) {
    const lay = Math.min(can, s.mats[id]);
    s.mats[id] -= lay; can -= lay;
    if (!can) break;
  }
  (s.pills ??= {})[mon] = (s.pills[mon] || 0) + k;
  game.sfx('ca.nau', 0.7);
  game.persist();
  return k;
}

// Thả một con về nước: phúc duyên + (phẩm + 1), tối đa phuc.max
export function phongSinh(game, id) {
  const F = FC(game), c = cauOf(game.save), s = game.save;
  if (!F.fish[id] || !((s.mats?.[id] || 0) > 0) || c.phuc >= F.phuc.max) return 0;
  const p = phamOf(game.data, id) + 1;
  s.mats[id]--; c.phuc = Math.min(F.phuc.max, c.phuc + p);
  game.sfx('ca.tha', 0.6); game.persist();
  return p;
}

// Giá Lão Ngư Ông thu một con / một viên châu ở cảnh giới hiện tại (máy chủ p2d_cau_doi tính lại đúng công thức này)
// Giá Lão Ngư Ông trả một con: giá gốc × k mũ cảnh giới, không quá trần ngày (con Thượng Cổ thì ông dốc hết túi hôm đó); máy chủ p2d_cau_doi tính y vậy
export function giaThu(game, id) {
  const B = FC(game).ban, g = B.gia[id];
  return g ? Math.min(Math.round(g * Math.pow(B.k, game.save.realm || 0)), tranNgay(game)) : 0;
}
export const tranNgay = game => FC(game).ban.tran[Math.min(FC(game).ban.tran.length - 1, game.save.realm || 0)];
