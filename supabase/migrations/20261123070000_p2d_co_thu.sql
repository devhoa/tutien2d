-- Cổ Thụ Ngàn Năm (chủ dự án 23/11/2026 15:33 và bảng câu hỏi: "Ngừng sét, không ai đánh", "0,5% thanh tầng đang ở", "Đả tọa dưới cây, chia đều",
-- "Giữ phần đã ngồi"). Luật ở docs/16-HOA-MA.md mục "Cổ Thụ Ngàn Năm"; số ở data/pvp.json → ma.co_thu, server.ma.co.
-- Máy chủ phòng (cloud/src/co-thu.js) đếm phút người ngồi đả tọa trong vòng sáng quanh gốc cây, lõi Mang ký gửi lên đây:
-- 1) p2d_ma_ghi nhận thêm 'sh': ma u ngồi đủ một phút: −1 điểm ma, ghi nợ 'ma_sh' (không Linh Thạch, không túi, không thư).
-- 2) p2d_pvp_tra: nợ 'ma_sh' trừ co_thu.tu_vi (0,5%) thanh linh khí tầng đang ở như khi bị diệt (thiếu thì tụt một tầng); phần trừ được gửi lên cây
--    (bảng p2d_co_thu). Người cờ đỏ vẫn bị trừ, nhưng phần đó không vào cây.
-- 3) p2d_co_thu_hap: người thường ngồi đủ một phút trong vòng: chia đều linh khí cây đang có, mỗi người tối đa share × linh khí chém quái mỗi phút
--    của cảnh giới mình (farm_h như đả tọa thường), qua Hòm thư {"qi"} lý do 'co_thu' (máy tự nhận ngay). Mỗi người một lần mỗi 50 giây.
-- 4) p2d_co_thu_xem: linh khí cây đang có (để vẽ vòng sáng).
-- Không đụng bảng đang có ngoài hai ràng buộc kiểm (thêm giá trị). Áp TRƯỚC khi gộp (máy chủ phòng mới gửi 'sh'; hàm cũ sẽ báo 'sai').

alter table public.p2d_pvp_no drop constraint if exists p2d_pvp_no_noi_chk;
alter table public.p2d_pvp_no add constraint p2d_pvp_no_noi_chk check (noi in ('ngoai', 'thuong', 'ma_giet', 'ma_diet', 'ma_tp', 'ma_sh'));
alter table public.p2d_ma_tran drop constraint if exists p2d_ma_tran_e_check;
alter table public.p2d_ma_tran add constraint p2d_ma_tran_e_check check (e in ('hoa', 'giet', 'diet', 'tp', 'sh'));

create table if not exists public.p2d_co_thu (
  k text primary key check (k = 'goc'),
  linh_khi numeric not null default 0 check (linh_khi >= 0),
  tong_vao numeric not null default 0,
  tong_ra numeric not null default 0,
  cap_nhat timestamptz not null default now()
);
alter table public.p2d_co_thu enable row level security;
revoke all on public.p2d_co_thu from anon, authenticated;
insert into public.p2d_co_thu (k) values ('goc') on conflict (k) do nothing;

create table if not exists public.p2d_co_thu_nguoi (
  user_id uuid primary key references auth.users(id) on delete cascade,
  luc timestamptz not null default now(),
  tong numeric not null default 0
);
alter table public.p2d_co_thu_nguoi enable row level security;
revoke all on public.p2d_co_thu_nguoi from anon, authenticated;

insert into public.p2d_ky_cfg (k, v) values ('ma', '{"diem":{"hoa":1,"giet":3,"chet":1},"mat":{"ma_lt":0.01,"ma_tu_vi":0.01,"nguoi_lt":0.02},"lt_ngay":10,"nghi_cap":5,"min_tl":4,"tang":9,"can":[40,80,160,320,640,1280,2560,5120,10240,7381,9595,12473,16215,21080,27404,35625,46313,60207,119653,155548,202213,262877,341740,444262,577540,750802,976043,3735014,3847065,3962477,4081351,4203791,4329905,4459802,4593596,4731404,13723792,14135506,14559571,14996358,15446249,15909636,16386925,16878533,17384889,27456534,28280230,29128637,30002496,30902571,31829648,32784538,33768074,34781116,54897070,56543982,58240301,59987510,61787136,63640750,65549972,67516471,69541965,109785703,113079275,116471653,119965802,123564776,127271720,131089871,135022567,139073245,224582011,231319472,238259056,245406827,252769032,260352103,268162666,276207546,284493773],"tui":{"r":64},"co_thu":{"tu_vi":0.005,"share":0.5,"farm_h":[1557,4930,28980,17046,8110,6566,6739,7526,6543]}}'::jsonb) on conflict (k) do update set v = excluded.v;

-- Thay đúng từng đoạn trong định nghĩa đang chạy (bản migration 20261122170000), mỗi đoạn cũ phải có đúng một lần
do $m$
declare
  d text; c0 text; c1 text;
