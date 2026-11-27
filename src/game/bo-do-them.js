// Phần "ngoài trang bị" của một Bộ (chủ dự án 27/11/2026 03:21: "nút lưu là lưu lại toàn bộ kỹ năng, thân pháp, công pháp, thú cưỡi, pháp bảo
// vân vân, chứ không phải lưu mỗi ô trang bị"). src/game/bo-do.js gọi: boLuu ghi thêm, boMac mặc thêm. Mỗi phần chỉ là MÃ của thứ người chơi
// đã có (kỹ năng đã học, thức đã lĩnh ngộ, công pháp đã học, linh thú / thú cưỡi / khôi lỗi / thời trang đã sở hữu); thứ không còn thì bỏ qua
// và đếm vào số "không còn". Bộ lưu trước bản này không có các khoá dưới đây thì phần đó giữ nguyên như đang dùng.
//   kn: ba ô Kỹ năng · tp: hai ô khảm Thân pháp (nhát 4, 5) · cp: ô Công pháp · pet: linh thú · mk: bản thú cưỡi
//   kl: hai khôi lỗi · of / ok: thời trang (mã bộ, bản đang mặc)
import { knOn, knO, knDat, knMo } from './ky-nang.js';
import { tpOn, tpO, tpDat, tpThuc } from './than-phap.js';
import { setPet } from './pets.js';
import { mountKeys, mountKeyOf, pickMount } from './inst.js';
import { wear, owned } from './fashion.js';
import { canInvite, spawnCompanion } from './companion.js';

const lookOf = game => (game.data.heroes.list[game.save?.look] ? game.save.look : game.data.heroes.default);

export function luuThem(game) {
  const s = game.save, b = {};
  if (knOn(game)) b.kn = knO(game).slice();
  if (tpOn(game)) b.tp = tpO(game).slice();
  b.cp = (s.techSlots || []).slice();
  b.pet = s.pet || null;
  b.mk = mountKeyOf(s);
  b.kl = [s.companion || null, s.companion2 || null];
  if (s.outfit) { b.of = s.outfit; b.ok = s.outfitKey || null; }
  return b;
}

// Mặc phần thêm của bộ b. Trả số thứ không còn (không học / không sở hữu nữa).
export function macThem(game, b) {
  const s = game.save;
  let thieu = 0;
  if (Array.isArray(b.kn) && knOn(game)) {
    const mo = knMo(game);
    b.kn.forEach((id, i) => { if (id && mo.includes(id)) knDat(game, i, id); else if (id) thieu++; });
    const lo = knO(game).slice();
    b.kn.forEach((id, i) => { if (!id || !mo.includes(id)) lo[i] = null; });
    s.knO = lo;
  }
  if (Array.isArray(b.tp) && tpOn(game)) {
    const co = tpThuc(game);
    b.tp.forEach((id, i) => { if (!id) return; if (co.includes(id)) tpDat(game, i, id); else thieu++; });
  }
  if (Array.isArray(b.cp)) {
    const max = game.data.techniques?.slots || b.cp.length, cp = b.cp.filter(id => id && s.techs?.[id]);
    thieu += b.cp.filter(Boolean).length - cp.length;
    s.techSlots = cp.slice(0, max);
  }
  if ('pet' in b && b.pet !== (s.pet || null)) {
    if (!b.pet) setPet(game, null);
    else if (s.pets?.[b.pet]) setPet(game, b.pet);
    else thieu++;
  }
  if (b.mk && b.mk !== mountKeyOf(s)) {
    if (mountKeys(s).includes(b.mk)) pickMount(game, b.mk); else thieu++;
  }
  if (Array.isArray(b.kl)) {
    const kl = b.kl.filter(id => id && canInvite(game, id));
    thieu += b.kl.filter(Boolean).length - kl.length;
    if (kl[0] !== (s.companion || undefined) || kl[1] !== (s.companion2 || undefined)) {
      s.companion = kl[0] || null; s.companion2 = kl[1] || null;
      game.npcs = (game.npcs || []).filter(n => !kl.includes(n.id));
      spawnCompanion(game);
    }
  }
  if (b.of && (b.of !== s.outfit || (b.ok || null) !== (s.outfitKey || null))) {
    if (owned(game, b.of, lookOf(game))) wear(game, b.of, b.ok); else thieu++;
  }
  return thieu;
}
