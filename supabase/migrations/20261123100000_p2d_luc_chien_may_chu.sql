-- Máy chủ tự tính Lực chiến (chủ dự án 23/11/2026 19:58 "làm sao để máy chủ có thể kiểm soát tốt việc này", bảng chọn "Hàm Supabase",
-- "Dùng số máy chủ + ghi"). Trước đây cột luc_chien là số máy người chơi tự tính rồi gửi kèm bản lưu (data.power): bảng xếp hạng, Hồ sơ,
-- điều kiện Khai Hoang đều tin theo số đó.
-- Từ nay hàm Edge luc-chien (supabase/functions/luc-chien, pg_cron gọi 5 phút một lần) lấy các bản lưu đổi từ lần tính trước, tính lại
-- bằng đúng code của game, ghi vào p2d_lc (số máy chủ mc, số máy người chơi báo khach). Lệch nhiều là chỗ để soát, KHÔNG tự khoá ai.
-- Công tắc p2d_lc_cai.dung (mặc định TẮT): bật thì cột luc_chien (bảng xếp hạng, Hồ sơ, Khai Hoang, Đấu tuần) lấy số máy chủ; tắt là về
-- như cũ ngay. Đo trước, thấy số máy chủ khớp với người chơi bình thường rồi mới bật.
-- Khoá gọi hàm: vault p2d_lc_khoa, sinh ngẫu nhiên ngay trong cơ sở dữ liệu lúc áp (không nằm trong kho, không đi qua đâu); pg_cron đọc
-- vault gửi kèm, hàm hỏi lại p2d_lc_khoa_dung.

create table if not exists public.p2d_lc (
  user_id uuid primary key,
  mc bigint,                 -- Lực chiến máy chủ tính (null: chưa tính được)
  khach bigint,              -- số máy người chơi báo trong bản lưu đó (data.power)
  luu timestamptz not null,  -- luu_luc của bản lưu đã tính
  luc timestamptz not null default now(),
  ban text,                  -- mã bản code đã gói (game.js BAN)
  loi text                   -- lỗi khi tính (bản lưu hỏng…); số mc cũ giữ nguyên
);
alter table public.p2d_lc enable row level security;
revoke all on public.p2d_lc from anon, authenticated;
create index if not exists p2d_lc_luc on public.p2d_lc (luc);

create table if not exists public.p2d_lc_cai (
  id int primary key default 1 check (id = 1),
  dung boolean not null default false   -- true: cột luc_chien lấy số máy chủ
);
insert into public.p2d_lc_cai (id, dung) values (1, false) on conflict (id) do nothing;
alter table public.p2d_lc_cai enable row level security;
revoke all on public.p2d_lc_cai from anon, authenticated;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'p2d_lc_khoa') then
    perform vault.create_secret(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 'p2d_lc_khoa', 'khoá pg_cron gọi hàm Edge luc-chien');
  end if;
end $$;

-- Hàm Edge hỏi khoá người gọi có đúng không (chỉ service_role)
create or replace function public.p2d_lc_khoa_dung(p text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(length(p) >= 32 and exists (select 1 from vault.decrypted_secrets s where s.name = 'p2d_lc_khoa' and s.decrypted_secret = p), false);
$$;

-- Việc cho hàm: bản lưu trong 30 ngày đổi từ lần tính trước, mới nhất trước. Túi chỉ giữ món đang mặc (đỡ nặng); Tiềm năng lấy cảnh giới
-- cao nhất từ cột canh_max như lúc tải bản lưu của chính người chơi.
create or replace function public.p2d_lc_viec(p_n integer default 100)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select jsonb_build_object(
      'u', n.user_id, 'l', n.luu_luc,
      'k', case when jsonb_typeof(n.data -> 'power') = 'number' then floor((n.data ->> 'power')::numeric)::bigint end,
      'd', (case when jsonb_typeof(n.data -> 'tiem') = 'object'
                 then jsonb_set(n.data, '{tiem,max}', to_jsonb(greatest(case when jsonb_typeof(n.data -> 'tiem' -> 'max') = 'number' then (n.data -> 'tiem' ->> 'max')::numeric else 0 end, coalesce(n.canh_max, 0))))
                 else n.data end) - 'bag'
           || jsonb_build_object('bag', (select coalesce(jsonb_agg(it), '[]'::jsonb)
                from jsonb_array_elements(case when jsonb_typeof(n.data -> 'bag') = 'array' then n.data -> 'bag' else '[]'::jsonb end) it
                where exists (select 1 from jsonb_each(case when jsonb_typeof(n.data -> 'equip') = 'object' then n.data -> 'equip' else '{}'::jsonb end) e where e.value = it -> 'uid')))
    ) x
    from public.p2d_nhan_vat n left join public.p2d_lc l on l.user_id = n.user_id
    where n.luu_luc > now() - interval '30 days' and (l.luu is null or n.luu_luc > l.luu)
    order by n.luu_luc desc
    limit greatest(1, least(coalesce(p_n, 100), 300))   -- mỗi bản lưu ~15 KB: 100 bản ~1,5 MB mỗi lần gọi
  ) q;
