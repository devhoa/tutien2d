// Bài thử máy chủ sư đồ + cơ duyên + tỉ lệ lò đan (migration 20261125030000_p2d_su_do_dan.sql, sinh bằng tools/su-do-sql.py): in một đoạn
// SQL chạy bằng execute_sql (Supabase MCP) hoặc psql trong MỘT giao dịch có ROLLBACK. Đóng vai hai tài khoản thử: claude_thu_a (đặt tạm cảnh
// giới 3 trong giao dịch: sư phụ), claude_thu_b (0: đồ đệ). Không dùng claude_kiem: tài khoản đó đang bị khoá, trigger p2d_chan_bi_cam chặn
// mọi lần ghi dòng nhân vật của nó khi đang đóng vai ai đó. Thử: lưu game sau migration (túi đủ mọi phẩm như
// tools/kiem/thu-luu.mjs), xin / nhận sư đồ, Chỉ điểm và Hành lễ một lần mỗi ngày, cách 2 cảnh giới, nhiệm vụ Hệ Thống « su-do » (có quan hệ
// mới nhận được), khách không gọi được, bảng kín; cấu hình lò (gốc 0,8, trừ 0,04 mỗi phẩm, có Tọa Vong Đan), trần ngày hai nguyên liệu cơ
// duyên, thứ tự nhiệm vụ (su-do chen sau luyen-khi-7, mốc quà giữ nguyên); luyện Tọa Vong Đan thật ở lò (hai bộ nguyên liệu, chưa biết đan:
// mẻ chỉ ra đúng Tọa Vong Đan), lưu bản lưu có khoá mới toaVong / coDuyen và 50 nguyên liệu cơ duyên (máy chủ giữ từ trần ngày tới 1,2 lần
// trần: quá trần thì phần vượt chỉ tính 20%, p2d_luu).
// Không gì được ghi.
// Nhận nhiệm vụ gọi qua p2d_ht_nhan như máy khách (p2d_ht_xong là hàm trong, authenticated không gọi thẳng được).
// Chạy: node tools/kiem/thu-su-do.mjs          → có kèm migration (thử TRƯỚC khi áp)
//       node tools/kiem/thu-su-do.mjs --sau    → không kèm (thử SAU khi áp)
// Đạt: dòng "dat" = true; từng dòng kq ghi kết quả / lỗi của mỗi bước.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const goc = p => resolve(import.meta.dirname, '../..', p);
const doc = p => JSON.parse(readFileSync(goc(p), 'utf8'));
const items = doc('data/items.json'), cave = doc('data/cave.json'), HT = doc('data/he-thong.json'), CD = doc('data/co-duyen.json');
const mig = process.argv.includes('--sau') ? '' : readFileSync(goc('supabase/migrations/20261125030000_p2d_su_do_dan.sql'), 'utf8');
const nv = HT.missions.map(m => m.id), viTri = nv.indexOf('su-do');
if (viTri < 1) throw new Error('data/he-thong.json thiếu nhiệm vụ su-do');
const rar = items.rarities.map(r => `'${r.id.replace(/'/g, "''")}'`).join(', '), base = Object.keys(items.bases)[0];
const la = ai => `reset role; select set_config('request.jwt.claims', json_build_object('sub', (select id from ai where ten = '${ai}'), 'role', 'authenticated')::text, true); set local role authenticated;`;
const step = (ten, sql) => `do $t$ begin insert into kq values ('${ten}', (${sql})::text); exception when others then insert into kq values ('${ten}', 'LOI ' || sqlerrm); end $t$;`;
const k = ai => `(select k from ai where ten = '${ai}')`;
const la_ = (ten, v) => `coalesce((select v = '${v}' from kq where ten = '${ten}'), false)`;
const loi = (ten, ma) => `coalesce((select v like 'LOI ${ma}%' from kq where ten = '${ten}'), false)`;
const tt = (ten, duong) => `(select v::jsonb #>> '{${duong}}' from kq where ten = '${ten}' and v like '{%')`;
const tran = CD.server.tran_ngay, TV = cave.pills['toa-vong-dan'];

