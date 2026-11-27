// Câu cá (chủ dự án 24/11/2026 00:38: "thiết kế lại hệ thống câu cá… khi câu lên thì sẽ thực sự có cá bay lên… thực sự có thể chill chill
// câu cá"; số ở data/fishing.json, tài liệu docs/18-CAU-CA.md). Đứng sát nước bấm Thả câu: dây bay ra, phao rơi xuống nước (quang) → chờ, phao
// rỉa vài lần (cho) → loài thật cắn, phao chìm hẳn (can: tung loài, tốn 1 mồi, tốn 1 phúc duyên) → bấm Kéo cần kịp lúc → loài từ Địa phẩm phải
// giằng co (gc, src/game/cau-gc.js), loài quá sức cần thì đứt dây → con vật bay khỏi nước về tay (game.cauBay, vẽ ở src/render/draw-fish.js),
// nhận ở src/game/cau-nhan.js. Tự câu (game.tuCau, nút trên thẻ nhận) và Tự hành làm thay mọi bước. game.fish = trạng thái lần câu đang dở.
import { outdoor } from './daynight.js';
import { FC, cauOf, ctxCau, phamOf, phamTen } from './cau-do.js';
import { tungCa, thoiGianCho, canOf } from './cau-roll.js';
import { gcMoi, gcBam, gcTick, gcTu } from './cau-gc.js';
import { nhanCa } from './cau-nhan.js';
import { dien, hieuUng } from './dien.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const T = game => FC(game).texts;

// Ô thả câu được: nước thật (sông, hồ; ô nước có cầu, bến bắc qua thì đi được, không tính), hoặc mép tinh cầu ở tinh cầu chưa dựng lại theo
// luật thế giới (chủ dự án 18/11/2026 11:03: câu ở nước thật, bỏ câu mép). Trả 'nuoc' | 'hai' | null. chores.js dùng chung.
export function noiCau(map, x, y) {
  if (map.at(x, y) === '=' && map.solidTile(x, y)) return 'nuoc';
  return map.edge(x, y) && !map.def.planet?.luat ? 'hai' : null;
}

// Hướng thả câu từ chỗ đứng: trong 8 ô quanh người, chọn hướng có nhiều nước trước mặt nhất (nhìn ra 3 ô), bằng nhau thì theo hướng đang nhìn;
// phao rơi xa 1,6–2,4 ô theo hướng đó nếu còn là nước. Trả { x, y, noi, bx, by } hoặc null. Chỉ ngoài trời.
export function waterDir(game) {
  if (!outdoor(game) || game.map.def.no_fish) return null;
  const map = game.map, T0 = map.T, p = game.player, tx = Math.floor(p.x / T0), ty = Math.floor(p.y / T0), f = p.face || { x: 0, y: 1 };
  let best = null;
  for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const noi = noiCau(map, tx + dx, ty + dy);
    if (!noi) continue;
    const c = map.center(tx + dx, ty + dy);
    if (Math.hypot(c.x - p.x, c.y - p.y) >= T0 * 1.5) continue;
    let sau = 1;
    while (sau < 3 && noiCau(map, tx + dx * (sau + 1), ty + dy * (sau + 1))) sau++;
    const diem = sau * 10 + (dx * f.x + dy * f.y) * 2 + (dx && dy ? 0 : 1);
    if (!best || diem > best.diem) best = { x: dx, y: dy, noi, diem, sau, c };
  }
  if (!best) return null;
  const d = Math.hypot(best.x, best.y), xa = Math.min(best.sau, 1.6 + Math.random() * 0.8) * T0;
  let bx = p.x + best.x / d * xa, by = p.y + best.y / d * xa;
  if (!noiCau(map, Math.floor(bx / T0), Math.floor(by / T0))) { bx = best.c.x; by = best.c.y; }
  return { x: best.x, y: best.y, noi: best.noi, bx, by };
}

export function fishLabel(game) {
  const f = game.fish, X = T(game);
  if (!f) return X.act_tha;
  return f.st === 'can' ? X.act_keo : f.st === 'gc' ? X.act_gc : X.act_cho;
}

