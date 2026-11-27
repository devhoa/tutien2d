-- Sư đồ, đan cơ duyên, tỉ lệ luyện đan (chủ dự án 25/11/2026 10:08–10:2x). SINH BẰNG tools/su-do-sql.py, không sửa tay.
-- 1. Tỉ lệ luyện đan: gốc 80% (trước 40%), mỗi phẩm đan trừ 4% (trước 5%); thêm Tọa Vong Đan (Chu Quả + Thất Diệp Linh Chi, chỉ có nhờ
--    cơ duyên nhặt trên bản đồ). Chỉ thay hàm p2d_lo_cfg. Linh khí Tọa Vong (1,5 lần tốc chém quái lúc đả tọa) và +10% linh khí của đồ
--    đệ nằm trong hạn mức p2d_kiem_linh_khi sẵn có (hạn mức mỗi giây lớn hơn nhiều lần tốc chém quái), không đổi bộ hãm.
-- 2. Trần nhận mỗi ngày cho hai nguyên liệu cơ duyên (p2d_tran_ngay): sửa bản lưu cũng không có quá số này mỗi ngày.
-- 3. Sư đồ: sư phụ hơn đồ đệ ít nhất 2 cảnh giới lúc kết, mỗi sư phụ tối đa 5 đồ đệ, mỗi người một sư phụ. Mỗi ngày (giờ Việt Nam):
--    sư phụ Chỉ điểm từng đồ đệ (đồ đệ +10% linh khí tới 00:00), đồ đệ Hành lễ (sư phụ +5% Linh Thạch hạ quái tới 00:00, không cộng
--    dồn). Máy chủ chỉ giữ quan hệ và ngày bấm; phần cộng do máy khách tự tính (như đạo lữ), nằm trong hạn mức sẵn có.
-- 4. Nhiệm vụ Hệ Thống "su-do": điều kiện su_do (p2d_ht_dk đọc _su_do do p2d_ht_xong đưa vào từ bảng sư đồ).
-- Không đụng bản lưu của ai.

create or replace function public.p2d_lo_cfg() returns jsonb language sql immutable set search_path = '' as $$
  select '{"base":0.8,"per_set":0.05,"phat_dan":0.04,"floor":0.1,"max":0.95,"pham":[0,0.05,0.1,0.15,0.2,0.25,0.3],"gia_mua":200000,"max_lo":20,"nang":[{"lt":500000,"tt":200},{"lt":1500000,"tt":500},{"lt":4000000,"tt":1200},{"lt":10000000,"tt":3000},{"lt":25000000,"tt":7000},{"lt":60000000,"tt":15000}],"so_kieu":4,"dan":{"hoi-xuan-dan":{"r":{"linh-thao":2},"m":2,"p":0},"hoi-linh-dan":{"r":{"linh-thao":3},"m":2,"p":0},"thang-linh-dan":{"r":{"linh-thao":6,"hoa-linh-chi":2,"yeu-huyet":2},"m":1,"p":3},"tu-khi-dan":{"r":{"linh-thao":3,"yeu-huyet":1},"m":1,"p":1},"boi-nguyen-dan":{"r":{"linh-thao":4,"yeu-huyet":2,"hoa-linh-chi":1},"m":1,"p":2},"thanh-tam-dan":{"r":{"linh-thao":3,"hoa-linh-chi":2},"m":1,"p":2},"linh-ngu-thang":{"r":{"linh-ngu":2,"linh-thao":1},"m":2,"p":0},"van-ngu-thang":{"r":{"van-ngu":2,"hoa-ly":1,"bang-ngu":1},"m":2,"p":1},"tay-tuy-dan":{"r":{"yeu-vuong-dan":1,"linh-thao":6,"hoa-linh-chi":3},"m":1,"p":5},"tu-van-dan":{"r":{"tu-van-sam":2,"linh-thao":2},"m":1,"p":3},"tinh-lien-dan":{"r":{"thai-hu-lien":2,"ngoc-lo-hoa":1},"m":1,"p":4},"toa-vong-dan":{"r":{"chu-qua":2,"that-diep-linh-chi":1},"m":1,"p":4},"nguyet-ngu-thang":{"r":{"nguyet-ngu":2,"linh-thao":2},"m":2,"p":2}},"phuong":{"gia":20000,"them":0.15,"per_set":0.01}}'::jsonb;
