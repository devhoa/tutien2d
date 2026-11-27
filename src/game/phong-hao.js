// Phong hào đứng ngay trước tên (chủ dự án 23/11/2026 22:47: "danh hiệu sẽ đứng trước tên người chơi… dựa theo lực chiến trên bxh để phong
// hào; all ai hoá ma đều dùng phong hào của ma, còn chưa hoá ma thì dùng phong hào của chủng tộc huyết mạch"; bảng chọn "7 bậc, ai cũng có
// phong hào"; "cái cũ là danh hiệu, cái mới là phong hào, nằm ngay trước tên và có màu, đặc trưng thể hiện địa vị"; 22:57 "ma tộc sẽ k xét
// theo sức mạnh mà xét theo điểm ma khí", bảng chọn "Theo hạng BXH Ma hóa").
// Phong hào = chữ tộc huyết mạch + bậc theo hạng bảng Sức mạnh cả máy chủ; đang hóa ma: chữ Ma + bậc theo hạng bảng Ma hóa (điểm ma).
// Số, chữ, màu ở data/status.json → phong_hao. Mỗi máy tự tải hai bảng (src/game/rank.js loadRank, lam_moi giây một lần, trang ẩn thì thôi)
// rồi tra hạng theo mã công khai 12 ký tự (p2d_chat_key ở máy chủ, tính lại từ mã tài khoản bằng social.js chatKey): hạng lấy từ bảng của
// máy chủ nên không ai tự khai được. Tộc của người khác đi qua hồ sơ phòng (data/dong-bo.json → toc), điểm ma do máy chủ phòng gửi.
// Chưa tải được bảng (khách chưa đăng nhập, mạng lỗi) thì không hiện phong hào. Vẽ: src/render/draw-pvp-tag.js (người khác), src/ui/pvp-btn.js
// (tên mình là nút HTML), src/ui/rank-view.js (trước tên trên bảng xếp hạng: phongHaoDong).
import { loadRank } from './rank.js';
import { chatKey } from './social.js';
import { every } from '../core/ticker.js';

export const phCfg = game => game.data.status?.phong_hao;

// Một bảng vừa tải → { hang: Map<mã, hạng>, co: Set<mã> bị gắn cờ nghi vấn, toi: { k, hang, co } | null, toc: Map<mã, tộc>, coToc }
// toc: bảng Sức mạnh trả tộc huyết mạch mỗi dòng (20261123235500_p2d_bxh_toc.sql); coToc false là máy chủ chưa trả (bản cũ)
export function docBang(data) {
  const hang = new Map(), co = new Set(), toc = new Map();
  let toi = null, coToc = false;
  for (const r of data?.top || []) {
    if (!r?.k) continue;
    hang.set(r.k, r.hang);
    if (r.co) co.add(r.k);
    if (r.la_toi) toi = { k: r.k, hang: r.hang, co: !!r.co };
    if ('toc' in r) { coToc = true; if (r.toc) toc.set(r.k, r.toc); }
  }
  if (!toi && data?.toi) toi = { k: data.toi.k || null, hang: data.toi.hang ?? null, co: !!data.toi.co };
  return { hang, co, toi, toc, coToc };
}

// Bậc của một hạng (hạng null: chưa có trên bảng → bậc cuối, "ai cũng có phong hào")
export function bacCua(C, hang) {
  return C.bac.find(b => b.den == null || (hang != null && hang <= b.den)) || null;
}

// Phong hào của một người: { chu, mau, sang, bac } hoặc null. o: { k, toc, ma }; toi: true là chính mình (mã, hạng lấy dòng "của tôi")
export function phongHao(game, o, toi = false) {
  const C = phCfg(game), ma = (+o?.ma || 0) > 0, B = game.phongHao?.[ma ? 'ma' : 'luc'];
  if (!C?.on || !B) return null;
  const k = toi ? B.toi?.k : o?.k;
  if (toi ? B.toi?.co : k && B.co.has(k)) return null;   // bị gắn cờ nghi vấn trên bảng: không phong hào
  const bac = bacCua(C, (toi ? B.toi?.hang : k && B.hang.get(k)) ?? null), i = C.bac.indexOf(bac);
  const ds = ma ? C.ten.ma : C.ten[o?.toc] || C.ten[C.mac_dinh];   // tên viết đủ trong data (dịch nguyên tên, không ghép chữ lúc chạy)
  if (!bac || !ds?.[i]) return null;
  return { chu: ds[i], mau: bac.mau, sang: !!bac.sang, bac: i };
}

