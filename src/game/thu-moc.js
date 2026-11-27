// Móc cho bài thử tự động (tools/playtest.mjs, bài thử hai máy tools/hai-may.mjs). Bản đưa lên mạng được gói lại (tools/goi.mjs) nên bài
// thử không gọi được từng tệp code theo đường dẫn (import('/src/game/pilot.js')) nữa: những hàm bài thử cần được treo ở window.__thu.
// Chỉ treo khi địa chỉ có ?thu=1 (chế độ chơi thử, src/ui/login.js); không thêm quyền gì: window.__game vốn đã mở cho bài thử đọc.
// Bài thử cần thêm hàm nào thì thêm vào đây, không gọi thẳng tệp code.
import { togglePilot } from './pilot.js';
import { usePill } from './cave.js';
import { dropLoot, updateLoot } from './loot.js';
import { kiepWave } from './kiep-see.js';
import { phat } from './phat.js';
import { dien, cacHieuUng } from './dien.js';
import { demXem } from './others-nhan.js';
import { hoSoCuaToi, epHoSo } from './ho-so-phong.js';
import { togglePvp, pvpPbHit } from './pvp.js';
import { hoaMa } from './pvp-ma.js';   // bài thử hai máy: bấm Hóa ma bằng đúng hàm của nút
import { drawNameShield } from '../render/draw-pvp-tag.js';   // bài thử hai máy: nhãn tên người khác vẽ hình gì (đầu lâu khi họ là ma)
import { hitMob } from './combat.js';   // bài thử quái chung (tools/quai-chung.thu.mjs) cho hai máy đánh cùng một con
import { khState, khRebuild } from './khai-hoang.js';   // bài thử quái chung trên tinh cầu tông môn: đưa một tinh cầu giả vào game
import { tpDien } from './than-phap.js';   // bài thử hai máy: A diễn một thức Thân pháp, máy B phải thấy
import { tranCua, trongTran, batDauTruyen } from './truyen-tong.js';   // bài thử pháp trận truyền tống (tools/kiem/truyen-tong.thu.mjs)
import { guideTarget } from './guide.js';   // bài thử pháp trận: truyện bảo sang tinh cầu khác thì mũi tên trỏ trận
import { docBang, phongHaoNguoi, phongHaoToi } from './phong-hao.js';   // bài thử hai máy: phong hào người khác trước tên (bảng xếp hạng giả)
import { veBiHa } from '../render/draw-ghost.js';   // bài thử hồi sinh (tools/kiem/hoi-sinh.thu.mjs): thân bị hạ vẽ ra khung riêng, đo độ đen
import { drawHero } from '../render/draw-hero.js';
import { renderDetail } from '../ui/bag-detail.js';   // bài thử hỏi lại món phẩm Thiên (tools/kiem/hoi-thien.thu.mjs): dựng tấm chi tiết món
import { nenReady } from '../world/draw-nen.js';   // bài thử hình tải hỏng (tools/kiem/hinh-hong.thu.mjs): nền đã đủ hình để vẽ chưa
import { soHinh } from '../core/hinh-so.js';   // bài thử hình sai cỡ (tools/kiem/hinh-sai-co.thu.mjs): sổ hình hỏng máy sẽ báo về
import { bodiesOf, whyNot } from './starmap.js';
import { hoaAnh, taiTao } from './anh-the.js';   // bài thử hai máy: A hoá Nguyên Anh, Tái tạo (docs/21-NGUYEN-ANH.md)
import { boDoHang } from '../ui/bo-do-hang.js';   // bài thử Bộ trang bị (tools/kiem/bo-do.thu.mjs): dựng hàng ô Bộ 1–4
import { boLuu, boMac } from './bo-do.js';
import { nhanSach, knDat, knO } from './ky-nang.js';
import { tpHoc, tpDat, tpO } from './than-phap.js';

export function mocThu() {
  const q = new URLSearchParams(location.search);
  if (!q.has('thu')) return;
  window.__thu = { usePill, togglePilot, dropLoot, updateLoot, phat, kiepWave, dien, cacHieuUng, demXem, hoSoCuaToi, epHoSo, togglePvp, hoaMa, hitMob, pvpPbHit, khState, khRebuild, tpDien, tranCua, trongTran, batDauTruyen, guideTarget, renderDetail, hoaAnh, taiTao, boDoHang,
    bo: { boLuu, boMac, nhanSach, knDat, knO, tpHoc, tpDat, tpO },   // bài thử Bộ lưu toàn bộ (kỹ năng, thân pháp…)
    nenSan: () => nenReady(window.__game, window.__game.map), soHinh,
    tinhDo: () => bodiesOf(window.__game.data.starmap, window.__game.data.maps).filter(x => x.map).map(x => ({ map: x.map, chan: whyNot(window.__game, x) })),   // bài thử tinh cầu mới: Tinh đồ cho tới / chặn
    phongHaoThu: (luc, ma) => { window.__game.phongHao = { luc: docBang(luc), ma: docBang(ma) }; }, phongHaoNguoi, phongHaoToi,
    veNhan: (ctx, game, o) => drawNameShield(ctx, game, o, 20, 1, '#000', '#fff'),
    // Thân mình vẽ vào khung riêng 96 × 96 (không nền, không đèn): k = null thân thường, k = 0..1 thân bị hạ; trả độ sáng trung bình các điểm có màu
    veThan: (game, k) => {
      const c = document.createElement('canvas'); c.width = c.height = 96;
      const x = c.getContext('2d'), p = game.player, e = { x: 0, y: 0, face: { x: 1, y: 0 }, lookX: 1, top: p.top || 24, r: p.r };
      x.setTransform(2, 0, 0, 2, 48, 88);
      if (k == null) drawHero(x, game, e, 0, false, game.hoSo); else veBiHa(x, game, e, game.hoSo, k, 0);
      const d = x.getImageData(0, 0, 96, 96).data; let s = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { n++; s += 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; }
      return { diem: n, sang: n ? s / n : null };
    } };
  // ?thu=1&phong=<mã>: khách này vào phòng người chơi như người đã đăng nhập, mang mã và tên thử (bài thử hai máy tools/hai-may.mjs dựng
  // phòng giả trong máy bằng đúng mã cloud/src/phong.js). Vé gửi đi là chính mã thử nên máy chủ phòng thật từ chối: không thêm quyền gì.
  const id = q.get('phong');
  if (id && /^[\w-]{1,36}$/.test(id)) { window.__thu.phong = { id, ten: 'Thử ' + id }; window.__game.thuDoc = new Set(); }   // thuDoc: others.js ghi trường hồ sơ nào được đọc tới
}

// Khách đang chạy bài thử hai máy thì trả { id, ten }; người chơi thật luôn là null
export const phongThu = () => window.__thu?.phong || null;
