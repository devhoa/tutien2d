#!/usr/bin/env python3
# Sinh migration câu cá (chủ dự án 24/11/2026): p2d_nl_mua bán mồi, cần câu, thôi bán cá (bảng giá = data/market.json → quick.price);
# p2d_cau_doi(p_ban, p_mo): Lão Ngư Ông thu mua đồ câu được và châu ra Linh Thạch (giá data/fishing.json → ban.gia × ban.k mũ cảnh giới,
# mỗi ngày giờ Việt Nam tối đa ban.tran[cảnh giới], rẻ bán trước) và khai trai (fishing.khai: châu, ngọc khảm do máy chủ quay), ghi thẳng
# vào bản lưu máy chủ như p2d_nl_mua. Bảng p2d_cau_ban giữ số Linh Thạch đã thu mỗi ngày. Chạy: python3 tools/cau-ca-sql.py
import json
from pathlib import Path

R = Path(__file__).resolve().parents[1]
OUT = R / 'supabase/migrations/20261124030000_p2d_cau_ca.sql'
F = json.loads((R / 'data/fishing.json').read_text())
Q = json.loads((R / 'data/market.json').read_text())['quick']
G = json.loads((R / 'data/items.json').read_text())['gems']

gia_mua = Q['price']
cfg = {'k': F['ban']['k'], 'gia': F['ban']['gia'], 'tran': F['ban']['tran'],
       'khai': {k: v for k, v in F['khai'].items() if not k.startswith('_')}, 'ngoc': list(G['types'].keys())}
j = lambda o: json.dumps(o, ensure_ascii=False, separators=(', ', ': ')).replace("'", "''")

