# Lệnh GPT: ảnh câu cá (24/11/2026)

73 hình còn thiếu cho câu cá mới: 23 cá, 12 tôm cua ốc sứa mực, 5 trai sò, 3 châu, 7 bảo vật chìm, 9 mồi, 7 cần, 7 món ăn.
13 cá cũ đã có ảnh (`nguon/ai/ui/ca-1.png`) giữ nguyên. Trong lúc chờ, game vẽ tạm bằng code (`src/render/ca-hinh.js`).

Cách dùng: mỗi bảng dán **một** lệnh dưới đây vào ChatGPT, **gửi kèm ảnh bảng cá cũ `ca-1.png`** để GPT bắt nét cho đồng bộ. Bảng 1–4 là lưới 4 × 4, bảng 5 là
3 × 3. Nhận ảnh về thì gửi lại cho AI theo số bảng (cau-1.png … cau-5.png); AI cắt từng ô theo thứ tự ở cuối mỗi bảng (trái sang phải, trên xuống dưới) bằng
`tools/art/ui_vu_khi.py` (thêm vào `ROWS`), đưa vào `data/art.json` thành `ui.vk-<mã>`.

Phần nét chung (đã có sẵn trong từng lệnh):

> Cute fantasy pixel-art game icons in exactly the same style as the attached fish icon sheet: chunky pixel art, thick dark outline, soft shading with 3–4 tones
> per color, small white highlights, creatures with one big round cute eye and facing LEFT, Chinese xianxia (cultivation) fantasy flavor. Each icon centered in
> its own cell, all icons the same size. Plain pure white background, wide empty space between icons. No text, no numbers, no grid lines, no frames, no labels.

## Bảng 1: cá (16)

```
Make ONE image: a 4x4 grid sheet of 16 game icons (4 rows x 4 columns), square, high resolution.
Style: cute fantasy pixel-art game icons in exactly the same style as the attached fish icon sheet: chunky pixel art, thick dark outline, soft shading with 3-4 tones per color, small white highlights, creatures with one big round cute eye and facing LEFT, Chinese xianxia (cultivation) fantasy flavor. Each icon centered in its own cell, all icons the same size. Plain pure white background, wide empty space between icons. No text, no numbers, no grid lines, no frames, no labels.
Icons, left to right, top to bottom:
Row 1:
1. Silver Minnow: a small slim silver fish with a pale blue-grey shine and a few tiny bubbles.
2. Mossback Fish: a chubby round fish whose back is covered in green moss and algae, olive green.
3. Swordfish: a steel-blue fish with a long straight sword-blade bill and fins like a sword guard, metallic glint.
4. Leaf Fish: a flat fish shaped like a green leaf with leaf veins, fins like leaf tips.
Row 2:
5. Shadow Fish: a dark grey-purple, half-transparent fish trailing wisps of black wind and shadow.
6. Clearbrook Carp: a small aqua carp with glassy see-through scales and a little swirl of stream water.
7. Twin-Headed Fish: a pink-purple mutant fish with two heads pointing slightly apart, both looking grumpy at each other.
8. Glass Fish: a fully transparent ice-blue glass fish with a small glowing heart visible inside.
Row 3:
9. Thunder Fish: a yellow fish with zigzag lightning-bolt fins and small electric sparks.
10. Glow Eel: a long mint-green eel curled in an S shape with glowing dots along its body.
11. Fire Scale Fish: a red-orange fish with scales like glowing embers and little flames on its fins.
12. Ice Soul Fish: a pale icy-blue fish armored in ice-crystal scales, with frosty mist.
Row 4:
13. Demon Qi Fish: a purple fish with glowing red eyes, violet fins and wisps of dark purple demonic smoke.
14. Sword-Pattern Carp: a white-silver carp whose scales carry engraved sword-cut patterns, a dorsal fin shaped like a small blade.
15. Seven-Hued Fish: a rainbow fish with seven-colored scales and a few raindrops around it.
16. Dragon Whisker Carp: a golden carp with long flowing dragon whiskers and tiny dragon horns budding on its head.
```

Thứ tự mã: `ngan-ty-ngu luc-tao-ngu kiem-ngu diep-ngu / anh-ngu khe-ly song-dau-ngu luu-ly-ngu / loi-ngu huynh-man hoa-lan-ngu bang-phach-ngu /
ma-khi-ngu kiem-van-ly that-thai-ngu long-tu-ly`

## Bảng 2: cá quý, tôm, cua, ốc (16)

