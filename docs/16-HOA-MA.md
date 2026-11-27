# Hóa ma (chủ dự án 22/11/2026 01:54 – 03:2x)

## Lời chủ dự án

- 01:54: "Tắt khiên thêm 1 nút bên cạnh nữa, hoá ma! Lúc này có thể đồ sát mọi người, 2 người hoá ma thì sẽ k đồ sát nhau vì cùng loại. Mỗi lần hoá ma, sẽ tích 1 điểm, khi bị giết sẽ trở thành người thường. Khi hoá ma giết 1 người thì sẽ tích 3 điểm ma hoá, phải chết 3 lần mới hoá thành người bình thường. Có thể giết cả người đang bật hoặc tắt khiên trừ người bật ma hoá. Và sẽ có thêm bảng xếp hạng ma hoá và công đức. Mỗi người giết 1 người bị ma hoá sẽ tích 1 điểm công đức, điểm sẽ ghi trên bxh, và ngược lại, ai giết càng nhiều người, điểm ma hoá càng cao, điểm sẽ dựa trên số liệu thật, nếu họ có 189 điểm, họ chết 1 lần, bxh sẽ trừ 1 còn 188."
- Bảng câu hỏi 02:0x:
  - "Điểm = số lần phải chết".
  - "Người diệt ma thì ma mất 1% linh thạch và 1% tu vi, ma diệt người thì người mất 2% linh thạch nhưng k mất tu vi, nếu tu vi k đủ thì sẽ tụt rank nhưng lần sau tăng lại sẽ k đc thêm điểm tiềm năng nữa vì đã từng cộng ở rank đó".
  - "Che dưới Luyện Khí tầng 5".
  - "Ma nhân 1 ngày giới hạn số lượt đồ sát người, khoảng 10 người".
- 02:04: "người số 11 thì sẽ không còn nhận được linh thạch nữa".
- 02:20 – 02:21: "cái khiên sẽ đổi thành hình dạng đầu lâu", "thanh máu sẽ thành màu đen".
- 03:17: "quên mất chưa làm điểm hồi sinh cho ngừoi hoá ma". Bảng câu hỏi 03:2x: hồi sinh ở "Chỗ ngẫu nhiên xa làng" (mỗi lần một chỗ khác trên tinh cầu đó, không ai canh được); đang là ma mà gục thì "Không, ma phải hồi sinh ở chỗ của ma" (không được chọn Về động phủ).
- 11:4x: "ai hoá ma khi ở thiên kiếm tinh vì cứ mỗi 10s sẽ bị thiên phạt, khi ma nhân chết sẽ rơi linh thạch, ai nhặt đc thì sẽ là của ng đó, nếu k ai nhặt đc thì cứ ở đó. Ma nhân nếu bị đánh chết thì trừ 1 điểm ma hoá, 1% tu vi và linh thạch. Sau đó hồi sinh ở hành tinh khác, bây h ma nhân k còn hồi sinh trên thiên kiếm tinh nữa… newbie kêu quá, bảo bị ma đánh hoài". Đã làm phần thiên phạt và hồi sinh ở tinh cầu khác (dòng Thiên phạt, Hồi sinh bên dưới); phần trừ điểm, tu vi, Linh Thạch khi ma bị diệt đã có từ 02:0x; phần Linh Thạch rơi xuống đất ai nhặt được là của người đó đụng máy chủ và tiền người chơi nên chờ chủ dự án, làm ở đợt 16:14 bên dưới.
- 16:14 (bảng câu hỏi): ma chết vì thiên phạt "cũng rớt" Linh Thạch, chọn "Như bị diệt" (−1 điểm ma, 1% tu vi, 1% Linh Thạch rơi thành túi); màu túi "Năm màu như triệu hồi" (lời chủ dự án: "phẩm vàng hoặc đỏ tuỳ vào số lượng rơi"); hồi sinh ở tinh cầu khác chỉ áp cho ma gục trên Thiên Kiếm Tinh: đúng; thiên phạt tăng dần: ok; chuyển thiên phạt cho máy chủ phòng làm trọng tài: ok. 16:36: "làm xong áp, đưa lên và gộp vào game". Đã làm: dòng Thiên phạt, Hồi sinh, Mất khi ma bị diệt, Túi Linh Thạch bên dưới.

## Luật (số ở `data/pvp.json` → `ma`, `server.ma`; ghi chú `_ma`)

