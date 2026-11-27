# Sinh migration đan phương + chọn đan (python3 tools/lo-dan-phuong-sql.py > supabase/migrations/20261123040000_p2d_dan_phuong.sql)
# từ data/cave.json → lo (kể cả lo.phuong) và pills.*.recipe / make / pham. Chủ dự án 23/11/2026 (góp ý #187 chọn đúng loại đan, #175 luyện
# nhanh, #179 mua đan phương tăng tỉ lệ): "Đan đã biết", "+15%, 20k × (phẩm + 1)", "Có phương thì trừ 1% / bộ".
# Thay p2d_lo_cfg (thêm phuong), p2d_lo_vao_ban_luu (giữ các khoá khác của data.lo), p2d_lo_cua_toi (thêm biet, phuong); thêm cột lo_biet,
# lo_phuong, hàm p2d_lo_biet_cua, p2d_mua_dan_phuong, p2d_luyen_dan2(p_o, p_dan); p2d_luyen_dan(p_o) cũ gọi p2d_luyen_dan2(p_o, null) nên
# máy khách bản cũ vẫn luyện được, cùng luật tỉ lệ mới. Luật ghép đan phương, tỉ lệ chung như tools/lo-dan-sql.py.
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
C = json.loads((ROOT / 'data/cave.json').read_text(encoding='utf-8'))
L = C['lo']
cfg = {k: L[k] for k in ('base', 'per_set', 'phat_dan', 'floor', 'max', 'pham', 'gia_mua', 'max_lo', 'nang')}
cfg['so_kieu'] = len(L['kieu'])
cfg['dan'] = {k: {'r': p['recipe'], 'm': p.get('make', 1), 'p': p.get('pham', 0)} for k, p in C['pills'].items() if p.get('recipe')}
cfg['phuong'] = {k: L['phuong'][k] for k in ('gia', 'them', 'per_set')}
CFG = json.dumps(cfg, ensure_ascii=False, separators=(',', ':'))

# python3 tools/lo-dan-phuong-sql.py cfg: chỉ in hàm p2d_lo_cfg (đổi tỉ lệ, thêm đan: migration mới chỉ cần thay hàm này)
import sys
if len(sys.argv) > 1 and sys.argv[1] == 'cfg':
    print("create or replace function public.p2d_lo_cfg() returns jsonb language sql immutable set search_path = '' as $$\n  select '" + CFG.replace("'", "''") + "'::jsonb;\n$$;\nrevoke all on function public.p2d_lo_cfg() from public, anon, authenticated;")
    sys.exit()

