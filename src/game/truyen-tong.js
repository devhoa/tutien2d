// Pháp trận truyền tống (chủ dự án 23/11/2026 19:31: "xây thêm mỗi khu 1 pháp trận truyền tống, khi chạy vào pháp trận sẽ có nút dịch chuyển
// (giống kiểu nút đả toạ); ấn dịch chuyển và mở map chọn tinh cầu, tạo hiệu ứng cột sáng mờ xung quanh chọc lên trời, 2–5 giây sau đưa tới tinh
// cầu mới; lúc load tinh cầu mới chính là cái time trận pháp tạo hiệu ứng truyền tống, chứ không nên truyền xong mới load").
// Mỗi tinh cầu khai phap_tran (data/maps; tinh cầu tông môn ở kh-gen.js), hình trận nằm phẳng dưới chân (src/world/hoi-foot.js). Đứng giữa trận:
// nút hành động "Dịch chuyển" (interact.js) mở Tinh đồ chế độ truyền tống (src/ui/world-map.js). Chọn tinh cầu: trận khởi, người được kéo vào
// giữa trận, tám cột sáng mọc từ tám đá cổ tự chọc lên trời; CÙNG LÚC dựng sẵn bản đồ nơi đến và tải nền, đồ, NPC, quái của nó (ảnh tải song
// song, trận sáng dần theo phần đã tải). Đủ min giây và đã tải xong thì bùng sáng rồi sang thẳng, không màn "Đang tải" (world-veil.js
// khongChe); cột sáng giáng xuống trận bên kia. Số ở data/config.json → truyen_tong; hình ở src/render/draw-truyen-tong.js.
// Người cùng tinh cầu thấy cả ba cảnh qua dien.js (tin hu-tt-di, hu-tt-bay, hu-tt-den); tin lúc tới gửi sau khi đã nối phòng bản đồ mới
// (gửi trước lúc nối là mất). Trong lúc trận chạy: game.traveling bật (Tự hành, truyện, Tinh đồ, so tài… đứng chờ như lúc bay) nhưng vòng game
// vẫn chạy (game.js), người đứng yên, đòn quái không trúng (combat.js hitPlayer); gục (PvP, thiên phạt) thì trận tan.
import { buildMap } from '../world/map.js';
import { nenReady } from '../world/draw-nen.js';
import { spriteImage } from '../render/sprites.js';
import { hieuUng, dien } from './dien.js';
import { phat } from './phat.js';
import { whyNot } from './starmap.js';

export const ttCfg = game => game.data.config.truyen_tong || {};
export const TRAN_IDX = -1e6;   // idx của hình trận do hoi-foot.js thêm (bảng Bày cảnh bỏ qua idx âm)
const smooth = x => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };

// Trận của một bản đồ (mặc định bản đồ đang đứng): tâm đĩa (đơn vị thế giới), cỡ hình k, bán kính vòng tám đá rx, ry, vùng đứng r.
// Tính theo hình trận thật trên bản đồ (Thiên Kiếm Tinh: hình bày trong hoi.do); không có trận thì null.
export function tranCua(game, map = game.map) {
  const C = ttCfg(game), P = map?.def?.phap_tran;
  if (!P?.at || C.on === false) return null;
  if (map._tran?.hoi === map.hoi) return map._tran;   // một lần mỗi bản đồ (Bày cảnh dời đồ thì tính lại)
  const hoi = map.hoi || [], it = hoi.find(h => h.idx === TRAN_IDX) || hoi.find(h => h.id === C.spr), T = map.T, a = it?.spr.anchor;
  const k = it ? it.k : (P.s ?? C.s) * 0.5;
  const x = it ? it.x + (C.tam[0] - a[0]) * k : (P.at[0] + 0.5) * T, y = it ? it.y - (a[1] - C.tam[1]) * k : (P.at[1] + 0.5) * T;
  return (map._tran = { hoi: map.hoi, x, y, k, rx: C.da[0] * k, ry: C.da[1] * k, r: C.da[0] * k * C.r });
}

