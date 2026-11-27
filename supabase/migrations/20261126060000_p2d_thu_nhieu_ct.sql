-- Ghi rõ món nào bị máy chủ bỏ khi cắm cờ thu_nhieu (CSKH #249 #253; chủ dự án 26/11/2026 08:56 "tiếp tục sửa").
-- Vì sao: sau bản vá "không đếm loài từng có" (20261126011000), một người chơi vẫn dính cờ thu_nhieu mỗi phút (364 lần / 7 giờ) mà
-- bản lưu máy chủ không thấy thùng nào cạn (loài mới 3/3, bản sao 900/900, kinh nghiệm đầy). Cờ thu_nhieu do 5 hàm khác nhau cắm
-- (linh thú, khôi lỗi, thú cưỡi, thời trang, công pháp) và p2d_luu chỉ ghi lý do, không ghi món nào, nên không biết máy chủ đang bỏ gì.
-- Sửa: p2d_kiem_thu, khi có thu_nhieu, ghi thêm một dòng nghi vấn 'thu_nhieu_ct' (chỉ để soát: không cộng điểm nghi vấn, không vào
-- luật cờ đỏ) kèm mỗi nhóm: mã món máy khách gửi mà máy chủ trả về khác (bản gửi, bản máy chủ, cắt 300 ký tự), mỗi người nhiều nhất
-- một dòng mỗi 10 phút. Không đổi luật nhận / bỏ món nào.
-- Thay đúng một đoạn trong định nghĩa đang chạy (đoạn cũ phải có đúng một lần, không thì báo lỗi, không đổi gì).
-- Lùi: định nghĩa cũ sao lưu ở p2d_xu_ly lúc áp (hành động sao_ham_truoc_migration).

do $x$
declare
  v_def text := pg_get_functiondef('public.p2d_kiem_thu(jsonb, jsonb, numeric, numeric, boolean, numeric, numeric, uuid)'::regprocedure);
  v_cu text := E'  if p_tk_moi and array_length(v_ly, 1) > 0 then v_ly := array[\'thu_dau\']; end if;   -- lần lưu đầu: chỉ ghi\n';
  v_moi text := v_cu
    || E'  -- 20261126060000: ghi món nào bị bỏ khi có thu_nhieu (chỉ để soát, không tính điểm)\n'
    || E'  if \'thu_nhieu\' = any (v_ly) and p_uid is not null and not exists (select 1 from public.p2d_nghi_van x where x.user_id = p_uid and x.ly_do = \'thu_nhieu_ct\' and x.luc > now() - interval \'10 minutes\') then\n'
    || E'    insert into public.p2d_nghi_van (user_id, ly_do, chi_tiet)\n'
    || E'    select p_uid, \'thu_nhieu_ct\', coalesce(jsonb_object_agg(g.k, g.ds), \'{}\'::jsonb) from (\n'
    || E'      select k.k, jsonb_agg(jsonb_build_object(\'id\', e.key, \'gui\', left((e.value)::text, 300), \'may_chu\', left(coalesce(v_data -> k.k -> e.key, \'null\'::jsonb)::text, 300))) ds\n'
    || E'        from unnest(array[\'pets\', \'comps\', \'techs\', \'mounts\', \'outfits\']) k(k)\n'
    || E'        cross join lateral jsonb_each(case when jsonb_typeof(p_moi -> k.k) = \'object\' then p_moi -> k.k else \'{}\'::jsonb end) e\n'
    || E'       where (v_data -> k.k -> e.key) is distinct from e.value\n'
    || E'       group by k.k) g;\n'
    || E'  end if;\n';
  v_n int;
begin
  if position('20261126060000' in v_def) > 0 then return; end if;   -- đã thay rồi (áp lại): không đổi gì
  v_n := (length(v_def) - length(replace(v_def, v_cu, ''))) / length(v_cu);
  if v_n <> 1 then raise exception 'p2d_kiem_thu: đoạn thu_dau xuất hiện % lần (cần đúng 1), không áp', v_n; end if;
  execute replace(v_def, v_cu, v_moi);
end
$x$;

-- Tự kiểm
do $k$
declare v_def text := pg_get_functiondef('public.p2d_kiem_thu(jsonb, jsonb, numeric, numeric, boolean, numeric, numeric, uuid)'::regprocedure);
begin
  if position('20261126060000' in v_def) = 0 then raise exception 'kt: p2d_kiem_thu chưa đổi'; end if;
end $k$;
