// Thân pháp (chủ dự án 22/11/2026 04:25–04:28, docs/17-THAN-PHAP.md): đánh thường thành CHUỖI LIÊN HOÀN. Nhát 1 chém (đường cũ của player.js),
// nhát 2 đâm xa, nhát 3 cầm vũ khí xuyên qua xuyên lại, nhát 4 và 5 là hai Ô KHẢM chứa "thức" đặc biệt mở theo truyện. Mọi nhát vẽ bằng chính hình
// vũ khí đang cầm (src/render/draw-than-phap*.js). Tệp này: chuỗi nhát, ô khảm, mở thức, ra đòn của mình, cập nhật mọi màn diễn đang chạy (của mình
// và của người khác: tin hu-tp-<thức> qua src/game/dien.js, chỉ để nhìn). Diễn biến từng thức: src/game/than-phap-thuc.js, than-phap-thuc2.js.
// Số và chữ: data/than-phap.json. Sát thương chỉ tính ở máy mình (I.own); đòn vào người chơi khác vẫn là nhát chém thường (p.swingT, src/game/pvp.js).
import { totalLayer } from './stats.js';
import { hieuUng } from './dien.js';
import { phat } from './phat.js';
import { startStrike } from './flyweapon.js';
import { THUC } from './than-phap-thuc.js';

export const TP = d => d?.['than-phap'];
export const tpOn = game => !!TP(game.data)?.on;

// Điều kiện mở (ô khảm, thức): {} mở sẵn · co: cờ truyện · tong: tổng tầng tu (0 = Luyện Khí tầng 1, như data/realms.json → map_open) · thuc: số thức đã mở
function mo(game, m) {
  const s = game.save;
  if (!m || !s) return !!s;
  if (m.co && !s.flags?.[m.co]) return false;
  if (m.tong != null && totalLayer(s, game.data.realms) < m.tong) return false;
  if (m.thuc && tpThuc(game).length < m.thuc) return false;
  return true;
}
export const tpMo = (game, m) => mo(game, m);

// Các thức đã mở, theo thứ tự trong data
export function tpThuc(game) {
  const S = TP(game.data);
  return S ? Object.entries(S.thuc).filter(([, d]) => !d.mo?.thuc && mo(game, d.mo)).map(([id]) => id) : [];
}
export const tpOMo = (game, i) => !!TP(game.data)?.o[i] && mo(game, TP(game.data).o[i].mo);

// Hai ô khảm đang chứa gì. save.tpO là lựa chọn của người chơi; ô đang mở mà trống (chưa chọn, hoặc thức trong đó không còn hợp lệ) thì tự khảm
// thức đã mở đầu tiên chưa nằm ô nào, nên vừa lĩnh ngộ thức thứ hai là ô nhát 5 có ngay
export function tpO(game) {
  const S = TP(game.data), co = tpThuc(game), cu = Array.isArray(game.save?.tpO) ? game.save.tpO : [];
  if (!S) return [];
  const o = S.o.map((O, i) => (tpOMo(game, i) && co.includes(cu[i]) ? cu[i] : null));
  for (let i = 1; i < o.length; i++) if (o[i] && o.indexOf(o[i]) < i) o[i] = null;   // một thức không nằm hai ô
  for (let i = 0; i < o.length; i++) if (!o[i] && tpOMo(game, i)) o[i] = co.find(x => !o.includes(x)) || null;
  return o;
}

export function tpDat(game, i, id) {
  if (!tpThuc(game).includes(id) || !tpOMo(game, i)) return false;
  const o = tpO(game), j = o.indexOf(id);
  if (j >= 0 && j !== i) o[j] = o[i];   // đã nằm ô kia: đổi chỗ hai ô
  o[i] = id; game.save.tpO = o; game.persist?.();
  return true;
}

// Chuỗi nhát đang có: ['chem', 'dam', 'xuyen', thức ô 1, thức ô 2] (ô chưa mở thì chuỗi ngắn lại)
export function tpChuoi(game) {
  const S = TP(game.data), o = tpO(game);
  return S ? S.nhat.map(n => (n.o != null ? o[n.o] : n.id)).filter(Boolean) : [];
}