// Thả câu
function quang(game, w) {
  const p = game.player, F = FC(game), d = Math.hypot(w.x, w.y) || 1;
  const ctx = ctxCau(game, w.noi), wait = thoiGianCho(game.data, ctx);
  const R = F.ria.n, n = Math.floor(rnd(R[0], R[1] + 1)), ria = [];
  for (let i = 0, t = wait; i < n; i++) { t -= rnd(F.ria.gap[0], F.ria.gap[1]); if (t > 0.5) ria.push(t); }
  game.fish = { dir: { x: w.x, y: w.y }, noi: w.noi, x: p.x, y: p.y, st: 'quang', t: 0.45, wait, ria, riaT: -9,
    bx: w.bx + rnd(-3, 3), by: w.by + rnd(-2, 2), hx: p.x + w.x / d * 6, hy: p.y - 10, keo: 0 };
  p.face = { x: w.x / d, y: w.y / d }; p.meditating = false;
  game.sfx('ca.quang', 0.6);
}

// Loài thật cắn: tung loài, tốn mồi, tốn phúc duyên
function can(game) {
  const f = game.fish, c = cauOf(game.save), ctx = ctxCau(game, f.noi), X = T(game), s = game.save;
  const id = game.cauEp ?? tungCa(game.data, ctx);   // cauEp: bài thử ép loài kế tiếp (tools/kiem/cau-ca.thu.mjs)
  if (!id) { f.st = 'cho'; f.t = f.wait; return; }
  if (ctx.moi) {
    s.mats[ctx.moi]--;
    if (s.mats[ctx.moi] <= 0) { c.moi = null; game.toast(X.het_moi.replace('{moi}', game.data.cave.materials[ctx.moi].name), 2.2); }
  }
  if (ctx.phuc) c.phuc--;
  Object.assign(f, { st: 'can', id, p: phamOf(game.data, id), can: ctx.can, moi: ctx.moi, t: FC(game).window + (canOf(game.data, ctx.can).cua_so || 0), dip: 1 });
  f.tre = game.tuCau || game.pilot ? rnd(...FC(game).tu.phan) : null;   // tự câu: kéo sau một nhịp phản xạ
  game.sfx('ca.can', 0.7); splash(game, f.bx, f.by, 6);
  if (!f.tre) game.toast(X.can, 1);
}

// Kéo cần lúc loài đang cắn
function keo(game) {
  const f = game.fish, cn = canOf(game.data, f.can), X = T(game);
  if (f.p > cn.toi_da) {   // quá sức cần: đứt dây (mồi đã mất lúc cắn)
    game.toast(X.dut.replace('{can}', game.data.cave.materials[f.can]?.name || '').replace('{pham}', phamTen(game.data, cn.toi_da).name), 2.6);
    game.sfx('ca.dut', 0.8); f.st = 'dut'; f.t = 0.6; return;
  }
  if (f.p >= FC(game).gc.tu) { f.st = 'gc'; f.gc = gcMoi(game, f.p, cn); f.t = FC(game).gc.cho; game.toast(X.gc_vao, 2); game.sfx('ca.keo', 0.8); return; }
  len(game);
}

// Con vật lên khỏi nước: bay về tay (vẽ), nhận ngay (đồ vào giỏ trước, thẻ hiện lúc tới tay)
function len(game) {
  const f = game.fish, p = game.player, F = FC(game), cn = canOf(game.data, f.can);
  const n = Math.random() < (cn.doi || 0) ? 2 : 1, to = f.p >= F.gc.tu, Tb = to ? F.bay.t_to : F.bay.t;
  (game.cauBay ||= []).push({ id: f.id, t: 0, T: Tb, x0: f.bx, y0: f.by, x1: p.x, y1: p.y - 14, n, to });
  splash(game, f.bx, f.by, to ? 14 : 8);
  game.sfx('ca.bay', to ? 0.9 : 0.6);
  const ang = Math.atan2(f.dir.y, f.dir.x) / Math.PI, i = Object.keys(F.fish).indexOf(f.id);
  dien(game, 'ca', Math.round(ang * 100) / 100, (i + 1) / 100);   // người cùng tinh cầu thấy con vật bay lên (hiệu ứng 'ca' ở cuối tệp)
  nhanCa(game, f.id, n, Tb);
  game.fish = null;
  if (game.tuCau || game.pilot) game.cauTha = rnd(...F.tu.tha) + Tb;
}

function song(game, msg) {
  const f = game.fish;
  game.toast(msg, 1.4); game.sfx('ca.truot', 0.5);
  if (f) splash(game, f.bx, f.by, 4);
  game.fish = null;
  if (game.tuCau || game.pilot) game.cauTha = rnd(...FC(game).tu.tha);
}

