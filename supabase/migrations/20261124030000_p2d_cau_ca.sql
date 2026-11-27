-- Câu cá (chủ dự án 24/11/2026 00:38 – 01:2x; sinh bằng tools/cau-ca-sql.py, đừng sửa tay).
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
  v_me uuid := public.p2d_uid(); v_cfg jsonb := '{"nhan": 1.1, "gia": {"linh-thao": 200, "yeu-huyet": 500, "tinh-thiet": 700, "hoa-linh-chi": 1800, "tay-luyen-thach": 800, "khoa-linh-thach": 400, "bi-kip-chieu": 1200, "manh-phap-bao": 3000, "linh-mach": 20, "linh-dau": 20, "hong-qua": 30, "kim-tieu": 45, "ngoc-lo-hoa": 2400, "tu-van-sam": 4800, "thai-hu-lien": 8000, "giun-dat": 5, "linh-me": 20, "hoa-trung": 40, "bang-ha": 40, "kim-sa": 40, "da-quang": 60, "huyet-nhuc": 120, "tinh-sa": 300, "long-tien": 1500, "thanh-dang-can": 10000, "han-thiet-can": 50000, "ngoc-linh-can": 200000, "long-cot-can": 800000, "thien-tam-can": 3000000, "dinh-hai-can": 10000000}}'::jsonb;
  v_nv public.p2d_nhan_vat%rowtype; v_k text; v_n jsonb; v_gia numeric := 0; v_lt numeric; v_pb integer; v_them jsonb := '{}'::jsonb;
