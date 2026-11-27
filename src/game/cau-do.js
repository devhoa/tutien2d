// Câu cá: phần lưu save.cau và đồ đang dùng (data/fishing.json). save.cau = { can: mã cần đang dùng, moi: mã mồi đang móc (null: câu trần),
// so: { mã: số con đã từng câu } (sổ câu), ky: { mã: cm lớn nhất } (kỷ lục), phuc: phúc duyên, moc: [mốc sổ câu đã nhận quà],
// gap: đã gặp Lão Ngư Ông (nhận quà ra mắt), dem: { d: ngày, n: số con hôm nay } }. Cần, mồi là nguyên liệu trong save.mats.
import { season } from './weather.js';

export const FC = game => game.data.fishing;
export const homNay = () => new Date().toDateString();
// Ngày giờ Việt Nam như máy chủ (p2d_cau_doi đếm trần ngày theo Asia/Ho_Chi_Minh): sổ Linh Thạch đã bán hôm nay dùng ngày này
export const ngayVN = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

export function cauOf(save) {
  const c = (save.cau ??= {});
  if (!c.so || typeof c.so !== 'object') c.so = {};
  if (!c.ky || typeof c.ky !== 'object') c.ky = {};
  if (!Array.isArray(c.moc)) c.moc = [];
  if (!(c.phuc >= 0)) c.phuc = 0;
  return c;
}

// Có cần này chưa (Trúc Can ai cũng có)
export const coCan = (game, id) => id === FC(game).can_san || (game.save.mats?.[id] || 0) > 0;
export function canDung(game) {
  const c = cauOf(game.save), F = FC(game);
  return F.can[c.can] && coCan(game, c.can) ? c.can : F.can_san;
}
export function moiDung(game) {
  const c = cauOf(game.save), F = FC(game);
  return c.moi && F.moi[c.moi] && (game.save.mats?.[c.moi] || 0) > 0 ? c.moi : null;
}
export function dungCan(game, id) {
  if (!FC(game).can[id] || !coCan(game, id)) return false;
  cauOf(game.save).can = id; game.persist(); return true;
}
export function dungMoi(game, id) {
  if (id && (!FC(game).moi[id] || !((game.save.mats?.[id] || 0) > 0))) return false;
  cauOf(game.save).moi = id || null; game.persist(); return true;
}

// Bối cảnh tung loài lúc này (src/game/cau-roll.js)
export function ctxCau(game, noi) {
  const c = cauOf(game.save);
  return { realm: game.save.realm || 0, map: game.map.id, noi, night: !!game.isNight, rain: !!game.raining, season: season(game)?.id,
    moi: moiDung(game), can: canDung(game), phuc: c.phuc > 0 };
}

export const soLoai = save => Object.keys(cauOf(save).so).length;
export const tongLoai = data => Object.keys(data.fishing.fish).length;
export function demHomNay(save) {
  const c = cauOf(save);
  if (c.dem?.d !== homNay()) c.dem = { d: homNay(), n: 0 };
  return c.dem;
}

// Phẩm của mã (nguyên liệu) và tên phẩm, màu phẩm theo bảng dòng chỉ số (Phàm lục … Thượng Cổ đen)
export const phamOf = (data, id) => data.cave.materials[id]?.pham ?? data.cave.pills[id]?.pham ?? 0;
export function phamTen(data, p) { const L = data.items.line_tiers.list; return L[Math.max(0, Math.min(L.length - 1, p))]; }

// Chỗ loài này hay gặp, ghép từ điều kiện (Chỉ ở Xích Diễm Tinh · Ban đêm · Mép tinh cầu…)
export function hintOf(data, id) {
  const f = data.fishing.fish[id], H = data.fishing.texts.hint, out = [];
  if (!f) return '';
  if (f.maps) out.push(H.maps.replace('{maps}', f.maps.map(m => data.maps?.[m]?.name || m).join(', ')));
  if (f.noi) out.push(H[f.noi]);
  if (f.night) out.push(H.night);
  if (f.day) out.push(H.day);
  if (f.rain) out.push(H.rain);
  if (f.season) out.push(H.season.replace('{season}', data.weather?.seasons?.find?.(s => s.id === f.season)?.name || f.season));
  if (f.realm) out.push(H.realm.replace('{realm}', data.realms.names[f.realm]));
  if (f.moi) out.push(H.moi.replace('{moi}', data.cave.materials[f.moi]?.name || f.moi));
  if ((data.cave.materials[id]?.pham || 0) > data.fishing.tran_khong_moi) out.push(H.tran);
  return out.join(' · ') || H.any;
}
