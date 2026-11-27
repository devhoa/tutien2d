// Sự kiện máy chủ trao quà (data/events.json → tong_mon): máy chủ kiểm điều kiện, ghi đã nhận, gửi quà vào Hòm thư.
// Nhập Tông Môn: p2d_sk_tm_nhan (migration 20261124010000_p2d_bo_moi_17_19.sql) trả { ok, n } hoặc { ok: false, ly_do: 'chua_vao' | 'da_nhan' }.
import { supabase } from './client.js';

export async function skTmNhan() {
  const { data, error } = await supabase.rpc('p2d_sk_tm_nhan');
  if (error) throw error;
  return data;
}
