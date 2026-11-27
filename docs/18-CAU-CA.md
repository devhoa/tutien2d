# Câu cá: thả câu, giằng co, Lão Ngư Ông

Chủ dự án 24/11/2026 00:38 – 01:2x (làm trên nhánh `cau-ca-moi`, máy tạm). Lời gốc và quyết định ghi ở `CLAUDE.md`.
Phần này nói thiết kế, số đang dùng, chỗ code, cách thử, việc còn chờ chủ dự án.

## 1. Lời chủ dự án

- 00:38: "Giúp tôi thiết kế lại hệ thống câu cá đi. Khi câu lên thì sẽ thực sự có cá bay lên và sau khi nhận sẽ hiện bảng quà nhận cá gì, nếu k ấn đóng thì nó vẫn ở
  trên màn hình. Cần câu và mồi cũng thêm vào mục cá … Cần câu và mồi sẽ mua ở 1 npc mới, thiết kế thêm nhiều loại cần sịn hơn. Mồi cũng thế. Và cá cũng thế, thiết
  kế thêm nhiều loại cá dị chủng hơn. Nếu k có ảnh thì gửi tui lệnh chat để tôi đi tìm gpt đòi ảnh … tui k muốn làm nó hời hợt mà thực sự có thể chill chill câu cá,
  thêm vài tính năng thú vị càng tốt, ví dụ như thêm một loại đồ chế biến bằng cá mới mà ăn vào sẽ tăng khá nhiều linh khí chẳng hạn" (một idol TikTok đề nghị).
- Bảng chọn lần 1: giá cần, mồi "Như đề xuất" (cần 10 nghìn → 10 triệu, mồi 5 → 1 500 mỗi con); món ăn "Linh khí theo số chứ k theo % hoặc là câu cá để bán ra linh
  thạch để ng chơi kiếm thêm linh thạch"; Mua nhanh "Thôi bán cá".
- 01:17: "Cậu chưa hỏi về các chủng loài câu được mà, k chỉ có mỗi cá nha". Bảng chọn lần 2: loài câu được "Cả 4" (tôm cua ốc sứa mực; trai sò có ngọc; bảo vật chìm,
  đồ cũ; thủy thú con thành linh thú: phần này cần SpriteCook nên hỏi riêng kèm credit); món ăn "Cả linh thạch và cả ăn, linh khí tầm 1000 đến 20k, có giới hạn độc
  đan"; tốc Linh Thạch "Vì đi đâu k tăng linh khí nên bán linh thạch phải nhanh gấp đôi hoặc gấp 3".

## 2. Cách chơi

- Đứng sát **nước thật** (ô `=` không có cầu, bến che: `noiCau` ở `src/game/fishing.js`) hoặc **mép tinh cầu** (tinh hải; trừ tinh cầu đã dựng theo luật thế giới,
  `planet.luat`, hiện là Thiên Kiếm Tinh). Nút hành động là **Thả câu**: cần quăng theo hướng nhiều nước nhất (1,6–2,4 ô), phao nổi.
- Chờ 3–8 giây (`wait` × mồi × cần). Phao **rỉa** 0–2 lần (bấm lúc này chỉ báo "mới rỉa mồi thôi"), rồi **chìm hẳn**, dấu "!" trên đầu: bấm **Kéo** trong 1,3 giây
  (+ cửa sổ của cần). Lỡ thì sổng, mất mồi.
- Mồi chỉ tốn khi loài thật cắn. **Câu trần** (hết mồi) vẫn câu được nhưng chỉ ra tới Linh phẩm, chờ lâu hơn 25%.
- Loài từ **Địa phẩm** phải **giằng co**: kim chạy qua lại trên thanh dưới chân, bấm Kéo khi kim trong vùng sáng, đủ số lần trúng (p − 1) thì lên; trượt quá sức
  chịu của cần thì sổng; quá 9 giây cũng sổng. Loài vượt phẩm cần chịu được (`toi_da`) thì **đứt dây** lúc kéo.
- Lên: con vật **bay khỏi nước theo vòng cung về tay** (vệt sáng từ Linh phẩm, Côn / Long to gấp rưỡi), nước bắn, gợn sóng; loài từ Địa phẩm có lễ nhận quà
  (`game.rewardGive`) như đồ quý.
