# Thân pháp: chuỗi liên hoàn đánh thường

Chủ dự án 22/11/2026 04:25–04:28 (làm trên nhánh `truyen-han-bang`, máy tạm, **chưa đẩy lên GitHub, không đổi máy chủ**). Lời gốc và quyết định ghi ở `CLAUDE.md`.
Phần này nói thiết kế, số đang dùng, chỗ code, cách thử, việc còn chờ chủ dự án.

## 1. Lời chủ dự án

- 04:25: "trong mục công pháp, gần ô công pháp chiêu thức, sẽ thêm 1 ô thân pháp hoặc là gì đó mà nó sẽ bổ trợ cho hiệu ứng tấn công cũng có các ô khảm như: nhát 1
  chém thường, nhát 2 chọc, nhát 3 cầm vũ khí xuyên qua xuyên lại, nhát chém thứ 4 biến vũ khí thành nhiều bản copy, sau đó liên hoàn tấn công. Kiểu đó. Hoặc là nhát
  1 mặc định chém thường, từ 4 đến 5 là khảm thêm các hiệu ứng như: phóng về phía trước, tạo tách ra mở thành 1 vùng và thu lại sát thương trên đường đi; hoặc là để vũ
  khí bay lên trời sau đó hoá to đập xuống dưới chân địch; hoặc là xuyên liên tiếp 20 phát cực nhanh về phạm vi phía trước; hoặc là ném vũ khí ra phía trước, vũ khí
  tạo ra hắc khí màu đen, trong vùng đen đó sẽ khoá mục tiêu và vũ khí sẽ chém bay qua lại giữa các mục tiêu 10 lần; hoặc chém 1 đường siêu lớn về phía trước. Nói
  chung là tạo đồ hoạ chiêu thức theo từng nhát chém trên cơ sở vũ khí của nhân vật, và hiệu ứng hình ảnh đặc sắc để người chơi cảm thấy làm ít mà hưởng nhiều,
  hoặc là cảm thấy mình đỉnh, hoặc đơn giản là đồ hoạ đẹp hiệu ứng thích đến mức không bao giờ muốn bỏ game".
- 04:28: "Màu sắc, hiệu ứng, âm thanh, những thứ liên quan tới thất tình lục dục, hãy làm tốt nhất. Nghe thấy hay, nhìn thấy thích, ấn đánh cảm thấy sướng."

AI gộp hai cách anh tả: ba nhát đầu cố định (chém, đâm, xuyên), nhát 4 và nhát 5 là hai ô khảm, mỗi ô chứa một "thức" trong sáu thức đúng như anh kể.
Mỗi thức gắn với một người dạy trong truyện, mở theo nhiệm vụ chính, như kỹ năng.

## 2. Cách chơi

- Bấm đánh (hoặc Tự đánh, Tự hành) là chuỗi tự chạy: **Chém → Đâm → Xuyên → thức ô 1 → thức ô 2 → Chém…** Ngưng tay quá 1,5 giây (`cua_so`) thì về nhát 1.
- Người mới có bốn nhát (ô nhát 5 mở khi lĩnh ngộ thức thứ hai). Ô đang mở mà trống thì tự khảm thức đã mở đầu tiên chưa nằm ô nào.
- Vũ khí bắn (đàn, cung): nhát 1–3 vẫn bắn như thường, nhát khảm vẫn ra thức.
- Đang cưỡi thú (thú đánh), đang bay: không có chuỗi.
- Mọi nhát, mọi thức vẽ bằng **chính hình vũ khí đang cầm** (món có ảnh thật thì ảnh đó, chưa mặc món nào thì hình theo loại vũ khí), cùng hệ màu linh căn.
- Lần đầu ra thức khảm, Hệ Thống nhắc một lần chỗ đổi thức (cờ `tp-nhac`).
- **Số sát thương theo nhát** (chủ dự án 23/11/2026 13:4x chọn "Cả 2"; `src/game/so-nay.js`, `data/juice.json → so`): số của mình vọt to rồi nảy, nhảy lên một chút; màu theo nhát của chuỗi (Chém trắng, Đâm lam, Xuyên tím, ô 1 hồng), **nhát cuối chuỗi bung vàng** (chữ vàng viền cam, to hơn, tia vàng toả); bạo kích vẫn vàng `#ffd84a`. Nhát nào là nhát mấy đi kèm đòn từ `tpNhat` (`i`, `cuoi`) qua `p.hitQ`, đạn, màn diễn thức (`I.nhat`) tới `hitMob`. Cùng đợt: bạo kích loé trắng ngắn ở chỗ trúng, rung máy quay nhẹ, vệt chém sáng hơn (`hit2.loe`, `crit_shake`, `slash`), không khựng hình.
- Bảng Nhân vật → Công pháp → **Thân pháp** (giữa Kỹ năng và Công pháp): chuỗi năm nhát xếp dọc, chạm ô nhát 4 / 5 để chọn ô, chạm "Khảm vào nhát N" ở một thức.

