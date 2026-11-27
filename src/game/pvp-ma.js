// Hóa ma phía máy người chơi (chủ dự án 22/11/2026 01:54, bảng câu hỏi 02:0x, 02:04; 02:20–02:21: khiên đổi thành đầu lâu, thanh máu màu đen).
// Luật ở data/pvp.json → _ma, ma, server.ma; máy chủ phòng làm trọng tài (cloud/src/ma.js quyen), máy chủ dữ liệu giữ điểm ma, công đức (p2d_ma_ghi) và
// trừ Linh Thạch, tu vi lúc trả nợ (p2d_pvp_tra, gọi qua src/net/pvp.js). Ở đây chỉ: ai là mục tiêu của đòn mình (giống hệt luật trọng tài, để khỏi gửi đòn vô ích), bấm Hóa ma,
// chữ báo, hàng chữ lớn, hiệu ứng, và sửa bản lưu trong máy theo kết quả trả nợ (tu vi có thể tụt một tầng).
// Điểm ma của mình: game.pvp.ma (phòng báo qua tin pk). Của người khác: o.ma (chuỗi số trong hồ sơ phòng gắn, data/dong-bo.json), o.bm: người mới được che.
import { addFx } from './combat.js';
import { totalLayer, realmLabel } from './stats.js';
import { thuSauHa } from './pvp-thu.js';
import { kemMinh, honMinh } from './pvp-yeu.js';   // ma hạ người kém một đại cảnh giới: không điểm, không Linh Thạch (23/11/2026)

const P = game => game.data.pvp;
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
export const maCua = o => Math.max(0, +(o?.ma || 0) || 0);
export const toiMa = game => (game.pvp?.ma || 0) > 0;
// Mình là người mới được che (tổng tầng tu dưới server.ma.min_tl; máy chủ phòng xét theo số máy chủ dữ liệu giữ, đây chỉ để khỏi gửi đòn vô ích, báo chữ)
export const toiMoi = game => !!game.save && totalLayer(game.save, game.data.realms) < (P(game)?.server.ma?.min_tl ?? 4);

// Mình đánh được người o không (cloud/src/ma.js quyen): ma đánh người không phải ma, không phải người mới; người thường (còn khiên hay không) đánh ma
// nếu mình không phải người mới; hai người thường cùng tắt khiên đánh nhau như cũ
export function danhDuoc(game, o) {
  if (!game.pvp || !o) return false;
  if (toiMa(game)) return !maCua(o) && !o.bm;
  if (maCua(o)) return !toiMoi(game);
  return !!game.pvp.off && !!o.pk;
}
// Giữa mình và o có thể có giao chiến không (ai đánh ai cũng được): gửi vị trí dày lên cho trọng tài xét đúng (others.js sendGap)
export function giaoChien(game, o) {
  if (danhDuoc(game, o)) return true;
  if (maCua(o)) return !toiMa(game) && !toiMoi(game);
  return toiMa(game) && !o.bm;
}

// Bấm "Hóa ma!" trên bảng xác nhận (src/ui/pvp-btn.js)
export function hoaMa(game) {
  const T = P(game).text;
  if (toiMa(game)) return;
  if (toiMoi(game)) { game.toast(T.ma_moi, 2.6); return; }
  if (!game.online?.pvpMa || !game.online.pvpMa(game.player)) { game.toast(T.offline, 2); return; }
  game.pvp.maHoi = Date.now();
}

// Thân ma: lớp trên body cho thanh máu đen, đầu lâu (pvp.css)
function lop(game) { document.body.classList.toggle('la-ma', toiMa(game)); }

// Tin pk của chính mình mang điểm ma (phòng báo lúc vào phòng, lúc hóa ma, lúc điểm đổi)
export function maPkToi(game, m) {
  const T = P(game).text, cu = game.pvp.ma || 0, moi = Math.max(0, m.ma | 0), p = game.player;
  game.pvp.ma = moi; lop(game);
  if (moi > 0 && !cu) {
    if (Date.now() - (game.pvp.maHoi || 0) < 15000) {   // vừa bấm Hóa ma: nghi lễ đầy đủ
      game.pvp.maHoi = 0;
      game.chuLon?.({ cau: T.ma_chu, lenh: T.ma_chu_lenh, han: '魔', mau: P(game).ma.mau, giu: 1.4 });
      game.sfx?.('rage'); game.screen?.shake(4, 0.35);
      if (p) maNo(game, p.x, p.y, 1.4);
      game.toast(fill(T.turned_ma, { n: moi }), 3.5);
    } else game.toast(fill(T.ma_khong_bat, { n: moi }), 3);   // vào lại game / đổi tinh cầu mà vẫn đang là ma: nhắc nhẹ
  }
}

// Người khác vừa hóa ma: luồng ma khí bùng ở chỗ họ
export function maPkNguoi(game, o, m) {
  if (!o || !(m.ma > 0) || m.cu > 0) return;   // m.cu: điểm ma trước tin này (net/online-cf.js)
  if (o.x !== null) maNo(game, o.x, o.y, 1);
  if (toiMoi(game) && !game.pvp.maBaoMoi) { game.pvp.maBaoMoi = true; game.toast(P(game).text.moi_bao_ve, 3.5); }   // người mới: yên tâm, ma không đánh được mình (báo một lần)
}

function maNo(game, x, y, k) {
  const M = P(game).ma;
  addFx(game, { type: 'ring', x, y: y - 6, r: 34 * k, color: M.mau, life: 0.7, fill: true });
  addFx(game, { type: 'puff', x, y: y - 8, life: 0.8, r: 18 * k, color: M.mau_dam });
}

