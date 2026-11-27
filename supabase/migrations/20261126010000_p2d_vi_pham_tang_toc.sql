-- Cảnh báo vi phạm khi bắt được tăng tốc (chủ dự án 26/11/2026: "Gắn cờ là được, rồi nhắn thông báo vi phạm, sau đó báo cho tôi").
-- p2d_luu vẫn chỉ cắm cờ 'tang_toc' như cũ (đồng hồ máy nhanh hơn 1,5 lần giờ máy chủ + 5 giây, cùng phiên, từ 30 giây), không khoá,
-- không bỏ bản lưu (luật 24/11/2026: máy chủ thôi tự khoá ai). Thêm: lúc cắm cờ thì gửi một thư 'vi_pham' vào Hòm thư người đó, mỗi
-- người nhiều nhất một thư mỗi 6 giờ. Máy khách hiện thư này bằng chữ báo 9 giây và giữ trong Hòm thư (src/game/market.js claimMail).
-- Sửa bằng cách thay đúng một đoạn trong định nghĩa p2d_luu đang chạy (đoạn cũ phải có đúng một lần, không thì báo lỗi, không đổi gì).
-- Lùi: định nghĩa cũ sao lưu ở p2d_xu_ly lúc áp (hành động sao_ham_truoc_migration).

do $x$
declare
  v_def text := pg_get_functiondef('public.p2d_luu'::regproc);
  v_cu text := E'    elsif (v_clk - v_cu.dh_clk) / 1000 > v_that * 1.5 + 5 then v_ly_do := array_append(v_ly_do, \'tang_toc\'); end if;\n';
  v_moi text := E'    elsif (v_clk - v_cu.dh_clk) / 1000 > v_that * 1.5 + 5 then v_ly_do := array_append(v_ly_do, \'tang_toc\');\n'
             || E'      if not exists (select 1 from public.p2d_hom_thu h where h.user_id = v_uid and h.ly_do = \'vi_pham\' and h.tao_luc > now() - interval \'6 hours\') then\n'
             || E'        insert into public.p2d_hom_thu (user_id, noi_dung, ly_do) values (v_uid, jsonb_build_object(\'tieu_de\', \'Cảnh báo vi phạm\', \'loi\',\n'
             || E'          \'Hệ thống phát hiện game của đạo hữu chạy nhanh hơn thời gian thật (phần mềm tăng tốc). Đây là hành vi vi phạm và đã được ghi nhận. \'\n'
             || E'          || \'Đạo hữu tắt phần mềm tăng tốc rồi tải lại game; tái phạm có thể bị xử lý nặng hơn.\'), \'vi_pham\');\n'
             || E'      end if;\n'
             || E'    end if;\n';
  v_n int;
begin
  v_n := (length(v_def) - length(replace(v_def, v_cu, ''))) / length(v_cu);
  if v_n <> 1 then raise exception 'p2d_luu: đoạn cờ tang_toc xuất hiện % lần (cần đúng 1), không áp', v_n; end if;
  execute replace(v_def, v_cu, v_moi);
end
$x$;