// Đang đứng ở vùng giữa trận (e: thân người, mặc định mình)
export function trongTran(game, e = game.player) {
  const tr = tranCua(game);
  return !!tr && !!e && Math.hypot(e.x - tr.x, (e.y - tr.y) * tr.rx / tr.ry) <= tr.r;
}

// Lý do chưa truyền tống được (null: được). b: thiên thể chọn ở Tinh đồ; không có b thì chỉ xét chỗ đứng, trạng thái
export function ttChan(game, b) {
  const T = ttCfg(game).texts || {}, p = game.player;
  if (!trongTran(game)) return T.roi;
  if (game.tt || game.trip || game.traveling || game.duel || game.ghost || !(p?.hp > 0) || game.trib?.active || game.story?.busy) return T.ban;
  if (!b) return null;
  if (b.map === game.map.id) return game.data.starmap.texts.here;
  return whyNot(game, b);
}

// Nút "Dịch chuyển": mở Tinh đồ chế độ truyền tống
export function moTruyenTong(game) {
  const why = ttChan(game);
  if (why) { game.toast(why, 1.8); return; }
  game.sfx?.('tt.vang', 0.6);
  game.worldMap?.open({ tt: true });
}

// Ảnh NPC, quái của nơi đến: tải trước như nền (chưa xong tới max giây thì thôi chờ, hình hiện sau)
function anhPhu(D, def) {
  const S = D.art.sprites, out = new Set();
  for (const n of def.npcs || []) { const k = D.npcs?.[n.id]?.hinh || n.id; for (const id of ['comp.' + k, 'npc.' + k]) if (S[id]?.file) out.add(S[id]); }
  for (const s of def.spawners || []) { const id = 'mob.' + s.mob; if (D.mobs?.[s.mob]?.look && S[id]?.file) out.add(S[id]); }
  return [...out];
}

// Phần đã tải của nơi đến: chinh (nền + đồ trên bản đồ, như màn che world-veil.js đòi), phu (NPC, quái). Gọi tới đâu ảnh nạp tới đó.
// Ảnh vừa tải xong thì giải mã luôn (decode) để khung đầu tiên ở nơi đến khỏi khựng.
function tienDo(game, st) {
  const m = st.map;
  let n = 0, ok = 0, pk = 0;
  const xong = im => { if (im && !st.giai.has(im)) { st.giai.add(im); im.decode?.().catch(() => {}); } return !!im; };
  for (const it of m.hoi || []) if (it.spr) { n++; if (xong(spriteImage(it.spr))) ok++; }
  const nen = !m.def.nen || nenReady(game, m);
  for (const s of st.them) if (xong(spriteImage(s))) pk++;
  return { chinh: nen && ok === n ? 1 : (nen ? 0.4 : 0) + 0.6 * (n ? ok / n : 1) * 0.99, phu: st.them.length ? pk / st.them.length : 1 };
}

// Chọn tinh cầu ở Tinh đồ (b: thiên thể): trận khởi. Bản đồ nơi đến dựng ngay, ảnh bắt đầu tải từ khung này.
export function batDauTruyen(game, b) {
  const C = ttCfg(game), why = ttChan(game, b), p = game.player, D = game.data, def = D.maps[b?.map];
  if (why || !def) { game.toast(why || D.starmap.texts.soon, 2); return false; }
  game.traveling = true;
  p.meditating = false; p.flying = false; p.landTo = null; p.kx = p.ky = 0; p.dashT = 0; p.moving = false;
  const st = game.tt = { to: b.map, ten: b.name || def.name, tu: game.map.id, t: 0, x0: p.x, y0: p.y, tr: tranCua(game), I: 0, nhip: C.vang * 0.6, bay: 0, giai: new Set(), dem: 0 };
  st.map = buildMap(def, D.tiles, D.config.tile, D); st.them = anhPhu(D, def);
  st.td = tienDo(game, st);
  dien(game, 'tt-di');
  game.sfx?.('tt.khoi', 1);
  game.toast?.(C.texts.khoi.replace('{name}', st.ten), 2.4);
  return true;
}

