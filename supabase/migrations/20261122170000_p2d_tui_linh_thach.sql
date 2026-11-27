-- Túi Linh Thạch trên đất; ma gục vì thiên phạt (chủ dự án 22/11/2026 11:4x "khi ma nhân chết sẽ rơi linh thạch, ai nhặt đc thì sẽ là của ng đó,
-- nếu k ai nhặt đc thì cứ ở đó"; 16:14 "chết vì thiên phạt thì rớt", chọn "Như bị diệt", màu túi "Năm màu như triệu hồi"; luật ở docs/16-HOA-MA.md):
-- 1) p2d_ma_ghi nhận thêm 'tp': ma gục vì thiên phạt ở Thiên Kiếm Tinh (máy chủ phòng giáng đạo cuối, lõi Mang ký): −1 điểm ma (diem.chet), ghi nợ
--    'ma_tp' như bị diệt nhưng không có người diệt, không cộng công đức. 'diet' và 'tp' kèm chỗ gục m, x, y (đơn vị bản đồ) ghi vào nợ.
-- 2) p2d_pvp_tra: nợ 'ma_diet', 'ma_tp' có chỗ gục thì mất 1% Linh Thạch (mat.ma_lt) và 1% tu vi (mat.ma_tu_vi) như cũ, nhưng Linh Thạch không vào
--    Hòm thư người diệt nữa mà thành túi trên đất (p2d_lt_dat) ở chỗ gục. Nợ ghi trước bản này (chưa có chỗ gục) vẫn gửi Hòm thư người diệt.
--    Cờ đỏ (người gục hoặc người diệt): túi bị huỷ, người gục vẫn mất (như đồ rơi PvP).
-- 3) p2d_lt_xem(map): túi chưa ai nhặt trên một tinh cầu (người đã đăng nhập; máy khách vẽ). p2d_lt_nhat: lõi Mang ký, máy chủ phòng gửi chỗ người
--    nhặt đang đứng; cùng tinh cầu, cách túi không quá ma.tui.r, chưa ai nhặt → của người đó (Hòm thư lý do lt_nhat, máy tự nhận ngay). Người cờ đỏ
--    không nhặt được (túi để lại cho người khác). Không ai nhặt thì túi nằm mãi.
-- 4) p2d_ky_cfg dòng 'ma' thêm tui (node tools/ky-cfg.mjs ma).
-- Áp TRƯỚC khi gộp bản máy khách / máy chủ phòng (máy chủ phòng mới gửi 'tp' và chỗ gục; hàm cũ bỏ qua khoá lạ nên thứ tự ngược lại cũng không hỏng gì,
-- chỉ là chưa có túi). Lùi: chạy lại hai hàm p2d_ma_ghi, p2d_pvp_tra trong 20261122040000_p2d_hoa_ma.sql.

alter table public.p2d_pvp_no add column if not exists map text;
alter table public.p2d_pvp_no add column if not exists x integer;
alter table public.p2d_pvp_no add column if not exists y integer;
alter table public.p2d_pvp_no drop constraint if exists p2d_pvp_no_noi_chk;
alter table public.p2d_pvp_no add constraint p2d_pvp_no_noi_chk check (noi in ('ngoai', 'thuong', 'ma_giet', 'ma_diet', 'ma_tp'));
alter table public.p2d_ma_tran drop constraint if exists p2d_ma_tran_e_check;
alter table public.p2d_ma_tran add constraint p2d_ma_tran_e_check check (e in ('hoa', 'giet', 'diet', 'tp'));

-- Túi trên đất. nhat_luc null = còn nằm đó. nhat_boi không gắn khoá ngoài (xoá tài khoản người nhặt không làm túi "sống lại").
create table if not exists public.p2d_lt_dat (
  id bigint generated always as identity primary key,
  map text not null check (map ~ '^[a-z0-9-]{1,40}$'),
  x integer not null,
  y integer not null,
  so bigint not null check (so > 0),
  tu uuid,
  nguon text not null check (nguon in ('ma_diet', 'ma_tp')),
  no_id bigint unique,
  luc timestamptz not null default now(),
  nhat_boi uuid,
  nhat_luc timestamptz
);
create index if not exists p2d_lt_dat_con on public.p2d_lt_dat (map, id) where nhat_luc is null;
alter table public.p2d_lt_dat enable row level security;
revoke all on table public.p2d_lt_dat from public, anon, authenticated;

insert into public.p2d_ky_cfg (k, v) values ('ma', '{"diem":{"hoa":1,"giet":3,"chet":1},"mat":{"ma_lt":0.01,"ma_tu_vi":0.01,"nguoi_lt":0.02},"lt_ngay":10,"nghi_cap":5,"min_tl":4,"tang":9,"can":[40,80,160,320,640,1280,2560,5120,10240,7381,9595,12473,16215,21080,27404,35625,46313,60207,119653,155548,202213,262877,341740,444262,577540,750802,976043,3735014,3847065,3962477,4081351,4203791,4329905,4459802,4593596,4731404,13723792,14135506,14559571,14996358,15446249,15909636,16386925,16878533,17384889,27456534,28280230,29128637,30002496,30902571,31829648,32784538,33768074,34781116,54897070,56543982,58240301,59987510,61787136,63640750,65549972,67516471,69541965,109785703,113079275,116471653,119965802,123564776,127271720,131089871,135022567,139073245,224582011,231319472,238259056,245406827,252769032,260352103,268162666,276207546,284493773],"tui":{"r":64}}'::jsonb) on conflict (k) do update set v = excluded.v;

