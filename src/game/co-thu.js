// Cổ Thụ Ngàn Năm (chủ dự án 23/11/2026 15:33 và bảng câu hỏi: "Ngừng sét, không ai đánh", "0,5% thanh tầng đang ở", "Đả tọa dưới cây, chia đều",
// "Giữ phần đã ngồi"). Luật ở docs/16-HOA-MA.md mục "Cổ Thụ Ngàn Năm"; số ở data/pvp.json → server.ma.co (vòng sáng), ma.co_thu (luật, chữ).
// Máy chủ phòng làm trọng tài (cloud/src/co-thu.js): đếm phút người đả tọa trong vòng sáng, trong vòng không ai đánh ai, thiên phạt dừng. Máy này:
// - báo khi bước vào / ra vòng sáng, báo lúc bắt đầu sám hối (ma) hay hấp thu (người thường);
// - tin 'sh' (ma ngồi đủ một phút): điểm ma mới, trả nợ 'ma_sh' (máy chủ trừ 0,5% tu vi gửi lên cây), hết điểm ma thì lễ trở lại làm người;
// - tin 'ct' (người thường ngồi đủ một phút): nhận Hòm thư ngay, số linh khí bay lên trên đầu; 'ctl': linh khí cây còn lại (vẽ vòng sáng);
// - đang sám hối thì đả tọa không tự sinh linh khí (da-toa.js medPerSec gọi coChanQi).
import { addNumber, addFx } from './combat.js';
import { toiMa } from './pvp-ma.js';

const P = game => game.data.pvp;
const V = game => P(game)?.server?.ma?.co;
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const so = n => Math.round(n).toLocaleString('vi-VN');
const MAU = '#9fe8ff', VANG = '#ffe08a';

export const coTrong = (game, x, y) => { const c = V(game); return !!(c && game.map?.id === c.map && Math.hypot(x - c.x, y - c.y) <= c.r); };
const dangNgoi = game => { const p = game.player; return !!(p?.meditating && coTrong(game, p.x, p.y)); };
// Ma đang ngồi sám hối: đả tọa không tự sinh linh khí (linh khí của ma đang chảy lên cây)
export const coChanQi = game => toiMa(game) && dangNgoi(game);

// Mỗi khung (pvp.js updatePvp)
export function coTick(game) {
  const c = V(game), p = game.player, s = (game.coThu ??= { lk: null, hoi: 0, trong: false, ngoi: false });
  if (!c || !p || game.map?.id !== c.map) { s.trong = s.ngoi = false; s.maCu = null; return; }
  const T = P(game).ma.co_thu.text, now = Date.now();
  if (now - s.hoi > 60000 && game.online?.me?.id) { s.hoi = now; import('../net/pvp.js').then(N => N.coThuXem()).then(lk => { s.lk = lk; }).catch(() => {}); }
  const trong = coTrong(game, p.x, p.y), ngoi = trong && !!p.meditating;
  if (trong !== s.trong) game.toast(trong ? fill(toiMa(game) ? T.vao_ma : T.vao, { lk: so(s.lk || 0) }) : T.ra, trong ? 4 : 2);
  if (ngoi && !s.ngoi) {
    game.toast(toiMa(game) ? fill(T.ngoi_ma, { n: game.pvp.ma, p: game.pvp.ma }) : fill(T.ngoi, { lk: so(s.lk || 0) }), 4.5);
    addFx(game, { type: 'ring', x: p.x, y: p.y - 6, r: 30, color: toiMa(game) ? '#e8d6ff' : MAU, life: 0.8 });
  }
  s.trong = trong; s.ngoi = ngoi;
  bungKhiTan(game, s, c);
}

// Ai đang sám hối trong vòng (mình, người khác) vừa tan bớt điểm ma: nổ bung ma khí (vẽ ở draw-co-thu.js drawCoThuTren); hết hẳn thì nổ lớn
function bungKhiTan(game, s, c) {
  const cu = (s.maCu ??= new Map()), moi = new Map(), p = game.player, trong = (x, y) => Math.hypot(x - c.x, y - c.y) <= c.r;
  const xet = (id, x, y, ma, ngoi) => {
    moi.set(id, ma);
    const truoc = cu.get(id);
    if (truoc > ma && ngoi && trong(x, y)) (s.bung ??= []).push({ x, y, t0: game.time || 0, lon: ma === 0 });
  };
  xet('', p.x, p.y, game.pvp?.ma || 0, !!p.meditating);
  for (const [id, o] of game.others?.list || []) if (o.x != null) xet(id, o.x, o.y, +o.ma || 0, !!o.meditating);
  s.maCu = moi;
}

// Tin từ máy chủ phòng
export function coTin(game, m, settle) {
  const T = P(game).ma.co_thu.text, p = game.player, s = (game.coThu ??= { lk: null, hoi: 0 });
  if (m.t === 'ctl') { s.lk = Math.max(0, m.lk | 0); return; }
  if (m.t === 'ct') { import('./market.js').then(M => M.claimMail(game)).catch(() => {}); return; }   // Hòm thư 'co_thu': game.coThuNhan báo số (market.js)
  if (m.t !== 'sh' || !p) return;
  const cu = game.pvp.ma || 0;
  game.pvp.ma = Math.max(0, m.ma | 0);
  if (m.no) setTimeout(() => settle(game), 300);   // máy chủ trừ 0,5% tu vi gửi lên cây
  addNumber(game, p.x, p.y - 22, fill(T.so_sh, { n: game.pvp.ma }), '#e8d6ff');
  game.sfx?.('chime', 0.5);
  if (cu > 0 && !game.pvp.ma) {   // ma khí tan hết dưới gốc cây: lễ trở lại làm người
    game.chuLon?.({ ky: true, cau: T.het_chu, mau: VANG, giu: 1.6 });
    for (let i = 0; i < 3; i++) addFx(game, { type: 'ring', x: p.x, y: p.y - 8, r: 40 + i * 26, color: i ? MAU : VANG, life: 1 + i * 0.3 });
    game.screen?.shake(3, 0.3);
  }
}

// Thư linh khí Cổ Thụ vừa nhận (market.js claimMail gọi thay cho thông báo Hòm thư, kẻo mỗi phút một thư)
export function coNhan(game, q) {
  const p = game.player;
  if (!p || !(q > 0)) return;
  addNumber(game, p.x, p.y - 24, `+${so(q)} ${P(game).ma.co_thu.text.qi}`, MAU, true);
  for (let i = 0; i < 6; i++) addFx(game, { type: 'puff', x: p.x + (Math.random() - 0.5) * 30, y: p.y - 4 - Math.random() * 20, life: 0.8, r: 3, color: MAU });
}