print(f"""-- Đan phương và chọn đan (chủ dự án 23/11/2026). SINH BẰNG tools/lo-dan-phuong-sql.py từ data/cave.json, không sửa tay.
-- Cột lo_biet: đan từng luyện thành (máy chủ ghi khi thành); lo_phuong: đan phương đã mua. Đan đã biết = lo_biet ∪ lo_phuong ∪ các đan có
-- khoá trong data.pills (đang / từng có trong túi), chỉ tính đan có đan phương trong cấu hình. Bản lưu có data.lo.biet, data.lo.phuong chỉ để
-- máy khách hiện; mọi hàm đọc cột.
--   p2d_mua_dan_phuong(đan): trừ phuong.gia × (phẩm đan + 1) Linh Thạch, thêm vào lo_phuong (mua một lần, dùng mãi).
--   p2d_luyen_dan2({{mã: số}}, đan | null): như p2d_luyen_dan; có đan thì đan đó phải đã biết và chỉ ghép đúng đan phương đó (nguyên liệu
--     thừa vẫn mất). Tỉ lệ từng đan = base + pham[phẩm lò] − per_set × (tổng bộ − 1) − phat_dan × phẩm đan, kẹp [floor, max]; đan có
--     đan phương thì cộng phuong.them và dùng phuong.per_set thay per_set.

alter table public.p2d_nhan_vat add column if not exists lo_biet jsonb not null default '[]'::jsonb;
alter table public.p2d_nhan_vat add column if not exists lo_phuong jsonb not null default '[]'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'p2d_nhan_vat_lo_biet_chk') then
    alter table public.p2d_nhan_vat add constraint p2d_nhan_vat_lo_biet_chk check (jsonb_typeof(lo_biet) = 'array' and jsonb_array_length(lo_biet) <= 64);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'p2d_nhan_vat_lo_phuong_chk') then
    alter table public.p2d_nhan_vat add constraint p2d_nhan_vat_lo_phuong_chk check (jsonb_typeof(lo_phuong) = 'array' and jsonb_array_length(lo_phuong) <= 64);
  end if;
end $$;

create or replace function public.p2d_lo_cfg() returns jsonb language sql immutable set search_path = '' as $$
  select '{CFG}'::jsonb;
$$;
revoke all on function public.p2d_lo_cfg() from public, anon, authenticated;

-- ghi lò vào bản lưu cho máy khách hiện (cột là gốc); giữ các khoá khác của data.lo (biet, phuong)
create or replace function public.p2d_lo_vao_ban_luu(p_data jsonb, p_ds jsonb, p_dung text) returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_set(coalesce(p_data, '{{}}'::jsonb), '{{lo}}',
    case when jsonb_typeof(p_data -> 'lo') = 'object' then p_data -> 'lo' else '{{}}'::jsonb end || jsonb_build_object('ds', p_ds, 'dung', p_dung));
$$;
revoke all on function public.p2d_lo_vao_ban_luu(jsonb, jsonb, text) from public, anon, authenticated;

create or replace function public.p2d_lo_biet_cua(p_biet jsonb, p_phuong jsonb, p_data jsonb) returns jsonb language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(distinct x.k order by x.k), '[]'::jsonb) from (
    select jsonb_array_elements_text(case when jsonb_typeof(p_biet) = 'array' then p_biet else '[]'::jsonb end) as k
    union select jsonb_array_elements_text(case when jsonb_typeof(p_phuong) = 'array' then p_phuong else '[]'::jsonb end)
    union select key from jsonb_each(case when jsonb_typeof(p_data -> 'pills') = 'object' then p_data -> 'pills' else '{{}}'::jsonb end)
  ) x where public.p2d_lo_cfg() -> 'dan' ? x.k;
$$;
revoke all on function public.p2d_lo_biet_cua(jsonb, jsonb, jsonb) from public, anon, authenticated;

-- ghi đan đã biết, đan phương vào bản lưu cho máy khách hiện
create or replace function public.p2d_lo_phuong_vao_ban_luu(p_data jsonb, p_biet jsonb, p_phuong jsonb) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_set(coalesce(p_data, '{{}}'::jsonb), '{{lo}}',
    case when jsonb_typeof(p_data -> 'lo') = 'object' then p_data -> 'lo' else '{{}}'::jsonb end
    || jsonb_build_object('biet', public.p2d_lo_biet_cua(p_biet, p_phuong, p_data), 'phuong', p_phuong));
$$;
revoke all on function public.p2d_lo_phuong_vao_ban_luu(jsonb, jsonb, jsonb) from public, anon, authenticated;

create or replace function public.p2d_lo_cua_toi()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('ds', n.lo_ds, 'dung', n.lo_dung, 'biet', public.p2d_lo_biet_cua(n.lo_biet, n.lo_phuong, n.data), 'phuong', n.lo_phuong)
    from public.p2d_nhan_vat n where n.user_id = public.p2d_uid();
$$;
revoke all on function public.p2d_lo_cua_toi() from public, anon;
grant execute on function public.p2d_lo_cua_toi() to authenticated;

create or replace function public.p2d_mua_dan_phuong(p_dan text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := public.p2d_uid(); v_cfg jsonb := public.p2d_lo_cfg();
  v_nv public.p2d_nhan_vat%rowtype; v_lt numeric; v_gia numeric; v_pb integer;
begin
  if v_me is null then raise exception 'chua_dang_nhap' using errcode = '28000'; end if;
  if p_dan is null or not (v_cfg -> 'dan' ? p_dan) then raise exception 'du_lieu_sai' using errcode = '22023'; end if;
  select * into v_nv from public.p2d_nhan_vat where user_id = v_me for update;
  if not found then raise exception 'chua_luu' using errcode = '22023'; end if;
  if v_nv.lo_phuong ? p_dan then raise exception 'da_co' using errcode = '22023'; end if;
  v_gia := (v_cfg -> 'phuong' ->> 'gia')::numeric * (coalesce((v_cfg -> 'dan' -> p_dan ->> 'p')::integer, 0) + 1);
  v_lt := coalesce(public.p2d_ky_so(v_nv.data -> 'lingshi'), 0);
  if v_lt < v_gia then raise exception 'thieu' using errcode = '22023'; end if;
  v_nv.lo_phuong := v_nv.lo_phuong || jsonb_build_array(p_dan);
  v_nv.data := public.p2d_lo_phuong_vao_ban_luu(jsonb_set(v_nv.data, '{{lingshi}}', to_jsonb(v_lt - v_gia)), v_nv.lo_biet, v_nv.lo_phuong);
  perform set_config('p2d.ly_do', 'mua_dan_phuong', true);
  update public.p2d_nhan_vat set data = v_nv.data, lo_phuong = v_nv.lo_phuong, phien_ban = phien_ban + 1, updated_at = now()
   where user_id = v_me returning phien_ban into v_pb;
  return jsonb_build_object('dan', p_dan, 'lt', v_gia, 'phuong', v_nv.lo_phuong, 'biet', v_nv.data -> 'lo' -> 'biet', 'phien_ban', v_pb);
end;
$$;
revoke all on function public.p2d_mua_dan_phuong(text) from public, anon;
grant execute on function public.p2d_mua_dan_phuong(text) to authenticated;

create or replace function public.p2d_luyen_dan2(p_o jsonb, p_dan text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := public.p2d_uid(); v_cfg jsonb := public.p2d_lo_cfg(); v_dc jsonb;
  v_nv public.p2d_nhan_vat%rowtype; v_k text; v_n jsonb; v_p record; v_r record; v_con jsonb := p_o; v_ph integer;
  v_b integer; v_tong integer := 0; v_ds jsonb := '[]'::jsonb; v_d jsonb; v_goc numeric := 0; v_tl numeric; v_co boolean; v_ok boolean; v_vien integer;
  v_thanh boolean := false; v_tvien integer := 0; v_out jsonb := '[]'::jsonb; v_pb integer;
  v_i integer; v_f jsonb; v_need jsonb; v_sets jsonb := '{{}}'::jsonb;
begin
  if v_me is null then raise exception 'chua_dang_nhap' using errcode = '28000'; end if;
  if p_o is null or jsonb_typeof(p_o) <> 'object' or (select count(*) from jsonb_object_keys(p_o)) not between 1 and 9 then
    raise exception 'du_lieu_sai' using errcode = '22023';
  end if;
  for v_k, v_n in select key, value from jsonb_each(p_o) loop
    if v_k !~ '^[a-z0-9-]{{1,40}}$' or jsonb_typeof(v_n) <> 'number' or (v_n #>> '{{}}')::numeric <> floor((v_n #>> '{{}}')::numeric)
       or (v_n #>> '{{}}')::numeric not between 1 and 99999 then
      raise exception 'du_lieu_sai' using errcode = '22023';
    end if;
  end loop;
  if p_dan is not null and not (v_cfg -> 'dan' ? p_dan) then raise exception 'du_lieu_sai' using errcode = '22023'; end if;
  select * into v_nv from public.p2d_nhan_vat where user_id = v_me for update;
  if not found then raise exception 'chua_luu' using errcode = '22023'; end if;
  select (x ->> 'ph')::integer into v_ph from jsonb_array_elements(v_nv.lo_ds) x where x ->> 'id' = v_nv.lo_dung;
  if v_ph is null then raise exception 'chua_co_lo' using errcode = '22023'; end if;
  for v_k, v_n in select key, value from jsonb_each(p_o) loop
    if coalesce(public.p2d_ky_so(v_nv.data -> 'mats' -> v_k), 0) < (v_n #>> '{{}}')::numeric then raise exception 'thieu_nl' using errcode = '22023'; end if;
  end loop;
  if p_dan is not null then   -- chọn đan: phải đã biết; chỉ ghép đúng đan phương đó
    if not (public.p2d_lo_biet_cua(v_nv.lo_biet, v_nv.lo_phuong, v_nv.data) ? p_dan) then raise exception 'chua_biet' using errcode = '22023'; end if;
    v_dc := jsonb_build_object(p_dan, v_cfg -> 'dan' -> p_dan);
  else
    v_dc := v_cfg -> 'dan';
  end if;
  -- ghép đan phương: chia đều theo vòng, gộp k vòng trọn một lần; không đủ một vòng trọn thì một vòng lẻ theo thứ tự ngẫu nhiên
  for v_i in 1..500 loop
    v_f := '[]'::jsonb; v_need := '{{}}'::jsonb;
    for v_p in select key, value from jsonb_each(v_dc) loop
      if not exists (select 1 from jsonb_each(v_p.value -> 'r') r where coalesce((v_con ->> r.key)::numeric, 0) < (r.value #>> '{{}}')::numeric) then
        v_f := v_f || jsonb_build_array(v_p.key);
        for v_r in select key, value from jsonb_each(v_p.value -> 'r') loop
          v_need := jsonb_set(v_need, array[v_r.key], to_jsonb(coalesce((v_need ->> v_r.key)::numeric, 0) + (v_r.value #>> '{{}}')::numeric));
        end loop;
      end if;
    end loop;
    exit when jsonb_array_length(v_f) = 0;
    select min(floor((v_con ->> key)::numeric / (value #>> '{{}}')::numeric))::integer into v_b from jsonb_each(v_need);
    if v_b >= 1 then
      for v_r in select key, value from jsonb_each(v_need) loop
        v_con := jsonb_set(v_con, array[v_r.key], to_jsonb((v_con ->> v_r.key)::numeric - v_b * (v_r.value #>> '{{}}')::numeric));
      end loop;
      for v_k in select jsonb_array_elements_text(v_f) loop
        v_sets := jsonb_set(v_sets, array[v_k], to_jsonb(coalesce((v_sets ->> v_k)::integer, 0) + v_b));
      end loop;
    else
      for v_k in select x from jsonb_array_elements_text(v_f) x order by random() loop
        if not exists (select 1 from jsonb_each(v_dc -> v_k -> 'r') r where coalesce((v_con ->> r.key)::numeric, 0) < (r.value #>> '{{}}')::numeric) then
          for v_r in select key, value from jsonb_each(v_dc -> v_k -> 'r') loop
            v_con := jsonb_set(v_con, array[v_r.key], to_jsonb((v_con ->> v_r.key)::numeric - (v_r.value #>> '{{}}')::numeric));
          end loop;
          v_sets := jsonb_set(v_sets, array[v_k], to_jsonb(coalesce((v_sets ->> v_k)::integer, 0) + 1));
        end if;
      end loop;
    end if;
  end loop;
  for v_k, v_n in select key, value from jsonb_each(v_sets) loop
    v_ds := v_ds || jsonb_build_array(jsonb_build_object('dan', v_k, 'bo', (v_n #>> '{{}}')::integer, 'm', (v_cfg -> 'dan' -> v_k ->> 'm')::integer));
    v_tong := v_tong + (v_n #>> '{{}}')::integer;
  end loop;
  v_goc := (v_cfg ->> 'base')::numeric + coalesce((v_cfg -> 'pham' ->> v_ph)::numeric, 0);
  for v_k, v_n in select key, value from jsonb_each(p_o) loop   -- mọi nguyên liệu bỏ vào đều mất
    v_nv.data := jsonb_set(v_nv.data, array['mats', v_k], to_jsonb(public.p2d_ky_so(v_nv.data -> 'mats' -> v_k) - (v_n #>> '{{}}')::numeric));
  end loop;
  for v_d in select value from jsonb_array_elements(v_ds) loop   -- mỗi loại đan tung riêng
    v_co := v_nv.lo_phuong ? (v_d ->> 'dan');
    v_tl := greatest((v_cfg ->> 'floor')::numeric, least((v_cfg ->> 'max')::numeric,
      v_goc - (case when v_co then (v_cfg -> 'phuong' ->> 'per_set')::numeric else (v_cfg ->> 'per_set')::numeric end) * (v_tong - 1)
      - (v_cfg ->> 'phat_dan')::numeric * coalesce((v_cfg -> 'dan' -> (v_d ->> 'dan') ->> 'p')::numeric, 0)
      + (case when v_co then (v_cfg -> 'phuong' ->> 'them')::numeric else 0 end)));
    v_ok := random() < v_tl;
    v_vien := case when v_ok then (v_d ->> 'm')::integer * (v_d ->> 'bo')::integer else 0 end;
    if v_ok then
      if jsonb_typeof(v_nv.data -> 'pills') is distinct from 'object' then v_nv.data := jsonb_set(v_nv.data, '{{pills}}', '{{}}'::jsonb); end if;
      v_nv.data := jsonb_set(v_nv.data, array['pills', v_d ->> 'dan'], to_jsonb(coalesce(public.p2d_ky_so(v_nv.data -> 'pills' -> (v_d ->> 'dan')), 0) + v_vien));
      if not (v_nv.lo_biet ? (v_d ->> 'dan')) and jsonb_array_length(v_nv.lo_biet) < 64 then v_nv.lo_biet := v_nv.lo_biet || jsonb_build_array(v_d ->> 'dan'); end if;
      v_thanh := true; v_tvien := v_tvien + v_vien;
    end if;
    v_out := v_out || jsonb_build_array(jsonb_build_object('dan', v_d ->> 'dan', 'bo', (v_d ->> 'bo')::integer, 'vien', v_vien, 'thanh', v_ok, 'tl', round(v_tl, 4)));
  end loop;
  v_nv.data := public.p2d_lo_phuong_vao_ban_luu(v_nv.data, v_nv.lo_biet, v_nv.lo_phuong);
  perform set_config('p2d.ly_do', 'luyen_dan', true);
  update public.p2d_nhan_vat set data = v_nv.data, lo_biet = v_nv.lo_biet, phien_ban = phien_ban + 1, updated_at = now() where user_id = v_me returning phien_ban into v_pb;
  return jsonb_build_object('ds', v_out, 'thanh', v_thanh, 'vien', v_tvien, 'bo', v_tong, 'tru', p_o, 'biet', v_nv.data -> 'lo' -> 'biet', 'phuong', v_nv.lo_phuong, 'phien_ban', v_pb);
end;
$$;
revoke all on function public.p2d_luyen_dan2(jsonb, text) from public, anon;
grant execute on function public.p2d_luyen_dan2(jsonb, text) to authenticated;

-- bản cũ (máy khách chưa cập nhật): cùng luật mới, không chọn đan
create or replace function public.p2d_luyen_dan(p_o jsonb)
returns jsonb language sql security definer set search_path = '' as $$
  select public.p2d_luyen_dan2(p_o, null);
$$;
revoke all on function public.p2d_luyen_dan(jsonb) from public, anon;
grant execute on function public.p2d_luyen_dan(jsonb) to authenticated;""")
