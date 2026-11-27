// Bài thử máy chủ câu cá (migration 20261124030000_p2d_cau_ca.sql, sinh bằng tools/cau-ca-sql.py): in một đoạn SQL chạy bằng execute_sql
// (Supabase MCP) hoặc psql trong MỘT giao dịch có ROLLBACK, đóng vai tài khoản thử claude_thu_a (đặt tạm về Luyện Khí trong giao dịch):
// bán cá, châu cho Lão Ngư Ông (giá theo cảnh giới, rẻ trước, dừng ở trần ngày, một con không quá trần ngày), khai trai (châu, ngọc do máy chủ
// quay), mồi / cần không thu, Mua nhanh thôi bán cá, quầy bán mồi, 1 lần / giây, khách không gọi được. Không gì được ghi.
// Chạy: node tools/kiem/thu-cau-ca.mjs          → có kèm migration (thử TRƯỚC khi áp)
//       node tools/kiem/thu-cau-ca.mjs --sau    → không kèm (thử SAU khi áp)
// Đạt: dòng "dat" = true; từng dòng kq ghi kết quả / lỗi của mỗi bước.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const goc = p => resolve(import.meta.dirname, '../..', p);
const F = JSON.parse(readFileSync(goc('data/fishing.json'), 'utf8'));
const mig = process.argv.includes('--sau') ? '' : readFileSync(goc('supabase/migrations/20261124030000_p2d_cau_ca.sql'), 'utf8');
const who = "(select id from auth.users where email = 'claude_thu_a@nguoichoi.invalid')";
const g = id => F.ban.gia[id];
const tran0 = F.ban.tran[0];
const QUY = Object.keys(F.ban.gia).find(id => F.ban.gia[id] > tran0);   // một con đắt hơn trần ngày Luyện Khí
if (!QUY) throw new Error('không có loài nào đắt hơn trần ngày để thử');
// mỗi bước gọi p2d_cau_doi xoá mốc 1 giây trước (đóng vai người chờ đủ 1 giây), trừ bước thử chính luật đó
const mo1s = `reset role; delete from public.p2d_nhip_lenh where user_id = ${who} and lenh = 'p2d_cau_doi'; set local role authenticated;`;
const step = (ten, sql, cho = true) => `${cho ? mo1s + '\n' : ''}do $t$ begin insert into kq values ('${ten}', (${sql})::text); exception when others then insert into kq values ('${ten}', 'LOI ' || sqlerrm); end $t$;`;
const xu = ten => `(select (v::jsonb #>> '{them,coins}')::numeric from kq where ten = '${ten}' and v like '{%')`;   // Linh Thạch nhận ở bước đó
const loi = (ten, ma) => `coalesce((select v like 'LOI ${ma}%' from kq where ten = '${ten}'), false)`;
const cau = (ban, mo) => `public.p2d_cau_doi('${JSON.stringify(ban)}'::jsonb, '${JSON.stringify(mo)}'::jsonb)`;
console.log(`begin;
${mig}
update public.p2d_nhan_vat set canh_gioi = 0, data = jsonb_set(jsonb_set(data, '{realm}', '0'), '{mats}', coalesce(data -> 'mats', '{}'::jsonb) || '{"linh-ngu": 50, "tran-chau": 4, "co-bang": 3, "kim-ly": 100, "giun-dat": 3, "${QUY}": 2}'::jsonb) where user_id = ${who};
delete from public.p2d_cau_ban where user_id = ${who};
create temp table kq (ten text, v text) on commit drop;
grant all on kq to authenticated, anon;
select set_config('request.jwt.claims', json_build_object('sub', ${who}, 'role', 'authenticated')::text, true);
set local role authenticated;
${step('ban', cau({ 'linh-ngu': 5, 'tran-chau': 2 }, {}))}
${step('qua_nhanh', cau({ 'linh-ngu': 1 }, {}), false)}
${step('khai', cau({}, { 'co-bang': 3 }))}
${step('moi_khong_thu', cau({ 'giun-dat': 1 }, {}))}
${step('trai_khong_thu', cau({ 'co-bang': 1 }, {}))}
${step('ban_qua_so_co', cau({ 'linh-ngu': 99999 }, {}))}
${step('tran', cau({ 'kim-ly': 100 }, {}))}
${step('het_tran', cau({ 'kim-ly': 1 }, {}))}
${step('mua_moi', `public.p2d_nl_mua('{"giun-dat": 10}'::jsonb, false)`)}
${step('mua_ca', `public.p2d_nl_mua('{"linh-ngu": 1}'::jsonb, false)`)}
${step('trong', cau({}, {}))}
reset role; update public.p2d_cau_ban set lt = ${tran0 - g('kim-ly') - g('tran-chau')} where user_id = ${who}; set local role authenticated;
${step('re_truoc', cau({ 'kim-ly': 1, 'tran-chau': 2 }, {}))}
reset role; delete from public.p2d_cau_ban where user_id = ${who}; set local role authenticated;
${step('quy', cau({ [QUY]: 2 }, {}))}
reset role; set local role anon;
${step('khach', cau({ 'linh-ngu': 1 }, {}), false)}
reset role; set local role authenticated;
insert into kq select 'cuoi', jsonb_build_object('mats', (select jsonb_build_object('linh-ngu', data -> 'mats' -> 'linh-ngu', 'tran-chau', data -> 'mats' -> 'tran-chau', 'co-bang', data -> 'mats' -> 'co-bang', 'kim-ly', data -> 'mats' -> 'kim-ly', 'giun-dat', data -> 'mats' -> 'giun-dat', '${QUY}', data -> 'mats' -> '${QUY}') from public.p2d_nhan_vat where user_id = auth.uid()),
  'gems', (select data -> 'gems' from public.p2d_nhan_vat where user_id = auth.uid()), 'lt', (select data -> 'lingshi' from public.p2d_nhan_vat where user_id = auth.uid()))::text;
reset role;
insert into kq select 'ngay', (select lt from public.p2d_cau_ban where user_id = ${who})::text;
insert into kq select 'dat', (
  coalesce(${xu('ban')} = ${5 * g('linh-ngu') + 2 * g('tran-chau')}
  and ${loi('qua_nhanh', 'qua_nhanh')}
  and (select v::jsonb #>> '{tru,mats,co-bang}' from kq where ten = 'khai') = '3'
  and ${loi('moi_khong_thu', 'khong_thu')}
  and ${loi('trai_khong_thu', 'khong_thu')}
  and ${xu('ban_qua_so_co')} = ${45 * g('linh-ngu')}
  and ${xu('tran')} = ${Math.floor((tran0 - 5 * g('linh-ngu') - 2 * g('tran-chau') - 45 * g('linh-ngu')) / g('kim-ly')) * g('kim-ly')}
  and ${xu('het_tran')} = 0
  and (select (v::jsonb #>> '{tru,coins}')::numeric from kq where ten = 'mua_moi') = ${10 * F.moi['giun-dat'].gia}
  and ${loi('mua_ca', 'khong_ban')}
  and ${loi('trong', 'du_lieu_sai')}
  and ${xu('re_truoc')} = ${2 * g('tran-chau')}   -- rẻ trước: còn đúng giá 1 kim lý + 1 trân châu thì bán 2 trân châu, giữ kim lý
  and (select v::jsonb #> '{tru,mats}' ? 'kim-ly' from kq where ten = 're_truoc') = false
  and ${xu('quy')} = ${tran0}
  and (select v::jsonb #>> '{tru,mats,${QUY}}' from kq where ten = 'quy') = '1'
  and (select v::numeric from kq where ten = 'ngay') = ${tran0}
  and ${loi('khach', 'permission denied')}, false))::text;
select ten, left(v, 400) as v from kq;
rollback;`);
