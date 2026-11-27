// Lễ thức tỉnh thể phách (Thể chất, chủ dự án 25/11/2026 12:53–12:55: "Kết đan mới thức tỉnh thể phách", "ngầu như cách thức tỉnh huyết
// mạch"; docs/20-THE-CHAT.md). Một đời một lượt.
// Ai đã tới Kim Đan (kể cả người lên Kim Đan trước khi có Thể chất) mà chưa có thể chất: lúc màn hình đang yên (không thoại, không bảng, không
// đang đánh) Hệ Thống báo và lễ tự mở, đúng một lần. Huyết mạch chưa thức tỉnh thì chờ lễ huyết mạch xong đã (src/game/le-toc.js).
// Lễ chỉ tự mở khi người chơi vừa chạm màn trong le.co_mat_s giây (src/game/co-mat.js): đang treo máy không ai ngồi đó thì chờ họ quay lại.
// Kết quả quay ghi vào save.theChat rồi mới mở màn lễ (src/ui/le-the.js): thoát game giữa lễ cũng không quay lại được lượt khác.
// Có tài khoản: CHỈ máy chủ quay (src/net/the-chat.js, migration 20261125060000_p2d_the_chat.sql), gửi bản lưu lên trước để máy chủ thấy cảnh giới mới.
// Máy chủ chưa trả lời thì hoãn lễ, lát thử lại (le.thu_lai_s), không quay tạm tại máy: quay tạm rồi lúc lưu máy chủ đổi sang kết quả của nó thì người
// chơi thấy lễ ra một thể chất mà nhận một thể chất khác. Chơi thử không tài khoản: quay tại máy (bài thử ép kết quả: game.theEp = mã, chỉ có tác dụng khi chơi khách).
import { TC, tcOn, theMo, quayThe, phamThe } from './the-chat.js';
import { tnOn } from './tiem-nang.js';
import { startCoMat, coMat } from './co-mat.js';

async function xinQuay(game) {
  const C = TC(game.data);
  if (game.cloud) {
    try { await game.cloud.flush?.(); const r = await game.quayTheMayChu?.(); return r?.ma && C.the[r.ma] ? r.ma : null; } catch { return null; }
  }
  if (game.cloudDown) return null;   // đã đăng nhập mà máy chủ đang lỗi: chờ
  return game.theEp && C.the[game.theEp] ? game.theEp : quayThe(game.data);   // chơi khách: quay tại máy (theEp: bài thử ép kết quả, chỉ có tác dụng khi chơi khách)
}

export async function leThe(game) {
  const C = TC(game.data), s = game.save;
  if (!tcOn(game.data) || !s?.element || s.theChat || game.leDang || !theMo(s, game.data)) return false;
  game.leDang = true;
  try {
    const L = C.le, ten = game.data['he-thong']?.short || game.data['he-thong']?.name || 'Hệ Thống';
    const ma = await xinQuay(game);
    if (!ma) { game.leTheCho = Date.now() + (L.thu_lai_s ?? 60) * 1000; return false; }
    await game.dialog.say([[ten, L.truoc]]);
    s.theChat = ma;
    game.refreshStats(); game.persist();
    await game.leTheUI?.(ma);
    const t = C.the[ma], p = phamThe(game.data, t);
    game.chuLon?.({ cau: t.ten, nhan: L.chu_lon, han: t.han, mau: p.mau, giu: 1.6 });
    await game.dialog.say([[ten, (L.sau[t.pham] || L.sau[0]).replace(/\{the\}/g, t.ten)]]);
  } finally { game.leDang = false; }
  return true;
}

export function createLeThe(game) {
  let yen = 0;
  startCoMat(game);
  game.quayTheMayChu ??= async () => (game.cloud ? (await import('../net/the-chat.js')).quayTheChat() : null);
  setInterval(() => {
    const s = game.save, D = game.data;
    if (!tcOn(D) || !s?.element || s.theChat || game.leDang || !theMo(s, D) || (tnOn(D) && !s.tiem?.toc) || Date.now() < (game.leTheCho || 0)) { yen = 0; return; }
    const ban = !coMat(game, TC(D).le.co_mat_s) || !(game.manLang?.() ?? true) || game.story?.busy || game.trib?.active || game.duel || game.ghost || game.uiOpen || game.mobs?.some(m => m.aggro && m.hp > 0);
    if (ban) { yen = 0; return; }
    if (++yen >= (TC(D).le.yen_s ?? 4)) { yen = 0; leThe(game); }   // yên đủ lâu mới mở: không chen vào trận đánh, cảnh truyện, lễ Kết Đan; không ai chạm màn thì chờ
  }, 1000);
}