| | |
|---|---|
| Điểm ma | Số lần còn phải chết. Hóa ma +1 (`diem.hoa`), mỗi người mình hạ +3 (`diem.giet`), mỗi lần bị hạ −1 (`diem.chet`). Về 0 là người thường, khiên bật lại. |
| Ai đánh ai | Ma đánh mọi người không phải ma, còn khiên hay không. Người thường, còn khiên hay không, đánh được ma. Hai ma không đánh nhau. Hai người thường: luật PvP cũ (cùng tắt khiên). |
| Người mới | Tổng tầng tu dưới `server.ma.min_tl` (4 = Luyện Khí tầng 5): ma không đánh được, không đánh được ma, không hóa ma được. Máy chủ phòng đọc tầng từ Supabase (không tin máy khách); chưa đọc được thì coi như người mới. |
| Chỗ an toàn | Vòng pháp trận Thiên Kiếm Tinh như PvP cũ. Vừa hồi sinh `immune_s` giây không ai đánh được và không ra đòn được, kể cả ma. Từ 22/11/2026 11:29 (chủ dự án: hồi sinh, đăng nhập ở dưới pháp trận nên "cứ hồi sinh là lại bị đánh, treo máy ở đó là bị đánh hết Linh Thạch") điểm vào game, hồi sinh, bay Tinh đồ tới Thiên Kiếm Tinh (`spawns.vao`, giữa pháp trận) và điểm tới từ tinh cầu khác, tháp, đài (trên đài, phía cổng của nơi vừa rời) đều nằm TRONG vòng; trước đó `vao` cách tâm 128 (bán kính vòng 100), điểm tới nằm ngay ô cổng ở vành ngoài. Cổng bay vẫn ở vành. `tools/check.mjs` và máy sinh `tools/the-gioi/tk_moi.py` chặn điểm nào nằm ngoài vòng. |
| Thiên phạt | Đang là ma mà có mặt trong phòng Thiên Kiếm Tinh (bản đồ của vòng an toàn, `server.safe.map`; trong vòng pháp trận cũng bị). Từ 22/11/2026 16:14 **máy chủ phòng làm trọng tài** (`server.ma.tp`): tính từ lúc có mặt (đang miễn sau hồi sinh thì từ lúc hết miễn), cứ `chu_ky` (10) giây một đạo; hai đạo đầu phòng báo cả phòng (tin `tp`), máy của ma tự trừ `ma.thien_phat.pct` × (1 + `tang` × (n − 1)) máu tối đa (25% → 37,5%, không trừ phòng ngự) nhưng không gục; đạo thứ `dao` (3, khoảng giây 30) là gục do phòng báo (tin `pd` kiểu `tp`), tính **như bị diệt**: −1 điểm ma, 1% tu vi, 1% Linh Thạch rơi thành túi ở chỗ gục. Máy bị sửa không né được (máy khách không còn tự đếm giờ). Rời tinh cầu, gục, hết là ma: đếm lại từ đầu. Mọi máy trong phòng thấy, nghe đạo sét trên người đó. Người thường không bị. Máy mình vừa tới thì báo trước một lần. |
| Khiên | Hóa ma là tắt khiên luôn; đang là ma không bật lại được, Tự hồi khiên sau 10 phút không áp dụng. |
| Hồi sinh | **Từ 24/11/2026 00:28** (bảng chọn "Ma cũng về trận tông môn"): ma gục mà KHÔNG bật Menu → Tự động → "Gục thì hồi sinh tại chỗ" thì như mọi người, về pháp trận tinh cầu tông môn, không có thì pháp trận Thiên Kiếm Tinh (ở đó vẫn bị thiên phạt; `docs/03-CAU-TRUC.md` mục "Gục, hồi sinh, vào game"). Bật tự hồi sinh thì như dưới đây. Ma gục (bị diệt, bị quái hạ, cách nào cũng vậy) trên tinh cầu ngoài trời: hồi sinh ở một chỗ ngẫu nhiên xa làng, mỗi lần một chỗ khác (`ma.hoi_sinh`). **Riêng Thiên Kiếm Tinh** (từ 22/11/2026 11:4x): ma gục ở đó (thiên phạt, bị diệt, quái, cách nào cũng vậy) hồi sinh xong bay hồn tới một tinh cầu khác đã mở cho mình (như trên Tinh đồ: đủ tu vi, đã tới hoặc có cổng bay; không phải làng tân thủ, động phủ, bí cảnh, tháp, đài, Ma Vương, tinh cầu tông môn), ngẫu nhiên, tới nơi đứng ở chỗ ngẫu nhiên xa làng như trên; chưa mở tinh cầu nào khác (chưa học ngự kiếm) thì về làng đầu (Thanh Khê), cũng đứng chỗ xa làng (thêm 22/11/2026 16:5x: thử đầu-cuối thấy ma không có chỗ đi thì hồi sinh tại chỗ, bị đánh gục lại mỗi 30 giây tới hết điểm ma). Chỗ chọn: ô đi tới được từ điểm vào, cách mốc làng gần nhất (điểm vào, mọi điểm tới từ nơi khác, mốc có tên như pháp trận, cổng, NPC, vòng pháp trận an toàn) ít nhất `xa` (24) ô; tinh cầu nhỏ không đủ xa thì lấy phần xa nhất (`ti_le` 0,6 × khoảng cách xa nhất có được); tránh bãi quái (bán kính bãi + `quai` 4 ô) nếu còn ít nhất `it` (40) ô như vậy. Lần gục làm điểm ma về 0 thì đã là người, hồi sinh như cũ. Bí cảnh, tháp, trong nhà, động phủ, đài so tài, độ kiếp, trận trùm Khai Tinh: như cũ. |
| Mất khi ma bị diệt | `mat.ma_lt` (1%) Linh Thạch và `mat.ma_tu_vi` (1%) tu vi = phần đó của thanh linh khí tầng đang ở (đúng thanh máy khách thấy, `qiNeed`). Linh khí không đủ thì tụt một tầng (có thể tụt cảnh giới), linh khí = thanh tầng dưới trừ phần còn thiếu. Luyện Khí tầng 1 thì về 0, không tụt. Từ 22/11/2026 16:14 Linh Thạch **rơi thành túi trên đất ở chỗ gục** (dòng Túi Linh Thạch), cả khi bị diệt lẫn gục vì thiên phạt; nợ ghi trước đó (không có chỗ gục) vẫn về Hòm thư người diệt (lý do `ma_diet`). Người diệt hay ma cờ đỏ: không có túi, không có thư (như nợ PvP cũ). |
| Túi Linh Thạch | Supabase giữ (bảng `p2d_lt_dat`: tinh cầu, chỗ, số, của ai rơi, nguồn `ma_diet` / `ma_tp`, ai nhặt, lúc nào); tạo lúc máy ma trả nợ (`p2d_pvp_tra`). Nằm mãi tới khi có người nhặt ("nếu k ai nhặt đc thì cứ ở đó"). Ai cũng nhặt được, kể cả chính con ma: chạy qua túi (trong 18 đơn vị) là máy gửi tin nhặt, máy chủ phòng gửi chỗ người đó đang đứng, lõi Mang ký, `p2d_lt_nhat` xét cùng tinh cầu, cách túi không quá `ma.tui.r` (64), chưa ai nhặt: ai tới trước được, Linh Thạch qua Hòm thư (lý do `lt_nhat`) và máy tự nhận ngay, số bay lên. Người cờ đỏ không nhặt được, túi để lại. Màu cột sáng theo năm bậc của quà Linh Thạch triệu hồi (`he-thong.json`): dưới 100 nghìn Thường (xám), từ 100 nghìn Khá (xanh lá), 200 nghìn Hiếm (xanh lam), 500 nghìn Cực hiếm (tím), 1 triệu Truyền thuyết (vàng); đứng gần (120) thì hiện số. Khách (chưa đăng nhập) không thấy túi. |
| Mất khi ma hạ người | Người đó mất `mat.nguoi_lt` (2%) Linh Thạch về Hòm thư ma (lý do `ma_ha`), không mất tu vi, không mất món. Mỗi ngày (giờ Việt Nam) chỉ `lt_ngay` (10) lượt đồ sát đầu có nợ; từ lượt 11 không ai mất gì, ma vẫn +3 điểm. |
| Công đức | Mỗi lần diệt một ma +1. |
| Tụt cảnh giới | Điểm tiềm năng tính theo cảnh giới cao nhất từng đạt (`p2d_nhan_vat.canh_max`, `save.tiem.max`): không mất điểm đã có, lên lại không được thêm; màn đột phá không báo "+5 điểm" khi lên lại; quà mỗi 10% tầng không tặng lại cho tầng đã qua. |
| Soát | Cùng một cặp, cùng kiểu, quá `nghi_cap` (5) lần một ngày: một dòng `p2d_nghi_van` lý do `ma_cap` (tối đa mỗi 10 phút), chỉ để soát, không chặn, không cộng điểm nghi vấn. |
| Bảng xếp hạng | Ma hóa (điểm ma hiện tại, chỉ người đang là ma) và Công đức, trong Xếp hạng. |

