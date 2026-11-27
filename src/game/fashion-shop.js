// Tiệm thời trang (chủ dự án 19/11/2026 12:57: "thời trang chưa có thì ẩn đi, sau mua ở tiệm thời trang giống mấy NPC Ngự Thú Sư
// với Khôi Lỗi"): NPC đứng ở sạp vải trong chợ Thiên Kiếm Tinh (data/fashion.json → shop_npc, đặt bằng tools/the-gioi/tk_moi.py).
// Lưới ô có hình bộ đồ + tên, giá Linh Thạch dưới ô như quầy Ngự Thú / Khôi Lỗi (src/ui/dialog.js); bộ đã có mờ, ghi "Đã có".
// Mua xong mặc luôn nếu đúng giới tính. Bảng Thời trang chỉ còn hiện bộ đã có (src/ui/achv-panel.js).
import { owned, buyOutfit, wear, versions } from './fashion.js';
import { coins } from './shop.js';
import { buyTn, tn } from './topup.js';

const vn = n => Math.round(n).toLocaleString('vi-VN');

export async function talkFashionShop(game, npc) {
  const { data } = game, s = game.save, F = data.fashion.list, T = data.fashion.shop_text || {}, name = npc.def.name;
  const sp = data.art.sprites, look = data.heroes.list[s.look] ? s.look : data.heroes.default;
  const list = [], EV = data.events?.tong_mon?.text || {}, TP = data.topup, tnMon = id => TP.shop.find(x => x.outfit === id);   // bộ bán bằng Tiên Ngọc (data/topup.json → shop, noi thoi-trang)
  for (const [id, f] of Object.entries(F)) {
    if (!f.from?.shop && !f.from?.su_kien) continue;   // bộ quà sự kiện: hiện trong tiệm nhưng không bán (chủ dự án 24/11/2026 00:32)
    for (const g of versions(game, id)) {
      if (g !== look && !f.look) continue;   // bộ chia nam / nữ: chỉ bán bản đúng giới mình
      const own = owned(game, id, g), key = f.look?.sprite || `hero.y-${id}-${g}`;   // đã có vẫn mua thêm được: mỗi bản phẩm ngẫu nhiên (chủ dự án 19/11/2026 13:02)
      list.push({ id: `${id}:${g}`, label: f.name, spr: sp[key] ? key : undefined, price: f.from.shop ? vn(f.from.shop) : tnMon(id) ? `${tnMon(id).tn} ${TP.name}` : EV.shop_tag || 'Sự kiện', cur: f.from.shop ? 'ui.ic-linh-thach' : undefined, tag: own ? (T.owned || 'Đã có') : '', desc: '', color: f.robe });
    }
  }
  list.push({ id: 'talk', label: T.talk || 'Trò chuyện', desc: '' }, { id: 'thoi', label: T.no || 'Thôi', desc: (T.have || 'Đang có {n} Linh Thạch').replace('{n}', vn(coins(s))) });
  const pick = await game.dialog.choose(`${name}: ${T.ask || 'Đạo hữu xem bộ nào?'}`, list);
  if (!pick || pick === 'thoi') return;
  if (pick === 'talk') { await game.dialog.say([[name, npc.def.lines[Math.floor(Math.random() * npc.def.lines.length)]]]); return; }
  const [id, g] = pick.split(':'), f = F[id];
  if (!f.from.shop && tnMon(id)) return muaTn(game, name, f, tnMon(id), id, g, look, T);   // bán bằng Tiên Ngọc (chủ dự án 24/11/2026 01:29)
  if (!f.from.shop) { game.toast((EV.shop_msg || '{name} chỉ nhận qua sự kiện.').replace('{name}', f.name), 3.2); return; }   // quà sự kiện: không mua được
  if (coins(s) < f.from.shop) { game.toast((T.poor || 'Chưa đủ Linh Thạch ({n}).').replace('{n}', vn(f.from.shop)), 2.4); return; }
  const had = owned(game, id, g), k = buyOutfit(game, id, g);
  if (!k) return;
  if (!had && (g === look || f.look)) wear(game, id, k);   // bộ mới lần đầu: mặc luôn; bản thêm thì để vào bảng Thời trang
  game.sfx('pickup');
  game.toast((had ? T.more || 'Đã mua thêm {name}, xem phẩm ở bảng Thời trang.' : T.done || 'Đã mua và mặc {name}.').replace('{name}', f.name), 2.6);
}

// Mua bộ bằng Tiên Ngọc: hỏi lại một lần (tiền nạp), máy chủ trừ và ghi bản (p2d_doi_tn trả khoá; mua lại bộ đã có là bản thêm, phẩm dòng
// ngẫu nhiên như bộ Linh Thạch, chủ dự án 24/11/2026 01:3x), bản đầu mặc luôn
async function muaTn(game, name, f, x, id, g, look, T) {
  const TP = game.data.topup, S = TP.shop_text || {}, had = owned(game, id, g);
  const ok = await game.dialog.choose(`${name}: ${(S.ask || 'Mua {name} giá {n} {tn}?').replace('{name}', f.name).replace('{n}', x.tn).replace('{tn}', TP.name)}`,
    [{ id: 'mua', label: S.yes || 'Mua' }, { id: 'thoi', label: T.no || 'Thôi', desc: `Đang có ${tn(game)} ${TP.name}` }]);
  if (ok !== 'mua') return;
  let got = null;
  try { got = await buyTn(game, x.id); } catch { got = undefined; }
  if (!got) { game.toast(got === false ? (TP.poor || 'Chưa đủ Tiên Ngọc.') : (S.err || 'Chưa mua được, thử lại sau.'), 2.6); return; }
  if (!had) wear(game, id, got.key);
  game.sfx('pickup');
  game.toast((had ? T.more || 'Đã mua thêm {name}, xem phẩm ở bảng Thời trang.' : T.done || 'Đã mua và mặc {name}.').replace('{name}', f.name), 2.6);
}