// Nhát kế của chuỗi (gọi mỗi lần vung đòn thường, player.js swing). Trả { i, id, ra }: ra = true nghĩa là nhát này do tệp này ra đòn (tpRa);
// false: đường chém / bắn cũ. Vũ khí bắn (đàn, cung) nhát 1–3 vẫn bắn như thường. null: tắt, đang cưỡi, đang bay.
export function tpNhat(game, w) {
  const p = game.player;
  if (!tpOn(game) || !p || p.riding || p.flying) return null;
  const S = TP(game.data), ds = tpChuoi(game), st = p.tp ??= { k: 0, last: -99 }, now = game.time || 0;
  if (!ds.length) return null;
  if (now - st.last > S.cua_so || st.k >= ds.length) st.k = 0;
  const i = st.k, id = ds[i];
  st.k = (i + 1) % ds.length; st.last = now;
  return { i, id, ra: id !== 'chem' && !(w?.attack === 'shot' && i < 3), cuoi: i === ds.length - 1 };   // cuoi: nhát cuối chuỗi, số sát thương bung vàng
}

// Ra nhát thân pháp của mình. c: { w: vũ khí, dmg: sát thương một nhát chém thường, ang: hướng, half: nửa cung chém, R: tầm chém }. Trả giây tới nhát kế.
export function tpRa(game, tp, c) {
  const p = game.player, S = TP(game.data);
  p.swingT = 0.18;   // người khác thấy vung đòn (nhip-mang.js), đòn vào người chơi khác tính như nhát chém thường (pvp.js)
  game.player.tp.last = game.time || 0;
  if (tp.id === 'dam') {   // đâm: vẫn là vũ khí bay lao ra (flyweapon.js), tầm xa hơn, cung hẹp; sát thương tính lúc tới nơi (player.js strike)
    const N = S.nhat[1], R = c.R * N.tam, t = startStrike(game, 'arc', c.ang, R, 0, 'dam');
    p.hitQ = { t, ang: c.ang, half: N.goc * Math.PI / 180, w: c.w, dmg: c.dmg * N.mul, move: 'dam', R, nhat: tp.i, cuoi: tp.cuoi };
    tao(game, 'dam', p, game.hoSo, c.ang, true, { R });
    phat(game, 'hu-tp-dam', Math.cos(c.ang), Math.sin(c.ang));
    return c.w.cooldown;
  }
  const d = tp.id === 'xuyen' ? S.nhat[2] : S.thuc[tp.id], fl = game.save?.flags;
  if (tp.i >= 3 && fl && !fl['tp-nhac']) { fl['tp-nhac'] = true; game.toast?.(S.text.nhac, 6); }   // lần đầu ra thức khảm: Hệ Thống chỉ chỗ đổi thức (một lần)
  startStrike(game, 'arc', c.ang, c.R, c.half);   // người ra động tác đánh của mình (khung đánh của nhân vật), vũ khí bay thì giấu đi làm thức
  const I = tao(game, tp.id, p, game.hoSo, c.ang, true, { dmg: c.dmg, R: c.R, tg: c.target, nhat: tp.i, cuoi: tp.cuoi });
  if (!I) return c.w.cooldown;
  p.tpAn = I;
  phat(game, 'hu-tp-' + tp.id, Math.cos(c.ang), Math.sin(c.ang));
  return Math.max(c.w.cooldown, d.cd || 0);
}

// Diễn một thức ngay tại chỗ, không trúng quái (truyện vừa dạy xong: người chơi thấy liền thức mình vừa học). Người cùng tinh cầu cũng thấy.
export function tpDien(game, id) {
  const p = game.player;
  if (!p || !THUC[id]) return;
  const a = Math.atan2(p.face?.y || 0, p.face?.x || 1), I = tao(game, id, p, game.hoSo, a, true, { demo: true, R: 36 });
  if (I && !p.riding && !p.flying) p.tpAn = I;
  phat(game, 'hu-tp-' + id, Math.cos(a), Math.sin(a));
}

// Truyện dạy một thức (lệnh { "than_phap": "<mã thức>" } trong data/story.json): bật cờ mở, khảm vào ô (ô trống, không thì nhát 5: thứ vừa học là thứ
// người chơi muốn thử ngay), hàng chữ lớn báo tên thức, rồi diễn thử. Trả tên thức (rỗng: không có / đã học).
export function tpHoc(game, id) {
  const S = TP(game.data), d = S?.thuc[id], s = game.save;
  if (!d || !s) return '';
  const moi = !mo(game, d.mo);
  if (d.mo?.co) s.flags[d.mo.co] = true;
  let o = tpO(game), at = o.indexOf(id);
  if (at < 0) { for (let i = o.length - 1; i >= 0; i--) if (tpOMo(game, i)) { tpDat(game, i, id); at = i; break; } }
  o = tpO(game); at = o.indexOf(id);
  game.persist?.();
  if (!moi) return '';
  game.sfx?.('breakthrough');
  game.chuLon?.({ nhan: S.text.hoc_nhan, cau: d.ten, mau: d.mau || '#ffd98a', giu: 2.0 });
  game.toast?.((at >= 0 ? S.text.hoc_ok : S.text.hoc_ok2).replace('{ten}', d.ten).replace('{i}', at + 4), 5);
  tpDien(game, id);
  return d.ten;
}

