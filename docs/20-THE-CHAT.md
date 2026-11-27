# Thể chất (thể phách), huyết mạch thức tỉnh ở Trúc Cơ

Chủ dự án 25/11/2026 10:08, 12:53 – 12:55 (làm trên nhánh `the-chat`, máy tạm). Lời gốc và quyết định ghi ở `CLAUDE.md`.
Phần này nói thiết kế, số đang dùng, chỗ code, cách thử, việc còn chờ chủ dự án.

## 1. Lời chủ dự án

- 10:08: "Thể chất thì gần giống huyết mạch, nên thêm 1 mục thể chất ngay bên cạnh ô huyết mạch trong mục huyết mạch, mỗi thể chất có đặc điểm riêng và có các loại
  thể chất từ yếu tới mạnh, nhưng từ phàm tới tiên, chỉ số được buff tổng thể không chênh lệch nhau vượt quá 20%. B kiếm mấy cái tên thể chất hay hay 1 tý."
- 12:53 (sau khi xem danh sách 24 tên): "24 mình chốt hết nha, mình muốn nó cũng ngầu như cách thức tỉnh huyết mạch kia."
- 12:55: "Kết đan mới thức tỉnh thể phách." · "Còn sửa lại huyết mạch thì trúc cơ là thức tỉnh." · "Nguyên anh thì mình chưa nghĩ ra, sau còn hoá thần trở lên, cứ
  làm từ từ." (Nguyên Anh trở lên: CHƯA có gì, chờ chủ dự án.)
- Bảng chọn 12:5x: người Luyện Khí đã có huyết mạch **"Giữ nguyên"**; người đã ở Kim Đan trở lên **"Vào game là làm lễ"**; cách quay **"Một đời một lượt"** với tỉ lệ
  Phàm 40%, Linh 28%, Huyền 17%, Địa 9%, Thiên 4,5%, Tiên 1,5% và lực chiến thêm từ +3% (Phàm) tới +20% (Tiên).
- Bảng chọn khoảng 16:1x (sau khi xem clip; bản ghi đầu ghi nhầm 14:3x): đưa lên **"Áp, đẩy, gộp, đưa lên"**; cách cộng chỉ số **"Bảng % cố định"** (mỗi thể chất một bảng % cứng). Em đã thử cách
  khác (phẩm cho đúng mức lực chiến, % từng chỉ số dò theo đồ đang mặc để Tiên phẩm luôn đúng +20%) và hỏi; chủ dự án chọn bảng cố định, biết rằng người chơi thật
  sẽ lệch quanh mức của phẩm tuỳ đồ (mục 2). Không làm lại cách dò khi chưa hỏi.

## 2. Luật

- **Thức tỉnh ở Kim Đan** (`data/the-chat.json → mo` = 2, tính theo cảnh giới cao nhất từng đạt: ma bị diệt tụt cảnh giới vẫn giữ). Kết Đan xong, lúc màn hình yên đủ
  `le.yen_s` 4 giây (không thoại, không bảng, không độ kiếp, không quái đang đuổi) thì Hệ Thống báo và lễ tự mở. Người đã ở Kim Đan trở lên từ trước: vào game là
  làm lễ, y như vậy. Huyết mạch chưa thức tỉnh thì lễ huyết mạch đi trước.
- **Lễ chờ người chơi có mặt** (sửa 25/11/2026 17:0x, `src/game/co-mat.js`): lễ chỉ tự mở khi vừa có một cú chạm / phím thật trong `le.co_mat_s` 15 giây.
  Lễ mở bằng một câu thoại, mà hộp thoại mở thì cả game đứng chờ; bản đầu (16:44) mở lễ cả lúc không ai ngồi đó: người đang treo Tự đánh / đả toạ được
  trang tự tải lại (bản mới) rồi tự vào game là đứng hình ở câu thoại tới khi quay lại (6 / 22 người đầu tiên). Tự vào lại game và các nút game tự bấm
  hộ không tính là chạm (`isTrusted`). Lễ huyết mạch (`data/tiem-nang.json → le.co_mat_s`) theo cùng luật. Kết quả đã quay ở máy chủ thì giữ nguyên:
  người chơi chạm màn là lễ chạy, ra đúng thể chất đó.
