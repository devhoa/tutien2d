# Tiềm năng và Kỹ năng

Chủ dự án 21/11/2026 17:23: "trc mắt là kỹ năng và tiềm năng". Làm trên nhánh `tran-ma-ky`, máy tạm, **chưa đẩy lên GitHub, chưa đổi máy chủ**.
Phần này nói thiết kế đã chốt, số đang dùng, chỗ code, việc còn chờ chủ dự án. Quyết định và lời gốc ghi ở `CLAUDE.md`.

**Đổi tên 23/11/2026 22:47** (chủ dự án: "đổi cái chữ tiềm năng trong game thành huyết mạch đi"): người chơi thấy mục **Huyết mạch**, **điểm huyết mạch** (data/tiem-nang.json → text, Túi đồ → Huyết mạch, nhật ký Linh Thạch "Tẩy điểm huyết mạch"). Tên trong code, bản lưu (`save.tiem`), máy chủ (`p2d_tiem_*`), tên tệp giữ chữ `tiem` / Tiềm năng, không đổi. Câu đùa của Hệ Thống "ký chủ có chút tiềm năng" (nhiệm vụ tầng 7) là nghĩa thường, giữ. Tộc huyết mạch cũng là chữ đầu của **phong hào** trước tên (`docs/03-CAU-TRUC.md` mục "Phong hào").

## 1. Lời chủ dự án

- 17:23: "Tiềm năng là có thể lựa chọn khởi đầu random vài chỉ số cơ bản, mà trong đó random sẽ có ngẫu nhiên chọn đc tộc. Linh tộc, cổ tộc. Thần tộc yêu tộc hư tộc, nhân tộc, tiên tộc vân vân, và mỗi tộc sẽ có chỉ số random khác nhau lợi thế sức mạnh khác nhau, và sau này muốn đổi tộc sẽ phải làm 1 số nghi lễ phức tạp, hiện tại thì chưa đổi được. Và mỗi khi đột phá một đại cảnh giới đều có điểm tiềm năng để cộng thêm cho nhân vật."
- 17:23: "kỹ năng, cách chiến đấu và skill thì sẽ mở thêm 1 ô bên cạnh ô công pháp, mà ở đây, b sẽ tự code ra kỹ năng phù hợp vs các tình huống, và giai đoạn truyện hợp lý để mở khoá kỹ năng, kỹ năng cũng có thể nâng cấp và mở rộng giống như khảm thêm tính chất cho pháp bảo."
- 17:23: "Tiềm năng cùng hàng với kho, trang bị, linh thú.. nằm ngay dưới ô trang bị. Còn kỹ năng thì nằm trong phần công pháp."
- Bảng câu hỏi 21/11 tối: nút kỹ năng "3 ô hàng dọc sát mép phải phía dưới bên trên khung dưới"; các tộc "khác hướng, ngang sức"; quay "1 lượt duy nhất"; truyện "chờ xong cả ba" rồi đẩy một lần.
- Bảng câu hỏi 22/11 rạng sáng: kỹ năng là "bộ mới theo truyện" (48 chiêu cũ vẫn xoá như đã bảo 13/11 và 21/11 00:10); nâng cấp: "Merger 2 cuốn thành 1 cuốn cấp 2, cứ gấp đôi lên".
- Bảng câu hỏi kế: nguồn sách "Chỉ làm nhiệm vụ tiến độ để nhận, sẽ nhận theo mốc chẵn 5 10 15"; máy chủ "Viết, chạy thử, chờ anh duyệt"; đẩy "Chờ xong phần máy chủ".

## 2. Tiềm năng

**Huyết mạch.** Cây Thế Giới gọi tên tộc. Một đời một lượt, quay xong ghi vào bản lưu rồi mới mở màn lễ (thoát giữa lễ cũng không quay lại được).
**Từ 25/11/2026 (chủ dự án 12:55: "sửa lại huyết mạch thì trúc cơ là thức tỉnh"; `docs/20-THE-CHAT.md` mục 5): huyết mạch thức tỉnh khi đột phá Trúc Cơ** (`le.mo` = 1, tính theo cảnh giới cao nhất từng đạt). Lúc màn hình yên đủ 4 giây (không thoại, không bảng, không quái đang đuổi), Hệ Thống báo rồi mở lễ, đúng một lần. Ai đã có huyết mạch từ trước (kể cả đang Luyện Khí) thì giữ nguyên. Lệnh truyện `{ "le_toc": "truong-thon" }` sau lễ linh căn ở Thanh Khê vẫn nằm trong `data/story.json` nhưng với người Luyện Khí thì bỏ qua. (Trước 25/11: lễ làm ngay sau lễ linh căn, trưởng thôn đứng lễ.) Thể chất, thức tỉnh ở Kim Đan, hiện cạnh ô Huyết mạch: `docs/20-THE-CHAT.md`. Lễ tự mở chỉ khi người chơi vừa chạm màn trong `le.co_mat_s` 15 giây (`src/game/co-mat.js`, 25/11/2026 17:0x): đang treo máy thì lễ chờ họ quay lại.

