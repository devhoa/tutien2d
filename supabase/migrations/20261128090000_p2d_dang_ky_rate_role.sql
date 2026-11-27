-- Edge Function dang-ky đọc và ghi bộ đếm IP đã băm bằng service_role.
-- Bảng có RLS nhưng không cấp quyền cho người chơi; chỉ service_role được dùng.
grant select, insert on table public.p2d_dang_ky_ip to service_role;
grant usage, select on sequence public.p2d_dang_ky_ip_id_seq to service_role;
