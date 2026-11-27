// Hộ Tông gia trì (data/guild.json → ho_tong; chủ dự án 26/11/2026 00:19: thành viên đứng trên chính tinh cầu của tông môn mình được cộng sức
// mạnh theo chức vụ: Tông chủ 60%, Phó tông chủ 50%, Trưởng lão 40%, Đệ tử 20%, "để họ có thể bảo vệ tông môn, cũng như dễ farm hơn").
// Máy chủ phòng quyết (cloud/src/ho-tong.js): lúc vào phòng của tinh cầu, phòng hỏi máy chủ dữ liệu chức vụ và tinh cầu của tông môn, báo phần
// trăm trong tin chào (src/net/online-cf.js phát sự kiện 'p2d-ho-tong'). Máy này chỉ nhân Công, Sinh lực, Thủ theo đúng số phòng báo, cho
// đúng bản đồ đó; rời bản đồ là hết. Phòng cũng nhân lực chiến của mình cho PvP và quái chung, nên hai bên khớp nhau.
// Lực chiến gốc (bảng chỉ số, xếp hạng, thành tựu, máy chủ lưu) không đổi: chỉ nhân lúc ra trận. HUD hiện số đã nhân và dòng "Hộ Tông +x%".
const C = game => game.data.guild?.ho_tong;

// Phần trăm đang có ở bản đồ đang đứng (0 = không)
export const hoTongPct = game => (C(game)?.on && game.hoTong && game.hoTong.map === game.map?.id ? game.hoTong.pct : 0);

// Chỉ số ra trận: bản chép đã nhân (src/game/player.js refreshStats gọi)
export function hoTongAp(game, st) {
  const p = hoTongPct(game);
  if (!p || !st) return st;
  const k = 1 + p / 100;
  return { ...st, maxHp: Math.round(st.maxHp * k), atk: Math.round(st.atk * k), def: Math.round((st.def || 0) * k), hoTong: p };
}

// Lực chiến để HIỆN (HUD, bảng nhân vật của mình): số gốc nhân gia trì đang có
export const hoTongLuc = (game, n) => Math.round(n * (1 + hoTongPct(game) / 100));

// Phòng báo: pct % cho bản đồ map (rời phòng: 0). Kẹp trong bảng data, số lạ thì coi như không có
export function hoTongTin(game, pct, map) {
  const max = Math.max(0, ...Object.values(C(game)?.pct || {}));
  pct = Math.max(0, Math.min(max, Math.floor(+pct || 0)));
  game.hoTong = pct && map ? { pct, map } : null;
}

// Gia trì đổi (vào / rời tinh cầu tông môn, phòng báo lại): tính lại chỉ số, giữ nguyên tỉ lệ máu (vào ra không hồi máu), báo một dòng
function nhip(game) {
  const p = game.player;
  if (!p?.st || !game.save) return;
  const now = hoTongPct(game);
  if (now !== (p.st.hoTong || 0)) {
    const r = p.maxHp > 0 ? p.hp / p.maxHp : 1;
    game.refreshStats();
    if (p.hp > 0) p.hp = Math.max(1, Math.min(p.maxHp, Math.round(p.maxHp * r)));
  }
  if (now === (game.hoTongBao || 0)) return;
  game.hoTongBao = now;
  const G = game.data.guild, T = C(game).text, chuc = Object.keys(C(game).pct).find(k => C(game).pct[k] === now);
  game.toast?.(now ? T.on.replace('{pct}', now).replace('{chuc}', G.roles[chuc] || G.name) : T.off, now ? 4 : 2.5);
}

export function startHoTong(game) {
  if (!C(game)) return;
  addEventListener('p2d-ho-tong', e => hoTongTin(game, e.detail?.pct, e.detail?.map));
  setInterval(() => nhip(game), 400);
}