```
Make ONE image: a 4x4 grid sheet of 16 game icons (4 rows x 4 columns), square, high resolution.
Style: cute fantasy pixel-art game icons in exactly the same style as the attached fish icon sheet: chunky pixel art, thick dark outline, soft shading with 3-4 tones per color, small white highlights, creatures with one big round cute eye and facing LEFT, Chinese xianxia (cultivation) fantasy flavor. Each icon centered in its own cell, all icons the same size. Plain pure white background, wide empty space between icons. No text, no numbers, no grid lines, no frames, no labels.
Icons, left to right, top to bottom:
Row 1:
1. Stardust Fish: a periwinkle-blue fish covered in glittering stardust speckles like a tiny galaxy, small stars around.
2. Void Scalefish: a deep indigo fish whose scales look like shards of night sky, thin cracks of violet light.
3. Spirit Sun Fish: a round warm golden-orange fish with a sun-ray halo fin, glowing warmly.
4. Nine-Tailed Mystic Carp: an elegant pink-magenta carp with nine long flowing tails fanned out behind it.
Row 2:
5. Heaven's Vein Fish: a luminous pale cyan-white fish with bright glowing vein lines across its body, like cracked sky light.
6. Kun of the Northern Darkness: a majestic whale-like deep-blue giant fish (draw it a bit bigger), starry belly, waves and clouds around it.
7. Azure Dragon Fish: a jade-teal dragon fish with a dragon head, horns, whiskers and a long coiled serpentine body with fins.
8. River Shrimp: a tiny clear pinkish shrimp, slightly curled.
Row 3:
9. Spirit Shrimp: a transparent cyan shrimp glowing softly from inside.
10. Golden Armor Lobster: a golden lobster with an armor-like shell and very long feelers.
11. Dragon Prawn King: a big red prawn with small dragon horns and a crown-like crest.
12. Paddy Crab: a small brown crab with oversized claws.
Row 4:
13. Fire Crab: a blazing red-orange crab with little flames and heat shimmer on its shell.
14. Blood Crab: a blood-red crab with spiky claws and a faint dark purple aura.
15. Stream Snail: an olive-green spiral snail shell covered in moss.
16. Ice Snail: an icy blue snail with a thin translucent shell like glass ice.
```

Thứ tự mã: `tinh-sa-ngu hu-khong-lan linh-nhat-ngu cuu-vi-ly / thien-mach-ngu bac-minh-con thanh-long-ngu ha-tom / linh-ha kim-long-ha long-ha-vuong cua-dong /
hoa-giai huyet-giai oc-suoi bang-loa`

## Bảng 3: sứa, mực, trai sò, châu, đồ chìm (16)

```
Make ONE image: a 4x4 grid sheet of 16 game icons (4 rows x 4 columns), square, high resolution.
Style: cute fantasy pixel-art game icons in exactly the same style as the attached fish icon sheet: chunky pixel art, thick dark outline, soft shading with 3-4 tones per color, small white highlights, creatures with one big round cute eye and facing LEFT, Chinese xianxia (cultivation) fantasy flavor. Each icon centered in its own cell, all icons the same size. Plain pure white background, wide empty space between icons. No text, no numbers, no grid lines, no frames, no labels.
Icons, left to right, top to bottom:
Row 1:
1. Streaming Light Jellyfish: a lavender jellyfish with glowing rings of light and trailing tendrils.
2. Heavenly Jellyfish: a large pale blue jellyfish like an umbrella, glowing, tendrils sparkling with starlight.
3. Ink Octopus: a dark purple-black octopus squirting a puff of black ink.
4. River Mussel: a plain grey-beige freshwater mussel shell, slightly open.
Row 2:
5. Spirit Scallop: a pale pink fan-shaped scallop shell, slightly open with soft spirit light glowing inside.
6. Mystic Pearl Clam: a violet-blue clam glowing with mystic purple light, a pearl peeking out.
7. Ancient Clam: a giant old clam with barnacles and seaweed, gems glinting in the opening.
8. Dragon Clam: a golden clam shell with a dragon-scale pattern and a golden pearl inside.
Row 3:
9. Pearl: one round white pearl with a soft shine.
10. Mystic Light Pearl: a violet glowing pearl with a tiny starry sky inside it.
11. Dragon Pearl: a golden pearl with swirling waves of golden dragon qi.
12. Torn Sandal: an old straw sandal with a torn sole, dripping water.
Row 4:
13. Tangle of Waterweed: a clump of green waterweed tangled around a fishing hook.
14. Broken Clay Jar: a cracked ancient clay jar with a red seal stamp mark.
15. Ancient Broken Sword: the top half missing from a rusty old sword, ornate hilt with a small engraved mark.
16. Soggy Manual: a waterlogged old cultivation manual book, dripping water, ink smudged.
```

Thứ tự mã: `luu-quang-mau thien-thuy-mau mac-chuong trai-song / so-diep trai-huyen co-bang long-bang / tran-chau huyen-chau long-chau giay-rach /
rong-reu binh-gom kiem-gay bi-kip-uot`

