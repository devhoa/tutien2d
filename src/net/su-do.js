// Sư đồ (migration sinh bằng tools/su-do-sql.py). Chỉ dùng mã công khai k của người chơi.
import { supabase } from './client.js';

const code = e => (e?.message || '').match(/[a-z_]+/)?.[0] || 'net';
async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(code(error));
  return data;
}
export const suDoState = () => rpc('p2d_su_do_tt');
export const suDoInvite = k => rpc('p2d_su_do_moi', { p_k: k });
export const suDoLeave = k => rpc('p2d_su_do_roi', { p_k: k });
export const suDoTeach = k => rpc('p2d_su_do_chi_diem', { p_k: k });
export const suDoBow = () => rpc('p2d_su_do_hanh_le');
