-- Bộ hãm linh khí: một lần vượt hạn mức chỉ ghi MỘT cờ (chủ dự án 26/11/2026 08:5x, bảng chọn "Thưởng không nhân thêm").
-- Vì sao: p2d_kiem_linh_khi cắt linh khí về mức cho phép nhưng chỉ báo số đã cắt về máy khách khi lố rất xa (v_tang > v_xo + v_tran).
-- Lố vừa (hơn một tầng công thức gốc) thì máy chủ cắt mà máy khách không biết, vẫn giữ số cao hơn, nên MỖI lần lưu sau đó lại thấy đúng
-- phần lố ấy và ghi thêm một cờ, tới khi thùng nạp lại đủ. Sáng 26/11 một người chơi Nguyên Anh nhận thưởng linh khí việc ngày (máy khách
-- nhân thêm dòng Hấp thu linh khí, đạo lữ, sư đồ nên vượt hạn mức quà) bị ghi 7 cờ trong 7 phút từ một lần vượt, đủ 5 cờ là cờ đỏ tự động
-- (đã gỡ tay, p2d_xu_ly hành động go_co_do). Các chuỗi 3–4 cờ trong vòng một phút của tuần trước cũng là kiểu này.
-- Sửa: đã ghi cờ thì luôn báo số đã cắt về máy khách (p2d.sua_lk), máy khách nhận số máy chủ (src/game/cloud-guard.js) nên lần lưu sau
-- không còn lố. Ngưỡng ghi cờ, mức cắt, thùng, hạn mức quà không đổi. Phần máy khách (thưởng theo % tầng không nhân thêm) đi cùng PR.
-- Thay đúng một đoạn trong định nghĩa đang chạy (đoạn cũ phải có đúng một lần, không thì báo lỗi, không đổi gì).
-- Lùi: định nghĩa cũ sao lưu ở p2d_xu_ly lúc áp (hành động sao_ham_truoc_migration).
-- ĐÃ ÁP 26/11/2026 08:53. Chạy thử trước trong giao dịch huỷ ngược: vượt 120 nghìn ghi 1 cờ và trả số về máy khách; vượt 30 nghìn
-- (dưới ngưỡng ghi cờ) và lần lưu thường vẫn như cũ.

do $x$
declare
  v_def text := pg_get_functiondef('public.p2d_kiem_linh_khi'::regproc);
  v_cu text := E'  if v_tang - v_xo > v_can then\n    if public.p2d_co_moi(new.user_id) then new.nghi_van := new.nghi_van + 1; end if;\n';
  v_moi text := E'  if v_tang - v_xo > v_can then\n'
             || E'    perform set_config(\'p2d.sua_lk\', \'1\', true);   -- 20261126050000: đã ghi cờ thì báo số đã cắt về máy khách, một lần vượt chỉ một cờ\n'
             || E'    if public.p2d_co_moi(new.user_id) then new.nghi_van := new.nghi_van + 1; end if;\n';
  v_n int;
begin
  if position('20261126050000' in v_def) > 0 then return; end if;   -- đã thay rồi (áp lại): không đổi gì
  v_n := (length(v_def) - length(replace(v_def, v_cu, ''))) / length(v_cu);
  if v_n <> 1 then raise exception 'p2d_kiem_linh_khi: đoạn ghi cờ xuất hiện % lần (cần đúng 1), không áp', v_n; end if;
  execute replace(v_def, v_cu, v_moi);
end
$x$;

-- Tự kiểm
do $k$
declare v_def text := pg_get_functiondef('public.p2d_kiem_linh_khi'::regproc);
begin
  if position('20261126050000' in v_def) = 0 then raise exception 'kt: p2d_kiem_linh_khi chưa đổi'; end if;
  if position('public.p2d_tong_lk_that(' in v_def) = 0 or position('public.p2d_lk_tien_that(' in v_def) = 0 then raise exception 'kt: mất phần linh khí thật'; end if;
  if (length(v_def) - length(replace(v_def, 'p2d.sua_lk', ''))) / length('p2d.sua_lk') <> 2 then raise exception 'kt: p2d.sua_lk phải có đúng 2 chỗ'; end if;
end $k$;
