// PvP (data/pvp.json; chủ dự án 06/11/2026, 19/11/2026 16:25: mọi tinh cầu, trừ vòng pháp trận Thiên Kiếm Tinh server.safe). Tắt bảo vệ thì
// mỗi lần vung đòn hoặc tung chiêu, máy này báo máy chủ phòng "đánh người tắt bảo vệ gần nhất trong tầm" (net/online-cf.js pvpHit);
// máy chủ phòng (cloud/src/pvp.js) tự kiểm tầm, nhịp, lực chiến, giữ máu PvP và báo lại cho cả phòng (ph: trúng, pd: gục).
// 20/11/2026: tin đòn đánh kèm vị trí mình lúc ra đòn; máy chủ phòng xét tầm theo vị trí đó và theo chỗ người kia TỪNG đứng trong
// server.lag_s giây vừa qua (hình người kia trên máy mình cũ 0,5–0,8 giây), nên thấy trong tầm trên màn hình mà đánh là được tính.
// Mình gục: hồi sinh như thường, bảo vệ bật lại, rồi trả nợ (net/pvp.js → máy chủ p2d_pvp_tra trừ 10% Linh Thạch + 1 món trong túi
// không đang mặc, gửi người hạ) và sửa bản lưu trong máy y như máy chủ. Vào game cũng trả nợ cũ (ai thoát game để né).
import { addNumber, addFx } from './combat.js';
import { addCoins } from './shop.js';
import { itemName } from './items.js';
import { matInfo } from './cave.js';
import { canTrade } from './market.js';
import { danhDuoc, toiMa, maCua, maPkToi, maPkNguoi, maPd, maTra } from './pvp-ma.js';   // hóa ma (22/11/2026)
import { thuSauHa, nhanChienLoi } from './pvp-thu.js';
import { hoaAnh } from './anh-the.js';   // Nguyên Anh: đòn hạ đầu không tính (tin 'pa', cloud/src/pvp.js naSan)
import { kemMinh, honMinh } from './pvp-yeu.js';   // hạ người kém một đại cảnh giới: không ai mất, được gì (23/11/2026)   // thu chiến lợi phẩm sau khi hạ người (22/11/2026 11:09)
import { thienPhatTick, tpTin } from './thien-phat.js';   // ma ở Thiên Kiếm Tinh: thiên phạt, phòng làm trọng tài (22/11/2026 11:4x, 16:14)
import { tuiTick, tuiTin, tuiMoi } from './tui-lt.js';   // túi Linh Thạch trên đất (22/11/2026 16:14)
import { coTick, coTin, coNhan, coTrong } from './co-thu.js';   // Cổ Thụ Ngàn Năm: sám hối, chia linh khí, vòng sáng không ai đánh ai (23/11/2026)

const P = game => game.data.pvp;
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const S = game => P(game).server;
export const pvpNgoai = game => !!(P(game) && game.map?.id === S(game).map);   // Ngoại Vực: rơi món, khiên chỉ bật lại khi chết
// Chỗ (x, y) trên bản đồ đang đứng có nằm trong vòng pháp trận an toàn không (máy chủ phòng kiểm lại, cloud/src/pvp.js inSafe)
export const pvpSafe = (game, x, y) => { const z = P(game)?.server.safe; return !!(z && game.map?.id === z.map && Math.hypot(x - z.x, y - z.y) <= z.r); };
// Chỗ không ai đánh được ai: vòng pháp trận, vòng sáng Cổ Thụ (máy chủ phòng kiểm lại)
const anToan = (game, x, y) => pvpSafe(game, x, y) || coTrong(game, x, y);
export const pvpMap = game => !!P(game) && !game.trip;   // đánh nhau được ở mọi bản đồ có phòng mạng

export function createPvp(game) {
  game.pvp = { off: false, cd: 0, wasSwing: false, map: null, at: 0, ask: 0, safe: null, ma: 0 };   // at: lúc tắt khiên / giao chiến cuối (ms); ma: điểm ma của mình (pvp-ma.js)
  game.chienLoi = (m, lines) => nhanChienLoi(game, m, lines);
  game.coThuNhan = q => coNhan(game, q);   // thư linh khí Cổ Thụ (market.js claimMail)   // thư chiến lợi phẩm nhận ở đường nào cũng báo (src/game/market.js claimMail)
  setTimeout(() => settle(game), 20000);   // nợ cũ (gục rồi thoát game)
}

