-- Đổi tên tông môn, mở thêm ô bộ trang bị (chủ dự án 27/11/2026 00:16: "đổi tên tông môn ok, cần phí đổi tên là tiên ngọc, phí 80 tiên ngọc";
-- "Lưu nhiều bộ trang bị … muốn mặc nhanh bộ 1 hoặc bộ 2 thì ấn vào … Từ bộ thứ 3 sẽ mua bằng 60 tiên ngọc, Bộ 4 120"; CSKH #393 #394 #382 #364).
-- Giá ở p2d_tn_gia (dòng gạch dưới đầu: p2d_doi_tn không bán), khớp data/guild.json → rename.tn và data/bo-do.json → gia (tools/check.mjs so).
-- Tiên Ngọc trừ như p2d_doi_tn: cột tien_ngoc + data.tn, sổ cái ghi theo p2d.ly_do. Gọi lại khi mạng gửi trùng thì không trừ lần hai.

insert into public.p2d_tn_gia (ma, tn) values ('thu-lenh', 9), ('dao-van-thach', 50), ('ruong-dia', 180), ('da-tay', 60), ('ngoc-3', 90),
  ('ao-tien-nhan', 300), ('ao-hoang-kim', 600), ('ao-tu-liem', 10), ('ao-huyet-nguyet', 60), ('ao-tp-18', 10), ('ao-tp-19', 10),
  ('_qua_ra_mat', 100), ('_the_ngay', 100), ('_the_ngay_lt', 300), ('_doi_ten_tong', 80), ('_bo_do_3', 60), ('_bo_do_4', 120)
on conflict (ma) do update set tn = excluded.tn;

-- 1) Đổi tên tông môn. Chỉ Tông chủ; tên mới qua đúng luật lập tông môn (p2d_bang_sach, 2–16 chữ, không trùng tông môn khác,
--    không phân biệt hoa thường). Mọi bảng khác giữ tông môn theo bang_id nên không phải sửa gì thêm; tên trên đầu người khác do
--    máy chủ phòng đọc lại p2d_bang_ten_toi (giữ 60 giây). Tên cũ / mới ghi ở p2d_xu_ly (hanh_dong doi_ten_tong) để CSKH tra.
create or replace function public.p2d_bang_doi_ten(p_ten text)
returns jsonb language plpgsql security definer set search_path to '' as $function$
declare
  v_uid uuid := public.p2d_uid(); v_nv public.p2d_nhan_vat%rowtype; v_bang uuid; v_chuc text; v_cu text;
  v_ten text := public.p2d_bang_sach(p_ten); v_gia integer := (select tn from public.p2d_tn_gia where ma = '_doi_ten_tong');
begin
  if v_gia is null then raise exception 'other' using errcode = '22023'; end if;
  select bang_id, chuc into v_bang, v_chuc from public.p2d_bang_tv where user_id = v_uid;
  if v_bang is null then raise exception 'khong_co' using errcode = '22023'; end if;
  if v_chuc <> 'chu' then raise exception 'khong_quyen' using errcode = '42501'; end if;
  select * into v_nv from public.p2d_nhan_vat where user_id = v_uid for update;
  if not found then raise exception 'chua_luu' using errcode = '22023'; end if;
  if v_nv.nghi_van >= 10 then raise exception 'bi_khoa' using errcode = '42501'; end if;
  if char_length(coalesce(v_ten, '')) not between 2 and 16 then raise exception 'ten_sai' using errcode = '22023'; end if;
  select ten into v_cu from public.p2d_bang where id = v_bang for update;
  if v_cu = v_ten then   -- gửi trùng (hoặc tên y như cũ): không trừ
    return jsonb_build_object('ten', v_ten, 'tn', v_nv.tien_ngoc, 'phien_ban', v_nv.phien_ban, 'gia', 0);
  end if;
  if exists (select 1 from public.p2d_bang where lower(ten) = lower(v_ten) and id <> v_bang) then raise exception 'ten_trung' using errcode = '22023'; end if;
  if v_nv.tien_ngoc < v_gia then raise exception 'thieu_tn' using errcode = '22023'; end if;
  begin
    update public.p2d_bang set ten = v_ten where id = v_bang;
  exception when unique_violation then raise exception 'ten_trung' using errcode = '22023';
  end;
  perform set_config('p2d.ly_do', 'doi_ten_tong', true);
  update public.p2d_nhan_vat set tien_ngoc = tien_ngoc - v_gia, data = data || jsonb_build_object('tn', tien_ngoc - v_gia),
         phien_ban = phien_ban + 1, updated_at = now() where user_id = v_uid returning * into v_nv;
  insert into public.p2d_xu_ly (user_id, hanh_dong, du_lieu)
    values (v_uid, 'doi_ten_tong', jsonb_build_object('bang', v_bang, 'cu', v_cu, 'moi', v_ten, 'tn', v_gia));
  return jsonb_build_object('ten', v_ten, 'tn', v_nv.tien_ngoc, 'phien_ban', v_nv.phien_ban, 'gia', v_gia);