// Mỗi khung (game.js, chạy cả lúc mở bảng). true: đang truyền tống, game.js không cho người đi lại / ra đòn khung này.
export function ttTick(game, dt) {
  const cho = game.ttCho;   // vừa tới nơi: tin cho người ở nơi mới gửi khi đã nối phòng (online-cf.js ready), quá hạn thì thôi
  if (cho && (game.online?.ready?.() || (!game.online?.ready && game.time > cho.gui) || game.time > cho.het)) { if (game.time <= cho.het) phat(game, 'hu-tt-den'); game.ttCho = null; }
  const st = game.tt;
  if (!st) return false;
  const C = ttCfg(game), p = game.player;
  st.t += dt;
  game.input.clear();
  if (st.den) { if (st.t >= st.het) { game.tt = null; game.traveling = false; } return !!game.tt; }   // vừa tới: hiện hình trong cột sáng, chưa đi ngay
  if (!(p.hp > 0) || game.ghost || game.map.id !== st.tu) { huyTruyen(game); return false; }   // gục giữa chừng, bị đưa đi nơi khác: trận tan
  const k = smooth(st.t / C.keo);   // kéo vào giữa trận
  if (st.tr) { p.x = st.x0 + (st.tr.x - st.x0) * k; p.y = st.y0 + (st.tr.y - st.y0) * k; }
  p.moving = false; p.meditating = false;
  if (k < 1) p.face = { x: 0, y: 1 };
  if ((st.dem -= dt) <= 0) { st.dem = 0.1; st.td = tienDo(game, st); }
  st.I = st.bay ? 1 : Math.min(smooth(st.t / C.min), 0.25 + 0.75 * st.td.chinh);
  if (!st.bay && (st.nhip -= dt) <= 0) { st.nhip = C.vang; game.sfx?.('tt.vang', 0.35 + 0.55 * st.I); }
  if (!st.bay && !st.bao && st.t >= C.max && st.td.chinh < 1) { st.bao = 1; game.toast?.(C.texts.cham, 2.2); }   // mạng chậm: trận còn tụ, báo cho người chơi biết vì sao lâu
  const xong = st.td.chinh >= 1 && (st.td.phu >= 1 || st.t >= C.max);
  if (!st.bay && ((st.t >= C.min && xong) || st.t >= C.cap)) {
    st.bay = st.t; dien(game, 'tt-bay'); game.sfx?.('tt.bay', 1); game.screen.shake?.(1.6, 0.22);
  }
  if (st.bay && st.t - st.bay >= C.bay) sang(game);
  return true;
}

// Sang nơi mới: bản đồ đã tải sẵn nên không phủ màn Đang tải; đứng đúng giữa trận bên kia, cột sáng giáng xuống
function sang(game) {
  const st = game.tt;
  game.tt = null; game.ttFx = [];
  game.ttLan = { to: st.to, t: Math.round(st.t * 100) / 100, td: st.td };   // lần truyền tống vừa rồi (bài thử, đo)
  game.khongChe = st.to;
  Promise.resolve(game.travel(st.to, 'phap-tran', false, { force: true })).catch(() => {});   // nhánh không bay chạy đồng bộ: tới đây đã ở nơi mới
  if (game.map.id !== st.to) { game.traveling = false; return; }
  hienTaiTran(game);
}

