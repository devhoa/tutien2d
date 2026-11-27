-- Bộ hãm linh khí tính đúng linh khí THẬT của từng tầng (chủ dự án 26/11/2026 01:24 "Ok, làm hết", mục 2 báo cáo ngày).
-- Lỗ hổng: p2d_kiem_linh_khi đo mức tăng bằng p2d_tong_lk (công thức gốc 40 × 1,3^n), trong khi máy khách cần gấp need_mul lần
-- (Trúc Cơ × 17,4, Kim Đan × 26,6, Nguyên Anh × 78,3…; Luyện Khí có bảng riêng 40 → 10 240). Bản lưu nhảy tầng nên chỉ bị tính
-- theo giá gốc: bơm đủ linh khí để nhảy tầng thì thùng hạn mức gần như không vơi. 25/11 một tài khoản mới lên Nguyên Anh 5
-- sau 7 giờ với 958 quái (4 lần bị bắt chỉ ở lúc linh khí còn nằm trong tầng).
-- Sửa: thêm ba hàm tính theo linh khí thật (đúng src/game/stats.js qiNeed, data/realms.json need_layer / need_mul) và CHỈ
-- p2d_kiem_linh_khi dùng chúng để đo mức tăng và để trả về mức với tới. Tốc nạp thùng, trần thùng, ngưỡng ghi nghi vấn giữ
-- nguyên (vẫn theo công thức gốc), các hàm khác dùng p2d_tong_lk / p2d_lk_can không đổi.
-- ĐỔI data/realms.json need_mul / need_layer / qi_* thì phải sửa p2d_lk_can_that cho khớp (tools/check.mjs soát).
-- ĐÃ ÁP 26/11/2026 01:27 (bản áp trên máy chủ rút gọn phần ghi chú đầu tệp, câu lệnh y nguyên). Chạy thử trước trong giao dịch huỷ ngược:
-- nhảy thẳng Nguyên Anh và nhảy một tầng bằng lỗ hổng cũ đều bị giữ lại; lên tầng thật, mất linh khí, nhận quà linh khí (qi_thuong) vẫn qua.
create or replace function public.p2d_lk_can_that(p_n integer)
 returns numeric language sql immutable set search_path to ''
as $f$
  select case
    when p_n < 9 then (40 * power(2::numeric, greatest(p_n, 0)))::numeric
    else round(40 * power(1.3::numeric, least(p_n, 27)) * power(1.03::numeric, greatest(0, p_n - 27))
               * (array[1, 17.4, 26.6, 78.3, 220.5, 338.1, 518.1, 794.1, 1245]::numeric[])[least(p_n / 9, 8) + 1])
  end
$f$;

create or replace function public.p2d_tong_lk_that(p_r integer, p_l integer, p_q numeric)
 returns numeric language plpgsql immutable set search_path to ''
as $f$
declare n integer := greatest(0, p_r) * 9 + greatest(1, p_l) - 1; s numeric := 0; i integer;
begin
  for i in 0 .. n - 1 loop s := s + public.p2d_lk_can_that(i); end loop;
  return s + greatest(coalesce(p_q, 0), 0);
end;
$f$;

create or replace function public.p2d_lk_tien_that(p_r integer, p_l integer, p_q numeric, p_them numeric, p_r2 integer, p_l2 integer)
 returns jsonb language plpgsql immutable set search_path to ''
as $f$
declare
  n  integer := greatest(0, p_r) * 9 + greatest(1, p_l) - 1;
  n2 integer := greatest(0, p_r2) * 9 + greatest(1, p_l2) - 1;
  q  numeric := greatest(coalesce(p_q, 0), 0) + greatest(coalesce(p_them, 0), 0);
  c  numeric;
begin
  loop
    c := public.p2d_lk_can_that(n);
    exit when n >= n2 or q < c;
    q := q - c; n := n + 1;
  end loop;
  return jsonb_build_object('realm', n / 9, 'layer', n % 9 + 1, 'qi', floor(least(q, c)));
end;
$f$;

revoke all on function public.p2d_lk_can_that(integer), public.p2d_tong_lk_that(integer, integer, numeric),
  public.p2d_lk_tien_that(integer, integer, numeric, numeric, integer, integer) from public, anon, authenticated;

-- Thay đúng hai chỗ trong định nghĩa đang chạy của p2d_kiem_linh_khi (tự kiểm mỗi đoạn cũ có đúng một lần)
do $m$
declare
  d text := pg_get_functiondef('public.p2d_kiem_linh_khi()'::regprocedure);
  a0 text := $a$  v_tang := public.p2d_tong_lk((new.data ->> 'realm')::integer, (new.data ->> 'layer')::integer, (new.data ->> 'qi')::numeric)
          - public.p2d_tong_lk(v_r, v_l, (old.data ->> 'qi')::numeric);$a$;
  a1 text := $a$  v_tang := public.p2d_tong_lk_that((new.data ->> 'realm')::integer, (new.data ->> 'layer')::integer, (new.data ->> 'qi')::numeric)
          - public.p2d_tong_lk_that(v_r, v_l, (old.data ->> 'qi')::numeric);   -- 20261126020000: linh khí thật (need_mul), nhảy tầng không còn rẻ$a$;
  b0 text := $b$  v_den := public.p2d_lk_tien(v_r, v_l, (old.data ->> 'qi')::numeric, v_xo, (new.data ->> 'realm')::integer, (new.data ->> 'layer')::integer);$b$;
  b1 text := $b$  v_den := public.p2d_lk_tien_that(v_r, v_l, (old.data ->> 'qi')::numeric, v_xo, (new.data ->> 'realm')::integer, (new.data ->> 'layer')::integer);$b$;
begin
  if position('p2d_tong_lk_that' in d) > 0 then raise notice 'da_sua'; return; end if;
  if (length(d) - length(replace(d, a0, ''))) / length(a0) <> 1 or (length(d) - length(replace(d, b0, ''))) / length(b0) <> 1 then
    raise exception 'khong_thay_doan_cu';
  end if;
  execute replace(replace(d, a0, a1), b0, b1);
end $m$;

-- Tự kiểm: khớp máy khách ở vài mốc (Luyện Khí 1, 9; Trúc Cơ 1; Kim Đan 5; Nguyên Anh 1, 5)
do $k$
begin
  if public.p2d_lk_can_that(0) <> 40 or public.p2d_lk_can_that(8) <> 10240 then raise exception 'kt: luyen khi'; end if;
  if abs(public.p2d_lk_can_that(9) - round(40 * power(1.3, 9) * 17.4)) > 1 then raise exception 'kt: truc co'; end if;
  if abs(public.p2d_lk_can_that(22) - 341798) > 400 then raise exception 'kt: kim dan 5 = %', public.p2d_lk_can_that(22); end if;
  if public.p2d_lk_can_that(27) < 3000000 or public.p2d_lk_can_that(31) < public.p2d_lk_can_that(27) then raise exception 'kt: nguyen anh'; end if;
  if public.p2d_tong_lk_that(3, 5, 0) - public.p2d_tong_lk_that(2, 5, 0) < 15000000 then raise exception 'kt: kim dan 5 -> nguyen anh 5'; end if;
end $k$;
