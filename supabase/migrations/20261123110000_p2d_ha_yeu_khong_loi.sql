-- Đánh người yếu hơn: đánh được, không có lợi (chủ dự án 23/11/2026 20:4x, bảng chọn "Đánh được, không có lợi"; luật ở data/pvp.json → _yeu, yeu).
-- Lý do: người chơi kêu người Kết Đan / chơi lâu PK người mới không cày được; số máy chủ 24 giờ tới 20:4x: ma đồ sát 825 lần (328 lần người
-- cảnh giới cao hạ người thấp hơn), PvP thường Kim Đan hạ Trúc Cơ 211 lần, Nguyên Anh hạ Trúc Cơ 69 lần.
-- Từ nay kẻ hạ có đại cảnh giới (cột canh_gioi, như p2d_ma_du_tang) cao hơn người gục từ yeu.cach (1) trở lên thì vẫn hạ được nhưng KHÔNG ai
-- mất / được gì:
--   - PvP thường (p2d_pvp_ghi): không ghi nợ → người gục không mất Linh Thạch, món; kẻ hạ không có chiến lợi phẩm.
--   - Ma đồ sát (p2d_ma_ghi 'giet'): không cộng điểm ma, không tính lượt thu ngày, không ghi nợ; trận vẫn ghi vào p2d_ma_tran (cột yeu = true)
--     để còn đo.
--   - Diệt ma ('diet'), thiên phạt ('tp'), sám hối ('sh') giữ như cũ: ma tự chọn làm ma.
-- Máy chủ phòng Cloudflare không đổi (vẫn báo gục; loot = 0 vì Supabase không ghi nợ). Máy người chơi chỉ báo chữ (src/game/pvp-yeu.js).
-- Sửa hai hàm bằng cách thay đúng một đoạn trong định nghĩa đang chạy (tự kiểm đoạn cũ có mặt đúng một lần, không thì báo lỗi, không đổi gì).
-- Tắt luật: đặt yeu.cach = 0 trong dòng 'ma' (data/pvp.json → yeu.cach rồi node tools/ky-cfg.mjs ma). Lùi hẳn: định nghĩa cũ sao lưu ở
-- p2d_xu_ly (hanh_dong 'sao_ham_truoc_migration') lúc áp.

alter table public.p2d_ma_tran add column if not exists yeu boolean not null default false;   -- true: kẻ mạnh hơn hạ, không điểm, không nợ

-- Kẻ hạ hơn người gục từ p_c.yeu.cach đại cảnh giới trở lên (cach thiếu hay 0: luật tắt)
create or replace function public.p2d_canh_hon(p_ke uuid, p_nan uuid, p_c jsonb)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((p_c -> 'yeu' ->> 'cach')::integer, 0) > 0
     and coalesce((select greatest(coalesce(n.canh_gioi, 0), 0) from public.p2d_nhan_vat n where n.user_id = p_ke), 0)
       - coalesce((select greatest(coalesce(n.canh_gioi, 0), 0) from public.p2d_nhan_vat n where n.user_id = p_nan), 0)
       >= (p_c -> 'yeu' ->> 'cach')::integer;
$$;
revoke all on function public.p2d_canh_hon(uuid, uuid, jsonb) from public, anon, authenticated;

-- dòng cấu hình 'ma' (node tools/ky-cfg.mjs ma; chỉ thêm yeu so với bản đang chạy)
insert into public.p2d_ky_cfg (k, v) values ('ma', '{"diem":{"hoa":1,"giet":3,"chet":1},"mat":{"ma_lt":0.01,"ma_tu_vi":0.01,"nguoi_lt":0.02},"lt_ngay":10,"nghi_cap":5,"min_tl":4,"tang":9,"can":[40,80,160,320,640,1280,2560,5120,10240,7381,9595,12473,16215,21080,27404,35625,46313,60207,119653,155548,202213,262877,341740,444262,577540,750802,976043,3735014,3847065,3962477,4081351,4203791,4329905,4459802,4593596,4731404,13723792,14135506,14559571,14996358,15446249,15909636,16386925,16878533,17384889,27456534,28280230,29128637,30002496,30902571,31829648,32784538,33768074,34781116,54897070,56543982,58240301,59987510,61787136,63640750,65549972,67516471,69541965,109785703,113079275,116471653,119965802,123564776,127271720,131089871,135022567,139073245,224582011,231319472,238259056,245406827,252769032,260352103,268162666,276207546,284493773],"tui":{"r":64},"yeu":{"cach":1},"co_thu":{"tu_vi":0.005,"share":0.5,"farm_h":[1557,4930,28980,17046,8110,6566,6739,7526,6543]}}'::jsonb) on conflict (k) do update set v = excluded.v;