| Tộc | Tỉ lệ | Hướng chỉ số | Thiên phú |
|---|---|---|---|
| Nhân tộc | 34% | Công, Sinh lực, Thủ đều nhau | |
| Linh tộc | 22% | Hồi chiêu, Công, Bạo kích | |
| Yêu tộc | 20% | Hút máu, Bạo kích, Công | |
| Cổ tộc | 12% | Sinh lực, Thủ, Phản đòn | Thân Thượng Cổ: tự hồi 0,25% Sinh lực mỗi giây |
| Hư tộc | 8% | ST bạo, Bạo kích, Hồi chiêu | Hư Bộ: Lướt hồi nhanh hơn 20% |
| Thần tộc | 3% | Công, ST bạo, Sinh lực | Thần Huyết: máu dưới 30% thì hồi ngay 20%, 120 giây một lần |
| Tiên tộc | 1% | Hồi chiêu, Sinh lực, Công | Tiên Cốt: tốc tu +6%, Linh lực tối đa +10% |

**Ngang sức.** Mọi tộc quay chung một khoảng 6–10 điểm, chỉ khác chia vào chỉ số nào (mỗi phần lệch ngẫu nhiên ±25%). Một điểm đổi ra % bằng tỷ giá riêng `quy` (Công 1%, Sinh lực 1,9%, Thủ 3,6%, Bạo kích 0,6%, ST bạo 5,5%, Hồi chiêu 1,25%, Hút máu 1,25%, Phản đòn 1,3%), chọn sao cho một điểm vào chỉ số nào cũng thêm chừng 0,43–0,46% lực chiến trên tu sĩ chuẩn. Đo 21/11: huyết mạch thêm 2,5–4,5% lực chiến; người hên nhất của tộc này hơn người xui nhất của tộc kia 2,5%. Không dùng thẳng tỷ giá dòng `line_f` của `data/he-chien.json` vì theo công thức lực chiến 20/11 nó không còn ngang nhau (thử ra 8,8% lệch, tộc thiên về bạo kích hơn hẳn).

**Điểm tiềm năng.** 5 điểm mỗi lần đột phá đại cảnh giới, tính thẳng từ cảnh giới đang ở (người chơi cũ tự có đủ, không cần phát bù). Mỗi điểm cộng 0,6 điểm quy vào một trong 6 chỉ số (Công, Sinh lực, Thủ, Bạo kích, ST bạo, Hồi chiêu), mỗi chỉ số tối đa 20 lần (Hồi chiêu 10). Tẩy điểm: lần đầu miễn phí, sau đó 3 000 × 1,6^cảnh giới Linh Thạch. Lễ đột phá có dòng "Điểm tiềm năng +5", ra khỏi lễ nhắc nếu còn điểm chưa dùng.

**Trần.** Cộng vào chỉ số như một nguồn thưởng nhỏ có trần (`data/he-chien.json → extra_cap.tiem` 24, theo Công % tương đương, mỗi chỉ số). Bản lưu sửa tay: chỉ nhận chỉ số thuộc hướng của tộc, tổng gốc không quá 10, điểm cộng không quá số có và trần (`tools/tiem-nang.test.mjs` thử).

**Giao diện.** Bảng Nhân vật, mục **Tiềm năng** ngay dưới Trang bị: ấn tộc, tên, độ hiếm, lai lịch, chỉ số trời cho, thiên phú; điểm còn / có; mỗi chỉ số một dòng "đang có → cộng thêm thì thành", nút +; nút tẩy điểm chạm hai lần.

## 3. Kỹ năng

**Vị trí trong lối đánh.** Đánh thường liên tục; kỹ năng hồi 9–14 giây, mỗi phát bằng khoảng 2–3 nhát chém; pháp bảo hồi 60–150 giây là đòn lớn. Ba ô kỹ năng tròn xếp dọc sát mép phải, ngay trên khung dưới; có kỹ năng thì Lướt, Tự đánh, nút việc lùi sang trái nhường chỗ. Chạm: tự ngắm; vuốt: chọn hướng. Tự đánh tự ra kỹ năng đã hồi. Vào được Sắp xếp giao diện (nhóm "Kỹ năng").

