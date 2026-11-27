-- Hai chỗ còn hở sau khi bộ hãm linh khí tính đúng linh khí thật (migration p2d_linh_khi_that cùng ngày 26/11/2026, tab khác áp 01:27).
-- Chủ dự án 26/11/2026 01:2x: "tìm ra nguyên nhân và cách khắc phục để fix lỗi này trước để không ai làm được"; chọn "Chạy thử, áp, đẩy, gộp".
--
-- Gốc (soát một tài khoản đi từ Trúc Cơ 1 tới Nguyên Anh 5 trong chưa tới 2 giờ bằng bản game tự sửa chạy ở máy riêng): máy chủ tính
-- mỗi lần lên tầng theo công thức gốc 40 × 1,3^n, máy khách cần gấp need_mul lần, nên "nhảy tầng" rẻ hơn thật 16–78 lần. Phần đó
-- p2d_linh_khi_that đã sửa cho lần lưu thường (UPDATE). Tệp này sửa hai chỗ còn lại:
--
-- 1. Lần lưu ĐẦU của tài khoản (INSERT) không đi qua bộ hãm; p2d_luu chỉ thử theo công thức gốc (số giây cần = linh khí gốc / tốc hồi),
--    nên tài khoản 15 phút tuổi chưa từng lưu vẫn ghi được thẳng Nguyên Anh. Trigger p2d_kiem_lk_dau đòi tổng linh khí THẬT
--    (p2d_tong_lk_that) ≤ thùng đầy 500 000 + 90 mỗi giây tuổi tài khoản (tính tối đa 12 giờ), không thì 'canh_gioi_sai' như phép thử
--    cũ; và ghi luôn phần thùng còn lại (trước để trống nên lần lưu thứ hai lại được thùng đầy). Nhân vật mới bình thường (Luyện Khí
--    tầng 1, linh khí 0) không chạm tới: thùng vẫn để trống như cũ.
-- 2. p2d_co_do_xet: cờ cắm từ trong trigger của chính dòng nhân vật đang lưu (linh_khi lần thứ 5 trong 24 giờ) rồi tự cập nhật dòng đó
--    làm lệnh lưu bên ngoài hỏng với lỗi 27000, cả giao dịch lùi lại (cờ đỏ cũng mất) và lặp lại ở mọi lần lưu vượt mức sau đó: người
--    dính không lưu được nữa (tài khoản được soát có 247 lần lưu hỏng kiểu này trong 90 phút). Giờ trường hợp đó không cập nhật lại
--    dòng; trigger p2d_zz_co_do chạy cuối của chính lần lưu đó thấy cờ đỏ vừa cắm và đặt nghi_van = 10.
-- Cuối tệp tự kiểm: p2d_lk_can_that trên máy chủ phải khớp bảng linh khí thật 81 tầng của máy khách (node tools/lk-that.mjs).
-- tools/check.mjs so bảng đó với data/realms.json: đổi need_mul / need_layer ở data mà chưa sửa máy chủ là báo đỏ (lệch thì người
-- chơi thật lên tầng bị cắt).
-- Không khoá ai, không đổi bản lưu nào lúc áp. Lùi: định nghĩa cũ sao lưu ở p2d_xu_ly lúc áp (hành động sao_ham_truoc_migration).
-- Sửa tay (khôi phục, đền bù) cần ghi dòng nhân vật MỚI ở cảnh giới cao: đặt `set local p2d.lk_tru = '1'` trong giao dịch đó.

set local lock_timeout = '4s';   -- tạo trigger cần khoá bảng nhân vật một nhịp: không lấy được ngay thì thôi, không để người chơi chờ

create or replace function public.p2d_lk_dau()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_tong numeric;
  v_tao  timestamptz;
  v_cho  numeric;
begin
  if current_setting('p2d.lk_tru', true) = '1' then return new; end if;   -- máy chủ / quản trị tự ghi (khôi phục, đền bù)
  v_tong := public.p2d_tong_lk_that(coalesce((new.data ->> 'realm')::integer, new.canh_gioi, 0), coalesce((new.data ->> 'layer')::integer, new.tang, 1),
                                    (new.data ->> 'qi')::numeric);
  if v_tong <= 0 then return new; end if;   -- nhân vật mới tinh: thùng để trống như cũ (lần lưu sau coi là đầy)
  select u.created_at into v_tao from auth.users u where u.id = new.user_id;
  v_cho := 500000 + 90 * least(greatest(extract(epoch from (now() - coalesce(v_tao, now()))), 0), 43200);
  if v_tong > v_cho then raise exception 'canh_gioi_sai' using errcode = '22023'; end if;
  new.qi_xo := least(500000, v_cho - v_tong);
  new.qi_luc := now();
  return new;