-- PvP thường: kẻ hơn một đại cảnh giới thì không ghi nợ
do $x$
declare
  v_def text := pg_get_functiondef('public.p2d_pvp_ghi'::regproc);
  v_cu text := E'  if exists (select 1 from public.p2d_pvp_no n where n.ke = v_k and n.nan = v_v and n.tao_luc > now() - interval \'1 hour\') then return false; end if;\n';
  v_moi text := E'  if public.p2d_canh_hon(v_k, v_v, (select c.v from public.p2d_ky_cfg c where c.k = \'ma\')) then return false; end if;   -- kẻ hơn một đại cảnh giới: không ai mất, được gì (23/11/2026)\n'
             || v_cu;
  v_n int;
begin
  v_n := (length(v_def) - length(replace(v_def, v_cu, ''))) / length(v_cu);
  if v_n <> 1 then raise exception 'p2d_pvp_ghi: đoạn cũ xuất hiện % lần (cần đúng 1), không áp', v_n; end if;
  execute replace(v_def, v_cu, v_moi);
end
$x$;

-- Ma đồ sát: ma hơn người một đại cảnh giới thì ghi trận (yeu), không điểm, không nợ
do $x$
declare
  v_def text := pg_get_functiondef('public.p2d_ma_ghi'::regproc);
  v_cu text := E'    if v_mv.ma > 0 or not public.p2d_ma_du_tang(v_v, v_c) then return jsonb_build_object(\'ma\', v_mk.ma); end if;\n';
  v_moi text := v_cu
             || E'    if public.p2d_canh_hon(v_k, v_v, v_c) then   -- ma hơn người một đại cảnh giới (23/11/2026 "Đánh được, không có lợi"): ghi trận, không điểm, không nợ\n'
             || E'      insert into public.p2d_ma_tran (ts, e, ke, nan, yeu) values (p_ts, \'giet\', v_k, v_v, true) on conflict do nothing;\n'
             || E'      return jsonb_build_object(\'ma\', v_mk.ma, \'no\', false, \'yeu\', true);\n'
             || E'    end if;\n';
  v_n int;
begin
  v_n := (length(v_def) - length(replace(v_def, v_cu, ''))) / length(v_cu);
  if v_n <> 1 then raise exception 'p2d_ma_ghi: đoạn cũ xuất hiện % lần (cần đúng 1), không áp', v_n; end if;
  execute replace(v_def, v_cu, v_moi);
end
$x$;

-- Tự kiểm
do $$
begin
  if position('p2d_canh_hon' in pg_get_functiondef('public.p2d_pvp_ghi'::regproc)) = 0 then raise exception 'p2d_pvp_ghi chua co luat yeu'; end if;
  if position('p2d_canh_hon' in pg_get_functiondef('public.p2d_ma_ghi'::regproc)) = 0 then raise exception 'p2d_ma_ghi chua co luat yeu'; end if;
  if (select (v -> 'yeu' ->> 'cach')::integer from public.p2d_ky_cfg where k = 'ma') is distinct from 1 then raise exception 'thieu yeu.cach trong dong ma'; end if;
  if has_function_privilege('anon', 'public.p2d_canh_hon(uuid, uuid, jsonb)', 'execute') or has_function_privilege('authenticated', 'public.p2d_canh_hon(uuid, uuid, jsonb)', 'execute') then
    raise exception 'p2d_canh_hon chi dung trong ham may chu';
  end if;
end $$;