- **Một đời một lượt.** Quay phẩm theo tỉ lệ, rồi một trong 4 thể chất của phẩm đó (đều nhau). Không có quay lại, không có vật phẩm đổi thể chất.
- **Bản lưu chỉ giữ MÃ** (`save.theChat`). Chỉ số của thể chất lấy từ `data/the-chat.json → the.<mã>.chi_so`, cộng thẳng % vào chỉ số của luật chiến đấu, ngoài trần
  dòng, như Tiềm năng (`src/game/he-chien.js` playerStatsHC, `ext.the`). Sửa bản lưu không lấy được số nào.
- **Không chênh quá 20%.** Mỗi phẩm có một mức lực chiến thêm (`pham.*.luc`); 4 thể chất cùng phẩm khác hướng nhưng ngang sức. Mức thêm đo trên tu sĩ chuẩn ở tám cảnh
  giới (`do.canh_gioi`), lấy mức CAO NHẤT làm mức của thể chất, nên Tiên phẩm không thêm quá 20% lực chiến ở bất cứ cảnh giới nào; Tiên hơn Phàm khoảng 17%.
  Trần từng chỉ số (`tran`): hồi chiêu 8%, hút máu 12%, phản đòn 14%, tỉ lệ bạo 12%, sát thương bạo 60%, công 30%, máu 48%, thủ 70%.
- **Mức của phẩm là đo trên tu sĩ chuẩn, người thật lệch quanh đó.** Cùng một bảng %, người đã dồn nhiều dòng % sẵn thì thêm ít, người ít dòng thì thêm nhiều. Đo
  25/11/2026 trên bản lưu mẫu Kim Đan đủ đồ (`tools/luc-chien-mau.mjs`, lực chiến 52.000): Phàm 2,1–3,9%, Linh 4,4–8,0%, Huyền 7,0–10,8%, Địa 10,3–15,1%, Thiên
  12,8–20,4%, Tiên 15,2–21,1%; có thể chất phẩm thấp hơn thể chất phẩm cao hơn (Bất Diệt Kim Thân 15,1% so với Cửu Dương Thánh Thể 12,8%). Nhân vật không mặc đồ thì
  Tiên phẩm tới khoảng 26%. Người chơi Kim Đan thật (25/11: lực chiến 53.000–129.000, giữa 72.000) ngang hoặc hơn tu sĩ chuẩn (52.000–58.000) và dồn nhiều dòng
  % hơn; ước tính (chưa đo từng người): thể chất thiên về Công, Sinh lực thêm ít hơn mức của phẩm, thể chất thiên về Hút máu, Phản đòn có thể thêm nhiều hơn.
  Chủ dự án đã biết và chọn giữ bảng cố định (mục 1).
- **Số do máy cân, không gõ tay**: `node tools/the-chat-can.mjs --ghi` chia điểm theo `huong` của từng thể chất (đổi ra % bằng tỷ giá `data/tiem-nang.json → quy`),
  dò tới khi lực chiến thêm sát mức của phẩm mà không vượt, rồi ghi `chi_so`. Đổi `huong`, `tran`, `pham.*.luc` hay luật chiến đấu thì chạy lại (bài thử báo đỏ nếu quên).

| Phẩm | Tỉ lệ | Lực chiến thêm (trên tu sĩ chuẩn) | Màu |
|---|---|---|---|
| Phàm phẩm | 40% | +3% | `#5fd07a` |
| Linh phẩm | 28% | +6% | `#5ab8f0` |
| Huyền phẩm | 17% | +9% | `#b070ff` |
| Địa phẩm | 9% | +13% | `#ff9a3a` |
| Thiên phẩm | 4,5% | +16,5% | `#ffe45a` |
| Tiên phẩm | 1,5% | +20% | `#ff4a4a` |

