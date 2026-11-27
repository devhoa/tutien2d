-- Tiền bán hợp lệ không bị coi là Linh Thạch lố (chủ dự án 23/11/2026 00:5x chọn "Máy chủ tính tiền bán", sau khi một người chơi bị
-- tự khoá oan 22/11: bán nhanh một lô pháp bảo được +220 nghìn Linh Thạch trong một lần lưu, máy chủ không biết khoản đó nên ghi day_cuc).
--
-- p2d_mien_tran dựng bản "cũ" đã cộng tiền bán (rồi p2d_thu_ban kẹp theo thùng tiền bán thu.sv.ban như cũ). Trước bản này chỉ tính:
-- món trong túi (giá bán 5 phẩm cũ), linh thú, thú cưỡi. Bản này tính thêm, đúng giá máy khách cộng:
--   1) món túi phẩm Tiên / Thượng Cổ (data/shop.json → sell: 400 / 800);
--   2) pháp bảo bán (src/game/phap-bao-drop.js pbPrice, phap-bao-ban.js): giá phẩm (data/phap-bao.json → drop.sell) × (1 + lv_k × cấp);
--   3) khôi lỗi bán (src/game/beast-shop.js sellPuppet): resell_max 0,5 × giá mua (p2d_ky_cfg cfg → thu.comp.gia);
--   4) bản thời trang / thú cưỡi thêm (khoá có "#") bán (src/game/inst.js sellTier): theo phẩm dòng của bản đó (data/pets.json → beast.sell_tier);
--   5) quà tu vi lúc lên tầng / đột phá (src/game/realm-gift.js, data/realms.json → gift): theo số tầng giftAt vừa tăng, không quá tu vi đang có.
-- Món biến mất vì phân giải / gộp cũng được tính như bán: chỉ là hạn mức cho phép, vẫn kẹp trong thùng tiền bán và không ai lợi hơn bán thật.
-- Không đổi p2d_luu, không đổi bảng. Lùi: chạy lại p2d_mien_tran của bản trước (định nghĩa sao lưu ở p2d_xu_ly lúc áp).

create or replace function public.p2d_mien_tran(p_cu jsonb, p_moi jsonb, p_uid uuid)
returns jsonb
language plpgsql
stable security definer
set search_path = ''
as $$
declare
  v_sell  jsonb := '{"pham":4,"linh":10,"huyen":25,"dia":70,"thien":180,"tien":400,"thuong-co":800}';
  v_stone jsonb := '{"pham":1,"linh":2,"huyen":3,"dia":6,"thien":12}';
  v_iron  jsonb := '{"pham":1,"linh":2,"huyen":3,"dia":5,"thien":8}';
  v_manh  jsonb := '{"pham":1,"linh":2,"huyen":4,"dia":8,"thien":16}';
  v_pb_gia jsonb := '{"pham":300,"linh":1000,"huyen":3000,"dia":9000,"thien":30000}';
  v_tier  numeric[] := '{500,1000,2000,4000,8000,15000,25000}';
  v_ci int[] := '{0,1,3,6,10,15,21,29,39,51,66,84,105,130,160,196,239,290,351,424,511}';
  v_cs int[] := '{0,0,0,0,0,1,2,4,6,9,13,18,24,31,39,48,59,72,87,104,124}';
  v_l numeric := 0; v_tl numeric := 0; v_tt numeric := 0; v_mp numeric := 0; v_dv numeric := 0;
  v_rao jsonb; v_it jsonb; v_r text; v_p int; v_k text; v_v jsonb; v_cg jsonb; v_t int;
  v_g0 int; v_g1 int; v_n int; v_lv int;