Cách hiểu AI tự chọn, đã báo chủ dự án lúc bắt đầu (02:0x), chờ chỉnh nếu khác ý: "1% tu vi" là 1% thanh linh khí của tầng đang ở; từ lượt đồ sát thứ 11 trong ngày người bị hạ cũng không mất gì; người mới không đánh được ma; vừa hồi sinh thì ma cũng không ra đòn được; diệt ma hiện chữ "Trấn Ma Kỷ chép" cho người diệt.

## Ai làm gì

- **Máy chủ phòng Cloudflare** (`cloud/src/ma.js`, `pvp.js`, `phong.js`, `mang.js`) là trọng tài:
  - `quyen(a, b)` quyết đánh được không và kiểu trận: `giet` / `diet` / `pvp`.
  - Tin `mh` (bấm Hóa ma): lõi Mang hỏi Supabase rồi mới cho thành ma.
  - Gục trong trận có ma (`maGuc`): lõi Mang báo Supabase, phòng đổi điểm ma, báo cả phòng (`pd` có `k`, `ma`, `cd`; `pk` có `ma`).
  - Lõi Mang giữ điểm ma theo tài khoản cùng khiên (`pk`, có lưu), nên đổi tuyến, vào lại vẫn là ma.
  - Hồ sơ phát cho người khác có `ma` (chữ số) và `bm` (người mới), do phòng gắn (`data/dong-bo.json`, `ai: may-chu`).
  - Tầng tu đọc từ `p2d_nhan_vat` qua `profileOf` (header `x-tl`; máy khách tự gửi các header `x-name`, `x-power`, `x-co`, `x-tl`, `x-map` thì bị xoá).
