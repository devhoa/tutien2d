-- Món rơi sai (roi_sai) và sửa đồ (sua_do) thôi tự khoá ngay, chỉ cắm cờ đỏ (chủ dự án 23/11/2026 chọn "Chỉ cắm cờ, không khoá").
-- Vì sao: 22–23/11 có hai lần khoá oan kiểu này: một máy mất kết nối máy chủ khoảng 37 phút vẫn cường hoá, tẩy luyện ngay trên máy
-- một món vừa rơi (lúc nối lại máy chủ thấy "món mới đã +7"); một máy gửi lại bản lưu cũ (món còn +4 trong khi máy chủ ghi +6).
-- Máy chủ vẫn bỏ món sai / trả món về bản máy chủ như cũ nên kẻ hack không được lợi gì; cờ đỏ vẫn cắm để soát tay.
-- Vẫn khoá ngay: do_sai_chi_so, ngoc_sai, day_cuc; luật linh khí + Linh Thạch lố 10 lần / 24 giờ giữ nguyên.
-- Chỉ thay hai dòng trong định nghĩa đang chạy của p2d_co_do_xet (tự kiểm mỗi dòng cũ có đúng một lần). Lùi: định nghĩa cũ sao lưu ở p2d_xu_ly lúc áp.
do $m$
declare
  d text := pg_get_functiondef('public.p2d_co_do_xet()'::regprocedure);
  a0 text := $a$    if v_r && array['do_sai_chi_so', 'roi_sai', 'ngoc_sai', 'sua_do', 'day_cuc'] then$a$;
  a1 text := $a$    if v_r && array['do_sai_chi_so', 'ngoc_sai', 'day_cuc'] then$a$;
  b0 text := $b$                  where x in ('do_sai_chi_so', 'roi_sai', 'ngoc_sai', 'sua_do', 'day_cuc')), ',');$b$;
  b1 text := $b$                  where x in ('do_sai_chi_so', 'ngoc_sai', 'day_cuc')), ',');$b$;
begin
  if position(a1 in d) > 0 then raise notice 'da_sua'; return; end if;
  if (length(d) - length(replace(d, a0, ''))) / length(a0) <> 1 or (length(d) - length(replace(d, b0, ''))) / length(b0) <> 1 then
    raise exception 'khong_thay_doan_cu';
  end if;
  execute replace(replace(d, a0, a1), b0, b1);
end $m$;
