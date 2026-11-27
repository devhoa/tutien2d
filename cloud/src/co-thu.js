// Cổ Thụ Ngàn Năm (chủ dự án 23/11/2026 15:33 và bảng câu hỏi: "Ngừng sét, không ai đánh", "0,5% thanh tầng đang ở", "Đả tọa dưới cây, chia đều",
// "Giữ phần đã ngồi"). Luật ở docs/16-HOA-MA.md mục "Cổ Thụ Ngàn Năm"; số ở data/pvp.json → server.ma.co (bản sao PVP.ma.co).
// Vòng sáng quanh gốc cây (Thiên Kiếm Tinh): không ai đánh ai (pvp.js), thiên phạt dừng (thien-phat.js). Người ngồi đả tọa (hồ sơ st 'toa') trong
// vòng thì phòng đếm phút: a.coAt lúc bắt đầu ngồi, a.coN số phút đã tính (giữ trong phần đính kèm kết nối, phòng ngủ dậy vẫn đúng; đứng dậy, ra
// khỏi vòng thì thôi đếm, phút đã đủ vẫn giữ). Mỗi phút đủ:
// - ma: lõi Mang ký 'sh' (Supabase p2d_ma_ghi: −1 điểm ma, nợ 'ma_sh': máy người đó trả nợ thì 0,5% tu vi lên cây), phòng báo { t: 'sh', id, ma }.
// - người thường: gom cả phòng một lần (p2d_co_thu_hap: chia đều linh khí cây), gửi riêng { t: 'ct', q } cho người nhận, cả phòng { t: 'ctl', lk }.
import { PVP } from './mang-cfg.js';
import { laMa, datMa } from './ma.js';

const C = () => PVP.ma?.co;
const mang = room => room.env.MANG.get(room.env.MANG.idFromName('cuu-dau'));
function send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch { /* đang đóng */ } }

// Điểm p (đơn vị bản đồ) có trong vòng sáng của bản đồ map không
export const trongCo = (map, p) => { const c = C(); return !!(c && p && map === c.map && Math.hypot(p[0] - c.x, p[1] - c.y) <= c.r); };
const choDung = (room, a) => room.pos.get(a.id) || a.xy || a.coXy;
const dangNgoi = (room, a) => a.kind === 'dao' && a.p?.st === 'toa' && trongCo(a.map, choDung(room, a));

// Mỗi tin của một người (phong.js gọi sau khi xử lý tin): bắt đầu / thôi đếm. Trả true nếu vừa đổi.
export function coTin(room, ws, a, now) {
  if (!C()) return false;
  const ngoi = dangNgoi(room, a);
  if (ngoi && !a.coAt) {
    const p = choDung(room, a);
    a.coAt = now; a.coN = 0; a.coXy = [p[0], p[1]]; ws.serializeAttachment(a);
    coHen(room, now);
    return true;
  }
  if (!ngoi && a.coAt) { delete a.coAt; delete a.coN; delete a.coXy; ws.serializeAttachment(a); return true; }
  if (ngoi && !room.coTimer) coHen(room, now);
  return false;
}

// Hẹn giờ tới phút đủ sớm nhất trong phòng
export function coHen(room, now) {
  const c = C();
  if (!c) return;
  let next = Infinity;
  for (const ws of room.ctx.getWebSockets()) {
    if (ws.readyState !== 1) continue;
    const a = ws.deserializeAttachment();
    if (a?.coAt) next = Math.min(next, a.coAt + ((a.coN || 0) + 1) * c.phut_s * 1000);
  }
  if (room.coTimer) { clearTimeout(room.coTimer); room.coTimer = null; }
  if (next < Infinity) room.coTimer = setTimeout(() => { room.coTimer = null; coXet(room, Date.now()).catch(() => {}); }, Math.max(20, next - now));
}

// Tính các phút đã đủ
export async function coXet(room, now) {
  const c = C();
  if (!c) return;
  const hap = [];   // người thường đủ phút: [ws, id]
  for (const ws of room.ctx.getWebSockets()) {
    if (ws.readyState !== 1) continue;
    let a = ws.deserializeAttachment();
    if (!a?.coAt) continue;
    if (!dangNgoi(room, a)) { delete a.coAt; delete a.coN; delete a.coXy; ws.serializeAttachment(a); continue; }
    const n = Math.floor((now - a.coAt) / (c.phut_s * 1000)), du = n - (a.coN || 0);
    if (du <= 0) continue;
    a.coN = n; ws.serializeAttachment(a);
    if (!laMa(a)) { hap.push([ws, a.id]); continue; }   // mỗi lần xét chỉ chia một phần (phòng ngủ lâu không dồn nhiều phần)
    for (let i = 0; i < du && laMa(a); i++) {
      let r = null;
      try { r = await mang(room).ma('sh', a.id); } catch { /* lõi Mang lỗi: phút này không tính */ }
      a = ws.deserializeAttachment() || a;
      if (!r) break;
      datMa(a, r.ma);
      if (!laMa(a)) { a.pk = false; delete a.xy; a.pvpAt = 0; }   // hết điểm ma: thành người thường, khiên bật lại
      ws.serializeAttachment(a);
      send(ws, { t: 'sh', id: a.id, ma: a.ma || 0, no: r.no ? 1 : 0 });
      if (!laMa(a)) {
        try { await mang(room).pkSet(a.id, false, a.immune || 0, 0, 0); } catch { /* lõi Mang lỗi */ }
      }
      room.all({ t: 'pk', id: a.id, on: a.pk ? 1 : 0, ma: a.ma || 0 });
    }
  }
  if (hap.length) {
    let r = null;
    try { r = await mang(room).coThu(hap.map(h => h[1])); } catch { /* lõi Mang lỗi */ }
    if (r) {
      for (const [ws, id] of hap) { const q = r.h?.[id]; if (q > 0) send(ws, { t: 'ct', q }); }
      room.all({ t: 'ctl', lk: r.lk || 0 });
    }
  }
  coHen(room, Date.now());
}