- **Supabase** (migration `20261122040000_p2d_hoa_ma.sql`):
  - Giữ điểm: bảng `p2d_ma_hoa` (điểm ma, công đức, đếm); nhật ký `p2d_ma_tran` (chống gửi trùng, soát cặp).
  - `p2d_ma_ghi` có ký bằng khoá `cf_mang` như `p2d_pvp_ghi`.
  - Trả nợ trong `p2d_pvp_tra` (nơi `ma_giet`, `ma_diet`).
  - Bảng xếp hạng `p2d_bxh2_het('ma' | 'cong_duc')`.
  - Cấu hình dòng `ma` của `p2d_ky_cfg` (`node tools/ky-cfg.mjs ma`, `tools/check.mjs` so).
  - Bộ hãm linh khí bỏ qua lần trừ tu vi do chính máy chủ làm (`p2d.lk_tru`): thanh linh khí máy khách lớn hơn công thức gốc `p2d_lk_can` nhiều, không bỏ qua thì tụt tầng bị đọc thành tăng vọt, bị cắt và cắm cờ oan (tự kiểm tra trong migration bắt được nếu thiếu dòng này).
- **Máy người chơi**:
  - `src/game/pvp-ma.js`: chọn mục tiêu đúng luật trọng tài (`danhDuoc`), nhịp gửi vị trí khi có thể giao chiến (`giaoChien`), bấm Hóa ma, chữ, hàng chữ lớn, sửa bản lưu theo kết quả trả nợ.
  - `src/ui/pvp-btn.js`, `pvp.css`: nút Hóa ma cạnh Tắt khiên, bảng luật, đầu lâu + số điểm ma, thanh máu đen, `body.la-ma`.
  - `src/render/draw-pvp-tag.js`, `draw-ma.js`, `draw-nguoi.js`: người khác thấy đầu lâu, ma khí, thanh máu đen; mình là ma thì người mới tên xám.
  - Đầu lâu vẽ bằng code: `tools/art/dau_lau.py` (`ui.k-dau-lau`). Chủ dự án gửi ảnh GPT thì thay.
  - Hồi sinh của ma: `src/game/ghost.js` (`maHoiSinh`; bảng hỏi lúc gục bỏ qua khi đang là ma), `src/game/ma-hoi-sinh.js` (chọn ô, thuần, chỉ đọc bản đồ), `src/game/game.js` respawn. Chọn ở máy người chơi như điểm hồi sinh cũ; máy chủ phòng không cần biết (vừa hồi sinh `immune_s` giây không ai đánh được, vệt vị trí bù trễ chỉ giữ 1 giây nên lần nhảy chỗ không thành đường quét qua bản đồ).
  - Thu chiến lợi phẩm (`src/game/pvp-thu.js`, sửa 22/11/2026 11:09, chủ dự án: "giết xong mà chẳng thấy gì"): Linh Thạch của người gục chỉ tới Hòm
    thư người hạ khi máy NGƯỜI GỤC trả nợ (`p2d_pvp_tra`, chừng một giây sau khi gục), trước đây người hạ chỉ thấy ở lượt tự nhận thư 90 giây hoặc khi mở
    Hòm thư, lẫn giữa các thư khác. Nay tin `pd` có `loot` thì chữ báo lúc hạ nói luôn "Chiến lợi phẩm đang về Hòm thư…"; ma đồ sát được tính (điểm ma tăng)
    mà không ghi nợ thì báo đã thu đủ `ma.lt_ngay` lượt hôm nay; máy mình hỏi Hòm thư lúc 2,5 / 8 / 20 / 45 giây (cách nhau ít nhất 2 giây khi hạ nhiều người
    liền); thư chiến lợi phẩm (`pvp_ha`, `ma_ha`, `ma_diet`) nhận ở đường nào (`claimMail`: lượt hỏi này, lượt 90 giây, bảng Hòm thư) cũng qua
    `game.chienLoi`: số "+X Linh Thạch" bay lên trên đầu, tiếng nhặt, chữ báo của ai. Hết 46,5 giây chưa có thư của người ấy thì báo họ có thể đã thoát game
    (vào lại là tự về Hòm thư) hoặc không còn Linh Thạch (2% làm tròn còn 0 thì máy chủ không gửi thư). Áp cho cả PvP thường và người diệt ma. Không đổi máy chủ.
  - Thiên phạt (22/11/2026 11:4x máy khách tính; 16:14 chuyển cho phòng): `cloud/src/thien-phat.js` giữ mốc trong phần đính kèm kết nối (`a.tpAt`, `a.tpN`: phòng ngủ dậy vẫn đúng), hẹn giờ trong bộ nhớ (`room.tpTimer`) tới đạo kế hoặc lúc hết miễn, mỗi tin của ma trong phòng hẹn lại nếu hẹn giờ đã mất (`tpTin`); có chặn vòng lặp khi đồng hồ không chạy. Đạo cuối gọi `ma.js` `maTp`: miễn như hồi sinh, lõi Mang ký `p2d_ma_ghi` sự kiện `tp` kèm chỗ gục (nợ `ma_tp`), phát `pd` kiểu `tp`. Máy khách (`src/game/thien-phat.js`): `tpTin` vẽ sét lên người đó (mình hoặc người khác), máy của ma trừ máu chừa 1; `thienPhatTick` chỉ báo trước; `pvp-ma.js` `maPd` nhận kiểu `tp` (máy ma: gục, báo điểm ma còn lại; máy khác: chỉ vẽ). `maNoiDen` chọn tinh cầu để đẩy hồn ma đi, `maDayDi` bay tới (`game.travel` kiểu bay, chữ riêng) rồi đặt người ở chỗ `maHoiSinh` chọn; `ghost.js` `afterGhost` gọi, `game.js` `respawn({ im: true })` không báo chữ hồi sinh chồng lên chữ bị đẩy.
  - Túi Linh Thạch (22/11/2026 16:14): migration `20261122170000_p2d_tui_linh_thach.sql` (sinh bằng máy, có tự kiểm tra); máy chủ phòng `cloud/src/tui.js` (tin `lt` nhặt, `ltm` báo túi mới; mỗi người 0,4 giây một lần nhặt), `mang.js` `ltNhat`; máy khách `src/game/tui-lt.js` (hỏi `p2d_lt_xem` lúc vào tinh cầu và khi phòng báo túi mới, sau một quãng ngẫu nhiên kẻo cả phòng hỏi cùng lúc; trả lời tới muộn không đè túi vừa thêm, túi đã biết là hết không sống lại), vẽ ở `src/render/draw-loot.js` `drawTui`; `pvp.js` `settle` gặp nợ có `tui` thì hiện ngay và báo phòng; thư `lt_nhat` không hiện lại bảng chiến lợi phẩm (`market.js`).
  - Sửa kèm lỗi có sẵn (`src/game/player.js`): tin gục PvP từ phòng đặt máu 0, nhưng đòn PvP không đặt `invT` nên người lâu không bị quái đánh tự hồi 0,025 máu trước lúc `game.js` xét gục: thua PvP mà không gục, không về điểm hồi sinh. Nay máu 0 không tự hồi.

