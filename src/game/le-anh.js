// Lễ Kết Anh: lần đầu thức tỉnh Nguyên Anh (chủ dự án 27/11/2026; docs/21-NGUYEN-ANH.md). Ai đã tới Nguyên Anh (kể cả người lên Nguyên Anh trước khi
// có tính năng này) mà chưa qua lễ: lúc màn hình đang yên (không thoại, không bảng, không đang đánh) và người chơi vừa chạm màn (src/game/co-mat.js),
// Hệ Thống báo rồi lễ mở, đúng một lần. Huyết mạch, thể chất chưa thức tỉnh thì chờ hai lễ đó xong đã.
// Trình tự (hình ở src/render/draw-nguyen-anh.js veLe, người cùng tinh cầu cùng thấy qua hiệu ứng 'na-le'): kim đan ở đan điền sáng dần, linh khí
// xoáy vào → kim đan nứt, vệt sáng vàng toả ra → bùng sáng, một Nguyên Anh y hệt mình bằng vàng bay ra khỏi thân → lơ lửng trên đầu, hàng chữ lớn
// "Nguyên Anh xuất thế" → hạ về đan điền. Không đổi chỉ số, không có may rủi: chỉ ghi cờ na-thuc vào bản lưu. Máy mình: màn thức tỉnh phẩm
// cả màn (src/ui/le-anh.js) diễn trước, đóng màn thì trên bản đồ Nguyên Anh bay ra rồi về (người cùng tinh cầu thấy cảnh bản đồ ngay từ đầu).
import { NA, naOn, naMo, naPham, naTen, st } from './nguyen-anh.js';
import { dien } from './dien.js';
import { tcOn } from './the-chat.js';
import { tnOn } from './tiem-nang.js';
import { startCoMat, coMat } from './co-mat.js';

const cho = ms => new Promise(r => setTimeout(r, ms));

// Vừa qua kiếp Kết Anh mà chưa thức tỉnh: tribulation.js cho lễ diễn ngay, trước bảng chúc mừng (chủ dự án 27/11/2026 03:0x: "thức tỉnh nguyên anh
// trước, sau đó mới chúc mừng"), không chờ màn yên
export const anhTruoc = game => { const s = game.save; return naOn(game.data) && !!s?.element && !s.flags?.['na-thuc'] && !game.leDang && naMo(s, game.data); };

export async function leAnh(game) {
  const C = NA(game.data), s = game.save;
  if (!naOn(game.data) || !s?.element || s.flags?.['na-thuc'] || game.leDang || !naMo(s, game.data)) return false;
  game.leDang = true; game.leAnhDang = true;
  try {
    const L = C.le || {}, ten = game.data['he-thong']?.short || game.data['he-thong']?.name || 'Hệ Thống';
    game.sfxWarm?.(Object.values(L.man?.sfx || {}));   // dựng sẵn tiếng màn thức tỉnh trong lúc đọc lời Hệ Thống
    await game.dialog.say([[ten, L.truoc]]);
    (s.flags ||= {})['na-thuc'] = true;
    game.persist?.();
    const ph = naPham(s, game.data), P = naTen(s, game.data);
    dien(game, 'na-le', 0, ph / 10);
    const dai = (L.dai_s ?? 5.4) * 1000, S = Array.isArray(L.sau) ? L.sau : [L.sau], loi = S[Math.min(S.length - 1, ph >= 4 ? 2 : ph >= 2 ? 1 : 0)];   // thể chất mạnh → Nguyên Anh nhỏ; thể chất yếu → Nguyên Anh khoẻ gánh thay
    if (game.leAnhUI) {   // màn thức tỉnh phẩm cả màn (src/ui/le-anh.js), game đứng yên; xong thì trên bản đồ Nguyên Anh bay ra rồi về đan điền
      await game.leAnhUI({ ph, ten: P.ten, mau: P.mau || C.mau?.giua || '#ffcd45', loi });
      for (const l of game.naLe || []) if (l.mine && l.t < 2.05) l.t = 2.05;   // bỏ đoạn tụ, nứt trên bản đồ (màn lễ vừa diễn), tiếng rời thân vẫn kêu
      await cho(dai - 2050 + 300);
    } else {
      await cho(dai * 0.48);   // lúc Nguyên Anh vừa lơ lửng trên đầu
      game.chuLon?.({ cau: String(L.cau || '').replace('{pham}', P.ten), nhan: L.chu_lon, han: L.han, mau: P.mau || C.mau?.giua || '#ffcd45', giu: 1.8 });
      await cho(dai * 0.52 + 300);
      await game.dialog.say([[ten, loi]]);
    }
    st(game).cd = 0;   // nhát trúng quái kế tiếp là Nguyên Anh xuất khiếu ngay
  } finally { game.leDang = false; game.leAnhDang = false; }
  return true;
}

export function createLeAnh(game) {
  let yen = 0;
  startCoMat(game);
  setInterval(() => {
    const s = game.save, D = game.data, L = NA(D)?.le || {};
    if (!naOn(D) || !s?.element || s.flags?.['na-thuc'] || game.leDang || !naMo(s, D) || (tnOn(D) && !s.tiem?.toc) || (tcOn(D) && !s.theChat)) { yen = 0; return; }
    const ban = !coMat(game, L.co_mat_s ?? 15) || !(game.manLang?.() ?? true) || game.story?.busy || game.trib?.active || game.duel || game.ghost || game.uiOpen || game.mobs?.some(m => m.aggro && m.hp > 0);
    if (ban) { yen = 0; return; }
    if (++yen >= (L.yen_s ?? 4)) { yen = 0; leAnh(game); }   // yên đủ lâu mới mở: không chen vào trận đánh, cảnh truyện, kiếp; không ai chạm màn thì chờ
  }, 1000);
}
