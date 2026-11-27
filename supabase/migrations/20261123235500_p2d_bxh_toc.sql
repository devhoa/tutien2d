-- Phong hào trên bảng xếp hạng (chủ dự án 23/11/2026 23:51: "phong hào cần hiện cả trên bxh nữa").
-- Phong hào = tộc huyết mạch + bậc theo hạng bảng Sức mạnh (đang hóa ma: chữ Ma + bậc theo hạng bảng Ma hóa), máy khách ghép (src/game/phong-hao.js).
-- Hạng đã có trên bảng; tộc của người không đứng gần thì máy khách không biết, nên p2d_bxh_het trả thêm 'toc' mỗi dòng, lấy ở p2d_tiem_nang
-- (máy chủ quay lúc làm lễ huyết mạch, máy khách không sửa được). Chưa làm lễ thì null (máy khách dùng tộc mặc định như phong hào trên đầu).
-- Chỉ đọc; mọi trường cũ giữ nguyên, thêm một trường nên máy khách cũ không đổi gì. Thân hàm chép bản đang chạy (20261103040000_p2d_bxh_het.sql),
-- chỉ thêm 'toc' và left join.
create or replace function public.p2d_bxh_het(p_loai text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_r jsonb; v_top jsonb;
begin
  if v_uid is null then raise exception 'chua_dang_nhap' using errcode = '28000'; end if;
  v_r := public.p2d_bxh(p_loai);   -- giữ phần mình, danh hiệu tuần, chốt tuần như bản cũ
  select coalesce(jsonb_agg(jsonb_build_object('hang', x.hang, 'ten', x.ten, 'gia_tri', x.gia_tri, 'canh_gioi', x.canh_gioi, 'tang', x.tang, 'co', x.co,
           'la_toi', x.user_id = v_uid, 'k', public.p2d_chat_key(x.user_id), 'toc', t.toc) order by x.hang), '[]'::jsonb)
    into v_top from public.p2d_xep_ca(p_loai, 2000) x left join public.p2d_tiem_nang t on t.user_id = x.user_id;
  return v_r || jsonb_build_object('top', v_top);
end; $$;

revoke all on function public.p2d_bxh_het(text) from public, anon;
grant execute on function public.p2d_bxh_het(text) to authenticated;

-- Tự kiểm: trường 'toc' có mặt, số dòng bằng bảng cũ (left join không nhân dòng vì p2d_tiem_nang khoá theo user_id)
do $$
declare v_cu integer; v_moi integer; v_toc integer;
begin
  select count(*) into v_cu from public.p2d_xep_ca('luc_chien', 2000);
  select count(*), count(t.toc) into v_moi, v_toc from public.p2d_xep_ca('luc_chien', 2000) x left join public.p2d_tiem_nang t on t.user_id = x.user_id;
  if v_cu <> v_moi then raise exception 'bxh_toc: số dòng lệch % / %', v_cu, v_moi; end if;
  if position('''toc'', t.toc' in pg_get_functiondef('public.p2d_bxh_het(text)'::regprocedure)) = 0 then raise exception 'bxh_toc: hàm chưa có trường toc'; end if;
  raise notice 'bxh_toc: % dòng, % dòng có tộc', v_moi, v_toc;
end $$;