console.log(`begin;
${mig}
create temp table ai on commit drop as select split_part(u.email, '@', 1) as ten, u.id, public.p2d_chat_key(u.id) as k
  from auth.users u where u.email in ('claude_thu_a@nguoichoi.invalid', 'claude_thu_b@nguoichoi.invalid');
create temp table kq (ten text, v text) on commit drop;
grant all on kq to authenticated, anon; grant select on ai to authenticated, anon;
delete from public.p2d_su_do where do_de in (select id from ai) or su_phu in (select id from ai);
delete from public.p2d_ht_diem where user_id in (select id from ai);
${la('claude_thu_a')}
${step('luu', `select public.p2d_luu2(
  (select data || jsonb_build_object('bag', (select jsonb_agg(jsonb_build_object('uid', 910000 + i, 'base', '${base}', 'rarity', r, 'lvl', 1, 'lines', '[]'::jsonb, 'sockets', '[]'::jsonb))
     from unnest(array[${rar}]) with ordinality as t(r, i))) from public.p2d_nhan_vat where user_id = auth.uid()),
  (select phien_ban from public.p2d_nhan_vat where user_id = auth.uid()))::text like '{%"pb"%'`)}
reset role; update public.p2d_nhan_vat set canh_gioi = 0 where user_id in (select id from ai);
${la('claude_thu_b')}
${step('gan_qua', `public.p2d_su_do_moi(${k('claude_thu_a')})`)}
reset role; update public.p2d_nhan_vat set canh_gioi = 3 where user_id = (select id from ai where ten = 'claude_thu_a');
${la('claude_thu_a')}
${step('tt_trong', 'public.p2d_su_do_tt()')}
${step('nv_chua', `public.p2d_ht_nhan('su-do')`)}
${la('claude_thu_b')}
${step('xin', `public.p2d_su_do_moi(${k('claude_thu_a')})`)}
${step('tu_minh', `public.p2d_su_do_moi(${k('claude_thu_b')})`)}
${la('claude_thu_a')}
${step('tt_loi_moi', 'public.p2d_su_do_tt()')}
${step('chi_diem_som', `public.p2d_su_do_chi_diem(${k('claude_thu_b')})`)}
${step('nhan', `public.p2d_su_do_moi(${k('claude_thu_b')})`)}
${step('chi_diem', `public.p2d_su_do_chi_diem(${k('claude_thu_b')})`)}
${step('chi_diem_2', `public.p2d_su_do_chi_diem(${k('claude_thu_b')})`)}
${step('su_hanh_le', 'public.p2d_su_do_hanh_le()')}
${la('claude_thu_b')}
${step('hanh_le', 'public.p2d_su_do_hanh_le()')}
${step('hanh_le_2', 'public.p2d_su_do_hanh_le()')}
${step('tt_do', 'public.p2d_su_do_tt()')}
${step('nv', `public.p2d_ht_nhan('su-do') -> 'qua'`)}
${step('nv_2', `public.p2d_ht_nhan('su-do')`)}
${la('claude_thu_a')}
${step('tt_su', 'public.p2d_su_do_tt()')}
${step('nv_su', `public.p2d_ht_nhan('su-do') ? 'diem'`)}
reset role; update public.p2d_su_do set chi_diem = chi_diem - 1, hanh_le = hanh_le - 1 where su_phu = (select id from ai where ten = 'claude_thu_a');
${la('claude_thu_a')}
${step('hom_sau', 'public.p2d_su_do_tt()')}
${step('roi', `public.p2d_su_do_roi(${k('claude_thu_b')})`)}
${step('co_sau_roi', 'public.p2d_su_do_co()')}
reset role;
update public.p2d_nhan_vat set data = jsonb_set(data, '{mats}', coalesce(data -> 'mats', '{}'::jsonb) || '${JSON.stringify(Object.fromEntries(Object.entries(TV.recipe).map(([id, n]) => [id, n * 2])))}'::jsonb),
  lo_ds = '[{"id": "thu", "k": 0, "ph": 0}]'::jsonb, lo_dung = 'thu' where user_id = (select id from ai where ten = 'claude_thu_a');
delete from public.p2d_nhip_lenh where user_id in (select id from ai);
${la('claude_thu_a')}
${step('luyen', `public.p2d_luyen_dan2('${JSON.stringify(Object.fromEntries(Object.entries(TV.recipe).map(([id, n]) => [id, n * 2])))}'::jsonb, null) -> 'ds'`)}
reset role;
insert into kq select 'sau_luyen', (select jsonb_build_object(${Object.keys(TV.recipe).map(id => `'${id}', data -> 'mats' -> '${id}'`).join(', ')}, 'biet', data -> 'lo' -> 'biet' ? 'toa-vong-dan')::text
  from public.p2d_nhan_vat where user_id = (select id from ai where ten = 'claude_thu_a'));
delete from public.p2d_nhip_lenh where user_id in (select id from ai);
${la('claude_thu_a')}
${step('luu_moi', `select public.p2d_luu2(
  (select jsonb_set(data, '{mats}', coalesce(data -> 'mats', '{}'::jsonb) || '${JSON.stringify(Object.fromEntries(Object.keys(tran).map(id => [id, 50])))}'::jsonb)
     || '{"toaVong": 9000, "coDuyen": {"ngay": "2026-11-25", "n": {"chu-qua": 1}, "hat": 123}}'::jsonb from public.p2d_nhan_vat where user_id = auth.uid()),
  (select phien_ban from public.p2d_nhan_vat where user_id = auth.uid()))::text`)}
reset role;
insert into kq select 'sau_luu', (select jsonb_build_object('toaVong', data -> 'toaVong', 'hat', data -> 'coDuyen' -> 'hat', ${Object.keys(tran).map(id => `'${id}', data -> 'mats' -> '${id}'`).join(', ')})::text
  from public.p2d_nhan_vat where user_id = (select id from ai where ten = 'claude_thu_a'));
set local role anon;
${step('khach', 'public.p2d_su_do_tt()')}
${step('bang_kin', 'select count(*) from public.p2d_su_do')}
reset role;
insert into kq select 'lo', jsonb_build_object('base', public.p2d_lo_cfg() -> 'base', 'phat_dan', public.p2d_lo_cfg() -> 'phat_dan', 'so_dan', (select count(*) from jsonb_object_keys(public.p2d_lo_cfg() -> 'dan')),
  'toa_vong', public.p2d_lo_cfg() -> 'dan' -> 'toa-vong-dan')::text;
insert into kq select 'tran', (select jsonb_object_agg(loai, tran) from public.p2d_tran_ngay where loai in (${Object.keys(tran).map(x => `'${x}'`).join(', ')}))::text;
insert into kq select 'thu_tu', jsonb_build_object('su_do', (select ord from public.p2d_ht_nv where id = 'su-do'), 'truoc', (select ord from public.p2d_ht_nv where id = '${nv[viTri - 1]}'),
  'sau', (select ord from public.p2d_ht_nv where id = '${nv[viTri + 1]}'), 'so', (select count(*) from public.p2d_ht_nv where id not like 'moc-%'),
  'trung', (select count(*) - count(distinct ord) from public.p2d_ht_nv), 'moc_nho_nhat', (select min(ord) from public.p2d_ht_nv where id like 'moc-%'))::text;
insert into kq select 'dat', (coalesce(
  ${la_('luu', 'true')}
  and ${tt('tt_trong', 'su_phu')} is null and ${tt('tt_trong', 'do_de')} = '[]'
  and ${loi('nv_chua', 'chua_xong')}
  and ${la_('xin', 'da_gui')} and ${loi('tu_minh', 'chinh_minh')} and ${loi('gan_qua', 'cach_canh_gioi')}
  and ${tt('tt_loi_moi', 'moi_toi,0,vai')} = 'do' and ${loi('chi_diem_som', 'khong_phai_do_de')}
  and ${la_('nhan', 'thanh_su_do')} and ${la_('chi_diem', 'da_chi_diem_xong')} and ${loi('chi_diem_2', 'da_chi_diem')} and ${loi('su_hanh_le', 'chua_co_su_phu')}
  and ${la_('hanh_le', 'da_hanh_le_xong')} and ${loi('hanh_le_2', 'da_hanh_le')}
  and ${tt('tt_do', 'su_phu,chi_diem')} = 'true' and ${tt('tt_do', 'su_phu,hanh_le')} = 'true'
  and (select v::jsonb = '${JSON.stringify(HT.missions[viTri].qua)}'::jsonb from kq where ten = 'nv') and ${loi('nv_2', 'da_nhan')} and ${la_('nv_su', 'true')}
  and ${tt('tt_su', 'do_de,0,hanh_le')} = 'true' and ${tt('tt_su', 'do_de,0,chi_diem')} = 'true'
  and ${tt('hom_sau', 'do_de,0,hanh_le')} = 'false' and ${tt('hom_sau', 'do_de,0,chi_diem')} = 'false'
  and ${la_('roi', 'da_roi')} and ${la_('co_sau_roi', '0')}
  and (select jsonb_array_length(v::jsonb) = 1 and v::jsonb #>> '{0,dan}' = 'toa-vong-dan' and (v::jsonb #>> '{0,bo}')::int = 2 from kq where ten = 'luyen' and v like '[%')
  and (select ${Object.keys(TV.recipe).map(id => `coalesce((v::jsonb ->> '${id}')::numeric, 0) = 0`).join(' and ')} from kq where ten = 'sau_luyen')
  and coalesce((select v like '{%"pb"%' from kq where ten = 'luu_moi'), false)
  and (select (v::jsonb ->> 'toaVong')::numeric = 9000 and (v::jsonb ->> 'hat')::numeric = 123 and ${Object.entries(tran).map(([id, n]) => `coalesce((v::jsonb ->> '${id}')::numeric, 0) between ${n} and ${Math.floor(n * 1.2)}`).join(' and ')} from kq where ten = 'sau_luu')
  and ${loi('khach', 'permission denied')} and ${loi('bang_kin', 'permission denied')}
  and (select (v::jsonb ->> 'base')::numeric = ${cave.lo.base} and (v::jsonb ->> 'phat_dan')::numeric = ${cave.lo.phat_dan} and (v::jsonb ->> 'so_dan')::int = ${Object.values(cave.pills).filter(d => d.recipe).length}
       and v::jsonb -> 'toa_vong' = '${JSON.stringify({ r: TV.recipe, m: TV.make || 1, p: TV.pham || 0 })}'::jsonb from kq where ten = 'lo')
  and (select v::jsonb = '${JSON.stringify(tran)}'::jsonb from kq where ten = 'tran')
  and (select (v::jsonb ->> 'su_do')::int = ${viTri} and (v::jsonb ->> 'truoc')::int = ${viTri - 1} and (v::jsonb ->> 'sau')::int = ${viTri + 1} and (v::jsonb ->> 'so')::int = ${nv.length}
       and (v::jsonb ->> 'trung')::int = 0 and (v::jsonb ->> 'moc_nho_nhat')::int >= 9000 from kq where ten = 'thu_tu'), false))::text;
select ten, left(v, 300) as v from kq;
rollback;`);
