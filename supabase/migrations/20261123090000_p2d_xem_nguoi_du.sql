-- Hồ sơ đúng chỉ số thực tế (chủ dự án 23/11/2026 19:35 "Hồ sơ… cũng có thay đổi theo chỉ số thực tế đúng không", bảng chọn
-- "Sửa cả máy chủ"). p2d_xem_nguoi (12/11) chưa trả Tiềm năng (tộc, điểm), dòng thời trang, thú cưỡi, khôi lỗi thứ hai, nên HP / Công / Thủ
-- trong Hồ sơ thấp hơn thật, ô thú cưỡi trống, Lực chiến (số thật máy chủ ghi) lệch với các dòng chỉ số.
-- Chỉ đổi hàm ĐỌC, không ghi gì: trả thêm
--   tiem: toc, goc, cong, max (max lấy cao hơn giữa bản lưu và cột canh_max, như lúc tải bản lưu của chính mình),
--   outfitKey, outfits (chỉ bản đang mặc), outfitLine (dòng các bộ thời trang),
--   mount, mountKey, mounts (chỉ bản đang cưỡi), mountLine (chỉ bản đang cưỡi),
--   companion2, comps của cả hai khôi lỗi.
-- Máy khách lọc lại theo data/ (src/game/profile.js cleanSave). Phần còn lại giữ nguyên định nghĩa đang chạy (lấy từ máy chủ 23/11/2026).
create or replace function public.p2d_xem_nguoi(p_k text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare
  v_uid uuid := (select auth.uid()); n public.p2d_nhan_vat%rowtype; d jsonb; v_equip jsonb; v_pet text; v_comp text; v_comp2 text;
  v_tiem jsonb; v_max int; v_mount text; v_mk text; v_ok text;
begin
  if v_uid is null then raise exception 'chua_dang_nhap' using errcode = '28000'; end if;
  if p_k is null or p_k !~ '^[0-9a-f]{12}$' then raise exception 'du_lieu_sai' using errcode = '22023'; end if;
  select * into n from public.p2d_nhan_vat x where public.p2d_chat_key(x.user_id) = p_k limit 1;
  if not found then raise exception 'khong_thay' using errcode = 'P0001'; end if;
  d := n.data;
  v_equip := case when jsonb_typeof(d -> 'equip') = 'object' then d -> 'equip' else '{}'::jsonb end;
  v_pet := d ->> 'pet'; v_comp := d ->> 'companion'; v_comp2 := d ->> 'companion2';
  -- Tiềm năng: chỉ bốn khoá máy khách cần để tính chỉ số
  v_tiem := case when jsonb_typeof(d -> 'tiem') = 'object' then d -> 'tiem' else '{}'::jsonb end;
  v_max := greatest(case when jsonb_typeof(v_tiem -> 'max') = 'number' then floor((v_tiem ->> 'max')::numeric)::int else 0 end, coalesce(n.canh_max, 0));
  -- thú cưỡi, thời trang: bản đang dùng (src/game/inst.js: mountKey / outfitKey là khoá bản, mount / outfit là mã loại)
  v_mount := case when jsonb_typeof(d -> 'mount') = 'string' then d ->> 'mount' end;
  v_mk := case when v_mount is not null and jsonb_typeof(d -> 'mountKey') = 'string' and split_part(d ->> 'mountKey', '#', 1) = v_mount
               and (d -> 'mounts' -> (d ->> 'mountKey')) is not null then d ->> 'mountKey' else v_mount end;
  v_ok := case when jsonb_typeof(d -> 'outfitKey') = 'string' and (d -> 'outfits' -> (d ->> 'outfitKey')) is not null then d ->> 'outfitKey' end;
  return jsonb_build_object(
    'k', p_k, 'ten', coalesce(n.ten, public.p2d_ten_mac_dinh(n.user_id)), 'luc_chien', n.luc_chien, 'canh_gioi', n.canh_gioi, 'tang', n.tang,
    'co', n.nghi_van >= 10, 'la_toi', n.user_id = v_uid,
    'save', jsonb_strip_nulls(jsonb_build_object(
      'realm', d -> 'realm', 'layer', d -> 'layer', 'element', d -> 'element', 'weapon', d -> 'weapon', 'root', d -> 'root',
      'equip', v_equip,
      'bag', (select coalesce(jsonb_agg(it), '[]'::jsonb) from jsonb_array_elements(case when jsonb_typeof(d -> 'bag') = 'array' then d -> 'bag' else '[]'::jsonb end) it
               where exists (select 1 from jsonb_each(v_equip) e where e.value = it -> 'uid')),
      'techSlots', d -> 'techSlots', 'techs', d -> 'techs', 'snack', d -> 'snack',
      'flags', jsonb_build_object('boiNguyen', d -> 'flags' -> 'boiNguyen'),
      'loadout', d -> 'loadout', 'skillLv', d -> 'skillLv',
      'pet', d -> 'pet', 'pets', case when v_pet is not null then jsonb_build_object(v_pet, d -> 'pets' -> v_pet) end,
      'companion', d -> 'companion', 'companion2', d -> 'companion2',
      'comps', case when v_comp is not null or v_comp2 is not null then jsonb_strip_nulls(jsonb_build_object(coalesce(v_comp, '_'), d -> 'comps' -> v_comp, coalesce(v_comp2, '_2'), d -> 'comps' -> v_comp2)) end,
      'phapBao', case when jsonb_typeof(d -> 'phapBao' -> 'wear') = 'array' then jsonb_build_object('wear', d -> 'phapBao' -> 'wear', 'items', (select coalesce(jsonb_agg(i), '[]'::jsonb) from jsonb_array_elements(case when jsonb_typeof(d -> 'phapBao' -> 'items') = 'array' then d -> 'phapBao' -> 'items' else '[]'::jsonb end) i where (d -> 'phapBao' -> 'wear') @> jsonb_build_array(i -> 'uid'))) end,
      'tiem', case when v_tiem -> 'toc' is not null then jsonb_strip_nulls(jsonb_build_object('toc', v_tiem -> 'toc', 'goc', v_tiem -> 'goc', 'cong', v_tiem -> 'cong', 'max', v_max)) end,
      'mount', v_mount, 'mountKey', case when v_mk is distinct from v_mount then v_mk end,
      'mounts', case when v_mk is not null then jsonb_build_object(v_mk, coalesce(d -> 'mounts' -> v_mk, 'true'::jsonb)) end,
      'mountLine', case when v_mk is not null and d -> 'mountLine' -> v_mk is not null then jsonb_build_object(v_mk, d -> 'mountLine' -> v_mk) end,
      'outfitKey', v_ok, 'outfits', case when v_ok is not null then jsonb_build_object(v_ok, d -> 'outfits' -> v_ok) end,
      'outfitLine', case when jsonb_typeof(d -> 'outfitLine') = 'object' then d -> 'outfitLine' end,
      'look', d -> 'look', 'gioi', d -> 'gioi', 'outfit', d -> 'outfit')));
end;
$function$;

-- Tự kiểm: hàm mới đã có các khoá thêm; quyền gọi giữ nguyên (create or replace không đổi quyền)
do $$
declare d text := pg_get_functiondef('public.p2d_xem_nguoi(text)'::regprocedure);
begin
  if position('''tiem''' in d) = 0 or position('''mountLine''' in d) = 0 or position('''outfitLine''' in d) = 0 or position('''companion2''' in d) = 0 then
    raise exception 'p2d_xem_nguoi chua co du khoa moi';
  end if;
  if has_function_privilege('anon', 'public.p2d_xem_nguoi(text)', 'execute') then raise exception 'anon khong duoc goi p2d_xem_nguoi'; end if;
end $$;