create or replace function public.p2d_ma_ghi(p_ts bigint, p_ds text, p_ky text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_khoa text := (select v from public.p2d_bi_mat where k = 'cf_mang'); v_c jsonb := (select v from public.p2d_ky_cfg where k = 'ma');
  v_d jsonb; v_e text; v_k uuid; v_v uuid; v_mk public.p2d_ma_hoa%rowtype; v_mv public.p2d_ma_hoa%rowtype;
  v_hom date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; v_no boolean := false; v_m text; v_x integer; v_y integer;
begin
  if v_khoa is null or v_c is null or p_ts is null or p_ds is null or p_ky is null or length(p_ds) > 500 then raise exception 'sai' using errcode = '42501'; end if;
  if abs(extract(epoch from now()) * 1000 - p_ts) > 120000 then raise exception 'het_gio' using errcode = '42501'; end if;
  if encode(extensions.hmac(p_ts::text || '.' || p_ds, v_khoa, 'sha256'), 'hex') <> lower(p_ky) then raise exception 'sai_ky' using errcode = '42501'; end if;
  v_d := p_ds::jsonb; v_e := v_d ->> 'e';
  -- chỗ gục (máy chủ phòng gửi cho 'diet', 'tp' từ 22/11/2026 16:14): túi Linh Thạch rơi ở đó (p2d_pvp_tra); sai dạng thì coi như không có
  if coalesce(v_d ->> 'm', '') ~ '^[a-z0-9-]{1,40}$' and jsonb_typeof(v_d -> 'x') = 'number' and jsonb_typeof(v_d -> 'y') = 'number'
     and abs((v_d ->> 'x')::numeric) < 1000000 and abs((v_d ->> 'y')::numeric) < 1000000 then
    v_m := v_d ->> 'm'; v_x := round((v_d ->> 'x')::numeric); v_y := round((v_d ->> 'y')::numeric);
  end if;
  if v_e = 'hoa' then
    v_k := (v_d ->> 'u')::uuid;
    if not public.p2d_ma_du_tang(v_k, v_c) then return jsonb_build_object('ma', 0, 'loi', 'moi'); end if;
    insert into public.p2d_ma_hoa (user_id) values (v_k) on conflict (user_id) do nothing;
    select * into v_mk from public.p2d_ma_hoa where user_id = v_k for update;
    if v_mk.ma > 0 then return jsonb_build_object('ma', v_mk.ma); end if;   -- đã là ma (máy chủ phòng quên): trả điểm thật
    insert into public.p2d_ma_tran (ts, e, ke) values (p_ts, 'hoa', v_k) on conflict do nothing;
    if not found then return jsonb_build_object('ma', v_mk.ma); end if;   -- tin gửi trùng
    update public.p2d_ma_hoa set ma = (v_c -> 'diem' ->> 'hoa')::integer, lan = lan + 1, cap_nhat = now() where user_id = v_k returning * into v_mk;
    return jsonb_build_object('ma', v_mk.ma);
  end if;
  if v_e = 'tp' then   -- ma v_v gục vì thiên phạt ở Thiên Kiếm Tinh (máy chủ phòng giáng đạo cuối): như bị diệt nhưng không ai diệt, không công đức
    v_v := (v_d ->> 'u')::uuid;
    if v_v is null then raise exception 'sai' using errcode = '22023'; end if;
    insert into public.p2d_ma_hoa (user_id) values (v_v) on conflict (user_id) do nothing;
    select * into v_mv from public.p2d_ma_hoa where user_id = v_v for update;
    if v_mv.ma <= 0 then return jsonb_build_object('ma', 0); end if;
    insert into public.p2d_ma_tran (ts, e, ke) values (p_ts, 'tp', v_v) on conflict do nothing;
    if not found then return jsonb_build_object('ma', v_mv.ma); end if;   -- tin gửi trùng
    update public.p2d_ma_hoa set ma = greatest(ma - (v_c -> 'diem' ->> 'chet')::integer, 0), chet = chet + 1, cap_nhat = now() where user_id = v_v returning * into v_mv;
    insert into public.p2d_pvp_no (ts, ke, nan, noi, map, x, y) values (p_ts, v_v, v_v, 'ma_tp', v_m, v_x, v_y) on conflict do nothing;
    v_no := found;
    return jsonb_build_object('ma', v_mv.ma, 'no', v_no);
  end if;
  if v_e is distinct from 'giet' and v_e is distinct from 'diet' then raise exception 'sai' using errcode = '22023'; end if;
  v_k := (v_d ->> 'k')::uuid; v_v := (v_d ->> 'v')::uuid;
  if v_k is null or v_v is null or v_k = v_v then raise exception 'sai' using errcode = '22023'; end if;
  insert into public.p2d_ma_hoa (user_id) values (v_k), (v_v) on conflict (user_id) do nothing;
  perform 1 from public.p2d_ma_hoa where user_id in (v_k, v_v) order by user_id for update;   -- khoá cả hai theo một thứ tự (khỏi khoá chéo)
  select * into v_mk from public.p2d_ma_hoa where user_id = v_k;
  select * into v_mv from public.p2d_ma_hoa where user_id = v_v;
  if v_e = 'giet' then   -- ma v_k đồ sát người v_v
    if v_mk.ma <= 0 then return jsonb_build_object('ma', 0); end if;
    if v_mv.ma > 0 or not public.p2d_ma_du_tang(v_v, v_c) then return jsonb_build_object('ma', v_mk.ma); end if;
    insert into public.p2d_ma_tran (ts, e, ke, nan) values (p_ts, 'giet', v_k, v_v) on conflict do nothing;
    if not found then return jsonb_build_object('ma', v_mk.ma); end if;
    update public.p2d_ma_hoa
       set ma = ma + (v_c -> 'diem' ->> 'giet')::integer, giet = giet + 1, ngay = v_hom,
           giet_ngay = case when ngay is distinct from v_hom then 1 else giet_ngay + 1 end, cap_nhat = now()
     where user_id = v_k returning * into v_mk;
    if v_mk.giet_ngay <= (v_c ->> 'lt_ngay')::integer then
      insert into public.p2d_pvp_no (ts, ke, nan, noi) values (p_ts, v_k, v_v, 'ma_giet') on conflict do nothing;
      v_no := found;
    end if;
    perform public.p2d_ma_soi(v_k, v_v, 'giet', v_c);
    return jsonb_build_object('ma', v_mk.ma, 'no', v_no);
  end if;
  -- người v_k diệt ma v_v
  if v_mv.ma <= 0 then return jsonb_build_object('ma', 0); end if;
  if v_mk.ma > 0 or not public.p2d_ma_du_tang(v_k, v_c) then return jsonb_build_object('ma', v_mv.ma); end if;
  insert into public.p2d_ma_tran (ts, e, ke, nan) values (p_ts, 'diet', v_k, v_v) on conflict do nothing;
  if not found then return jsonb_build_object('ma', v_mv.ma); end if;
  update public.p2d_ma_hoa set ma = greatest(ma - (v_c -> 'diem' ->> 'chet')::integer, 0), chet = chet + 1, cap_nhat = now() where user_id = v_v returning * into v_mv;
  update public.p2d_ma_hoa set cong_duc = cong_duc + 1, cap_nhat = now() where user_id = v_k returning * into v_mk;
  insert into public.p2d_pvp_no (ts, ke, nan, noi, map, x, y) values (p_ts, v_k, v_v, 'ma_diet', v_m, v_x, v_y) on conflict do nothing;
  v_no := found;
  perform public.p2d_ma_soi(v_k, v_v, 'diet', v_c);
  return jsonb_build_object('ma', v_mv.ma, 'cd', v_mk.cong_duc, 'no', v_no);
end;
$function$;
revoke all on function public.p2d_ma_ghi(bigint, text, text) from public;
grant execute on function public.p2d_ma_ghi(bigint, text, text) to anon, authenticated, service_role;

create or replace function public.p2d_pvp_tra()
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_uid uuid := public.p2d_uid(); v_nv public.p2d_nhan_vat%rowtype; v_n record; v_ra jsonb := '[]'::jsonb;
  v_lt numeric; v_mat bigint; v_bag jsonb; v_eq jsonb; v_cands jsonb; v_c jsonb; v_kq jsonb; v_thu jsonb; v_huy boolean; v_ten_ke text; v_ten text;
  v_ngoai boolean; v_noi text; v_ma jsonb := (select v from public.p2d_ky_cfg where k = 'ma'); v_tv boolean := false;
  v_r integer; v_l integer; v_tl integer; v_q numeric; v_mtv numeric; v_tut boolean; v_ntang integer; v_tui bigint;
begin
  select * into v_nv from public.p2d_nhan_vat where user_id = v_uid for update;
  if not found then return jsonb_build_object('mat', v_ra); end if;
  v_ten := coalesce(v_nv.ten, 'Đạo hữu');
  for v_n in select * from public.p2d_pvp_no n where n.nan = v_uid and n.tra_luc is null order by n.id for update loop
    select coalesce(k.ten, 'Đạo hữu') into v_ten_ke from public.p2d_nhan_vat k where k.user_id = v_n.ke;
    v_huy := public.p2d_la_co_do(v_n.ke) or public.p2d_la_co_do(v_uid);   -- cờ đỏ thật (p2d_co_do), không phải nghi_van
    v_noi := coalesce(v_n.noi, 'ngoai'); v_ngoai := v_noi = 'ngoai';
    v_lt := coalesce(case when jsonb_typeof(v_nv.data -> 'lingshi') = 'number' then (v_nv.data ->> 'lingshi')::numeric end, 0);
    v_mat := greatest(0, floor(v_lt * case v_noi when 'ngoai' then 0.1 when 'ma_giet' then coalesce((v_ma -> 'mat' ->> 'nguoi_lt')::numeric, 0.02)
                                                 when 'ma_diet' then coalesce((v_ma -> 'mat' ->> 'ma_lt')::numeric, 0.01)
                                                 when 'ma_tp' then coalesce((v_ma -> 'mat' ->> 'ma_lt')::numeric, 0.01) else 0.05 end))::bigint;
    if v_mat > 0 then v_nv.data := jsonb_set(v_nv.data, '{lingshi}', to_jsonb(v_lt - v_mat)); end if;
    v_kq := jsonb_build_object('lt', v_mat, 'ke_ten', v_ten_ke, 'noi', v_noi);
    v_thu := jsonb_build_object('coins', v_mat, 'tu', v_ten);
    if v_ngoai then
      v_bag := case when jsonb_typeof(v_nv.data -> 'bag') = 'array' then v_nv.data -> 'bag' else '[]'::jsonb end;
      v_eq := case when jsonb_typeof(v_nv.data -> 'equip') = 'object' then v_nv.data -> 'equip' else '{}'::jsonb end;
      select coalesce(jsonb_agg(c), '[]'::jsonb) into v_cands from (
        select jsonb_build_object('i', b) c from jsonb_array_elements(v_bag) b
          where jsonb_typeof(b -> 'uid') = 'number' and not exists (select 1 from jsonb_each(v_eq) e where e.value = b -> 'uid')
        union all
        select jsonb_build_object('m', e.key, 'n', greatest(1, floor((e.value #>> '{}')::numeric * 0.1))::bigint) from jsonb_each(
            case when jsonb_typeof(v_nv.data -> 'mats') = 'object' then v_nv.data -> 'mats' else '{}'::jsonb end) e
          where jsonb_typeof(e.value) = 'number' and (e.value #>> '{}')::numeric >= 1 and e.key ~ '^[a-z0-9-]{1,40}$'
      ) s;
      if jsonb_array_length(v_cands) > 0 then
        v_c := v_cands -> floor(random() * jsonb_array_length(v_cands))::int;
        if v_c ? 'i' then
          v_nv.data := jsonb_set(v_nv.data, '{bag}', coalesce((select jsonb_agg(b) from jsonb_array_elements(v_bag) b where b -> 'uid' is distinct from v_c -> 'i' -> 'uid'), '[]'::jsonb));
          v_kq := v_kq || jsonb_build_object('item_uid', v_c -> 'i' -> 'uid', 'item', (v_c -> 'i') - 'sig');
          v_thu := v_thu || jsonb_build_object('item', (v_c -> 'i') - 'sig');
        else
          v_nv.data := jsonb_set(v_nv.data, array['mats', v_c ->> 'm'], to_jsonb((v_nv.data -> 'mats' ->> (v_c ->> 'm'))::numeric - (v_c ->> 'n')::numeric));
          v_kq := v_kq || jsonb_build_object('mat_id', v_c ->> 'm', 'n', (v_c ->> 'n')::bigint);
          v_thu := v_thu || jsonb_build_object('mat', jsonb_build_object('id', v_c ->> 'm', 'n', (v_c ->> 'n')::bigint));
        end if;
      end if;
    end if;
    -- Hóa ma: ma bị diệt mất ma_tu_vi thanh linh khí tầng đang ở (bảng can như máy khách); thiếu thì tụt một tầng, linh khí = thanh tầng dưới trừ phần thiếu
    if v_noi in ('ma_diet', 'ma_tp') and v_ma is not null then
      v_ntang := (v_ma ->> 'tang')::integer;
      v_r := least(greatest(coalesce(case when jsonb_typeof(v_nv.data -> 'realm') = 'number' then floor((v_nv.data ->> 'realm')::numeric)::integer end, v_nv.canh_gioi, 0), 0),
                   jsonb_array_length(v_ma -> 'can') / v_ntang - 1);
      v_l := least(greatest(coalesce(case when jsonb_typeof(v_nv.data -> 'layer') = 'number' then floor((v_nv.data ->> 'layer')::numeric)::integer end, v_nv.tang, 1), 1), v_ntang);
      v_tl := v_r * v_ntang + v_l - 1;
      v_q := greatest(coalesce(case when jsonb_typeof(v_nv.data -> 'qi') = 'number' then (v_nv.data ->> 'qi')::numeric end, 0), 0);
      v_mtv := ceil((v_ma -> 'can' ->> v_tl)::numeric * (v_ma -> 'mat' ->> 'ma_tu_vi')::numeric);
      v_tut := v_q < v_mtv and v_tl > 0;
      if v_q >= v_mtv then v_q := v_q - v_mtv;
      elsif v_tl > 0 then v_tl := v_tl - 1; v_q := greatest(0, (v_ma -> 'can' ->> v_tl)::numeric - (v_mtv - v_q));
      else v_q := 0;
      end if;
      v_r := v_tl / v_ntang; v_l := v_tl % v_ntang + 1; v_q := floor(v_q);
      v_nv.data := jsonb_set(jsonb_set(jsonb_set(v_nv.data, '{realm}', to_jsonb(v_r)), '{layer}', to_jsonb(v_l)), '{qi}', to_jsonb(v_q));
      v_nv.canh_gioi := v_r; v_nv.tang := v_l; v_tv := true;
      v_kq := v_kq || jsonb_build_object('tv', jsonb_build_object('mat', v_mtv, 'realm', v_r, 'layer', v_l, 'qi', v_q, 'tut', v_tut));
    end if;
    -- Ma gục (bị diệt, thiên phạt) có chỗ gục: Linh Thạch rơi thành túi ở đó, ai nhặt được là của người đó (22/11/2026 16:14); cờ đỏ thì huỷ như cũ.
    -- Nợ ghi trước bản này (chưa có chỗ gục) vẫn gửi Hòm thư người diệt như cũ; 'ma_tp' không có người diệt nên không gửi thư.
    v_tui := null;
    if v_noi in ('ma_diet', 'ma_tp') and v_n.map is not null then
      if not v_huy and v_mat > 0 then
        insert into public.p2d_lt_dat (map, x, y, so, tu, nguon, no_id) values (v_n.map, v_n.x, v_n.y, v_mat, v_uid, v_noi, v_n.id)
          on conflict (no_id) do nothing returning id into v_tui;
        if v_tui is not null then
          v_kq := v_kq || jsonb_build_object('tui', jsonb_build_object('id', v_tui, 'map', v_n.map, 'x', v_n.x, 'y', v_n.y, 'so', v_mat));
        end if;
      end if;
    elsif not v_huy and v_noi <> 'ma_tp' and (v_mat > 0 or v_thu ? 'item' or v_thu ? 'mat') then
      insert into public.p2d_hom_thu (user_id, noi_dung, ly_do)
      values (v_n.ke, v_thu, case v_noi when 'ma_giet' then 'ma_ha' when 'ma_diet' then 'ma_diet' else 'pvp_ha' end);
    end if;
    v_kq := v_kq || jsonb_build_object('huy', v_huy);
    update public.p2d_pvp_no set tra_luc = now(), ket_qua = v_kq where id = v_n.id;
    v_ra := v_ra || jsonb_build_array(v_kq);
  end loop;
  if jsonb_array_length(v_ra) > 0 then
    if v_tv then perform set_config('p2d.lk_tru', '1', true); end if;   -- tu vi do máy chủ trừ: bộ hãm linh khí bỏ qua lần ghi này
    update public.p2d_nhan_vat set data = v_nv.data, canh_gioi = v_nv.canh_gioi, tang = v_nv.tang, phien_ban = phien_ban + 1, updated_at = now()
     where user_id = v_uid returning phien_ban into v_nv.phien_ban;
    if v_tv then perform set_config('p2d.lk_tru', '', true); end if;
  end if;
  return jsonb_build_object('mat', v_ra, 'phien_ban', v_nv.phien_ban);
end;
$function$;
revoke all on function public.p2d_pvp_tra() from public, anon;
grant execute on function public.p2d_pvp_tra() to authenticated;

-- Túi chưa ai nhặt trên một tinh cầu (mới nhất trước, tối đa 300). Phải đăng nhập (p2d_uid); không trả ai rơi, ai nhặt.
create or replace function public.p2d_lt_xem(p_map text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare v_uid uuid := public.p2d_uid();
begin
  if v_uid is null or p_map is null or p_map !~ '^[a-z0-9-]{1,40}$' then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'x', d.x, 'y', d.y, 'so', d.so) order by d.id desc)
                     from (select id, x, y, so from public.p2d_lt_dat where map = p_map and nhat_luc is null order by id desc limit 300) d), '[]'::jsonb);
end;
$function$;
revoke all on function public.p2d_lt_xem(text) from public, anon;
grant execute on function public.p2d_lt_xem(text) to authenticated;

-- Nhặt túi: lõi Mang ký (máy chủ phòng gửi u = người nhặt, id túi, m = tinh cầu, x, y = chỗ người đó đang đứng theo phòng). Ai tới trước được.
-- Trả { so, id } hoặc { loi: 'het' (không còn / đã có người nhặt), 'xa' (khác tinh cầu, chưa tới chỗ), 'chua_luu', 'co_do' }.
create or replace function public.p2d_lt_nhat(p_ts bigint, p_ds text, p_ky text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_khoa text := (select v from public.p2d_bi_mat where k = 'cf_mang'); v_c jsonb := (select v from public.p2d_ky_cfg where k = 'ma');
  v_d jsonb; v_u uuid; v_id bigint; v_t public.p2d_lt_dat%rowtype; v_r numeric;
begin
  if v_khoa is null or p_ts is null or p_ds is null or p_ky is null or length(p_ds) > 300 then raise exception 'sai' using errcode = '42501'; end if;
  if abs(extract(epoch from now()) * 1000 - p_ts) > 120000 then raise exception 'het_gio' using errcode = '42501'; end if;
  if encode(extensions.hmac(p_ts::text || '.' || p_ds, v_khoa, 'sha256'), 'hex') <> lower(p_ky) then raise exception 'sai_ky' using errcode = '42501'; end if;
  v_d := p_ds::jsonb; v_u := (v_d ->> 'u')::uuid;
  if v_u is null or jsonb_typeof(v_d -> 'id') is distinct from 'number' or jsonb_typeof(v_d -> 'x') is distinct from 'number'
     or jsonb_typeof(v_d -> 'y') is distinct from 'number' then raise exception 'sai' using errcode = '22023'; end if;
  v_id := (v_d ->> 'id')::bigint;
  select * into v_t from public.p2d_lt_dat where id = v_id for update;
  if not found or v_t.nhat_luc is not null then return jsonb_build_object('loi', 'het'); end if;
  v_r := coalesce((v_c -> 'tui' ->> 'r')::numeric, 64);
  if v_t.map is distinct from (v_d ->> 'm')
     or sqrt(power((v_d ->> 'x')::numeric - v_t.x, 2) + power((v_d ->> 'y')::numeric - v_t.y, 2)) > v_r then return jsonb_build_object('loi', 'xa'); end if;
  if not exists (select 1 from public.p2d_nhan_vat where user_id = v_u) then return jsonb_build_object('loi', 'chua_luu'); end if;
  if public.p2d_la_co_do(v_u) then return jsonb_build_object('loi', 'co_do'); end if;
  update public.p2d_lt_dat set nhat_boi = v_u, nhat_luc = now() where id = v_id;
  insert into public.p2d_hom_thu (user_id, noi_dung, ly_do) values (v_u, jsonb_build_object('coins', v_t.so, 'tu', 'Túi Linh Thạch'), 'lt_nhat');
  return jsonb_build_object('so', v_t.so, 'id', v_id);
end;
$function$;
revoke all on function public.p2d_lt_nhat(bigint, text, text) from public;
grant execute on function public.p2d_lt_nhat(bigint, text, text) to anon, authenticated, service_role;

-- Tự kiểm tra (hoàn tác dữ liệu thử). pg_temp.p2d_ky_thu ký như lõi Mang.
create or replace function pg_temp.p2d_ky_thu(p_ham text, p_ds jsonb, p_ts bigint)
returns jsonb language plpgsql as $$
declare v_ky text := encode(extensions.hmac(p_ts::text || '.' || p_ds::text, (select v from public.p2d_bi_mat where k = 'cf_mang'), 'sha256'), 'hex'); r jsonb;
begin
  if p_ham = 'ghi' then r := public.p2d_ma_ghi(p_ts, p_ds::text, v_ky); else r := public.p2d_lt_nhat(p_ts, p_ds::text, v_ky); end if;
  return r;
end $$;
do $kt$
declare
  v_hong text := ''; a uuid := '00000000-0000-4000-8000-0000000000d1'; b uuid := '00000000-0000-4000-8000-0000000000d2';
  c uuid := '00000000-0000-4000-8000-0000000000d3'; z uuid := '00000000-0000-4000-8000-0000000000d4';
  t0 bigint := floor(extract(epoch from now()) * 1000)::bigint; r jsonb; d jsonb; v_tui bigint; v_tui2 bigint; v_n integer; v_lt numeric;
  v_c jsonb := (select v from public.p2d_ky_cfg where k = 'ma');
  v_khoa_tam text := encode(extensions.gen_random_bytes(32), 'hex');
  v_tao_khoa boolean := not exists (select 1 from public.p2d_bi_mat where k = 'cf_mang');
begin
  -- Project mới chưa có Cloudflare đăng ký khoá; tự tạo khoá tạm chỉ cho tự kiểm tra.
  if v_tao_khoa then insert into public.p2d_bi_mat (k, v) values ('cf_mang', v_khoa_tam) on conflict (k) do nothing; end if;
  begin
    insert into auth.users (id, email, aud, role) values (a, 'kt_tui_a@nguoichoi.invalid', 'authenticated', 'authenticated'),
      (b, 'kt_tui_b@nguoichoi.invalid', 'authenticated', 'authenticated'), (c, 'kt_tui_c@nguoichoi.invalid', 'authenticated', 'authenticated'),
      (z, 'kt_tui_z@nguoichoi.invalid', 'authenticated', 'authenticated');
    insert into public.p2d_nhan_vat (user_id, data, canh_gioi, tang, phien_ban, luu_luc) values
      (a, '{"realm": 1, "layer": 5, "qi": 5000, "lingshi": 100000, "flags": {}}', 1, 5, 1, now()),
      (b, '{"realm": 1, "layer": 5, "qi": 0, "lingshi": 50000, "flags": {}}', 1, 5, 1, now()),
      (c, '{"realm": 0, "layer": 2, "qi": 0, "lingshi": 10, "flags": {}}', 0, 2, 1, now()),
      (z, '{"realm": 1, "layer": 1, "qi": 0, "lingshi": 10, "flags": {}}', 1, 1, 1, now());
    -- 1. a hóa ma rồi có 4 điểm (như vừa đồ sát một người); b diệt a ở Thiên Kiếm Tinh, kèm chỗ gục → nợ ma_diet có chỗ
    r := pg_temp.p2d_ky_thu('ghi', jsonb_build_object('e', 'hoa', 'u', a), t0 + 1);
    update public.p2d_ma_hoa set ma = 4 where user_id = a;
    r := pg_temp.p2d_ky_thu('ghi', jsonb_build_object('e', 'diet', 'k', b, 'v', a, 'n', 'thuong', 'm', 'thien-kiem-phong', 'x', 1000.4, 'y', 1200), t0 + 2);
    if (r ->> 'ma')::integer <> 3 or not coalesce((r ->> 'no')::boolean, false)
       or not exists (select 1 from public.p2d_pvp_no where nan = a and noi = 'ma_diet' and map = 'thien-kiem-phong' and x = 1000 and y = 1200) then
      v_hong := v_hong || ' | diệt ma kèm chỗ gục: ' || r::text;
    end if;
    -- 2. a trả nợ: mất 1% Linh Thạch và 1% tu vi; Linh Thạch thành túi ở chỗ gục, không có thư cho b
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    r := public.p2d_pvp_tra();
    select data into d from public.p2d_nhan_vat where user_id = a;
    v_tui := (r -> 'mat' -> 0 -> 'tui' ->> 'id')::bigint;
    if (d ->> 'lingshi')::numeric <> 99000 or (d ->> 'qi')::numeric >= 5000 or v_tui is null
       or not exists (select 1 from public.p2d_lt_dat where id = v_tui and map = 'thien-kiem-phong' and x = 1000 and y = 1200 and so = 1000 and tu = a and nguon = 'ma_diet' and nhat_luc is null)
       or exists (select 1 from public.p2d_hom_thu where user_id = b) then
      v_hong := v_hong || ' | trả nợ diệt ma thành túi: ' || r::text || ' / ' || d::text;
    end if;
    -- 3. người đã đăng nhập thấy túi trên đúng tinh cầu, tinh cầu khác không thấy
    perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
    r := public.p2d_lt_xem('thien-kiem-phong');
    if not exists (select 1 from jsonb_array_elements(r) e where (e ->> 'id')::bigint = v_tui and (e ->> 'so')::bigint = 1000 and (e ->> 'x')::integer = 1000)
       or jsonb_array_length(public.p2d_lt_xem('dao-xich-dien')) <> 0 or jsonb_array_length(public.p2d_lt_xem('sai tên')) <> 0 then
      v_hong := v_hong || ' | xem túi: ' || r::text;
    end if;
    -- 4. nhặt: đứng xa thì chưa được, khác tinh cầu không được, tới nơi thì được, người sau báo hết; Linh Thạch vào Hòm thư người nhặt
    r := pg_temp.p2d_ky_thu('nhat', jsonb_build_object('u', c, 'id', v_tui, 'm', 'thien-kiem-phong', 'x', 1000 + (v_c -> 'tui' ->> 'r')::numeric + 5, 'y', 1200), t0 + 3);
    if r is distinct from '{"loi": "xa"}'::jsonb then v_hong := v_hong || ' | nhặt từ xa: ' || r::text; end if;
    r := pg_temp.p2d_ky_thu('nhat', jsonb_build_object('u', c, 'id', v_tui, 'm', 'dao-xich-dien', 'x', 1000, 'y', 1200), t0 + 4);
    if r is distinct from '{"loi": "xa"}'::jsonb then v_hong := v_hong || ' | nhặt khác tinh cầu: ' || r::text; end if;
    r := pg_temp.p2d_ky_thu('nhat', jsonb_build_object('u', c, 'id', v_tui, 'm', 'thien-kiem-phong', 'x', 1010, 'y', 1190), t0 + 5);
    if (r ->> 'so')::bigint is distinct from 1000 or not exists (select 1 from public.p2d_hom_thu where user_id = c and ly_do = 'lt_nhat' and (noi_dung ->> 'coins')::bigint = 1000) then
      v_hong := v_hong || ' | nhặt được: ' || r::text;
    end if;
    r := pg_temp.p2d_ky_thu('nhat', jsonb_build_object('u', b, 'id', v_tui, 'm', 'thien-kiem-phong', 'x', 1000, 'y', 1200), t0 + 6);
    if r is distinct from '{"loi": "het"}'::jsonb or (select count(*) from public.p2d_hom_thu where ly_do = 'lt_nhat' and user_id in (b, c)) <> 1 then
      v_hong := v_hong || ' | nhặt lần hai: ' || r::text;
    end if;
    if jsonb_array_length(public.p2d_lt_xem('thien-kiem-phong')) <> 0 then v_hong := v_hong || ' | túi đã nhặt vẫn hiện'; end if;
    -- 5. thiên phạt: a (3 điểm) gục ở Thiên Kiếm Tinh → 2 điểm, nợ ma_tp kèm chỗ; gửi trùng không ghi thêm; trả nợ: túi 1% (990), mất tu vi, không thư
    r := pg_temp.p2d_ky_thu('ghi', jsonb_build_object('e', 'tp', 'u', a, 'n', 'thuong', 'm', 'thien-kiem-phong', 'x', 1040, 'y', 1220), t0 + 7);
    if r is distinct from '{"ma": 2, "no": true}'::jsonb then v_hong := v_hong || ' | thiên phạt: ' || r::text; end if;
    r := pg_temp.p2d_ky_thu('ghi', jsonb_build_object('e', 'tp', 'u', a, 'n', 'thuong', 'm', 'thien-kiem-phong', 'x', 1040, 'y', 1220), t0 + 7);
    if r is distinct from '{"ma": 2}'::jsonb or (select count(*) from public.p2d_pvp_no where nan = a and noi = 'ma_tp') <> 1 then v_hong := v_hong || ' | thiên phạt gửi trùng: ' || r::text; end if;
    if (select cong_duc from public.p2d_ma_hoa where user_id = a) <> 0 then v_hong := v_hong || ' | thiên phạt cộng công đức'; end if;
    select (data ->> 'qi')::numeric into v_lt from public.p2d_nhan_vat where user_id = a;
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    v_n := (select count(*) from public.p2d_hom_thu);
    r := public.p2d_pvp_tra();
    select data into d from public.p2d_nhan_vat where user_id = a;
    v_tui2 := (r -> 'mat' -> 0 -> 'tui' ->> 'id')::bigint;
    if (d ->> 'lingshi')::numeric <> 98010 or (d ->> 'qi')::numeric >= v_lt or v_tui2 is null or (select count(*) from public.p2d_hom_thu) <> v_n
       or not exists (select 1 from public.p2d_lt_dat where id = v_tui2 and so = 990 and nguon = 'ma_tp' and x = 1040) then
      v_hong := v_hong || ' | trả nợ thiên phạt: ' || r::text || ' / ' || d::text;
    end if;
    -- 6. thiên phạt người không phải ma: không đổi gì
    r := pg_temp.p2d_ky_thu('ghi', jsonb_build_object('e', 'tp', 'u', b, 'n', 'thuong', 'm', 'thien-kiem-phong', 'x', 1, 'y', 1), t0 + 8);
    if r is distinct from '{"ma": 0}'::jsonb or exists (select 1 from public.p2d_pvp_no where nan = b) then v_hong := v_hong || ' | thiên phạt người thường: ' || r::text; end if;
    -- 7. nợ diệt ma ghi trước bản này (chưa có chỗ gục): vẫn gửi Hòm thư người diệt như cũ, không có túi
    insert into public.p2d_pvp_no (ts, ke, nan, noi) values (t0 + 9, b, a, 'ma_diet');
    r := public.p2d_pvp_tra();
    if (r -> 'mat' -> 0) ? 'tui' or not exists (select 1 from public.p2d_hom_thu where user_id = b and ly_do = 'ma_diet' and (noi_dung ->> 'coins')::bigint = 980) then
      v_hong := v_hong || ' | nợ cũ không chỗ gục: ' || r::text;
    end if;
    -- 8. người nhặt cờ đỏ không nhặt được, túi còn cho người khác; người gục cờ đỏ thì túi bị huỷ
    insert into public.p2d_co_do (user_id, ly_do) values (z, 'kt_tui');
    r := pg_temp.p2d_ky_thu('nhat', jsonb_build_object('u', z, 'id', v_tui2, 'm', 'thien-kiem-phong', 'x', 1040, 'y', 1220), t0 + 10);
    if r is distinct from '{"loi": "co_do"}'::jsonb or not exists (select 1 from public.p2d_lt_dat where id = v_tui2 and nhat_luc is null) then
      v_hong := v_hong || ' | người cờ đỏ nhặt: ' || r::text;
    end if;
    insert into public.p2d_co_do (user_id, ly_do) values (a, 'kt_tui');
    insert into public.p2d_pvp_no (ts, ke, nan, noi, map, x, y) values (t0 + 11, b, a, 'ma_diet', 'thien-kiem-phong', 5, 5);
    r := public.p2d_pvp_tra();
    if (r -> 'mat' -> 0) ? 'tui' or exists (select 1 from public.p2d_lt_dat where x = 5 and y = 5) or not coalesce((r -> 'mat' -> 0 ->> 'huy')::boolean, false) then
      v_hong := v_hong || ' | người gục cờ đỏ vẫn rơi túi: ' || r::text;
    end if;
    -- 9. chữ ký sai: từ chối
    begin
      perform public.p2d_lt_nhat(t0 + 12, jsonb_build_object('u', c, 'id', v_tui2, 'm', 'thien-kiem-phong', 'x', 1040, 'y', 1220)::text, 'abc');
      v_hong := v_hong || ' | nhặt với chữ ký sai mà qua';
    exception when others then
      if sqlerrm <> 'sai_ky' then v_hong := v_hong || ' | chữ ký sai báo lạ: ' || sqlerrm; end if;
    end;
    raise exception using errcode = 'P0001', message = 'p2d_hoan_tac_thu';
  exception when others then
    if sqlerrm <> 'p2d_hoan_tac_thu' then v_hong := v_hong || ' | lỗi bất ngờ: ' || sqlerrm; end if;
  end;
  if v_tao_khoa then delete from public.p2d_bi_mat where k = 'cf_mang' and v = v_khoa_tam; end if;
  if v_hong <> '' then raise exception 'Tự kiểm tra túi Linh Thạch TRƯỢT (đã hoàn tác cả migration):%', v_hong; end if;
  raise notice 'Tự kiểm tra túi Linh Thạch: đạt hết';
end
$kt$;
drop function if exists pg_temp.p2d_ky_thu(text, jsonb, bigint);