**Bộ kỹ năng theo truyện** (`data/ky-nang.json → chieu`). Mỗi kỹ năng do một người trong truyện dạy. Bộ máy ra chiêu và hiệu ứng dùng lại của game; kỹ năng mượn hiệu ứng, biểu tượng, tiếng của một chiêu có sẵn (`hinh`), trừ kỹ năng đã có màn diễn riêng (`ve`, xem đoạn "Màn diễn riêng" bên dưới). Không ghi vào `data/skills.json`: lúc nạp game `knNap` đưa vào bảng chiêu, nên bảng cấu hình máy chủ không đổi và đợt xoá 48 chiêu cũ chỉ cần giữ lại phần bộ máy.

| Nhiệm vụ | Ai dạy | Kỹ năng |
|---|---|---|
| 18 Dấu vết | Trưởng lão Vân Hạc, ngay sau câu hỏi "Ngươi đứng đây vì ai?" | Phá Vân Thức: kiếm khí xuyên thẳng |
| 22 Thẻ tên (cảnh tôi lưỡi) | Lão Thiết: linh căn theo lửa lò vào lưỡi thép | theo hệ: Viêm Nhận (lửa nổ lan), Hàn Nhận (băng làm chậm), Đằng Nhận (dây trói), Kim Nhận (ba lưỡi quạt), Thạch Nhận (choáng quanh mình) |
| 26 Người ở lại | Lão Thiết chỉ bước chân của A Lực | Liệp Phong Bộ: lao tới chém xuyên |
| 65 Về cội (Thanh Mộc, 23/11/2026) | Thanh Diệp, thức Diệp Nương dạy cô từ thuở bé | Mẫu Thụ Tán: vùng tán Cây mẹ quanh mình 5 giây, mỗi 0,5 giây quái bên dưới mất máu (0,14) và bị níu chân, mình đứng dưới tán hồi 1,2% máu tối đa mỗi nhịp; kiểu `zone` (`src/game/zones.js`), mượn hình và tiếng Thanh Mộc Lĩnh Vực. Khảm được Tốc Kích, Tiết Linh, Trọng Kích, Khoáng Vực (không Chấn Ý: vùng đánh mỗi 0,5 giây thành choáng mãi) |
| 79 Vạn kiếm về mộ (Thiên Kim, 26/11/2026) | Thiết Lan, nhịp búa ông nội (Lão Thiết) dạy cô | Lạc Chùy: một búa lửa lò giáng xuống chỗ trước mặt (0,95, bán kính 34), choáng 0,8 giây; kiểu `aoe`, mượn hình và tiếng Lôi Đình Nhất Kích |
| 82 Dải vải trắng (Thiên Kim, 26/11/2026) | Kiếm Lão, trận giữ mộ sáu mươi năm | Trấn Trủng Kiếm Trận: vòng kiếm quang bán kính 34 đi theo người 5 giây, mỗi 0,33 giây chém quái trong vòng (0,16 mỗi nhịp, cả vòng chừng 2,4); kiểu `zone` có `follow`, mượn hình và tiếng Kim Luân Trảm |

**Màn diễn riêng của ba kỹ năng đầu game (26/11/2026).** Chủ dự án 16:22: "nhiều người chê 3 kỹ năng đầu game yếu, nhìn không đẹp và nhỏ, không đủ lực chưa đủ đã"; bảng chọn: **"Chỉ làm hiệu ứng"** (hình, tiếng, rung; số sát thương và vùng trúng giữ nguyên). Trước đó Phá Vân Thức, năm kỹ năng theo hệ của Lão Thiết, Liệp Phong Bộ mượn hình chiêu cũ nên chỉ là một viên đạn chừng 12 điểm hay một cụm nổ nhỏ. Nay kỹ năng nào khai `ve` trong `data/ky-nang.json` thì có màn diễn vẽ bằng code (luật "ai làm hình gì": hiệu ứng chiêu do AI làm bằng code, không tốn credit), không mượn hình của `hinh` nữa (vẫn mượn biểu tượng):