begin
  d := pg_get_functiondef('public.p2d_ma_ghi(bigint,text,text)'::regprocedure);
  if position('''sh''' in d) = 0 then
    c0 := E'  if v_e is distinct from \'giet\' and v_e is distinct from \'diet\' then raise exception';
    c1 := E'  if v_e = \'sh\' then   -- ma v_v sám hối một phút dưới Cổ Thụ Ngàn Năm (máy chủ phòng đếm): −1 điểm ma, nợ \'ma_sh\' (lúc trả: tu vi lên cây)\n'
       || E'    v_v := (v_d ->> \'u\')::uuid;\n'
       || E'    if v_v is null then raise exception \'sai\' using errcode = \'22023\'; end if;\n'
       || E'    insert into public.p2d_ma_hoa (user_id) values (v_v) on conflict (user_id) do nothing;\n'
       || E'    select * into v_mv from public.p2d_ma_hoa where user_id = v_v for update;\n'
       || E'    if v_mv.ma <= 0 then return jsonb_build_object(\'ma\', 0); end if;\n'
       || E'    insert into public.p2d_ma_tran (ts, e, ke) values (p_ts, \'sh\', v_v) on conflict do nothing;\n'
       || E'    if not found then return jsonb_build_object(\'ma\', v_mv.ma); end if;   -- tin gửi trùng\n'
       || E'    update public.p2d_ma_hoa set ma = greatest(ma - 1, 0), cap_nhat = now() where user_id = v_v returning * into v_mv;\n'
       || E'    insert into public.p2d_pvp_no (ts, ke, nan, noi) values (p_ts, v_v, v_v, \'ma_sh\') on conflict do nothing;\n'
       || E'    v_no := found;\n'
       || E'    return jsonb_build_object(\'ma\', v_mv.ma, \'no\', v_no);\n'
       || E'  end if;\n' || c0;
    if (length(d) - length(replace(d, c0, ''))) / length(c0) <> 1 then raise exception 'ma_ghi: khong_thay_doan_cu'; end if;
    execute replace(d, c0, c1);
  end if;

  d := pg_get_functiondef('public.p2d_pvp_tra()'::regprocedure);
  if position('ma_sh' in d) = 0 then
    -- (a) biến giữ phần tu vi trừ được
    c0 := E'v_tui bigint;\n'; c1 := E'v_tui bigint; v_mat_tv numeric;\n';
    if (length(d) - length(replace(d, c0, ''))) / length(c0) <> 1 then raise exception 'pvp_tra a: khong_thay_doan_cu'; end if;
    d := replace(d, c0, c1);
    -- (b) sám hối không mất Linh Thạch
    c0 := E'when \'ma_tp\' then coalesce((v_ma -> \'mat\' ->> \'ma_lt\')::numeric, 0.01) else 0.05 end';
    c1 := E'when \'ma_tp\' then coalesce((v_ma -> \'mat\' ->> \'ma_lt\')::numeric, 0.01) when \'ma_sh\' then 0 else 0.05 end';
    if (length(d) - length(replace(d, c0, ''))) / length(c0) <> 1 then raise exception 'pvp_tra b: khong_thay_doan_cu'; end if;
    d := replace(d, c0, c1);
    -- (c) sám hối trừ tu vi như bị diệt
    c0 := E'if v_noi in (\'ma_diet\', \'ma_tp\') and v_ma is not null then';
    c1 := E'if v_noi in (\'ma_diet\', \'ma_tp\', \'ma_sh\') and v_ma is not null then';
    if (length(d) - length(replace(d, c0, ''))) / length(c0) <> 1 then raise exception 'pvp_tra c: khong_thay_doan_cu'; end if;
    d := replace(d, c0, c1);
    -- (d) mức trừ: co_thu.tu_vi cho sám hối, ghi lại phần trừ được
    c0 := E'      v_mtv := ceil((v_ma -> \'can\' ->> v_tl)::numeric * (v_ma -> \'mat\' ->> \'ma_tu_vi\')::numeric);\n      v_tut := v_q < v_mtv and v_tl > 0;\n';
    c1 := E'      v_mtv := ceil((v_ma -> \'can\' ->> v_tl)::numeric * case when v_noi = \'ma_sh\' then coalesce((v_ma -> \'co_thu\' ->> \'tu_vi\')::numeric, 0.005)\n'
       || E'                                                              else (v_ma -> \'mat\' ->> \'ma_tu_vi\')::numeric end);\n'
       || E'      v_tut := v_q < v_mtv and v_tl > 0;\n'
       || E'      v_mat_tv := case when v_tl > 0 then v_mtv else least(v_q, v_mtv) end;\n';
    if (length(d) - length(replace(d, c0, ''))) / length(c0) <> 1 then raise exception 'pvp_tra d: khong_thay_doan_cu'; end if;
    d := replace(d, c0, c1);
    -- (e) phần tu vi trừ được của người sám hối gửi lên cây
    c0 := E'      v_kq := v_kq || jsonb_build_object(\'tv\', jsonb_build_object(\'mat\', v_mtv, \'realm\', v_r, \'layer\', v_l, \'qi\', v_q, \'tut\', v_tut));\n';
    c1 := c0
       || E'      if v_noi = \'ma_sh\' and not v_huy and v_mat_tv > 0 then\n'
       || E'        update public.p2d_co_thu set linh_khi = linh_khi + v_mat_tv, tong_vao = tong_vao + v_mat_tv, cap_nhat = now() where k = \'goc\';\n'
       || E'      end if;\n';
    if (length(d) - length(replace(d, c0, ''))) / length(c0) <> 1 then raise exception 'pvp_tra e: khong_thay_doan_cu'; end if;
    d := replace(d, c0, c1);
    execute d;
  end if;
