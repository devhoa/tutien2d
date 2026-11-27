// Túi Linh Thạch trên đất (chủ dự án 22/11/2026 11:4x: "khi ma nhân chết sẽ rơi linh thạch, ai nhặt đc thì sẽ là của ng đó, nếu k ai nhặt đc thì
// cứ ở đó"; 16:14 ma chết vì thiên phạt cũng rơi). Túi do Supabase giữ (bảng p2d_lt_dat, tạo lúc máy người gục trả nợ p2d_pvp_tra); máy khách hỏi
// Supabase p2d_lt_xem để vẽ. Phòng không giữ danh sách túi, chỉ làm hai việc:
// (1) 'lt' nhặt: lấy chỗ người nhặt đang đứng (gửi kèm trong tin, như đòn PvP; không có thì chỗ phòng đang giữ), lõi Mang ký gửi Supabase p2d_lt_nhat
//     (cùng tinh cầu, cách túi không quá ma.tui.r, ai tới trước được). Nhặt được: báo người nhặt 'ltn' (máy đó nhận thư ngay), báo cả phòng 'lt-';
//     không được: báo người nhặt 'ltx' kèm lý do ('het' đã có người nhặt, 'xa', 'loi' mạng…).
// (2) 'ltm' túi mới: máy người gục vừa trả nợ ra túi trên bản đồ này thì báo; phòng chuyển cho người khác để họ hỏi lại danh sách.
const mang = room => room.env.MANG.get(room.env.MANG.idFromName('cuu-dau'));
function send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch { /* đang đóng */ } }
const NHIP_MS = 400;   // mỗi người một lần nhặt mỗi 0,4 giây (mỗi lần là một lệnh tới Supabase)

export async function ltNhat(room, ws, a, id, mv) {
  if (!Number.isSafeInteger(id) || id <= 0 || !a.map) return;
  const now = Date.now(), lan = (room.ltLan ??= new Map());
  if (now - (lan.get(a.id) || 0) < NHIP_MS) return;
  lan.set(a.id, now);
  if (mv) room.place(ws, a, mv, now);
  const p = mv || room.pos.get(a.id) || a.xy;
  if (!p) return send(ws, { t: 'ltx', id, e: 'cho' });
  let r = null;
  try { r = await mang(room).ltNhat(a.id, id, a.map, p[0], p[1]); } catch { /* lõi Mang lỗi */ }
  if (!r) return send(ws, { t: 'ltx', id, e: 'loi' });
  if (r.so > 0) {
    send(ws, { t: 'ltn', id, so: r.so });
    room.others(ws, { t: 'lt-', id, by: a.nm || a.p?.name || 'Đạo hữu', so: r.so });
    return;
  }
  send(ws, { t: 'ltx', id, e: typeof r.loi === 'string' ? r.loi : 'het' });
}

export function ltMoi(room, ws) { room.others(ws, { t: 'ltm' }); }
