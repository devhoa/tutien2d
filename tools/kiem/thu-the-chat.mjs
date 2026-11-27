// Bài thử máy chủ Thể chất (migration 20261125060000_p2d_the_chat.sql, sinh bằng tools/the-chat-sql.py; docs/20-THE-CHAT.md): in một đoạn SQL
// chạy bằng execute_sql (Supabase MCP) hoặc psql trong MỘT giao dịch có ROLLBACK. Đóng vai hai tài khoản thử: claude_thu_a (đặt tạm Kim Đan
// trong giao dịch) và claude_thu_b (giữ Luyện Khí). Không dùng claude_kiem (đang bị khoá, trigger p2d_chan_bi_cam chặn).
// Thử: Luyện Khí gọi quay bị từ chối; Kim Đan quay ra mã có trong bảng, gọi lại ra đúng mã đó; lưu đúng mã thì không sửa gì; lưu mã khác thì
// máy chủ đè lại, trả sửa, ghi một nghi vấn; bỏ khoá thì máy chủ trả lại; Luyện Khí tự gắn mã Tiên phẩm thì bị gỡ; Hồ sơ trả theChat; khách
// không gọi được, bảng chỉ đọc được dòng của mình, không ghi được; lưu game bình thường (túi đủ mọi phẩm như tools/kiem/thu-luu.mjs) vẫn chạy;
// dòng cấu hình 'tc' đúng như data.
// Không gì được ghi.
// Chạy: node tools/kiem/thu-the-chat.mjs          → có kèm migration (thử TRƯỚC khi áp)
//       node tools/kiem/thu-the-chat.mjs --sau    → không kèm (thử SAU khi áp)
// Đạt: dòng "dat" = true; từng dòng kq ghi kết quả / lỗi của mỗi bước.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tcCfg } from '../ky-cfg.mjs';

const goc = p => resolve(import.meta.dirname, '../..', p);
const doc = p => JSON.parse(readFileSync(goc(p), 'utf8'));
const items = doc('data/items.json'), C = doc('data/the-chat.json'), cfg = tcCfg(f => doc(`data/${f}`));
const mig = process.argv.includes('--sau') ? '' : readFileSync(goc('supabase/migrations/20261125060000_p2d_the_chat.sql'), 'utf8');
const rar = items.rarities.map(r => `'${r.id.replace(/'/g, "''")}'`).join(', '), base = Object.keys(items.bases)[0];
const tien = Object.keys(C.the).filter(id => C.the[id].pham === C.pham.length - 1);   // hai mã Tiên phẩm để thử gắn bậy
const la = ai => `reset role; delete from public.p2d_nhip_lenh where user_id in (select id from ai); select set_config('request.jwt.claims', json_build_object('sub', (select id from ai where ten = '${ai}'), 'role', 'authenticated')::text, true); set local role authenticated;`;
const step = (ten, sql) => `do $t$ begin insert into kq values ('${ten}', (${sql})::text); exception when others then insert into kq values ('${ten}', 'LOI ' || sqlerrm); end $t$;`;
const lenh = (ten, sql) => `do $t$ begin ${sql}; insert into kq values ('${ten}', 'chay_duoc'); exception when others then insert into kq values ('${ten}', 'LOI ' || sqlerrm); end $t$;`;   // lệnh ghi (không trả giá trị)
const k = ai => `(select k from ai where ten = '${ai}')`;
const id = ai => `(select id from ai where ten = '${ai}')`;
const la_ = (ten, v) => `coalesce((select v = '${v}' from kq where ten = '${ten}'), false)`;
const loi = (ten, ma) => `coalesce((select v like 'LOI ${ma}%' from kq where ten = '${ten}'), false)`;
const luu = sua => `select public.p2d_luu2((select ${sua} from public.p2d_nhan_vat where user_id = auth.uid()), (select phien_ban from public.p2d_nhan_vat where user_id = auth.uid()))`;
const ma = `(select v::jsonb ->> 'ma' from kq where ten = 'quay')`;
const khac = `(select case when ${ma} = '${tien[0]}' then '${tien[1]}' else '${tien[0]}' end)`;

