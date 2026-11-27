// Máy chủ tự tính Lực chiến (chủ dự án 23/11/2026 19:58 "làm sao để máy chủ có thể kiểm soát tốt việc này", bảng chọn "Hàm Supabase",
// "Dùng số máy chủ + ghi"). Trước đây Lực chiến là số máy người chơi tự tính rồi gửi kèm bản lưu; máy chủ chỉ biết tin theo.
// Hàm này (pg_cron gọi 5 phút một lần, migration 20261123100000_p2d_luc_chien_may_chu.sql) lấy những bản lưu đổi từ lần tính trước
// (p2d_lc_viec), tính lại bằng ĐÚNG code của game (game.js gói từ src/game/stats.js + achieve.js bằng tools/goi-luc-chien.mjs) với số liệu
// data/*.json lấy từ trang game đang chạy, rồi ghi kết quả (p2d_lc_ghi): số máy chủ, số máy người chơi báo, chỗ lệch.
// Chỉ ai có khoá x-khoa (vault p2d_lc_khoa, pg_cron gửi kèm; hàm hỏi lại p2d_lc_khoa_dung) mới gọi được. Không ghi gì vào bản lưu người chơi.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { playerStats, power, BAN, NGUON } from './game.js';

// game.js được chép lên Supabase qua công cụ; băm lại LC.toString() để chắc bản đang chạy đúng từng ký tự với bản trong kho (lệch là từ chối)
const bam = async (t: string, n: number) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))]
  .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, n);
let banThat: string | null = null;

// Các tệp data/ mà code tính Lực chiến đọc (tools/luc-chien.test.mjs soát: thiếu tệp là báo đỏ). Không lấy cả data/_all.json (3 MB).
const TEP = ['realms', 'weapons', 'items', 'config', 'daovan', 'phap-bao', 'gear', 'techniques', 'elements', 'skills', 'heroes', 'fashion',
  'tiem-nang', 'the-chat', 'cave', 'he-chien', 'status', 'pets', 'companions', 'npcs', 'ky-nang', 'than-phap', 'shop', 'gender'];
const GOC = ['https://devhoa.github.io/tutien2d/', 'https://www.pixel2dtutien.com/'];
let nho: { luc: number; data: Record<string, unknown> } | null = null;

async function napData() {
  if (nho && Date.now() - nho.luc < 10 * 60 * 1000) return nho.data;
  let loi = '';
  for (const goc of GOC) {
    try {
      const v = Math.floor(Date.now() / 600000);   // đổi mỗi 10 phút: lấy bản data mới sau khi game đưa lên
      const ds = await Promise.all(TEP.map(async f => {
        const r = await fetch(`${goc}data/${f}.json?v=${v}`);
        if (!r.ok) throw new Error(`${f} ${r.status}`);
        return [f, await r.json()];
      }));
      nho = { luc: Date.now(), data: Object.fromEntries(ds) };
      return nho.data;
    } catch (e) { loi += `${goc}: ${(e as Error).message}; `; }
  }
  throw new Error('khong_tai_data ' + loi);
}

Deno.serve(async (req: Request) => {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: dung } = await admin.rpc('p2d_lc_khoa_dung', { p: req.headers.get('x-khoa') || '' });
  if (dung !== true) return new Response('khong_duoc', { status: 401 });
  const q = new URL(req.url).searchParams, thu = q.get('thu') === '1';   // ?thu=1: tính rồi trả về, không ghi
  banThat ??= await bam(NGUON, 16);
  if (q.get('kiem') === '1') {   // ?kiem=1: băm từng dòng để tìm dòng chép sai (so với tools/luc-chien-bam.mjs bamDong)
    return Response.json({ ban: BAN, ban_that: banThat, dong: await Promise.all(NGUON.split('\n').map(l => bam(l, 8))) });
  }
  if (banThat !== BAN) return Response.json({ loi: 'sai_ban', ban: BAN, ban_that: banThat }, { status: 500 });
  const goc = await napData(), thieu = new Set<string>();
  const data = new Proxy(goc, { get(t, k) { if (typeof k === 'string' && !(k in t)) thieu.add(k); return (t as Record<string, unknown>)[k as string]; } });
  const { data: viec, error } = await admin.rpc('p2d_lc_viec', { p_n: 100 });
  if (error) return Response.json({ loi: error.message }, { status: 500 });
  const ra: unknown[] = [];
  for (const v of (viec || []) as { u: string; d: Record<string, unknown>; k: number; l: string }[]) {
    try {
      const s = { ...v.d, gems: v.d.gems || {}, mats: v.d.mats || {} };
      ra.push({ u: v.u, mc: power({ data }, playerStats(s, data)), k: v.k, l: v.l });
    } catch (e) { ra.push({ u: v.u, k: v.k, l: v.l, loi: String((e as Error).message).slice(0, 160) }); }
  }
  if (!thu && ra.length) {
    const { error: e2 } = await admin.rpc('p2d_lc_ghi', { p: ra, p_ban: BAN });
    if (e2) return Response.json({ loi: e2.message, n: ra.length }, { status: 500 });
  }
  return Response.json({ n: ra.length, ban: BAN, thieu: [...thieu], ...(thu ? { ra } : {}) });
});