## Cổ Thụ Ngàn Năm (23/11/2026)

Chủ dự án 15:33: "ma tu điểm quá nhiều, không còn cách quay đầu nữa, đã có người xoá game… muốn điểm ma hoá giảm sẽ phải ngồi thiền dưới gốc cổ thụ,
1 điểm sẽ mất 1 phút… mỗi một phút sẽ chia sẻ 0,5% tu vi lên cây cổ thụ, linh khí này tích luỹ ở đây để chính đạo có thể hấp thu". Bảng câu hỏi:
"Ngừng sét, không ai đánh", "0,5% thanh tầng đang ở", "Đả tọa dưới cây, chia đều", "Giữ phần đã ngồi".

- **Vòng sáng** quanh gốc Cổ Thụ Ngàn Năm ở Thiên Kiếm Tinh (tâm đo theo hình cây vẽ thật: giữa chân rễ): `data/pvp.json → server.ma.co` (tâm x, y, bán kính r đơn vị bản đồ; bản sao ở
  `cloud/src/mang-cfg.js`). Trong vòng không ai đánh ai (người đánh hay người bị đánh đứng trong vòng thì máy chủ phòng bỏ đòn, như vòng pháp trận);
  ma đứng trong vòng thì thiên phạt dừng, ra khỏi vòng đếm tiếp chỗ đang dở (không đếm lại từ đầu, ra vào không né được).