## Bảng 4: đồ chìm quý, mồi, cần câu (16)

```
Make ONE image: a 4x4 grid sheet of 16 game icons (4 rows x 4 columns), square, high resolution.
Style: cute fantasy pixel-art game icons in exactly the same style as the attached fish icon sheet: chunky pixel art, thick dark outline, soft shading with 3-4 tones per color, small white highlights, Chinese xianxia (cultivation) fantasy flavor. Each icon centered in its own cell, all icons the same size. Plain pure white background, wide empty space between icons. No text, no numbers, no grid lines, no frames, no labels. Fishing rods are drawn diagonally from bottom-left to top-right, each with its line and a small float.
Icons, left to right, top to bottom:
Row 1:
1. Sunken Chest: a copper-bound wooden treasure chest covered in seaweed, gold coins peeking out.
2. Water Palace Jade Seal: a square aqua-jade imperial seal with a dragon-shaped knob on top, glowing.
3. Earthworm bait: a pinkish-brown earthworm wriggling.
4. Spirit Rice Ball bait: three small white sticky-rice balls glowing faintly.
Row 2:
5. Fire Grub bait: a glowing orange grub larva with ember sparks.
6. Ice Heart Shrimp bait: a tiny transparent ice-blue shrimp inside a little ice cube.
7. Gold Sand Rice bait: a small pile of rice grains mixed with sparkling golden sand.
8. Glowworm bait: a short bamboo tube with glowing green fireflies coming out.
Row 3:
9. Blood Flesh Bait: a chunk of red marinated monster meat with green herbs, hooked on a fish hook.
10. Star Sand bait: a small silk pouch tied with string, spilling glittering blue star sand.
11. Ambergris bait: a golden ambergris lump with fragrant golden smoke curling like a little dragon.
12. Bamboo Rod: a simple bamboo fishing rod with string and a red-and-white float.
Row 4:
13. Green Vine Rod: a flexible rod made of a green vine wrapped with small leaves.
14. Cold Iron Rod: a dark steel-blue iron rod covered in frost, with an icy silk line.
15. Spirit Jade Rod: a pale green jade rod carved with glowing array runes.
16. Dragon Bone Rod: a bone-white rod made of segmented dragon spine vertebrae.
```

Thứ tự mã: `ruong-chim ngoc-ty giun-dat linh-me / hoa-trung bang-ha kim-sa da-quang / huyet-nhuc tinh-sa long-tien truc-can /
thanh-dang-can han-thiet-can ngoc-linh-can long-cot-can`

## Bảng 5: cần quý, món ăn (9)

```
Make ONE image: a 3x3 grid sheet of 9 game icons (3 rows x 3 columns), square, high resolution.
Style: cute fantasy pixel-art game icons in exactly the same style as the attached fish icon sheet: chunky pixel art, thick dark outline, soft shading with 3-4 tones per color, small white highlights, Chinese xianxia (cultivation) fantasy flavor. Each icon centered in its own cell, all icons the same size. Plain pure white background, wide empty space between icons. No text, no numbers, no grid lines, no frames, no labels. Fishing rods are drawn diagonally from bottom-left to top-right, each with its line and a small float. Dishes are food icons, appetizing, with a little steam.
Icons, left to right, top to bottom:
Row 1:
1. Heaven Silk Rod: an elegant pink-white rod with a shimmering moonlit silk line and a small crescent moon charm.
2. Sea-Calming Divine Rod: a majestic golden rod like a divine pillar with gold bands, calm waves swirling at its base.
3. Ember-Grilled Fish: a fish on a wooden skewer grilled over glowing charcoal, sprinkled with salt.
Row 2:
4. Sour Spirit Fish Soup: a bowl of golden sour soup with fish pieces, tamarind and green herbs, steaming.
5. Lotus-Leaf Steamed Fish: a fish wrapped in a green lotus leaf, steaming, a small pink lotus flower beside it.
6. Clay-Pot Braised Fish: a brown clay pot with caramelized braised fish in thick glossy dark sauce, steaming.
Row 3:
7. Heaven Fish on Ice: thin slices of raw fish fanned on a slab of ice with a tiny dish of ginger sauce.
8. Immortal Jade Broth: a clear jade-like broth in a fine porcelain bowl, soft pink-white qi rising from it.
9. Kun-Peng Grand Feast: a lavish golden banquet platter with a big whole fish dish and a phoenix-like great bird motif, radiant.
```

Thứ tự mã: `thien-tam-can dinh-hai-can ca-nuong / canh-chua hap-la-sen kho-to / goi-bang ngoc-thang con-yen`
