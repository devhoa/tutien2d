# Lệnh GPT: icon còn thiếu (soát 25/11/2026)

Soát `data/` với `data/art.json` (mọi món đồ, đan, nguyên liệu, ngọc, cá, mồi, cần, món ăn, công pháp, pháp tượng, kỹ năng, quà Hòm thư):

- **10 nhẫn** chưa có ảnh kiểu mới `ui.vk-<mã>`: game đang dùng hình Canva cũ 22 điểm (`gear.*`) hoặc hình ô nhẫn chung.
- **Thú Lệnh, Điểm Quản trị viên**: code đã gọi `ui.ic-thu-lenh`, `ui.ic-qtv` nhưng chưa có ảnh (thư hiện ô trống).
- **4 nguyên liệu** chưa có ảnh: Mảnh Vỡ Tinh Cầu, Kẹo Gậy, Bao Lì Xì, Kẹo Bí Ngô (game tô ô vuông màu).
- **8 kỹ năng** đang mượn biểu tượng chiêu cũ 16 điểm dùng chung (Phá Vân Thức và Kim Nhận cùng một hình, Đằng Nhận và Mẫu Thụ Tán cùng một hình).
- Pháp bảo Phi Kiếm, Bảo Phiến, Đồng Chung mượn hình hiệu ứng / vũ khí bay; 5 pháp bảo kia là hình điểm ảnh trong game nên chưa đưa vào bảng (hỏi chủ dự án).

Cách dùng: mỗi bảng dán **một** lệnh vào ChatGPT, **gửi kèm ảnh `nguon/ai/ui/ren-1.png`** (bảng đá tinh luyện, Đạo Vận Thạch, Bí Kíp…) để GPT bắt nét cho đồng bộ. Nhận ảnh về thì gửi lại cho AI theo số bảng (`icon-a.png`, `icon-b.png`); AI cắt theo thứ tự ở cuối mỗi bảng bằng `tools/art/ui_vu_khi.py` (`LUOI`).

## Bảng A: nhẫn, lệnh bài, nguyên liệu (16, lưới 4 × 4)

```
Make ONE image: a 4x4 grid sheet of 16 game icons (4 rows x 4 columns), square, high resolution.
Style: exactly the same style as the attached icon sheet: chunky cartoon fantasy game icons, thick dark outline, bold saturated colors with soft shading, small white highlights and a soft colored glow, Chinese xianxia (cultivation) fantasy flavor. Each icon centered in its own cell, all icons the same size, seen at a slight 3/4 angle. Plain pure white background, wide empty space between icons. No text, no letters, no numbers, no grid lines, no frames, no labels.
Icons, left to right, top to bottom:
Row 1:
1. Iron Ring: a plain sturdy dark-grey iron ring with a small square grey stone, a few rivets, very simple and humble.
2. Spirit Jade Ring: a slim silver ring set with a round milky green jade, a faint jade-green glow.
3. Crimson Flame Ring: a red-gold ring with a fiery orange-red gem, small flames curling around the band.
4. Frost Ice Ring: a pale silver-blue ring with an ice crystal gem, frost spikes and snowflake sparkles.
Row 2:
5. Black Wind Ring: a dark gunmetal ring with a smoky black-violet gem, wisps of dark wind swirling around it.
6. Green Wood Ring: a ring made of twisted living green vine and wood, a small leaf and an emerald bud gem.
7. Vajra Diamond Ring: a heavy bright gold ring with a large faceted clear diamond, golden sparkles.
8. Earth Ring: a thick brown-bronze ring with a rough amber-ochre stone, little pebbles floating around.
Row 3:
9. Dao Rhythm Ring: a precious ornate gold ring with a glowing yin-yang gem, golden rune ring orbiting it, warm golden aura (rare, the fanciest ring).
10. Great Void Ring: a dark indigo ring with a gem like a tiny starry night sky, violet void cracks and stars around it.
11. Shattered Planet Shard: a jagged violet crystal fragment broken off a small planet, cracked rocky crust on one side, purple glow and a few floating debris bits.
12. Beast Command Token: an orange-gold hanging command tablet (ling pai) with a carved roaring beast head emblem and a red tassel, warm orange glow.
Row 4:
13. Moderator Merit Badge: a round cyan-blue and silver badge medal with a star emblem in the center and two small wings on the sides, light cyan glow.
14. Candy Cane: a red and white striped candy cane with a small green holly leaf and a tiny bell, festive winter glow.
15. Red Envelope: a Lunar New Year red envelope (li xi) with gold trim and a gold coin pattern seal, a few gold sparkles.
16. Pumpkin Candy: a round orange pumpkin-shaped candy wrapped in twisted orange and purple wrapper ends, little sparkles.
```

Thứ tự mã: `ui.vk-thiet-gioi ui.vk-linh-ngoc-gioi ui.vk-xich-diem-gioi ui.vk-han-bang-gioi / ui.vk-hac-phong-gioi ui.vk-thanh-moc-gioi ui.vk-kim-cang-gioi ui.vk-hau-tho-gioi / ui.vk-dao-van-gioi ui.vk-thai-hu-gioi ui.vk-manh-vo-tinh-cau ui.ic-thu-lenh / ui.ic-qtv ui.vk-keo-gay ui.vk-bao-li-xi ui.vk-keo-bi`