end;
$function$;

revoke all on function public.p2d_lk_dau() from public, anon, authenticated;

create or replace trigger p2d_kiem_lk_dau before insert on public.p2d_nhan_vat
  for each row execute function public.p2d_lk_dau();

-- p2d_co_do_xet: thay đúng một đoạn trong định nghĩa đang chạy (đoạn cũ phải có đúng một lần, không thì báo lỗi, không đổi gì)
do $x$
declare
  v_def text := pg_get_functiondef('public.p2d_co_do_xet'::regproc);
  v_cu text := $a$      begin
        update public.p2d_nhan_vat set nghi_van = greatest(nghi_van, 10) where user_id = new.user_id and nghi_van < 10;
      exception when others then null;
      end;
$a$;
  v_moi text := $a$      -- Cờ cắm từ trong trigger của chính dòng nhân vật đang được lưu (p2d_kiem_linh_khi…): không cập nhật lại dòng đó ở đây, nếu
      -- không lệnh lưu bên ngoài hỏng với lỗi 27000 và cả lần lưu bị từ chối (20261126030000). Trigger p2d_zz_co_do chạy cuối
      -- của chính lần lưu đó thấy cờ đỏ vừa cắm và đặt nghi_van = 10.
      if pg_trigger_depth() < 2 then
        begin
          update public.p2d_nhan_vat set nghi_van = greatest(nghi_van, 10) where user_id = new.user_id and nghi_van < 10;
        exception when others then null;
        end;
      end if;
$a$;
  v_n integer;
begin
  if position('pg_trigger_depth() < 2' in v_def) > 0 then return; end if;   -- đã thay rồi (áp lại): không đổi gì
  v_n := (length(v_def) - length(replace(v_def, v_cu, ''))) / length(v_cu);
  if v_n <> 1 then raise exception 'p2d_co_do_xet: đoạn cập nhật nghi_van xuất hiện % lần (cần đúng 1), không áp', v_n; end if;
  execute replace(v_def, v_cu, v_moi);
end
$x$;

-- Tự kiểm tra
do $x$
declare
  v_bang numeric[] := array[40,80,160,320,640,1280,2560,5120,10240,7381,9595,12473,16215,21080,27404,35625,46313,60207,119653,155548,202213,262877,341740,444262,577540,750802,976043,3735014,3847065,3962477,4081351,4203791,4329905,4459802,4593596,4731404,13723792,14135506,14559571,14996358,15446249,15909636,16386925,16878533,17384889,27456534,28280230,29128637,30002496,30902571,31829648,32784538,33768074,34781116,54897070,56543982,58240301,59987510,61787136,63640750,65549972,67516471,69541965,109785703,113079275,116471653,119965802,123564776,127271720,131089871,135022567,139073245,224582011,231319472,238259056,245406827,252769032,260352103,268162666,276207546,284493773];   -- lk_that_81
  v_i integer; v_d text;
begin
  if array_length(v_bang, 1) <> 81 then raise exception 'tự kiểm: bảng linh khí thật phải đủ 81 tầng'; end if;
  for v_i in 0 .. 80 loop
    if abs(public.p2d_lk_can_that(v_i) - v_bang[v_i + 1]) > 1 then
      raise exception 'tự kiểm: tầng % máy chủ tính %, máy khách cần %', v_i, public.p2d_lk_can_that(v_i), v_bang[v_i + 1];
    end if;
  end loop;
  if abs(public.p2d_tong_lk_that(1, 5, 100) - 66204) > 9 or abs(public.p2d_tong_lk_that(3, 1, 0) - 4087411) > 27 then
    raise exception 'tự kiểm: p2d_tong_lk_that sai';
  end if;
  v_d := pg_get_functiondef('public.p2d_kiem_linh_khi'::regproc);
  if position('public.p2d_tong_lk_that(' in v_d) = 0 or position('public.p2d_lk_tien_that(' in v_d) = 0 then
    raise exception 'tự kiểm: p2d_kiem_linh_khi chưa tính linh khí thật (thiếu migration p2d_linh_khi_that)';
  end if;
  if position('pg_trigger_depth() < 2' in pg_get_functiondef('public.p2d_co_do_xet'::regproc)) = 0 then
    raise exception 'tự kiểm: p2d_co_do_xet chưa đổi';
  end if;
  if not exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid where c.relname = 'p2d_nhan_vat' and t.tgname = 'p2d_kiem_lk_dau' and not t.tgisinternal) then
    raise exception 'tự kiểm: thiếu trigger p2d_kiem_lk_dau';
  end if;
end
$x$;
