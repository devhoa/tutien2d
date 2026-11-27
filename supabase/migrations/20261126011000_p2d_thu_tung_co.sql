-- Linh thú loài từng có (CSKH #253, #285; chủ dự án 26/11/2026 chọn "Không đếm loài từng có"): bán linh thú rồi hạ dị chủng bắt lại
-- cùng loài thì p2d_thu_bay coi là loài mới, lấy vào thùng loài mới (thu.sv.moi: 1 con / 20 phút, đầy 3), thùng cạn là bỏ con vừa bắt
-- (cờ thu_nhieu; 24 giờ trước khi áp: 1 725 lần, 76 người).
--   1) kyThu.tung (máy chủ ghi trong bản lưu, máy khách không sửa được: p2d_kiem_thu luôn ghi đè kyThu): danh sách loài linh thú người
--      đó từng có qua máy chủ, gộp mỗi lần kiểm linh thú. Lần kiểm đầu sau khi áp lấy các loài đang có trong bản lưu cũ.
--   2) p2d_thu_bay: linh thú loài mới mà loài đó có trong tung thì nhận như con lv 1 mới, không trừ thùng loài mới (cấp, kinh nghiệm,
--      bản sao vẫn qua đủ thùng như cũ). Khôi lỗi, thú cưỡi không đổi.
-- Loài đã bán TRƯỚC khi áp chưa có trong tung (máy chủ không giữ lịch sử đó), bắt lại lần đầu vẫn theo thùng loài mới.
-- Sửa bằng cách thay đúng từng đoạn trong định nghĩa đang chạy (mỗi đoạn cũ phải có đúng một lần, không thì báo lỗi, không đổi gì).
-- Không đổi bảng, không đổi máy khách. Lùi: định nghĩa cũ hai hàm sao lưu ở p2d_xu_ly lúc áp.

create or replace function public.p2d_thu_tung(p_a jsonb, p_pets jsonb)
returns jsonb language sql immutable set search_path = '' as $f$
  select coalesce(jsonb_agg(x order by x), '[]'::jsonb) from (
    select x from (
      select jsonb_array_elements_text(case when jsonb_typeof(p_a) = 'array' then p_a else '[]'::jsonb end) x
      union
      select jsonb_object_keys(case when jsonb_typeof(p_pets) = 'object' then p_pets else '{}'::jsonb end)
    ) u where length(x) between 1 and 40 limit 64
  ) t
$f$;
revoke all on function public.p2d_thu_tung(jsonb, jsonb) from public, anon, authenticated;

do $x$
declare
  v_def text; v_n int;
  r record;
begin
  for r in select * from (values
    ('public.p2d_thu_bay',
     E'      elsif v_pet and v_p >= 1 then v_p := v_p - 1;\n',
     E'      elsif v_pet and coalesce(p_st -> \'tung\', \'[]\'::jsonb) ? v_id then null;   -- loài từng có (kyThu.tung): không trừ thùng loài mới (CSKH #253)\n      elsif v_pet and v_p >= 1 then v_p := v_p - 1;\n'),
    ('public.p2d_kiem_thu',
     E'  v_st := v_b || jsonb_build_object(\'x\', v_x, \'xt\', v_xt,\n',
     E'  v_st := v_b || jsonb_build_object(\'tung\', public.p2d_thu_tung(v_ky -> \'tung\', p_cu -> \'pets\'), \'x\', v_x, \'xt\', v_xt,\n'),
    ('public.p2d_kiem_thu',
     E'\'stp\', (v_st ->> \'stp\')::boolean, \'stm\', (v_st ->> \'stm\')::boolean));\n',
     E'\'stp\', (v_st ->> \'stp\')::boolean, \'stm\', (v_st ->> \'stm\')::boolean,\n    \'tung\', public.p2d_thu_tung(v_st -> \'tung\', v_data -> \'pets\')));\n')
  ) t(f, cu, moi) loop
    v_def := pg_get_functiondef(r.f::regproc);
    v_n := (length(v_def) - length(replace(v_def, r.cu, ''))) / length(r.cu);
    if v_n <> 1 then raise exception '%: đoạn cũ xuất hiện % lần (cần đúng 1), không áp', r.f, v_n; end if;
    execute replace(v_def, r.cu, r.moi);
  end loop;
end
$x$;

-- tự kiểm tra
do $t$
declare v_a jsonb; v_st jsonb := '{"s": 0, "p": 0, "x": {"pet": 0}, "xt": {"pet": 0}, "tt": {}, "stp": true}';
  v_id text := (select (v -> 'thu' -> 'pet' -> 'ids') ->> 1 from public.p2d_ky_cfg where k = 'cfg');
begin
  if public.p2d_thu_tung('["a"]', '{"b": {}}') <> '["a", "b"]'::jsonb then raise exception 'p2d_thu_tung sai'; end if;
  v_a := public.p2d_thu_bay('pet', '{}', jsonb_build_object(v_id, '{"lv": 1, "exp": 0}'::jsonb), '[]', v_st);
  if (v_a -> 'm') ? v_id then raise exception 'thùng loài mới cạn mà vẫn nhận con chưa từng có'; end if;
  v_a := public.p2d_thu_bay('pet', '{}', jsonb_build_object(v_id, '{"lv": 1, "exp": 0}'::jsonb), '[]', v_st || jsonb_build_object('tung', jsonb_build_array(v_id)));
  if not (v_a -> 'm') ? v_id or (v_a -> 'ly') ? 'thu_nhieu' then raise exception 'loài từng có vẫn bị bỏ: %', v_a; end if;
  if (v_a -> 'st' ->> 'p')::numeric <> 0 then raise exception 'thùng loài mới bị trừ'; end if;
  if pg_get_functiondef('public.p2d_kiem_thu'::regproc) not like '%''tung'', public.p2d_thu_tung(v_st%' then raise exception 'p2d_kiem_thu chưa ghi tung'; end if;
end
$t$;
