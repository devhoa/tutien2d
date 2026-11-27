// Người chơi có đang ở trước máy không (25/11/2026 17:0x). Lễ thức tỉnh (src/game/le-the.js, le-toc.js) tự mở lúc màn hình yên, mở bằng một
// câu thoại; hộp thoại đang mở thì cả thế giới đứng chờ (src/game/game.js: blocked). Sau lần đưa Thể chất lên 16:44, người Kim Đan đang treo Tự
// đánh / đả toạ được trang tự tải lại rồi tự vào game (src/net/ban-moi.js, src/ui/tu-vao.js), lễ mở ra lúc không ai ngồi đó: câu thoại đứng mãi,
// Tự đánh đứng theo, mà game vẫn coi là đang treo có việc nên không cho rời (treo-may.js dangBan). Soát máy chủ 16:59: 6 trong 22 người vừa
// quay thể chất còn kẹt ở câu thoại, vẫn gửi nhịp online, bản lưu không nhúc nhích từ lúc quay.
// Nên: lễ chỉ tự mở khi vừa có một cú chạm / phím THẬT (isTrusted) trong co_mat_s giây. Tự vào lại game không sinh sự kiện nào (login.js gọi
// thẳng onclick), các nút tự bấm hộ trong game là sự kiện giả (isTrusted = false) nên đều không tính. Người đang treo: lễ chờ tới lúc họ quay lại
// chạm màn; người đang chơi: vẫn "vào game là làm lễ" như cũ.
const EV = ['pointerdown', 'pointermove', 'pointerup', 'keydown', 'touchstart', 'wheel'];

export function startCoMat(game) {
  if (game.coMatOn || typeof addEventListener !== 'function') return;
  game.coMatOn = true;
  const cham = e => { if (e.isTrusted) game.chamLuc = Date.now(); };
  for (const ev of EV) addEventListener(ev, cham, { capture: true, passive: true });
}

// Vừa chạm trong s giây gần đây? s không có hoặc ≤ 0: không xét (coi như có mặt)
export const coMat = (game, s, now = Date.now()) => !(s > 0) || now - (game.chamLuc || 0) <= s * 1000;
