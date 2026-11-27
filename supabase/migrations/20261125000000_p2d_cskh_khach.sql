-- CSKH cho người CHƯA đăng nhập (chủ dự án 24/11/2026 23:5x: "K dẫn sang zalo, cố gắng để đọc đc hết ý kiến của khách kể cả chưa đăng nhập").
-- Người đã đăng nhập vẫn gửi qua p2d_gop_y (Edge Function gop-y-anh, có ảnh). Người chưa đăng nhập (màn đăng nhập, chơi thử, quên mật khẩu)
-- gửi vào bảng riêng này, không ảnh: tên tài khoản (nếu nhớ), cách liên hệ lại (tuỳ chọn), Ý chính, Ý phụ, mô tả, bối cảnh máy.
-- Mỗi tin có mã bí mật `ma` trả về cho máy gửi (giữ trong localStorage) để xem lại trạng thái và lời trả lời (p2d_cskh_khach_xem).
-- Chặn gửi dồn theo địa chỉ mạng (băm, không giữ IP thô): 5 tin / 10 phút, 15 tin / ngày; cả máy chủ 300 tin / giờ.
-- Không đụng bảng người chơi nào. Chỉ hàm SECURITY DEFINER đọc / ghi; bảng bật RLS, không có chính sách cho anon / authenticated.

create table if not exists public.p2d_cskh_khach (
  id bigserial primary key,
  ma text not null unique,
  tai_khoan text,
  lien_he text,
  nhom text not null,
  y text not null,
  tieu_de text not null,
  mo_ta text not null,
  ngu_canh jsonb not null default '{}'::jsonb,
  ip_bam text,
  trang_thai text not null default 'moi',
  tra_loi text,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  xu_ly_luc timestamptz
);
create index if not exists p2d_cskh_khach_ip_luc on public.p2d_cskh_khach (ip_bam, tao_luc);
create index if not exists p2d_cskh_khach_luc on public.p2d_cskh_khach (tao_luc);
alter table public.p2d_cskh_khach enable row level security;
revoke all on public.p2d_cskh_khach from anon, authenticated;

create or replace function public.p2d_cskh_khach_gui(p_tai_khoan text, p_lien_he text, p_nhom text, p_y text, p_tieu_de text, p_mo_ta text, p_ngu_canh jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_tk text := nullif(btrim(coalesce(p_tai_khoan, '')), '');
  v_lh text := nullif(btrim(coalesce(p_lien_he, '')), '');
  v_td text := btrim(coalesce(p_tieu_de, ''));
  v_mt text := btrim(coalesce(p_mo_ta, ''));
  v_ip text; v_bam text; v_ma text; v_id bigint;
begin
  if coalesce(p_nhom, '') !~ '^[a-z0-9-]{1,24}$' or coalesce(p_y, '') !~ '^[a-z0-9-]{1,32}$' then raise exception 'du_lieu_sai' using errcode = '22023'; end if;
  if char_length(v_td) < 4 or char_length(v_td) > 80 then raise exception 'tieu_de_sai' using errcode = '22023'; end if;
  if char_length(v_mt) < 10 then raise exception 'mo_ta_ngan' using errcode = '22023'; end if;
  if char_length(v_mt) > 800 then raise exception 'mo_ta_dai' using errcode = '22023'; end if;
  if char_length(coalesce(v_tk, '')) > 40 or char_length(coalesce(v_lh, '')) > 80 then raise exception 'du_lieu_sai' using errcode = '22023'; end if;
  if p_ngu_canh is not null and (jsonb_typeof(p_ngu_canh) <> 'object' or octet_length(p_ngu_canh::text) > 6000) then raise exception 'du_lieu_sai' using errcode = '22023'; end if;
  begin
    v_ip := btrim(split_part(coalesce((current_setting('request.headers', true)::json) ->> 'x-forwarded-for', ''), ',', 1));
  exception when others then v_ip := null;
  end;
  v_bam := case when coalesce(v_ip, '') <> '' then encode(extensions.digest('p2d-cskh:' || v_ip, 'sha256'), 'hex') end;
  if v_bam is not null then
    if (select count(*) from public.p2d_cskh_khach where ip_bam = v_bam and tao_luc > now() - interval '10 minutes') >= 5 then
      raise exception 'gui_nhanh_qua' using errcode = 'P0001'; end if;
    if (select count(*) from public.p2d_cskh_khach where ip_bam = v_bam and tao_luc > now() - interval '1 day') >= 15 then
      raise exception 'het_luot_hom_nay' using errcode = 'P0001'; end if;
  end if;
  if (select count(*) from public.p2d_cskh_khach where tao_luc > now() - interval '1 hour') >= 300 then
    raise exception 'gui_nhanh_qua' using errcode = 'P0001'; end if;
  v_ma := encode(extensions.gen_random_bytes(12), 'hex');
  insert into public.p2d_cskh_khach (ma, tai_khoan, lien_he, nhom, y, tieu_de, mo_ta, ngu_canh, ip_bam)
  values (v_ma, v_tk, v_lh, p_nhom, p_y, v_td, v_mt, coalesce(p_ngu_canh, '{}'::jsonb), v_bam)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'ma', v_ma);
end;
$$;

-- Xem lại tin đã gửi bằng các mã máy đang giữ (tối đa 20 mã)
create or replace function public.p2d_cskh_khach_xem(p_ma text[])
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'tieu_de', k.tieu_de, 'trang_thai', k.trang_thai, 'tra_loi', k.tra_loi, 'tao_luc', k.tao_luc) order by k.tao_luc desc), '[]'::jsonb)
  from (select * from public.p2d_cskh_khach
        where p_ma is not null and cardinality(p_ma) <= 20 and ma = any (p_ma)
        order by tao_luc desc limit 20) k
$$;

revoke all on function public.p2d_cskh_khach_gui(text, text, text, text, text, text, jsonb) from public;
revoke all on function public.p2d_cskh_khach_xem(text[]) from public;
grant execute on function public.p2d_cskh_khach_gui(text, text, text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.p2d_cskh_khach_xem(text[]) to anon, authenticated;

-- Tự kiểm tra
do $$
declare r jsonb; x jsonb;
begin
  r := public.p2d_cskh_khach_gui('thu_kiem', null, 'tk', 'quen-mk', 'Tài khoản · Quên mật khẩu', 'Tự kiểm tra migration CSKH khách', '{}'::jsonb);
  if (r ->> 'ma') is null or char_length(r ->> 'ma') <> 24 then raise exception 'kiem: thieu ma'; end if;
  x := public.p2d_cskh_khach_xem(array[r ->> 'ma']);
  if jsonb_array_length(x) <> 1 or (x -> 0 ->> 'trang_thai') <> 'moi' then raise exception 'kiem: xem sai %', x; end if;
  if jsonb_array_length(public.p2d_cskh_khach_xem(array['khong-co'])) <> 0 then raise exception 'kiem: lo tin nguoi khac'; end if;
  begin perform public.p2d_cskh_khach_gui(null, null, 'tk', 'quen-mk', 'Tài khoản · Quên', 'ngắn', null); raise exception 'kiem: nhan mo ta ngan';
  exception when sqlstate '22023' then null; end;
  begin perform public.p2d_cskh_khach_gui(null, null, 'TK;drop', 'x', 'Tài khoản · Quên', 'mô tả đủ dài rồi nhé', null); raise exception 'kiem: nhan nhom sai';
  exception when sqlstate '22023' then null; end;
  delete from public.p2d_cskh_khach where id = (r ->> 'id')::bigint;
end $$;
