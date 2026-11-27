-- Hộ Tông gia trì (chủ dự án 26/11/2026 00:19, thông báo Zalo: "thành viên của tông môn khi ở tông môn của bản thân tông chủ buff 60% sức mạnh,
-- trưởng lão 40, thành viên 20%"; bảng chọn 00:3x: "Phó tông 50%"): máy chủ phòng Cloudflare (cloud/src/ho-so.js) cần biết người vào phòng
-- giữ chức gì và tinh cầu của tông môn họ là tinh cầu nào, để nhân lực chiến khi họ đứng trên chính tinh cầu đó (PvP, quái chung;
-- cloud/src/ho-tong.js). Một lần gọi thay cho p2d_bang_ten_toi (tên tông môn hiện trên đầu), bằng vé của chính người vào phòng.
-- CHỈ ĐỌC: không tạo bảng, không sửa bảng, không đụng dữ liệu người chơi. Lùi: drop function public.p2d_bang_vai_toi(); máy chủ phòng
-- tự về cách cũ (hỏi p2d_bang_ten_toi, không có gia trì).
-- Trả null khi chưa vào tông môn. tinh: mã tinh cầu đang sống của tông môn (mỗi tông môn nhiều nhất một: chỉ mục p2d_tinh_cau_mot_bang),
-- chưa có thì null.

create or replace function public.p2d_bang_vai_toi()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('ten', b.ten, 'chuc', t.chuc,
    'tinh', (select c.id from public.p2d_tinh_cau c where c.bang_id = t.bang_id and c.trang_thai = 'song' limit 1))
  from public.p2d_bang_tv t join public.p2d_bang b on b.id = t.bang_id where t.user_id = public.p2d_uid() limit 1
$$;

revoke all on function public.p2d_bang_vai_toi() from public, anon;
grant execute on function public.p2d_bang_vai_toi() to authenticated;