$$;

-- Hàm ghi kết quả: mỗi phần tử { u, mc, k, l, loi? }. Lỗi thì giữ số mc cũ. Công tắc bật thì đặt luôn cột luc_chien = mc.
create or replace function public.p2d_lc_ghi(p jsonb, p_ban text default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  x jsonb; v_n int := 0; v_dung boolean := coalesce((select c.dung from public.p2d_lc_cai c where c.id = 1), false);
  v_mc bigint; v_u uuid;
begin
  if jsonb_typeof(p) is distinct from 'array' then raise exception 'du_lieu_sai' using errcode = '22023'; end if;
  for x in select e from jsonb_array_elements(p) e limit 1000 loop
    v_u := (x ->> 'u')::uuid;
    v_mc := case when x ->> 'loi' is null and jsonb_typeof(x -> 'mc') = 'number' then least(greatest(floor((x ->> 'mc')::numeric), 0), 2147483647)::bigint end;
    insert into public.p2d_lc as l (user_id, mc, khach, luu, luc, ban, loi)
    values (v_u, v_mc, case when jsonb_typeof(x -> 'k') = 'number' then floor((x ->> 'k')::numeric)::bigint end,
            coalesce((x ->> 'l')::timestamptz, now()), now(), left(p_ban, 40), left(x ->> 'loi', 200))
    on conflict (user_id) do update set mc = coalesce(excluded.mc, l.mc), khach = excluded.khach, luu = excluded.luu, luc = excluded.luc,
      ban = excluded.ban, loi = excluded.loi;
    if v_dung and v_mc is not null then
      update public.p2d_nhan_vat set luc_chien = v_mc::integer where user_id = v_u and luc_chien is distinct from v_mc::integer;
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- Công tắc bật: mỗi lần lưu (p2d_luu ghi luc_chien = số máy người chơi) thì giữ số máy chủ đã tính (chậm tối đa một nhịp 5 phút).
create or replace function public.p2d_lc_dung()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if coalesce((select c.dung from public.p2d_lc_cai c where c.id = 1), false) then
    new.luc_chien := coalesce((select least(l.mc, 2147483647)::integer from public.p2d_lc l where l.user_id = new.user_id and l.mc is not null), new.luc_chien);
  end if;
  return new;
end $$;
drop trigger if exists p2d_lc_dung on public.p2d_nhan_vat;
create trigger p2d_lc_dung before insert or update of luc_chien on public.p2d_nhan_vat for each row execute function public.p2d_lc_dung();

revoke all on function public.p2d_lc_viec(integer) from public, anon, authenticated;
revoke all on function public.p2d_lc_ghi(jsonb, text) from public, anon, authenticated;
revoke all on function public.p2d_lc_dung() from public, anon, authenticated;
revoke all on function public.p2d_lc_khoa_dung(text) from public, anon, authenticated;
grant execute on function public.p2d_lc_khoa_dung(text) to service_role;
grant execute on function public.p2d_lc_viec(integer) to service_role;
grant execute on function public.p2d_lc_ghi(jsonb, text) to service_role;

-- 5 phút một lần gọi hàm Edge luc-chien, khoá lấy từ vault (chưa có khoá thì hàm trả 401, không làm gì)
select cron.unschedule(jobid) from cron.job where jobname = 'p2d-luc-chien';
select cron.schedule('p2d-luc-chien', '*/5 * * * *', $c$
  select net.http_post(
    url := 'https://kceewiahsidixwixalir.supabase.co/functions/v1/luc-chien',
    headers := jsonb_build_object('content-type', 'application/json', 'x-khoa', (select s.decrypted_secret from vault.decrypted_secrets s where s.name = 'p2d_lc_khoa')),
    body := '{}'::jsonb, timeout_milliseconds := 60000)
$c$);

-- Tự kiểm
do $$
begin
  if has_function_privilege('anon', 'public.p2d_lc_viec(integer)', 'execute') or has_function_privilege('authenticated', 'public.p2d_lc_viec(integer)', 'execute')
     or has_function_privilege('anon', 'public.p2d_lc_ghi(jsonb, text)', 'execute') or has_function_privilege('authenticated', 'public.p2d_lc_ghi(jsonb, text)', 'execute')
     or has_function_privilege('anon', 'public.p2d_lc_khoa_dung(text)', 'execute') or has_function_privilege('authenticated', 'public.p2d_lc_khoa_dung(text)', 'execute') then
    raise exception 'p2d_lc_viec / p2d_lc_ghi chi cho service_role';
  end if;
  if (select dung from public.p2d_lc_cai where id = 1) then raise exception 'cong tac phai tat luc moi ap'; end if;
  if not exists (select 1 from cron.job where jobname = 'p2d-luc-chien') then raise exception 'thieu viec cron p2d-luc-chien'; end if;
  if not exists (select 1 from vault.secrets where name = 'p2d_lc_khoa') then raise exception 'thieu khoa p2d_lc_khoa'; end if;
end $$;
