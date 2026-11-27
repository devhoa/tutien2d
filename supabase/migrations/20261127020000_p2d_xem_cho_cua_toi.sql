-- Chợ Phiên: món của chính mình luôn hiện (CSKH #371, 27/11/2026). p2d_xem_cho chỉ trả 60 đơn mới nhất của cả chợ, nên khi chợ đông,
-- món mình rao từ trước bị đẩy ra ngoài 60 đơn đó: không thấy, không thu về được (món vẫn nằm an toàn trên máy chủ). Nay trả 60 đơn
-- mới nhất của người khác cộng mọi đơn đang mở của mình (mỗi người tối đa 10 đơn), xếp mới rao trước (chủ dự án 27/11/2026 00:16
-- "sẽ sắp xếp từ mới đến cũ"). Ẩn đơn người bị cờ đỏ như cũ.
create or replace function public.p2d_xem_cho(p_loai text default null)
returns jsonb language plpgsql security definer set search_path to '' as $function$
declare v_uid uuid := public.p2d_uid();
begin
  perform public.p2d_don_cho();
  return (
    select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'ten', x.ten_ban, 'loai', x.loai, 'mon', x.mon, 'gia', x.gia,
             'het_han', x.het_han, 'la_toi', x.nguoi_ban = v_uid) order by x.tao_luc desc), '[]'::jsonb)
    from (
      (select * from public.p2d_cho c where c.trang_thai = 'mo' and (p_loai is null or c.loai = p_loai) and c.nguoi_ban = v_uid)
      union all
      (select * from public.p2d_cho c where c.trang_thai = 'mo' and (p_loai is null or c.loai = p_loai) and c.nguoi_ban is distinct from v_uid
         and not exists (select 1 from public.p2d_nhan_vat s where s.user_id = c.nguoi_ban and s.nghi_van >= 10)   -- p2d_co_do: ẩn đơn người bị cờ đỏ
       order by c.tao_luc desc limit 60)
    ) x
  );
end;
$function$;