| `ve` | Kỹ năng | Màn diễn |
|---|---|---|
| `pha-van` | Phá Vân Thức | lưỡi kiếm khí trắng lam dài chừng 56 điểm, vành lưỡi liềm ở mũi, hai vệt gió rẽ ra phía sau; mỗi con bị xuyên một vệt chém; hết đường tan thành vòng sáng |
| `viem` | Viêm Nhận | lưỡi lửa lưỡi liềm kéo đuôi lửa; trúng thì nổ: quả cầu lửa, cột lửa bật lên, lưỡi lửa toả, vòng sóng đúng bán kính nổ thật, tàn lửa, khói, vết cháy |
| `han` | Hàn Nhận | mũi băng sáu cạnh kéo dải sương; trúng thì vỡ thành bảy mảnh băng toả ra, vòng sương, hoa tuyết dưới chân quái, tuyết rơi |
| `dang` | Đằng Nhận | trận xanh hai vành xoay ngược đúng bán kính trúng, mười dây leo có gai trồi lên đung đưa rồi rút xuống, lá bay; mỗi con trúng bị dây quấn quanh thân (dây bám theo con quái) |
| `kim` | Kim Nhận | quạt kim quang lúc tung, ba lưỡi thoi vàng kéo vệt sáng dài, tia loé ở mũi; mỗi con trúng một dấu chém chéo |
| `thach` | Thạch Nhận | đất nứt, sóng chấn, mười sáu gai đá trồi lần lượt từ trước mặt vòng ra sau (có đà vọt lên) rồi sụp xuống, bụi đá |
| `liep` | Liệp Phong Bộ | dải gió dọc đường lướt, bóng mờ nối đuôi, vòng gió ở chỗ xuất phát, nhát chém chéo ở cuối đường; mỗi con trúng một vệt chém |

Luật của màn diễn: hình vẽ trung thực với vùng trúng (vòng nổ, trận, vòng gai vẽ đúng bán kính trong data; đạn to hơn bề rộng trúng nhưng đi đúng đường); không khựng hình, chỉ rung nhẹ và chỉ ở máy người ra chiêu; hạt tối đa 240 (máy đã tự hạ mức thì 120), màn diễn tối đa 70, tự hết sau chừng 1 giây; đổi bản đồ thì dọn. Tiếng riêng `kn.*` (9 tiếng, `tools/sfx_chieu.py`): thân là gió xé và tiếng nện, không dùng kim loại ngân, pha lê cao; nay cả lúc quái trúng Đằng Nhận, Thạch Nhận, Liệp Phong Bộ cũng có tiếng. Người khác cùng tinh cầu thấy đủ (đi chung đường tin chiêu; máy họ vẽ đường lướt theo hướng và quãng lướt vì tin tới lúc người kia còn ở đầu đường). Thêm màn diễn cho một kỹ năng khác: khai `ve`, thêm một mục ở `TUNG` (và nhánh trong `knHit` / `knMobHit`) trong `src/game/kn-fx.js`, bộ vẽ ở `src/render/draw-kn-fx.js` (`DAN` đạn đang bay, `VE` màn tung / trúng), tiếng ở bảng `BY` của `tools/sfx_chieu.py`; `tools/kn-fx.test.mjs` sẽ báo thiếu chỗ nào.

**Sách, ghép sách.** Mỗi kỹ năng là những cuốn sách có cấp (`save.knSach { mã: [số cuốn cấp 1, cấp 2, ...] }`). Truyện phát cuốn đầu. Xong mỗi 5 nhiệm vụ chính (5, 10, 15...) nhận 1 **sách trống** (`save.knTrong`, `save.knMoc` số mốc đã nhận), chép vào kỹ năng nào đã học cũng được; người đã qua mốc nhận bù ngay khi vào game (người đang ở nhiệm vụ 23 nhận 4 cuốn). Hai cuốn cùng cấp ghép thành một cuốn cấp trên ("cứ gấp đôi lên": cấp n cần 2^(n−1) cuốn cấp 1), tối đa cấp 10. Mỗi cấp trên 1: sát thương +8%.

**Khảm tính chất** (như khảm chiêu vào pháp bảo). Ô thứ 1, 2, 3 mở khi sách đạt cấp 2, 4, 6. Khảm, tháo tự do; không khảm trùng; mỗi tính chất hợp vài kiểu kỹ năng:

| Tính chất | Tác dụng | Mở ở |
|---|---|---|
| Tốc Kích | hồi chiêu nhanh hơn 12% | ngay |
| Tiết Linh | tốn ít linh lực hơn 30% | ngay |
| Trọng Kích | sát thương +15%, hồi chiêu chậm hơn 10% | Trúc Cơ 1 |
| Khoáng Vực | vùng trúng rộng thêm 20% | Trúc Cơ 1 |
| Hàn Ý | trúng thì chậm 1,5 giây | Trúc Cơ 5 |
| Xuyên Thấu | đạn xuyên quái, sát thương còn 85% | Trúc Cơ 5 |
| Tỏa Nhánh | tách 3 hướng, mỗi nhánh 55% | Kim Đan 1 |
| Chấn Ý | trúng thì choáng 0,4 giây, hồi chậm hơn 15% | Kim Đan 5 |

