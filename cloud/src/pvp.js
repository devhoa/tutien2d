// PvP (chủ dự án 06/11/2026: chỉ khi cả hai tắt bảo vệ, chỉ tính khi đứng trong tầm chiêu, Luyện Khí đánh Độ Kiếp cũng được;
// 19/11/2026 16:18–16:25: đánh được ở MỌI tinh cầu, trừ vòng pháp trận Thiên Kiếm Tinh PVP.safe; Ngoại Vực rơi 1 món + 10% Linh Thạch,
// nơi khác 5% Linh Thạch không mất món (Supabase p2d_pvp_tra đọc nơi gục); ngoài Ngoại Vực khiên bật lại sau reshield_s giây không giao chiến).
// Máy chủ phòng là trọng tài: máu PvP, tầm đánh (theo vị trí phòng giữ), nhịp đánh, sát thương theo lực chiến Supabase báo
// (máy khách chỉ nói "tôi đánh người X"). Gục thì lõi Mang ký gửi Supabase (p2d_pvp_ghi), máy người gục tự trả nợ (p2d_pvp_tra).
// Số ở data/pvp.json → server (bản sao trong mang-cfg.js PVP, bài thử so khớp).
// 20/11/2026, sau bài thử đánh thật trên game chỉ được 56% đòn: trọng tài phải xét theo thứ NGƯỜI ĐÁNH THẤY trên màn hình, không phải theo
// vị trí mới nhất phòng đang giữ. Ba chỗ: (1) tin đòn đánh kèm vị trí người đánh lúc ra đòn (phong.js 'h'), khỏi dùng vị trí cũ tới 0,2 giây;
// (2) bù trễ cho mục tiêu: trong lag_s giây vừa qua người kia TỪNG ở trong tầm là tính (inRange); (3) nhịp đòn nới gap_tol_s cho mạng chập chờn.
import { PVP } from './mang-cfg.js';
import { quyen, laMa, ganHoSo, maGuc } from './ma.js';   // hóa ma (22/11/2026): ai đánh được ai, gục thì tính điểm ma / công đức
import { trongCo } from './co-thu.js';   // vòng sáng Cổ Thụ Ngàn Năm (23/11/2026)
import { pwCua } from './ho-tong.js';   // lực chiến đã nhân Hộ Tông gia trì (26/11/2026): máu PvP và đòn của người đứng trên tinh cầu tông môn mình

const pool = pw => Math.max(pw || 0, PVP.pw_min) * PVP.hp_k;

// Nguyên Anh (chủ dự án 27/11/2026 01:09–01:16; data/pvp.json → server.na): tổng tầng tu thật (Supabase, a.tl) từ Nguyên Anh, lá chắn đã hồi
// thì đòn hạ không tính là bị giết: hoá Nguyên Anh, miễn mọi đòn giu_s giây; bấm Tái tạo ('ta') thì chỉ còn an_s giây. Lá chắn giữ theo tài khoản
// trong phòng (room.naHoi), nên vào lại cùng tuyến không hồi ngay được.
const naSan = (room, b, now) => !!PVP.na && (b.tl ?? -1) >= PVP.na.tl && now >= ((room.naHoi ??= new Map()).get(b.id) || 0);
function hoaAnh(room, ws, b, now) {
  room.naHoi.set(b.id, now + PVP.na.hoi_s * 1000);
  b.immune = now + PVP.na.giu_s * 1000; b.anh = now;
  ws.serializeAttachment(b);
}
// Máy khách hoá Nguyên Anh vì gục ngoài PvP (quái, trùm): phòng cũng coi như đang là Nguyên Anh (miễn đòn, dùng lá chắn)
export function pvpAnh(room, ws, a) { const now = Date.now(); if (naSan(room, a, now)) hoaAnh(room, ws, a, now); }
// Bấm Tái tạo: hết miễn đòn (còn an_s giây cho thân vừa dựng lại)
export function pvpTaiTao(room, ws, a) {
  const now = Date.now();
  if (!a.anh || !(a.immune > now)) return;
  a.immune = Math.min(a.immune, now + (PVP.na.an_s ?? 1) * 1000); delete a.anh;
  ws.serializeAttachment(a);
}

