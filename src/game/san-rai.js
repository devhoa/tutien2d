// Nhiệm vụ săn rải (chủ dự án 26/11/2026 13:40: "làm rải rác ra 1 xíu, 3000 con ở 1 chỗ, mọi người đi tới đó đông quá"; bảng câu hỏi cùng lúc:
// "5.000 con, 6–8 nơi"; docs/14-TRAN-MA-KY.md phần B "Săn rải"). Bước truyện khai until.san = [{ in: bản đồ, at: [ô x, ô y], r: bán kính (ô),
// n: số con, ten: tên nơi }] và until.n = tổng. Mỗi nơi một hạn mức riêng: quái gục TRONG vòng của nơi nào thì tính cho nơi đó, đủ hạn mức thì
// nơi ấy thôi tính; đủ mọi nơi thì xong việc. Thứ tự đi do người chơi chọn; Tự hành thì mỗi người bắt đầu ở một nơi khác nhau (lệch theo tên
// nhân vật) rồi đi vòng, nên cùng một nhiệm vụ mà người chơi tản đều ra các bãi thay vì dồn vào bãi gần cổng nhất.
// Số đếm nằm ở counters của src/game/story.js: 'san:<thứ tự nơi>' và 'san' (tổng đã tính), ghi vào save.nvDem như các nhiệm vụ farm dài khác.
const hash = s => { let h = 0; for (const ch of String(s || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
// Số lệch riêng của mỗi người chơi trong khoảng 0 … n − 1 (cùng tên thì cùng số, đổi máy không đổi)
export const lechRieng = (game, n) => (n > 0 ? hash(game.save?.name) % n : 0);

const con = (u, c, i) => (c['san:' + i] || 0) < u.san[i].n;   // nơi i còn thiếu
const trong = (game, k, x, y) => { if (game.map.id !== k.in) return false; const o = game.map.center(k.at[0], k.at[1]); return Math.hypot(x - o.x, y - o.y) <= k.r * game.map.T; };

export const sanDa = (u, c) => u.san.reduce((a, k, i) => a + Math.min(c['san:' + i] || 0, k.n), 0);
export const sanXong = (u, c) => u.san.every((k, i) => !con(u, c, i));
// Nơi đang nhắm: nơi còn thiếu mà người chơi đang đứng trong; không thì nơi còn thiếu đầu tiên theo vòng riêng của người ấy. -1: đã đủ mọi nơi
export function sanNoi(game, u, c) {
  const N = u.san.length, p = game.player, d = lechRieng(game, N);
  let dau = -1;
  for (let j = 0; j < N; j++) {
    const i = (j + d) % N;
    if (!con(u, c, i)) continue;
    if (p && trong(game, u.san[i], p.x, p.y)) return i;
    if (dau < 0) dau = i;
  }
  return dau;
}
// Con quái vừa gục ở (x, y) tính cho nơi nào: nơi đang nhắm nếu nó nằm trong vòng ấy, không thì nơi còn thiếu đầu tiên chứa nó. -1: không tính
export function sanO(game, u, c, x, y) {
  const i = sanNoi(game, u, c);
  if (i >= 0 && trong(game, u.san[i], x, y)) return i;
  return u.san.findIndex((k, j) => con(u, c, j) && trong(game, k, x, y));
}
// Cho thẻ nhiệm vụ, mũi tên chỉ đường và Tự hành: nơi đang nhắm { i, in, at, r, ten, da, of, o: đang ở bản đồ ấy, trong: đang đứng trong vòng }
export function sanTin(game, u, c) {
  const i = sanNoi(game, u, c), k = u.san[i], p = game.player;
  if (!k) return null;
  return { i, in: k.in, at: k.at, r: k.r, ten: k.ten, da: Math.min(c['san:' + i] || 0, k.n), of: k.n, o: game.map.id === k.in, trong: !!p && trong(game, k, p.x, p.y) };
}
// Bãi nhà của một người trong nhiệm vụ farm dài ở MỘT bản đồ (hạ mấy nghìn con, đánh đủ giờ): Tự hành đánh quanh bãi này thay vì bãi gần cổng
// nhất, mỗi người một bãi (lệch theo tên), mười phút cả bọn dịch sang bãi kế nên vẫn tản đều. Chỉ lấy bãi thường (không phải vòng ngoài nhiễm ma
// khí mul, không gắn cờ truyện); bản đồ có dưới hai bãi như vậy thì null (đánh con gần nhất như cũ).
export function baiNha(game, phut = 10) {
  const ds = (game.map.def.spawners || []).filter(s => !s.mul && !s.need && !s.unless && !s.cp && !s.kt);
  if (ds.length < 2) return null;
  return game.map.center(...ds[(lechRieng(game, 9973) + Math.floor(Date.now() / (phut * 60000))) % ds.length].at);
}