// Hiện ra giữa trận của bản đồ đang đứng, cột sáng giáng xuống: tới nơi bằng trận; vào game, gục rồi về trận tông môn (src/game/diem-ve.js).
// khoa: đứng trong cột sáng C.khoa giây rồi mới đi được (truyện chờ một chút); lúc vào game thì không khoá.
export function hienTaiTran(game, { khoa = true } = {}) {
  const C = ttCfg(game), p = game.player, tr = tranCua(game);
  if (!p || !game.map) return false;
  if (tr && !game.map.blocked(tr.x, tr.y, p.r || 5)) { p.x = tr.x; p.y = tr.y; game.screen?.snap?.(p.x, p.y); }
  p.face = { x: 0, y: 1 };
  veDen(game, p);   // máy mình diễn ngay; tin cho người ở nơi mới gửi khi đã nối phòng (ttTick)
  game.ttCho = { gui: game.time + 1, het: game.time + 6 };
  game.flashT = Math.max(game.flashT || 0, 0.3);
  game.screen?.shake?.(1.2, 0.2);
  if (khoa) { game.tt = { den: 1, t: 0, het: C.khoa }; game.traveling = true; }   // hiện hình trong cột sáng rồi mới đi được
  return true;
}

// Trận tan (gục, bị đưa đi): cột sáng tắt dần, người khác cũng thấy tắt (tin tt-bay không kèm bùng: b = 1)
export function huyTruyen(game) {
  if (!game.tt) return;
  game.tt = null; game.traveling = false;
  for (const f of game.ttFx || []) if (f.loai === 'di' && f.own && !f.bay) { f.bay = game.time; f.tan = 1; }
  phat(game, 'hu-tt-bay', 1);
  game.toast?.(ttCfg(game).texts.tan, 1.4);
}

// ---- Hiệu ứng viết một lần cho mình và người khác (dien.js). e: thân người diễn; bám theo trận của bản đồ đang thấy (người đứng trong trận),
// không có trận gần đó thì bám chỗ người đứng. f.map: chỉ vẽ khi còn ở bản đồ đó.
function neo(game, e) {
  const tr = tranCua(game);
  if (tr && Math.hypot(e.x - tr.x, e.y - tr.y) <= tr.rx * 1.6 + 24) return { x: tr.x, y: tr.y, k: tr.k, rx: tr.rx, ry: tr.ry };
  const C = ttCfg(game), k = C.s * 0.5;
  return { x: e.x, y: e.y, k, rx: C.da[0] * k, ry: C.da[1] * k };
}
const gan = (game, e) => e === game.player || (game.player && Math.hypot(e.x - game.player.x, e.y - game.player.y) < 300);
function themFx(game, f) { (game.ttFx ||= []).push({ ...f, map: game.map, seed: Math.random() * 100 }); if (game.ttFx.length > 24) game.ttFx.shift(); }

function veDi(game, e) {
  themFx(game, { loai: 'di', t0: game.time, e, own: e === game.player, ...neo(game, e) });
  if (e !== game.player && gan(game, e)) game.sfx?.('tt.khoi', 0.45);
}
function veBay(game, e, a) {
  const f = (game.ttFx || []).find(x => x.loai === 'di' && x.e === e && !x.bay);
  if (f) { f.bay = game.time; f.tan = a >= 1 ? 1 : 0; } else if (a < 1) themFx(game, { loai: 'di', t0: game.time - 2, bay: game.time, e, own: e === game.player, ...neo(game, e) });
  if (a < 1 && e !== game.player && gan(game, e)) game.sfx?.('tt.bay', 0.45);
}
function veDen(game, e) {
  themFx(game, { loai: 'den', t0: game.time, e, own: e === game.player, ...neo(game, e) });
  if (e === game.player || gan(game, e)) game.sfx?.('tt.den', e === game.player ? 1 : 0.45);
}
hieuUng('tt-di', { gap: 1, ve: (game, e) => veDi(game, e) });
hieuUng('tt-bay', { gap: 0.3, ve: (game, e, h, a) => veBay(game, e, a) });
hieuUng('tt-den', { gap: 1, ve: (game, e) => veDen(game, e) });