// Tắt khiên ở đâu cũng được (chủ dự án 06/11/2026 10:56). Bật lại: ở Ngoại Vực chỉ khi chết hồi sinh (06/11 10:49); nơi khác khi đã
// reshield_s giây không giao chiến (19/11 16:25), tính từ lúc tắt khiên hoặc đòn PvP cuối (a.pvpAt, giữ ở Mang cùng khiên).
// Trạng thái khiên giữ ở lõi Mang theo tài khoản (mang.js pk), nên đổi tuyến, ra vào bản đồ, mất mạng vào lại vẫn y như cũ.
// mv: chỗ đang đứng lúc tắt khiên (máy khách từ đợt sửa đêm 20/11/2026 gửi kèm; không có thì lấy vị trí phòng đang giữ), ghi ngay vào phần đính kèm
// kết nối (a.xy, phong.js place): tắt khiên rồi đứng yên thì phòng vẫn biết chỗ để xét tầm, kể cả sau khi phòng ngủ. Bật lại khiên hay
// gục thì xoá a.xy, kẻo lần tắt khiên sau xét nhầm theo chỗ đứng cũ.
export async function pvpToggle(room, ws, a, off, mv) {
  const now = Date.now();
  if (!off) {
    if (!a.pk) return;
    if (laMa(a)) return send(ws, { t: 'pe', e: 'ma_khong_bat', n: a.ma });   // ma không bật lại khiên được: bị hạ tới hết điểm ma mới thành người
    if (a.map === PVP.map) return send(ws, { t: 'pe', e: 'only_death' });
    const left = (a.pvpAt || 0) + PVP.reshield_s * 1000 - now;
    if (left > 0) return send(ws, { t: 'pe', e: 'wait_on', s: Math.ceil(left / 1000) });
    a.pk = false; ganHoSo(a); delete a.xy; room.vet?.delete(a.id);
    ws.serializeAttachment(a);
    room.all({ t: 'pk', id: a.id, on: 0 });
    try { await mang(room).pkSet(a.id, false, 0, 0); } catch { /* lõi Mang lỗi */ }
    return;
  }
  if (now < (a.immune || 0)) return send(ws, { t: 'pe', e: 'immune', s: Math.ceil((a.immune - now) / 1000) });
  if (a.pk) return;
  a.pk = true; ganHoSo(a); a.pvpAt = now;
  const q = mv || room.pos.get(a.id);
  if (q) room.place(ws, a, q, now); else ws.serializeAttachment(a);   // place ghi a.xy và ghi phần đính kèm (làm xong trước mọi lệnh chờ bên dưới)
  room.all({ t: 'pk', id: a.id, on: 1 });
  try { await mang(room).pkSet(a.id, true, 0, now); } catch { /* lõi Mang lỗi: chỉ phòng này nhớ */ }
}

// Vòng pháp trận an toàn (PVP.safe, đơn vị bản đồ)
export const inSafe = (map, p) => !!(PVP.safe && map === PVP.safe.map && p && Math.hypot(p[0] - PVP.safe.x, p[1] - PVP.safe.y) <= PVP.safe.r);

// Lúc vào phòng bản đồ PvP: lấy trạng thái khiên đã giữ ở Mang
export async function pvpLoad(env, uid) {
  try { return await env.MANG.get(env.MANG.idFromName('cuu-dau')).pkGet(uid); } catch { return null; }
}
const mang = room => room.env.MANG.get(room.env.MANG.idFromName('cuu-dau'));

// Vết vị trí gần đây của người đang tắt khiên (phong.js place gọi): room.vet: id → [[lúc, x, y], …], giữ lag_s giây cuối và một điểm ngay
// trước đó. Chỉ nằm trong bộ nhớ phòng: phòng ngủ thì mất (lúc đó xét theo vị trí mới nhất: this.pos hoặc a.xy), người kia đi tiếp là có lại.
export function pvpTrack(room, id, mv, now) {
  const m = (room.vet ??= new Map());
  let v = m.get(id);
  if (!v) m.set(id, v = []);
  v.push([now, mv[0], mv[1]]);
  const from = now - PVP.lag_s * 1000;
  while (v.length > 1 && v[1][0] <= from) v.shift();
}

// Khoảng cách từ điểm (px, py) tới đoạn thẳng (x0, y0)–(x1, y1)
function segDist(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
  const k = l2 ? Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l2)) : 0;
  return Math.hypot(px - x0 - dx * k, py - y0 - dy * k);
}

