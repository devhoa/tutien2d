-- Bộ hãm linh khí lấy số từ data/ thay hằng số đặt tay; giữ mốc quà tu vi (chủ dự án 26/11/2026 23:4x "Vá + hạ tài khoản đó",
-- "Sửa cả máy khách và máy chủ"; 27/11/2026 00:16 "xem căn nguyên vấn đề ở đâu, sau đó sửa tận gốc").
--
-- 1) Gốc: bộ hãm linh khí làm ngày 28/10 (20261028070000_p2d_han_muc_linh_khi) để "rộng tay": thùng tối thiểu 500 000, hồi 60–90 × 1,6^cảnh giới
--    mỗi giây, tài khoản mới chưa có thùng thì coi là đầy; lần lưu đầu nhận 500 000 + 90/giây tuổi. Hồi đó tầng thấp cần vài chục linh khí nên
--    con số không đáng kể. Từ đó thang linh khí đổi nhiều lần (need_mul, linh khí thật từng tầng 26/11) mà hai hằng số không ai đo lại:
--    500 000 nay bằng cả Luyện Khí + Trúc Cơ (Kim Đan tầng 2 cần ~530 000 linh khí thật), nên bản game tự sửa lên thẳng Kim Đan ở lần lưu thứ hai.
--    Sửa: số của bộ hãm nằm ở data/realms.json → lk_may_chu, máy chủ đọc bảng p2d_ky_cfg dòng 'lk' (tools/ky-cfg.mjs lk dựng, tools/check.mjs so),
--    đổi thang tu luyện thì đổi số cùng chỗ. Thùng = tran_x lần linh khí thật của tầng đang ở, kẹp tran_min–tran_max (từ Trúc Cơ tầng 9 trở lên
--    vẫn 500 000 như cũ); lần lưu đầu dau + toc[0]/giây tuổi; hồi theo bảng toc từng cảnh giới (Luyện Khí 40/giây, trước 90; cảnh giới sau giữ y cũ).
--    Cờ linh_khi chỉ ghi khi vượt thùng quá max(linh khí gốc một tầng, co_min): uống đan, ăn món một lúc ở tầng thấp không bị ghi cờ oan.
-- 2) #370: ma tu bị diệt tụt tầng, máy khách cũ đặt lại giftAt thấp hơn nên lên lại tầng đó nhận quà tu vi lần nữa (p2d_mien_tran cho
--    Linh Thạch theo giftAt tăng). Nay trong cùng mùa giftAt không bao giờ giảm. Đổi mùa (data.mua tăng) và máy chủ tự ghi (p2d.lk_tru) thì cho giảm.
-- Thay đúng từng đoạn trong định nghĩa đang chạy; đoạn cũ phải có đúng một lần, không thì dừng (không đè lên bản tab khác vừa đổi).

insert into public.p2d_ky_cfg (k, v) values ('lk', '{"toc":[40,144,230,368,590,590,590,590,590],"tran_x":8,"tran_min":60000,"tran_max":500000,"dau":60000,"co_min":60000}'::jsonb)
on conflict (k) do update set v = excluded.v;

create or replace function public.p2d_lk_so(p_k text) returns numeric language sql stable security definer set search_path to '' as $$
  select (v ->> p_k)::numeric from public.p2d_ky_cfg where k = 'lk'
$$;
create or replace function public.p2d_lk_toc(p_r integer) returns numeric language sql stable security definer set search_path to '' as $$
  select (v -> 'toc' ->> least(greatest(coalesce(p_r, 0), 0), jsonb_array_length(v -> 'toc') - 1))::numeric from public.p2d_ky_cfg where k = 'lk'
$$;
revoke all on function public.p2d_lk_so(text), public.p2d_lk_toc(integer) from public, anon, authenticated;

do $$
declare
  d text; c text; n int;