// Tin gục trong trận có ma (m.k 'giet': ma đồ sát người; 'diet': người diệt ma; 'tp': ma gục vì thiên phạt ở Thiên Kiếm Tinh, không có người diệt,
// 22/11/2026 16:14). Ma gục (diet, tp): Linh Thạch rơi thành túi ở chỗ gục lúc máy ma trả nợ (pvp.js settle → tui-lt.js). Trả true nếu đã xử lý.
export function maPd(game, m, me, o) {
  if (m.k !== 'giet' && m.k !== 'diet' && m.k !== 'tp') return false;
  const T = P(game).text, p = game.player, ten = o?.def?.name || 'Đạo hữu';
  if (m.to === me) {   // mình gục
    p.hp = 0;   // game.js tự hồi sinh ở điểm hồi sinh
    if (m.k === 'giet') { game.pvp.off = false; game.toast(fill(T.ma_killed, { name: m.by }) + (!m.loot && honMinh(game, game.others.list.get(m.from)) ? ' ' + T.yeu_nan : ''), 3.5); }
    else {
      game.pvp.ma = Math.max(0, m.ma | 0); game.pvp.off = game.pvp.ma > 0; lop(game);
      game.toast(m.k === 'tp' ? fill(T.thien_phat_guc, { n: game.pvp.ma }) : fill(T.ma_bi_diet, { name: m.by, n: game.pvp.ma }), 3.5);
      if (!game.pvp.ma) setTimeout(() => { game.chuLon?.({ ky: true, cau: T.ve_nguoi_chu, mau: '#bfe8ff', giu: 1.4 }); game.sfx?.('chime'); game.toast(T.ma_het, 4); }, 1600);
    }
    return true;
  }
  if (m.k === 'tp') { if (o && o.x !== null) { o.pvpR = 1; addFx(game, { type: 'puff', x: o.x, y: o.y, life: 0.6, r: 16, color: P(game).ma.mau_dam }); } return true; }   // người khác gục vì thiên phạt: chỉ vẽ
  if (m.from === me) {   // mình hạ người. loot: phòng đã ghi nợ. Đồ sát: Linh Thạch về Hòm thư mình (pvp-thu.js báo lúc tới); diệt ma: rơi xuống đất
    if (m.k === 'giet') {
      const cu = game.pvp.ma || 0, tinh = (m.ma | 0) > cu;   // điểm ma tăng: lần đồ sát này được tính; tính mà không ghi nợ là đã hết lượt thu hôm nay
      game.pvp.ma = Math.max(cu, m.ma | 0);
      game.toast(fill(T.ma_kill, { name: ten, n: game.pvp.ma }) + (m.loot ? ' ' + T.thu_cho : tinh ? ' ' + fill(T.thu_het, { n: P(game).ma.lt_ngay }) : kemMinh(game, o) ? ' ' + T.yeu_ma : ''), 4);
      game.sfx?.('roar');
    } else {
      game.chuLon?.({ ky: true, cau: [fill(T.diet_chu, { name: ten }), T.diet_chu2], mau: '#ffd98a', giu: 1.4 });
      game.sfx?.('chuong'); game.toast(fill(T.ma_diet, { name: ten }) + (m.loot ? ' ' + T.lt_roi_dat : ''), 3.5);
    }
    if (m.loot && m.k === 'giet') thuSauHa(game, ten);
  }
  if (o) { o.pvpR = 1; if (o.x !== null) addFx(game, { type: 'puff', x: o.x, y: o.y, life: 0.6, r: 16, color: m.k === 'diet' ? P(game).ma.mau_dam : '#ff5a5a' }); }
  return true;
}

// Một dòng kết quả trả nợ (p2d_pvp_tra) kiểu hóa ma: sửa bản lưu trong máy y như máy chủ, trả chữ báo. x.tv: tu vi bị trừ (ma bị diệt).
export function maTra(game, x) {
  const T = P(game).text, s = game.save, R = game.data.realms;
  let line = x.noi === 'ma_sh' ? '' : fill(x.tui ? T.ma_lost_dat : T.ma_lost, { lt: x.lt || 0 });   // sám hối (Cổ Thụ): không mất Linh Thạch, co-thu.js đã báo   // ma gục: Linh Thạch rơi thành túi trên đất (nợ ghi trước 22/11/2026 16:14 thì vẫn qua Hòm thư)
  if (x.tv && Number.isFinite(x.tv.realm) && Number.isFinite(x.tv.layer) && Number.isFinite(x.tv.qi)) {
    if (s.tiem?.toc) s.tiem.max = Math.max(s.tiem.max | 0, s.realm | 0);   // cảnh giới cao nhất từng đạt: điểm tiềm năng không mất (máy chủ giữ canh_max)
    if (x.tv.tut && s.mocT) s.mocT.m = Math.max(s.mocT.m | 0, s.mocT.l | 0);   // quà mỗi 10% tầng không tặng lại khi lên lại tầng đã qua (moc-tang.js)
    s.realm = x.tv.realm; s.layer = x.tv.layer; s.qi = x.tv.qi;
    if (x.noi === 'ma_sh') return x.tv.tut ? fill(P(game).ma.co_thu.text.tut, { canh: realmLabel(s, R) }) : '';
    line += T.ma_lost_tv + (x.tv.tut ? fill(T.ma_tut, { canh: realmLabel(s, R) }) : '');
  }
  return line;
}