## 3. 24 thể chất

| Phẩm | Thể chất | Đặc điểm | Trời cho |
|---|---|---|---|
| Phàm phẩm | **Phàm Thai Tục Cốt** 凡 (`pham-thai`) | Đều mọi mặt | Công +2,2%, Sinh lực +4%, Thủ +7,5% |
| Phàm phẩm | **Mộc Linh Chi Thể** 木 (`moc-linh`) | Dai sức, thiên về Sinh lực | Sinh lực +8,8%, Thủ +3,6%, Công +1% |
| Phàm phẩm | **Thạch Phu Chi Thể** 石 (`thach-phu`) | Da đá, thiên về Thủ | Thủ +14,8%, Sinh lực +3,4% |
| Phàm phẩm | **Thanh Phong Khinh Thể** 風 (`thanh-phong`) | Thân nhẹ, thiên về Hồi chiêu | Hồi chiêu +3,4%, Công +4% |
| Linh phẩm | **Thiết Cốt Đồng Bì** 鐵 (`thiet-cot`) | Xương sắt da đồng, thiên về Thủ | Thủ +29,4%, Sinh lực +8,4% |
| Linh phẩm | **Phong Lôi Linh Thể** 雷 (`phong-loi`) | Nhanh như gió sấm, thiên về Hồi chiêu | Hồi chiêu +5,7%, Công +5,3%, Bạo kích +2% |
| Linh phẩm | **Bích Thủy Nhu Thể** 水 (`bich-thuy`) | Mềm như nước, thiên về Sinh lực | Sinh lực +19,4%, Công +3,4% |
| Linh phẩm | **Xích Hỏa Linh Thể** 火 (`xich-hoa`) | Máu nóng, thiên về Công | Công +11,6%, Bạo kích +1,7% |
| Huyền phẩm | **Huyền Âm Hàn Thể** 陰 (`huyen-am`) | Thân lạnh, thiên về Hút máu | Hút máu +11,6%, Công +6,2%, Sinh lực +9,8% |
| Huyền phẩm | **Liệt Dương Chiến Thể** 陽 (`liet-duong`) | Thân lửa, thiên về Công | Công +16%, ST bạo +29,2% |
| Huyền phẩm | **Lưu Ly Ngọc Cốt** 玉 (`luu-ly-ngoc-cot`) | Xương ngọc, Thủ và Sinh lực | Thủ +35,5%, Sinh lực +18,8% |
| Huyền phẩm | **Bách Độc Bất Xâm Thể** 毒 (`bach-doc`) | Trăm độc không xâm, thiên về Phản đòn | Phản đòn +11,4%, Sinh lực +11,2%, Thủ +17,6% |
| Địa phẩm | **Bất Diệt Kim Thân** 金 (`bat-diet-kim-than`) | Thân vàng, Sinh lực và Thủ | Sinh lực +27,9%, Thủ +42,2%, Phản đòn +3,8% |
| Địa phẩm | **Thiên Sinh Kiếm Cốt** 劍 (`kiem-cot`) | Xương kiếm trời sinh, thiên về Bạo kích | Bạo kích +7,7%, ST bạo +39,2%, Công +8,5% |
| Địa phẩm | **Hậu Đức Tải Vật Thể** 土 (`hau-duc`) | Vững như đất, thiên về Sinh lực | Sinh lực +46,9%, Thủ +22,2% |
| Địa phẩm | **Tử Lôi Bá Thể** 霆 (`tu-loi`) | Sấm tím, Công và Hồi chiêu | Công +24,2%, Hồi chiêu +8% |
| Thiên phẩm | **Thái Âm Linh Thể** 月 (`thai-am`) | Thân trăng, Hút máu và Hồi chiêu | Hút máu +12%, Hồi chiêu +8%, Công +22% |
| Thiên phẩm | **Cửu Dương Thánh Thể** 日 (`cuu-duong`) | Chín mặt trời, Công và ST bạo | Công +28,3%, ST bạo +60% |
| Thiên phẩm | **Tinh Thần Chiến Thể** 星 (`tinh-than`) | Thân sao trời, Bạo kích và Công | Bạo kích +8,9%, Công +16,7%, ST bạo +30,6% |
| Thiên phẩm | **Vô Cấu Lưu Ly Thể** 璃 (`vo-cau`) | Không vết bụi, Thủ và Phản đòn | Thủ +60,3%, Phản đòn +14%, Sinh lực +14,2% |
| Tiên phẩm | **Hỗn Độn Đạo Thể** 混 (`hon-don`) | Đủ mọi mặt | Công +8,6%, Sinh lực +13,1%, Thủ +21,7%, Bạo kích +3,1%, ST bạo +28,5%, Hồi chiêu +4,3%, Hút máu +4,8%, Phản đòn +5% |
| Tiên phẩm | **Vạn Kiếp Bất Diệt Thể** 劫 (`van-kiep`) | Vạn kiếp không mòn, Sinh lực và Phản đòn | Sinh lực +41,8%, Phản đòn +14%, Thủ +44% |
| Tiên phẩm | **Tiên Thiên Đạo Thai** 道 (`dao-thai`) | Thai đạo trời sinh, Công và Hồi chiêu | Công +25,1%, Hồi chiêu +8%, Bạo kích +8,5% |
| Tiên phẩm | **Thái Sơ Thần Thể** 初 (`thai-so`) | Thân thuở ban sơ, Công và Sinh lực | Công +23,3%, Sinh lực +44,4% |