end;
$function$;
revoke all on function public.p2d_bang_doi_ten(text) from public, anon;
grant execute on function public.p2d_bang_doi_ten(text) to authenticated;

-- 2) Ô bộ trang bị. Bản lưu giữ data.boMo = số ô đã mở (không có = 2 ô miễn phí, data/bo-do.json → mien). Bộ đồ đã lưu (data.boDo:
--    món nào ở ô nào) là của máy khách, máy chủ không cần kiểm vì mặc bộ chỉ là đổi món đang có trong túi. Chỉ boMo phải giữ:
--    máy khách không tự nâng được (trigger p2d_giu_bo_mo), chỉ p2d_mo_bo_do nâng sau khi trừ Tiên Ngọc.
--    p_o: ô muốn mở (3 hoặc 4). Đã mở tới ô đó rồi (mạng gửi trùng) thì trả số hiện tại, không trừ.
create or replace function public.p2d_mo_bo_do(p_o integer)
returns jsonb language plpgsql security definer set search_path to '' as $function$
declare
  v_uid uuid := public.p2d_uid(); v_nv public.p2d_nhan_vat%rowtype; v_co integer; v_gia integer;
begin
  select * into v_nv from public.p2d_nhan_vat where user_id = v_uid for update;
  if not found then raise exception 'chua_luu' using errcode = '22023'; end if;
  v_co := coalesce(case when jsonb_typeof(v_nv.data -> 'boMo') = 'number' then (v_nv.data ->> 'boMo')::integer end, 2);
  if p_o is null or p_o < 3 or p_o > 4 then raise exception 'ma_sai' using errcode = '22023'; end if;
  if v_co >= p_o then return jsonb_build_object('mo', v_co, 'tn', v_nv.tien_ngoc, 'phien_ban', v_nv.phien_ban, 'gia', 0); end if;
  if p_o <> v_co + 1 then raise exception 'chua_mo_truoc' using errcode = '22023'; end if;
  select tn into v_gia from public.p2d_tn_gia where ma = '_bo_do_' || p_o;
  if v_gia is null then raise exception 'ma_sai' using errcode = '22023'; end if;
  if v_nv.tien_ngoc < v_gia then raise exception 'thieu_tn' using errcode = '22023'; end if;
  perform set_config('p2d.ly_do', 'bo_do_' || p_o, true);
  perform set_config('p2d.bo_mo', '1', true);
  update public.p2d_nhan_vat set tien_ngoc = tien_ngoc - v_gia,
         data = data || jsonb_build_object('tn', tien_ngoc - v_gia, 'boMo', p_o),
         phien_ban = phien_ban + 1, updated_at = now() where user_id = v_uid returning * into v_nv;
  perform set_config('p2d.bo_mo', '0', true);
  return jsonb_build_object('mo', p_o, 'tn', v_nv.tien_ngoc, 'phien_ban', v_nv.phien_ban, 'gia', v_gia);
end;
$function$;
revoke all on function public.p2d_mo_bo_do(integer) from public, anon;
grant execute on function public.p2d_mo_bo_do(integer) to authenticated;

create or replace function public.p2d_giu_bo_mo()
returns trigger language plpgsql security definer set search_path to '' as $function$
begin
  if current_setting('p2d.bo_mo', true) = '1' then return new; end if;
  if tg_op = 'INSERT' or old.data -> 'boMo' is null then
    if new.data ? 'boMo' then new.data := new.data - 'boMo'; end if;
  elsif new.data -> 'boMo' is distinct from old.data -> 'boMo' then
    new.data := jsonb_set(new.data, '{boMo}', old.data -> 'boMo');
  end if;
  return new;
end;
$function$;
revoke all on function public.p2d_giu_bo_mo() from public, anon, authenticated;
drop trigger if exists p2d_giu_bo_mo on public.p2d_nhan_vat;
create trigger p2d_giu_bo_mo before insert or update of data on public.p2d_nhan_vat for each row execute function public.p2d_giu_bo_mo();

-- Tự kiểm
do $$
begin
  if (select tn from public.p2d_tn_gia where ma = '_doi_ten_tong') <> 80 or (select tn from public.p2d_tn_gia where ma = '_bo_do_3') <> 60
     or (select tn from public.p2d_tn_gia where ma = '_bo_do_4') <> 120 or (select count(*) from public.p2d_tn_gia) < 17 then
    raise exception 'tự kiểm: giá';
  end if;
  if has_function_privilege('anon', 'public.p2d_bang_doi_ten(text)', 'execute') or has_function_privilege('anon', 'public.p2d_mo_bo_do(integer)', 'execute') then
    raise exception 'tự kiểm: khách gọi được';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'p2d_giu_bo_mo' and tgrelid = 'public.p2d_nhan_vat'::regclass) then raise exception 'tự kiểm: thiếu trigger'; end if;
end $$;