begin
  if v_cfg is null then raise exception 'chua_cau_hinh' using errcode = '22023'; end if;
  if p_mua is null or jsonb_typeof(p_mua) <> 'object' or (select count(*) from jsonb_object_keys(p_mua)) not between 1 and 10 then
    raise exception 'du_lieu_sai' using errcode = '22023';
  end if;
  for v_k, v_n in select key, value from jsonb_each(p_mua) loop
    if jsonb_typeof(v_n) <> 'number' or (v_n #>> '{}')::numeric <> floor((v_n #>> '{}')::numeric) or (v_n #>> '{}')::numeric not between 1 and 999 then
      raise exception 'du_lieu_sai' using errcode = '22023';
    end if;
    if not (v_cfg -> 'gia') ? v_k then raise exception 'khong_ban' using errcode = '22023'; end if;
    v_gia := v_gia + ceil((v_cfg -> 'gia' ->> v_k)::numeric * (v_n #>> '{}')::numeric * case when p_nhanh then (v_cfg ->> 'nhan')::numeric else 1 end);
    v_them := v_them || jsonb_build_object(v_k, (v_n #>> '{}')::integer);
  end loop;
  select * into v_nv from public.p2d_nhan_vat where user_id = v_me for update;
  if not found then raise exception 'chua_luu' using errcode = '22023'; end if;
  v_lt := coalesce(public.p2d_ky_so(v_nv.data -> 'lingshi'), 0);
  if v_lt < v_gia then raise exception 'thieu' using errcode = '22023'; end if;
  v_nv.data := jsonb_set(v_nv.data, '{lingshi}', to_jsonb(v_lt - v_gia));
  if jsonb_typeof(v_nv.data -> 'mats') is distinct from 'object' then v_nv.data := jsonb_set(v_nv.data, '{mats}', '{}'::jsonb); end if;
  for v_k, v_n in select key, value from jsonb_each(v_them) loop
    v_nv.data := jsonb_set(v_nv.data, array['mats', v_k], to_jsonb(coalesce(public.p2d_ky_so(v_nv.data -> 'mats' -> v_k), 0) + (v_n #>> '{}')::numeric));
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

create or replace function public.p2d_cau_doi(p_ban jsonb default '{}'::jsonb, p_mo jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := public.p2d_uid(); v_cfg jsonb := '{"k": 1.6, "gia": {"linh-ngu": 45, "van-ngu": 45, "ngan-ty-ngu": 45, "luc-tao-ngu": 45, "ha-tom": 45, "oc-suoi": 45, "cua-dong": 45, "giay-rach": 5, "rong-reu": 2, "hoa-ly": 160, "bang-ngu": 160, "kim-tu-ngu": 160, "nham-ngu": 160, "vu-ngu": 160, "kiem-ngu": 160, "diep-ngu": 160, "anh-ngu": 160, "khe-ly": 160, "linh-ha": 160, "hoa-giai": 160, "bang-loa": 160, "luu-quang-mau": 160, "binh-gom": 150, "nguyet-ngu": 700, "dao-hoa-ngu": 700, "ha-quang-ngu": 700, "phong-ngu": 700, "tuyet-ngu": 700, "song-dau-ngu": 700, "luu-ly-ngu": 700, "loi-ngu": 700, "huynh-man": 700, "huyet-giai": 700, "mac-chuong": 700, "kim-long-ha": 700, "kiem-gay": 1500, "bi-kip-uot": 1200, "kim-ly": 4000, "hoa-lan-ngu": 4000, "bang-phach-ngu": 4000, "ma-khi-ngu": 4000, "kiem-van-ly": 4000, "that-thai-ngu": 4000, "thien-thuy-mau": 4000, "ruong-chim": 12000, "long-tu-ly": 30000, "tinh-sa-ngu": 30000, "hu-khong-lan": 30000, "linh-nhat-ngu": 30000, "long-ha-vuong": 30000, "ngoc-ty": 80000, "cuu-vi-ly": 150000, "thien-mach-ngu": 150000, "bac-minh-con": 600000, "thanh-long-ngu": 600000, "tran-chau": 300, "huyen-chau": 2000, "long-chau": 40000}, "tran": [260000, 420000, 660000, 1060000, 1700000, 2700000, 4300000, 7000000, 11000000], "khai": {"trai-song": {"chau": [["tran-chau", 0.25, 1]], "ngoc": [0.08, 1, 1]}, "so-diep": {"chau": [["tran-chau", 0.45, 1]], "ngoc": [0.2, 1, 2]}, "trai-huyen": {"chau": [["tran-chau", 0.6, 2], ["huyen-chau", 0.25, 1]], "ngoc": [0.45, 2, 3]}, "co-bang": {"chau": [["tran-chau", 1, 3], ["huyen-chau", 0.5, 1]], "ngoc": [0.8, 3, 4]}, "long-bang": {"chau": [["long-chau", 1, 1], ["huyen-chau", 1, 1]], "ngoc": [1, 4, 5]}}, "ngoc": ["hong-ngoc", "lam-ngoc", "hoang-ngoc", "luc-ngoc"]}'::jsonb;
  v_nv public.p2d_nhan_vat%rowtype; v_realm integer; v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_da numeric; v_con numeric; v_k text; v_n jsonb; v_co numeric; v_g numeric; v_lay integer; v_lt numeric := 0; v_tong integer := 0;
  v_tru jsonb := '{}'::jsonb; v_tm jsonb := '{}'::jsonb; v_tg jsonb := '{}'::jsonb; v_x jsonb; v_kh jsonb; v_gk text; v_lv integer; i integer; v_pb integer; v_cu timestamptz; v_tran numeric;
begin
  if v_me is null then raise exception 'chua_dang_nhap' using errcode = '22023'; end if;
  p_ban := coalesce(p_ban, '{}'::jsonb); p_mo := coalesce(p_mo, '{}'::jsonb);
  if jsonb_typeof(p_ban) <> 'object' or jsonb_typeof(p_mo) <> 'object' or (select count(*) from jsonb_object_keys(p_ban)) > 80
     or (select count(*) from jsonb_object_keys(p_mo)) > 10 or (p_ban = '{}'::jsonb and p_mo = '{}'::jsonb) then
    raise exception 'du_lieu_sai' using errcode = '22023';
  end if;
  for v_k, v_n in select key, value from jsonb_each(p_ban) union all select key, value from jsonb_each(p_mo) loop
    if jsonb_typeof(v_n) <> 'number' or (v_n #>> '{}')::numeric <> floor((v_n #>> '{}')::numeric) or (v_n #>> '{}')::numeric not between 1 and 99999 then
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
  if jsonb_typeof(v_nv.data -> 'mats') is distinct from 'object' then v_nv.data := jsonb_set(v_nv.data, '{mats}', '{}'::jsonb); end if;
  if jsonb_typeof(v_nv.data -> 'gems') is distinct from 'object' then v_nv.data := jsonb_set(v_nv.data, '{gems}', '{}'::jsonb); end if;
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
    v_lay := least((v_n #>> '{}')::integer, floor(v_co)::integer, floor(v_con / greatest(v_g, 1))::integer);
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
    v_lay := least((v_n #>> '{}')::integer, floor(v_co)::integer, 50 - v_tong);
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
    v_nv.data := jsonb_set(v_nv.data, array['mats', v_k], to_jsonb(coalesce(public.p2d_ky_so(v_nv.data -> 'mats' -> v_k), 0) + (v_n #>> '{}')::numeric));
  end loop;
  for v_k, v_n in select key, value from jsonb_each(v_tg) loop
    v_nv.data := jsonb_set(v_nv.data, array['gems', v_k], to_jsonb(coalesce(public.p2d_ky_so(v_nv.data -> 'gems' -> v_k), 0) + (v_n #>> '{}')::numeric));
  end loop;
  if v_lt > 0 then
    v_nv.data := jsonb_set(v_nv.data, '{lingshi}', to_jsonb(coalesce(public.p2d_ky_so(v_nv.data -> 'lingshi'), 0) + v_lt));
    update public.p2d_cau_ban set lt = lt + v_lt where user_id = v_me and ngay = v_ngay;
  end if;
  if v_tru = '{}'::jsonb then
    return jsonb_build_object('phien_ban', v_nv.phien_ban, 'tru', jsonb_build_object('mats', v_tru), 'them', jsonb_build_object('coins', 0, 'mats', v_tm, 'gems', v_tg), 'con', v_con);
  end if;
  update public.p2d_nhan_vat set data = v_nv.data, phien_ban = phien_ban + 1, updated_at = now() where user_id = v_me returning phien_ban into v_pb;
  return jsonb_build_object('phien_ban', v_pb, 'tru', jsonb_build_object('mats', v_tru), 'them', jsonb_build_object('coins', v_lt, 'mats', v_tm, 'gems', v_tg), 'con', v_con);
end;
$$;
revoke all on function public.p2d_cau_doi(jsonb, jsonb) from public, anon;
grant execute on function public.p2d_cau_doi(jsonb, jsonb) to authenticated;
