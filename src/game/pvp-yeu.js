// Đánh người yếu hơn: đánh được, không có lợi (chủ dự án 23/11/2026 20:4x; luật ở data/pvp.json → _yeu, yeu). Máy chủ dữ liệu quyết
// (lúc ghi trận: không ghi nợ, không cộng điểm ma; migration 20261123110000). Máy này chỉ dựa vào cảnh giới người khác báo qua
// hồ sơ phòng (o.ri, data/dong-bo.json) để nói cho người chơi biết vì sao lần hạ này không có gì.
const cach = game => game.data.pvp?.yeu?.cach | 0;
const canh = x => (Number.isFinite(+x) ? +x | 0 : null);

// Người o kém mình từ yeu.cach đại cảnh giới trở lên (mình hạ họ thì không được gì)
export function kemMinh(game, o) {
  const n = cach(game), r = canh(o?.ri);
  return n > 0 && r !== null && (game.save?.realm | 0) - r >= n;
}

// Người o hơn mình từ yeu.cach đại cảnh giới trở lên (họ hạ mình thì mình không mất gì)
export function honMinh(game, o) {
  const n = cach(game), r = canh(o?.ri);
  return n > 0 && r !== null && r - (game.save?.realm | 0) >= n;
}