- **Ma sám hối**: ngồi đả tọa trong vòng, mỗi `phut_s` (60) giây ngồi liền: −1 điểm ma, `ma.co_thu.tu_vi` (0,5%) thanh linh khí tầng đang ở gửi lên cây
  (thiếu thì tụt một tầng như khi bị diệt), không mất Linh Thạch. Đứng dậy, ra khỏi vòng: phút chưa đủ không tính, phút đã đủ giữ. Đang sám hối thì đả tọa
  không tự sinh linh khí. Hết điểm ma: thành người thường, khiên bật lại, lễ "Ma khí tan dưới gốc cây".
- **Chính đạo hấp thu**: người thường ngồi đả tọa trong vòng, mỗi phút đủ thì chia đều linh khí cây đang tích, mỗi người tối đa `share` (1/2) × linh khí
  chém quái mỗi phút của cảnh giới mình (`config.meditate.farm_h`), qua Hòm thư lý do `co_thu` (máy tự nhận ngay, số bay trên đầu, không thêm thư vào
  Hòm thư). Đả tọa thường vẫn chạy song song. Người cờ đỏ không được chia; tu vi người cờ đỏ sám hối vẫn trừ nhưng không vào cây.
- **Ai làm gì**: máy chủ phòng đếm phút (`cloud/src/co-thu.js`, mốc `a.coAt` / `a.coN` trong phần đính kèm kết nối), vòng an toàn ở `pvp.js`,
  thiên phạt dừng ở `thien-phat.js`. Lõi Mang ký gửi Supabase: `p2d_ma_ghi` 'sh' (−1 điểm, nợ 'ma_sh'), máy người sám hối trả nợ `p2d_pvp_tra`
  (trừ tu vi, cộng vào `p2d_co_thu`), `p2d_co_thu_hap` chia cho người thường, `p2d_co_thu_xem` cho máy khách vẽ (migration `20261123070000_p2d_co_thu.sql`).
  Máy khách: `src/game/co-thu.js` (báo, lễ, nhận thư), `src/render/draw-co-thu.js` (ba vòng hạt sáng, sáng theo linh khí cây; sợi linh khí giữa gốc cây và
  người ngồi: ma chảy lên cây, người thường chảy về người; chủ dự án 15:58 "hiệu ứng ma khí thoát ra cho vui mắt": ma đang sám hối bốc ma khí đỏ đen từ hai bên
  vai, lên cao thì tịnh hoá thành điểm sáng trôi về cây; mỗi phút tan một điểm ma thì nổ bung rồi bị hút vào gốc, điểm cuối nổ lớn; người khác cũng thấy).
  16:44 chủ dự án: ngồi thiền hay đứng đều phải thấy linh thú, khôi lỗi của người khác như nhau → bỏ luật cũ ẩn kẻ đi theo khi mình đả tọa (`render/draw.js`);
  ma khí của người đang sám hối vẽ ngay sau thân, trước tên (`draw-nguoi.js` gọi `drawMaKhiNgoi`), nên tên đọc được và cây đứng trước / sau đúng thứ tự.
- **Bài thử**: `tools/cloud/co-thu.test.mjs` (trong `tools/check.mjs`; phút đủ / đứng dậy / ra vòng / thiên phạt dừng không đếm lại / gom chia / phòng ngủ
  dậy / không ai đánh ai), bài hai máy mục 5c (ma 1 điểm ngồi đủ một phút thì hết ma, đánh trong vòng không trúng). Migration chạy thử trên máy chủ thật trong
  giao dịch huỷ ngược: ma 3 → 2, gửi trùng không trừ thêm, trả nợ trừ đúng 52 linh khí (0,5% thanh Luyện Khí tầng 9), cây +52, người Luyện Khí nhận 12
  (trần), cây còn 40, 50 giây sau gọi lại không nhận thêm.

## Thứ tự đưa lên