// Tắt khiên (đã xác nhận ở src/ui/pvp-btn.js). Bật lại: Ngoại Vực chỉ khi chết hồi sinh; nơi khác tự bật sau reshield_s giây không giao chiến (updatePvp), máy chủ phòng giữ.
export function togglePvp(game, off = true) {
  const T = P(game).text;
  if (!off || game.pvp.off) return;
  if (!game.online?.pvpOff || !game.online.pvpOff(true, game.player)) game.toast(T.offline, 2);
}

// Đánh người gần nhất trong tầm mà mình đánh được (pvp-ma.js danhDuoc: hai người cùng tắt khiên; ma với người không phải ma), tính theo hình người
// đó trên máy mình (máy chủ phòng kiểm lại: vị trí mình gửi kèm, vết vị trí người kia). Còn khiên vẫn đánh được ma (hóa ma 22/11/2026).
export function pvpTryHit(game) {
  const s = game.pvp, p = game.player;
  if (!s || s.cd > 0 || !p || !pvpMap(game) || !game.online?.pvpHit || anToan(game, p.x, p.y)) return;
  const R = P(game).server.range * 0.95;
  let best = null, bd = R;
  for (const o of game.others.list.values()) {
    if (o.x === null || !danhDuoc(game, o) || anToan(game, o.x, o.y)) continue;
    const d = Math.hypot(o.x - p.x, o.y - p.y);
    if (d < bd) { bd = d; best = o; }
  }
  if (!best) return;
  s.cd = P(game).server.gap_s;
  game.online.pvpHit(best.id, p);
}

// Đòn pháp bảo trúng người (CSKH #359 #395, 27/11/2026; máy chủ phòng cloud/src/pvp.js pvpPb kiểm lại tầm, số người, nhịp riêng): trước đây
// pháp bảo chỉ tính như một nhát đánh thường vào người gần nhất trong tầm 160 nên Đại Ấn (rơi xa 210) không trúng người, đòn vùng chỉ trúng
// một người. Nay: người đánh được trong tầm của đòn (kẹp server.pb.range), đòn bắn thẳng (shot) một người, đòn vùng tối đa server.pb.max người.
export function pvpPbHit(game, tam, vung) {
  const s = game.pvp, p = game.player, B = S(game).pb;
  if (!B || !s || s.pbCd > 0 || !p || !pvpMap(game) || !game.online?.pvpPb || anToan(game, p.x, p.y)) return;
  const R = Math.min(tam, B.range) * 0.95, ds = [];
  for (const o of game.others.list.values()) {
    if (o.x == null || !danhDuoc(game, o) || anToan(game, o.x, o.y)) continue;
    const d = Math.hypot(o.x - p.x, o.y - p.y);
    if (d <= R) ds.push([d, o.id]);
  }
  if (!ds.length) return;
  ds.sort((a, b) => a[0] - b[0]);
  s.pbCd = B.gap_s;
  game.online.pvpPb(ds.slice(0, vung ? B.max : 1).map(x => x[1]), p);
}