$$;
revoke all on function public.p2d_lo_cfg() from public, anon, authenticated;

insert into public.p2d_tran_ngay (loai, tran, nhan_canh_gioi) values
  ('chu-qua', 6, false),
  ('that-diep-linh-chi', 3, false)
on conflict (loai) do update set tran = excluded.tran, nhan_canh_gioi = excluded.nhan_canh_gioi;

create table if not exists public.p2d_su_do (
  do_de uuid not null references auth.users (id) on delete cascade,
  su_phu uuid not null references auth.users (id) on delete cascade,
  trang_thai text not null default 'cho' check (trang_thai in ('cho', 'nhan')),
  moi uuid not null,
  luc timestamptz not null default now(),
  chi_diem date,
  hanh_le date,
  primary key (do_de, su_phu),
  check (do_de <> su_phu)
);
create unique index if not exists p2d_su_do_mot_su on public.p2d_su_do (do_de) where trang_thai = 'nhan';
create index if not exists p2d_su_do_su on public.p2d_su_do (su_phu);
create index if not exists p2d_su_do_moi on public.p2d_su_do (moi) where trang_thai = 'cho';
alter table public.p2d_su_do enable row level security;
revoke all on public.p2d_su_do from anon, authenticated;

create or replace function public.p2d_su_do_ngay() returns date language sql stable set search_path = ''
as $$ select (now() at time zone 'Asia/Ho_Chi_Minh')::date $$;

-- Số quan hệ sư đồ đã kết của người đang gọi (cho nhiệm vụ Hệ Thống)
create or replace function public.p2d_su_do_co() returns integer language sql stable security definer set search_path = ''
as $$ select count(*)::integer from public.p2d_su_do s where s.trang_thai = 'nhan' and (s.do_de = public.p2d_uid() or s.su_phu = public.p2d_uid()) $$;
revoke all on function public.p2d_su_do_co() from public, anon;
grant execute on function public.p2d_su_do_co() to authenticated;

-- Ngỏ lời với một người: ai cảnh giới cao hơn ít nhất 2 bậc là sư phụ. Người kia đã ngỏ lời trước thì thành sư đồ luôn.
create or replace function public.p2d_su_do_moi(p_k text)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.p2d_uid(); v_b uuid := public.p2d_bb_tim(p_k); v_ra integer; v_rb integer; v_su uuid; v_do uuid;
begin
  if v_uid is null then raise exception 'chua_dang_nhap' using errcode = '28000'; end if;
  if v_b is null then raise exception 'khong_thay' using errcode = '22023'; end if;
  if v_b = v_uid then raise exception 'chinh_minh' using errcode = '22023'; end if;
  select canh_gioi into v_ra from public.p2d_nhan_vat where user_id = v_uid;
  select canh_gioi into v_rb from public.p2d_nhan_vat where user_id = v_b;
  if v_ra is null then raise exception 'chua_luu' using errcode = '22023'; end if;
  if v_rb is null then raise exception 'khong_thay' using errcode = '22023'; end if;
  if v_ra - v_rb >= 2 then v_su := v_uid; v_do := v_b;
  elsif v_rb - v_ra >= 2 then v_su := v_b; v_do := v_uid;
  else raise exception 'cach_canh_gioi' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('p2d_su_do:' || v_su::text, 0));
  if exists (select 1 from public.p2d_su_do where do_de = v_do and trang_thai = 'nhan') then
    raise exception '%', case when v_do = v_uid then 'da_co_su_phu' else 'nguoi_kia_co_su_phu' end using errcode = '22023'; end if;
  if (select count(*) from public.p2d_su_do where su_phu = v_su and trang_thai = 'nhan') >= 5 then
    raise exception '%', case when v_su = v_uid then 'du_do_de' else 'su_phu_du_do_de' end using errcode = '22023'; end if;
  update public.p2d_su_do set trang_thai = 'nhan', luc = now(), chi_diem = null, hanh_le = null
    where do_de = v_do and su_phu = v_su and trang_thai = 'cho' and moi = v_b;
  if found then
    delete from public.p2d_su_do where do_de = v_do and trang_thai = 'cho';   -- lời khác của đồ đệ bỏ hết
    return 'thanh_su_do';
  end if;
  if (select count(*) from public.p2d_su_do where moi = v_uid and trang_thai = 'cho') >= 5 then raise exception 'qua_nhieu_loi_moi' using errcode = '22023'; end if;
  insert into public.p2d_su_do (do_de, su_phu, moi) values (v_do, v_su, v_uid) on conflict do nothing;
  return 'da_gui';
