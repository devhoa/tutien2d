# Nguyên Anh: kiếp Kết Anh, phẩm Nguyên Anh, xuất khiếu, thân hủy Anh còn

Chủ dự án 27/11/2026 00:1x – 01:28 (làm trên máy tạm, nhánh `nguyen-anh`, CHƯA đẩy lên GitHub). Lời gốc và quyết định ghi ở `CLAUDE.md`.
Phần này nói thiết kế, số đang dùng, chỗ code, cách thử, việc còn chờ chủ dự án.

## 1. Lời chủ dự án

- Bảng chọn: Nguyên Anh xuất khiếu, "nếu nguyên anh cũng giống y như bản thân, bản thân như nào nguyên anh như vậy, chỉ khác là màu vàng"; Ý cảnh (Hóa
  Thần) "Bàn sau"; "Làm thử + clip".
- 01:09: "khi bị đánh chết thì sẽ hoá thành nguyên anh, sau đó k nhận sát thương và có thể chạy ra chỗ khác để tái tạo lại cơ thể. K tính là bị giết, khi
  hoá thành nguyên anh sẽ ở dạng trong suốt, tốc chạy ngang vs tốc bay"; "khi kết anh thì sét đánh nhiều gấp đôi kết đan, tụ linh cũng nhiều màu và nhiều
  vòng, mọi hiệu ứng đề hơn kết đan, và mọi ng đều có thể thấy linh khí đang bay về hướng người độ kiếp"; "time độ kiếp nguyên anh lâu gấp 3 lần kết đan".
- Bảng chọn sau đó: PvP "Sau khi hoá thành nguyên anh để trốn trong 30s hồi phục cơ thể hoặc có hút hồi ngay mà lại bị giết tiếp thì lúc này mới tính là
  bị chết"; tái tạo "Bấm nút Tái tạo"; độ đau "Đau như Kết Đan".
- 01:16: "nguyên anh sẽ có các bậc phàm tới tiên giống thể phách, khác 1 điều đó là thể phách càng sịn thì nguyên anh càng đểu và ngược lại".
- 01:21: "kết anh thì nguyên anh sẽ nằm chung mục với thể phách và huyết mạch" (nếu cần hình thì ảnh GPT + chuyển động SpriteCook; hiện vẽ bằng code, 0 credit).
- 01:28: "vẽ thử xem như nào … 1 clip đột phá kết anh / 1 clip kết anh bị hạ và chạy trốn / 1 clip thì thức tỉnh phẩm kết anh, cái thức tỉnh phẩm kết anh
  sau độ kiếp hiệu ứng phải đỉnh hơn cả thể phách và huyết mạch, âm thanh cũng thế".

## 2. Luật

1. **Kiếp Kết Anh** (Kim Đan tầng 9 → Nguyên Anh): nghi lễ kết đan (`src/game/ket-dan.js`) với bảng `data/config.json → ket_anh` ghi đè lên `ket_dan`
   (khoá nào không ghi thì như Kết Đan; áp cho nghi lễ từ `tu_dao` 18 đạo trở lên, máy người xem biết qua số đạo trong tin `kd-bd`). 18 đạo (Kết Đan 9),
   `data/realms.json → tribulation.by_realm[2]` dmg_mul 7 như Kết Đan (mỗi đạo đau như Kết Đan); mọi nhịp × 3 trừ khoảng giữa hai đạo × 1,5 và ba quãng
   lặng × 1,5: cả nghi lễ 145,5 giây (Kết Đan 49,4). Sáu vòng khói, năm dải màu linh khí (`pals`), sét nhiều hơn, sóng rộng hơn, cột sáng to hơn.
2. **Dòng linh khí cả tinh cầu thấy** (`src/render/draw-ka-khi.js`, `ket_anh.khi_xa`): 7 dải xoắn ốc chảy về người độ kiếp, mỗi dải một màu, kể cả khi
   người đó ngoài màn. Không gửi tin nào thêm: mỗi máy tự vẽ từ nghi lễ đang diễn; tối đa 150 hạt, máy yếu một nửa, chỉ vẽ phần trong màn.
