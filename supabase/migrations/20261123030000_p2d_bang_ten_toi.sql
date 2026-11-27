-- Tên tông môn hiện trên đầu người chơi (góp ý #195 "thêm tên tông môn ở trên tên"; chủ dự án chọn kiểu A 23/11/2026):
-- máy chủ phòng Cloudflare (cloud/src/ho-so.js) gọi bằng vé của chính người vào phòng, gắn tên vào hồ sơ cho người khác thấy
-- (data/dong-bo.json → ho_so.tong, ai: may-chu), máy khách không tự khai được. Chỉ đọc, không đổi bảng nào.
-- Không dùng p2d_bang_toi vì hàm đó nặng (gom danh sách thành viên, chạy đặt lại tuần) và dính giới hạn 1 thao tác / giây của người chơi.

create or replace function public.p2d_bang_ten_toi()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select b.ten from public.p2d_bang_tv t join public.p2d_bang b on b.id = t.bang_id where t.user_id = public.p2d_uid() limit 1
$$;

revoke all on function public.p2d_bang_ten_toi() from public, anon;
grant execute on function public.p2d_bang_ten_toi() to authenticated;