- **Thẻ nhận** (`src/ui/cau-the.js`) ngay dưới bảng trên: hình, tên, phẩm, cm / kg, huy hiệu (loài mới, kỷ lục, hai con), dải các con vừa câu (con quý nhất ghim
  đầu), số con hôm nay, chip mồi đang móc (chạm mở Cá → Mồi), nút **Tự câu**. Thẻ **ở lại tới khi bấm ✕**.
- **Tự câu**: thả lại sau 0,6–1,4 giây, cá cắn thì kéo sau 0,25–0,6 giây, giằng co kéo trúng với tỉ lệ 55% + 6% × phẩm cần mỗi lần; hết mồi đang chọn thì câu trần.
  Bước đi là tắt. Tự hành làm việc ngày câu cá cũng dùng đường này. Treo máy: đang Tự câu tính là đang chơi.
- Người cùng tinh cầu thấy mình ngồi câu (`st: 'cau'` trong hồ sơ phòng) và con vừa câu bay lên (hiệu ứng `ca`).

## 3. Mục Cá (bảng Nhân vật)

Cột mục thêm **Câu cá** (sau Công pháp), bốn mục ngang như Công pháp / Thân pháp / Kỹ năng:

- **Cá**: Giỏ (lưới loài đang có, khung theo phẩm) / Sổ câu (đủ 60 loài, loài chưa từng câu mờ, chạm xem ở đâu, mồi nào). Chạm một con: cm, kg, kỷ lục, đã câu bao
  nhiêu, giá Lão Ngư Ông thu, nút **Nấu**, **Phóng sinh**. Dòng phúc duyên.
- **Mồi**: chín loại, đang có bao nhiêu, nút Móc mồi này.
- **Cần**: bảy cần, chỉ số từng cần, nút Dùng cần này; chưa có thì ghi mua ở Lão Ngư Ông.
- **Món**: bảy món, nấu từ thủy sản cùng phẩm, ăn ngay ở đây.

Cá, mồi, cần, châu, món không còn nằm trong Kho → Nguyên liệu / Đan.

## 4. Loài: 60 loài, bốn nhóm

| Phẩm | Cá | Tôm cua ốc sứa mực | Trai sò | Bảo vật chìm | Lão Ngư Ông thu (Luyện Khí) |
|---|---|---|---|---|---|
| Phàm | Linh Ngư, Vân Ngư, Ngân Tỳ Ngư, Lục Tảo Ngư | Hà Tôm, Ốc Suối, Cua Đồng | Trai Sông | Giày Rách, Búi Rong Rêu | 45 (giày 5, rong 2) |
| Linh | Hỏa Lý, Băng Ngư, Kim Tu Ngư, Nham Ngư, Vũ Ngư, Kiếm Ngư, Diệp Ngư, Ảnh Ngư, Thanh Khê Lý | Linh Hà, Hỏa Giải, Băng Loa, Lưu Quang Thủy Mẫu | Sò Điệp Linh | Bình Gốm Vỡ | 160 |
| Huyền | Nguyệt Ngư, Đào Hoa Ngư, Hạ Quang Ngư, Phong Ngư, Tuyết Ngư, Song Đầu Ngư, Lưu Ly Ngư, Lôi Ngư, Huỳnh Quang Mạn | Huyết Giải, Mặc Chương Ngư, Kim Giáp Long Hà | Huyền Châu Bạng | Kiếm Gãy Cổ, Bí Kíp Ướt Nhẹp | 700 |
| Địa | Kim Lý, Hỏa Lân Ngư, Băng Phách Ngư, Ma Khí Ngư, Kiếm Văn Lý, Thất Thải Ngư | Thiên Thủy Mẫu | Cổ Bạng | Rương Chìm | 4 000 (rương 12 000) |
| Thiên | Long Tu Lý, Tinh Sa Ngư, Hư Không Lân, Linh Nhật Ngư | Long Hà Vương | Long Bạng | Thủy Cung Ngọc Tỷ | 30 000 (ngọc tỷ 80 000) |
| Tiên | Cửu Vĩ Huyền Lý, Thiên Mạch Ngư | | | | 150 000 |
| Thượng Cổ | Bắc Minh Côn, Thanh Long Ngư | | | | 600 000 (không quá trần ngày) |

