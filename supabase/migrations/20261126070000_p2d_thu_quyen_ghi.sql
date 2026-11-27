-- Thu quyền ghi thừa của anon / authenticated trên hai bảng phụ (chủ dự án 26/11/2026 12:35 "kiểm soát tốt chút nha, đừng để hỏng game",
-- sau khi một người chơi khoe "đục được cả database"). Hai bảng đã bật RLS và không có chính sách ghi nên vẫn chặn được, đây chỉ là bỏ
-- quyền thừa cho chắc. Mọi hàm ghi vào hai bảng (p2d_phien_dat, p2d_nhip_song2, p2d_nhip_gop, p2d_uong_dan_x2, p2d_kiem_linh_khi) chạy
-- bằng quyền máy chủ (security definer, chủ postgres) nên không bị ảnh hưởng. Đã thử trong giao dịch huỷ ngược.
revoke insert, update, delete on public.p2d_phien, public.p2d_dan_x2 from anon, authenticated;
