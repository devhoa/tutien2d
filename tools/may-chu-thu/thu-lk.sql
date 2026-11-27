-- Bài thử bộ hãm linh khí trên máy chủ thử trong máy (tools/may-chu-thu/lk-that.sh). Chạy hai lần: :pha = 'truoc' (định nghĩa đang
-- chạy trước migration 20261126030000: nhảy tầng đã bị chặn, nhưng phải thấy đúng lỗi 27000 và lần lưu đầu còn hở) và :pha = 'sau'.
-- Sai chỗ nào là raise exception, bài dừng.
\set ON_ERROR_STOP 1
select set_config('thu.pha', :'pha', false);

create schema if not exists thu;

-- Đặt thẳng trạng thái một nhân vật (đi đường máy chủ tự ghi p2d.lk_tru nên bộ hãm bỏ qua)
create or replace function thu.dat(p_u uuid, p_r integer, p_l integer, p_q numeric, p_xo numeric, p_thuong numeric default 0) returns void language plpgsql as $$
begin
  insert into auth.users (id, created_at) values (p_u, now() - interval '10 days') on conflict do nothing;
  perform set_config('p2d.lk_tru', '1', true);
  insert into public.p2d_nhan_vat (user_id) values (p_u) on conflict do nothing;
  update public.p2d_nhan_vat set data = jsonb_build_object('realm', p_r, 'layer', p_l, 'qi', p_q), canh_gioi = p_r, tang = p_l,
         qi_xo = p_xo, qi_luc = now(), luu_luc = now(), qi_thuong = p_thuong, qi_thuong_luc = now(), nghi_van = 0 where user_id = p_u;
  perform set_config('p2d.lk_tru', '', true);
  delete from public.p2d_nghi_van where user_id = p_u; delete from public.p2d_co_do where user_id = p_u;
end $$;

-- Một lần lưu của người chơi (như lệnh update cuối p2d_luu), trả trạng thái máy chủ nhận
create or replace function thu.luu(p_u uuid, p_r integer, p_l integer, p_q numeric) returns jsonb language plpgsql as $$
declare v jsonb;
begin
  perform set_config('p2d.on', '30', true);
  update public.p2d_nhan_vat set data = jsonb_build_object('realm', p_r, 'layer', p_l, 'qi', p_q), canh_gioi = p_r, tang = p_l, luu_luc = now()
   where user_id = p_u
  returning jsonb_build_object('r', (data ->> 'realm')::int, 'l', (data ->> 'layer')::int, 'q', (data ->> 'qi')::numeric, 'xo', qi_xo, 'nv', nghi_van, 'th', qi_thuong) into v;
  return v || jsonb_build_object('co', (select count(*) from public.p2d_nghi_van where user_id = p_u and ly_do = 'linh_khi'),
                                 'do', exists (select 1 from public.p2d_co_do where user_id = p_u));
end $$;

create or replace function thu.doi(p_ten text, p_dung boolean, p_thay jsonb default null) returns void language plpgsql as $$
begin
  if not coalesce(p_dung, false) then raise exception 'TRƯỢT [%] %: %', current_setting('thu.pha'), p_ten, p_thay; end if;
  raise notice 'đạt [%] %', current_setting('thu.pha'), p_ten;
end $$;

-- Một lần lưu của người chơi thật do tools/lk-that.mjs --thu sinh bằng công thức máy khách: máy chủ phải nhận nguyên, không cờ,
-- thùng trừ đúng phần linh khí vừa được (lệch tối đa 1 mỗi tầng vì làm tròn)
create or replace function thu.that(p_n1 integer, p_q1 numeric, p_n2 integer, p_q2 numeric, p_xo numeric, p_duoc numeric) returns void language plpgsql as $$
declare u uuid := '00000000-0000-0000-0000-0000000000ee'; v jsonb;
begin
  perform thu.dat(u, p_n1 / 9, p_n1 % 9 + 1, p_q1, p_xo);
  v := thu.luu(u, p_n2 / 9, p_n2 % 9 + 1, p_q2);
  if (v ->> 'r')::int <> p_n2 / 9 or (v ->> 'l')::int <> p_n2 % 9 + 1 or (v ->> 'q')::numeric <> p_q2 or (v ->> 'co')::int <> 0
     or abs((v ->> 'xo')::numeric - (p_xo - p_duoc)) > (p_n2 - p_n1) + 1 then
    raise exception 'TRƯỢT người chơi thật: tầng % linh khí % → tầng % linh khí % (được %): máy chủ ra %', p_n1, p_q1, p_n2, p_q2, p_duoc, v;
  end if;
end $$;

do $t$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a'; b uuid := '00000000-0000-0000-0000-00000000000b';
  c uuid := '00000000-0000-0000-0000-00000000000c'; d uuid := '00000000-0000-0000-0000-00000000000d';
  sau boolean := current_setting('thu.pha') = 'sau';
  v jsonb; loi text; i integer;
