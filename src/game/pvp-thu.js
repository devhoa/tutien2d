// Thu chiến lợi phẩm sau khi hạ người (PvP thường, hóa ma). Chủ dự án 22/11/2026 11:09: "người hóa ma sau khi giết người nhận Linh Thạch thì hình như
// chưa có thông báo nhận Linh Thạch, tui giết xong mà chẳng thấy gì". Linh Thạch (ở Ngoại Vực có cả món) của người gục chỉ vào Hòm thư người hạ khi máy
// NGƯỜI GỤC trả nợ (src/game/pvp.js settle → máy chủ p2d_pvp_tra, chừng một giây sau khi gục; họ thoát game thì lần sau vào mới trả; họ ít Linh Thạch
// quá thì phần trăm làm tròn còn 0, không có thư), còn máy người hạ trước đây chỉ nhận thư ở lượt tự nhận 90 giây (src/game/market.js startMailCheck)
// hoặc khi mở Hòm thư, chữ báo lẫn giữa các thư khác.
// Nay: vừa hạ thì chữ báo nói luôn chiến lợi phẩm đang về (hay hôm nay đã hết lượt thu, src/game/pvp-ma.js); máy mình hỏi Hòm thư vài lần trong 45 giây
// đầu (NHIP); thư chiến lợi phẩm nhận ở đường nào (ở đây, lượt 90 giây, bảng Hòm thư) cũng qua nhanChienLoi: số "+X Linh Thạch" bay lên trên đầu,
// tiếng nhặt đồ, chữ báo thu của ai. Hết lượt chờ mà chưa có thư của người ấy thì nói rõ vì sao có thể chưa có. Không đổi máy chủ.
import { claimMail } from './market.js';

export const NHIP = [2500, 8000, 20000, 45000];   // mili giây sau khi hạ: hỏi Hòm thư
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const T = game => game.data.pvp.text;

// Vừa hạ người tên ten mà phòng báo có ghi nợ (tin pd có loot): chờ thư chiến lợi phẩm của họ. nhan: hàm nhận thư (bài thử truyền hàm giả)
export function thuSauHa(game, ten, nhan = claimMail) {
  const cho = (game.pvp.thuCho ??= []), muc = { ten };
  cho.push(muc);
  for (const ms of NHIP) setTimeout(() => hoi(game, nhan), ms);
  setTimeout(() => {   // hết lượt chờ mà chưa có thư của người này
    const i = cho.indexOf(muc);
    if (i < 0) return;
    cho.splice(i, 1);
    game.toast(fill(T(game).thu_chua, { name: ten }), 5);
  }, NHIP.at(-1) + 1500);
}

async function hoi(game, nhan) {
  const st = game.pvp;
  if (!st.thuCho?.length || st.thuDang || Date.now() - (st.thuLuc || 0) < 2000) return;   // không ai chờ, đang hỏi, hay vừa hỏi xong (hạ nhiều người liền)
  st.thuDang = true; st.thuLuc = Date.now();
  try { const got = await nhan(game); if (got?.length) game.toast(got.join(' · '), 3); }   // thư khác nhận kèm (quà, tiền bán hàng): báo như lượt 90 giây
  catch { /* mạng lỗi: lượt kế, hoặc lượt tự nhận 90 giây */ }
  finally { st.thuDang = false; }
}

// Một thư chiến lợi phẩm vừa nhận (market.js claimMail gọi qua game.chienLoi; ly_do pvp_ha, ma_ha, ma_diet). lines: các dòng đã nhận ("+1234 Linh Thạch", món)
export function nhanChienLoi(game, m, lines) {
  const d = m.noi_dung || {}, p = game.player, ten = d.tu || 'Đạo hữu', cho = game.pvp?.thuCho;
  const i = cho ? cho.findIndex(x => x.ten === ten) : -1;
  if (i >= 0) cho.splice(i, 1);
  if (p && d.coins > 0) game.number?.(p.x, p.y - 34, `+${Math.round(d.coins).toLocaleString('vi-VN')} ${game.data.shop.name}`, '#ffd24a');
  game.sfx?.('pickup');
  setTimeout(() => game.sfx?.('sparkle', 0.6), 140);
  game.toast(fill(T(game).thu_lt, { head: game.data.pvp.mail[m.ly_do] || '', got: lines.join(', '), name: ten }), 4.5);
}
