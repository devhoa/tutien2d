// Sư đồ (chủ dự án 25/11/2026 10:08–10:2x; số và chữ ở data/social.json → su_do; luật ở máy chủ, tools/su-do-sql.py).
// game.suDo: trạng thái đọc từ máy chủ { ngay, su_phu, do_de[], moi_toi[], toi_moi[] }, đọc lại doc_s giây một lần.
// Sư phụ đã Chỉ điểm hôm nay: mình (đồ đệ) + qi linh khí (game.suDoQiMul, gọi ở game.gainQi). Có đồ đệ Hành lễ hôm nay: mình (sư phụ)
// + lt Linh Thạch hạ quái (game.suDoLtMul, gọi ở shop.js coinDrop), không cộng dồn theo số đồ đệ. Qua 00:00 giờ Việt Nam là hết.
import { every } from '../core/ticker.js';

const net = () => import('../net/su-do.js');
const C = game => game.data.social.su_do;
const T = game => C(game).text;
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
export const suDoErr = (game, e) => T(game).err[e?.message] || T(game).err.net;
export const homNayVN = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);   // ngày theo giờ Việt Nam, cùng mốc với máy chủ

// Báo khi có gì mới so với lần đọc trước: sư phụ vừa chỉ điểm, đồ đệ vừa hành lễ, có lời mới
function bao(game, cu, st) {
  const t = T(game), cung = cu && cu.ngay === st.ngay;
  if (st.su_phu?.chi_diem && !(cung && cu.su_phu?.chi_diem)) game.toast(fill(t.bao_chi_diem, { name: st.su_phu.ten }), 4);
  const truoc = new Set(cung ? (cu.do_de || []).filter(d => d.hanh_le).map(d => d.k) : []);
  const le = (st.do_de || []).find(d => d.hanh_le && !truoc.has(d.k));
  if (le && cu) game.toast(fill(t.bao_hanh_le, { name: le.ten }), 4);
  const da = new Set((cu?.moi_toi || []).map(x => x.k)), moi = (st.moi_toi || []).find(x => !da.has(x.k));
  if (moi) game.toast(fill(t.bao_moi, { name: moi.ten }), 5);
}

const thu = () => globalThis.window?.__thu?.suDo;   // bài thử / chụp ảnh duyệt: trạng thái giả, không hỏi máy chủ
export const suDoMo = game => !!((game.online && game.cloud) || thu());

export async function loadSuDo(game) {
  if (thu()) { game.suDo = thu(); return game.suDo; }
  if (!game.online || !game.cloud) { game.suDo = null; return null; }
  const st = await (await net()).suDoState(), cu = game.suDo;
  game.suDo = st || null;
  if (st) bao(game, cu, st);
  return st;
}

const lam = (game, fn) => async (...a) => { const r = await fn(await net(), ...a); await loadSuDo(game).catch(() => {}); return T(game).done[r] || r; };
export const inviteSuDo = (game, k) => lam(game, (n, k) => n.suDoInvite(k))(k);
export const leaveSuDo = (game, k) => lam(game, (n, k) => n.suDoLeave(k))(k);
export const teachSuDo = (game, k) => lam(game, (n, k) => n.suDoTeach(k))(k);
export const bowSuDo = game => lam(game, n => n.suDoBow())();

// Người r (có canh_gioi) với mình: 'su' (họ làm sư phụ mình được), 'do' (mình thu họ được), null (không đủ cách cảnh giới / đã đủ)
export function suDoVai(game, r) {
  const st = game.suDo, c = C(game), toi = game.save?.realm || 0, ho = r?.canh_gioi;
  if (!st || ho == null || !r.k) return null;
  const co = [st.su_phu, ...(st.do_de || []), ...(st.moi_toi || []), ...(st.toi_moi || [])].some(x => x && x.k === r.k);
  if (co) return null;
  if (ho - toi >= c.cach && !st.su_phu) return 'su';
  if (toi - ho >= c.cach && (st.do_de || []).length < c.toi_da) return 'do';
  return null;
}

export function startSuDo(game) {
  const con = () => game.suDo && game.suDo.ngay === homNayVN();
  game.suDoQiMul = () => (con() && game.suDo.su_phu?.chi_diem ? 1 + C(game).qi : 1);
  game.suDoLtMul = () => (con() && (game.suDo.do_de || []).some(d => d.hanh_le) ? 1 + C(game).lt : 1);
  game.suDoCo = () => !!(game.suDo && (game.suDo.su_phu || (game.suDo.do_de || []).length));
  let last = 0;
  every(() => { if (game.online && game.cloud && Date.now() - last > (C(game).doc_s || 300) * 1000) { last = Date.now(); loadSuDo(game).catch(() => {}); } }, 5000);
}