end;
$$;
revoke all on function public.p2d_su_do_moi(text) from public, anon;
grant execute on function public.p2d_su_do_moi(text) to authenticated;

-- Rời sư môn / trục xuất / rút lời / từ chối
create or replace function public.p2d_su_do_roi(p_k text)
returns text language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.p2d_uid(); v_b uuid := public.p2d_bb_tim(p_k); v_tt text;
begin
  if v_uid is null then raise exception 'chua_dang_nhap' using errcode = '28000'; end if;
  delete from public.p2d_su_do where (do_de = v_uid and su_phu = v_b) or (do_de = v_b and su_phu = v_uid) returning trang_thai into v_tt;
  return case when v_tt is null then 'khong_co' when v_tt = 'nhan' then 'da_roi' else 'da_rut' end;
end;
$$;
revoke all on function public.p2d_su_do_roi(text) from public, anon;
grant execute on function public.p2d_su_do_roi(text) to authenticated;

-- Sư phụ chỉ điểm một đồ đệ: mỗi ngày một lần cho mỗi đồ đệ
create or replace function public.p2d_su_do_chi_diem(p_k text)
returns text language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.p2d_uid(); v_b uuid := public.p2d_bb_tim(p_k); v_hom date := public.p2d_su_do_ngay(); v_cu date;
begin
  if v_uid is null then raise exception 'chua_dang_nhap' using errcode = '28000'; end if;
  select chi_diem into v_cu from public.p2d_su_do where su_phu = v_uid and do_de = v_b and trang_thai = 'nhan' for update;
  if not found then raise exception 'khong_phai_do_de' using errcode = '22023'; end if;
  if v_cu = v_hom then raise exception 'da_chi_diem' using errcode = '22023'; end if;
  update public.p2d_su_do set chi_diem = v_hom where su_phu = v_uid and do_de = v_b;
  return 'da_chi_diem_xong';
end;
$$;
revoke all on function public.p2d_su_do_chi_diem(text) from public, anon;
grant execute on function public.p2d_su_do_chi_diem(text) to authenticated;

-- Đồ đệ hành lễ với sư phụ: mỗi ngày một lần
create or replace function public.p2d_su_do_hanh_le()
returns text language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.p2d_uid(); v_hom date := public.p2d_su_do_ngay(); v_cu date;
begin
  if v_uid is null then raise exception 'chua_dang_nhap' using errcode = '28000'; end if;
  select hanh_le into v_cu from public.p2d_su_do where do_de = v_uid and trang_thai = 'nhan' for update;
  if not found then raise exception 'chua_co_su_phu' using errcode = '22023'; end if;
  if v_cu = v_hom then raise exception 'da_hanh_le' using errcode = '22023'; end if;
  update public.p2d_su_do set hanh_le = v_hom where do_de = v_uid and trang_thai = 'nhan';
  return 'da_hanh_le_xong';