## 3. Chín thức

| Thức | Người dạy · mở ở | Hình | Số |
|---|---|---|---|
| Vạn Ảnh Liên Hoàn | Tự lĩnh ngộ · mở sẵn | Vũ khí tách sáu bản sao linh quang, xoè thành vòng trên đầu, lần lượt lao vào kẻ địch quanh mình, vỡ thành mảnh sáng | 6 lần × 0,32 |
| Khai Thiên Nhất Trảm | Vân Hạc · nhiệm vụ 18 (cờ `kn-pha-van`) | Vũ khí vút lên trên đầu, lớn gấp ba trong một nhịp tụ lực, quét một cung, phóng vầng kiếm quang hình lưỡi liềm lan 210 đơn vị, để lại vết chém trên đất | 2,5, mọi con trên dải chém |
| Liệp Phong Bách Thứ | A Lực · nhiệm vụ 26 (cờ `kn-liep-phong`) | Rút vũ khí lấy đà, 20 nhát đâm trong 0,6 giây dồn vào con mồi đang khoá (lệch ngang quanh nó, không có con nào thì toả hình quạt hẹp), nhát cuối xuyên thấu, vòng nổ ở mũi | 20 × 0,1 + 0,4 |
| Tinh Hải Thu Võng | Lão Ngư · nhiệm vụ 32 (cờ `tp-thu-vong`) | Quăng vũ khí xoay tít, bung thành lưới sao tám bản sao, gom quái trong lưới rồi kéo cả về trước mặt, chém dọc đường kéo | 0,6 + 0,45 + 1,0; kéo quái thường (không kéo trùm, quái chung, quái của đội trưởng) |
| Thiên Kiếm Trấn | Lâm Uyên · nhiệm vụ 36 (cờ `tp-thien-tran`) | Vũ khí vút lên trời, ấn trận hiện ở chỗ đông quái nhất, trời tối lại, kiếm khổng lồ (4,4 lần) lao xuống có bóng nối đuôi, nổ: vòng sóng, vết nứt sáng, đá vụn, bụi, cắm lại làm mốc rồi tan thành đốm sáng | 2,4 cả vùng bán kính 50, choáng 0,4 giây |
| Huyền Vực Tỏa Hồn | Mặc Ảnh, ma tộc canh cửa Hắc Phong Động · nhiệm vụ chính 49 (cờ `tp-huyen-vuc`; trước 22/11 đợt Hắc Phong là tự mở ở Trúc Cơ tầng 5, ai đã tới tầng 5 lúc đổi giữ thức) | Ném vũ khí, hắc khí bung thành vùng tối có vành tím, vành đỏ thẫm xoay; dấu khoá trên từng mục tiêu; vũ khí chém xuyên qua lại 10 lần, dải hắc khí, dấu chém chéo; vùng sập lại, bùng sáng | 10 × 0,25 chia cho mục tiêu bị khoá |
| Vạn Diệp Quy Căn | Mộc Trưởng Lão, Làng Tinh Linh · nhiệm vụ chính 64 (cờ `tp-van-diep`, Thanh Mộc 23/11/2026: "Lá rụng không phải là chết. Lá rụng là về cội.") | Vũ khí rụng thành chín chiếc lá (bản sao vũ khí nhuộm xanh) xoáy quanh người, quét ba vòng nở dần; rồi lá bay về một chỗ (con gần nhất trong tầm 110, không có thì phía trước) như lá rụng về cội, nổ ở đó: quầng sáng, vòng sóng, cánh hoa, rễ sáng đâm lên | 3 vòng × 0,3 (vòng bán kính 52) + nổ 1,3 (bán kính 30) |
| Vạn Kiếm Quy Trủng | Kiếm Lão, người giữ mộ kiếm Thiên Kim · nhiệm vụ chính 76 (cờ `tp-quy-trung`, Thiên Kim 26/11/2026: "Cắm cho nó đứng thì dễ. Cắm cho nó chịu nằm mới khó.") | Cắm vũ khí xuống đất dưới chân, một đường sáng chạy trên đất tới chỗ đông địch nhất; mười hai thanh kiếm (bản sao vũ khí) lần lượt trồi lên thành vòng mộ, có cột sáng và đất bật; vòng khép lại (vây, làm chậm); bốn đợt, mỗi đợt ba thanh lao vào giữa cắm thành gò kiếm; một thanh kiếm lớn (3,6 lần) hiện trên gò, ngả dần rồi NẰM xuống: đất rung, ba vòng sóng, vết nứt sáng, cả gò tan thành đốm sáng bay lên | vây 0,4 (bán kính 68, chậm 1,2 giây) + 4 đợt × 0,2 (bán kính 45) + nằm 1,3 (bán kính 42, choáng 0,4 giây) = 2,5 |
| Bách Luyện Thiên Chùy | Thiết Lan, thợ rèn Thiên Kim · nhiệm vụ chính 81 (cờ `tp-bach-luyen`: "Thép phải qua lửa, qua búa, qua nước.") | Một cái đe lửa tám cạnh hiện giữa đám địch, than hồng dưới đất; vũ khí nung đỏ làm búa nện ba nhát, nhát sau lớn và nóng hơn nhát trước (cam, vàng, trắng; 1,5 / 2,1 / 3 lần cỡ), mỗi nhát toé hoa lửa, tia lửa bắn ngang, cột lửa bật lên, vòng sóng; nhát ba làm đất nứt chảy đỏ; rồi tôi vào nước: hơi trắng lam bung lên, vết nứt nguội, vũ khí loé lạnh | 0,5 + 0,7 (bán kính 46) + 1,3 (bán kính 58, choáng 0,5 giây) = 2,5 |