// Tạo một màn diễn. e: thân người diễn (mình: game.player, người khác: bản đang thấy), h: hồ sơ ngoại hình (hình vũ khí, hệ), own: máy mình (tính đòn)
const perf = () => +(globalThis.document?.body?.dataset?.perf || 0) || 0;   // máy yếu (mức hạ hiệu ứng, như others.js)
function tao(game, kind, e, h, dir, own, c = {}) {
  const S = TP(game.data), H = THUC[kind], d = kind === 'xuyen' ? S?.nhat[2] : kind === 'dam' ? S?.nhat[1] : S?.thuc[kind], p = game.player;
  if (!d || !H || !e) return null;
  if (!own && (!p || Math.hypot(e.x - p.x, e.y - p.y) > 330 || (game.tpFx || []).filter(I => !I.own).length >= (perf() ? 3 : 8))) return null;   // người khác ở xa ngoài màn, hay đã đủ màn diễn của người khác: thôi vẽ (máy yếu ít hơn)
  const he = h?.element || e.element || (own ? game.save?.element : null), el = game.data.elements[he]?.color || '#bff4ff';
  // tpI / tpCuoi: nhát thứ mấy của chuỗi, nhát cuối chuỗi (màu số sát thương, so-nay.js). Không đặt tên I.nhat / I.cuoi: Bách Thứ dùng hai tên ấy (23/11/2026)
  const I = { kind, d, own, demo: !!c.demo, e, h, map: game.map?.id, x: e.x, y: e.y - 8, dir, ca: Math.cos(dir), sa: Math.sin(dir), t: 0, T: 1, an: d.an || 0,
    el, mau: d.mau || el, dmg: c.dmg || 0, R: c.R || 36, tg0: c.tg || null, hat: [], seed: (Math.random() * 1e9) | 0, tpI: c.nhat, tpCuoi: !!c.cuoi,
    lon: ['cung', 'dan'].includes(h?.vkl || (own ? game.save?.weapon : '')) ? 0.6 : 1 };   // lon: cung, đàn hoá lớn ít hơn kiếm (cây cung khổng lồ cắm đất trông thô)
  H.bat(game, I);
  (game.tpFx ??= []).push(I);
  if (!own) e.tpAnT = (game.time || 0) + I.an;   // người khác: vũ khí sau lưng họ giấu đi trong lúc làm thức (draw-flyweapon.js drawOtherWeapon)
  return I;
}

export const tpTao = (game, kind, e, h, dir, own, c) => tao(game, kind, e, h, dir, own, c);   // dựng một màn diễn (bài thử tools/than-phap.test.mjs)

// Mỗi nhịp game (player.js): chạy mọi màn diễn, hạt sáng; vũ khí làm xong thức thì bay từ chỗ kết thúc về sau lưng
export function tpTick(game, dt) {
  const L = game.tpFx, p = game.player;
  if (!L?.length) { if (p?.tpAn) p.tpAn = null; return; }
  for (const I of L) {
    if (I.map !== game.map?.id) { I.t = I.T; continue; }   // đổi bản đồ giữa chừng: bỏ màn diễn, không trúng quái bản đồ mới
    I.t += dt;
    THUC[I.kind].nhip(game, I, dt);
    for (const q of I.hat) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; const k = Math.exp(-dt * (q.keo ?? 3)); q.vx *= k; q.vy = q.vy * k + (q.g || 0) * dt; }
    if (I.hat.length) I.hat = I.hat.filter(q => q.t < q.life);
    if (p && p.tpAn === I && I.t >= I.an) traVe(game, I);
  }
  game.tpFx = L.filter(I => I.t < I.T);
  if (p?.tpAn && !game.tpFx.includes(p.tpAn)) traVe(game, p.tpAn);
}
function traVe(game, I) {
  const p = game.player;
  p.tpAn = null;
  if (p.fw && I.vx != null && I.map === game.map?.id) { p.fw.act = null; p.fw.x = I.vx; p.fw.y = I.vy; if (I.va != null) p.fw.a = I.va; p.fw.trail.length = 0; }
}

// Người khác diễn thân pháp (tin hu-tp-<thức>): dựng màn diễn chỉ để nhìn. a, b: hướng (cos, sin)
for (const kind of Object.keys(THUC)) hieuUng('tp-' + kind, { gap: 0.2, ve(game, e, h, a, b) { if (e !== game.player) tao(game, kind, e, h, Math.atan2(b, a), false); } });