end;
$$;
revoke all on function public.p2d_su_do_hanh_le() from public, anon;
grant execute on function public.p2d_su_do_hanh_le() to authenticated;

-- Trạng thái của mình: sư phụ, các đồ đệ, lời tới, lời đã gửi; hôm nay ai đã chỉ điểm / hành lễ
create or replace function public.p2d_su_do_tt()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_uid uuid := public.p2d_uid(); v_hom date := public.p2d_su_do_ngay();
begin
  if v_uid is null then raise exception 'chua_dang_nhap' using errcode = '28000'; end if;
  return jsonb_build_object(
    'ngay', v_hom,
    'su_phu', (select jsonb_build_object('k', public.p2d_chat_key(n.user_id), 'ten', n.ten, 'canh_gioi', n.canh_gioi, 'tang', n.tang, 'tu', s.luc,
                 'chi_diem', s.chi_diem is not distinct from v_hom, 'hanh_le', s.hanh_le is not distinct from v_hom)
               from public.p2d_su_do s join public.p2d_nhan_vat n on n.user_id = s.su_phu where s.do_de = v_uid and s.trang_thai = 'nhan'),
    'do_de', coalesce((select jsonb_agg(jsonb_build_object('k', public.p2d_chat_key(n.user_id), 'ten', n.ten, 'canh_gioi', n.canh_gioi, 'tang', n.tang, 'tu', s.luc,
                 'chi_diem', s.chi_diem is not distinct from v_hom, 'hanh_le', s.hanh_le is not distinct from v_hom) order by s.luc)
               from public.p2d_su_do s join public.p2d_nhan_vat n on n.user_id = s.do_de where s.su_phu = v_uid and s.trang_thai = 'nhan'), '[]'::jsonb),
    'moi_toi', coalesce((select jsonb_agg(jsonb_build_object('k', public.p2d_chat_key(n.user_id), 'ten', n.ten, 'canh_gioi', n.canh_gioi, 'tang', n.tang,
                 'vai', case when s.su_phu = v_uid then 'do' else 'su' end) order by s.luc)
               from public.p2d_su_do s join public.p2d_nhan_vat n on n.user_id = s.moi
               where s.trang_thai = 'cho' and s.moi <> v_uid and (s.do_de = v_uid or s.su_phu = v_uid)), '[]'::jsonb),
    'toi_moi', coalesce((select jsonb_agg(jsonb_build_object('k', public.p2d_chat_key(n.user_id), 'ten', n.ten, 'canh_gioi', n.canh_gioi, 'tang', n.tang,
                 'vai', case when s.su_phu = v_uid then 'do' else 'su' end) order by s.luc)
               from public.p2d_su_do s join public.p2d_nhan_vat n on n.user_id = case when s.do_de = v_uid then s.su_phu else s.do_de end
               where s.trang_thai = 'cho' and s.moi = v_uid), '[]'::jsonb));
end;
$$;
revoke all on function public.p2d_su_do_tt() from public, anon;
grant execute on function public.p2d_su_do_tt() to authenticated;