**Giao diện.** Bảng Nhân vật → Công pháp → mục **Kỹ năng** (mục này mở lại khi có Kỹ năng; trước đó ẩn từ 12/11): ba ô đang mang, các kỹ năng của người chơi (chưa học thì mờ, "mở theo nhiệm vụ chính"), chạm một kỹ năng: mô tả, mang vào ô, sách đang có và nút ghép, khảm tính chất.

## 4. Chỗ code

- Tiềm năng: `data/tiem-nang.json`; `src/game/tiem-nang.js` (quay, kẹp, điểm, thiên phú), `src/game/le-toc.js` (lễ), `src/ui/le-toc.js` + `.css` (màn lễ), `src/ui/tiem-nang-view.js` + `tiem-nang.css` (mục Tiềm năng); nối vào `stats.js` / `he-chien.js` (`ext.tiem`), `player.js` (Lướt, thiên phú), `len-tang.js` (dòng điểm khi đột phá).
- Kỹ năng: `data/ky-nang.json`; `src/game/ky-nang.js` (nạp, sách, khảm, số liệu ra chiêu); `src/ui/ky-nang-hud.js` + `ky-nang-hud.css` (ba nút, mục Kỹ năng), `src/ui/ky-nang-view.js` (mục Kỹ năng); nối vào `player.js` (lệnh `sk0–sk2`, `player.knCd`), `auto.js`, `draw-aim.js`, `skills.js castSkill(game, id, def)`, `mana.js`, `index.html` (`#btn-k0..2`), `self-panel.js`, `self-bag.js`, `story.js` (lệnh `ky_nang`).
- Màn diễn riêng (`ve`): `src/game/kn-fx.js` (trạng thái `game.knFx`: màn đang diễn, hạt; nối qua ba cửa `vfxCast`, `vfxHit`, `vfxMobHit` của `src/game/vfx.js`, công thức `{ kn }` do `knNap` đặt), `src/render/draw-kn-fx.js` (vẽ ở lớp trên cùng, cạnh Thân pháp; không nhập gì của trình duyệt để bài thử Node chạy được).
- Bài thử: `tools/tiem-nang.test.mjs`, phần Kỹ năng trong `tools/truyen.test.mjs`; `tools/kn-fx.test.mjs` (số sát thương, vùng trúng của bảy kỹ năng đầu game được ghim; mỗi kiểu `ve` đủ màn tung, màn trúng, bộ vẽ; không đưa số hỏng vào khung vẽ); cả ba chạy trong `tools/check.mjs`. Trình duyệt: `tools/kiem/ky-nang-ve.thu.mjs` (bấm ba nút cho cả bảy kỹ năng; chạy trong CI).

## 5. Còn chờ chủ dự án

1. **Máy chủ: đã viết, đã chạy thử, CHƯA ÁP** (`supabase/migrations/20261122030000_p2d_tiem_ky_nang.sql`): bảng `p2d_tiem_nang` giữ huyết mạch, hàm `p2d_quay_toc()` (máy khách gọi lúc làm lễ, `src/net/tiem-nang.js`), trigger `p2d_kiem_tiem_kn` kẹp điểm tiềm năng và kiểm tổng sách kỹ năng (sách quy cấp 1 + sách trống ≤ khoá học đã mở + mốc nhiệm vụ theo bước truyện), sai thì giữ bản cũ, trả về máy khách (`p2d.sua` → `tiem`, `kn`; `src/game/cloud-guard.js`), nghi vấn `tiem` / `kn_sach`. Chạy thử 22/11 trên máy chủ thật trong giao dịch huỷ ngược: tự kiểm tra đạt hết (3 000 lượt quay, sửa tộc, điểm lố, sách lố, mã lạ, sách trống lố, mốc lố); 396 nhân vật đã thức tỉnh sẽ được làm lễ; 0 bản lưu đang mang dữ liệu này; soát lại sau đó không còn gì sót. **Thứ tự đưa lên: áp migration trước rồi mới gộp PR**; gộp trước thì lễ quay tại máy và chưa có kiểm.
2. **Nguồn sách thêm**: đã làm theo lời chủ dự án (mốc 5, 10, 15 nhiệm vụ chính).
3. **Đo lại quái**: ba kỹ năng dùng đều tay thêm khoảng 40% sát thương so với chỉ đánh thường; đo bằng Tự đánh thật như đợt 16/11 rồi trình số.
4. **Nghi lễ đổi tộc**, hình nhân vật riêng từng tộc: để sau.
