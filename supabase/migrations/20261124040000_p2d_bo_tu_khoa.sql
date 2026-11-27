-- Máy chủ thôi tự khoá tài khoản, chỉ cắm cờ đỏ (chủ dự án 24/11/2026 16:2x: "hạn chế k khoá acc khách hàng"; bảng chọn
-- "Bỏ tự khoá, cờ phải lặp lại").
-- Vì sao: từ 10/11 máy chủ tự khoá 6 tài khoản; 5 là người chơi thật bị khoá oan (bán pháp bảo, máy mất kết nối rồi gửi bản lưu cũ,
-- món vừa rơi đã tẩy luyện trên máy), đều đã mở lại; cái còn lại là tài khoản thử của AI.
-- Luật mới của p2d_co_do_xet (trigger sau khi ghi p2d_nghi_van):
--   1. Hack rõ (do_sai_chi_so, ngoc_sai, day_cuc): cờ đỏ ngay lần đầu, KHÔNG khoá (trước: khoá ngay). Máy chủ vẫn bỏ món / ngọc giả,
--      trả số về bản máy chủ như cũ (các hàm lưu không đổi), nên kẻ hack không được lợi gì.
--   2. Đồ rơi sai (roi_sai): cờ đỏ khi lặp lại từ 2 lần trong 24 giờ; lần đi kèm bản lưu cũ (lý do có "_cu") không tính
--      (trước: cờ đỏ ngay lần đầu, kể cả khi đi kèm bản lưu cũ).
--   3. Linh Thạch, linh khí, sửa đồ, ngọc sai, sửa thú lố 5 lần / 24 giờ: cờ đỏ (như cũ).
--   4. Tài khoản mới (dưới 3 ngày) Linh Thạch lố 3 lần / 24 giờ: cờ đỏ (như cũ).
--   5. Bỏ hẳn nhánh khoá (auth.users.banned_until): kể cả linh khí + Linh Thạch lố 10 lần / 24 giờ (người đó đã cờ đỏ ở bước 3).
-- Khoá chỉ còn làm tay khi chủ dự án quyết. Cờ đỏ vẫn chặn rao bán / mua chợ / tặng đạo lữ / tông môn như trước (nghi_van >= 10).
-- Các tài khoản đang bị khoá không đổi gì. Lùi: định nghĩa cũ sao lưu ở p2d_xu_ly lúc áp (hành động sao_ham_truoc_migration).
create or replace function public.p2d_co_do_xet()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_r text[]; v_ly text; v_x text; v_n integer; v_lt integer;
begin
  begin
    if new.user_id is null or new.ly_do is null then return null; end if;
    if exists (select 1 from public.p2d_thien_ma t where t.user_id = new.user_id) then return null; end if;
    if exists (select 1 from public.p2d_co_do c where c.user_id = new.user_id) then return null; end if;
    v_r := string_to_array(new.ly_do, ',');

    if v_r && array['do_sai_chi_so', 'ngoc_sai', 'day_cuc'] then
      -- 1. hack rõ: cờ đỏ ngay (20261124040000: trước là khoá ngay)
      v_ly := 'hack rõ: ' || array_to_string(array(select x from unnest(v_r) x where x in ('do_sai_chi_so', 'ngoc_sai', 'day_cuc')), ',');
    elsif 'roi_sai' = any (v_r) then
      -- 2. đồ rơi sai: lặp lại từ 2 lần / 24 giờ, không tính lần đi kèm bản lưu cũ
      if new.ly_do not like '%\_cu%' then
        select count(*) into v_n from public.p2d_nghi_van v
         where v.user_id = new.user_id and v.luc > now() - interval '24 hours'
           and 'roi_sai' = any (string_to_array(v.ly_do, ',')) and v.ly_do not like '%\_cu%';
        if v_n >= 2 then v_ly := 'roi_sai x' || v_n || '/24h'; end if;
      end if;
    elsif new.ly_do not like '%\_cu%' then
      -- 3. lố nhiều lần (20261105140000)
      foreach v_x in array array['linh_thach', 'linh_khi', 'sua_do', 'ngoc_sai', 'thu_sua'] loop
        continue when not (v_x = any (v_r));
        select count(*) into v_n from public.p2d_nghi_van v
         where v.user_id = new.user_id and v.luc > now() - interval '24 hours'
           and v_x = any (string_to_array(v.ly_do, ',')) and v.ly_do not like '%\_cu%';
        if v_n >= 5 then v_ly := v_x || ' x' || v_n || '/24h'; exit; end if;
      end loop;
    end if;

    if v_ly is null and 'linh_thach' = any (v_r)
       and exists (select 1 from auth.users u where u.id = new.user_id and u.created_at > now() - interval '72 hours') then
      -- 4. tài khoản mới (dưới 3 ngày) cày Linh Thạch lố liên tục (20261115110000, câu 13a)
      select count(*) into v_lt from public.p2d_nghi_van v
       where v.user_id = new.user_id and v.luc > now() - interval '24 hours'
         and 'linh_thach' = any (string_to_array(v.ly_do, ',')) and v.ly_do not like '%\_cu%';
      if v_lt >= 3 then v_ly := 'tài khoản mới, Linh Thạch lố x' || v_lt || '/24h'; end if;
    end if;

    if v_ly is null then return null; end if;
    insert into public.p2d_co_do (user_id, ly_do, tu_dong) values (new.user_id, v_ly, true) on conflict (user_id) do nothing;
    if found then
      insert into public.p2d_xu_ly (user_id, hanh_dong, du_lieu)
      values (new.user_id, 'co_do', jsonb_build_object('ly_do', 'Tự động (20261124040000): ' || v_ly, 'nghi_van_id', new.id, 'tu_dong', true));
      begin
        update public.p2d_nhan_vat set nghi_van = greatest(nghi_van, 10) where user_id = new.user_id and nghi_van < 10;
      exception when others then null;
      end;
    end if;
  exception when others then
    null;   -- không bao giờ làm hỏng lần lưu
  end;
  return null;
end;
$function$;

-- Tự kiểm: không còn chỗ nào trong các hàm của public tự đặt banned_until
do $k$
begin
  if exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
              where s.nspname = 'public' and p.prosrc ilike '%banned_until =%' and p.prosrc ilike '%update auth.users%') then
    raise exception 'kt: con ham tu khoa';
  end if;
end $k$;
