// Nhận một lần câu được (src/game/fishing.js gọi lúc con vật rời nước): vào giỏ (save.mats), sổ câu, kỷ lục, số hôm nay, việc ngày,
// đạo lữ câu cùng. tre giây sau (lúc con vật bay tới tay) hiện thẻ nhận (game.cauThe, src/ui/cau-the.js: giữ trên màn tới khi bấm đóng,
// chủ dự án 24/11/2026 00:38); loài từ Địa phẩm diễn thêm lễ nhận thưởng (game.rewardGive, src/ui/reward-show.js).
import { FC, cauOf, demHomNay, soLoai, tongLoai, phamOf, phamTen } from './cau-do.js';
import { tungCm, kgCua } from './cau-roll.js';
import { dailyEvent } from './daily.js';
import { bump } from './achieve.js';
import { daoLu } from './affinity.js';

export function nhanCa(game, id, n, tre = 0) {
  const s = game.save, c = cauOf(s), data = game.data, F = FC(game), m = data.cave.materials[id], X = F.texts;
  s.mats[id] = (s.mats[id] || 0) + n;
  const moi = !c.so[id];
  c.so[id] = (c.so[id] || 0) + n;
  const cm = tungCm(data, id), ky = !moi && cm > (c.ky[id] || 0);
  if (cm > (c.ky[id] || 0)) c.ky[id] = cm;
  const dem = demHomNay(s); dem.n += n;
  dailyEvent(game, 'fish', id, n); bump(game, 'fish', n);
  const p = phamOf(data, id), extra = cungDaoLu(game, id, m);
  const tin = { id, n: n + extra, cm, kg: kgCua(cm), p, ky, moi, so: soLoai(s), tong: tongLoai(data), hom: dem.n };
  game.persist();
  setTimeout(() => {
    game.sfx(p >= F.gc.tu ? 'ca.lon' : 'ca.nhan', p >= 2 ? 0.8 : 0.55);
    if (game.cauThe) game.cauThe(tin); else game.toast(`${X.the_tieu} ${m.name}${tin.n > 1 ? ' ×' + tin.n : ''}`, 1.6);   // thẻ nhận có sẵn loài mới, kỷ lục, ×2: không báo chữ trùng
    if (p >= F.gc.tu) le(game, tin, m);
  }, Math.max(0, tre * 1000));
  return tin;
}

// Lễ nhận thưởng cho loài lớn: vầng sáng theo màu phẩm, tên, kích cỡ, mô tả
function le(game, tin, m) {
  const data = game.data, X = FC(game).texts, t = phamTen(data, tin.p), L = data.juice?.reward?.lvl || [0];
  const nhom = X.nhom[data.fishing.fish[tin.id]?.nhom] || '';
  const lines = [];
  if (tin.ky || tin.moi) lines.push({ text: tin.moi ? X.loai_moi.replace('{n}', tin.so).replace('{tong}', tin.tong) : X.ky, color: '#ffe45a', main: true });
  lines.push({ text: m.desc, desc: true });
  game.rewardGive?.({ qua: { ray: t.color, ink: t.edge ? '#ffd6d6' : t.color, lvl: L[Math.min(tin.p, L.length - 1)], name: m.name + (tin.n > 1 ? ` ×${tin.n}` : ''), tag: t.name,
    sub: `${nhom} · ${X.the_cm.replace('{cm}', String(tin.cm).replace('.', ',')).replace('{kg}', String(tin.kg).replace('.', ','))}`, lines, node: size => game.cauIco?.(tin.id, size) || document.createElement('i'), gain: null } });
}

// Đạo lữ đang đi cùng đứng gần: thỉnh thoảng câu thêm được một con giống vậy, nói một câu (data/fishing.json → together)
function cungDaoLu(game, id, m) {
  const tg = FC(game).together, c = game.comp, p = game.player;
  if (!c || c.id !== daoLu(game) || Math.hypot(c.x - p.x, c.y - p.y) > tg.range || Math.random() >= tg.chance) return 0;
  game.save.mats[id] += 1; cauOf(game.save).so[id] += 1;
  game.number?.(c.x, c.y - 20, `+1 ${m.name}`, m.color);
  const L = tg.lines[c.id] || tg.lines.default;
  game.say(c.npc.name, L[Math.floor(Math.random() * L.length)], 3.5);
  return 1;
}
