// Tự khảm ngọc khi đang tự hành: mỗi lần một viên vào lỗ trống hoặc thay viên yếu hơn, chọn viên tăng lực chiến nhiều nhất.
// Hết lỗ trống thì ghép ngọc dư (đủ số viên cùng loại cùng cấp) lên cấp trên để lần sau thay vào.
// Đã đăng nhập: khảm, ghép qua máy chủ (src/game/ky-ngoc.js), mỗi lần một lệnh; chơi thử thì tính ở máy như cũ.
import { playerStats } from './stats.js';
import { power } from './achieve.js';
import { equipped, canMerge, gemInfo, itemName } from './items.js';
import { kySocket, kyMerge } from './ky-ngoc.js';

// Tìm một lần khảm / thay tăng lực chiến nhiều nhất (null nếu không còn cách nào mạnh hơn)
function bestStep(game) {
  const s = game.save, d = game.data, keys = Object.keys(s.gems || {}).filter(k => s.gems[k] > 0);
  if (!keys.length) return null;
  const now = power(game, playerStats(s, d));
  let best = null;
  for (const it of equipped(s)) it.sockets.forEach((old, i) => {
    for (const k of keys) {
      if (k === old) continue;
      it.sockets[i] = k;
      const v = power(game, playerStats(s, d)) - now;
      if (v > 0 && (!best || v > best.v)) best = { it, i, k, v };
    }
    it.sockets[i] = old;
  });
  return best;
}

// Bước thay ngọc cấp thấp (chủ dự án 25/11/2026: "món đang mặc có ngọc 1 thì ấn Khảm ngọc tốt nhất, ngọc 1 đó vẫn giữ nguyên, tôi muốn
// nó phải được thay bằng ngọc tốt nhất"). Lực chiến không tăng khi tổng ngọc một chỉ số đã chạm trần (data/he-chien.json → gem_cap) nên
// bestStep bỏ qua; bước này: lỗ đang có ngọc thì thay bằng viên cùng loại cấp cao nhất trong túi, lỗ trống thì khảm viên cấp cao nhất.
// Không bao giờ làm lực chiến giảm (cùng loại cấp cao hơn chỉ thêm, lỗ trống chỉ thêm); mỗi bước cấp ngọc chỉ tăng nên vòng lặp dừng.
const lvOf = k => +String(k).split(':')[1] || 0, typeOf = k => String(k).split(':')[0];
export function upgradeStep(game) {
  const s = game.save, keys = Object.keys(s.gems || {}).filter(k => s.gems[k] > 0);
  if (!keys.length) return null;
  const now = power(game, playerStats(s, game.data));
  for (const it of equipped(s)) for (let i = 0; i < it.sockets.length; i++) {
    const old = it.sockets[i];
    const pool = old ? keys.filter(k => typeOf(k) === typeOf(old) && lvOf(k) > lvOf(old)) : keys;
    if (!pool.length) continue;
    const k = pool.reduce((a, b) => (lvOf(b) > lvOf(a) ? b : a));
    it.sockets[i] = k;
    const v = power(game, playerStats(s, game.data)) - now;
    it.sockets[i] = old;
    if (v >= 0) return { it, i, k, v };
  }
  return null;
}

// Nút "Khảm ngọc tốt nhất" ở Túi → Ngọc (đề xuất #33): lặp từng bước cho tới khi không còn viên nào làm mạnh hơn, rồi thay hết ngọc
// cấp thấp bằng viên cùng loại cấp cao nhất (upgradeStep). Không ghép ngọc.
export async function bestGems(game) {
  let n = 0, gain = 0, b;
  while (n < 200 && (b = bestStep(game) || upgradeStep(game))) {
    if (!(await kySocket(game, b.it.uid, b.i, b.k))) break;   // máy chủ từ chối: dừng, giữ những lần đã khảm
    n++; gain += b.v;
  }
  if (n) { game.refreshStats(); game.persist(); }
  return { n, gain };
}

// kham: tự khảm / thay viên; ghep: tự ghép ngọc dư (hai việc bật tắt riêng ở Menu → Tự động, góp ý #183 23/11/2026)
export async function autoGem(game, kham = true, ghep = true) {
  const s = game.save, d = game.data, keys = Object.keys(s.gems || {}).filter(k => s.gems[k] > 0);
  if (!keys.length || game.kyBusy || performance.now() < (game.agWait || 0)) return;
  const wait = () => { game.agWait = performance.now() + 30000; };   // máy chủ từ chối: 30 giây sau mới thử lại
  const best = kham && bestStep(game);
  if (best) {
    if (!(await kySocket(game, best.it.uid, best.i, best.k, true))) return wait();
    game.refreshStats(); game.persist();
    game.autoNote(`Tự khảm ${gemInfo(d, best.k).name} vào ${itemName(d, best.it)}: lực chiến +${best.v.toLocaleString('vi-VN')}`, 2.2);
    return;
  }
  if (!ghep || (kham && equipped(s).some(it => it.sockets.includes(null)))) return;   // đang tự khảm: khảm đủ lỗ rồi mới ghép
  const k = keys.find(x => canMerge(d, s, x, d.config.pilot.garden_keep));   // luôn chừa lại một ít Linh Thạch
  if (!k) return;
  if (!(await kyMerge(game, k, d.config.pilot.garden_keep, 1, true))) return wait();
  game.persist(); game.autoNote(`Tự ghép ngọc: ${gemInfo(d, k).name} thành cấp ${gemInfo(d, k).lv + 1}`, 1.8);
}