// Bấm nút hành động (người chơi, Tự câu, Tự hành)
export function fishAct(game, w) {
  const f = game.fish, X = T(game);
  if (!f) { if (w?.noi) quang(game, w); return; }
  if (f.st === 'can') { keo(game); return; }
  if (f.st === 'gc') { gcBam(game, f, len, song); return; }
  if (f.st === 'cho' && game.time - f.riaT < 0.5) { game.toast(X.ria, 1.2); return; }   // vừa rỉa: chưa kéo, chỉ nhắc
  if (f.st === 'quang' || f.st === 'cho') game.fish = null;   // thu cần
}

export function updateFishing(game, dt) {
  tickBay(game, dt);
  const f = game.fish, p = game.player, F = FC(game);
  if (!f) { tuTha(game, dt); return; }
  if (Math.hypot(p.x - f.x, p.y - f.y) > 4) { game.fish = null; game.tuCau = false; return; }   // bước đi là thu cần, thôi tự câu
  f.keo = Math.max(0, f.keo - dt);
  if (f.st === 'quang') { if ((f.t -= dt) <= 0) { f.st = 'cho'; f.t = f.wait; splash(game, f.bx, f.by, 3); game.sfx('ca.ria', 0.3); } return; }
  if (f.st === 'cho') {
    f.t -= dt;
    if (f.ria.length && f.t <= f.ria[0]) { f.ria.shift(); f.riaT = game.time; game.sfx('ca.ria', 0.45); splash(game, f.bx, f.by, 2); }
    if (f.t <= 0) can(game);
    return;
  }
  if (f.st === 'can') {
    f.t -= dt;
    if (f.tre != null && (f.tre -= dt) <= 0) { f.tre = null; keo(game); return; }
    if (f.t <= 0) song(game, f.moi ? T(game).song_moi : T(game).song);
    return;
  }
  if (f.st === 'gc') {
    if ((f.t -= dt) <= 0) { song(game, T(game).gc_song); return; }
    gcTick(game, f, dt);
    if (game.tuCau || game.pilot) gcTu(game, f, dt, len, song);
    return;
  }
  if (f.st === 'dut' && (f.t -= dt) <= 0) { game.fish = null; if (game.tuCau || game.pilot) game.cauTha = rnd(...F.tu.tha); }
}

// Tự câu: đứng sát nước, chưa thả thì thả lại sau một nhịp
function tuTha(game, dt) {
  if (!game.tuCau || game.uiOpen === 'qua') return;
  if ((game.cauTha = (game.cauTha ?? 0) - dt) > 0) return;
  const w = waterDir(game);
  if (!w || game.player.moving) { game.tuCau = false; return; }
  quang(game, w);
}

// Con vật đang bay, giọt nước
function tickBay(game, dt) {
  if (game.cauBay?.length) game.cauBay = game.cauBay.filter(b => (b.t += dt) < b.T + 0.35);
  if (game.cauHat?.length) game.cauHat = game.cauHat.filter(h => { h.t += dt; h.x += h.vx * dt; h.y += h.vy * dt; h.vy += 160 * dt; return h.t < h.T; });
}
export function splash(game, x, y, n) {
  const H = (game.cauHat ||= []);
  for (let i = 0; i < n && H.length < 80; i++) { const a = -Math.PI / 2 + rnd(-1.1, 1.1), v = rnd(30, 70); H.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, T: rnd(0.35, 0.6) }); }
  (game.cauGon ||= []).push({ x, y, t0: game.time });
  if (game.cauGon.length > 12) game.cauGon.shift();
}

// Người cùng tinh cầu thấy con vật bay lên (a: hướng nước / π, b: (thứ tự loài + 1) / 100)
hieuUng('ca', { gap: 0.6, ve(game, e, h, a, b) {
  const F = game.data.fishing, id = Object.keys(F.fish)[Math.round(b * 100) - 1];
  if (!id || e === game.player) return;
  const ang = a * Math.PI, bx = e.x + Math.cos(ang) * 18, by = e.y + Math.sin(ang) * 18, to = phamOf(game.data, id) >= F.gc.tu;
  (game.cauBay ||= []).push({ id, t: 0, T: to ? F.bay.t_to : F.bay.t, x0: bx, y0: by, x1: e.x, y1: e.y - 14, n: 1, to, khac: e });
  splash(game, bx, by, to ? 12 : 6);
  game.sfx('ca.bay', 0.3);
} });

