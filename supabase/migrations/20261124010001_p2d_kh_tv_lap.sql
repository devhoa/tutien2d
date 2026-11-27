-- Lập tinh cầu mới cần đủ thành viên (chủ dự án 24/11/2026 00:29: "tông môn muốn thành lập hành tinh mới thì cần ít nhất 10 thành viên";
-- bảng chọn "Cả lập mới lẫn chiếm"): tông môn chưa có tinh cầu phải có ít nhất tv_lap (10) thành viên mới mở trận Khai Tinh cấp 1
-- (p2d_kh_mo_tran) hoặc khiêu chiến chiếm tinh cầu bỏ trống (p2d_kh_khieu_chien); thiếu thì báo 'it_thanh_vien'. Tông môn đã có tinh cầu
-- giữ và nâng cấp như cũ (nhánh nâng cấp của p2d_kh_mo_tran không xét). Số ở data/khai-hoang.json → tv_lap, chép vào p2d_kh_cfg (tools/check.mjs so).
-- Hai hàm chép đúng bản đang chạy (đã soát trước khi viết: p2d_kh_mo_tran md5 64be4d1d…, p2d_kh_khieu_chien 2577f225…), chỉ thêm một dòng kiểm.
insert into public.p2d_kh_cfg (k, v) values ('cfg', '{"mat": "manh-vo-tinh-cau", "ring": 10, "per_ring": 8, "ten_max": 16, "tv_lap": 10, "lose_wait": 120, "fight_min": 15, "fight_max": 1800, "idle_days": 30, "empty_days": 30, "levels": [{"cap": 1, "manh": 30, "lt": 50000, "realm": 1, "boss_cp": 24000, "d": 44, "ct_max": 3, "do_max": 20}, {"cap": 2, "manh": 80, "lt": 150000, "realm": 1, "boss_cp": 48000, "d": 54, "ct_max": 5, "do_max": 40}, {"cap": 3, "manh": 200, "lt": 400000, "realm": 2, "boss_cp": 96000, "d": 64, "ct_max": 7, "do_max": 60}, {"cap": 4, "manh": 450, "lt": 1000000, "realm": 3, "boss_cp": 180000, "d": 74, "ct_max": 9, "do_max": 80}, {"cap": 5, "manh": 900, "lt": 2500000, "realm": 4, "boss_cp": 320000, "d": 84, "ct_max": 12, "do_max": 100}], "dat": ["rung", "co", "tuyet", "tro", "cat", "da-den", "hau-tho"], "ct": {"tk.lau-van-bao-m": {"lt": 80000, "loai": "cn"}, "tk.nha-ren-m": {"lt": 60000, "loai": "cn"}, "xd.nha-hac-m": {"lt": 60000, "loai": "cn"}, "tk.dien-phu-m": {"lt": 80000, "loai": "cn"}, "tk.dien-nho-m": {"lt": 40000, "loai": "cn"}, "tk.lau-cho-m": {"lt": 60000, "loai": "cn"}, "tk.nha-dan-m": {"lt": 40000, "loai": "cn"}, "xd.nha-dan-m": {"lt": 40000, "loai": "cn"}, "xd.lo-ren-m": {"lt": 40000, "loai": "cn"}, "tk.dien-chinh-m": {"lt": 30000, "loai": "nha"}, "tk.tien-dai-m": {"lt": 30000, "loai": "nha"}, "tk.lau-sach-m": {"lt": 40000, "loai": "nha"}, "tk.thap-canh-m": {"lt": 30000, "loai": "nha"}, "hb.nha-tuyet-m": {"lt": 25000, "loai": "nha"}, "hb.dien-tuyet-m": {"lt": 40000, "loai": "nha"}, "hb.thap-tuyet-m": {"lt": 30000, "loai": "nha"}, "xd.dien-nho-m": {"lt": 30000, "loai": "nha"}, "hb.nha-ca-m": {"lt": 25000, "loai": "nha"}}, "do": ["tk.cay-anh-dao-m", "tk.cay-thong-m", "tk.cay-phong-m", "tk.cay-ngan-hanh-m", "hb.cay-tung-tuyet-m", "hb.cay-mai-m", "xd.cay-hoa-lua-m", "xd.cay-phong-m", "tk.bui-hong-m", "tk.bui-xanh-m", "hb.bui-tuyet-m", "xd.bui-chay-m", "tk.den-da-m", "tk.den-sen-m", "tk.den-treo-m", "hb.den-bang-m", "xd.den-long-m", "xd.den-phuong-m", "tk.da-reu-m", "tk.da-tim-m", "hb.da-tuyet-m", "xd.da-bazan-m", "tk.su-tu-m", "tk.tuong-hac-m", "tk.tuong-rong-m", "xd.tuong-phuong-m", "tk.lan-can-go-m", "tk.lan-can-da-m", "hb.lan-can-tuyet-m", "xd.rao-sat-m", "tk.gieng-m", "tk.lu-huong-m", "tk.thac-m", "tk.voi-nuoc-m", "tk.chuong-m", "tk.quan-tra-m", "hb.nguoi-tuyet-m", "tk.cong-go-m", "tk.cong-kiem-m", "xd.cong-phuong-m", "hb.cong-bang-m"], "do_lt": 3000, "loai_anh": ["chi-ganh-da", "chu-cho", "ngu-thu-su", "quan-binh-kho", "thuong-nhan", "tieu-phu", "to-doi", "van-bao", "van-hac", "nha"], "anh": {"ngay": 3, "mb": 3, "px": 2048, "min_trong": 0.2}, "kc_wait": 600}'::jsonb)
  on conflict (k) do update set v = excluded.v;

