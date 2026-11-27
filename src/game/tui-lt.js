// Túi Linh Thạch trên đất, phần máy khách (chủ dự án 22/11/2026 11:4x: "khi ma nhân chết sẽ rơi linh thạch, ai nhặt đc thì sẽ là của ng đó, nếu k ai
// nhặt đc thì cứ ở đó"; 16:14: ma chết vì thiên phạt cũng rơi, màu túi "Năm màu như triệu hồi"; luật ở docs/16-HOA-MA.md).
// Máy chủ dữ liệu giữ túi (p2d_lt_xem: túi chưa ai nhặt của một tinh cầu), máy chủ phòng làm trọng tài lúc nhặt (cloud/src/tui.js → lõi Mang ký →
// p2d_lt_nhat: cùng tinh cầu, đủ gần, ai tới trước). Ở đây: hỏi danh sách lúc vào tinh cầu và khi phòng báo có túi mới ('ltm'), chạy qua
// túi thì gửi tin nhặt, nhặt được ('ltn') thì số bay lên và nhận Hòm thư ngay; người khác nhặt ('lt-') hay túi đã hết ('ltx' het) thì bỏ túi đó.
// Màu cột sáng: bậc triệu hồi cao nhất có quà Linh Thạch không lớn hơn số trong túi (data/he-thong.json pool coins + b, bac.list màu), dưới mức nhỏ nhất
// là bậc Thường. Vẽ: src/render/draw-loot.js drawTui.
import { claimMail } from './market.js';

const P = game => game.data.pvp;
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
export const R_NHAT = 18;     // đơn vị bản đồ: chạy qua túi trong khoảng này thì nhặt (máy chủ cho tới ma.tui.r, dư cho vị trí trễ)
export const LAI_MS = 1500;   // đã gửi tin nhặt một túi thì chờ 1,5 giây mới gửi lại (đang chờ phòng trả lời)

// Bậc màu của túi theo số Linh Thạch, như quà Linh Thạch trong triệu hồi
export function tuiBac(data, so) {
  const H = data['he-thong'] || {}, ds = H.bac?.list || [];
  let b = 0;
  for (const q of H.pool || []) if (q.coins > 0 && so >= q.coins && q.b > b) b = q.b;
  return { b, color: ds[b]?.color || '#c9ced8' };
}

const dung = t => t && Number.isSafeInteger(t.id) && Number.isFinite(t.x) && Number.isFinite(t.y) && t.so > 0;

// Hỏi danh sách túi của tinh cầu đang đứng (người đã đăng nhập; khách thì bị từ chối, im lặng). Giữ dấu "đã gửi nhặt" của túi cũ.
// Trả lời tới muộn không được đè: túi máy mình thêm trong lúc chờ (tuiMoi) giữ lại, túi đã biết là hết (s.bo) không sống lại.
async function nap(game, ltXem) {
  const s = game.tui, map = s?.map;
  if (!map) return;
  if (s.dang) { s.lai = Date.now() + 500; return; }   // đang hỏi dở: hỏi lại sau, kẻo bỏ lỡ túi mới
  s.dang = true;
  const bd = Date.now();
  try {
    const xem = ltXem || (await import('../net/pvp.js')).ltXem;
    const ds = (await xem(map)).filter(t => dung(t) && !s.bo?.has(t.id));
    if (game.tui !== s || game.map?.id !== map) return;
    const cu = new Map(s.ds.map(t => [t.id, t]));
    const giu = s.ds.filter(t => t.them > bd && !ds.some(x => x.id === t.id));
    s.ds = [...ds.map(t => ({ ...(cu.get(t.id) || {}), id: t.id, x: t.x, y: t.y, so: t.so, ...tuiBac(game.data, t.so) })), ...giu];
  } catch { /* chưa đăng nhập, mạng lỗi: lần sau */ }
  finally { s.dang = false; }
}

// Mỗi khung (pvp.js updatePvp): đổi tinh cầu thì hỏi lại; phòng báo túi mới thì hỏi lại sau một quãng ngẫu nhiên (khỏi cả phòng hỏi cùng lúc);
// chạy qua túi thì gửi tin nhặt. ltXem: hàm hỏi danh sách qua src/net/pvp.js (bài thử truyền hàm giả).
export function tuiTick(game, ltXem) {
  const map = game.map?.id;
  if (!map) return;
  if (game.tui?.map !== map) { game.tui = { map, ds: [] }; nap(game, ltXem); }
  const s = game.tui, p = game.player, now = Date.now();
  if (s.lai && now >= s.lai) { s.lai = 0; nap(game, ltXem); }
  if (!p || p.hp <= 0 || game.ghost || !s.ds.length || !game.online?.ltNhat) return;
  for (const t of s.ds) {
    if (Math.hypot(t.x - p.x, t.y - p.y) > R_NHAT || now - (t.thu || 0) < LAI_MS) continue;
    if (game.online.ltNhat(t.id, p)) t.thu = now;
  }
}

// Tin từ phòng (pvp.js onPvp chuyển qua)
export function tuiTin(game, m) {
  const s = game.tui;
  if (m.t === 'ltm') { if (s && !s.lai) s.lai = Date.now() + 300 + Math.floor(Math.random() * 1200); return; }
  if (!s) return;
  const t = s.ds.find(x => x.id === m.id);
  if (m.t === 'ltn' || m.t === 'lt-' || (m.t === 'ltx' && m.e === 'het')) { s.ds = s.ds.filter(x => x.id !== m.id); (s.bo ||= new Set()).add(m.id); }
  if (m.t === 'ltn' && m.so > 0) nhat(game, m.so, t);
}

// Mình nhặt được: số bay lên đầu màu bậc của túi, tiếng nhặt, chữ báo, nhận Hòm thư ngay (Linh Thạch về túi đồ)
function nhat(game, so, t) {
  const p = game.player, mau = t?.color || tuiBac(game.data, so).color, sn = Math.round(so).toLocaleString('vi-VN');
  if (p) game.number?.(p.x, p.y - 34, `+${sn} ${game.data.shop?.name || 'Linh Thạch'}`, mau === '#c9ced8' ? '#ffd24a' : mau);
  game.sfx?.('pickup');
  setTimeout(() => game.sfx?.('sparkle', 0.6), 140);
  game.toast(fill(P(game).text.lt_nhat, { so: sn }), 3.5);
  (game.tuiNhanThu || claimMail)(game).catch?.(() => {});
}

// Máy mình vừa trả nợ ra túi (pvp.js settle, kết quả p2d_pvp_tra có tui): đang ở đúng tinh cầu đó thì hiện ngay và báo phòng cho người khác hỏi lại
export function tuiMoi(game, t) {
  if (!dung(t) || t.map !== game.map?.id) return;
  if (game.tui?.map !== t.map) game.tui = { map: t.map, ds: [], lai: 1 };   // chưa hỏi danh sách tinh cầu này: khung sau hỏi (túi khác ở đó)
  if (game.tui.ds.some(x => x.id === t.id) || game.tui.bo?.has(t.id)) return;
  game.tui.ds.push({ id: t.id, x: t.x, y: t.y, so: t.so, ...tuiBac(game.data, t.so), them: Date.now() });
  game.online?.ltMoi?.();
}
