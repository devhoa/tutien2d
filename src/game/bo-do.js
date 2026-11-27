// Bộ trang bị (data/items.json → bo_do; chủ dự án 27/11/2026 00:16). save.boDo = { ds: [bộ | null, …], dang: chỉ số bộ đang chọn };
// mỗi bộ = { eq: { ô: uid }, pb: [uid | null ×4] (pháp bảo đang mang, src/game/phap-bao.js), kn, tp, cp, pet, mk, kl, of, ok (src/game/bo-do-them.js) }. save.boMo = số ô đã mở, máy chủ giữ
// (p2d_mo_bo_do trừ Tiên Ngọc; trigger p2d_giu_bo_mo không cho máy khách tự nâng). Mặc bộ chỉ đổi món đang có trong túi nên không
// cần máy chủ; pháp bảo đổi qua pbWear nên vẫn chịu hồi chiêu đổi món như tay đổi.
import { pbOn, pbState, pbWear, pbItem, wearN } from './phap-bao.js';
import { luuThem, macThem } from './bo-do-them.js';   // kỹ năng, thân pháp, công pháp, linh thú, thú cưỡi, khôi lỗi, thời trang

const C = game => game.data.items.bo_do;
const st = game => (game.save.boDo ??= { ds: [], dang: 0 });
export const boMo = game => Math.min(C(game).max, Math.max(C(game).mien, game.save.boMo || 0));
export const boDs = game => st(game).ds;
export const boDang = game => st(game).dang || 0;
export const fill = (s, o) => Object.entries(o).reduce((t, [k, v]) => t.split(`{${k}}`).join(v), s);

export function boLuu(game, i) {
  const s = game.save, b = { eq: { ...(s.equip || {}) }, ...luuThem(game) };
  if (pbOn(game)) b.pb = pbState(game).wear.slice(0, wearN(game));
  st(game).ds[i] = b; st(game).dang = i;
  game.persist?.();
}

// Mặc bộ i: trả số ô bỏ qua vì món không còn (đã bán, phân giải). null nếu bộ chưa lưu.
export function boMac(game, i) {
  const b = st(game).ds[i]; if (!b) return null;
  const s = game.save, B = game.data.items.bases, co = new Set((s.bag || []).map(it => it.uid));
  let thieu = 0;
  for (const slot of Object.keys(game.data.items.slots)) {
    const u = b.eq?.[slot];
    if (u == null) { delete s.equip[slot]; continue; }
    const it = co.has(u) && s.bag.find(x => x.uid === u);
    if (it && B[it.base]?.slot === slot) s.equip[slot] = u;
    else { thieu++; }
  }
  if (pbOn(game) && Array.isArray(b.pb)) {
    b.pb.forEach((u, k) => {
      const cur = pbState(game).wear[k];
      if (u == null || cur === u) return;
      if (pbItem(game, u)) pbWear(game, k, u); else thieu++;
    });
  }
  thieu += macThem(game, b);
  st(game).dang = i;
  game.refreshStats?.(); game.persist?.();
  return thieu;
}

// Mở ô thứ n (3, 4) bằng Tiên Ngọc qua máy chủ. Trả chữ báo.
let dangMo = false;
export async function boMoThem(game, n) {
  const T = C(game).text;
  if (!game.cloud) return T.mo_can_tk;
  if (dangMo) return '';
  dangMo = true;
  try {
    const c = (await import('../net/profile.js')).topupCalls;
    await game.cloud.run(() => c.boDo(n), r => { game.save.tn = r.tn; game.save.boMo = r.mo; game.persist(); });
    return fill(T.mo_ok, { n });
  } catch (e) {
    return /thieu_tn/.test(e?.message || '') ? T.thieu_tn : T.loi;
  } finally { dangMo = false; }
}
