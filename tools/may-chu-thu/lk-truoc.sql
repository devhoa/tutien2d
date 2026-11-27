-- Định nghĩa đang chạy trên máy chủ thật ngày 26/11/2026, ngay trước migration 20261126030000_p2d_luu_dau_co_do và sau migration
-- p2d_linh_khi_that của cùng ngày (chép nguyên văn từ pg_get_functiondef; md5 từng hàm ghi ở tools/may-chu-thu/lk-that.sh).
-- Chỉ dùng cho máy chủ thử trong máy, không áp lên máy chủ thật.

CREATE OR REPLACE FUNCTION public.p2d_tong_lk(p_r integer, p_l integer, p_q numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare n integer := greatest(0, p_r) * 9 + greatest(1, p_l) - 1; s numeric := 0; i integer;
begin
  for i in 0 .. n - 1 loop
    s := s + round(40 * power(1.3, least(i, 27)) * power(1.03, greatest(0, i - 27)));
  end loop;
  return s + greatest(coalesce(p_q, 0), 0);
end;
$function$;

CREATE OR REPLACE FUNCTION public.p2d_lk_can(p_n integer)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$ select public.p2d_tong_lk(0, p_n + 2, 0) - public.p2d_tong_lk(0, p_n + 1, 0) $function$;

CREATE OR REPLACE FUNCTION public.p2d_lk_can_that(p_n integer)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case
    when p_n < 9 then (40 * power(2::numeric, greatest(p_n, 0)))::numeric
    else round(40 * power(1.3::numeric, least(p_n, 27)) * power(1.03::numeric, greatest(0, p_n - 27))
               * (array[1, 17.4, 26.6, 78.3, 220.5, 338.1, 518.1, 794.1, 1245]::numeric[])[least(p_n / 9, 8) + 1])
  end
$function$;

CREATE OR REPLACE FUNCTION public.p2d_tong_lk_that(p_r integer, p_l integer, p_q numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare n integer := greatest(0, p_r) * 9 + greatest(1, p_l) - 1; s numeric := 0; i integer;
begin
  for i in 0 .. n - 1 loop s := s + public.p2d_lk_can_that(i); end loop;
  return s + greatest(coalesce(p_q, 0), 0);
end;
$function$;

CREATE OR REPLACE FUNCTION public.p2d_lk_tien_that(p_r integer, p_l integer, p_q numeric, p_them numeric, p_r2 integer, p_l2 integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  n  integer := greatest(0, p_r) * 9 + greatest(1, p_l) - 1;
  n2 integer := greatest(0, p_r2) * 9 + greatest(1, p_l2) - 1;
  q  numeric := greatest(coalesce(p_q, 0), 0) + greatest(coalesce(p_them, 0), 0);
  c  numeric;
begin
  loop
    c := public.p2d_lk_can_that(n);
    exit when n >= n2 or q < c;
    q := q - c; n := n + 1;
  end loop;
  return jsonb_build_object('realm', n / 9, 'layer', n % 9 + 1, 'qi', floor(least(q, c)));
end;
$function$;

CREATE OR REPLACE FUNCTION public.p2d_co_moi(p_uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select not exists (select 1 from public.p2d_nghi_van where user_id = p_uid and luc > now() - interval '10 minutes' and ly_do <> 'do_da_rao') $function$;

CREATE OR REPLACE FUNCTION public.p2d_co_do_giu()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if coalesce(new.nghi_van, 0) < 10 and exists (select 1 from public.p2d_co_do c where c.user_id = new.user_id) then
    new.nghi_van := 10;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.p2d_co_do_xet()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

CREATE OR REPLACE FUNCTION public.p2d_kiem_linh_khi()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_r     integer := coalesce((old.data ->> 'realm')::integer, old.canh_gioi);
  v_l     integer := coalesce((old.data ->> 'layer')::integer, old.tang);
  v_can   numeric := public.p2d_lk_can(greatest(v_r, 0) * 9 + greatest(v_l, 1) - 1);
  v_toc   numeric := greatest(90 * power(1.6, least(greatest(v_r, 0), 4)), v_can / 150);
  v_tran  numeric := greatest(500000, v_can * 8);
  v_dt    numeric := least(greatest(extract(epoch from (now() - coalesce(old.qi_luc, old.luu_luc))), 0), 43200);
  v_on    numeric := nullif(current_setting('p2d.on', true), '')::numeric;
  v_x2    numeric := 0;
  v_xo    numeric;
  v_tang  numeric;
  v_den   jsonb;
  v_th    numeric := case when old.qi_thuong_luc > now() - interval '6 hours' then greatest(coalesce(old.qi_thuong, 0), 0) else 0 end;
  v_dung  numeric;
begin
  if (new.data -> 'realm') is not distinct from (old.data -> 'realm') and (new.data -> 'layer') is not distinct from (old.data -> 'layer')
     and (new.data -> 'qi') is not distinct from (old.data -> 'qi') then
    return new;
  end if;
  -- Máy chủ tự trừ tu vi (p2d_pvp_tra: ma bị diệt, hóa ma 22/11/2026) đặt p2d.lk_tru trong cùng giao dịch: không phải người chơi tăng linh khí, bỏ qua
  if current_setting('p2d.lk_tru', true) = '1' then return new; end if;
  select greatest(0, extract(epoch from (least(now(), d.het_luc) - greatest(coalesce(old.qi_luc, old.luu_luc), d.bat_luc))))
    into v_x2 from public.p2d_dan_x2 d where d.user_id = old.user_id;
  v_x2 := least(coalesce(v_x2, 0), 1800);
  if v_on is not null then
    v_xo := least(v_tran + v_toc * v_x2, coalesce(old.qi_xo, v_tran) + v_toc * least(v_dt, v_on + 5) + 20 * least(greatest(v_dt - v_on - 5, 0), 28800) + v_toc * v_x2);
  else
    v_xo := least(v_tran + v_toc * v_x2, coalesce(old.qi_xo, v_tran) + v_toc * v_dt + v_toc * v_x2);
  end if;
  v_tang := public.p2d_tong_lk_that((new.data ->> 'realm')::integer, (new.data ->> 'layer')::integer, (new.data ->> 'qi')::numeric)
          - public.p2d_tong_lk_that(v_r, v_l, (old.data ->> 'qi')::numeric);   -- 20261126040000: linh khí thật (need_mul), nhảy tầng không còn rẻ
  new.qi_luc := now();
  if v_tang <= v_xo + v_th then
    v_dung := least(v_th, greatest(v_tang - v_xo, 0));
    new.qi_thuong := v_th - v_dung;
    new.qi_xo := least(v_tran, v_xo - greatest(v_tang - v_dung, 0));
    return new;
  end if;
  v_xo := v_xo + v_th; new.qi_thuong := 0;
  v_den := public.p2d_lk_tien_that(v_r, v_l, (old.data ->> 'qi')::numeric, v_xo, (new.data ->> 'realm')::integer, (new.data ->> 'layer')::integer);
  -- p2d_lk_tien cắt linh khí về mức cần theo công thức gốc; máy khách cần nhiều hơn (need_mul) nên người Nguyên Anh bị trả về là mất
  -- sạch linh khí đã tích (lỗi 18–19/11). Còn ở tầng cũ thì giữ linh khí cũ + hạn mức, không cắt.
  if (v_den ->> 'realm')::integer = v_r and (v_den ->> 'layer')::integer = v_l then
    v_den := jsonb_set(v_den, '{qi}', to_jsonb(floor(greatest((v_den ->> 'qi')::numeric, least(
      greatest(coalesce((old.data ->> 'qi')::numeric, 0), 0) + greatest(v_xo, 0),
      case when (new.data ->> 'realm')::integer = v_r and (new.data ->> 'layer')::integer = v_l then greatest(coalesce((new.data ->> 'qi')::numeric, 0), 0)
           else greatest(coalesce((old.data ->> 'qi')::numeric, 0), 0) + greatest(v_xo, 0) end)))));
  end if;
  new.data := jsonb_set(jsonb_set(jsonb_set(new.data, '{realm}', v_den -> 'realm'), '{layer}', v_den -> 'layer'), '{qi}', v_den -> 'qi');
  new.canh_gioi := (v_den ->> 'realm')::integer; new.tang := (v_den ->> 'layer')::integer;
  new.qi_xo := 0;
  if v_tang > v_xo + v_tran then perform set_config('p2d.sua_lk', '1', true); end if;
  if v_tang - v_xo > v_can then
    if public.p2d_co_moi(new.user_id) then new.nghi_van := new.nghi_van + 1; end if;
    insert into public.p2d_nghi_van (user_id, ly_do, chi_tiet)
    values (new.user_id, 'linh_khi', jsonb_build_object('tang', round(v_tang), 'xo', round(v_xo), 'giay', round(v_dt), 'lien_lac', round(v_on), 'canh_gioi', v_r, 'den', v_den, 'x2', round(v_x2)));
  end if;
  return new;
end;
$function$;