Ba nhát đầu: Chém (đường cũ, 1 lần), Đâm (tầm × 1,45, cung hẹp 18°, 1 lần), Xuyên (vũ khí đi tới, đi về, đi tới trên đường dài tầm × 1,75; 3 × 0,42).
"Số" là lần sát thương so với một nhát chém thường (một lần trúng đi qua đúng đường đòn thường: bạo kích, Liên Kích, Bạo Nộ, quái chung đều như cũ).
Liên Kích tính một cho mỗi nhát của chuỗi dù thức trúng bao nhiêu lần.

**Cân bằng.** Cả vòng năm nhát với kiếm (hồi 0,62 giây) vào MỘT con thêm khoảng 6–15% sát thương mỗi giây so với chém thường mãi, tuỳ cặp thức
(đo 22/11/2026 sau khi Bách Thứ dồn trúng: thấp nhất là cặp Vạn Ảnh + Thu Võng, các cặp có Bách Thứ +11–15%, cao nhất Bách Thứ + Khai Thiên;
`tools/than-phap.test.mjs` chặn trong khoảng 1,02–1,32 lần). Đánh đám đông thì hơn nhiều (Thiên Kiếm Trấn, Khai Thiên, Vạn Ảnh trúng cả đám;
Thu Võng gom quái).

**Bách Thứ dồn trúng** (chủ dự án chọn 22/11/2026 10:10; bản đầu rải 20 nhát trong nón ±`goc` nên vào một con chỉ trúng ~14 nhát, cặp Bách Thứ + Thu Võng
chỉ +5%): lúc ra thức khoá con mồi (con mục tiêu của nhát chém nếu còn trong tầm `tam × khoa`, không thì con gần nhất trước mặt, lệch hướng mặt tối đa 60°);
mỗi nhát đâm ngắm theo chỗ con ấy lúc nhát đâm ra, mũi lệch ngang quanh nó trong ±`lech` lần nửa bề rộng trúng nên khoảng chín phần mười số nhát trúng dù
nó đứng sát hay xa (trung bình 2,24 lần nhát chém, ~18/20 nhát); nhát cuối cũng xuyên qua nó; con mồi gục hoặc chạy khỏi tầm thì các nhát còn lại rải nón
như cũ; quạt gió vẽ hẹp lại, quay theo hướng con mồi. Không có con nào để khoá thì rải nón như bản đầu. Số ở `data/than-phap.json → thuc.bach-thu`
(`khoa` 1,15, `lech` 1,12). Bài thử lấy trung bình nhiều lần với Math.random cố định (bản đầu lấy một lần lẻ, cứ khoảng bốn lần chạy thì trượt một lần),
và chặn trung bình ít nhất 16/20 nhát vào con đang khoá ở ba chỗ đứng: sát, xa, lệch hướng mặt.
Muốn mạnh hơn hoặc yếu đi: sửa `mul`, `cd` trong `data/than-phap.json`, chạy bài thử. Cùng với Kỹ năng (ba kỹ năng dùng đều tay thêm khoảng 40%), nên đo lại quái
bằng Tự đánh thật như đợt 16/11 trước khi đưa lên (việc 4 bên dưới).