Mỗi loài có điều kiện riêng trong `data/fishing.json → fish` (tinh cầu `maps`, sông hồ hay mép `noi`, ban đêm, khi mưa, mùa, nhóm mồi hút `tag`, mồi riêng `moi`:
Thượng Cổ chỉ cắn Long Tiên Hương). Ba loài đầu game (Vân Ngư, …) giữ mã cũ để bản lưu, việc ngày, đạo lữ, Bể cá, Nhật ký vẫn chạy. Bể cá chỉ thả cá và tôm cua.

Tỉ lệ (`src/game/cau-roll.js`): nặng gốc `w` × mồi hút nhóm × hệ số phẩm của mồi `pk` × L^(min(p − 1, 3)) với L = may cần × may mồi × phúc (từ Huyền trở lên).
Đo (`tools/cau-ca.test.mjs`): giun + Trúc Can ra Huyền 1,8%, Địa 0,05%.

## 5. Mồi, cần, phúc duyên

| Mồi | Giá 1 con | Tác dụng |
|---|---|---|
| Giun Đất | 5 | mồi thường, cắn nhanh hơn câu trần, kéo được tới Huyền |
| Linh Mễ Hoàn | 20 | Phàm ×0,6, Linh ×1,6 |
| Hỏa Trùng / Băng Tâm Hà / Kim Sa Mễ | 40 | hút loài hệ hỏa / băng / kim, thổ |
| Dạ Quang Trùng | 60 | may ×1,25, hút loài đêm |
| Huyết Nhục Mồi | 120 | may ×1,3, hút dị chủng, loài ma khí |
| Tinh Thần Sa | 300 | may ×1,5, hút loài tinh hải |
| Long Tiên Hương | 1 500 | may ×1,8, hút cá chép, loài rồng; mồi duy nhất gọi được Thượng Cổ |

| Cần | Giá | Kéo tới | Nhanh | May | Hai con | Giằng co |
|---|---|---|---|---|---|---|
| Trúc Can | có sẵn | Huyền | ×1 | ×1 | 0 | vùng ×1, chịu trượt 1 |
| Thanh Đằng Can | 10 000 | Địa | ×0,92 | ×1,1 | 2% | ×1,1, 1 |
| Hàn Thiết Can | 50 000 | Thiên | ×0,85 | ×1,2 | 4% | ×1,2, 2 |
| Ngọc Linh Can | 200 000 | Tiên | ×0,78 | ×1,32 | 6% | ×1,3, 2 |
| Long Cốt Can | 800 000 | Thượng Cổ | ×0,7 | ×1,45 | 9% | ×1,45, 3 |
| Thiên Tàm Ti Can | 3 000 000 | Thượng Cổ | ×0,62 | ×1,6 | 12% | ×1,6, 3 |
| Định Hải Thần Can | 10 000 000 | Thượng Cổ | ×0,55 | ×1,75 | 16% | ×1,8, 4 |

Mồi bán theo gói 10 con, cần mua một lần, mua xong dùng luôn. Giá máy chủ ở `data/market.json → quick.price` (hàm `p2d_nl_mua`, Mua nhanh thôi bán cá).
**Phóng sinh** một con phẩm p được p + 1 phúc duyên (tối đa 60); mỗi lần loài thật cắn còn phúc thì tốn 1, may ×1,2. **Sổ câu**: đủ 5 / 10 / 20 / 30 / 40 / 50 / 60
loài thì Lão Ngư Ông tặng mồi, đủ 60 tặng Định Hải Thần Can (nhận khi nói chuyện với ông).

## 6. Món ăn

Nấu ở mục Món (hoặc tấm chi tiết một con): đủ số thủy sản cùng phẩm (cá, tôm cua; trai sò, bảo vật không nấu), con nhiều nhất bỏ vào trước. Món là đan (`cave.pills`,
`mon: true`), ăn như đan, **chung đan độc** với đan, canh (mỗi ngày 8 viên đầu đủ hiệu quả).

| Món | Cần | Linh khí | Từ |
|---|---|---|---|
| Cá Nướng Than Hồng | 10 Phàm | 1 000 | |
| Canh Chua Linh Ngư | 6 Linh | 2 000 | |
| Hấp Lá Sen Bích Thủy | 4 Huyền | 4 000 | |
| Địa Ngư Kho Tộ | 2 Địa | 7 000 | Trúc Cơ |
| Thiên Ngư Gỏi Băng | 1 Thiên | 11 000 | Trúc Cơ |
| Tiên Ngư Ngọc Thang | 1 Tiên | 15 000 | Kim Đan |
| Côn Bằng Thịnh Yến | 1 Thượng Cổ | 20 000 | Kim Đan |

