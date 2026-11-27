// Báo lỗi, đề xuất của người chơi (supabase/migrations/20261029030000_p2d_gop_y.sql, ảnh ở kho Storage từ 20261105100000). Chỉ gửi khi đã đăng nhập;
// máy chủ kiểm tra độ dài, kiểu ảnh và chặn gửi dồn (10 lần liên tiếp mỗi 10 phút, 15 lần mỗi ngày).
import { supabase } from './client.js';

export async function loggedIn() {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

// f: { loai: 'loi' | 'de_xuat', tieu_de, mo_ta, anh, anh_nho (data URL JPEG), ngu_canh }. Trả { id } hoặc { error: mã lỗi }.
// Gửi qua Edge Function gop-y-anh (05/11/2026): hàm kiểm ảnh, gọi p2d_gui_gop_y_kho (cùng luật như trên) rồi cất ảnh vào kho
// riêng tư gop-y-anh thay cho chuỗi base64 trong cơ sở dữ liệu (supabase/migrations/20261105100000_p2d_anh_storage.sql).
export async function sendFeedback(f) {
  if (!(await loggedIn())) return { error: 'chua_dang_nhap' };
  const { data, error } = await supabase.functions.invoke('gop-y-anh', {
    body: { hanh_dong: 'gui', loai: f.loai, tieu_de: f.tieu_de, mo_ta: f.mo_ta || null, anh: f.anh, anh_nho: f.anh_nho || null, ngu_canh: f.ngu_canh || {} },
  });
  if (error) {
    try { const j = await error.context?.json?.(); if (j?.error) return { error: j.error }; } catch { /* không đọc được thân lỗi */ }
    return { error: 'net' };
  }
  if (data?.error) return { error: data.error };
  return data?.id ? { id: data.id } : { error: 'net' };
}

// 10 báo cáo gần nhất của mình: [{ id, loai, tieu_de, trang_thai, tra_loi, tao_luc }]
export async function myFeedback() {
  if (!(await loggedIn())) return [];
  const { data, error } = await supabase.rpc('p2d_gop_y_cua_toi');
  return error ? [] : data || [];
}

// CSKH cho người chưa đăng nhập (supabase/migrations/20261125000000_p2d_cskh_khach.sql): không ảnh, kèm tên tài khoản / cách liên hệ
// tuỳ chọn. Máy giữ mã bí mật của từng tin (localStorage p2d-cskh-ma) để xem lại lời trả lời, kể cả sau khi đăng nhập.
const MA = 'p2d-cskh-ma';
const maDs = () => { try { const a = JSON.parse(localStorage.getItem(MA) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string').slice(-20) : []; } catch { return []; } };
export async function sendKhach(f) {
  const { data, error } = await supabase.rpc('p2d_cskh_khach_gui', { p_tai_khoan: f.tai_khoan || null, p_lien_he: f.lien_he || null, p_nhom: f.nhom, p_y: f.y,
    p_tieu_de: f.tieu_de, p_mo_ta: f.mo_ta, p_ngu_canh: f.ngu_canh || {} });
  if (error) { const m = String(error.message || ''); return { error: ['gui_nhanh_qua', 'het_luot_hom_nay', 'tieu_de_sai', 'mo_ta_dai', 'mo_ta_ngan'].find(k => m.includes(k)) || 'net' }; }
  if (!data?.ma) return { error: 'net' };
  try { localStorage.setItem(MA, JSON.stringify([...maDs(), data.ma].slice(-20))); } catch { /* bộ nhớ trình duyệt tắt: vẫn gửi được, chỉ không xem lại */ }
  return { id: data.id };
}
export async function myKhach() {
  const ds = maDs();
  if (!ds.length) return [];
  const { data, error } = await supabase.rpc('p2d_cskh_khach_xem', { p_ma: ds });
  return error ? [] : (data || []).map(r => ({ ...r, khach: true }));
}
