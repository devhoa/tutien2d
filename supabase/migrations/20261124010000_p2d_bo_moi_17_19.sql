-- Bộ mới #17–19 (chủ dự án 24/11/2026 00:0x: "Trừ trang phục của bộ 17, còn lại hiệu ứng chớp mắt và thú cưỡi pháp tượng đều đưa hết lên game";
-- "Trang phục thì phải làm even mới có, thú cưỡi thì 15 lệnh thú mới đổi được"; "Pháp trượng thì farm là ra như bth").
--   1) Dòng 'cfg' của p2d_ky_cfg dựng lại bằng node tools/ky-cfg.mjs. So với bản đang chạy (20261123020000_p2d_sao_linh_thu.sql) chỉ thêm:
--      thu.cuoi.ids: hac-lang, tuong-lau, kinh-may; thu.cuoi.lenh_rieng: ba con đó 15 Thú Lệnh (data/pets.json → mounts.<mã>.lenh);
--      pool: pt-ngan-duc, pt-u-hoa-toa, pt-huyet-diem (pháp tượng #17–19, rơi khi farm như 16 cái cũ, máy chủ ký món theo pool này);
--      thu.thoi.bo: tp-18, tp-19 phẩm 3, cột 3 = true (quà sự kiện Nhập Tông Môn, mục 3: chỉ nhận bản do máy chủ ghi vào outfits, như bộ
--      Tiên Ngọc; tiệm thời trang hiện nhưng không bán). Bộ #17 không đưa lên.
--   2) p2d_doi_thu_cuoi: số Thú Lệnh trừ = thu.cuoi.lenh_rieng[p_id], không có thì thu.cuoi.lenh (7) như cũ. Phần còn lại giữ nguyên
--      (định nghĩa đang chạy = 20261119140000_p2d_thu_nhieu_ban.sql, đã so trên máy chủ 24/11/2026).
--   3) Sự kiện Nhập Tông Môn (chủ dự án 24/11/2026 00:32: "tham gia tông môn bất kỳ là nhận được trang phục này; trang phục cũng xuất
--      hiện trong cửa hàng thời trang nhưng không mua được mà chỉ nhận thông qua event"): bảng mới p2d_su_kien_nhan (một dòng mỗi người mỗi
--      sự kiện đã nhận, khoá chính chặn nhận hai lần, kể cả khi đã bán bộ đồ) và hàm p2d_sk_tm_nhan(): đang có dòng ở p2d_bang_tv (tông môn
--      bất kỳ, mọi chức) thì ghi 'tm_trang_phuc' rồi gửi mỗi bộ tp-18, tp-19 một thư quà {outfit, g} (ly_do 'sk_tong_mon'); nhận thư thì
--      p2d_nhan_thu_moi ghi bộ vào outfits như quà Hệ Thống. Danh sách bộ, mã khớp data/events.json → tong_mon (tools/check.mjs so).
-- Không đổi bảng cũ, không đụng dữ liệu người chơi (chỉ thêm bảng p2d_su_kien_nhan). Lùi: chạy lại dòng 'cfg' của 20261123020000_p2d_sao_linh_thu.sql và định nghĩa
-- p2d_doi_thu_cuoi của 20261119140000_p2d_thu_nhieu_ban.sql (thú cưỡi #17–19 ai đã đổi thì vẫn giữ trong bản lưu); sự kiện: revoke execute
-- p2d_sk_tm_nhan (bảng p2d_su_kien_nhan để lại, không xoá).

insert into public.p2d_ky_cfg (k, v) values ('cfg', '{"tay":{"base":120,"realm_mul":1.45,"r":1.3,"decay":0,"line_mul":2,"cost":2,"free":1,"pham_k":0.015},"mau":[[1,40],[1.3,28],[1.7,17],[2.2,9],[2.8,4],[3.6,1.6],[4.6,0.4]],"tu_pham":{"pham":0,"linh":0,"huyen":1,"dia":2,"thien":3},"cap_w":[8,12,14,15,14,12,10,7,5,3],"lpl":0.08,"cs":{"atk":[2,6,false],"atk_pct":[3,8,true],"hp":[10,30,false],"hp_pct":[4,10,true],"def":[1,4,false],"crit":[2,5,true],"crit_dmg":[8,20,true],"cdr":[2,6,true],"speed":[2,5,true],"qi_gain":[4,10,true]},"pool":{"thiet-kiem":["atk","atk_pct","crit","crit_dmg","cdr","speed"],"thanh-van-kiem":["atk","atk_pct","crit","crit_dmg","cdr","qi_gain"],"bo-y":["hp","hp_pct","def","speed","cdr","qi_gain"],"huyen-giap":["hp","hp_pct","def","crit","atk"],"pt-thuong-lang":["atk_pct","hp_pct","crit","crit_dmg","qi_gain","cdr"],"pt-tu-nguyet":["cdr","atk_pct","crit","qi_gain","hp_pct"],"pt-phan-lien":["hp_pct","def","qi_gain","cdr"],"pt-tu-tinh":["crit_dmg","crit","atk_pct","cdr"],"pt-bang-lien":["qi_gain","cdr","speed","hp","atk"],"pt-thuy-long":["hp_pct","atk_pct","qi_gain","cdr"],"pt-phuong-hoang":["atk_pct","crit_dmg","crit","qi_gain"],"pt-tinh-lien":["qi_gain","hp_pct","cdr","def"],"thiet-thuong":["atk","atk_pct","crit","crit_dmg","speed","hp"],"ba-tieu-phien":["atk","atk_pct","cdr","qi_gain","crit","hp_pct"],"moc-cam":["atk_pct","cdr","qi_gain","crit","hp","def"],"tu-nguyet-liem":["atk","atk_pct","crit","crit_dmg","cdr","speed"],"truc-cung":["atk","atk_pct","crit","crit_dmg","speed","cdr"],"thien-mach-kiem":["atk","atk_pct","crit","crit_dmg","cdr","qi_gain"],"bo-hai":["speed","hp","def","cdr","qi_gain"],"van-van-ngoa":["speed","crit","atk","hp_pct","cdr"],"bo-can":["hp","def","cdr","qi_gain","crit"],"thiet-khoi":["def","hp","hp_pct","crit","atk"],"thiet-gioi":["crit","crit_dmg","atk","atk_pct","def"],"linh-ngoc-gioi":["crit","crit_dmg","qi_gain","hp_pct","cdr"],"kim-luan":["atk","atk_pct","cdr","crit"],"tran-yeu-thap":["hp","hp_pct","def","cdr"],"hoa-hon-linh":["atk_pct","crit_dmg","cdr","qi_gain"],"xich-diem-giap":["hp","hp_pct","def","atk_pct"],"xich-diem-hai":["speed","atk","crit"],"xich-diem-quan":["crit","atk","atk_pct"],"xich-diem-gioi":["crit","crit_dmg","atk_pct"],"pt-hoa-long":["atk_pct","crit_dmg","qi_gain"],"han-bang-giap":["hp","hp_pct","def","cdr"],"han-bang-hai":["speed","def","hp"],"han-bang-quan":["def","hp","hp_pct"],"han-bang-gioi":["crit","cdr","hp_pct"],"pt-bang-tinh-hoan":["hp_pct","def","qi_gain"],"hac-phong-giap":["hp","speed","cdr","atk_pct"],"hac-phong-hai":["speed","cdr","crit"],"hac-phong-quan":["crit","cdr","speed"],"hac-phong-gioi":["crit","crit_dmg","cdr"],"pt-tu-diem-duc":["cdr","atk_pct","qi_gain"],"thanh-moc-bao":["hp","hp_pct","def","qi_gain"],"thanh-moc-hai":["speed","hp_pct","def"],"thanh-moc-quan":["hp","hp_pct","qi_gain"],"thanh-moc-gioi":["crit","crit_dmg","hp_pct"],"pt-thanh-dang":["qi_gain","hp_pct","def"],"kim-cang-giap":["def","hp_pct","atk_pct"],"kim-cang-hai":["speed","atk_pct","crit"],"kim-cang-quan":["crit","crit_dmg","atk_pct"],"kim-cang-gioi":["crit","crit_dmg","atk_pct"],"pt-kim-kiem-tran":["atk_pct","crit_dmg","cdr"],"hau-tho-giap":["hp","def","hp_pct"],"hau-tho-hai":["def","speed","hp_pct"],"hau-tho-quan":["def","hp","hp_pct"],"hau-tho-gioi":["hp_pct","def","crit"],"pt-kim-duong":["def","hp_pct","qi_gain"],"dao-van-binh":["atk","atk_pct","crit","crit_dmg","cdr"],"dao-van-quan":["crit","crit_dmg","atk_pct","hp_pct"],"dao-van-bao":["hp","hp_pct","def","atk_pct"],"pt-kim-diem-quan":["atk_pct","crit_dmg","cdr","qi_gain"],"dao-van-hai":["speed","crit","cdr","atk_pct"],"dao-van-gioi":["crit","crit_dmg","atk_pct","hp_pct"],"dao-van-an":["atk","atk_pct","cdr","crit"],"thai-hu-giap":["hp","hp_pct","cdr","atk_pct"],"thai-hu-hai":["speed","cdr","crit"],"thai-hu-quan":["crit","cdr","atk_pct"],"thai-hu-gioi":["crit","crit_dmg","atk_pct"],"pt-tinh-van":["cdr","atk_pct","qi_gain"],"pt-ngan-duc":["hp_pct","def","cdr","qi_gain"],"pt-u-hoa-toa":["crit_dmg","crit","atk_pct","cdr"],"pt-huyet-diem":["atk_pct","crit","crit_dmg","qi_gain"]},"cuong":{"max":20,"iron":[1,2,3,4,5,6,8,10,12,15,18,21,25,30,36,43,51,61,73,87],"stones":[0,0,0,0,1,1,2,2,3,4,5,6,7,8,9,11,13,15,17,20],"coins":[0,0,0,0,0,0,0,0,0,0,2000,2700,3600,4900,6600,8900,12000,16200,21900,29500],"rate":[1,1,0.95,0.85,0.75,0.65,0.55,0.45,0.35,0.25,0.22,0.2,0.18,0.16,0.14,0.12,0.11,0.1,0.09,0.08],"drop_from":7,"drop_chance":0.5,"open":{"base":10,"from_realm":2,"per_realm":2}},"he":["moc","hoa","thuy","kim","tho"],"doi_he":{"mat":"dao-van-thach","n":1},"ngoc":{"types":["hong-ngoc","lam-ngoc","hoang-ngoc","luc-ngoc"],"max":20,"merge":3,"phi":[30,2.5],"lo":{"max_lv":4,"toc_phut":20,"tran":600},"truyen":[[3,"hong-ngoc:5"],[4,"lam-ngoc:5"],[6,"hoang-ngoc:5"],[10,"luc-ngoc:5"]],"zalo":5},"pb_max":20,"luyen":{"base":3,"r":1.35,"mat":"manh-phap-bao","bases":["kim-luan","tran-yeu-thap","hoa-hon-linh","dao-van-an"]},"roi":{"thu_tu":["pham","linh","huyen","dia","thien","tien","thuong-co"],"phut":{"pham":20,"linh":10,"huyen":6,"dia":3,"thien":1,"tien":0,"thuong-co":0},"gio":{"pham":30,"linh":15,"huyen":12,"dia":6,"thien":3,"tien":0.25,"thuong-co":0},"tran":{"pham":400,"linh":300,"huyen":250,"dia":150,"thien":80,"tien":5,"thuong-co":0},"mau":{"t":5,"phut":0.2,"gio":1,"tran":20},"dong":1,"tang":9,"nang":2,"nho":60},"thu":{"pet":{"ids":["moc-linh","ma-tieu","hoa-lang","viem-linh","ma-cung","tuyet-lang","moc-yeu","kiem-hon","tho-khoi","hu-anh","phong-yeu","bang-tinh"],"max":20,"evo_max":40,"evo_lv":20,"evo_lt":600,"evo_mats":{"yeu-huyet":12,"tinh-thiet":8},"exp":[40,1.35],"starter":"moc-linh"},"comp":{"ids":["tieu-hoa","ho-linh","thanh-diep","mac-anh","thach-sinh","thiet-lan","kl-dong-phuc","kl-thanh-sam","kl-hac-y","kl-hong-y","kl-bach-kiem-bao","kl-tu-liem-y","kl-huyet-giap","kl-bi-ngo","kl-tuyet-lanh","kl-tien-nhan","kl-hoang-kim","kl-tet-do","kl-thien-mach-bao","kl-bang-y-han-bang","kl-luc-bao-thanh-moc","kl-tho-bao-hau-tho","kl-than-nguyen-y","kl-huyet-nguyet","kl-tu-linh-ma-yeu","kl-ly-hoa"],"max":30,"exp":[60,1.4],"gia":{"tieu-hoa":8000,"ho-linh":8000,"thanh-diep":10000,"mac-anh":12000,"thach-sinh":15000,"thiet-lan":18000,"kl-dong-phuc":40000,"kl-thanh-sam":40000,"kl-hac-y":40000,"kl-hong-y":40000,"kl-bach-kiem-bao":40000,"kl-tu-liem-y":40000,"kl-huyet-giap":40000,"kl-bi-ngo":40000,"kl-tuyet-lanh":40000,"kl-tien-nhan":40000,"kl-hoang-kim":40000,"kl-tet-do":40000,"kl-thien-mach-bao":40000,"kl-bang-y-han-bang":40000,"kl-luc-bao-thanh-moc":40000,"kl-tho-bao-hau-tho":40000,"kl-than-nguyen-y":40000,"kl-huyet-nguyet":40000,"kl-tu-linh-ma-yeu":40000,"kl-ly-hoa":40000}},"tech":{"ids":["kiem-tong-tam-phap","truong-sinh-quyet","kim-chung-trao","huyet-ma-kinh","loi-am-quyet","phong-hanh-thuat","ngu-hanh-quy-nguyen","thai-thuong-vong-tinh","huyen-bang-quyet","han-phong-bo","hac-phong-quyet","thanh-moc-truong-xuan","canh-kim-kiem-quyet","hau-tho-quyet","thai-hu-quyet","canh-kim-tu-linh","thanh-moc-duong-linh","bich-hai-hoi-linh","xich-viem-luyen-linh","hau-tho-tang-linh","van-linh-quy-nguyen"],"max":10,"exp":[40,1.6],"slots":3,"starter":"kiem-tong-tam-phap"},"cuoi":{"ids":["cuu-vi-ho","rua-non-bo","su-thuu","huou-sao","hoa-long","rua-nam","meo-co-quan","ca-voi-may","coc-sen","ho-pha-le","phuong-hoang","sua-den-long","su-tu-da","bach-tuoc","huou-may","nhen-pha-le","hac-lang","tuong-lau","kinh-may"],"gia":{},"roi":[],"starter":null,"lenh":7,"lenh_ngay":10,"lenh_rieng":{"hac-lang":15,"tuong-lau":15,"kinh-may":15}},"dong":{"pool":["atk","hp","def","crit","crit_dmg","atk_pct","hp_pct"],"phi":[500,2],"mats":{"linh-thao":3},"mpool":["atk_pct","hp_pct","crit","crit_dmg","cdr","speed","qi_gain"],"mphi":3000,"mmats":{"linh-thao":5}},"thoi":{"pool":["atk_pct","hp_pct","crit","crit_dmg","cdr","speed","qi_gain"],"bo":{"tp-02":[0,null,null,false,null],"tp-10":[0,null,null,false,null],"tp-05":[0,null,null,false,null],"tp-07":[0,null,null,false,null],"tp-08":[0,null,null,false,null],"tp-16":[0,null,null,false,null],"tp-01":[5,null,50000,false,null],"tp-09":[5,null,50000,false,null],"tp-11":[5,null,50000,false,null],"tp-04":[5,null,50000,false,null],"tp-06":[5,null,50000,false,null],"tp-13":[5,null,50000,false,null],"tp-14":[5,null,50000,false,null],"tp-03":[5,null,50000,false,null],"tp-12":[5,null,50000,false,null],"tp-15":[5,null,50000,false,null],"tp-18":[3,null,null,true,null],"tp-19":[3,null,null,true,null]},"look":["nam","nu"],"def":"nam","tn":{}},"chieu":{"ids":["kiem-khi","dang-phuoc","hoi-xuan","hoa-cau","liet-diem","bang-truy","thuy-thuan","kim-quang-tram","kim-cuong-the","dia-chan","thach-giap","van-moc-cham","thanh-moc-vuc","luc-dang-long","truong-xuan","hoa-long","phan-thien","liet-hoa-tran","phuong-hoang","bang-phong","thuy-long","han-bang-vuc","bang-phach","van-kiem","kim-luan","loi-dinh","kim-than","luu-sa","thach-chuy","son-nhac","dai-dia","long-thuong","cuong-phong","that-huyen","tu-nguyet-liem","song-nguyet-tram","tu-nguyet-luan","lien-chau","phap-kim-luan","phap-thanh-moc","phap-huyen-thuy","phap-tran-yeu","phap-hoa-hon","thiem-anh","vo-anh","van-kiem-thien","pha-thien","thien-phat"],"max":30,"mat":"bi-kip-chieu","book":[1,1.25],"coins":[150,1.3]},"dong_phu":[[1,300,{"tinh-thiet":10,"linh-thao":10}],[2,1000,{"tinh-thiet":20,"hoa-linh-chi":8}],[3,3000,{"tinh-thiet":35,"yeu-huyet":20}],[4,8000,{"tinh-thiet":60,"yeu-vuong-dan":1}]],"sv":{"exp_k":{"pet":1,"comp":1.6,"tech":6},"sao":{"phut":15,"tran":900},"moi":{"phut":0.05,"tran":3},"cuoi":{"phut":0.0042,"tran":2},"cp_moi":{"phut":1.5,"tran":30},"ban":{"giay":20,"tran":60000,"toc_giay":7200},"dau":0.34}}}'::jsonb)
on conflict (k) do update set v = excluded.v;

create or replace function public.p2d_doi_thu_cuoi(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid := public.p2d_uid(); v_c jsonb := (select v -> 'thu' -> 'cuoi' from public.p2d_ky_cfg where k = 'cfg');
  v_n int; v_tl int; v_d jsonb; v_m jsonb; v_pb int; v_key text; v_cu text;
begin
  if v_uid is null then raise exception 'chua_dang_nhap' using errcode = '42501'; end if;
  v_n := coalesce((v_c -> 'lenh_rieng' ->> p_id)::int, (v_c ->> 'lenh')::int, 7);   -- giá riêng từng con (bộ mới #17–19: 15), không có thì giá chung
  if not coalesce((v_c -> 'ids') ? p_id, false) then raise exception 'khong_co' using errcode = '22023'; end if;
  select thu_lenh into v_tl from public.p2d_ht_diem where user_id = v_uid for update;
  if coalesce(v_tl, 0) < v_n then raise exception 'thieu' using errcode = '22023'; end if;
  select data into v_d from public.p2d_nhan_vat where user_id = v_uid for update;
  if v_d is null then raise exception 'chua_luu' using errcode = '22023'; end if;
  v_m := case when jsonb_typeof(v_d -> 'mounts') = 'object' then v_d -> 'mounts' else '{}'::jsonb end;
  v_key := p_id;
  if v_m ? p_id then v_key := p_id || '#' || substr(md5(random()::text || clock_timestamp()::text), 1, 6); end if;   -- đã có: bản thêm
  update public.p2d_ht_diem set thu_lenh = thu_lenh - v_n, luc = now() where user_id = v_uid returning thu_lenh into v_tl;
  v_d := jsonb_set(v_d, '{mounts}', v_m || jsonb_build_object(v_key, true));
  v_cu := coalesce(v_d ->> 'mount', '');
  if not exists (select 1 from jsonb_object_keys(v_m) k where split_part(k, '#', 1) = v_cu) then
    v_d := jsonb_set(v_d, '{mount}', to_jsonb(p_id)); v_d := jsonb_set(v_d, '{mountKey}', to_jsonb(v_key));
  end if;
  update public.p2d_nhan_vat set data = v_d, phien_ban = phien_ban + 1, updated_at = now() where user_id = v_uid returning phien_ban into v_pb;
  return jsonb_build_object('thu_lenh', v_tl, 'mount', p_id, 'key', v_key, 'phien_ban', v_pb);
end;
$$;

create table if not exists public.p2d_su_kien_nhan (
  user_id uuid not null references auth.users (id) on delete cascade,
  ma      text not null check (ma ~ '^[a-z0-9_]{1,40}$'),
  luc     timestamptz not null default now(),
  primary key (user_id, ma)
);
alter table public.p2d_su_kien_nhan enable row level security;
revoke all on table public.p2d_su_kien_nhan from anon, authenticated;
create or replace trigger p2d_giu_truncate before truncate on public.p2d_su_kien_nhan for each statement execute function public.p2d_chan_truncate();   -- giữ móng nhà (20261107020000)

create or replace function public.p2d_sk_tm_nhan()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid := public.p2d_uid(); v_g text; v_o text; v_n integer := 0;
begin
  if v_uid is null then raise exception 'chua_dang_nhap' using errcode = '42501'; end if;
  if not exists (select 1 from public.p2d_bang_tv where user_id = v_uid) then return jsonb_build_object('ok', false, 'ly_do', 'chua_vao'); end if;
  insert into public.p2d_su_kien_nhan (user_id, ma) values (v_uid, 'tm_trang_phuc') on conflict do nothing;
  if not found then return jsonb_build_object('ok', false, 'ly_do', 'da_nhan'); end if;
  select data ->> 'look' into v_g from public.p2d_nhan_vat where user_id = v_uid;
  if v_g is null or v_g not in ('nam', 'nu') then v_g := 'nam'; end if;   -- bộ có hình riêng: bản giới nào cũng mặc được
  foreach v_o in array array['tp-18', 'tp-19'] loop
    insert into public.p2d_hom_thu (user_id, noi_dung, ly_do) values (v_uid, jsonb_build_object('outfit', v_o, 'g', v_g), 'sk_tong_mon');
    v_n := v_n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'n', v_n);
end;
$$;
revoke all on function public.p2d_sk_tm_nhan() from public, anon;
grant execute on function public.p2d_sk_tm_nhan() to authenticated;