Thùng linh khí máy chủ chứa ít nhất 500 000 nên một món 20 000 không vướng bộ hãm.

## 7. Lão Ngư Ông, bán Linh Thạch, khai trai

- NPC mới **Lão Ngư Ông** đứng ở Bến Câu Bích Thủy (Thiên Kiếm Tinh, ô 39, 99; `tools/the-gioi/tk_moi.py` → `NPCS`). Lần đầu gặp tặng 30 Giun Đất. Menu: Mua mồi,
  cần câu / Bán đồ câu được / Khai trai / Hỏi chuyện câu (mẹo câu) / Thôi. Lão Ngư Ông thôi đi dạo lễ hội ở Thiên Kiếm Tinh (vẫn đi ở Hàn Băng).
- **Bán** (máy chủ `p2d_cau_doi`): giá = giá Luyện Khí × 1,6 mũ cảnh giới (cột `canh_gioi`), rẻ bán trước, mỗi ngày giờ Việt Nam tối đa:

  | Luyện Khí | Trúc Cơ | Kim Đan | Nguyên Anh | Hóa Thần | Luyện Hư | Hợp Thể | Đại Thừa | Độ Kiếp |
  |---|---|---|---|---|---|---|---|---|
  | 260 nghìn | 420 nghìn | 660 nghìn | 1,06 triệu | 1,7 triệu | 2,7 triệu | 4,3 triệu | 7 triệu | 11 triệu |

  Một con không quá trần ngày: con Thượng Cổ đúng bằng trần, ông "dốc hết túi hôm đó" (nút **Bán riêng** con quý nhất hiện khi Bán hết rẻ trước không tới lượt nó).
  Còn món chưa bán vì hết tiền thì ông dặn mai mang tới. Mồi, cần, trai sò không thu.
- **Đo** (`tools/cau-ca.test.mjs`): Kim Đan dùng Dạ Quang Trùng + Hàn Thiết Can ban đêm khoảng **169 nghìn Linh Thạch mỗi giờ**, đánh quái khoảng 55 nghìn: gấp
  khoảng 3 lần (lời chủ dự án "gấp đôi hoặc gấp 3"); trần ngày Kim Đan đủ khoảng 4 giờ câu.
- **Khai trai** (máy chủ quay, không tốn gì, mỗi lần tối đa 50 con): Trai Sông 25% một Trân Châu, 8% ngọc cấp 1; Sò Điệp Linh 45% / 20% ngọc cấp 1–2; Huyền Châu
  Bạng 60% hai Trân Châu, 25% Huyền Quang Châu, 45% ngọc cấp 2–3; Cổ Bạng ba Trân Châu, 50% Huyền Quang Châu, 80% ngọc cấp 3–4; Long Bạng một Long Châu, một Huyền
  Quang Châu, ngọc cấp 4–5. Loại ngọc ngẫu nhiên trong bốn loại. Châu bán cho ông (300 / 2 000 / 40 000).
- Chơi khách (chưa đăng nhập): tính ở máy cùng luật (`tinhMay` ở `src/game/cau-npc.js`).

## 8. Máy chủ

Migration `supabase/migrations/20261124030000_p2d_cau_ca.sql` (sinh bằng `python3 tools/cau-ca-sql.py`, đừng sửa tay):

- `p2d_nl_mua`: chỉ đổi bảng giá (bỏ 7 loài cá, thêm 9 mồi, 6 cần), thân hàm giữ nguyên bản `20261120161000_p2d_gia_lks.sql` (đã so từng dòng).
- Bảng `p2d_cau_ban` (mỗi người mỗi ngày đã thu bao nhiêu Linh Thạch; RLS bật, không ai đọc / ghi trực tiếp).
- `p2d_cau_doi(p_ban, p_mo)`: bán + khai trong một lần, ghi thẳng bản lưu máy chủ như `p2d_nl_mua`, trả phần trừ / thêm (`tru`, `them`, `con`) để máy khách sửa theo
  (`game.cloud.run`). Mỗi tài khoản 1 lần / giây (bảng `p2d_nhip_lenh` có sẵn). Khách không gọi được.