## Bảng B: kỹ năng (8, lưới 4 cột × 2 hàng)

Kỹ năng hiện trong ba nút tròn ở mép phải màn chơi và mục Kỹ năng (bảng Nhân vật → Công pháp), nên vẽ thành biểu tượng chiêu (không phải cuốn sách như công pháp).

```
Make ONE image: a grid sheet of 8 game skill icons in 2 rows x 4 columns, wide landscape, high resolution.
Style: exactly the same style as the attached icon sheet: chunky cartoon fantasy game icons, thick dark outline, bold saturated colors with soft shading, small white highlights and a soft colored glow, Chinese xianxia (cultivation) fantasy flavor. Each icon is a SKILL SYMBOL (an action or spell shape), NOT a book, NOT a scroll, NOT a character, centered in its own cell and fitting inside a circle, all icons the same size. Plain pure white background, wide empty space between icons. No text, no letters, no numbers, no grid lines, no frames, no labels.
Icons, left to right, top to bottom:
Row 1:
1. Cloud-Splitting Strike: one straight bright white-blue sword qi slash cutting through a small grey cloud, the cloud split in two, speed lines.
2. Flame Edge: a curved blade-shaped crescent of orange-red fire with a small burst of flame at its tip.
3. Frost Edge: a sharp spear-tip of blue ice flying forward with a frosty trail and small snowflakes.
4. Vine Edge: green thorny vines bursting up from the ground in a spiral, coiling as if to bind, small leaves.
Row 2:
5. Golden Edge: three thin golden blade lights spreading out in a fan shape, metallic sparkles.
6. Stone Edge: a blade stabbed into cracked brown ground, a shockwave ring of rocks and dust bursting outward.
7. Wind-Hunter Step: a fast dashing hunter's footprint with green-white wind streaks and a short slash trail, sense of speed.
8. Mother Tree Canopy: a small glowing green tree canopy spreading like an umbrella, golden-green leaves falling and roots glowing below.
```

Thứ tự mã: `pha-van-thuc viem-nhan han-nhan dang-nhan / kim-nhan thach-nhan liep-phong-bo mau-thu-tan` (lưu thành `ui.vk-<mã>`; `src/ui/hud.js` skillIcon và `src/ui/ky-nang-view.js` tìm hình này trước).

**Đã lắp 25/11/2026** (`tools/art/ui_icon_thieu.py`, ảnh `nguon/ai/ui/icon-a.png`, `icon-b.png`).

## Bảng C: 8 pháp bảo (lưới 4 cột × 2 hàng; chủ dự án 25/11/2026 chọn vẽ lại cả 8 cho đồng bộ)

Gửi kèm ảnh `nguon/ai/ui/icon-a.png` (bảng nhẫn vừa làm) để GPT vẽ cùng nét. Icon ô pháp bảo hiện tại là hình `pb.*` / mượn hiệu ứng; hình mới sẽ là `ui.vk-pb-<loại>` (thay `types.*.icon` trong `data/phap-bao.json`), hình pháp bảo bay ra lúc đánh giữ nguyên.

```
Make ONE image: a grid sheet of 8 game item icons in 2 rows x 4 columns, wide landscape, high resolution.
Style: exactly the same style as the attached icon sheet: chunky cartoon fantasy game icons, thick dark outline, bold saturated colors with soft shading, small white highlights and a soft colored glow, Chinese xianxia (cultivation) fantasy flavor. Each icon is a single magic treasure OBJECT (no character, no hand), centered in its own cell, seen at a slight 3/4 angle, all icons the same size. Plain transparent or pure white background, wide empty space between icons. No text, no letters, no numbers, no grid lines, no frames, no labels.
Icons, left to right, top to bottom:
Row 1:
1. Flying Sword: an elegant slim silver-blue jian sword pointing up-right, glowing cyan blade edge, a small blue tassel on the hilt, faint sword-qi streak behind it.
2. Spirit Pearl: a large glowing pale-gold and white orb held in a small ornate golden lotus-shaped stand, soft radiant halo.
3. Treasure Fan: a half-open green-and-gold folding fan with jade ribs and swirling wind lines coming off its edge.
4. Great Seal: a heavy square bronze-gold seal stamp with a carved beast-knot handle on top and glowing red rune engravings on its base.
Row 2:
5. Guardian Shield: a round bronze-and-teal shield with a golden turtle-shell pattern and a soft protective blue barrier glow.
6. Bronze Bell: an ancient green-bronze temple bell with engraved patterns, small visible sound-wave ripples around it.
7. Formation Banner: a small battle banner on a pole, purple flag with golden trigram pattern and fringe, fluttering.
8. Spirit Gourd: a dark red-and-gold calabash gourd with a cord around its waist, a swirl of green spirit mist coming out of its mouth.
```

Thứ tự mã: `pb-phi-kiem pb-linh-chau pb-bao-phien pb-dai-an / pb-ho-thuan pb-dong-chung pb-tran-ky pb-ho-lo`.

**Đã lắp 25/11/2026** (ảnh `nguon/ai/ui/icon-c.png`, `ui.vk-pb-<loại>`, `data/phap-bao.json → types.*.icon`; hình pháp bảo bay ra lúc đánh không đổi).