// Trong tầm? pa: vị trí người đánh, pb: vị trí mới nhất của mục tiêu. Người đánh chọn mục tiêu theo HÌNH người kia trên máy mình, mà hình
// đó cũ khoảng 0,5–0,8 giây: đường lên của người kia + gom lô 200 ms + đường xuống + máy khách cho hình đi sau hai nhịp gói tin cho mượt
// (src/game/others.js). Xét theo vị trí mới nhất thì đuổi đánh người đang chạy là trượt gần hết dù trên màn hình rõ ràng trong tầm (đo
// 20/11/2026, tools/cloud/tai-chien.mjs --kieu duoi: 0% đòn được tính). Nên: trong lag_s giây vừa qua mục tiêu TỪNG ở trong tầm là tính,
// xét cả quãng đường nối các lần báo vị trí, cắt đúng lag_s giây. range_tol: phần dư cho hình đi mượt cắt góc cua và làm tròn toạ độ.
function inRange(room, id, pa, pb, now, tam = PVP.range) {
  const R = tam + PVP.range_tol;
  if (Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) <= R) return true;
  const v = room.vet?.get(id), from = now - PVP.lag_s * 1000;
  for (let i = (v?.length || 0) - 1; i > 0; i--) {
    const q = v[i], p = v[i - 1];
    if (q[0] <= from) break;
    let x0 = p[1], y0 = p[2];
    if (p[0] < from) { const k = (from - p[0]) / (q[0] - p[0]); x0 += (q[1] - x0) * k; y0 += (q[2] - y0) * k; }
    if (segDist(pa[0], pa[1], x0, y0, q[1], q[2]) <= R) return true;
  }
  return false;
}

// Xét một mục tiêu: được phép đánh nhau (ma.js quyen: hai người thường cùng tắt khiên; ma với người không phải ma, trừ người mới), không ai
// vừa hồi sinh (immune), cả hai có vị trí, không ai đứng trong vòng pháp trận / vòng Cổ Thụ (xét theo vị trí MỚI NHẤT: đã bước vào vòng là an
// toàn, không bù trễ), trong tầm R (inRange). Trả { tw, b, kieu } hoặc null.
function xet(room, a, id, R, now) {
  if (typeof id !== 'string' || id === a.id) return null;
  const tw = room.ctx.getWebSockets(id).find(w => w.readyState === 1), b = tw?.deserializeAttachment();
  const kieu = b && quyen(a, b);
  if (!kieu || now < (a.immune || 0) || now < (b.immune || 0)) return null;
  const pa = room.pos.get(a.id) || a.xy, pb = room.pos.get(id) || b.xy;   // phòng vừa ngủ dậy thì quên this.pos: lấy chỗ ghi trong phần đính kèm
  if (!pa || !pb || inSafe(a.map, pa) || inSafe(a.map, pb) || trongCo(a.map, pa) || trongCo(a.map, pb)) return null;   // vòng sáng Cổ Thụ: không ai đánh ai (23/11/2026)
  if (!inRange(room, id, pa, pb, now, R)) return null;
  return { tw, b, kieu };
}

// a đánh người id bằng đòn thường / kỹ năng: một mục tiêu, tầm PVP.range, đủ nhịp.
export async function pvpHit(room, ws, a, id) {
  const now = Date.now(), hp = (room.php ??= new Map());
  const t = xet(room, a, id, PVP.range, now);
  if (!t) return;
  // Nhịp: máy khách gửi cách nhau ít nhất gap_s, nhưng mạng chập chờn làm hai tin tới phòng sát nhau hơn lúc gửi; nới gap_tol_s kẻo bỏ oan.
  // Không ai đánh nhanh hơn được nhờ thế: sát thương mỗi đòn tỉ lệ với số giây từ đòn được tính trước (dt), gửi dày thì mỗi đòn nhỏ lại.
  const last = hp.get('t:' + a.id) || 0;
  if (now - last < (PVP.gap_s - PVP.gap_tol_s) * 1000) return;
  hp.set('t:' + a.id, now);
  const dt = Math.min(PVP.dt_max, (now - (last || now - PVP.gap_s * 1000)) / 1000);
  await danh(room, ws, a, t, id, Math.max(1, Math.round(Math.max(pwCua(a), PVP.pw_min) * PVP.dps_k * dt)), now);
}

