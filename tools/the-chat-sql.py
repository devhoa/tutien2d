#!/usr/bin/env python3
# Sinh migration Thể chất phía máy chủ (chủ dự án 25/11/2026 12:53–12:55; docs/20-THE-CHAT.md) từ data/the-chat.json. Không sửa tay tệp sinh ra.
# Chạy ở gốc kho: python3 tools/the-chat-sql.py > supabase/migrations/20261125060000_p2d_the_chat.sql
# Đổi tỉ lệ phẩm, thêm / bớt thể chất, đổi cảnh giới mở: chạy lại thành migration MỚI (đổi tên tệp, giữ bản đã áp); tools/check.mjs so dòng 'tc'
# của migration mới nhất với data (tools/ky-cfg.mjs tc).
import json

C = json.load(open('data/the-chat.json', encoding='utf-8'))
cfg = {'mo': C['mo'], 'pham': [p['w'] for p in C['pham']], 'the': {k: t['pham'] for k, t in C['the'].items()}}
cfg_sql = json.dumps(cfg, ensure_ascii=False, separators=(',', ':')).replace("'", "''")
n_the, n_pham = len(cfg['the']), len(cfg['pham'])

print(f"""-- Thể chất phía máy chủ (chủ dự án 25/11/2026 12:53–12:55: "Kết đan mới thức tỉnh thể phách", một đời một lượt). SINH BẰNG tools/the-chat-sql.py.
-- 1) Bảng p2d_ky_cfg dòng 'tc' (cảnh giới mở, tỉ lệ từng phẩm, mã thể chất → phẩm; dựng từ data/the-chat.json, tools/check.mjs so).
-- 2) Bảng p2d_the_chat: một dòng mỗi người, không ai sửa được từ máy khách. Hàm p2d_quay_the_chat() cho máy khách gọi lúc làm lễ
--    (src/net/the-chat.js): phải đạt cảnh giới mở (cảnh giới cao nhất từng đạt), một đời một lượt: đã có dòng thì trả lại đúng dòng đó.
-- 3) Trigger p2d_kiem_the_chat khi lưu: data.theChat luôn theo p2d_the_chat. Chưa có dòng: đủ cảnh giới thì máy chủ quay luôn (bản lưu chơi
--    khách đem lên), chưa đủ thì bỏ khoá. Khác thì đè và trả về máy khách (p2d.sua → the). Gửi mã khác mã máy chủ đang giữ, hoặc gửi mã khi chưa
--    đủ cảnh giới: nghi vấn 'the_chat' (tối đa một dòng mỗi 10 phút). Chỉ số của thể chất lấy từ data theo mã nên bản lưu không mang số nào.
-- 4) Hồ sơ người chơi (p2d_xem_nguoi) trả thêm theChat để chỉ số trong Hồ sơ đúng như bảng Nhân vật của họ. Thay đúng một đoạn trong định nghĩa đang chạy.
-- Không đụng bản lưu của ai. Huyết mạch đổi sang thức tỉnh ở Trúc Cơ chỉ đổi máy khách (ai đã có giữ nguyên), không đổi gì ở đây.

insert into public.p2d_ky_cfg (k, v) values ('tc', '{cfg_sql}'::jsonb)
on conflict (k) do update set v = excluded.v;

create table if not exists public.p2d_the_chat (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ma      text not null,
  luc     timestamptz not null default now()
);
alter table public.p2d_the_chat enable row level security;
revoke all on table public.p2d_the_chat from anon, authenticated;
grant select on table public.p2d_the_chat to authenticated;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'p2d_the_chat' and policyname = 'p2d_the_chat_doc') then
    create policy p2d_the_chat_doc on public.p2d_the_chat for select to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;

-- Quay một lượt theo dòng cấu hình 'tc' (giống src/game/the-chat.js quayThe): phẩm theo tỉ lệ, rồi một thể chất của phẩm đó (đều nhau, xếp theo mã)
create or replace function public.p2d_tc_quay(p_c jsonb)
returns text language plpgsql volatile set search_path = ''
as $$
declare v_w numeric; v_r numeric; v_ph integer := 0; v_i integer; v_n integer; v_ma text;
begin
  select sum((x #>> '{{}}')::numeric) into v_w from jsonb_array_elements(p_c -> 'pham') x;
  v_r := random()::numeric * v_w;
  for v_i in 0 .. jsonb_array_length(p_c -> 'pham') - 1 loop
    v_ph := v_i; v_r := v_r - (p_c -> 'pham' ->> v_i)::numeric;
    exit when v_r < 0;
  end loop;
  select count(*) into v_n from jsonb_each(p_c -> 'the') e where (e.value #>> '{{}}')::integer = v_ph;
  select e.key into v_ma from jsonb_each(p_c -> 'the') e where (e.value #>> '{{}}')::integer = v_ph
    order by e.key offset least(floor(random() * v_n)::integer, v_n - 1) limit 1;
  return v_ma;
end;
$$;
revoke all on function public.p2d_tc_quay(jsonb) from public, anon, authenticated;

create or replace function public.p2d_quay_the_chat()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := (select auth.uid()); v_c jsonb := (select v from public.p2d_ky_cfg where k = 'tc'); v_ma text; v_max integer;
begin
  if v_uid is null then raise exception 'chua_dang_nhap' using errcode = '28000'; end if;
  if v_c is null then raise exception 'chua_mo' using errcode = 'P0001'; end if;
  select t.ma into v_ma from public.p2d_the_chat t where t.user_id = v_uid;
  if not found then
    select greatest(coalesce(n.canh_max, 0), coalesce(n.canh_gioi, 0)) into v_max from public.p2d_nhan_vat n where n.user_id = v_uid;
    if v_max is null then raise exception 'chua_luu' using errcode = '22023'; end if;
    if v_max < (v_c ->> 'mo')::integer then raise exception 'chua_du_canh_gioi' using errcode = '22023'; end if;
    insert into public.p2d_the_chat (user_id, ma) values (v_uid, public.p2d_tc_quay(v_c)) on conflict (user_id) do nothing;
    select t.ma into v_ma from public.p2d_the_chat t where t.user_id = v_uid;
  end if;
  return jsonb_build_object('ma', v_ma);
end;
$$;
revoke all on function public.p2d_quay_the_chat() from public, anon;
grant execute on function public.p2d_quay_the_chat() to authenticated;

create or replace function public.p2d_kiem_the_chat()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_c jsonb; v_gui jsonb := new.data -> 'theChat'; v_ma text; v_max integer; v_moi boolean := false; v_dung jsonb;
begin
  if tg_op = 'UPDATE' and v_gui is not distinct from (old.data -> 'theChat') then return new; end if;   -- không đổi: khỏi tra bảng
  if tg_op = 'INSERT' and v_gui is null then return new; end if;
  v_c := (select v from public.p2d_ky_cfg where k = 'tc');
  if v_c is null then return new; end if;
  select t.ma into v_ma from public.p2d_the_chat t where t.user_id = new.user_id;
  if not found and v_gui is not null then
    v_max := greatest(case when tg_op = 'UPDATE' then greatest(coalesce(old.canh_max, 0), coalesce(old.canh_gioi, 0)) else 0 end,
      case when jsonb_typeof(new.data -> 'realm') = 'number' then least(greatest(floor((new.data ->> 'realm')::numeric), 0), 8)::integer else coalesce(new.canh_gioi, 0) end);
    if v_max >= (v_c ->> 'mo')::integer then   -- máy khách tự quay (bản lưu chơi khách đem lên): máy chủ quyết
      insert into public.p2d_the_chat (user_id, ma) values (new.user_id, public.p2d_tc_quay(v_c)) on conflict (user_id) do nothing;
      select t.ma into v_ma from public.p2d_the_chat t where t.user_id = new.user_id;
      v_moi := true;
    end if;
  end if;
  v_dung := case when v_ma is null then null else to_jsonb(v_ma) end;
  if v_dung is distinct from v_gui then
    new.data := case when v_dung is null then new.data - 'theChat' else jsonb_set(new.data, '{{theChat}}', v_dung) end;
    perform set_config('p2d.sua', (coalesce(nullif(current_setting('p2d.sua', true), '')::jsonb, '{{}}'::jsonb) || jsonb_build_object('the', coalesce(v_dung, 'null'::jsonb)))::text, true);
    if v_gui is not null and not v_moi
       and not exists (select 1 from public.p2d_nghi_van x where x.user_id = new.user_id and x.ly_do = 'the_chat' and x.luc > now() - interval '10 minutes') then
      new.nghi_van := coalesce(new.nghi_van, 0) + 1;
      insert into public.p2d_nghi_van (user_id, ly_do, chi_tiet) values (new.user_id, 'the_chat', jsonb_build_object('gui', v_gui, 'may_chu', v_ma));
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.p2d_kiem_the_chat() from public, anon, authenticated;
create or replace trigger p2d_kiem_the_chat before insert or update on public.p2d_nhan_vat
  for each row execute function public.p2d_kiem_the_chat();

-- Hồ sơ người chơi: trả thêm theChat (mã thể chất). Thay đúng một đoạn trong định nghĩa đang chạy của p2d_xem_nguoi.
do $$
declare v_def text; v_cu text; v_moi text; v_n integer;
begin
  v_def := pg_get_functiondef('public.p2d_xem_nguoi(text)'::regprocedure);
  if position('''theChat''' in v_def) = 0 then
    v_cu := '''tiem'', case when v_tiem -> ''toc'' is not null then';
    v_moi := '''theChat'', case when jsonb_typeof(d -> ''theChat'') = ''string'' then d -> ''theChat'' end,' || E'\\n      ' || v_cu;
    v_n := (length(v_def) - length(replace(v_def, v_cu, ''))) / length(v_cu);
    if v_n <> 1 then raise exception 'p2d_xem_nguoi: đoạn cũ xuất hiện % lần (cần đúng 1), không áp', v_n; end if;
    execute replace(v_def, v_cu, v_moi);
  end if;
end $$;

-- Tự kiểm tra (lỗi là cả migration lùi lại)
do $$
declare v_c jsonb := (select v from public.p2d_ky_cfg where k = 'tc'); v_i integer; v_ma text; v_dem jsonb := '{{}}'; v_ph text; v_tien integer; v_pham0 integer;
begin
  if (select count(*) from jsonb_each(v_c -> 'the')) <> {n_the} or jsonb_array_length(v_c -> 'pham') <> {n_pham} then raise exception 'kiem: cau hinh tc sai'; end if;
  for v_i in 1..3000 loop
    v_ma := public.p2d_tc_quay(v_c);
    if v_ma is null or not (v_c -> 'the' ? v_ma) then raise exception 'kiem: quay ra ma la %', v_ma; end if;
    v_ph := v_c -> 'the' ->> v_ma;
    v_dem := jsonb_set(v_dem, array[v_ph], to_jsonb(coalesce((v_dem ->> v_ph)::integer, 0) + 1));
  end loop;
  v_pham0 := coalesce((v_dem ->> '0')::integer, 0); v_tien := coalesce((v_dem ->> '{n_pham - 1}')::integer, 0);
  if v_pham0 < 900 or v_pham0 > 1500 or v_tien > 150 then raise exception 'kiem: ti le quay lech: %', v_dem; end if;
  if has_function_privilege('anon', 'public.p2d_quay_the_chat()', 'execute') or not has_function_privilege('authenticated', 'public.p2d_quay_the_chat()', 'execute')
     or has_table_privilege('authenticated', 'public.p2d_the_chat', 'insert') or has_table_privilege('anon', 'public.p2d_the_chat', 'select') then raise exception 'kiem: quyen sai'; end if;
  if position('''theChat''' in pg_get_functiondef('public.p2d_xem_nguoi(text)'::regprocedure)) = 0 then raise exception 'kiem: p2d_xem_nguoi chua co theChat'; end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'public.p2d_nhan_vat'::regclass and tgname = 'p2d_kiem_the_chat' and tgenabled = 'O') then raise exception 'kiem: thieu trigger'; end if;
end $$;""")