create or replace function public.p2d_kh_mo_tran(p_ten text, p_dat text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public.p2d_uid(); v_c jsonb := public.p2d_kh_c(); v_nv public.p2d_nhan_vat%rowtype; v_tv public.p2d_bang_tv%rowtype;
  v_t public.p2d_tinh_cau%rowtype; v_tr public.p2d_kh_tran%rowtype; v_k public.p2d_bang_kho%rowtype; v_l jsonb; v_cap integer;
  v_ten text; v_dat text; v_hat integer;
begin
  select * into v_nv from public.p2d_nhan_vat where user_id = v_uid;
  if not found then raise exception 'chua_luu' using errcode = '22023'; end if;
  if v_nv.nghi_van >= 10 then raise exception 'bi_khoa' using errcode = '42501'; end if;
  select * into v_tv from public.p2d_bang_tv where user_id = v_uid;
  if not found then raise exception 'khong_co' using errcode = '22023'; end if;
  if v_tv.chuc <> 'chu' then raise exception 'khong_phai_chu' using errcode = '42501'; end if;
  perform 1 from public.p2d_bang where id = v_tv.bang_id for update;
  perform public.p2d_kh_quet();
  select * into v_tr from public.p2d_kh_tran where bang_id = v_tv.bang_id and xong is null order by bat_dau desc limit 1;
  if found then
    return jsonb_build_object('ve', v_tr.id, 'cap', v_tr.cap, 'ten', v_tr.ten, 'mat_dat', v_tr.mat_dat, 'hat', v_tr.hat, 'cu', true);
  end if;
  if exists (select 1 from public.p2d_kh_tran where bang_id = v_tv.bang_id and xong = 'thua'
      and xong_luc > now() - make_interval(secs => (v_c ->> 'lose_wait')::integer)) then raise exception 'dang_cho' using errcode = '22023'; end if;
  select * into v_t from public.p2d_tinh_cau where bang_id = v_tv.bang_id and trang_thai = 'song';
  v_cap := coalesce(v_t.cap, 0) + 1;
  v_l := public.p2d_kh_cap(v_cap);
  if v_l is null then raise exception 'cap_toi_da' using errcode = '22023'; end if;
  if v_nv.canh_gioi < (v_l ->> 'realm')::integer then raise exception 'chua_du_canh_gioi' using errcode = '22023'; end if;
  select * into v_k from public.p2d_bang_kho where bang_id = v_tv.bang_id;
  if coalesce(v_k.manh, 0) < (v_l ->> 'manh')::integer then raise exception 'thieu_manh' using errcode = '22023'; end if;
  if coalesce(v_k.lt, 0) < (v_l ->> 'lt')::numeric then raise exception 'thieu_tien' using errcode = '22023'; end if;
  if v_t.id is null then
    if (select count(*) from public.p2d_bang_tv where bang_id = v_tv.bang_id) < coalesce((v_c ->> 'tv_lap')::integer, 0) then raise exception 'it_thanh_vien' using errcode = '22023'; end if;   -- 24/11/2026: lập / chiếm tinh cầu cần đủ thành viên
    if exists (select 1 from public.p2d_tinh_cau where chu = v_uid and trang_thai = 'song') then raise exception 'co_tinh_cau' using errcode = '22023'; end if;
    v_ten := public.p2d_bang_sach(p_ten); v_dat := coalesce(p_dat, '');
    if char_length(v_ten) not between 2 and (v_c ->> 'ten_max')::integer then raise exception 'ten_sai' using errcode = '22023'; end if;
    if not (v_c -> 'dat') ? v_dat then raise exception 'dat_sai' using errcode = '22023'; end if;
    if exists (select 1 from public.p2d_tinh_cau where lower(ten) = lower(v_ten) and trang_thai in ('song', 'trong')) then raise exception 'ten_trung' using errcode = '22023'; end if;
    v_hat := floor(random() * 2147483646)::integer + 1;
  else
    v_ten := v_t.ten; v_dat := v_t.mat_dat; v_hat := v_t.hat;
  end if;
  insert into public.p2d_kh_tran (bang_id, chu, cap, tinh_id, ten, mat_dat, hat) values (v_tv.bang_id, v_uid, v_cap, v_t.id, v_ten, v_dat, v_hat) returning * into v_tr;
  return jsonb_build_object('ve', v_tr.id, 'cap', v_cap, 'ten', v_ten, 'mat_dat', v_dat, 'hat', v_hat, 'cu', false);
end;
$$;

create or replace function public.p2d_kh_khieu_chien(p_tinh uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public.p2d_uid(); v_c jsonb := public.p2d_kh_c(); v_nv public.p2d_nhan_vat%rowtype; v_tv public.p2d_bang_tv%rowtype; v_t public.p2d_tinh_cau%rowtype;
  v_ta numeric; v_cu numeric; v_thang boolean;
begin
  select * into v_nv from public.p2d_nhan_vat where user_id = v_uid;
  if not found then raise exception 'chua_luu' using errcode = '22023'; end if;
  if v_nv.nghi_van >= 10 then raise exception 'bi_khoa' using errcode = '42501'; end if;
  select * into v_tv from public.p2d_bang_tv where user_id = v_uid;
  if not found or v_tv.chuc <> 'chu' then raise exception 'khong_phai_chu' using errcode = '42501'; end if;
  perform public.p2d_kh_quet();
  if exists (select 1 from public.p2d_tinh_cau where trang_thai = 'song' and (bang_id = v_tv.bang_id or chu = v_uid)) then raise exception 'co_tinh_cau' using errcode = '22023'; end if;
  if (select count(*) from public.p2d_bang_tv where bang_id = v_tv.bang_id) < coalesce((v_c ->> 'tv_lap')::integer, 0) then raise exception 'it_thanh_vien' using errcode = '22023'; end if;   -- 24/11/2026: lập / chiếm tinh cầu cần đủ thành viên
  select * into v_t from public.p2d_tinh_cau where id = p_tinh for update;
  if not found or v_t.trang_thai <> 'trong' then raise exception 'het_tran' using errcode = '22023'; end if;
  if exists (select 1 from public.p2d_kh_kc where user_id = v_uid and not thang and luc > now() - make_interval(secs => (v_c ->> 'kc_wait')::integer)) then raise exception 'dang_cho' using errcode = '22023'; end if;
  v_ta := greatest(coalesce(v_nv.luc_chien, 0), 0) * (0.8 + random() * 0.4);
  v_cu := greatest(coalesce((select luc_chien from public.p2d_nhan_vat where user_id = v_t.chu), 0), 0) * (0.8 + random() * 0.4);
  v_thang := v_ta >= v_cu;
  insert into public.p2d_kh_kc (tinh_id, user_id, thang, ta, cu) values (p_tinh, v_uid, v_thang, round(v_ta), round(v_cu));
  if v_thang then
    update public.p2d_tinh_cau set bang_id = v_tv.bang_id, chu = v_uid, trang_thai = 'song', ghe_luc = now(), bo_luc = null, chu_ten = null where id = p_tinh;
    insert into public.p2d_kh_ct (bang_id, ma, so)
      select v_tv.bang_id, x ->> 0, count(*) from jsonb_array_elements(v_t.bay) x where x ->> 0 not like 'u.%' group by x ->> 0
      on conflict (bang_id, ma) do update set so = greatest(public.p2d_kh_ct.so, excluded.so);
    update public.p2d_tinh_cau set bay = coalesce((select jsonb_agg(x) from jsonb_array_elements(v_t.bay) x where x ->> 0 not like 'u.%'), '[]'::jsonb) where id = p_tinh;
  end if;
  return jsonb_build_object('thang', v_thang, 'ta', round(v_ta), 'cu', round(v_cu), 'ten_cu', v_t.chu_ten, 'chu_cu', public.p2d_bang_ten_nguoi(v_t.chu), 'chu_k', public.p2d_chat_key(v_t.chu), 'cho', (v_c ->> 'kc_wait')::integer);
end;
$$;

-- Tự kiểm: cấu hình có tv_lap, hai hàm đều có dòng kiểm, quyền gọi giữ như cũ (đã đăng nhập gọi được, khách thì không)
do $$
begin
  if (public.p2d_kh_c() ->> 'tv_lap')::integer is distinct from 10 then raise exception 'kh_tv_lap: cấu hình chưa có tv_lap = 10'; end if;
  if position('it_thanh_vien' in pg_get_functiondef('public.p2d_kh_mo_tran(text, text)'::regprocedure)) = 0 then raise exception 'kh_tv_lap: p2d_kh_mo_tran chưa có dòng kiểm'; end if;
  if position('it_thanh_vien' in pg_get_functiondef('public.p2d_kh_khieu_chien(uuid)'::regprocedure)) = 0 then raise exception 'kh_tv_lap: p2d_kh_khieu_chien chưa có dòng kiểm'; end if;
  if has_function_privilege('anon', 'public.p2d_kh_mo_tran(text, text)', 'execute') or has_function_privilege('anon', 'public.p2d_kh_khieu_chien(uuid)', 'execute') then raise exception 'kh_tv_lap: khách gọi được'; end if;
  if not has_function_privilege('authenticated', 'public.p2d_kh_mo_tran(text, text)', 'execute') or not has_function_privilege('authenticated', 'public.p2d_kh_khieu_chien(uuid)', 'execute') then raise exception 'kh_tv_lap: người đăng nhập không gọi được'; end if;
end $$;