Áp migration TRƯỚC, rồi mới gộp (gộp `main` là Cloudflare tự đưa máy chủ phòng mới lên, GitHub Pages đưa máy khách mới). Phòng mới mà Supabase chưa có `p2d_ma_ghi` thì bấm Hóa ma chỉ báo "Ma khí chưa nhập được", không hỏng gì; máy khách mới gửi `tiem.max` mà trigger cũ chưa biết thì mỗi lần lưu bị sửa lại `tiem` (không cắm cờ), nên vẫn phải áp trước.

Đợt túi Linh Thạch (22/11/2026): áp `20261122110000` (Hắc Phong) rồi `20261122170000` trước khi gộp. Phòng cũ chạy với hàm mới: nợ diệt ma không kèm chỗ gục nên vẫn về Hòm thư như cũ. Máy khách cũ gặp phòng mới (lúc chưa tải lại): đạo thiên phạt cuối báo gục kiểu thường (tên người hạ để trống), Linh Thạch vẫn trừ đúng trên máy chủ, tu vi máy đó chưa trừ tới khi tải lại; không thấy túi trên đất (túi vẫn nằm đó chờ người khác).

## Bài thử

- `node tools/cloud/pvp.test.mjs`: phần 6 hóa ma (12 kiểu sửa hỏng luật đều bị bắt).
- `node tools/cloud/phong.test.mjs`: lõi Mang ký `p2d_ma_ghi`, giữ, lưu, đọc lại điểm ma.
- `tools/hai-may.mjs` mục 5b: hai trình duyệt qua phòng giả. B bấm Hóa ma thật; A, C thấy điểm ma và đầu lâu; C còn khiên gửi vị trí theo nhịp giao chiến; ma đánh người còn khiên được; B (có động phủ) gục hai lần: không hỏi Về động phủ, hồi sinh xa điểm vào, hai chỗ khác nhau, vẫn là ma, A thấy B ở chỗ mới (mục này cũng bắt lỗi máu 0 tự hồi).
- `node tools/pvp-thu.test.mjs` (`tools/check.mjs` gọi): đồng hồ giả, Hòm thư giả, đi đúng đường tin `pd` → `onPvp` / `maPd` → hỏi Hòm thư → `claimMail` → báo.
  Sáu phần: ma đồ sát có nợ (báo đang về, nhận ở lượt 2,5 giây, Linh Thạch vào túi, số bay lên, chữ báo của ai, không báo "chưa có"); quá lượt trong ngày
  (báo hết lượt, không chờ thư; tin lặp điểm ma không tăng thì không báo sai); thư không tới (báo vì sao); hạ ba người liền (không hỏi dồn, báo đúng người);
  lượt 90 giây nhận thư chiến lợi phẩm (báo riêng, dòng chữ chung chỉ còn thư khác); PvP thường có / không nợ. Tắt `game.chienLoi` hoặc bỏ chữ báo lúc hạ đều bị bắt.