3. **Phẩm Nguyên Anh** = 5 − phẩm thể chất (`naPham`), cùng tên, màu với phẩm thể chất; chưa bật Thể chất thì Huyền. Không quay, không đổi được.
4. **Lễ Kết Anh** (`src/game/le-anh.js`): ai đã tới Nguyên Anh mà chưa qua lễ, lúc màn yên thì Hệ Thống báo, rồi **màn thức tỉnh phẩm cả màn**
   (`src/ui/le-anh.js`, mục 3), rồi trên bản đồ Nguyên Anh bay ra khỏi thân, lơ lửng, về đan điền (người cùng tinh cầu thấy cảnh bản đồ qua `na-le`).
   Ghi cờ `na-thuc`. Huyết mạch, thể chất chưa thức tỉnh thì chờ hai lễ đó trước. **Vừa qua kiếp Kết Anh** thì lễ diễn ngay, trước bảng chúc mừng
   đột phá (chủ dự án 27/11/2026 03:0x: "thức tỉnh nguyên anh trước, sau đó mới chúc mừng"; 04:38 áp luôn cho huyết mạch lên Trúc Cơ và thể phách lên
   Kim Đan: `src/game/le-truoc.js`, gọi từ `tribulation.js` ascend).
5. **Xuất khiếu** (`src/game/nguyen-anh.js`): lâm trận (nhát trúng quái) thì một Nguyên Anh y hệt mình bằng vàng rời thân `ra_s` giây, đứng phía bên kia con
   mồi, mỗi nhát chém thường của mình nó chém theo một nhát `k` × sát thương nhát đó; về đan điền rồi nghỉ `hoi` giây. Người khác thấy qua `na-ra`.
6. **Thân hủy, Anh còn** (`src/game/anh-the.js`): lần gục đầu tiên (mọi nguồn) hoá Nguyên Anh vàng trong suốt: không nhận sát thương, chạy bằng tốc bay,
   không đánh, không mất gì, người hạ không được gì. Nút **Tái tạo** (`src/ui/anh-btn.js`) bấm được sau 2 giây; 30 giây tự tái tạo (đang Tự đánh / Tự hành
   thì 3 giây). Tái tạo: đầy máu, miễn đòn 1 giây. Hồi lại sau 5 phút; trong 5 phút đó gục là gục như cũ. Không áp lúc độ kiếp, so tài, thiên phạt.
7. **PvP**: máy chủ phòng làm trọng tài (`cloud/src/pvp.js` naSan / hoaAnh / pvpAnh / pvpTaiTao, `data/pvp.json → server.na`): đòn chí mạng vào người có
   cảnh giới tin cậy ≥ 27 (Nguyên Anh tầng 1) mà lá chắn sẵn sàng thì gửi `pa` (hoá Nguyên Anh) thay vì hạ; không cần đổi cơ sở dữ liệu.
8. **Ô Nguyên Anh** trong mục Tiềm năng (bảng Nhân vật), cạnh Huyết mạch và Thể chất (`src/ui/tiem-anh.js`): ấn 嬰, phẩm, phần sát thương; chi tiết vẽ
   Nguyên Anh vàng của chính mình bằng code, lời Hệ Thống, công dụng, dòng nghịch phẩm.

