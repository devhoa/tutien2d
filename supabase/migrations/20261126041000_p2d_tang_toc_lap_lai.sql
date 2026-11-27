-- Thư "Cảnh báo vi phạm" tăng tốc chỉ gửi khi cờ LẶP LẠI (chủ dự án 26/11/2026 01:5x, bảng chọn "Chỉ gửi khi lặp lại").
-- (Tệp đổi số từ 20261126040000 sang 20261126041000 vì trùng số với p2d_vu_khi_lang của tab khác; dấu trong hàm p2d_luu trên máy chủ vẫn ghi 20261126040000.)
-- Vì sao: soát 80 cờ tang_toc của 7 ngày (56 người): 70 cờ là một lần lưu tới máy chủ trễ khoảng 30 giây (mốc đồng hồ ghi lúc bản
-- lưu trễ tới nơi, lần lưu sau đó thấy đồng hồ máy đi 63 giây trong 32 giây máy chủ: đúng một nhịp lưu chậm); 74 cờ không lặp lại
-- trong 10 phút sau; không ai quá 4 cờ trong 7 ngày. Người chạy phần mềm tăng tốc thật thì cứ mỗi lần xét (30 giây trở lên) dính
-- một cờ. Thư bật từ 20261126010000 vì vậy gửi nhầm cho người chơi ngay (2 thư trong giờ đầu).
-- Luật mới: cờ tang_toc vẫn ghi như cũ (không đổi ngưỡng, không khoá, không bỏ bản lưu); thư vi_pham chỉ gửi khi trong 1 giờ qua
-- người đó đã có từ 2 cờ tang_toc (lần này là lần thứ 3), vẫn nhiều nhất một thư mỗi 6 giờ.
-- Sửa bằng cách thay đúng một dòng trong định nghĩa p2d_luu đang chạy (dòng cũ phải có đúng một lần, không thì báo lỗi, không đổi gì).
-- Lùi: định nghĩa cũ sao lưu ở p2d_xu_ly lúc áp (hành động sao_ham_truoc_migration).

do $x$
declare
  v_def text := pg_get_functiondef('public.p2d_luu'::regproc);
  v_cu text := E'      if not exists (select 1 from public.p2d_hom_thu h where h.user_id = v_uid and h.ly_do = \'vi_pham\' and h.tao_luc > now() - interval \'6 hours\') then\n';
  v_moi text := E'      if (select count(*) from public.p2d_nghi_van v where v.user_id = v_uid and v.luc > now() - interval \'1 hour\'\n'
             || E'            and \'tang_toc\' = any (string_to_array(v.ly_do, \',\'))) >= 2   -- 20261126040000: chỉ khi lặp lại (lần thứ 3 trong 1 giờ)\n'
             || E'         and not exists (select 1 from public.p2d_hom_thu h where h.user_id = v_uid and h.ly_do = \'vi_pham\' and h.tao_luc > now() - interval \'6 hours\') then\n';
  v_n int;
begin
  if position('20261126040000' in v_def) > 0 then return; end if;   -- đã thay rồi (áp lại): không đổi gì
  v_n := (length(v_def) - length(replace(v_def, v_cu, ''))) / length(v_cu);
  if v_n <> 1 then raise exception 'p2d_luu: dòng gửi thư vi_pham xuất hiện % lần (cần đúng 1), không áp', v_n; end if;
  execute replace(v_def, v_cu, v_moi);
end
$x$;

-- Tự kiểm
do $k$
declare v_def text := pg_get_functiondef('public.p2d_luu'::regproc);
begin
  if position('20261126040000' in v_def) = 0 or position('''tang_toc'' = any (string_to_array(v.ly_do' in v_def) = 0 then raise exception 'kt: p2d_luu chưa đổi'; end if;
  if position('array_append(v_ly_do, ''tang_toc'')' in v_def) = 0 then raise exception 'kt: mất cờ tang_toc'; end if;
end $k$;