- `node tools/thien-phat.test.mjs` (`tools/check.mjs` gọi): máy khách không tự đếm giờ (đứng bao lâu máu cũng không đổi), báo trước một lần, quay lại báo lại; tin đạo của mình trừ đúng mức, đạo sau nặng hơn, không làm gục; đạo của người khác chỉ vẽ; tinh cầu bị đẩy tới hợp lệ, đã mở theo tu vi; chưa mở tinh cầu nào khác thì về làng đầu; `afterGhost` bay hồn đi; nối dây (`updatePvp`, `onPvp`, `settle` nợ `ma_tp`, `maPd` kiểu `tp`, `online-cf.js`).
- `node tools/cloud/thien-phat.test.mjs` (`tools/check.mjs` gọi): phòng thật với đồng hồ, hẹn giờ giả: 9 cảnh (hai đạo rồi gục đúng giây, cả phòng nhận tin, đang miễn thì chờ, rời phòng / hết là ma thì thôi, phòng ngủ dậy, nhiều ma, người thường, tinh cầu khác, nhặt túi). 13 kiểu sửa hỏng đều bị bắt.
- `node tools/tui-lt.test.mjs` (`tools/check.mjs` gọi): năm bậc màu khớp quà triệu hồi, nhặt khi chạy qua (không nhặt khi gục, đang là hồn, ngoài tầm), không gửi dồn, tin `ltn` / `lt-` / `ltx` / `ltm`, đổi tinh cầu, trả lời tới muộn, túi mới lúc chưa hỏi danh sách, nối dây, đủ chữ và bản dịch. Mười hai kiểu sửa hỏng (cùng phần thiên phạt máy khách) đều bị bắt.
- `node tools/ba-may-tp.mjs` (thêm `BAY=0` để thử ma chưa học ngự kiếm): ba trình duyệt qua phòng giả (`tools/cloud/phong-gia.mjs` nay biết sự kiện `tp` và nhặt túi), nhịp rút còn 2 giây: ma 2 điểm trên Thiên Kiếm Tinh mất 25% rồi 37,5% máu, gục ở đạo 3, còn 1 điểm, bay hồn tới Xích Diễm Tinh (chưa học ngự kiếm thì về Thanh Khê); máy kia nghe hai đạo; túi 250 nghìn màu Hiếm, người chạy qua nhặt được, máy thứ ba thấy túi mất; 0 lỗi JavaScript (16/16 mỗi đường). Lần chạy đầu bắt được hai lỗi đã sửa: ma không có chỗ đi bị đánh gục lại mãi, túi thiếu màu làm vỡ khung vẽ.
- `node tools/ma-hoi-sinh.test.mjs` (`tools/check.mjs` gọi): mọi tinh cầu, 120 lần chọn mỗi tinh cầu: không chạm vách, đi tới được từ điểm vào, đủ xa làng, ngoài vòng pháp trận, tránh bãi quái khi còn chỗ, nhiều chỗ khác nhau; `ghost.js` không hỏi khi là ma, người thường như cũ, bí cảnh / tháp / trong nhà / động phủ / đài / độ kiếp / trận trùm như cũ. 15 kiểu sửa hỏng đều bị bắt.
- Migration có tự kiểm tra (15 nhóm, hoàn tác sau khi chạy). Đã chạy tại chỗ trên PGlite với bản đang chạy của các hàm liên quan: đạt. Sáu kiểu sửa hỏng (bỏ trần mỗi ngày, bỏ `p2d.lk_tru`, bỏ `canh_max`, bỏ bảng Ma hóa, cho người mới diệt ma, tụt tầng về 0) đều bị bắt.
- Migration túi Linh Thạch có tự kiểm tra (9 nhóm, hoàn tác sau khi chạy), chạy tại chỗ trên PGlite với bản đang chạy của các hàm liên quan: đạt; tám kiểu sửa hỏng đều bị bắt.

## Còn chờ

- Ảnh GPT đầu lâu (nếu chủ dự án muốn thay bản vẽ bằng code).
- Danh hiệu tuần cho hai bảng mới (`social.json → rank.titles`), cùng các danh hiệu tuần khác đang chờ.

## Đánh người yếu hơn: đánh được, không có lợi (23/11/2026)

Chủ dự án 20:4x chọn "Đánh được, không có lợi" sau bình luận người chơi (Kết Đan, người chơi lâu PK người mới không cày được) và số máy chủ 24 giờ: ma đồ sát 825 lần (328 lần người cảnh giới cao hạ người thấp hơn), PvP thường Kim Đan hạ Trúc Cơ 211 lần, Nguyên Anh hạ Trúc Cơ 69 lần.

- Kẻ hạ có đại cảnh giới (cột `canh_gioi`) cao hơn người gục từ `data/pvp.json → yeu.cach` (1) trở lên: vẫn đánh, vẫn hạ được, nhưng **không ai mất, được gì**.
  - PvP thường: `p2d_pvp_ghi` không ghi nợ, người gục không mất Linh Thạch / món.
  - Ma đồ sát: `p2d_ma_ghi 'giet'` không cộng điểm ma, không tính lượt thu ngày, không ghi nợ; trận vẫn ghi `p2d_ma_tran` với `yeu = true` để đo.
  - Diệt ma, thiên phạt, sám hối giữ như cũ (ma tự chọn làm ma).
- Máy chủ dữ liệu quyết (`p2d_canh_hon`, migration `20261123110000_p2d_ha_yeu_khong_loi.sql`, dòng cấu hình `'ma'` có `yeu`). Máy chủ phòng không đổi: gục vẫn báo, `loot` = 0 vì không có nợ.
- Máy người chơi chỉ báo chữ (`src/game/pvp-yeu.js`, cảnh giới người khác lấy từ hồ sơ phòng `ri`): kẻ hạ thấy "kém bạn một đại cảnh giới: không có chiến lợi phẩm / không cộng điểm ma", người gục thấy "kẻ hơn bạn một đại cảnh giới nên không lấy được gì của bạn".
- Tắt luật: `yeu.cach` = 0 rồi `node tools/ky-cfg.mjs ma` và thêm migration ghi lại dòng `'ma'`. Bài thử: `tools/pvp-yeu.test.mjs`; phần máy chủ đã chạy thử trong giao dịch huỷ ngược trên máy chủ thật (PvP thường mạnh hạ yếu không nợ, yếu hạ mạnh có nợ; ma mạnh hạ yếu `{ma: 5, no: false, yeu: true}`, ngang cảnh giới +3 điểm có nợ; diệt ma giữ như cũ).