**Không khựng hình.** Chủ dự án đã chê khựng hình mỗi đòn (16/11 17:15) nên thức không đứng hình; chỉ rung màn ở thức lớn (Thiên Kiếm Trấn, Khai Thiên, nhát cuối
Bách Thứ, Huyền Vực sập), chớp dịu ngắn ở hai thức lớn nhất. Người đứng xem không bị rung theo đòn của người khác.

**Tiếng** (làm bằng code, `tools/sfx_chieu.py` → `data/tieng-chieu.json`, tên `tp.*`, độ to đo trên loa điện thoại bằng `node tools/sfx-check.mjs tp. --chieu`):
nhát đâm "phập", lượt xuyên vút đi vút về, Vạn Ảnh ngân như ngọc va theo ngũ cung Đô, mỗi bản sao vút một tiếng nhỏ; Thu Võng quăng dây, lưới bung tiếng nước
toé, kéo nặng tay, thu lưới nện; Thiên Kiếm Trấn vút lên, gió rít lao xuống, nổ lớn đất nứt đá rơi rền dài (to nhất bộ, −16 dB); Bách Thứ 20 tiếng đâm nhỏ rồi nhát
cuối nổ; Huyền Vực ném xoay tít, hắc khí hút ngược rồi ù trầm, mỗi nhát chém tối, vùng sập bùng; Khai Thiên tụ lực ngân dâng rồi chém xé gió rộng; Vạn Diệp
lá xào xạc xoáy quanh người kèm hai nốt ngũ cung, lá tụ vút một tiếng, nổ trầm kèm bốn nốt Đô–Mi–Son–La rơi xuống như lá chạm đất (`tp.diep_xoay`, `tp.diep_tu`,
`tp.diep_no`); Quy Trủng cắm phập xuống đất, mười hai tiếng rút kiếm khỏi đất kèm bốn nốt ngũ cung dâng, mỗi đợt kiếm vút rồi phập, kiếm lớn nằm xuống nện nặng kèm một tiếng
chuông mộ trầm ngân dài (`tp.trung_cam`, `tp.trung_troi`, `tp.trung_ha`, `tp.trung_nam`); Bách Luyện bễ thổi lửa ù lên, hai nhát búa keng trầm ngắn có hoa lửa lách tách, nhát ba
nện lớn đất nứt, rồi tiếng xèo tôi nước (`tp.luyen_lua`, `tp.luyen_bua`, `tp.luyen_bua3`, `tp.luyen_toi`; kim loại giữ trầm và ngắn theo lời chê "ting ting" 09/11). Tiếng của người
khác chỉ kêu khi họ ở gần (260 đơn vị), nhỏ hơn tiếng của mình.

## 4. Người khác thấy gì

Theo luật 20/11 11:31 ("nhân vật trên màn hình người khác hiển thị cái gì thì mọi người đều thấy cái đó"): mỗi nhát đâm, xuyên, mỗi thức gửi một tin `hu-tp-<thức>`
(hướng ra đòn) qua một cửa `src/game/phat.js`; máy người xem dựng lại đúng màn diễn đó bằng hình vũ khí của người ra đòn (`src/game/dien.js` `hieuUng`), chọn mục tiêu
trong số quái mình đang thấy, chỉ vẽ và kêu, không trừ máu. Vũ khí sau lưng họ giấu đi trong lúc làm thức. Người khác ở xa ngoài màn thì không dựng; cùng lúc tối đa
8 màn diễn của người khác (máy yếu 3). Không đổi máy chủ phòng (nhóm tin `hu` có sẵn).

