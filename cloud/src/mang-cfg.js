// Bản sao từ data/thien-mang.json (tools/cloud/phong.test.mjs so khớp): Linh Thạch farm thường mỗi giây theo tinh cầu có đầu boss,
// và hệ số thưởng khi chém Cửu Đầu Thôn Thiên Mãng (chủ dự án 06/11/2026: gấp 10 lần farm thường).
export const LT_MULT = 30;   // chủ dự án 06/11/2026 11:39: ×3 (trước 10)
// Thưởng thêm theo sát thương (chủ dự án 06/11/2026 10:10): tối đa +LT_BONUS × căn(sát thương mình / người mạnh nhất cùng tuyến)
export const LT_BONUS = 0.5;
export const FARM_LT_S = {"thon-thien-mang": 2.67, "thanh-khe": 0.07, "thien-kiem-phong": 0.09, "dao-xich-dien": 0.17, "dao-han-bang": 0.32, "hac-phong-dao": 0.69, "dao-moc": 1.24, "dao-thien-kim": 2.13, "dao-hau-tho": 2.89, "vet-nut-ngoai": 3.76};
// Chỗ đầu boss mỗi tinh cầu (đơn vị bản đồ, ô 16): giữa mép trên, như src/game/thien-mang.js spawnMang. Chỉ tính giây chém khi
// vị trí cuối người đó gửi lên phòng nằm trong NEAR (near 22 ô của data/thien-mang.json + 4 ô dư cho trễ mạng).
export const HEAD = {"thon-thien-mang": [[1422.8, 1343.6], [1435.9, 1503.6], [1658.3, 1203.6], [1985.4, 1273.6], [2181.7, 1193.6], [2364.8, 1313.6], [2377.9, 1453.6], [2364.8, 1603.6], [1579.8, 1673.6]], "thanh-khe": [312.0, 8.0], "thien-kiem-phong": [1032.0, 8.0], "dao-xich-dien": [1032.0, 8.0], "dao-han-bang": [1032.0, 8.0], "hac-phong-dao": [568.0, 8.0], "dao-moc": [616.0, 8.0], "dao-thien-kim": [664.0, 8.0], "dao-hau-tho": [680.0, 8.0], "vet-nut-ngoai": [696.0, 8.0]};
export const NEAR = 26 * 16;
// Vùng không gian Thôn Thiên Mãng (chủ dự án 06/11/2026 15:03): HEAD là danh sách chín đầu (data/thien-mang.json → arena, sky.mouths,
// cỡ hình boss.mang), đứng gần đầu nào cũng tính; FARM_LT_S như nhau cho mọi người (arena.farm_lt_s).
// PvP Ngoại Vực (bản sao data/pvp.json → server; chủ dự án 06/11/2026)
export const PVP = {"map": "vet-nut-ngoai", "range": 160, "gap_s": 0.5, "gap_tol_s": 0.2, "lag_s": 1, "range_tol": 16, "dt_max": 1.5, "pb": {"_": "Đòn pháp bảo trúng người (CSKH #359 #395, 27/11/2026; cloud/src/pvp.js pvpPb): tầm range (Đại Ấn rơi xa 210), đòn vùng trúng tối đa max người (đòn bắn thẳng một người), mỗi người nhận như dt giây đánh thường, nhịp riêng gap_s giây, không ăn vào nhịp đánh thường.", "range": 230, "max": 3, "dt": 1.5, "gap_s": 6}, "dps_k": 0.1, "hp_k": 2, "pw_min": 100, "regen_s": 10, "immune_s": 10, "safe": {"map": "thien-kiem-phong", "x": 1032, "y": 1224, "r": 100}, "reshield_s": 600, "ma": {"tp": {"chu_ky": 10, "dao": 3}, "min_tl": 4, "co": {"map": "thien-kiem-phong", "x": 1900, "y": 1228, "r": 72, "phut_s": 60}}, "na": {"_": "Nguyên Anh (chủ dự án 27/11/2026 01:09–01:16; docs/21-NGUYEN-ANH.md): người có tổng tầng tu ≥ tl (Supabase báo, 27 = Nguyên Anh tầng 1) bị hạ lần đầu thì hoá Nguyên Anh, không tính là bị giết (không ai mất gì, người hạ không được tính), miễn mọi đòn giu_s giây; bấm Tái tạo (tin 'ta') thì chỉ còn miễn an_s giây; lá chắn hồi hoi_s giây. Hạ tiếp trong lúc lá chắn đang hồi mới tính là chết như cũ. Thiên phạt (thien-phat.js) không qua lá chắn.", "tl": 27, "hoi_s": 300, "giu_s": 30, "an_s": 1}};
// Lịch boss (bản sao data/thien-mang.json → lich; chủ dự án 06/11/2026 20:59): mở nhận sát thương từ phút from tới to mỗi ngày theo giờ
// múi tz (giờ VN = +7). Hết giờ thì worker tự tổng kết (index.js scheduled → mang.js tongKet).
export const LICH = { tz: 7, from: 20 * 60 + 30, to: 21 * 60 };
// Hộ Tông gia trì (bản sao data/guild.json → ho_tong; chủ dự án 26/11/2026): % lực chiến theo chức vụ khi đứng trên tinh cầu của tông môn mình (ho-tong.js)
export const HO_TONG = {"on": true, "pct": {"chu": 60, "pho": 50, "lao": 40, "de": 20}};