// a tung pháp bảo trúng người (CSKH #359 #395, 27/11/2026): trước đây pháp bảo chỉ tính như một nhát đánh thường vào người gần nhất trong tầm
// 160 nên Đại Ấn (rơi xa tới 210) không bao giờ trúng người, và đòn vùng chỉ trúng một người. Nay: tầm PVP.pb.range, tối đa PVP.pb.max người
// (máy khách gửi danh sách ids, đòn bắn thẳng một người), mỗi người nhận như PVP.pb.dt giây đánh thường; nhịp riêng PVP.pb.gap_s (pháp bảo
// hồi 60–150 giây, mang 3–4 món) nên không ai lấy đòn này thay đánh thường được, và không ăn vào nhịp đánh thường.
export async function pvpPb(room, ws, a, ids) {
  const P = PVP.pb, now = Date.now(), hp = (room.php ??= new Map());
  if (!P || !Array.isArray(ids)) return;
  const last = hp.get('pb:' + a.id) || 0;
  if (now - last < P.gap_s * 1000) return;
  const ds = [...new Set(ids.slice(0, 8))].slice(0, P.max).map(id => [id, xet(room, a, id, P.range, now)]).filter(([, t]) => t);
  if (!ds.length) return;
  hp.set('pb:' + a.id, now);
  const n = Math.max(1, Math.round(Math.max(pwCua(a), PVP.pw_min) * PVP.dps_k * P.dt));
  for (const [id, t] of ds) await danh(room, ws, a, t, id, n, now);
}

// Trừ máu PvP n của người id (t từ xet); gục thì về điểm hồi sinh, Mang ghi Supabase.
async function danh(room, ws, a, t, id, n, now) {
  const hp = room.php, { tw, b, kieu } = t;
  const max = pool(pwCua(b)), cur = hp.get(id);
  let left = cur && now - cur.at < PVP.regen_s * 1000 ? cur.hp : max;   // lâu không trúng đòn PvP thì đầy lại
  left -= n;
  a.pvpAt = now; b.pvpAt = now;
  for (const x of [a, b]) if (now - (x.pkSaved || 0) > 30000) { x.pkSaved = now; mang(room).pkSet(x.id, !!x.pk, x.immune || 0, now, x.ma || 0).catch(() => {}); }   // giữ lúc giao chiến ở Mang (vào lại không né được hẹn bật khiên), 30 giây một lần
  ws.serializeAttachment(a); tw.serializeAttachment(b);
  if (left > 0) { hp.set(id, { hp: left, at: now }); room.all({ t: 'ph', from: a.id, to: id, n, r: +(left / max).toFixed(3) }); return; }
  if (naSan(room, b, now)) { hp.delete(id); hoaAnh(room, tw, b, now); room.all({ t: 'pa', from: a.id, to: id, n }); return; }   // lần đầu: hoá Nguyên Anh, không tính là bị giết
  // gục: về điểm hồi sinh (máy người đó), miễn PvP immune_s giây (đặt ngay: đòn tới trong lúc chờ lõi Mang / Supabase bị bỏ)
  hp.delete(id); room.vet?.delete(id);
  b.immune = now + PVP.immune_s * 1000;
  if (kieu !== 'pvp') { tw.serializeAttachment(b); return maGuc(room, ws, a, tw, b, kieu, n, now); }   // trận có ma: điểm ma, công đức, nợ riêng (ma.js)
  b.pk = false; ganHoSo(b); delete b.xy; b.pvpAt = 0;   // hai người thường: bật lại bảo vệ như cũ
  tw.serializeAttachment(b);
  try { await mang(room).pkSet(id, false, b.immune, 0); } catch { /* lõi Mang lỗi */ }
  try { await mang(room).pkSet(a.id, true, a.immune || 0, now); } catch { /* lõi Mang lỗi */ }
  let ok = false;
  try { ok = await mang(room).pvp(a.id, id, a.map === PVP.map ? 'ngoai' : 'thuong'); } catch { /* mạng lỗi: không rơi đồ */ }
  room.all({ t: 'pd', from: a.id, to: id, n, by: a.nm || a.p?.name || 'Đạo hữu', loot: ok ? 1 : 0 });
  room.all({ t: 'pk', id, on: 0 });
}

function send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch { /* đang đóng */ } }