9. **Lên Hóa Thần TẠM KHOÁ** (04:38: "tạm thời hoá thần chưa cho gamer đột phá, ấn cái là 100 tia cùng dí xuống thất bại ngay lập tức, để mình thiết kế
   hiệu ứng xong đã rồi mới cho đột phá"): `data/realms.json → tribulation.by_realm[3].khoa`. Bấm Độ thiên kiếp ở Nguyên Anh tầng 9: 100 đạo sét dồn xuống
   người trong 0,8 giây rồi thất bại, báo "Thiên đạo chưa mở đường Hóa Thần…". Không trừ máu, không mất linh khí (AI chọn: cửa còn đóng không phải lỗi
   của người chơi); Hệ Thống thôi giục độ kiếp ở mốc này. Mở lại: xoá khối `khoa`.

## 3. Màn thức tỉnh phẩm (`src/ui/le-anh.js`, `le-anh.css`, số ở `data/nguyen-anh.json → le.man`)

Màn tối hẳn, kim đan giữa màn đập như tim nhanh dần (7 nhịp), linh khí xoáy vào, vòng phù văn mờ sáng dần → 6 vết rạn, ánh màu phẩm rỉ thành tia →
hít vào (đan co) → **vỡ** lúc 4,15 giây: loé trắng cả màn, 3–4 vòng sóng, mảnh vỏ vàng văng, màn rung → Nguyên Anh vàng y hệt mình (đúng hàm vẽ nhân vật,
`veVang`) mọc lên trên đài sen sáng, vầng tia xoay (màu phẩm + tia vàng mảnh ngược chiều, phẩm cao thêm lớp), vòng phù văn chữ cổ (Huyền phẩm trở lên
hai vòng, Thiên trở lên thêm vòng gạch), hạt vàng bốc lên, cánh sáng rơi → ấn 元嬰 đóng xuống, "Nguyên Anh · <phẩm>" hiện từng chữ, lời Hệ Thống về thể
phách và Nguyên Anh, hai dòng công dụng, nút Nhận. Chạm trước lúc vỡ: chạy nhanh tới lúc vỡ. Tự hành / Tự đánh tự nhận sau 2,5 giây.
Tiếng riêng (`tools/sfx_chieu.py`, mục "Màn thức tỉnh phẩm Nguyên Anh"): `na.u` ù đêm, `na.tim` tim đập, `na.nut` rạn, `na.bung` vỡ (−13 dB, to như tuyệt
kỹ), `na.hien` đóng ấn + hợp xướng năm cung + mộc cầm đi lên, `na.chu` từng dòng, `na.nhan`. Không chuông cao, không pha lê. Dựng sẵn trong lúc đọc lời Hệ
Thống (`sfxWarm`).

## 4. Số (`data/nguyen-anh.json → pham`)

| Phẩm | k (× nhát chém, tầng 9) | ra_s | hoi | Ước thêm cho đánh thường khi đánh liên tục (k × ra_s / (ra_s + hoi)) |
|---|---|---|---|---|
| Phàm | 0,25 | 10 | 45 | ~5% |
| Linh | 0,45 | 11 | 42 | ~9% |
| Huyền | 0,6 | 12 | 39 | ~14% |
| Địa | 0,75 | 13 | 36 | ~20% |
| Thiên | 0,85 | 14 | 33 | ~25% |
| Tiên | 0,9 | 16 | 30 | ~31% |

k nhân hệ số tầng 0,8 (Nguyên Anh tầng 1) → 1,0 (tầng 9 và cảnh giới sau). Chỉ tính đánh thường (không tính kỹ năng, pháp bảo). Ghép với thể chất (Phàm
~3%, Tiên ~20% lực chiến): thể chất yếu được Nguyên Anh mạnh bù, đúng lời 01:16; tổng hai bên gần nhau khi đánh thường chiếm khoảng nửa sát thương.
Chưa đo trong trận thật; đo lại quái Nguyên Anh khi chủ dự án chốt số.

## 5. Thử

- `node tools/nguyen-anh.test.mjs` (trong `tools/check.mjs`): phẩm ngược thể chất, mức tầng, kiếp Kết Anh 18 đạo và dài gấp 3 (145,5 / 49,4 giây), nhịp
  màn thức tỉnh, tiếng có thật, bản dịch en / zh-Hant.
- `node tools/hai-may.mjs` mục 4c: A hoá Nguyên Anh thì máy B thấy dạng Nguyên Anh, Tái tạo thì về thân thường (50/50 đạt 27/11/2026).
- `node tools/cloud/pvp.test.mjs`: khối Nguyên Anh (lá chắn, tái tạo, lần hai là gục, cảnh giới thấp không có).
- Quay: `CANH=2 BAT_TU=1 node tools/do-don/quay-ket-dan.mjs <ra> <tên> 152` (kiếp Kết Anh; `XEM=1` máy người xem; BAT_TU giữ máu ≥ 30%).

## 6. Còn chờ chủ dự án

- Xem 3 clip, chốt số phẩm (bảng mục 4), chốt đẩy lên (một PR) — CHƯA đẩy.
- Ảnh GPT + chuyển động SpriteCook cho Nguyên Anh nếu muốn thay bản vẽ bằng code (khoảng 20 credit một chuyển động; hỏi trước khi chi).
- Ý cảnh (Hóa Thần): bàn sau.