begin
  if p_cu is null or p_moi is null then return p_cu; end if;
  select coalesce(jsonb_agg(c.mon -> 'uid'), '[]'::jsonb) into v_rao from public.p2d_cho c where c.nguoi_ban = p_uid and c.loai = 'mon';
  for v_it in select o from jsonb_array_elements(case when jsonb_typeof(p_cu -> 'bag') = 'array' then p_cu -> 'bag' else '[]'::jsonb end) o
               where jsonb_typeof(o) = 'object'
                 and not exists (select 1 from jsonb_array_elements(case when jsonb_typeof(p_moi -> 'bag') = 'array' then p_moi -> 'bag' else '[]'::jsonb end) n where n -> 'uid' = o -> 'uid')
                 and not (v_rao @> jsonb_build_array(o -> 'uid')) loop
    v_r := coalesce(v_it ->> 'rarity', 'pham');
    v_p := least(greatest(coalesce(case when jsonb_typeof(v_it -> 'plus') = 'number' then (v_it ->> 'plus')::int end, 0), 0), 20);
    v_l  := v_l  + coalesce((v_sell ->> v_r)::numeric, 0);
    v_tl := v_tl + coalesce((v_stone ->> v_r)::numeric, 0) + floor(v_cs[v_p + 1] * 0.4);
    v_tt := v_tt + coalesce((v_iron ->> v_r)::numeric, 0) + floor(v_ci[v_p + 1] * 0.4);
    if coalesce(v_it ->> 'base', '') in ('kim-luan', 'tran-yeu-thap', 'hoa-hon-linh', 'dao-van-an') then
      v_mp := v_mp + coalesce((v_manh ->> v_r)::numeric, 1) + floor(least(greatest(coalesce(case when jsonb_typeof(v_it -> 'pb') = 'number' then (v_it ->> 'pb')::numeric end, 0), 0), 100) / 2);
    end if;
    v_dv := v_dv + 1;
  end loop;
  if jsonb_typeof(p_cu -> 'pets') = 'object' then
    for v_k, v_v in select e.key, e.value from jsonb_each(p_cu -> 'pets') e
                     where not (case when jsonb_typeof(p_moi -> 'pets') = 'object' then p_moi -> 'pets' else '{}'::jsonb end ? e.key) loop
      v_l := v_l + 300 + least(coalesce(case when jsonb_typeof(v_v -> 'lv') = 'number' then (v_v ->> 'lv')::numeric end, 1), 1000) * 150
                 + least(coalesce(case when jsonb_typeof(v_v -> 'star') = 'number' then (v_v ->> 'star')::numeric end, 0), 100) * 1000
                 + case when coalesce(v_v ->> 'evo', 'false') not in ('false', 'null', '0', '') then 450 else 0 end;
    end loop;
  end if;
  if jsonb_typeof(p_cu -> 'mounts') in ('object', 'array') then
    select v_l + count(*) * 12500 into v_l from jsonb_object_keys(public.p2d_thu_bang(p_cu -> 'mounts')) k
     where not (public.p2d_thu_bang(p_moi -> 'mounts') ? k);
  end if;

  -- 2) pháp bảo bán (mới 23/11/2026)
  for v_it in select o from jsonb_array_elements(case when jsonb_typeof(p_cu -> 'phapBao' -> 'items') = 'array' then p_cu -> 'phapBao' -> 'items' else '[]'::jsonb end) o
               where jsonb_typeof(o) = 'object'
                 and not exists (select 1 from jsonb_array_elements(case when jsonb_typeof(p_moi -> 'phapBao' -> 'items') = 'array' then p_moi -> 'phapBao' -> 'items' else '[]'::jsonb end) n where n -> 'uid' = o -> 'uid') loop
    v_lv := least(greatest(coalesce(case when jsonb_typeof(v_it -> 'lv') = 'number' then (v_it ->> 'lv')::int end, 0), 0), 45);
    v_l := v_l + round(coalesce((v_pb_gia ->> (v_it ->> 'grade'))::numeric, 0) * (1 + 0.1 * v_lv));
  end loop;

  -- 3) khôi lỗi bán: nửa giá mua
  if jsonb_typeof(p_cu -> 'comps') = 'object' then
    v_cg := (select c.v -> 'thu' -> 'comp' -> 'gia' from public.p2d_ky_cfg c where c.k = 'cfg');
    select v_l + coalesce(sum(floor(coalesce((v_cg ->> e.key)::numeric, 0) * 0.5)), 0) into v_l from jsonb_each(p_cu -> 'comps') e
     where not (case when jsonb_typeof(p_moi -> 'comps') = 'object' then p_moi -> 'comps' else '{}'::jsonb end ? e.key);
  end if;

  -- 4) bản thời trang / thú cưỡi thêm (khoá có '#') bán theo phẩm dòng
  for v_k in select e.key from jsonb_each(case when jsonb_typeof(p_cu -> 'outfits') = 'object' then p_cu -> 'outfits' else '{}'::jsonb end) e
              where position('#' in e.key) > 0
                and not (case when jsonb_typeof(p_moi -> 'outfits') = 'object' then p_moi -> 'outfits' else '{}'::jsonb end ? e.key) loop
    v_t := least(greatest(coalesce(public.p2d_ky_so(p_cu -> 'outfitLine' -> v_k -> 't'), 0)::int, 0), 6);
    v_l := v_l + v_tier[v_t + 1];
  end loop;
  for v_k in select k from jsonb_object_keys(public.p2d_thu_bang(p_cu -> 'mounts')) k
              where position('#' in k) > 0 and not (public.p2d_thu_bang(p_moi -> 'mounts') ? k) loop
    v_t := least(greatest(coalesce(public.p2d_ky_so(p_cu -> 'mountLine' -> v_k -> 't'), 0)::int, 0), 6);
    v_l := v_l + v_tier[v_t + 1] - 12500;   -- phần 12 500 cũ ở trên đã tính cho khoá này
  end loop;

  -- 5) quà tu vi: mỗi tầng từ tổng tầng 4 được 500 × 2^cảnh giới, mỗi lần đột phá 5 000 × 2^cảnh giới mới
  v_g0 := coalesce(public.p2d_ky_so(p_cu -> 'giftAt'), -1)::int;
  v_n := least(greatest(coalesce(public.p2d_ky_so(p_moi -> 'realm'), 0), 0), 8)::int * 9 + least(greatest(coalesce(public.p2d_ky_so(p_moi -> 'layer'), 1), 1), 9)::int - 1;
  v_g1 := least(coalesce(public.p2d_ky_so(p_moi -> 'giftAt'), -1)::int, v_n);
  if v_g0 >= 0 and v_g1 > v_g0 then
    for v_p in v_g0 + 1 .. least(v_g1, v_g0 + 20) loop
      if mod(v_p, 9) = 0 then v_l := v_l + 5000 * power(2, v_p / 9);
      elsif v_p >= 4 then v_l := v_l + 500 * power(2, v_p / 9); end if;
    end loop;
  end if;

  if v_l > 0 then
    p_cu := jsonb_set(p_cu, '{lingshi}', to_jsonb(coalesce(case when jsonb_typeof(p_cu -> 'lingshi') = 'number' then (p_cu ->> 'lingshi')::numeric end, 0) + v_l));
  end if;
  if v_dv > 0 then
    if jsonb_typeof(p_cu -> 'mats') is distinct from 'object' then p_cu := jsonb_set(p_cu, '{mats}', '{}'::jsonb); end if;
    select p_cu || jsonb_build_object('mats', (p_cu -> 'mats') || coalesce(jsonb_object_agg(m.k,
             coalesce(case when jsonb_typeof(p_cu -> 'mats' -> m.k) = 'number' then (p_cu -> 'mats' ->> m.k)::numeric end, 0) + m.n), '{}'::jsonb))
      into p_cu
      from (values ('tay-luyen-thach', v_tl), ('tinh-thiet', v_tt), ('manh-phap-bao', v_mp), ('dao-van-thach', v_dv)) m(k, n) where m.n > 0;
  end if;
  return p_cu;
end;
$$;