sql = f"""-- Câu cá (chủ dự án 24/11/2026 00:38 – 01:2x; sinh bằng tools/cau-ca-sql.py, đừng sửa tay).
-- 1. p2d_nl_mua: bán mồi, cần câu ở Lão Ngư Ông; thôi bán cá ở Mua nhanh (chủ dự án chọn "Thôi bán cá"). Bảng giá = data/market.json → quick.price,
--    phần còn lại giữ nguyên như 20261120161000_p2d_gia_lks.sql.
-- 2. p2d_cau_doi(p_ban, p_mo): Lão Ngư Ông thu mua đồ câu được, châu ra Linh Thạch ("câu cá không lên linh khí nên bán linh thạch phải nhanh
--    gấp đôi hoặc gấp 3"): giá data/fishing.json → ban.gia × ban.k mũ cảnh giới, rẻ bán trước, mỗi ngày (giờ Việt Nam) tối đa ban.tran[cảnh giới];
--    khai trai (fishing.khai): châu và ngọc khảm do máy chủ quay. Ghi thẳng vào bản lưu máy chủ (như p2d_nl_mua), trả phần trừ / thêm để máy khách sửa theo.
--    Một con đắt hơn cả trần ngày (cá Thượng Cổ) thì Lão Ngư Ông dốc hết túi hôm đó: giá một con không quá trần ngày.
--    Cảnh giới lấy cột canh_gioi (p2d_luu ghi). Mỗi tài khoản gọi tối đa 1 lần / giây (luật 13/11/2026; bảng p2d_nhip_lenh có sẵn).
-- 3. Bảng p2d_cau_ban: số Linh Thạch đã thu mỗi người mỗi ngày (chỉ hàm trên ghi).

create or replace function public.p2d_nl_mua(p_mua jsonb, p_nhanh boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := public.p2d_uid(); v_cfg jsonb := '{j({'nhan': Q['mul'], 'gia': gia_mua})}'::jsonb;
  v_nv public.p2d_nhan_vat%rowtype; v_k text; v_n jsonb; v_gia numeric := 0; v_lt numeric; v_pb integer; v_them jsonb := '{{}}'::jsonb;
begin
  if v_cfg is null then raise exception 'chua_cau_hinh' using errcode = '22023'; end if;
  if p_mua is null or jsonb_typeof(p_mua) <> 'object' or (select count(*) from jsonb_object_keys(p_mua)) not between 1 and 10 then
    raise exception 'du_lieu_sai' using errcode = '22023';
  end if;
  for v_k, v_n in select key, value from jsonb_each(p_mua) loop
    if jsonb_typeof(v_n) <> 'number' or (v_n #>> '{{}}')::numeric <> floor((v_n #>> '{{}}')::numeric) or (v_n #>> '{{}}')::numeric not between 1 and 999 then
      raise exception 'du_lieu_sai' using errcode = '22023';
    end if;
    if not (v_cfg -> 'gia') ? v_k then raise exception 'khong_ban' using errcode = '22023'; end if;
    v_gia := v_gia + ceil((v_cfg -> 'gia' ->> v_k)::numeric * (v_n #>> '{{}}')::numeric * case when p_nhanh then (v_cfg ->> 'nhan')::numeric else 1 end);
    v_them := v_them || jsonb_build_object(v_k, (v_n #>> '{{}}')::integer);
  end loop;
  select * into v_nv from public.p2d_nhan_vat where user_id = v_me for update;
  if not found then raise exception 'chua_luu' using errcode = '22023'; end if;
  v_lt := coalesce(public.p2d_ky_so(v_nv.data -> 'lingshi'), 0);
  if v_lt < v_gia then raise exception 'thieu' using errcode = '22023'; end if;
  v_nv.data := jsonb_set(v_nv.data, '{{lingshi}}', to_jsonb(v_lt - v_gia));
  if jsonb_typeof(v_nv.data -> 'mats') is distinct from 'object' then v_nv.data := jsonb_set(v_nv.data, '{{mats}}', '{{}}'::jsonb); end if;
  for v_k, v_n in select key, value from jsonb_each(v_them) loop
    v_nv.data := jsonb_set(v_nv.data, array['mats', v_k], to_jsonb(coalesce(public.p2d_ky_so(v_nv.data -> 'mats' -> v_k), 0) + (v_n #>> '{{}}')::numeric));
  end loop;
  update public.p2d_nhan_vat set data = v_nv.data, phien_ban = phien_ban + 1, updated_at = now() where user_id = v_me returning phien_ban into v_pb;
  return jsonb_build_object('phien_ban', v_pb, 'tru', jsonb_build_object('coins', v_gia), 'them', v_them);
end;
$$;
revoke all on function public.p2d_nl_mua(jsonb, boolean) from public, anon;
grant execute on function public.p2d_nl_mua(jsonb, boolean) to authenticated;

create table if not exists public.p2d_cau_ban (
  user_id uuid not null,
  ngay date not null,
  lt numeric not null default 0,
  primary key (user_id, ngay)
);
alter table public.p2d_cau_ban enable row level security;
revoke all on table public.p2d_cau_ban from public, anon, authenticated;

create or replace function public.p2d_cau_doi(p_ban jsonb default '{{}}'::jsonb, p_mo jsonb default '{{}}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := public.p2d_uid(); v_cfg jsonb := '{j(cfg)}'::jsonb;
  v_nv public.p2d_nhan_vat%rowtype; v_realm integer; v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_da numeric; v_con numeric; v_k text; v_n jsonb; v_co numeric; v_g numeric; v_lay integer; v_lt numeric := 0; v_tong integer := 0;
  v_tru jsonb := '{{}}'::jsonb; v_tm jsonb := '{{}}'::jsonb; v_tg jsonb := '{{}}'::jsonb; v_x jsonb; v_kh jsonb; v_gk text; v_lv integer; i integer; v_pb integer; v_cu timestamptz; v_tran numeric;
begin
  if v_me is null then raise exception 'chua_dang_nhap' using errcode = '22023'; end if;
  p_ban := coalesce(p_ban, '{{}}'::jsonb); p_mo := coalesce(p_mo, '{{}}'::jsonb);
  if jsonb_typeof(p_ban) <> 'object' or jsonb_typeof(p_mo) <> 'object' or (select count(*) from jsonb_object_keys(p_ban)) > 80
     or (select count(*) from jsonb_object_keys(p_mo)) > 10 or (p_ban = '{{}}'::jsonb and p_mo = '{{}}'::jsonb) then
    raise exception 'du_lieu_sai' using errcode = '22023';
  end if;
  for v_k, v_n in select key, value from jsonb_each(p_ban) union all select key, value from jsonb_each(p_mo) loop
    if jsonb_typeof(v_n) <> 'number' or (v_n #>> '{{}}')::numeric <> floor((v_n #>> '{{}}')::numeric) or (v_n #>> '{{}}')::numeric not between 1 and 99999 then
      raise exception 'du_lieu_sai' using errcode = '22023';
    end if;
  end loop;
  select luc into v_cu from public.p2d_nhip_lenh where user_id = v_me and lenh = 'p2d_cau_doi';
  if v_cu is not null and clock_timestamp() - v_cu < interval '1 second' then
    raise exception 'qua_nhanh' using errcode = 'P0001', hint = 'Mỗi thao tác cách nhau ít nhất 1 giây';
  end if;
  insert into public.p2d_nhip_lenh (user_id, lenh, luc) values (v_me, 'p2d_cau_doi', clock_timestamp())
    on conflict (user_id, lenh) do update set luc = excluded.luc;
  select * into v_nv from public.p2d_nhan_vat where user_id = v_me for update;
  if not found then raise exception 'chua_luu' using errcode = '22023'; end if;
  if jsonb_typeof(v_nv.data -> 'mats') is distinct from 'object' then v_nv.data := jsonb_set(v_nv.data, '{{mats}}', '{{}}'::jsonb); end if;
  if jsonb_typeof(v_nv.data -> 'gems') is distinct from 'object' then v_nv.data := jsonb_set(v_nv.data, '{{gems}}', '{{}}'::jsonb); end if;
  v_realm := least(greatest(coalesce(v_nv.canh_gioi, 0), 0), jsonb_array_length(v_cfg -> 'tran') - 1);
  v_tran := (v_cfg -> 'tran' ->> v_realm)::numeric;
  insert into public.p2d_cau_ban (user_id, ngay, lt) values (v_me, v_ngay, 0) on conflict (user_id, ngay) do nothing;
  select lt into v_da from public.p2d_cau_ban where user_id = v_me and ngay = v_ngay for update;
  v_con := greatest(0, v_tran - v_da);
  -- thu mua: rẻ trước, chạm trần thì thôi (con quý ở lại trong giỏ)
  for v_k, v_n in select e.key, e.value from jsonb_each(p_ban) e order by (v_cfg -> 'gia' ->> e.key)::numeric nulls last, e.key loop
    if not (v_cfg -> 'gia') ? v_k then raise exception 'khong_thu' using errcode = '22023'; end if;
    v_co := coalesce(public.p2d_ky_so(v_nv.data -> 'mats' -> v_k), 0);
    v_g := least(round((v_cfg -> 'gia' ->> v_k)::numeric * power((v_cfg ->> 'k')::numeric, v_realm)), v_tran);   -- một con không quá trần ngày
    v_lay := least((v_n #>> '{{}}')::integer, floor(v_co)::integer, floor(v_con / greatest(v_g, 1))::integer);
    if v_lay < 1 then continue; end if;
    v_nv.data := jsonb_set(v_nv.data, array['mats', v_k], to_jsonb(v_co - v_lay));
    v_tru := v_tru || jsonb_build_object(v_k, v_lay);
    v_lt := v_lt + v_g * v_lay; v_con := v_con - v_g * v_lay;
  end loop;
  -- khai trai: tối đa 50 con một lần
  for v_k, v_n in select key, value from jsonb_each(p_mo) loop
    v_kh := v_cfg -> 'khai' -> v_k;
    if v_kh is null then raise exception 'khong_khai' using errcode = '22023'; end if;
    v_co := coalesce(public.p2d_ky_so(v_nv.data -> 'mats' -> v_k), 0);
    v_lay := least((v_n #>> '{{}}')::integer, floor(v_co)::integer, 50 - v_tong);
    if v_lay < 1 then continue; end if;
    v_tong := v_tong + v_lay;
    v_nv.data := jsonb_set(v_nv.data, array['mats', v_k], to_jsonb(v_co - v_lay));
    v_tru := v_tru || jsonb_build_object(v_k, coalesce((v_tru ->> v_k)::integer, 0) + v_lay);
    for i in 1 .. v_lay loop
      for v_x in select jsonb_array_elements(v_kh -> 'chau') loop
        if random() < (v_x ->> 1)::numeric then v_tm := v_tm || jsonb_build_object(v_x ->> 0, coalesce((v_tm ->> (v_x ->> 0))::integer, 0) + (v_x ->> 2)::integer); end if;
      end loop;
      if random() < (v_kh -> 'ngoc' ->> 0)::numeric then
        v_lv := (v_kh -> 'ngoc' ->> 1)::integer + floor(random() * ((v_kh -> 'ngoc' ->> 2)::integer - (v_kh -> 'ngoc' ->> 1)::integer + 1))::integer;
        v_gk := (v_cfg -> 'ngoc' ->> floor(random() * jsonb_array_length(v_cfg -> 'ngoc'))::integer) || ':' || v_lv;
        v_tg := v_tg || jsonb_build_object(v_gk, coalesce((v_tg ->> v_gk)::integer, 0) + 1);
      end if;
    end loop;
  end loop;
  for v_k, v_n in select key, value from jsonb_each(v_tm) loop
    v_nv.data := jsonb_set(v_nv.data, array['mats', v_k], to_jsonb(coalesce(public.p2d_ky_so(v_nv.data -> 'mats' -> v_k), 0) + (v_n #>> '{{}}')::numeric));
  end loop;
  for v_k, v_n in select key, value from jsonb_each(v_tg) loop
    v_nv.data := jsonb_set(v_nv.data, array['gems', v_k], to_jsonb(coalesce(public.p2d_ky_so(v_nv.data -> 'gems' -> v_k), 0) + (v_n #>> '{{}}')::numeric));
  end loop;
  if v_lt > 0 then
    v_nv.data := jsonb_set(v_nv.data, '{{lingshi}}', to_jsonb(coalesce(public.p2d_ky_so(v_nv.data -> 'lingshi'), 0) + v_lt));
    update public.p2d_cau_ban set lt = lt + v_lt where user_id = v_me and ngay = v_ngay;
  end if;
  if v_tru = '{{}}'::jsonb then
    return jsonb_build_object('phien_ban', v_nv.phien_ban, 'tru', jsonb_build_object('mats', v_tru), 'them', jsonb_build_object('coins', 0, 'mats', v_tm, 'gems', v_tg), 'con', v_con);
  end if;
  update public.p2d_nhan_vat set data = v_nv.data, phien_ban = phien_ban + 1, updated_at = now() where user_id = v_me returning phien_ban into v_pb;
  return jsonb_build_object('phien_ban', v_pb, 'tru', jsonb_build_object('mats', v_tru), 'them', jsonb_build_object('coins', v_lt, 'mats', v_tm, 'gems', v_tg), 'con', v_con);
end;
$$;
revoke all on function public.p2d_cau_doi(jsonb, jsonb) from public, anon;
grant execute on function public.p2d_cau_doi(jsonb, jsonb) to authenticated;
"""
OUT.write_text(sql)
print(OUT.relative_to(R), len(sql), 'ký tự;', len(gia_mua), 'món Mua nhanh;', len(cfg['gia']), 'món thu mua')
