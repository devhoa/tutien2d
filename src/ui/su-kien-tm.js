// Thẻ sự kiện Nhập Tông Môn ở đầu bảng Sự kiện (src/ui/referral-panel.js; chủ dự án 24/11/2026 00:32: "tham gia tông môn bất kỳ là
// nhận được trang phục này"): hình các bộ quà, luật, nút Nhận (máy chủ kiểm đang ở tông môn, mỗi tài khoản một lần, gửi quà vào Thư)
// và nút Tìm tông môn. Chữ ở data/events.json → tong_mon.text; chữ báo giữ qua các lần vẽ lại bảng (30 giây một lần).
// Chấm đỏ ở nút Sự kiện (chủ dự án 24/11/2026 01:07 "Sự kiện chưa có chấm đỏ"): tmDot.
import { spriteIcon } from './sprite-icon.js';
import { every } from '../core/ticker.js';   // trang ẩn thì bỏ lượt
import { guildState } from '../game/guild.js';

const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

let msg = '';

// Đã xem thẻ / đã nhận quà: nhớ trong máy theo tài khoản (máy chủ vẫn là nơi quyết nhận được hay không, đây chỉ để tắt chấm đỏ)
const khoa = game => `p2d.sk.${game.data.events?.tong_mon?.ma || 'tm'}.${game.owner || 'khach'}`;
const doc = game => { try { return localStorage.getItem(khoa(game)) || ''; } catch { return ''; } };
const ghi = (game, v) => { try { if (doc(game) !== 'nhan') localStorage.setItem(khoa(game), v); } catch { /* máy chặn lưu: chấm đỏ theo phiên */ } };

// Chấm đỏ: đang ở tông môn mà chưa nhận quà (bấm Nhận là có ngay), hoặc chưa ở tông môn và chưa mở thẻ sự kiện lần nào
export function tmCo(game) {
  if (!game.data.events?.tong_mon || !game.online || !game.cloud || !game.save) return false;
  const v = doc(game), mine = guildState(game).mine;
  return v !== 'nhan' && (!!mine || (mine === null && v !== 'xem'));
}

export function tmDot(game) {
  every(() => {
    const t = document.getElementById('hud-event');
    if (!t) return;
    const co = tmCo(game);
    let dot = t.querySelector(':scope > i');   // chấm báo cùng kiểu chấm của ô Menu, ô Thư (src/ui/hop-thu.js, hud-khung.css)
    if (co && !dot) { dot = document.createElement('i'); t.append(dot); }
    if (dot) dot.hidden = !co;
  }, 1500);
}

export function tmCard(game, close) {
  const E = game.data.events?.tong_mon, T = E?.text, F = game.data.fashion.list;
  if (!E || !T) return null;
  ghi(game, 'xem');
  const ids = E.outfits.filter(id => F[id]);
  const box = el('div', 'ev-note top ev-tm');
  const imgs = el('div', 'ev-tm-imgs');
  for (const id of ids) {
    const c = el('div', 'ev-tm-bo');
    c.append(spriteIcon(game, F[id].look?.sprite, 0, 84, 'ev-tm-hinh', true), el('small', null, F[id].name));
    imgs.append(c);
  }
  const row = el('div', 'ev-row'), b = el('button', 'act-btn primary', T.claim), go = el('button', 'act-btn', T.go), note = el('p', 'fb-msg', msg);
  note.hidden = !msg;
  b.onclick = async () => {
    b.disabled = true; b.textContent = T.busy;
    try {
      const { skTmNhan } = await import('../net/su-kien.js'), r = await skTmNhan();
      msg = r?.ok ? fill(T.ok, { n: r.n ?? ids.length }) : T[r?.ly_do] || T.err;
      if (r?.ok || r?.ly_do === 'da_nhan') ghi(game, 'nhan');   // tắt chấm đỏ
      if (r?.ok) { game.sfx?.('levelup'); import('../game/market.js').then(M => M.claimMail(game)).catch(() => {}); }   // nhận thư liền như quà Hệ Thống
    } catch { msg = T.err; }
    b.disabled = false; b.textContent = T.claim; note.textContent = msg; note.hidden = false;
  };
  go.onclick = () => { close?.(); game.openGuild?.(); };
  row.append(b, go);
  box.append(el('b', 'ev-note-title', T.title), el('p', null, fill(T.rule, { n: ids.length, list: ids.map(id => F[id].name).join(', ') })), imgs, row, note);
  return box;
}