begin
  -- p2d_kiem_linh_khi
  d := pg_get_functiondef('public.p2d_kiem_linh_khi()'::regprocedure);
  foreach c in array array[
    'v_toc   numeric := greatest(90 * power(1.6, least(greatest(v_r, 0), 4)), v_can / 150);',
    'v_tran  numeric := greatest(500000, v_can * 8);',
    'if v_tang - v_xo > v_can then'] loop
    n := (length(d) - length(replace(d, c, ''))) / length(c);
    if n <> 1 then raise exception 'p2d_kiem_linh_khi: đoạn "%" có % lần, cần 1', left(c, 40), n; end if;
  end loop;
  d := replace(d, 'v_toc   numeric := greatest(90 * power(1.6, least(greatest(v_r, 0), 4)), v_can / 150);',
    'v_toc   numeric := greatest(public.p2d_lk_toc(v_r), v_can / 150);   -- 20261126090000: số ở data/realms.json → lk_may_chu');
  d := replace(d, 'v_tran  numeric := greatest(500000, v_can * 8);',
    'v_tran  numeric := greatest(public.p2d_lk_so(''tran_min''), least(public.p2d_lk_so(''tran_max''), public.p2d_lk_can_that(greatest(v_r, 0) * 9 + greatest(v_l, 1) - 1) * public.p2d_lk_so(''tran_x'')), v_can * 8);');
  d := replace(d, 'if v_tang - v_xo > v_can then', 'if v_tang - v_xo > greatest(v_can, public.p2d_lk_so(''co_min'')) then');
  execute d;

  -- p2d_lk_dau (lần lưu đầu)
  d := pg_get_functiondef('public.p2d_lk_dau()'::regprocedure);
  foreach c in array array['v_cho := 500000 + 90 *', 'new.qi_xo := least(500000, v_cho - v_tong);'] loop
    n := (length(d) - length(replace(d, c, ''))) / length(c);
    if n <> 1 then raise exception 'p2d_lk_dau: đoạn "%" có % lần, cần 1', left(c, 40), n; end if;
  end loop;
  d := replace(d, 'v_cho := 500000 + 90 *', 'v_cho := public.p2d_lk_so(''dau'') + public.p2d_lk_toc(0) *');
  d := replace(d, 'new.qi_xo := least(500000, v_cho - v_tong);', 'new.qi_xo := least(public.p2d_lk_so(''dau''), v_cho - v_tong);');
  execute d;
end $$;

-- 2) Giữ mốc quà tu vi
create or replace function public.p2d_giu_gift()
returns trigger language plpgsql security definer set search_path to '' as $$
declare
  v_cu numeric := public.p2d_ky_so(old.data -> 'giftAt');
  v_moi numeric := public.p2d_ky_so(new.data -> 'giftAt');
begin
  if current_setting('p2d.lk_tru', true) = '1' then return new; end if;
  if coalesce(public.p2d_ky_so(new.data -> 'mua'), 0) > coalesce(public.p2d_ky_so(old.data -> 'mua'), 0) then return new; end if;
  if v_cu is not null and (v_moi is null or v_moi < v_cu) then
    new.data := jsonb_set(new.data, '{giftAt}', to_jsonb(v_cu::int));
  end if;
  return new;
end $$;
revoke all on function public.p2d_giu_gift() from public, anon, authenticated;

drop trigger if exists p2d_giu_gift on public.p2d_nhan_vat;
create trigger p2d_giu_gift before update of data on public.p2d_nhan_vat for each row execute function public.p2d_giu_gift();

-- Tự kiểm
do $$
declare d text := pg_get_functiondef('public.p2d_kiem_linh_khi()'::regprocedure); e text := pg_get_functiondef('public.p2d_lk_dau()'::regprocedure);
begin
  if position('p2d_lk_toc(v_r)' in d) = 0 or position('tran_min' in d) = 0 or position('co_min' in d) = 0 then raise exception 'tự kiểm: p2d_kiem_linh_khi chưa đổi'; end if;
  if position('p2d_lk_so(''dau'')' in e) = 0 then raise exception 'tự kiểm: p2d_lk_dau chưa đổi'; end if;
  if public.p2d_lk_toc(0) <> 40 or public.p2d_lk_toc(20) <> 590 or public.p2d_lk_so('tran_min') <> 60000 then raise exception 'tự kiểm: bảng lk sai'; end if;
  if not exists (select 1 from pg_trigger where tgname = 'p2d_giu_gift' and tgrelid = 'public.p2d_nhan_vat'::regclass) then raise exception 'tự kiểm: thiếu trigger'; end if;
end $$;
