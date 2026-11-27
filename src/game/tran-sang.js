// Sang tinh cầu khác chỉ bằng pháp trận truyền tống (chủ dự án 23/11/2026 21:41 "bỏ cái bảng tinh cầu ở map", bảng chọn "Bỏ bay ở Tinh hệ":
// Bản đồ chỉ để xem, sang tinh cầu khác chỉ bằng pháp trận; Tự hành vẫn tự bay). Nút trên thẻ tinh cầu ở Bản đồ → Tinh hệ (src/ui/world-map.js)
// và nút tinh cầu trong bảng Tông môn (src/ui/kh-view.js) dùng chung tệp này, không gọi game.travel:
//   - đứng giữa trận: Dịch chuyển luôn tới nơi đã chọn (src/game/truyen-tong.js batDauTruyen)
//   - tinh cầu đang đứng có trận: Tới pháp trận, nhân vật tự đi bộ tới giữa trận (src/game/di-toi.js); tới nơi thì Tinh đồ truyền tống mở,
//     chọn sẵn nơi đã chọn, người chơi bấm Dịch chuyển như đi tay
//   - không có trận (động phủ, vùng Thôn Thiên Mãng…): nút tắt, chữ bảo ra tinh cầu rồi vào trận
// Chữ ở data/config.json → truyen_tong.texts (di, xa, ghi).
import { tranCua, trongTran, ttChan, batDauTruyen, ttCfg } from './truyen-tong.js';
import { batDauDi } from './di-toi.js';
import { hopWhy } from './hop.js';
import { whyNot } from './starmap.js';
import { khLoad } from './khai-hoang.js';

// b: thiên thể muốn tới (đã qua luật nơi nào tới được). Trả { chu, tat, tt, di, lam }: chữ trên nút, nút tắt, nút màu pháp trận, nút đi bộ
// tới trận, việc khi bấm (đóng bảng trước rồi gọi)
export function nutSang(game, b) {
  const T = ttCfg(game).texts || {};
  if (trongTran(game)) { const why = ttChan(game, b); return { chu: why || T.go, tat: !!why, tt: true, lam: () => batDauTruyen(game, b) }; }
  if (!tranCua(game)) return { chu: T.xa, tat: true };
  const why = hopWhy(game);
  if (why) return { chu: why, tat: true };
  return { chu: T.di, tat: false, tt: true, di: true, lam: () => diTran(game, b) };
}

// Đi bộ tới giữa trận của tinh cầu đang đứng; tới nơi mở Tinh đồ truyền tống chọn sẵn b (b null: chỉ đi tới)
export function diTran(game, b) {
  const tr = tranCua(game);
  if (!tr) return false;
  game.player.meditating = false;
  batDauDi(game, tr.x, tr.y, ttCfg(game).texts.title, () => { if (b && trongTran(game)) game.worldMap?.open({ tt: true, chon: b.map }); });
  game.sfx?.('click');
  return true;
}

// Bảng Tông môn → Tinh cầu: sang tinh cầu tông môn mình (p: { id, ten }). Chưa tải tinh cầu tông môn (mạng chậm lúc vào game) thì bấm là tải
// rồi làm như nút ở Bản đồ.
export function nutTong(game, p) {
  const sm = game.data.starmap, T = ttCfg(game).texts || {}, b = () => sm.bodies.find(x => x.map === p.id) || { kh: true, map: p.id, name: p.ten, kind: 'khai' };
  if (game.map?.id === p.id) return { chu: sm.texts.here, tat: true };
  if (!game.data.maps[p.id]) {
    const trong = trongTran(game);
    if (!trong && !tranCua(game)) return { chu: T.xa, tat: true };
    return { chu: trong ? T.go : T.di, tat: false, tt: true, lam: async () => {
      await khLoad(game).catch(() => {});
      const n = nutTong(game, p);
      if (n.tat || !n.lam) game.toast?.(n.chu, 2); else n.lam();
    } };
  }
  const why = whyNot(game, b());
  return why ? { chu: why, tat: true } : nutSang(game, b());
}
