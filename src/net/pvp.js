// PvP Ngoại Vực: người vừa gục trả nợ (supabase/migrations/20261106020000_p2d_pvp.sql p2d_pvp_tra). Máy chủ tự trừ trong bản lưu
// trên máy chủ, gửi đồ + Linh Thạch vào Hòm thư người hạ, trả { mat: [...], phien_ban } để máy này sửa y như vậy (game/pvp.js).
import { supabase } from './client.js';

export async function settlePvp() {
  const { data, error } = await supabase.rpc('p2d_pvp_tra');
  if (error) throw error;
  return data;
}

// Túi Linh Thạch trên đất của một tinh cầu (supabase/migrations/20261122170000_p2d_tui_linh_thach.sql p2d_lt_xem; src/game/tui-lt.js): [{ id, x, y, so }]
export async function ltXem(map) {
  const { data, error } = await supabase.rpc('p2d_lt_xem', { p_map: map });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Linh khí Cổ Thụ Ngàn Năm đang tích (supabase/migrations/20261123070000_p2d_co_thu.sql p2d_co_thu_xem; src/game/co-thu.js): số
export async function coThuXem() {
  const { data, error } = await supabase.rpc('p2d_co_thu_xem');
  if (error) throw error;
  return Math.max(0, Number(data?.lk) || 0);
}
