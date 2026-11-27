// Cơ duyên (chủ dự án 25/11/2026 10:08: "trên cây sẽ xuất hiện trái cây lạ, cái này là cơ duyên, và một vài linh thảo lạ, nhặt được có
// thể luyện thành 1 loại đan mới… chỉ cơ duyên nhặt nguyên liệu"). Mỗi người một cơ duyên riêng: hạt giống = bản đồ + khung giờ + loại
// + hạt riêng của nhân vật (save.coDuyen.hat), nên người khác không thấy, không tranh; không cần máy chủ (máy chủ chỉ chặn trần nhận mỗi ngày, p2d_tran_ngay).
// game.coDuyen: món đang có ở bản đồ này { key, loai, id, n, x, y (chỗ đứng hái), qx, qy (chỗ vẽ: trên tán cây / mặt đất), die }.
// Lại gần pick điểm là hái (đang bay cũng hái được). save.coDuyen { ngay, n: { qua, thao }, keys }: mỗi ngày (giờ Việt Nam) hái tối đa
// mon.<loại>.ngay món; món đã hái ghi keys nên tải lại không hái lại. Số ở data/co-duyen.json. Vẽ: src/render/draw-co-duyen.js.
import { addMat, matInfo } from './cave.js';
import { nlHere, seedOf, rng } from './nl-roi.js';
import { addNumber } from './combat.js';

const C = game => game.data['co-duyen'] || {};
const fill = (s, o) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);   // ngày theo giờ Việt Nam (máy chủ tính trần ngày cùng mốc)

function so(save) {   // sổ hái của hôm nay
  const h = homNay();
  if (!save.coDuyen || save.coDuyen.ngay !== h) save.coDuyen = { ngay: h, n: {}, keys: (save.coDuyen?.keys || []).slice(-8), hat: save.coDuyen?.hat };
  save.coDuyen.hat ||= Math.random().toString(36).slice(2, 10);   // hạt cơ duyên riêng của nhân vật này (mỗi người thấy món ở chỗ khác, lúc khác)
  return save.coDuyen;
}

// Món của khung s, loại loai ở bản đồ đang đứng (cùng người, cùng bản đồ, cùng khung thì luôn ra cùng chỗ); null: khung này không có
export function plan(game, s, loai) {
  const c = C(game), M = c.mon?.[loai], m = game.map;
  if (!M || !m) return null;
  const slot = (c.slot_s || 900) * 1000, r = rng(seedOf(`cd|${m.id}|${s}|${loai}|${so(game.save).hat}`));
  if (r() >= M.p) return null;
  const born = s * slot + Math.floor(r() * slot * 0.4), die = born + (c.life_s || 600) * 1000;
  const n = M.n[0] + Math.floor(r() * (M.n[1] - M.n[0] + 1)), T = m.T || 16;
  const toi = (x, y) => [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]].some(([dx, dy]) => !m.blocked(x + dx * T, y + dy * T, 4) && !m.edge(Math.floor((x + dx * T) / T), Math.floor((y + dy * T) / T)));
  if (loai === 'qua') {   // trái kết trên một cây có lối tới gốc
    const cay = (m.hoi || []).filter(h => h.kind === 'cay' && h.h >= (M.cay_cao || 26));
    for (let k = 0; k < 12 && cay.length; k++) {
      const h = cay[Math.floor(r() * cay.length)];
      if (!toi(h.x, h.y)) continue;
      return { loai, id: M.id, n, born, die, x: h.x, y: h.y, qx: h.x + (r() - 0.5) * h.w * 0.3, qy: h.y - h.h * (0.48 + r() * 0.16), cay: true };
    }
  }
  for (let k = 0; k < 40; k++) {   // linh thảo (hoặc trái rụng khi bản đồ không có cây): ô đi được, không sát mép
    const tx = Math.floor(r() * m.w), ty = Math.floor(r() * m.h), p = m.center(tx, ty);
    if (!m.edge(tx, ty) && !m.blocked(p.x, p.y, 4)) return { loai, id: M.id, n, born, die, x: p.x, y: p.y, qx: p.x, qy: p.y, cay: false };
  }
  return null;
}

function hai(game, q) {
  const c = C(game), M = c.mon[q.loai], S = so(game.save), info = matInfo(game.data, q.id), p = game.player;
  S.keys.push(q.key); if (S.keys.length > 24) S.keys = S.keys.slice(-24);
  if ((S.n[q.loai] || 0) >= M.ngay) { game.toast(fill(c.text.du, { name: info?.name || q.id }), 3); game.persist(); return; }
  S.n[q.loai] = (S.n[q.loai] || 0) + 1;
  addMat(game.save, q.id, q.n);
  addNumber(game, p.x, p.y - 22, `+${q.n} ${info?.name || q.id}`, info?.color || '#ffd56a', true);
  game.toast(fill(c.text.hai, { n: q.n, name: info?.name || q.id }), 3.5);
  game.sfx?.('levelup');
  (game.coDuyenFx ||= []).push({ x: q.qx, y: q.qy, t: 0, mau: info?.color || '#ffd56a' });   // chớp sáng chỗ vừa hái (draw-co-duyen.js)
  game.persist();
}

// Mỗi khung (src/game/loot.js updateLoot gọi): thêm món tới giờ, bỏ món hết giờ, lại gần thì hái
export function cdTick(game, dt) {
  for (const f of game.coDuyenFx || []) f.t += dt;
  if (game.coDuyenFx?.length) game.coDuyenFx = game.coDuyenFx.filter(f => f.t < 0.8);
  game.cdAcc = (game.cdAcc || 0) + dt;
  if (game.cdAcc < 0.4) return;
  game.cdAcc = 0;
  const c = C(game), now = Date.now(), id = game.map?.id;
  let L = (game.coDuyen || []).filter(q => q.die > now && q.map === id);
  if (!c.on || !game.save || !game.player || !nlHere(game)) { game.coDuyen = []; return; }
  const slot = (c.slot_s || 900) * 1000, s0 = Math.floor(now / slot), S = so(game.save), bao = (game.cdBao ||= new Set());
  for (let s = s0 - 1; s <= s0; s++) for (const loai of Object.keys(c.mon || {})) {
    const key = `cd-${loai}-${s}-${id}`;
    if (S.keys.includes(key) || L.some(q => q.key === key)) continue;
    const q = plan(game, s, loai);
    if (!q || now < q.born || now >= q.die) continue;
    q.key = key; q.map = id; L.push(q);
    if (!bao.has(key)) { bao.add(key); game.toast(c.text[loai === 'qua' ? 'bao_qua' : 'bao_thao'], 5); }
  }
  const p = game.player, gan = c.pick || 30;
  for (const q of L) if (Math.hypot(p.x - q.x, p.y - q.y) <= gan && !game.ghost) { q.die = 0; hai(game, q); }
  game.coDuyen = L.filter(q => q.die > now);
}