console.log(`begin;
${mig}
create temp table ai on commit drop as select split_part(u.email, '@', 1) as ten, u.id, public.p2d_chat_key(u.id) as k
  from auth.users u where u.email in ('claude_thu_a@nguoichoi.invalid', 'claude_thu_b@nguoichoi.invalid');
create temp table kq (ten text, v text) on commit drop;
grant all on kq to authenticated, anon; grant select on ai to authenticated, anon;
delete from public.p2d_the_chat where user_id in (select id from ai);
-- claude_thu_a lên Kim Đan trong giao dịch (p2d.lk_tru: trigger linh khí bỏ qua lần đặt này, như lúc máy chủ tự chỉnh tu vi)
select set_config('p2d.lk_tru', '1', true);
update public.p2d_nhan_vat set data = jsonb_set(jsonb_set(data, '{realm}', '2'), '{layer}', '1') - 'theChat', canh_gioi = 2, tang = 1 where user_id = ${id('claude_thu_a')};
update public.p2d_nhan_vat set data = data - 'theChat' where user_id = ${id('claude_thu_b')};
select set_config('p2d.lk_tru', '', true);
insert into kq select 'dau_' || a.ten, jsonb_build_object('realm', n.data -> 'realm', 'canh_max', n.canh_max, 'nghi_van', n.nghi_van)::text from ai a join public.p2d_nhan_vat n on n.user_id = a.id;
${la('claude_thu_b')}
${step('thap', 'public.p2d_quay_the_chat()')}
${la('claude_thu_a')}
${step('quay', 'public.p2d_quay_the_chat()')}
${step('quay_2', 'public.p2d_quay_the_chat()')}
${step('bang_minh', 'select count(*) from public.p2d_the_chat')}
${lenh('ghi_bang', `insert into public.p2d_the_chat (user_id, ma) values (${id('claude_thu_b')}, '${tien[0]}')`)}
${lenh('sua_bang', `update public.p2d_the_chat set ma = '${tien[0]}'`)}
${lenh('xoa_bang', `delete from public.p2d_the_chat`)}
${step('luu_dung', luu(`data || jsonb_build_object('theChat', ${ma})`))}
${la('claude_thu_a')}
${step('luu_khac', luu(`data || jsonb_build_object('theChat', ${khac})`))}
${la('claude_thu_a')}
${step('luu_khac_2', luu(`data || jsonb_build_object('theChat', ${khac})`))}
${la('claude_thu_a')}
${step('luu_bo', luu(`data - 'theChat'`))}
${la('claude_thu_a')}
${step('luu_tui', `${luu(`data || jsonb_build_object('bag', (select jsonb_agg(jsonb_build_object('uid', 910000 + i, 'base', '${base}', 'rarity', r, 'lvl', 1, 'lines', '[]'::jsonb, 'sockets', '[]'::jsonb))
     from unnest(array[${rar}]) with ordinality as t(r, i)))`)}::text like '{%"pb"%'`)}
${step('ho_so_minh', `public.p2d_xem_nguoi(${k('claude_thu_a')}) -> 'save' -> 'theChat'`)}
${la('claude_thu_b')}
${step('ho_so_nguoi', `public.p2d_xem_nguoi(${k('claude_thu_a')}) -> 'save' -> 'theChat'`)}
${step('bang_nguoi', 'select count(*) from public.p2d_the_chat')}
${step('gan_bay', luu(`data || '{"theChat": "${tien[0]}"}'::jsonb`))}
reset role;
insert into kq select 'sau_' || a.ten, jsonb_build_object('the', n.data -> 'theChat', 'nghi_van', n.nghi_van, 'dong', (select t.ma from public.p2d_the_chat t where t.user_id = a.id),
  'nv', (select count(*) from public.p2d_nghi_van x where x.user_id = a.id and x.ly_do = 'the_chat' and x.luc > now() - interval '1 minute'))::text from ai a join public.p2d_nhan_vat n on n.user_id = a.id;
set local role anon;
${step('khach', 'public.p2d_quay_the_chat()')}
${step('khach_bang', 'select count(*) from public.p2d_the_chat')}
reset role;
insert into kq select 'cfg', (select v::text from public.p2d_ky_cfg where k = 'tc');
insert into kq select 'dat', (coalesce(
  (select (v::jsonb ->> 'realm')::int = 2 and (v::jsonb ->> 'canh_max')::int = 2 from kq where ten = 'dau_claude_thu_a')
  and ${loi('thap', 'chua_du_canh_gioi')}
  and (select '${JSON.stringify(cfg.the)}'::jsonb ? (v::jsonb ->> 'ma') from kq where ten = 'quay' and v like '{%')
  and (select a.v = b.v from kq a, kq b where a.ten = 'quay' and b.ten = 'quay_2')
  and ${la_('bang_minh', '1')} and ${loi('ghi_bang', 'permission denied')} and ${loi('sua_bang', 'permission denied')} and ${loi('xoa_bang', 'permission denied')}
  and (select v like '{%"pb"%' and not (v::jsonb ? 'sua' and v::jsonb -> 'sua' ? 'the') from kq where ten = 'luu_dung')
  and (select v::jsonb -> 'sua' ->> 'the' = ${ma} from kq where ten = 'luu_khac' and v like '{%')
  and (select v::jsonb -> 'sua' ->> 'the' = ${ma} from kq where ten = 'luu_khac_2' and v like '{%')
  and (select v::jsonb -> 'sua' ->> 'the' = ${ma} from kq where ten = 'luu_bo' and v like '{%')
  and ${la_('luu_tui', 'true')}
  and (select v::jsonb #>> '{}' = ${ma} from kq where ten = 'ho_so_minh') and (select v::jsonb #>> '{}' = ${ma} from kq where ten = 'ho_so_nguoi')
  and ${la_('bang_nguoi', '0')}
  and (select v like '{%' and v::jsonb -> 'sua' ? 'the' and jsonb_typeof(v::jsonb -> 'sua' -> 'the') = 'null' from kq where ten = 'gan_bay')
  and (select v::jsonb ->> 'the' = ${ma} and v::jsonb ->> 'dong' = ${ma} and (v::jsonb ->> 'nv')::int = 1
         and (v::jsonb ->> 'nghi_van')::int = (select (d.v::jsonb ->> 'nghi_van')::int + 1 from kq d where d.ten = 'dau_claude_thu_a') from kq where ten = 'sau_claude_thu_a')
  and (select not (v::jsonb ? 'the') and not (v::jsonb ? 'dong') and (v::jsonb ->> 'nv')::int = 1 from (select jsonb_strip_nulls(v::jsonb)::text v from kq where ten = 'sau_claude_thu_b') x)
  and ${loi('khach', 'permission denied')} and ${loi('khach_bang', 'permission denied')}
  and (select v::jsonb = '${JSON.stringify(cfg)}'::jsonb from kq where ten = 'cfg'), false))::text;
select ten, left(v, 300) as v from kq;
rollback;`);