begin
  -- 1. Nhảy tầng không trả linh khí: Trúc Cơ 1 → Nguyên Anh 5 trong một lần lưu, thùng đầy 500 000
  perform thu.dat(a, 1, 1, 0, 500000);
  v := thu.luu(a, 3, 5, 0);
  -- 500 000 linh khí thật: hết Trúc Cơ (236 293), Kim Đan tầng 1 (119 653), dừng ở Kim Đan tầng 2 còn 144 054
  perform thu.doi('nhảy tầng bị trả về đúng chỗ hạn mức cho', (v ->> 'r')::int = 2 and (v ->> 'l')::int = 2 and abs((v ->> 'q')::numeric - 144054) <= 20 and (v ->> 'xo')::numeric = 0 and (v ->> 'co')::int = 1, v);

  -- 2. Người thật lên tầng: Nguyên Anh 1 còn thiếu 14, được thêm 500 → Nguyên Anh 2 linh khí 486; thùng chỉ bị trừ đúng 500
  perform thu.dat(a, 3, 1, 3735000, 100000);
  v := thu.luu(a, 3, 2, 486);
  perform thu.doi('lên tầng thật được nhận', (v ->> 'r')::int = 3 and (v ->> 'l')::int = 2 and (v ->> 'q')::numeric = 486 and (v ->> 'co')::int = 0, v);
  perform thu.doi('lên tầng thật: thùng trừ đúng phần vừa được', abs((v ->> 'xo')::numeric - 99500) <= 2, v);

  -- 3. Trong một tầng: +5 000 (hai bản phải như nhau)
  perform thu.dat(a, 2, 4, 1000, 100000);
  v := thu.luu(a, 2, 4, 6000);
  perform thu.doi('trong tầng +5 000 được nhận, thùng còn 95 000', (v ->> 'q')::numeric = 6000 and (v ->> 'xo')::numeric = 95000 and (v ->> 'co')::int = 0, v);

  -- 4. Trong một tầng vượt thùng (hai bản phải như nhau): thùng 1 000, +200 000 ở Kim Đan 4 → chỉ nhận 1 000, có cờ
  perform thu.dat(a, 2, 4, 1000, 1000);
  v := thu.luu(a, 2, 4, 201000);
  perform thu.doi('trong tầng vượt thùng: cắt về phần được phép, có cờ', (v ->> 'q')::numeric = 2000 and (v ->> 'co')::int = 1 and (v ->> 'xo')::numeric = 0, v);

  -- 5. Độ kiếp thành: Kim Đan 9 đầy (976 043) → Nguyên Anh 1 linh khí 0, thùng gần cạn vẫn qua
  perform thu.dat(a, 2, 9, 976043, 10);
  v := thu.luu(a, 3, 1, 0);
  perform thu.doi('độ kiếp thành được nhận dù thùng gần cạn', (v ->> 'r')::int = 3 and (v ->> 'l')::int = 1 and (v ->> 'co')::int = 0, v);

  -- 6. Độ kiếp hỏng mất 30% linh khí: giảm thì không tính
  perform thu.dat(a, 2, 9, 976043, 10);
  v := thu.luu(a, 2, 9, 683230);
  perform thu.doi('độ kiếp hỏng (mất linh khí) được nhận', (v ->> 'q')::numeric = 683230 and (v ->> 'co')::int = 0, v);

  -- 7. Quà linh khí máy chủ duyệt (qi_thuong) đưa qua tầng: Nguyên Anh 5 còn thiếu 100 000, nhận quà 420 379, thùng chỉ 1 000
  perform thu.dat(a, 3, 5, 4103791, 1000, 462417);
  v := thu.luu(a, 3, 6, 320379);
  perform thu.doi('quà qi_thuong đưa qua tầng được nhận', (v ->> 'r')::int = 3 and (v ->> 'l')::int = 6 and (v ->> 'q')::numeric = 320379 and (v ->> 'co')::int = 0, v);

  -- 8. Máy chủ tự trừ tu vi (p2d.lk_tru): bỏ qua bộ hãm
  perform thu.dat(a, 3, 5, 100, 0);
  perform set_config('p2d.lk_tru', '1', true);
  v := thu.luu(a, 3, 4, 4000000);
  perform set_config('p2d.lk_tru', '', true);
  perform thu.doi('máy chủ tự trừ tu vi không bị bộ hãm đụng', (v ->> 'l')::int = 4 and (v ->> 'q')::numeric = 4000000, v);

  -- 9. Cờ linh_khi lần thứ 5 trong 24 giờ: bản cũ làm hỏng cả lần lưu (27000), bản mới lưu được, cờ đỏ cắm, nghi_van = 10
  perform thu.dat(b, 2, 4, 1000, 1000);
  for i in 1 .. 4 loop insert into public.p2d_nghi_van (user_id, ly_do, chi_tiet) values (b, 'linh_khi', '{}'); end loop;
  loi := null;
  begin
    v := thu.luu(b, 2, 4, 201000);
  exception when others then loi := sqlstate;
  end;
  if sau then
    perform thu.doi('cờ thứ 5: lần lưu không hỏng, cờ đỏ cắm, nghi_van 10', loi is null and (v ->> 'do')::boolean and (v ->> 'nv')::int >= 10 and (v ->> 'q')::numeric = 2000, coalesce(v, to_jsonb(loi)));
  else
    perform thu.doi('LỖI CŨ: cờ thứ 5 làm hỏng lần lưu với mã 27000', loi = '27000', to_jsonb(loi));
  end if;

  -- 10. Cờ cắm thẳng (không từ trong trigger của dòng nhân vật): vẫn đặt nghi_van = 10 ngay như cũ
  perform thu.dat(c, 0, 1, 0, 500000);
  for i in 1 .. 5 loop insert into public.p2d_nghi_van (user_id, ly_do, chi_tiet) values (c, 'linh_khi', '{}'); end loop;
  perform thu.doi('cờ cắm thẳng lần thứ 5: cờ đỏ và nghi_van 10', exists (select 1 from public.p2d_co_do where user_id = c) and (select nghi_van from public.p2d_nhan_vat where user_id = c) = 10);

  if not sau then
    -- CHỖ HỞ CŨ: lần lưu đầu của tài khoản không qua bộ hãm (trigger chỉ chạy lúc UPDATE)
    delete from public.p2d_nhan_vat where user_id = d; delete from auth.users where id = d;
    insert into auth.users (id, created_at) values (d, now());
    insert into public.p2d_nhan_vat (user_id, data, canh_gioi, tang) values (d, '{"realm":3,"layer":1,"qi":0}', 3, 1);
    perform thu.doi('CHỖ HỞ CŨ: tài khoản vừa tạo ghi thẳng Nguyên Anh ở lần lưu đầu', (select canh_gioi = 3 from public.p2d_nhan_vat where user_id = d));
    delete from public.p2d_nhan_vat where user_id = d;
    return;
  end if;

  -- 11. Lần lưu đầu của tài khoản
  delete from public.p2d_nhan_vat where user_id = d; delete from auth.users where id = d;
  insert into auth.users (id, created_at) values (d, now());
  loi := null;
  begin insert into public.p2d_nhan_vat (user_id, data, canh_gioi, tang) values (d, '{"realm":3,"layer":1,"qi":0}', 3, 1);
  exception when others then loi := sqlerrm; end;
  perform thu.doi('lần lưu đầu ở Nguyên Anh bị từ chối', loi = 'canh_gioi_sai', to_jsonb(loi));
  insert into public.p2d_nhan_vat (user_id, data, canh_gioi, tang) values (d, '{"realm":0,"layer":1,"qi":0}', 0, 1);
  perform thu.doi('lần lưu đầu nhân vật mới: thùng để trống như cũ', (select qi_xo is null from public.p2d_nhan_vat where user_id = d));
  delete from public.p2d_nhan_vat where user_id = d;
  insert into public.p2d_nhan_vat (user_id, data, canh_gioi, tang) values (d, '{"realm":1,"layer":5,"qi":100}', 1, 5);
  -- Luyện Khí 20 440 + Trúc Cơ tầng 1–4 (45 664) + 100 = 66 204
  perform thu.doi('lần lưu đầu ở Trúc Cơ 5: được, thùng còn 433 796', (select abs(qi_xo - 433796) <= 5 from public.p2d_nhan_vat where user_id = d), (select to_jsonb(qi_xo) from public.p2d_nhan_vat where user_id = d));
  v := thu.luu(d, 3, 5, 0);
  perform thu.doi('lần lưu thứ hai nhảy Nguyên Anh 5: bị trả về trong Kim Đan', (v ->> 'r')::int = 2 and (v ->> 'co')::int = 1, v);
  -- tài khoản 12 giờ tuổi chưa từng lưu: 500 000 + 90 × 43 200 = 4 388 000 → tới được Nguyên Anh 1 (4 087 411), không tới được tầng 2
  delete from public.p2d_nhan_vat where user_id = d; update auth.users set created_at = now() - interval '5 days' where id = d;
  insert into public.p2d_nhan_vat (user_id, data, canh_gioi, tang) values (d, '{"realm":3,"layer":1,"qi":0}', 3, 1);
  delete from public.p2d_nhan_vat where user_id = d;
  loi := null;
  begin insert into public.p2d_nhan_vat (user_id, data, canh_gioi, tang) values (d, '{"realm":3,"layer":2,"qi":0}', 3, 2);
  exception when others then loi := sqlerrm; end;
  perform thu.doi('tài khoản cũ chưa từng lưu: phần hồi theo tuổi chặn ở 12 giờ', loi = 'canh_gioi_sai', to_jsonb(loi));
  -- quản trị khôi phục dòng cảnh giới cao: đặt p2d.lk_tru
  perform set_config('p2d.lk_tru', '1', true);
  insert into public.p2d_nhan_vat (user_id, data, canh_gioi, tang) values (d, '{"realm":8,"layer":9,"qi":0}', 8, 9);
  perform set_config('p2d.lk_tru', '', true);
  perform thu.doi('quản trị khôi phục dòng cảnh giới cao (p2d.lk_tru) được', (select canh_gioi = 8 from public.p2d_nhan_vat where user_id = d));
end $t$;