**PvP:** mỗi nhát của chuỗi (kể cả thức) vẫn là một nhát chém thường với người chơi khác (`p.swingT`, `src/game/pvp.js`), máy chủ phòng tính như cũ. Thức không trúng
người chơi.

## 5. Chỗ code

- Số, chữ: `data/than-phap.json`.
- Luật: `src/game/than-phap.js` (chuỗi nhát `tpNhat`, ra đòn của mình `tpRa`, ô khảm `tpO` / `tpDat`, mở thức `tpThuc`, truyện dạy `tpHoc` (lệnh `{ "than_phap": "<mã>" }`
  trong `data/story.json`), diễn thử `tpDien`, nhịp `tpTick`, tin cho người xem); `src/game/than-phap-cu.js` (tìm quái, một lần trúng `danh`, hạt sáng, tiếng, lịch
  màn diễn); `src/game/than-phap-thuc.js` (đâm, xuyên, Vạn Ảnh, Thu Võng), `src/game/than-phap-thuc2.js` (Thiên Kiếm Trấn, Bách Thứ, Huyền Vực, Khai Thiên), `src/game/than-phap-thuc3.js` (Vạn Diệp, 23/11/2026), `src/game/than-phap-thuc4.js` (Vạn Kiếm Quy Trủng, Bách Luyện Thiên Chùy, 26/11/2026).
- Hình: `src/render/draw-than-phap.js`, `draw-than-phap2.js`, `draw-than-phap3.js` (Vạn Diệp), `draw-than-phap4.js` (hai thức Thiên Kim), công cụ vẽ chung `draw-tp-cu.js` (vũ khí của người diễn, bóng sáng, đường, vòng, quầng); vẽ ở lớp trên
  cùng (`src/render/draw.js`, trên cả lớp tối ban đêm).
- Nối vào: `src/game/player.js` (swing gọi `tpNhat` / `tpRa`; nhát đâm đâm xa bằng `q.R`; `tpTick` mỗi nhịp), `src/game/flyweapon.js` (`startStrike` nhận động tác ép),
  `src/render/draw-flyweapon.js` (giấu vũ khí bay khi đang làm thức; `blit` dùng chung), `src/game/story.js` (lệnh `than_phap`), `src/core/data.js` (nạp tệp).
- Giao diện: `src/ui/than-phap-view.js` + `than-phap.css`, gắn ở `src/ui/self-panel.js`, `self-bag.js` (mục `than-phap`).
- Bài thử: `tools/than-phap.test.mjs` (trong `tools/check.mjs`): dữ liệu, mở thức, ô khảm, chuỗi; mỗi thức chạy hết trong game giả, tổng sát thương vào một con đúng
  số khai; chuỗi không lố tay; đám đông; máy người xem không trừ máu; Thu Võng kéo đúng con; đổi bản đồ giữa chừng thì thôi trúng; tiếng có thật; truyện dạy thức có thật.
- Bản lưu: `save.tpO` (hai ô), `save.tp` không lưu (nhịp chuỗi ở `player.tp`), cờ `tp-thu-vong`, `tp-thien-tran`, `tp-nhac`. Máy chủ không cần kiểm: thức mở
  theo cờ truyện / cảnh giới vốn đã có trong bản lưu.

## 6. Còn chờ chủ dự án

1. **Xem clip, chấm từng thức** (hình, màu, tiếng, nhịp). Muốn đổi thức nào thì nói tên thức.
2. **Đẩy lên**: nói "đẩy lên" thì mới đẩy nhánh và mở một PR; đợt này đi chung với truyện Hàn Băng (nhiệm vụ 28–39), mà truyện cần áp migration
   `20261122060000_p2d_tn_han_bang.sql` TRƯỚC khi gộp (mốc sách theo nhiệm vụ mới, `docs/14-TRAN-MA-KY.md` phần B).
3. Huyền Vực Tỏa Hồn: đã cho Mặc Ảnh dạy ở nhiệm vụ 49 (truyện Hắc Phong, 22/11/2026): "Ma tộc khoá người bằng thức này. Ngươi lấy nó mà khoá ma."
4. Đo lại quái bằng Tự đánh thật sau khi có cả Kỹ năng và Thân pháp.
5. Hình ảnh mẫu GPT cho thức nào muốn đẹp hơn nữa (chỉ làm mẫu, hiệu ứng vẫn vẽ bằng code theo luật "ai làm hình gì").
