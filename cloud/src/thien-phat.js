// Thiên phạt (chủ dự án 22/11/2026 11:4x: "ai hoá ma khi ở thiên kiếm tinh vì cứ mỗi 10s sẽ bị thiên phạt"; 16:14: "chết vì thiên phạt thì rớt",
// chọn "Như bị diệt"; 16:14 đồng ý chuyển cho máy chủ phòng làm trọng tài để máy bị sửa không né được). Luật ở docs/16-HOA-MA.md.
// Ma có mặt trong phòng bản đồ Thiên Kiếm Tinh (PVP.safe.map) bị giáng một đạo mỗi PVP.ma.tp.chu_ky giây tính từ lúc có mặt; đạo thứ PVP.ma.tp.dao
// là gục (ma.js maTp: −1 điểm ma, nợ 'ma_tp' kèm chỗ gục: 1% Linh Thạch rơi thành túi, 1% tu vi). Các đạo trước chỉ phát tin { t: 'tp', id, n } cho
// cả phòng: máy khách vẽ sét, máy của ma tự trừ máu (không gục, src/game/thien-phat.js).
// Mốc giữ trong phần đính kèm kết nối (a.tpAt: lúc bắt đầu đếm, a.tpN: số đạo đã giáng) nên phòng ngủ dậy vẫn đúng. Đang miễn (vừa hồi sinh) thì
// chờ hết miễn mới đếm. Hẹn giờ trong bộ nhớ (room.tpTimer) thức phòng tới đạo kế; mỗi tin của ma trong phòng cũng hẹn lại nếu hẹn giờ đã mất.
import { PVP } from './mang-cfg.js';
import { laMa, maTp } from './ma.js';
import { trongCo } from './co-thu.js';   // vòng sáng Cổ Thụ Ngàn Năm: thiên phạt dừng (23/11/2026)

const C = () => PVP.ma?.tp;
export const tpNoi = map => !!(C() && PVP.safe && map === PVP.safe.map);
const dangTinh = a => laMa(a) && tpNoi(a.map);
// Ma đứng trong vòng sáng Cổ Thụ: thiên phạt dừng mà KHÔNG đếm lại từ đầu (ra vào vòng không né được): a.tpDung lúc bước vào, ra thì dời mốc tpAt
// đi đúng bấy nhiêu. Trả true khi đang trong vòng.
function coDung(room, ws, a, now) {
  const trong = trongCo(a.map, room.pos.get(a.id) || a.xy);
  if (trong && a.tpAt && !a.tpDung) { a.tpDung = now; ws.serializeAttachment(a); }
  if (!trong && a.tpDung) { if (a.tpAt) a.tpAt += now - a.tpDung; delete a.tpDung; ws.serializeAttachment(a); }
  return trong;
}

// Đặt mốc cho ma vừa có mặt (vào phòng, vừa hóa ma, vừa hết miễn sau hồi sinh). Trả true nếu vừa đặt.
export function tpDat(room, ws, a, now) {
  if (!dangTinh(a) || a.tpAt || now < (a.immune || 0)) return false;
  a.tpAt = now; a.tpN = 0; ws.serializeAttachment(a);
  tpHen(room, now);
  return true;
}
export function tpBo(a) { delete a.tpAt; delete a.tpN; delete a.tpDung; }   // gục, hết ma: thôi đếm (hồi sinh xong mà vẫn ở đây thì đếm lại từ đầu)

// Hẹn giờ tới việc sớm nhất trong phòng: đạo kế của ma đang đếm, hoặc lúc hết miễn của ma chưa đếm
export function tpHen(room, now) {
  const c = C();
  if (!c) return;
  let next = Infinity;
  for (const ws of room.ctx.getWebSockets()) {
    if (ws.readyState !== 1) continue;
    const a = ws.deserializeAttachment();
    if (!a || !dangTinh(a) || a.tpDung) continue;
    next = Math.min(next, a.tpAt ? a.tpAt + ((a.tpN || 0) + 1) * c.chu_ky * 1000 : Math.max(now, a.immune || 0));
  }
  if (room.tpTimer) { clearTimeout(room.tpTimer); room.tpTimer = null; }
  if (next < Infinity) room.tpTimer = setTimeout(() => { room.tpTimer = null; tpXet(room, Date.now()).catch(() => {}); }, Math.max(20, next - now));
}

// Giáng các đạo đã tới hạn, đặt mốc cho ma vừa hết miễn, bỏ mốc của người hết là ma / không còn ở đây
export async function tpXet(room, now) {
  const c = C();
  if (!c) return;
  let lam = false;
  for (const ws of room.ctx.getWebSockets()) {
    if (ws.readyState !== 1) continue;
    const a = ws.deserializeAttachment();
    if (!a) continue;
    if (!dangTinh(a)) { if (a.tpAt) { tpBo(a); ws.serializeAttachment(a); } continue; }
    if (coDung(room, ws, a, now)) continue;   // trong vòng sáng Cổ Thụ
    if (!a.tpAt) { if (tpDat(room, ws, a, now)) lam = true; continue; }
    const n = Math.min(c.dao, Math.floor((now - a.tpAt) / (c.chu_ky * 1000)));
    if (n <= (a.tpN || 0)) continue;
    lam = true;
    if (n >= c.dao) { await maTp(room, ws, a, now); continue; }   // đạo cuối: gục (maTp bỏ mốc, đặt miễn)
    for (let i = (a.tpN || 0) + 1; i <= n; i++) room.all({ t: 'tp', id: a.id, n: i });
    a.tpN = n; ws.serializeAttachment(a);
  }
  // Đồng hồ không chạy mà gọi lại (bài thử giả xả mọi hẹn giờ cùng lúc): thôi hẹn, tin kế của ma sẽ hẹn lại
  if (!lam && room.tpRong === now) return;
  room.tpRong = lam ? 0 : now;
  tpHen(room, Date.now());
}

// Mỗi tin của một người trong phòng: ma chưa có mốc thì đặt; còn ma đang đếm mà hẹn giờ đã mất (phòng vừa dỡ khỏi bộ nhớ) thì hẹn lại
export function tpTin(room, ws, a, now) {
  if (!dangTinh(a)) return;
  if (coDung(room, ws, a, now)) return;   // trong vòng sáng: dừng (chưa có mốc thì ra khỏi vòng mới bắt đầu đếm)
  if (!a.tpAt) tpDat(room, ws, a, now);
  else if (!room.tpTimer) tpHen(room, now);
}
