// Hộ Tông gia trì (chủ dự án 26/11/2026 00:19, thông báo Zalo: "thành viên của tông môn khi ở tông môn của bản thân tông chủ buff 60% sức mạnh,
// trưởng lão 40, thành viên 20%"; bảng chọn 00:3x: "Phó tông 50%"): đứng trên chính tinh cầu của tông môn mình thì lực chiến phòng dùng để
// làm trọng tài (máu và đòn PvP ở pvp.js, ngân sách sát thương quái chung ở quai.js) nhân thêm phần trăm theo chức vụ.
// Chức vụ và tinh cầu của tông môn do Supabase báo (p2d_bang_vai_toi, ho-so.js → x-chuc, x-tinh), máy khách không tự khai được.
// Phòng báo phần trăm cho chính người đó trong tin chào (phong.js 'w' → ht) để máy họ nhân Công, Sinh lực, Thủ đúng bằng ấy (src/game/ho-tong.js).
// Số ở data/guild.json → ho_tong (bản sao HO_TONG trong mang-cfg.js, tools/cloud/ho-tong.test.mjs so khớp).
import { HO_TONG } from './mang-cfg.js';

// Phần trăm gia trì của người giữ chức `chuc`, tông môn có tinh cầu `tinh`, đang vào phòng của bản đồ `map` (0 = không có)
export const hoTongPct = (map, chuc, tinh) => (HO_TONG.on && map && tinh && map === tinh && Object.hasOwn(HO_TONG.pct, chuc) ? HO_TONG.pct[chuc] | 0 : 0);

// Lực chiến phòng dùng cho một kết nối (a: phần đính kèm): đã nhân Hộ Tông gia trì nếu có
export const pwCua = a => (a?.pw || 0) * (1 + (a?.ht || 0) / 100);