// Mục tiêu người ưu tiên (chủ dự án 23/11/2026 03:05: "khi thấy ma tu và bật auto hoặc dùng kỹ năng thì ưu tiên tìm đánh người hóa ma
// trước, người hóa ma auto cũng vậy"): mình là người thường thì ma tu mình đánh được; mình là ma thì người mình đánh được (không phải ma,
// không phải người mới). Gần nhất trong R (hoặc trong khung đang nhìn: view), ngoài vòng pháp trận an toàn; mình đứng trong vòng thì không có.
// Tự đánh (auto.js) đuổi tới, chiêu và đòn thường (player.js) quay về phía người này.
export function pvpUuTien(game, R = Infinity, view = null) {
  const p = game.player;
  if (!game.pvp || !p || !pvpMap(game) || !game.others?.list || anToan(game, p.x, p.y)) return null;
  const ma = toiMa(game);
  let best = null, bd = R;
  for (const o of game.others.list.values()) {
    if (o.x == null || (!ma && !maCua(o)) || !danhDuoc(game, o) || anToan(game, o.x, o.y)) continue;
    if (view && (o.x < view.x0 || o.x > view.x1 || o.y < view.y0 || o.y > view.y1)) continue;
    const d = Math.hypot(o.x - p.x, o.y - p.y);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
export const pvpTam = game => P(game)?.server?.range || 40;

export function updatePvp(game, dt) {
  const s = game.pvp, p = game.player;
  if (!s || !p) return;
  thienPhatTick(game, dt);
  tuiTick(game);
  coTick(game);
  if (s.map !== game.map?.id) s.map = game.map?.id;   // đổi bản đồ: máy chủ phòng báo lại khiên (pk) lúc vào phòng mới
  s.cd = Math.max(0, s.cd - dt); s.pbCd = Math.max(0, (s.pbCd || 0) - dt);
  // Ra đòn thường: vung đòn (swingT), hoặc đòn của thú cưỡi. Đòn của thú (player.js mountSwing) không đặt swingT, nên trước đợt sửa đêm 20/11/2026 người
  // đang cưỡi thú đánh thường vào người khác thì máy không gửi đòn PvP nào (chỉ chiêu mới gửi); nhận ra nó bằng đòn chờ mới p.hitQ kiểu 'thu'.
  const sw = p.swingT > 0.15, q = p.hitQ?.move === 'thu' ? p.hitQ : null;
  if ((sw && !s.wasSwing) || (q && q !== s.thuQ)) pvpTryHit(game);
  s.wasSwing = sw; s.thuQ = q;
  if (!s.off) { s.safe = null; return; }
  const T = P(game).text, safe = pvpSafe(game, p.x, p.y);
  if (s.safe !== null && safe !== s.safe) game.toast(safe ? T.safe : T.zone_pk, 2);   // bước vào / ra vòng pháp trận
  s.safe = safe;
  // ngoài Ngoại Vực: đủ reshield_s giây không giao chiến thì xin máy chủ bật lại khiên (máy chủ kiểm lại giờ), 30 giây hỏi một lần
  const now = Date.now();
  if (!toiMa(game) && !pvpNgoai(game) && s.at && now - s.at >= S(game).reshield_s * 1000 && now - s.ask > 30000 && game.online?.pvpOff) { s.ask = now; game.online.pvpOff(false); }   // ma không tự bật khiên
}
// Giây còn lại tới lúc khiên tự bật (ước ở máy này; null: ở Ngoại Vực hoặc đang có khiên)
export const pvpLeft = game => (!game.pvp?.off || pvpNgoai(game) || toiMa(game)) ? null : Math.max(0, Math.ceil(((game.pvp.at || 0) + S(game).reshield_s * 1000 - Date.now()) / 1000));

// Tin PvP từ máy chủ phòng
export function onPvp(game, m) {
  const T = P(game)?.text, me = game.online?.me?.id, p = game.player;
  if (!T || !p) return;
  if (m.t === 'tp') { tpTin(game, m); return; }   // một đạo thiên phạt chưa gục (cloud/src/thien-phat.js)
  if (m.t === 'sh' || m.t === 'ct' || m.t === 'ctl') { coTin(game, m, settle); return; }   // Cổ Thụ Ngàn Năm (cloud/src/co-thu.js)
  if (m.t === 'ltn' || m.t === 'lt-' || m.t === 'ltx' || m.t === 'ltm') { tuiTin(game, m); return; }   // túi Linh Thạch (cloud/src/tui.js)
  if (m.t === 'pe') { if (m.e === 'wait_on' && game.pvp.ask) { game.pvp.at = Date.now() - S(game).reshield_s * 1000 + m.s * 1000; return; } game.toast(fill(T[m.e] || T.offline, { s: m.s, n: m.n }), 2.4); return; }
  if (m.t === 'pk') {
    if (m.id !== me) { maPkNguoi(game, game.others.list.get(m.id), m); return; }
    const was = game.pvp.off, maCu = toiMa(game);
    game.pvp.off = !!m.on;
    if ('ma' in m) maPkToi(game, m);
    if (m.on && !was) game.pvp.at = Date.now();
    if (was !== !!m.on && !maCu && !toiMa(game)) game.toast(m.on ? T.turned_off : T.turned_on, m.on ? 3.5 : 1.6);   // hóa ma / hết ma có chữ riêng (pvp-ma.js)
    return;
  }
  if ((m.t === 'ph' || m.t === 'pd' || m.t === 'pa') && (m.to === me || m.from === me)) game.pvp.at = Date.now();   // giao chiến: hẹn bật khiên tính lại
  if (m.t === 'pd' && m.to === me) game.chetThatT = game.time;   // phòng đã tính là chết thật (lá chắn Nguyên Anh đang hồi, thiên phạt): không hoá Nguyên Anh (anh-the.js)
  const o = game.others.list.get(m.to);
  if (m.t === 'pa') {   // Nguyên Anh: đòn hạ đầu không tính là bị giết
    if (m.to === me) hoaAnh(game, { pvp: true });
    else if (m.from === me) game.toast(fill(T.anh_ke, { name: o?.def?.name || o?.name || 'Đạo hữu' }), 3);
    return;
  }
  if (m.t === 'ph') {
    if (m.to === me) {
      p.hp = Math.min(p.hp, Math.max(1, Math.round(p.maxHp * m.r)));
      addNumber(game, p.x, p.y - 14, m.n, '#ff6a6a'); p.flash = 0.12; game.sfx('hurt');
      game.screen.shake(game.data.config.feel.shake, 0.12);
    } else if (o) { o.pvpR = m.r; o.pvpAt = game.time; addNumber(game, o.x, o.y - 16, m.n, m.from === me ? '#fff' : '#ff9a9a'); }
    return;
  }
  if (m.t === 'pd') {
    if (maPd(game, m, me, o)) { if (m.to === me && m.loot) setTimeout(() => settle(game), 800); return; }   // trận có ma (pvp-ma.js)
    if (m.to === me) {
      game.pvp.off = false;
      game.toast(fill(T.killed, { name: m.by }) + (!m.loot && honMinh(game, game.others.list.get(m.from)) ? ' ' + T.yeu_nan : ''), 3.5);
      p.hp = 0;   // game.js tự hồi sinh ở điểm hồi sinh
      if (m.loot) setTimeout(() => settle(game), 800);
    } else {
      if (o) { o.pk = 0; o.pvpR = 1; addFx(game, { type: 'puff', x: o.x, y: o.y, life: 0.5, r: 14, color: '#ff5a5a' }); }
      if (m.from === me) {
        const ten = o?.def?.name || 'Đạo hữu';
        game.toast(fill(T.kill, { name: ten }) + (m.loot ? ' ' + T.thu_cho : kemMinh(game, o) ? ' ' + T.yeu_ke : ''), 3.5);
        if (m.loot) thuSauHa(game, ten);   // chiến lợi phẩm về Hòm thư khi máy người gục trả nợ: hỏi Hòm thư vài lần, nhận xong báo (pvp-thu.js)
      }
    }
  }
}

// Trả nợ PvP: máy chủ trừ trong bản lưu trên máy chủ, máy này sửa y như vậy
export async function settle(game) {
  if (!canTrade(game) || game.pvpSettling) return;
  game.pvpSettling = true;
  try {
    const { settlePvp } = await import('../net/pvp.js');
    const T = P(game).text, s = game.save, lines = [];
    await game.cloud.run(() => settlePvp(), r => {
      for (const x of r?.mat || []) {
        if (x.noi === 'ma_giet' || x.noi === 'ma_diet' || x.noi === 'ma_tp' || x.noi === 'ma_sh') {   // hóa ma (ma_sh: sám hối dưới Cổ Thụ); túi: x.tui
          if (x.lt > 0) addCoins(game, -x.lt, 'pvp');
          lines.push(maTra(game, x)); if (x.tui) tuiMoi(game, x.tui);
          continue;
        }
        let item = '';
        if (x.lt > 0) addCoins(game, -x.lt, 'pvp');
        if (x.item_uid != null) {
          const it = s.bag.find(i => i.uid === x.item_uid);
          if (it) { item = itemName(game.data, it); s.bag = s.bag.filter(i => i.uid !== x.item_uid); for (const k of Object.keys(s.equip)) if (s.equip[k] === x.item_uid) delete s.equip[k]; }
        }
        if (x.mat_id) { s.mats[x.mat_id] = Math.max(0, (s.mats[x.mat_id] || 0) - x.n); item = `${matInfo(game.data, x.mat_id)?.name || x.mat_id} ×${x.n}`; }
        lines.push(fill(T.lost, { lt: x.lt || 0, item: item ? fill(T.lost_item, { name: item }) : '' }));
      }
      game.refreshStats(); game.persist();
    });
    const ln = lines.filter(Boolean);
    if (ln.length) game.toast(ln.join(' · '), 4);
  } catch { /* mạng lỗi: lần sau (vào game lại) */ }
  finally { game.pvpSettling = false; }
}