// Phong hào người khác đang thấy (e: bản đang thấy của họ, id là mã tài khoản; h: hồ sơ phòng của họ)
export const phongHaoNguoi = (game, e, h) => (e?.id ? phongHao(game, { k: (e.chatK ??= chatKey(e.id)), toc: h?.toc, ma: h?.ma }) : null);
// Phong hào của mình (tộc trong bản lưu, điểm ma ở game.pvp)
export const phongHaoToi = game => phongHao(game, { toc: game.save?.tiem?.toc, ma: game.pvp?.ma }, true);

// Phong hào một dòng bảng xếp hạng (src/ui/rank-view.js; chủ dự án 23/11/2026 23:51: "phong hào cần hiện cả trên bxh nữa"), cùng luật như
// trên đầu: có tên trên bảng Ma hóa (điểm ma > 0) là đang hóa ma → phong hào Ma theo hạng bảng đó; không thì tộc (bảng Sức mạnh trả) + bậc theo
// hạng bảng Sức mạnh. Dòng của mình: y như nhãn tên mình. Máy chủ chưa trả tộc thì chỉ hiện phong hào Ma (không theo tộc), khỏi hiện sai tộc.
export function phongHaoDong(game, r) {
  if (r?.la_toi) return phongHaoToi(game);
  const P = game.phongHao;
  if (!r?.k || !P) return null;
  if (P.ma?.hang.has(r.k)) return phongHao(game, { k: r.k, ma: 1 });
  if (!P.luc?.coToc) return null;
  return phongHao(game, { k: r.k, toc: P.luc.toc.get(r.k) });
}

// Bảng vừa tải ở tab Xếp hạng mà là một trong hai bảng phong hào thì dùng luôn bản đó (hạng trên dòng và phong hào khớp nhau)
export function ganBang(game, kind, data) {
  const C = phCfg(game), o = kind === C?.bxh ? 'luc' : kind === C?.bxh_ma ? 'ma' : null;
  if (o && data) (game.phongHao ??= {})[o] = docBang(data);
}

// Tab Xếp hạng mở mà chưa có bảng nào trong hai bảng (vừa vào game, lần tải đầu lỗi) thì tải bảng đó (rank.js nhớ 30 giây, lệnh trùng đi chung)
export function canBang(game) {
  const C = phCfg(game);
  if (!C?.on || !game.online) return Promise.resolve();
  const thieu = [[C.bxh, 'luc'], [C.bxh_ma, 'ma']].filter(([, o]) => !game.phongHao?.[o]);
  return Promise.all(thieu.map(([kind]) => loadRank(game, kind).then(d => ganBang(game, kind, d)).catch(() => null)));
}

// Tải hai bảng lúc vào game và mỗi lam_moi giây (đã đăng nhập, trang đang hiện). Bảng nào lỗi thì giữ bản cũ, lần sau tải lại.
export function batPhongHao(game) {
  const C = phCfg(game);
  if (!C?.on) return;
  let dang = false, luc = 0, maCu = false;
  const tai = () => {
    const ma = (game.pvp?.ma || 0) > 0;
    if (ma !== maCu) { maCu = ma; luc = 0; }   // mình vừa hóa ma / hết ma: tải lại ngay để phong hào đổi theo bảng kia
    if (dang || !game.online || !game.save || Date.now() - luc < C.lam_moi * 1000) return;
    dang = true;
    const mot = (kind, o) => loadRank(game, kind).then(d => { (game.phongHao ??= {})[o] = docBang(d); return true; }).catch(() => false);
    Promise.all([mot(C.bxh, 'luc'), mot(C.bxh_ma, 'ma')]).then(([a]) => { if (a) luc = Date.now(); }).finally(() => { dang = false; });
  };
  every(tai, 15000);
  setTimeout(tai, 4000);
}
