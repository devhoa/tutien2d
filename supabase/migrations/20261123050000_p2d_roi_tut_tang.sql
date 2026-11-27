-- Món rơi không bị coi là "đồ giả" khi người chơi vừa tụt tầng (23/11/2026, chủ dự án chọn "Áp lên + đẩy, gộp").
-- Gốc: ma bị diệt / thiên phạt mất 1% tu vi, thiếu thì tụt một tầng (p2d_pvp_tra). Món vừa rơi lúc còn ở tầng cũ có cấp
-- (lvl) = tầng cũ, cao hơn tầng mới trên cả bản gửi lẫn bản máy chủ, nên p2d_kiem_roi ghi 'roi_sai' và tự khoá ngay
-- (23/11 có 2 tài khoản bị khoá oan, đã gỡ). Sửa: trần cấp món mới lấy thêm hết cảnh giới cao nhất từng đạt
-- (p2d_nhan_vat.canh_max do máy chủ ghi): canh_max × tang + tang − 1. Chỉ thay đúng một dòng trong định nghĩa đang chạy.
-- Lùi: chạy lại định nghĩa cũ (sao lưu ở p2d_xu_ly lúc áp).
do $m$
declare
  d text := pg_get_functiondef('public.p2d_kiem_roi(jsonb,jsonb,numeric,numeric,boolean)'::regprocedure);
  cu text := E'                   coalesce(public.p2d_ky_so(p_cu -> \'realm\'), 0) * v_tang + coalesce(public.p2d_ky_so(p_cu -> \'layer\'), 1) - 1);\n';
  moi text := E'                   coalesce(public.p2d_ky_so(p_cu -> \'realm\'), 0) * v_tang + coalesce(public.p2d_ky_so(p_cu -> \'layer\'), 1) - 1,\n'
           || E'                   coalesce((select n.canh_max from public.p2d_nhan_vat n where n.user_id = (select auth.uid())), 0) * v_tang + v_tang - 1);\n';
begin
  if position('n.canh_max' in d) > 0 then raise notice 'da_sua'; return; end if;
  if (length(d) - length(replace(d, cu, ''))) / length(cu) <> 1 then raise exception 'khong_thay_doan_cu'; end if;
  execute replace(d, cu, moi);
end $m$;
