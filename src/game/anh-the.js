// Thân hủy, Nguyên Anh còn (chủ dự án 27/11/2026 01:09–01:16; docs/21-NGUYEN-ANH.md). Từ Nguyên Anh (đã qua lễ Kết Anh), lần đầu bị hạ thì KHÔNG gục:
// thân xác vỡ ra, Nguyên Anh (chính nhân vật, vàng, trong suốt) bay ra; không trúng đòn, chạy bằng tốc bay, không đánh được; bấm Tái tạo (sau cho_s
// giây) hoặc hết giu_s giây thì thân thể dựng lại ngay chỗ đang đứng, đầy máu. Không tính là bị giết: không về pháp trận, không mất gì. Lá chắn hồi
// hoi_s giây; bị hạ tiếp trong lúc đó mới là chết như cũ (src/game/ghost.js).
// PvP: máy chủ phòng làm trọng tài (cloud/src/pvp.js naSan, tin 'pa'), máy này chỉ diễn; gục vì quái thì máy này báo phòng ('an') để người chơi khác
// cũng không đánh được Nguyên Anh; Tái tạo báo 'ta'. Tin 'pd' (phòng đã tính là chết, kể cả thiên phạt) thì không hoá Nguyên Anh (game.chetThatT).
// Người khác thấy qua hồ sơ (data/dong-bo.json → st 'anh', vẽ ở src/render/draw-nguyen-anh.js veAnhThe) và hai hiệu ứng 'na-hoa', 'na-tao'.
import { NA, naThuc, naPham, st } from './nguyen-anh.js';
import { hieuUng, dien } from './dien.js';
import { flyMove } from './fly.js';
import { huyTruyen } from './truyen-tong.js';

const A = data => NA(data)?.anh || {};

export function anhSan(game) {
  const p = game.player;
  return !!p && naThuc(game.save, game.data) && !game.anh && !game.trib?.active && !game.duel && !p.kd && game.time >= (st(game).anhHoi ?? -1)
    && !(game.time - (game.chetThatT ?? -99) < 2);   // phòng vừa báo đã chết thật ('pd'): không hoá Nguyên Anh
}

// pvp: phòng đã quyết (tin 'pa'), không xét lại lá chắn ở máy này
export function hoaAnh(game, o = {}) {
  if (!o.pvp && !anhSan(game)) return false;
  if (game.anh) return true;
  const p = game.player, C = A(game.data);
  huyTruyen(game);   // thân vỡ giữa lúc pháp trận truyền tống đang chạy: trận tan như lúc gục (truyen-tong.js)
  game.anh = { t: 0, map: game.map?.id, pvp: !!o.pvp };
  st(game).anhHoi = game.time + (C.hoi_s ?? 300);
  p.hp = Math.max(1, p.hp); p.invT = 0.5; p.kx = p.ky = 0; p.dashT = 0; p.meditating = false; p.hitQ = null; p.swingT = 0;
  for (const n of game.naDs || []) if (n.mine) n.life = Math.min(n.life, n.t + 0.45);   // Nguyên Anh đang xuất khiếu bay về thân (thân đã vỡ)
  dien(game, 'na-hoa', 0, naPham(game.save, game.data) / 10);
  if (!o.pvp) game.online?.anh?.('an');
  game.toast?.(C.bao, 3);
  return true;
}

export function taiTao(game) {
  if (!game.anh) return false;
  const p = game.player, C = A(game.data);
  game.anh = null;
  p.hp = p.maxHp; p.invT = Math.max(p.invT || 0, C.mien_s ?? 1); p.moving = false;
  dien(game, 'na-tao', 0, naPham(game.save, game.data) / 10);
  game.online?.anh?.('ta');
  return true;
}

const NUOT = ['atk', 'dash', 'ride', 'fly', 's0', 's1', 's2', 'sk0', 'sk1', 'sk2', 'art'];
// Một khung khi đang là Nguyên Anh (player.js updatePlayer gọi thay cho cả phần đi lại, đánh, chiêu)
export function anhStep(game, dt) {
  const G = game.anh, p = game.player, C = A(game.data), inp = game.input, cf = game.data.config;
  G.t += dt; p.hp = Math.max(1, p.hp); p.invT = Math.max(p.invT || 0, 0.2); p.swingT = 0; p.hitQ = null;
  for (const k of NUOT) inp.consume?.(k);   // Nguyên Anh không đánh, không chiêu, không cưỡi, không bay
  if (game.map?.id !== G.map) { taiTao(game); return; }   // sang bản đồ khác: thân dựng lại ở nơi tới
  const ax = inp.axis(), d = Math.hypot(ax.x, ax.y);
  if (d > 0.1) {
    const sp = cf.player.speed * (p.st?.speedMul || 1) * (cf.fly?.speed || 1) * Math.min(1, d * 1.3);
    flyMove(game, ax.x / d * sp * dt, ax.y / d * sp * dt);   // tốc bay, lướt qua địa hình như lúc bay
    p.face = { x: ax.x / d, y: ax.y / d }; p.moving = true; p.walkT += dt;
  } else p.moving = false;
  if (G.t >= (C.giu_s ?? 30) || ((game.auto || game.pilot) && G.t >= (C.tu_s ?? 3))) taiTao(game);   // treo máy: tự tái tạo
}

// Hình (người cùng tinh cầu cùng thấy): thân vỡ thành mảnh vàng, Nguyên Anh bay ra / ánh vàng tụ về, thân dựng lại
for (const kieu of ['hoa', 'tao']) hieuUng('na-' + kieu, { gap: 1, ve(game, e, h, a, b) {
  (game.naFx ??= []).push({ kieu, on: e, mine: e === game.player, t: 0, life: kieu === 'hoa' ? 0.8 : 0.7, pham: Math.max(0, Math.min(5, Math.round((b || 0) * 10))), seed: Math.random() * 10 });
  const T = NA(game.data)?.tieng || {}, ten = kieu === 'hoa' ? T.ra : T.ve;
  if (ten) game.sfx?.(ten, e === game.player ? 0.9 : 0.35);
  if (e === game.player) game.screen?.shake?.(kieu === 'hoa' ? 2.2 : 1.2, 0.18);
} });
export function updateAnhFx(game, dt) {
  const L = game.naFx;
  if (!L?.length) return;
  for (const f of L) f.t += dt;
  game.naFx = L.filter(f => f.t < f.life);
}