-- Nhiệm vụ Hệ Thống: thêm điều kiện su_do. Thay đúng một đoạn trong định nghĩa đang chạy của p2d_ht_dk và p2d_ht_xong.
do $$
declare v_def text; v_cu text; v_moi text; v_n integer;
begin
  v_def := pg_get_functiondef('public.p2d_ht_dk(jsonb,jsonb)'::regprocedure);
  if position('''su_do''' in v_def) = 0 then
    v_cu := E'  return true;\nend;';
    v_moi := E'  if dk ? ''su_do'' and coalesce((d ->> ''_su_do'')::numeric, 0) < (dk ->> ''su_do'')::numeric then return false; end if;\n  return true;\nend;';
    v_n := (length(v_def) - length(replace(v_def, v_cu, ''))) / length(v_cu);
    if v_n <> 1 then raise exception 'p2d_ht_dk: đoạn cũ xuất hiện % lần (cần đúng 1), không áp', v_n; end if;
    execute replace(v_def, v_cu, v_moi);
  end if;
  v_def := pg_get_functiondef('public.p2d_ht_xong(text,integer)'::regprocedure);
  if position('_su_do' in v_def) = 0 then
    v_cu := '''_trieu'', v_row.so_lan)';
    v_moi := '''_trieu'', v_row.so_lan, ''_su_do'', public.p2d_su_do_co())';
    v_n := (length(v_def) - length(replace(v_def, v_cu, ''))) / length(v_cu);
    if v_n <> 1 then raise exception 'p2d_ht_xong: đoạn cũ xuất hiện % lần (cần đúng 1), không áp', v_n; end if;
    execute replace(v_def, v_cu, v_moi);
  end if;
end $$;

-- Chèn nhiệm vụ vào đúng chỗ trong đường tiến (các nhiệm vụ sau lùi một bậc); mốc quà (moc-*, ord từ 9000) không đụng
do $$
begin
  if not exists (select 1 from public.p2d_ht_nv where id = 'su-do') then
    update public.p2d_ht_nv set ord = ord + 1 where id not like 'moc-%' and ord >= 27;
    insert into public.p2d_ht_nv (id, ord, dk, qua) values ('su-do', 27, '{"su_do": 1}'::jsonb, '[{"coins": 20000}, {"pill": "tu-khi-dan", "n": 5}]'::jsonb);
  else
    update public.p2d_ht_nv set dk = '{"su_do": 1}'::jsonb, qua = '[{"coins": 20000}, {"pill": "tu-khi-dan", "n": 5}]'::jsonb where id = 'su-do';
  end if;
end $$;

-- Tự kiểm tra (lỗi là cả migration lùi lại)
do $$
declare v_c jsonb := public.p2d_lo_cfg();
begin
  if (v_c ->> 'base')::numeric <> 0.8 or (v_c ->> 'phat_dan')::numeric <> 0.04 or not (v_c -> 'dan' ? 'toa-vong-dan') then raise exception 'kiem: p2d_lo_cfg sai'; end if;
  if not public.p2d_ht_dk('{"_su_do": 1}'::jsonb, '{"su_do": 1}'::jsonb) or public.p2d_ht_dk('{}'::jsonb, '{"su_do": 1}'::jsonb) then raise exception 'kiem: p2d_ht_dk su_do sai'; end if;
  if not public.p2d_ht_dk('{"realm": 3}'::jsonb, '{"realm": 2}'::jsonb) then raise exception 'kiem: p2d_ht_dk hong dieu kien cu'; end if;
  if (select count(*) from public.p2d_ht_nv where id not like 'moc-%') <> 111 or (select count(distinct ord) from public.p2d_ht_nv where id not like 'moc-%') <> 111 then raise exception 'kiem: p2d_ht_nv lech so nhiem vu'; end if;
  if (select ord from public.p2d_ht_nv where id = 'su-do') <> 27 or (select ord from public.p2d_ht_nv where id = 'pb-cap-5') <> 28 or (select ord from public.p2d_ht_nv where id = 'do-kiep-9') <> 110 then raise exception 'kiem: thu tu nhiem vu sai'; end if;
  if (select count(*) from public.p2d_tran_ngay where loai in ('chu-qua', 'that-diep-linh-chi')) <> 2 then raise exception 'kiem: tran_ngay thieu'; end if;
  if has_function_privilege('anon', 'public.p2d_su_do_tt()', 'execute') or has_table_privilege('authenticated', 'public.p2d_su_do', 'select') then raise exception 'kiem: quyen sai'; end if;
end $$;
