-- Bảng xếp hạng Câu cá (chủ dự án 27/11/2026 00:16: "Bxh câu cá, ok, làm, mỗi con nhỏ bao nhiêu điểm, con to bao nhiêu điểm; và trong bxh
-- sẽ ghi chi tiết bao nhiêu con gì con gì"; CSKH #405). Số ở data/fishing.json → bxh, dòng p2d_ky_cfg 'cau' dựng bằng node tools/ky-cfg.mjs cau
-- (tools/check.mjs so). Điểm = tổng (số con từng câu của loài × diem[phẩm loài]); chỉ con vật, bỏ bảo vật chìm.
-- Nguồn là sổ câu trong bản lưu (data.cau.so) nên phải chặn khai khống: trigger p2d_giu_cau
--   * mỗi loài giữ số lớn hơn giữa bản cũ và bản mới (bản lưu cũ ở máy khác gửi lên không làm tụt sổ câu);
--   * tổng thêm trong một lần lưu không quá (giây từ lần sổ câu tăng trước) / giay + du; quá thì giữ sổ câu cũ (không cờ, không khoá);
--   * lần lưu đầu tính giây từ lúc tạo tài khoản.
-- Cột mới cau_luc: lúc sổ câu được nhận tăng lần cuối.

insert into public.p2d_ky_cfg (k, v) values ('cau', '{"diem":[1,2,5,15,50,200,1000],"giay":3,"du":30,"pham":{"anh-ngu":1,"bac-minh-con":6,"bang-loa":1,"bang-ngu":1,"bang-phach-ngu":3,"co-bang":3,"cua-dong":0,"cuu-vi-ly":5,"dao-hoa-ngu":2,"diep-ngu":1,"ha-quang-ngu":2,"ha-tom":0,"hoa-giai":1,"hoa-lan-ngu":3,"hoa-ly":1,"hu-khong-lan":4,"huyet-giai":2,"huynh-man":2,"khe-ly":1,"kiem-ngu":1,"kiem-van-ly":3,"kim-long-ha":2,"kim-ly":3,"kim-tu-ngu":1,"linh-ha":1,"linh-ngu":0,"linh-nhat-ngu":4,"loi-ngu":2,"long-bang":4,"long-ha-vuong":4,"long-tu-ly":4,"luc-tao-ngu":0,"luu-ly-ngu":2,"luu-quang-mau":1,"ma-khi-ngu":3,"mac-chuong":2,"ngan-ty-ngu":0,"nguyet-ngu":2,"nham-ngu":1,"oc-suoi":0,"phong-ngu":2,"so-diep":1,"song-dau-ngu":2,"thanh-long-ngu":6,"that-thai-ngu":3,"thien-mach-ngu":5,"thien-thuy-mau":3,"tinh-sa-ngu":4,"trai-huyen":2,"trai-song":0,"tuyet-ngu":2,"van-ngu":0,"vu-ngu":1}}'::jsonb)
on conflict (k) do update set v = excluded.v;

alter table public.p2d_nhan_vat add column if not exists cau_luc timestamptz;

-- Sổ câu sạch: chỉ số nguyên >= 0, mã ngắn
create or replace function public.p2d_cau_so(p_so jsonb) returns jsonb language sql immutable set search_path to '' as $$
  select coalesce(jsonb_object_agg(k, least(floor(v::numeric), 100000000)::bigint), '{}'::jsonb)
  from jsonb_each_text(case when jsonb_typeof(p_so) = 'object' then p_so else '{}'::jsonb end) e(k, v)
  where char_length(k) <= 40 and v ~ '^[0-9]+(\.[0-9]+)?$' and v::numeric >= 1
$$;
create or replace function public.p2d_cau_tong(p_so jsonb) returns bigint language sql immutable set search_path to '' as $$
  select coalesce(sum(v::bigint), 0)::bigint from jsonb_each_text(public.p2d_cau_so(p_so)) e(k, v)
$$;
create or replace function public.p2d_cau_diem(p_so jsonb) returns bigint language sql stable security definer set search_path to '' as $$
  select coalesce(sum(e.v::bigint * (c.v -> 'diem' ->> ((c.v -> 'pham' ->> e.k)::int))::bigint), 0)::bigint
  from jsonb_each_text(public.p2d_cau_so(p_so)) e(k, v), public.p2d_ky_cfg c
  where c.k = 'cau' and c.v -> 'pham' ? e.k
$$;
revoke all on function public.p2d_cau_so(jsonb), public.p2d_cau_tong(jsonb), public.p2d_cau_diem(jsonb) from public, anon, authenticated;

create or replace function public.p2d_giu_cau()
returns trigger language plpgsql security definer set search_path to '' as $$
declare
  v_c jsonb := (select v from public.p2d_ky_cfg where k = 'cau');
  v_moi jsonb; v_cu jsonb := '{}'::jsonb; v_hop jsonb; v_them bigint; v_tu timestamptz; v_cho numeric;
begin
  if v_c is null or current_setting('p2d.lk_tru', true) = '1' then return new; end if;
  if coalesce(jsonb_typeof(new.data -> 'cau'), '') <> 'object' then return new; end if;
  v_moi := public.p2d_cau_so(new.data -> 'cau' -> 'so');
  if tg_op = 'UPDATE' then
    v_cu := public.p2d_cau_so(old.data -> 'cau' -> 'so');
    v_tu := coalesce(old.cau_luc, old.created_at);
  else
    v_tu := coalesce((select created_at from auth.users where id = new.user_id), now());
  end if;
  select coalesce(jsonb_object_agg(k, greatest(coalesce((v_cu ->> k)::bigint, 0), coalesce((v_moi ->> k)::bigint, 0))), '{}'::jsonb)
    into v_hop from (select jsonb_object_keys(v_cu) k union select jsonb_object_keys(v_moi)) x;
  v_them := public.p2d_cau_tong(v_hop) - public.p2d_cau_tong(v_cu);
  v_cho := extract(epoch from (now() - v_tu)) / (v_c ->> 'giay')::numeric + (v_c ->> 'du')::numeric;
  if v_them > v_cho then v_hop := v_cu; v_them := 0; end if;
  if v_hop is distinct from public.p2d_cau_so(new.data -> 'cau' -> 'so') then
    new.data := jsonb_set(new.data, '{cau,so}', v_hop);
  end if;
  if v_them > 0 then new.cau_luc := now(); end if;
  return new;
end $$;
revoke all on function public.p2d_giu_cau() from public, anon, authenticated;
drop trigger if exists p2d_giu_cau on public.p2d_nhan_vat;
create trigger p2d_giu_cau before insert or update of data on public.p2d_nhan_vat for each row execute function public.p2d_giu_cau();

-- Bảng: top 50 kèm chi tiết từng loài, hạng của mình. Nhớ 60 giây ở p2d_bxh_nho dòng 'cau' (top + mọi điểm để tính hạng mình).
create or replace function public.p2d_bxh_cau()
returns jsonb language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := (select auth.uid()); v_nho public.p2d_bxh_nho%rowtype; v_bo jsonb; v_top jsonb; v_toi jsonb; v_d bigint; v_so jsonb;
  v_ten text; v_co boolean;
begin
  if v_uid is null then raise exception 'chua_dang_nhap' using errcode = '28000'; end if;
  select * into v_nho from public.p2d_bxh_nho where loai = 'cau';
  if (not found or v_nho.luc < now() - interval '60 seconds') and pg_try_advisory_xact_lock(hashtext('p2d_bxh:cau')) then
    with ds as (
      select n.user_id u, n.ten, n.nghi_van >= 10 co, n.updated_at, public.p2d_cau_diem(n.data -> 'cau' -> 'so') d,
             (select coalesce(jsonb_object_agg(e.k, e.v), '{}'::jsonb) from jsonb_each(public.p2d_cau_so(n.data -> 'cau' -> 'so')) e(k, v), public.p2d_ky_cfg c
               where c.k = 'cau' and c.v -> 'pham' ? e.k) so
      from public.p2d_nhan_vat n
      where jsonb_typeof(n.data -> 'cau' -> 'so') = 'object'
        and not exists (select 1 from auth.users x where x.id = n.user_id and x.banned_until > now())
        and not exists (select 1 from public.p2d_thien_ma tm where tm.user_id = n.user_id)
    ), xep as (select *, row_number() over (order by d desc, updated_at asc) hang from ds where d > 0)
    select jsonb_build_object(
      'top', (select coalesce(jsonb_agg(jsonb_build_object('hang', hang, 'ten', ten, 'gia_tri', d, 'so', so, 'co', co, 'u', u) order by hang), '[]'::jsonb) from xep where hang <= 50),
      'all', (select coalesce(jsonb_agg(d order by d desc), '[]'::jsonb) from xep))
      into v_bo;
    insert into public.p2d_bxh_nho (loai, top, luc) values ('cau', v_bo, now())
    on conflict (loai) do update set top = excluded.top, luc = excluded.luc;
  else
    v_bo := coalesce(v_nho.top, '{}'::jsonb);
  end if;
  select coalesce(jsonb_agg((e - 'u') || jsonb_build_object('la_toi', e ->> 'u' = v_uid::text, 'k', public.p2d_chat_key((e ->> 'u')::uuid))
         order by (e ->> 'hang')::bigint), '[]'::jsonb)
    into v_top from jsonb_array_elements(coalesce(v_bo -> 'top', '[]'::jsonb)) e;
  select n.ten, n.nghi_van >= 10, public.p2d_cau_diem(n.data -> 'cau' -> 'so'), public.p2d_cau_so(n.data -> 'cau' -> 'so')
    into v_ten, v_co, v_d, v_so from public.p2d_nhan_vat n where n.user_id = v_uid;
  if v_d > 0 then
    v_toi := jsonb_build_object('hang', 1 + (select count(*) from jsonb_array_elements_text(coalesce(v_bo -> 'all', '[]'::jsonb)) a where a::bigint > v_d),
      'ten', v_ten, 'gia_tri', v_d, 'co', v_co, 'k', public.p2d_chat_key(v_uid));
  end if;
  return jsonb_build_object('top', v_top, 'toi', v_toi);
end $$;
revoke all on function public.p2d_bxh_cau() from public, anon;
grant execute on function public.p2d_bxh_cau() to authenticated;

-- Tự kiểm
do $$
begin
  if public.p2d_cau_diem('{"linh-ngu": 3, "bac-minh-con": 1, "giay-rach": 9, "x": "a"}'::jsonb) <> 3 * 1 + 1000 then raise exception 'tự kiểm: điểm câu'; end if;
  if public.p2d_cau_tong('{"linh-ngu": 3, "giay-rach": 2, "y": -4}'::jsonb) <> 5 then raise exception 'tự kiểm: tổng câu'; end if;
  if not exists (select 1 from pg_trigger where tgname = 'p2d_giu_cau' and tgrelid = 'public.p2d_nhan_vat'::regclass) then raise exception 'tự kiểm: thiếu trigger'; end if;
  if has_function_privilege('anon', 'public.p2d_bxh_cau()', 'execute') then raise exception 'tự kiểm: khách gọi được'; end if;
end $$;