## 4. Lễ thức tỉnh và bảng

- Lễ (`src/game/le-the.js` điều phối, `src/ui/le-the.js` + `.css` màn lễ, chữ và nhịp ở `data/the-chat.json → le`). **Làm lại 26/11/2026** (chủ dự án 13:4x: "hiệu
  ứng nhận thể phách cũng hoành tráng hơn, tắt các ô hiện phẩm cấp khi đang thức tỉnh thể phách để người chơi đỡ so sánh"): **không còn tháp sáu bậc phẩm**, không
  dòng "Không phá nổi", không ô ghi tên phẩm nào trên màn lễ; ai cũng diễn MỘT màn như nhau, chỉ khác màu của thể chất lúc ấn nở. Phẩm vẫn xem được ở Túi đồ →
  Huyết mạch (ô Thể chất). Trình tự: Hệ Thống báo một câu, màn tối lại; Kim Đan dưới chân soi lên, linh khí bốn phương xoáy về (canvas phủ màn), **chín khiếu** trên
  thân ảnh lần lượt sáng từ dưới lên (`huyet` 9, `huyet_s` 0,3 giây, khiếu sau lâu hơn một chút), cột đan hoả dâng theo, hai vành ấn xoay ngược chiều lớn dần quanh
  đan; đủ chín khiếu thì `xung` 3 nhịp xung (màn rung, vành nảy) rồi cả màn chớp sáng; **ấn chữ Hán** của thể chất nở ra giữa vầng tia xoay, đốm sáng bung ra rồi rơi
  như mưa suốt lúc xem kết quả; hiện tên, đặc điểm, lai lịch, các chỉ số trời cho, dòng "một đời chỉ thức tỉnh một lần" và nút **Nhận thể chất**. Lúc đang soi màu
  là `mau_soi` (vàng đan hoả) cho mọi người, màu của thể chất chỉ lộ khi ấn nở. Xong lễ: chữ lớn giữa màn hình + Hệ Thống nói một câu. Chạm màn hình để đi nhanh;
  đang treo máy (pilot / tự động) thì tự nhận sau `le.tu_dong_s`. Bài thử `tools/kiem/the-chat.thu.mjs` chặn màn lễ hiện lại ô phẩm (tháp bậc, tên phẩm).
- Kết quả ghi vào bản lưu TRƯỚC khi mở màn lễ: thoát giữa lễ không quay lại được lượt khác.
- Bảng: Túi đồ → **Huyết mạch** (`src/ui/tiem-nang-view.js`, `tiem-nang.css`): trên cùng hai ô **Huyết mạch | Thể chất** cạnh nhau (ấn chữ Hán, tên, độ hiếm / phẩm;
  chưa thức tỉnh thì ô mờ, dấu "?", ghi "Trúc Cơ sẽ thức tỉnh" / "Kết Đan sẽ thức tỉnh"). Chạm ô nào xem ô đó: thể chất hiện đặc điểm, lai lịch, các chỉ số trời cho.

## 5. Huyết mạch thức tỉnh ở Trúc Cơ

- `data/tiem-nang.json → le.mo` = 1: người CHƯA có huyết mạch phải đột phá Trúc Cơ thì Cây Thế Giới mới gọi tên (lễ tự mở lúc màn hình yên, Hệ Thống đứng lễ). Lệnh
  truyện `le_toc` sau lễ linh căn ở Thanh Khê vẫn còn trong `data/story.json` nhưng với người Luyện Khí thì bỏ qua (không thoại, không lễ).
- Người đã có huyết mạch (kể cả đang Luyện Khí): **giữ nguyên**, không mất, không quay lại (25/11/2026 12:55: 1.165 nhân vật Luyện Khí đã có huyết mạch).
- Điểm tiềm năng không đổi: 5 điểm mỗi đại cảnh giới, tính từ cảnh giới đang ở, nên thức tỉnh ở Trúc Cơ là có ngay 5 điểm đầu.
- Chỉ đổi máy khách (`src/game/le-toc.js` tocMo). Máy chủ không đổi: trigger `p2d_kiem_tiem_kn` chỉ làm việc khi bản lưu có `tiem.toc`, hàm `p2d_quay_toc()` không
  xét cảnh giới (một người sửa máy khách để quay sớm ở Luyện Khí chỉ được đúng một lượt như mọi người, máy chủ vẫn là bên quay).

## 6. Máy chủ (migration `20261125060000_p2d_the_chat.sql`, sinh bằng `python3 tools/the-chat-sql.py`)

- Bảng `p2d_ky_cfg` dòng `tc`: cảnh giới mở, tỉ lệ từng phẩm, mã thể chất → phẩm (dựng từ data, `tools/ky-cfg.mjs tc`; `tools/check.mjs` so với data).
- Bảng `p2d_the_chat (user_id, ma, luc)`: mỗi người một dòng, máy khách chỉ đọc được dòng của mình, không ghi được.
- `p2d_quay_the_chat()`: máy khách gọi lúc làm lễ (`src/net/the-chat.js`). Chưa đủ cảnh giới (cao nhất từng đạt, `canh_max`) thì lỗi `chua_du_canh_gioi`; đã có dòng thì
  trả lại đúng dòng đó; chưa có thì quay rồi ghi.
- Trigger `p2d_kiem_the_chat` lúc lưu (chỉ chạy khi `data.theChat` đổi): `data.theChat` luôn theo `p2d_the_chat`. Chưa có dòng mà bản lưu mang mã: đủ cảnh giới thì máy
  chủ quay luôn (bản lưu chơi khách đem lên), chưa đủ thì gỡ. Khác thì đè lại và trả về máy khách (`p2d.sua` → `the`, `src/game/cloud-guard.js` nhận). Gửi mã khác mã
  máy chủ đang giữ, hoặc gửi mã khi chưa đủ cảnh giới: ghi nghi vấn `the_chat` (tối đa một dòng mỗi 10 phút).
- `p2d_xem_nguoi` (Hồ sơ người chơi) trả thêm `theChat` để chỉ số trong Hồ sơ đúng như của họ.
  Từ 25/11/2026 23:50 Hồ sơ đạo hữu còn hiện dòng "Huyết mạch: <tộc>" và "Thể chất: <tên> · <phẩm>" (`src/ui/profile-side.js`, chữ ở `data/duel.json → profile`).
- Có tài khoản thì CHỈ máy chủ quay: máy khách gửi bản lưu lên trước (để máy chủ thấy cảnh giới mới) rồi gọi hàm; máy chủ chưa trả lời thì hoãn lễ `le.thu_lai_s` 60 giây
  rồi thử lại, không quay tạm tại máy (quay tạm rồi máy chủ đổi kết quả thì người chơi thấy lễ ra một thể chất mà nhận một thể chất khác). Chơi khách: quay tại máy.
- **Lực chiến do máy chủ tính** (`supabase/functions/luc-chien`): thêm `the-chat` vào danh sách data, gói lại `game.js` (mã băm `79ca62417bc752a9`). Sau khi game lên phải đưa hàm lên lại Supabase;
  trước lúc đó máy chủ tính lực chiến chưa có thể chất (thấp hơn tối đa 20%, không ghi nghi vấn, tự đúng lại sau khi đưa hàm lên và người chơi lưu lần kế).

## 7. Chỗ code

- Số, chữ: `data/the-chat.json` (phẩm, 24 thể chất, trần, lễ, chữ bảng). Cân: `tools/the-chat-can.mjs`.
- Luật: `src/game/the-chat.js` (quay, kẹp, % cộng); nối vào `src/game/stats.js` (`ext.the`) → `src/game/he-chien.js` playerStatsHC.
- Lễ: `src/game/le-the.js`, `src/ui/le-the.js`, `src/ui/le-the.css`. Bảng: `src/ui/tiem-nang-view.js`, `src/ui/tiem-nang.css`.
- Mạng, lưu: `src/net/the-chat.js`; `src/game/cloud-guard.js` (máy chủ sửa `the`), `src/net/save-diff.js` (FIX_KEYS), `src/game/profile.js` (Hồ sơ).
- Huyết mạch ở Trúc Cơ: `data/tiem-nang.json → le.mo`, `src/game/le-toc.js`.

## 8. Thử

- `node tools/the-chat.test.mjs` (trong `tools/check.mjs`): 24 thể chất / 6 phẩm, tỉ lệ cộng 100, `chi_so` đúng bản cân, mỗi thể chất sát mức của phẩm và không vượt,
  mạnh nhất hơn yếu nhất ≤ 20% và hơn người chưa có ≤ 20% ở 8 cảnh giới (trên tu sĩ chuẩn), phẩm cao không bao giờ yếu hơn phẩm thấp, quay 40.000 lượt đúng tỉ lệ,
  cảnh giới mở, bản lưu sửa tay, lễ (có tài khoản chỉ máy chủ quay và gửi bản lưu trước, lỗi thì hoãn; chơi khách quay tại máy).
- Máy chủ: `node tools/kiem/thu-the-chat.mjs` in câu SQL chạy thử trên máy chủ thật trong một giao dịch rồi ROLLBACK (tài khoản thử `claude_thu_a`, `claude_thu_b`);
  `--sau` là bản chạy sau khi đã áp migration.
- Trình duyệt (CI): `cd _site && node ../tools/kiem/the-chat.thu.mjs`: Kim Đan tự mở lễ, ghi bản lưu, chỉ số tăng đúng data, lễ không mở lại, hai ô trong mục Huyết
  mạch; Luyện Khí không lễ nào mở; lên Trúc Cơ thì lễ huyết mạch mở. Ép kết quả khi chơi khách: `game.theEp = '<mã>'` (có tài khoản thì không có tác dụng).

## 9. Còn chờ chủ dự án

- Nguyên Anh, Hóa Thần trở lên thức tỉnh gì: chủ dự án "chưa nghĩ ra… cứ làm từ từ".
- Đổi thể chất (nghi lễ, vật phẩm): chưa có, chưa ai yêu cầu.