end;
$m$;

-- Người thường ngồi đủ một phút trong vòng sáng (máy chủ phòng gom, lõi Mang ký): ds {"u": [mã người, …]} (tối đa 200).
-- Trả {"lk": linh khí cây còn lại, "h": {mã người: linh khí nhận}}.
create or replace function public.p2d_co_thu_hap(p_ts bigint, p_ds text, p_ky text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_khoa text := (select v from public.p2d_bi_mat where k = 'cf_mang'); v_c jsonb := (select v from public.p2d_ky_cfg where k = 'ma');
  v_d jsonb; v_ok uuid[]; v_n integer; v_pool numeric; v_moi numeric; v_tong numeric := 0; v_ra jsonb := '{}'::jsonb;
  v_u uuid; v_r integer; v_cap numeric; v_q numeric; v_fh jsonb;
begin
  if v_khoa is null or v_c is null or p_ts is null or p_ds is null or p_ky is null or length(p_ds) > 9000 then raise exception 'sai' using errcode = '42501'; end if;
  if abs(extract(epoch from now()) * 1000 - p_ts) > 120000 then raise exception 'het_gio' using errcode = '42501'; end if;
  if encode(extensions.hmac(p_ts::text || '.' || p_ds, v_khoa, 'sha256'), 'hex') <> lower(p_ky) then raise exception 'sai_ky' using errcode = '42501'; end if;
  v_d := p_ds::jsonb; v_fh := v_c -> 'co_thu' -> 'farm_h';
  if jsonb_typeof(v_d -> 'u') is distinct from 'array' or jsonb_typeof(v_fh) is distinct from 'array' then raise exception 'sai' using errcode = '22023'; end if;
  select coalesce(array_agg(distinct x::uuid), '{}') into v_ok
    from (select jsonb_array_elements_text(v_d -> 'u') x limit 200) s
   where x ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     and exists (select 1 from public.p2d_nhan_vat n where n.user_id = x::uuid)
     and not exists (select 1 from public.p2d_ma_hoa m where m.user_id = x::uuid and m.ma > 0)
     and not public.p2d_la_co_do(x::uuid)
     and not exists (select 1 from public.p2d_co_thu_nguoi t where t.user_id = x::uuid and t.luc > now() - interval '50 seconds');
  select linh_khi into v_pool from public.p2d_co_thu where k = 'goc' for update;
  v_pool := coalesce(v_pool, 0); v_n := cardinality(v_ok);
  if v_n = 0 or v_pool < 1 then return jsonb_build_object('lk', floor(v_pool), 'h', v_ra); end if;
  v_moi := floor(v_pool / v_n);
  foreach v_u in array v_ok loop
    select least(greatest(coalesce(n.canh_gioi, 0), 0), jsonb_array_length(v_fh) - 1) into v_r from public.p2d_nhan_vat n where n.user_id = v_u;
    v_cap := floor((v_fh ->> v_r)::numeric / 60 * coalesce((v_c -> 'co_thu' ->> 'share')::numeric, 0.5));
    v_q := least(v_cap, v_moi);
    if v_q >= 1 then
      insert into public.p2d_hom_thu (user_id, noi_dung, ly_do) values (v_u, jsonb_build_object('qi', v_q), 'co_thu');
      insert into public.p2d_co_thu_nguoi (user_id, luc, tong) values (v_u, now(), v_q)
        on conflict (user_id) do update set luc = now(), tong = public.p2d_co_thu_nguoi.tong + v_q;
      v_tong := v_tong + v_q; v_ra := v_ra || jsonb_build_object(v_u::text, v_q);
    end if;
  end loop;
  update public.p2d_co_thu set linh_khi = greatest(0, linh_khi - v_tong), tong_ra = tong_ra + v_tong, cap_nhat = now() where k = 'goc'
    returning linh_khi into v_pool;
  return jsonb_build_object('lk', floor(v_pool), 'h', v_ra);
end;
$function$;
revoke all on function public.p2d_co_thu_hap(bigint, text, text) from public;
grant execute on function public.p2d_co_thu_hap(bigint, text, text) to anon, authenticated, service_role;

-- Linh khí cây đang tích (ai cũng xem được, không có gì riêng tư)
create or replace function public.p2d_co_thu_xem()
 returns jsonb
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select jsonb_build_object('lk', floor(coalesce((select linh_khi from public.p2d_co_thu where k = 'goc'), 0)));
$function$;
revoke all on function public.p2d_co_thu_xem() from public;
grant execute on function public.p2d_co_thu_xem() to anon, authenticated;
