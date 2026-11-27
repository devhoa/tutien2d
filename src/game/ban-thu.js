// Tiền bán hàng ở Chợ Phiên (thư 'ban'). Chủ dự án 23/11/2026 22:2x chọn "Báo rõ tiền bán hàng" sau khi một người chơi bán món 1 triệu Linh Thạch
// mà tưởng không nhận được tiền: thư tiền bán tự nhận lúc đang chơi (src/game/market.js claimMail, lượt 90 giây), trước chỉ một dòng chữ 3 giây
// lẫn giữa các thư khác, Lịch sử Linh Thạch ghi chung "Nhận thư (chợ, quà)".
// Nay: số "+X Linh Thạch" bay lên trên đầu, tiếng nhặt, chữ báo bán món gì được bao nhiêu (data/market.json → ban_bao), Lịch sử ghi "Bán ở Chợ Phiên".
// Nhiều thư tiền bán nhận cùng lượt thì gộp một lần báo. Không đổi máy chủ.
import { itemName } from './items.js';
import { matInfo } from './cave.js';

const fill = (s, o) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const so = n => Math.round(n).toLocaleString('vi-VN');

// Tên hàng đã bán trong thư (sold: món trang bị như trong túi, hay { id, n } nguyên liệu); không nhận ra thì chuỗi rỗng
export function tenHangBan(data, sold) {
  if (sold?.base && data.items?.bases?.[sold.base]) return itemName(data, sold);
  const m = sold?.id ? matInfo(data, sold.id) : null;
  return m ? `${m.name} ×${sold.n || 1}` : '';
}

// Chữ báo cho các thư tiền bán vừa nhận (list: thư có noi_dung.coins > 0); trả { text, n } hay null
export function chuBaoBan(data, list) {
  const thu = (list || []).filter(m => (m?.noi_dung?.coins || 0) > 0);
  if (!thu.length) return null;
  const T = data.market, n = thu.reduce((a, m) => a + m.noi_dung.coins, 0), lt = data.shop.name;
  const mon = thu.length === 1 ? tenHangBan(data, thu[0].noi_dung.sold) : '';
  const text = thu.length > 1 ? fill(T.ban_bao_nhieu, { k: thu.length, n: so(n), lt }) : fill(mon ? T.ban_bao : T.ban_bao_tien, { mon, n: so(n), lt });
  return { text, n };
}

// Báo một lượt thư tiền bán: số bay trên đầu, tiếng, chữ báo (giữ lâu hơn chữ thư thường)
export function baoBan(game, list) {
  const b = chuBaoBan(game.data, list);
  if (!b) return false;
  const p = game.player;
  if (p) game.number?.(p.x, p.y - 34, `+${so(b.n)} ${game.data.shop.name}`, '#ffd24a');
  game.sfx?.('pickup');
  setTimeout(() => game.sfx?.('sparkle', 0.6), 140);
  game.toast(b.text, 5);
  return true;
}