- **Thử trong máy** (Postgres 16, khung giả của Supabase, `node tools/kiem/thu-cau-ca.mjs | psql`): 16 bước đạt; 9 kiểu sửa hỏng migration (bỏ luật 1 giây, bỏ trần
  một con, bỏ rẻ trước, bỏ trần ngày, thu mồi, cho khách gọi, bán quá số đang có, Mua nhanh bán lại cá, giá sai cảnh giới) đều bị bắt.
- Cá câu được vào bản lưu qua `p2d_luu` như nguyên liệu khác (thùng nguyên liệu 1,5 + 0,75 × cảnh giới mỗi giây; câu thật chừng 0,1–0,2 con mỗi giây). Ai sửa
  số cá ở máy thì bán được tối đa trần ngày của mình; trần đặt bằng mức câu thật vài giờ.

## 9. Hình, tiếng

- Chưa có ảnh GPT cho 47 loài mới, 3 châu, 9 mồi, 7 cần, 7 món (13 loài cũ có ảnh). Tạm thời vẽ bằng code (`src/render/ca-hinh.js`, 32 × 32 điểm ảnh theo dáng
  `hinh`: cá, chép, kiếm, lá, lươn, hai đầu, côn, rồng, tôm, cua, ốc, sứa, mực, trai, châu, giày, rong, bình, kiếm gãy, sách, rương, ấn, mồi, cần, món), có ảnh
  `ui.vk-<mã>` thì dùng ảnh. Lệnh cho GPT (5 bảng, thứ tự từng ô): `tools/art/nguon/ai/cau-ca/lenh-gpt.md`. Ảnh về qua `tools/art/ui_vu_khi.py` như bảng cá cũ.
- Cần, dây, phao, giọt nước, gợn, con bay, thanh giằng co vẽ bằng code (`src/render/draw-fish.js`).
- 13 tiếng `ca.*` làm bằng code (`tools/sfx_chieu.py` → `data/tieng-chieu.json`): quăng, rỉa, cắn, kéo, bay, nhận, con lớn, đứt, giằng co, trượt, ăn, nấu, thả.

## 10. Chỗ code

`data/fishing.json` (mọi số, lời), `data/cave.json` (66 món mới: loài, châu, mồi, cần; 7 món ăn trong `pills`), `data/market.json → quick.price`,
`src/game/cau-roll.js` (tung loài, tỉ lệ), `cau-do.js` (bản lưu `save.cau`: cần, mồi, sổ, kỷ lục, phúc, mốc, hôm nay, đã bán), `fishing.js` (vòng câu, bay),
`cau-gc.js` (giằng co), `cau-nhan.js` (nhận, thẻ, lễ), `cau-mon.js` (nấu, phóng sinh, giá thu), `cau-npc.js` (Lão Ngư Ông), `src/render/draw-fish.js`,
`ca-hinh.js`, `src/ui/cau-the.js`, `cau-view.js`, `cau-ico.js`, `cau.css`; máy chủ `src/net/ky-mon.js → cauDoi`.

## 11. Thử

- `node tools/cau-ca.test.mjs` (trong `tools/check.mjs`): dữ liệu đủ, mọi loài tới được, tỉ lệ, kinh tế so thùng Linh Thạch, nấu, phóng sinh, trần ngày, khai trai, giằng
  co.
- Máy chủ: `node tools/kiem/thu-cau-ca.mjs` in SQL chạy trong giao dịch ROLLBACK (tài khoản thử claude_thu_a, đặt tạm về Luyện Khí); `--sau` không kèm migration.
- Trình duyệt (chơi khách): thả câu, rỉa, cắn, bay, thẻ, lễ Địa phẩm, giằng co, mục Cá bốn mục, quầy, Tự câu 25 giây ra 9 con, bán (bán hết, bán riêng con Thượng
  Cổ, hết tiền), khai trai ra châu và ngọc: 0 lỗi JavaScript.

## 12. Chờ chủ dự án

1. Lời **áp lên** migration (áp TRƯỚC khi đưa bản máy khách lên) và **đưa lên**.
2. Ảnh GPT theo `tools/art/nguon/ai/cau-ca/lenh-gpt.md`.
3. **Thủy thú con thành linh thú** (cần SpriteCook): đề xuất 4 con, mỗi con ảnh tĩnh 12 + ba chuyển động × 26 = 90 credit, cả bốn khoảng 360 (phòng làm lại ~400);
   số dư 24/11 01:5x là 75 credit. Hỏi có gửi ảnh mẫu GPT không trước khi tạo.
