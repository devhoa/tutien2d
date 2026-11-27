# Sư đồ, cơ duyên, Tọa Vong Đan, tỉ lệ luyện đan

Chủ dự án 25/11/2026 10:08 – 10:2x (làm trên nhánh `su-do-dan`, máy tạm). Lời gốc và quyết định ghi ở `CLAUDE.md`.
Phần này nói thiết kế, số đang dùng, chỗ code, cách thử, việc còn chờ chủ dự án.

## 1. Lời chủ dự án

- 10:08: "có người nói muốn xây tính năng mới (đào khoáng, thể chất, sư đồ. Chèn thêm nhiệm vụ nhận sư đồ, khi đó nếu được chỉ điểm (trong mục sư đồ sẽ có nút
  này) mỗi ngày, đồ đệ sau khi được chỉ điểm sẽ +10% linh khí tới 00h. Sư phụ nếu được đồ đệ hành lễ (nút trong mục sư đồ) mỗi ngày sẽ được buff 5% linh thạch khi
  đánh quái (sư phụ tối đa nhận 5 đệ tử và phải cách 1 cảnh giới ví dụ kết đan và luyện khí."
- "Tiếp đó là đan dược, sẽ xây thêm 1 hệ thống mới, trên cây sẽ xuất hiện trái cây lạ, cái này là cơ duyên, và một vài linh thảo lạ, nhặt được có thể luyện thành 1
  loại đan mới. Đan này ăn vào sẽ cộng thời gian để đả toạ, trong thời gian ăn đan và đả toạ, linh khí sẽ nhận vào nhiều hơn khi đi farm 1,5 lần (b xem nó khoảng
  bao nhiêu) và có hiệu ứng hấp thu linh khí. Thời gian của mỗi viên đan là random, khoảng vài tiếng. Và đan này không mua được, chỉ cơ duyên nhặt nguyên liệu rồi
  luyện ra. Sửa lại tỷ lệ luyện đan cao hơn 1 xíu, giúp tôi liệt kê all tỷ lệ của toàn bộ đan."
- Bảng chọn 10:2x: tỉ lệ luyện đan **"Gốc 80%, trừ 4% / phẩm"**; sư đồ **"Hơn 2 cảnh giới, +5% không dồn"** (Kim Đan nhận Luyện Khí là cách hai bậc: Luyện Khí →
  Trúc Cơ → Kim Đan); đào khoáng **"Làm sau, bản nhỏ"**; thể chất **"Tôi muốn liệt kê danh sách tên của loại thể chất trước"** (đã gửi 24 tên, CHƯA làm tới khi
  chủ dự án chọn).

## 2. Sư đồ

- Menu → **Sư đồ** (`data/menu.json`, bảng `src/ui/su-do-panel.js`). Kết sư đồ: nút **Bái sư** / **Thu đồ** ở dòng bạn bè và trong Hồ sơ người chơi (nút chỉ hiện khi
  hai người cách nhau đủ cảnh giới; ai cao hơn là sư phụ); người kia vào bảng Sư đồ bấm Đồng ý là thành.
- Luật (`data/social.json → su_do`, máy chủ giữ y vậy): sư phụ hơn đồ đệ ít nhất `cach` **2** cảnh giới LÚC KẾT (đồ đệ tu lên sau này vẫn là đồ đệ); mỗi sư phụ tối
  đa `toi_da` **5** đồ đệ; mỗi người một sư phụ (vẫn thu đồ đệ của mình được); mỗi người tối đa 5 lời ngỏ đang chờ.
- Mỗi ngày, ngày tính theo giờ Việt Nam (00:00 là hết):
  - Sư phụ bấm **Chỉ điểm** cho từng đồ đệ → đồ đệ đó **+10% linh khí** (`qi`) tới 00:00: nhân vào mọi linh khí nhận qua `game.gainQi` (chém quái, đả tọa,
    đan linh khí), như +5% của đạo lữ.
  - Đồ đệ bấm **Hành lễ** → sư phụ **+5% Linh Thạch hạ quái** (`lt`) tới 00:00; nhiều đồ đệ hành lễ vẫn chỉ +5% (không dồn).
- Rời sư môn (đồ đệ) / Trục xuất (sư phụ) / Rút lời / Từ chối: một hàm `p2d_su_do_roi`. Không có phạt, không có thời gian chờ.
- Nhiệm vụ Hệ Thống **`su-do`** ("Bái một vị sư phụ hoặc thu một đồ đệ", sau `luyen-khi-7`): thưởng 20 000 Linh Thạch + 5 Tụ Khí Đan; điều kiện `dk.su_do`, máy chủ
  tự đếm quan hệ (`p2d_ht_xong` đưa `_su_do` vào, `p2d_ht_dk` xét).
- Máy chủ chỉ giữ quan hệ và ngày bấm (bảng `p2d_su_do`, khoá kín, chỉ qua hàm `p2d_su_do_tt / moi / roi / chi_diem / hanh_le`). Phần cộng do máy khách tự nhân
  (như đạo lữ) và nằm trong hạn mức sẵn có của bộ hãm linh khí / Linh Thạch: sửa máy để tự cộng cũng không vượt được hạn mức.
- Code: `src/net/su-do.js` (gọi máy chủ), `src/game/su-do.js` (trạng thái, `game.suDoQiMul()`, `game.suDoLtMul()`, `game.suDoCo()`, đọc lại mỗi `doc_s` 300 giây),
  `src/ui/su-do-panel.js`; móc ở `src/game/game.js` (gainQi), `src/game/shop.js` (coinDrop), `src/game/he-thong.js` (missionDone), `src/ui/friends-panel.js`,
  `src/ui/profile-panel.js`.

## 3. Cơ duyên

- Thỉnh thoảng trên một cây của bản đồ kết một trái **Chu Quả** (phát sáng, có cột sáng mảnh), hoặc dưới đất mọc **Thất Diệp Linh Chi**. Lại gần `pick` 30 điểm là
  hái. Món vừa hiện thì màn chơi báo một dòng ("Một làn hương lạ thoảng qua…").
- **Mỗi người một cơ duyên riêng**: chỗ và lúc hiện tính từ hạt giống = bản đồ + khung giờ + hạt riêng trong bản lưu (`save.coDuyen.hat`); người khác không thấy,
  không tranh được. Không có ở phó bản, bí cảnh, đài, trong nhà, động phủ.
- Số (`data/co-duyen.json`): mỗi khung `slot_s` 900 giây (15 phút) tung một lần cho từng món ở bản đồ đang đứng: Chu Quả `p` 40%, Thất Diệp Linh Chi 22%; món nằm
  `life_s` 600 giây. Mỗi ngày hái tối đa **6 Chu Quả, 3 Thất Diệp Linh Chi** (`ngay`). Máy chủ chặn thêm một lớp (`p2d_tran_ngay`: trần 6 và 3, quá trần phần vượt
  chỉ tính 20% tới 1,2 lần trần: nhiều nhất 7 và 3 mỗi ngày dù sửa máy).
- Hai món **không bán ở đâu**, không rơi từ quái.
- Code: `src/game/co-duyen.js` (tung, hái, trần ngày), `src/render/draw-co-duyen.js` (trái trên cây, quầng sáng, chớp lúc hái), hình `ui.vk-chu-qua`,
  `ui.vk-that-diep-linh-chi` (`tools/art/co_duyen_icon.py`, đổi sắc từ hình có sẵn; chủ dự án muốn hình riêng thì gửi ảnh GPT).

## 4. Tọa Vong Đan

- Đan phương: **2 Chu Quả + 1 Thất Diệp Linh Chi** → 1 viên (phẩm Thiên). Chỉ hai nguyên liệu cơ duyên, cố ý không lẫn Linh Thảo: lò chưa biết đan thì ghép mọi đan
  phương khớp theo thứ tự ngẫu nhiên, có Linh Thảo là dễ ra Hồi Xuân Đan rồi mất trắng Chu Quả (bài thử chặn). Mỗi ngày nhiều nhất 3 mẻ nguyên liệu.
- Uống: cộng ngẫu nhiên **2 tới 4 giờ** tọa vong (`use.toa_vong` [7200, 14400] giây) vào `save.toaVong`. Giờ **chỉ trôi lúc đang đả tọa**; quỹ đã quá 12 giờ
  (`tran_s`) thì chưa cho uống thêm (không mất viên). Tự uống đan (Tự hành) bỏ qua đan này.
- Lúc đả tọa mà còn giờ tọa vong: linh khí mỗi giây = **1,5 lần tốc chém quái** của cảnh giới mình (`toa_vong.k` × `config.meditate.farm_h`), tức gấp 3 lần đả tọa
  thường ở vòng gốc; không tính vòng quỹ đạo, không cộng trà / đêm / mưa. Theo số đo `farm_h` đang dùng: Luyện Khí 2 336 linh khí mỗi giờ, Trúc Cơ 7 395, Kim Đan
  43 470, Nguyên Anh 25 569, Hóa Thần 12 165, Luyện Hư 9 849, Hợp Thể 10 109, Đại Thừa 11 289, Độ Kiếp 9 815.
- Hiệu ứng hấp thu linh khí: dòng đốm lam xoắn từ bốn phía vào người, vòng sáng co về đan điền, linh khí bốc lên đỉnh đầu; người khác cũng thấy (hồ sơ phòng `st`
  = `tv`, `data/dong-bo.json`).
- Không mua được: không có ở quầy nào; đan phương mua ở Đan Dược Sư như mọi đan (100 000 Linh Thạch, +15%) vẫn mua được vì đó là công thức, không phải viên đan.
- Máy chủ: đan nằm trong `p2d_lo_cfg()` nên lò luyện như mọi đan; linh khí tọa vong nằm trong hạn mức của bộ hãm `p2d_kiem_linh_khi` (hạn mức mỗi giây lớn hơn
  nhiều lần tốc chém quái); khoá mới `toaVong`, `coDuyen` trong bản lưu máy chủ giữ nguyên.
- Code: `src/game/toa-vong.js`, móc ở `src/game/cave.js` (usePill), `src/game/da-toa.js` (medPerSec), `src/game/player.js` (trừ giờ mỗi nhịp đả tọa).

## 5. Tỉ lệ luyện đan (từ 25/11/2026)

Tỉ lệ một mẻ = gốc **80%** + phẩm lò (Phàm +0, Linh +5, Huyền +10, Địa +15, Thiên +20, Tiên +25, Thượng Cổ +30) − **4% × phẩm đan** − 5% cho mỗi bộ thêm trong mẻ
(có đan phương: +15%, mỗi bộ thêm chỉ −1%); sàn 10%, trần 95%. Trước 25/11: gốc 40%, mỗi phẩm đan −5%.

| Đan | Phẩm đan | Trước | Lò Phàm, 1 bộ | Có đan phương |
|---|---|---|---|---|
| Hồi Xuân Đan, Hồi Linh Đan, Linh Ngư Thang | Phàm | 40% | **80%** | 95% |
| Tụ Khí Đan, Vân Ngư Thang | Linh | 35% | **76%** | 91% |
| Bồi Nguyên Đan, Thanh Tâm Đan, Nguyệt Ngư Thang | Huyền | 30% | **72%** | 87% |
| Tử Vân Đan, Thăng Linh Đan | Địa | 25% | **68%** | 83% |
| Tĩnh Liên Đan, Tọa Vong Đan | Thiên | 20% | **64%** | 79% |
| Tẩy Tủy Đan | Tiên | 15% | **60%** | 75% |

Số ở `data/cave.json → lo.base`, `lo.phat_dan`; máy chủ `p2d_lo_cfg()`.

## 6. Máy chủ

Migration `supabase/migrations/20261125030000_p2d_su_do_dan.sql`, sinh bằng `python3 tools/su-do-sql.py` (không sửa tay; `tools/check.mjs` so tệp với máy sinh):
`p2d_lo_cfg()` mới; hai dòng `p2d_tran_ngay`; bảng và năm hàm sư đồ; thay đúng một đoạn trong định nghĩa đang chạy của `p2d_ht_dk`, `p2d_ht_xong`; chèn nhiệm vụ
`su-do` ở bậc 27 (các nhiệm vụ sau lùi một bậc, mốc quà `moc-*` không đụng; tiến độ người chơi ghi theo mã nhiệm vụ nên không ai lệch); tự kiểm tra cuối tệp.
**ĐÃ ÁP 25/11/2026 11:19** (áp trước khi đưa bản máy khách lên; mã băm hàm khớp bản áp tại chỗ, `thu-su-do.mjs --sau` đạt). Không đụng bản lưu của ai.

## 7. Thử

- `node tools/co-duyen.test.mjs` (trong `tools/check.mjs`): tỉ lệ, đan phương không chung nguyên liệu, cơ duyên theo hạt giống / trần ngày, Tọa Vong (giờ, tốc, trần).
- Máy chủ: `node tools/kiem/thu-su-do.mjs` in SQL chạy trong giao dịch ROLLBACK bằng hai tài khoản thử (`--sau`: không kèm migration, chạy sau khi áp). 25/11 chạy
  trên máy chủ thật trước khi áp: migration áp trọn, tự kiểm tra đạt; lưu game đạt; xin / nhận / Chỉ điểm / Hành lễ / hôm sau / rời đúng luật; nhiệm vụ `su-do` chưa
  có quan hệ báo `chua_xong`, có rồi nhận được, nhận lại báo `da_nhan`; luyện hai bộ ra đúng Tọa Vong Đan (tỉ lệ máy chủ tính 59% = 80 − 16 − 5); bản lưu có
  `toaVong`, `coDuyen` giữ nguyên; gửi 50 nguyên liệu cơ duyên máy chủ chỉ giữ 7 và 3, không cắm cờ; khách không gọi được, bảng kín.
- Trình duyệt (chơi khách): trái kết trên cây, hái được, linh thảo, uống đan (3 giờ 42 phút), đả tọa 4 giây được đúng 1,5 lần tốc chém quái, bảng Sư đồ, hệ số
  1,1 / 1,05: 0 lỗi JavaScript. Bài hai máy 47/47.

## 8. Chờ chủ dự án

1. (Xong 25/11 11:19: chủ dự án "Áp"; đẩy, gộp theo lời "Áp, đẩy, gộp, đưa lên".)
2. **Thể chất**: chọn tên trong danh sách đã gửi (12 thể chất, hai mỗi bậc Phàm → Tiên; chênh tổng sức mạnh +3% → +20%), rồi mới làm ô Thể chất cạnh Huyết mạch.
3. **Đào khoáng**: làm sau, bản nhỏ (mạch khoáng trên tinh cầu farm ra Tinh Thiết, đá ngọc).
4. Hình riêng cho Chu Quả, Thất Diệp Linh Chi, Tọa Vong Đan (đang đổi sắc từ hình có sẵn) nếu chủ dự án muốn: gửi ảnh GPT.
