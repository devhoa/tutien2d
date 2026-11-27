// Giằng co với loài lớn (từ Địa phẩm, data/fishing.json → gc): kim chạy qua lại trên thanh, bấm Kéo khi kim nằm trong vùng sáng.
// Cần p − tu + 2 lần kéo trúng; vùng rộng gc.vung × cần.vung ÷ (1 + hep × (p − tu)); kim chạy toc + them × (p − tu) thanh mỗi giây;
// trượt quá cần.ben lần là sổng. Sau mỗi lần trúng vùng dời chỗ, kim đổi chiều. Tự câu / Tự hành: mỗi nhịp bấm trúng theo tỉ lệ
// tu_hanh + tu_hanh_can × phẩm cần. Vẽ thanh ở src/render/draw-fish.js (f.gc).
import { FC, phamOf } from './cau-do.js';

const rnd = (a, b) => a + Math.random() * (b - a);

export function gcMoi(game, p, cn) {
  const G = FC(game).gc, k = p - G.tu, w = Math.min(0.6, G.vung * (cn.vung || 1) / (1 + G.hep * k));
  return { kim: Math.random(), chieu: Math.random() < 0.5 ? 1 : -1, toc: G.toc + G.them * k, w, z: rnd(w / 2, 1 - w / 2),
    can: k + 2, trung: 0, truot: 0, ben: cn.ben || 1, rung: 0, nhip: rnd(0.7, 1.1), loe: 0 };
}

export function gcTick(game, f, dt) {
  const g = f.gc;
  g.kim += g.chieu * g.toc * dt;
  if (g.kim > 1) { g.kim = 2 - g.kim; g.chieu = -1; }
  if (g.kim < 0) { g.kim = -g.kim; g.chieu = 1; }
  g.rung = Math.max(0, g.rung - dt * 3); g.loe = Math.max(0, g.loe - dt * 3);
}

// Một lần bấm: trúng thì đếm, đủ thì lên (len), trượt quá sức chịu của cần thì sổng (song)
export function gcBam(game, f, len, song, trungChac) {
  const g = f.gc, X = FC(game).texts, trung = trungChac ?? Math.abs(g.kim - g.z) <= g.w / 2;
  if (trung) {
    g.trung++; g.loe = 1; f.keo = 0.25;
    game.sfx('ca.gc', 0.7);
    if (g.trung >= g.can) { len(game); return; }
    let z = g.z;
    for (let i = 0; i < 6 && Math.abs(z - g.z) < 0.25; i++) z = rnd(g.w / 2, 1 - g.w / 2);
    g.z = z; g.chieu *= -1;
    game.number?.(game.player.x, game.player.y - 34, X.gc_trung, '#ffe45a');
    return;
  }
  g.truot++; g.rung = 1;
  game.sfx('ca.truot', 0.6);
  if (g.truot > g.ben) { song(game, X.gc_song); return; }
  game.toast(X.gc_truot.replace('{n}', g.truot).replace('{max}', g.ben), 1);
}

// Tự câu / Tự hành giằng co thay người chơi
export function gcTu(game, f, dt, len, song) {
  const g = f.gc, G = FC(game).gc;
  if ((g.nhip -= dt) > 0) return;
  g.nhip = rnd(0.7, 1.1);
  const q = G.tu_hanh + G.tu_hanh_can * phamOf(game.data, f.can);
  gcBam(game, f, len, song, Math.random() < q);
}
