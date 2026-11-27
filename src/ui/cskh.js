// CSKH: chăm sóc đạo hữu (chủ dự án 24/11/2026 23:37: "bỏ phần góp ý báo lỗi và đề xuất, thay vào đó thêm một nút CSKH ngay dưới chữ
// mùa đông, dễ nhìn dễ ấn, kể cả trong màn hình đăng nhập… ý chính, ý phụ miêu tả vấn đề"). Thay mục Góp ý của Hệ Thống (he-thong-gop.js cũ).
// Một nút cố định ở góc phải trên (cả màn đăng nhập lẫn lúc chơi), bảng dạng nhắn tin: chọn Ý chính → Ý phụ → CSKH trả lời ngay cách tự
// xử lý (meo) → kể thêm (bắt buộc), ảnh màn hình tự chụp lúc mở → Gửi. Mục "Tin đã gửi": các tin cũ và lời trả lời của đội làm game.
// Gửi qua đường góp ý có sẵn (src/net/feedback.js → p2d_gop_y, máy chủ không đổi): loai de_xuat / loi, tieu_de "Ý chính · Ý phụ".
// Chưa đăng nhập (màn đăng nhập, chơi thử, quên mật khẩu): vẫn gửi được, không ảnh, kèm tên tài khoản / cách liên hệ (p2d_cskh_khach,
// chủ dự án 24/11/2026 23:5x: "K dẫn sang zalo, cố gắng để đọc đc hết ý kiến của khách kể cả chưa đăng nhập"). Chữ ở data/community.json → cskh.
// Chữ người chơi gõ chỉ gán textContent / value.
import { choGoc, keoCskh } from './cskh-keo.js';
import { shotScreen, fromFile, context } from './feedback-shot.js';
import { goc, BUILD } from '../core/build.js';
import { ready, translateData } from '../core/i18n.js';

const net = () => import('../net/feedback.js');
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function nut(cls, text, fn) { const b = el('button', cls, text); b.type = 'button'; b.onclick = e => { e.stopPropagation(); fn(); }; return b; }
const gio = t => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }); };

// Nút có từ màn tải (chủ dự án 25/11/2026 01:1x: "nút CSKH phải hiện trên mọi nút… kể cả đang load game mà load chưa xong vẫn hiện"):
// src/ui/man-dau.js gọi createCskhSom() với một game tạm chỉ có data.community; vào game xong main.js gọi createCskh(game) thì chỉ
// đổi sang game thật (bối cảnh gửi kèm, tiếng), không dựng nút thứ hai.
export async function createCskhSom() {
  try {
    const r = await fetch(`data/community.json?v=${BUILD}`, { cache: 'no-cache' });
    if (!r.ok) return;
    const community = await r.json(); await ready;
    if (!window.__cskh) createCskh({ data: translateData({ community }) });
  } catch { /* mạng lỗi: vào game xong main.js dựng nút */ }
}

// Luật 25/11/2026 (chủ dự án: "nút CSKH k đè lên nút tắt x"): nút CSKH đè lên nút đóng (✕) đang hiện của bảng nào thì dời xuống ngay
// dưới nút đó; hết đè thì về chỗ cũ. Nút đóng: nút cuối dòng đầu bảng (.bag-head), nút id …-close / .close-x, nút chữ ✕ × X, aria-label Đóng.
const NUT_X = '.bag-head > button:last-child, [id$="-close"], .close-x, button[aria-label="Đóng"], button[aria-label="Close"], button.mini';
function laNutX(e) {
  if (e.closest('#cskh, #btn-cskh')) return false;
  if (e.matches('button.mini') && !/^[✕×xX✖]$/.test((e.textContent || '').trim()) && !e.matches('.bag-head > button:last-child')) return false;
  const r = e.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
}
export function neX(btn) {
  if (!btn?.isConnected) return;
  if (btn.classList.contains('dang-keo')) return;   // đang kéo (cskh-keo.js)
  btn.style.top = choGoc(btn);
  const xs = [...document.querySelectorAll(NUT_X)].filter(laNutX);
  for (let lan = 0; lan < 3; lan++) {
    const b = btn.getBoundingClientRect(), dem = 4;
    const de = xs.find(e => { const r = e.getBoundingClientRect(); return r.left < b.right + dem && r.right > b.left - dem && r.top < b.bottom + dem && r.bottom > b.top - dem; });
    if (!de) return;
    btn.style.top = Math.round(de.getBoundingClientRect().bottom + 6) + 'px';
  }
}

export function createCskh(game) {
  if (window.__cskh) { window.__cskh(game); return; }
  const K = game.data.community?.cskh, F = game.data.community?.feedback;
  if (!K?.on || !F) return;
  const H = { game };
  window.__cskh = g => { H.game = g; g.openCskh = open; g.openGopY = () => open('moi'); };
  const T = K.text, G = K.groups;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = goc('src/ui/cskh.css'); document.head.append(l);

  const btn = el('button', null); btn.id = 'btn-cskh'; btn.type = 'button'; btn.setAttribute('aria-label', K.title);
  btn.append(el('i', null, '🎧'), el('b', null, K.btn));
  const root = el('div', 'panel cskh'); root.id = 'cskh'; root.hidden = true;
  const head = el('div', 'bag-head'), x = el('button', 'mini', '✕'), tabs = el('div', 'cskh-tabs'), body = el('div', 'cskh-body');
  x.setAttribute('aria-label', 'Đóng');
  head.append(el('b', null, K.title), x);
  root.append(head, tabs, body);
  document.body.append(btn, root);
  for (const e of [btn, root]) e.addEventListener('pointerdown', ev => ev.stopPropagation());
  keoCskh(btn);   // nút nhỏ kéo được (CSKH #286)
  setInterval(() => neX(btn), 250);   // nút CSKH không được đè nút tắt ✕ của bảng nào (chủ dự án 25/11/2026)
  root.addEventListener('keydown', ev => ev.stopPropagation());   // gõ chữ không điều khiển nhân vật

  const st = { tab: 'moi', c: null, p: null, desc: '', tk: '', lh: '', img: null, shooting: false, busy: false, msg: '', sent: false, rows: null, login: null };
  const grp = () => G.find(g => g.id === st.c), sub = () => grp()?.subs.find(s => s.id === st.p);

  function chup() {   // chụp màn đang thấy TRƯỚC khi bảng che (lần mở bảng, sau mỗi lần gửi)
    if (st.shooting) return Promise.resolve();
    st.shooting = true; st.img = null;
    return shotScreen(F.img).then(i => { st.img = i; }).catch(() => {}).finally(() => { st.shooting = false; if (!root.hidden) paintImg(); });
  }
  function hoiLogin() {
    const thu = window.__thu?.cskh;   // bài thử / chụp ảnh duyệt: giả đăng nhập, giả danh sách tin
    if (thu) { st.login = !!thu.login; if (thu.rows) st.rows = thu.rows; return; }
    st.login = 'cho';
    net().then(m => m.loggedIn()).catch(() => false).then(v => { st.login = !!v; if (!root.hidden) render(); });
  }

  const bong = (ai, ...kids) => { const b = el('div', `cskh-b ${ai}`); b.append(...kids); return b; };
  function render() {
    tabs.textContent = '';
    for (const [id, name] of [['moi', T.moi], ['da', T.da_gui]]) {
      const b = nut(`cskh-tab${st.tab === id ? ' on' : ''}`, name, () => { st.tab = id; if (id === 'da') st.rows = null; render(); body.scrollTop = 0; });
      tabs.append(b);
    }
    body.textContent = '';
    if (st.tab === 'da') { renderDa(); return; }
    body.append(bong('ho', el('p', null, K.chao)));
    if (st.sent) body.append(bong('ho', el('p', 'cskh-ok', T.da_nhan)));
    const g = grp();
    if (!g) {
      const grid = el('div', 'cskh-chinh');
      for (const c of G) {
        const b = nut('cskh-c', null, () => { st.c = c.id; st.p = null; st.sent = false; st.msg = ''; render(); });
        b.append(el('i', null, c.icon), el('span', null, c.label));
        grid.append(b);
      }
      body.append(el('div', 'cskh-hoi', T.chon_chinh), grid);
      return;
    }
    body.append(bong('toi', el('p', null, `${g.icon} ${g.label}`), nut('cskh-lai', T.doi_lai, () => { st.c = st.p = null; render(); })));
    const s = sub();
    if (!s) {
      body.append(bong('ho', el('p', null, T.chon_phu)));
      const list = el('div', 'cskh-phu');
      for (const v of g.subs) list.append(nut('cskh-p', v.label, () => { st.p = v.id; st.msg = ''; render(); body.scrollTop = body.scrollHeight; }));
      body.append(list);
      return;
    }
    body.append(bong('toi', el('p', null, s.label), nut('cskh-lai', T.doi_lai, () => { st.p = null; render(); })));
    body.append(bong('ho', el('b', null, T.meo), el('p', null, s.meo)));
    if (st.login == null) hoiLogin();
    if (st.login === 'cho') { body.append(el('p', 'cskh-mo', '…')); return; }
    form(g, s);
  }

  let imgEl = null, imgLb = null;
  function paintImg() {
    if (!imgEl?.isConnected) return;
    imgEl.hidden = !st.img; if (st.img) imgEl.src = st.img.anh;
    imgLb.textContent = st.shooting ? T.chup : T.anh;
  }
  function form(g, s) {
    const khach = !st.login, box = el('div', 'cskh-form'), desc = el('textarea'), file = el('input'), msg = el('p', 'cskh-msg', st.msg);
    const tk = el('input'), lh = el('input');   // chưa đăng nhập: tên tài khoản (nếu nhớ), cách liên hệ lại
    tk.maxLength = 40; tk.placeholder = T.tk_ph; tk.value = st.tk || ''; tk.oninput = () => { st.tk = tk.value; };
    lh.maxLength = 80; lh.placeholder = T.lh_ph; lh.value = st.lh || ''; lh.oninput = () => { st.lh = lh.value; };
    tk.autocapitalize = 'off'; tk.spellcheck = false;
    desc.maxLength = 500; desc.rows = 4; desc.placeholder = T.mo_ta_ph; desc.value = st.desc;
    desc.oninput = () => { st.desc = desc.value; };
    file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
    imgEl = el('img', 'cskh-img'); imgEl.alt = ''; imgLb = el('div', 'cskh-sub');
    file.onchange = async () => {
      const got = await fromFile(file.files?.[0], F.img); file.value = '';
      if (got) { st.img = got; st.imgTay = true; paintImg(); } else msg.textContent = F.text.bad_img;
    };
    const send = nut('cskh-gui', st.busy ? T.dang_gui : T.gui, async () => {
      if (st.busy) return;
      const mo = st.desc.trim();
      if (mo.length < 10) { msg.textContent = st.msg = T.can_mo_ta; return; }
      if (!khach && !st.img) { msg.textContent = st.shooting ? T.chup : F.text.need_img; return; }
      st.busy = true; send.disabled = true; send.textContent = T.dang_gui; msg.textContent = '';
      const tieu = `${g.label} · ${s.label}`.slice(0, 80), nc = { ...context(H.game), cskh: { c: g.id, p: s.id } };
      const r = await net().then(m => khach
        ? m.sendKhach({ tai_khoan: (st.tk || '').trim(), lien_he: (st.lh || '').trim(), nhom: g.id, y: s.id, tieu_de: tieu, mo_ta: mo, ngu_canh: nc })
        : m.sendFeedback({ loai: g.de_xuat ? 'de_xuat' : 'loi', tieu_de: tieu, mo_ta: mo, anh: st.img.anh, anh_nho: st.img.anh_nho, ngu_canh: nc })).catch(() => ({ error: 'net' }));
      st.busy = false;
      if (r.error) { st.msg = F.text.errors[r.error] || T.loi[r.error] || F.text.errors.net; render(); return; }
      st.c = st.p = null; st.desc = ''; st.msg = ''; st.sent = true; st.rows = null; st.imgTay = false;
      H.game.sfx?.('levelup');
      render(); body.scrollTop = 0;
      root.style.visibility = 'hidden'; chup().finally(() => { root.style.visibility = ''; });   // ảnh cho lần gửi sau: chụp lại màn không có bảng
    });
    send.disabled = st.busy;
    if (khach) box.append(el('p', 'cskh-mo trai', T.khach), el('div', 'cskh-sub', T.tk), tk, el('div', 'cskh-sub', T.lh), lh, el('div', 'cskh-sub', T.mo_ta), desc, msg, send);
    else box.append(el('div', 'cskh-sub', T.mo_ta), desc, imgLb, imgEl, nut('cskh-doi', T.doi_anh, () => file.click()), file, msg, send, el('p', 'cskh-mo', T.thuong));
    body.append(box);
    paintImg();
  }

  function renderDa() {
    if (st.rows == null && window.__thu?.cskh?.rows) st.rows = window.__thu.cskh.rows;
    if (st.rows == null) {   // tin lúc đăng nhập (p2d_gop_y) + tin lúc chưa đăng nhập máy này đã gửi (mã trong máy)
      st.rows = 'cho';
      net().then(m => Promise.all([m.myFeedback().catch(() => []), m.myKhach().catch(() => [])])).catch(() => [[], []])
        .then(([a, b]) => { st.rows = [...(a || []), ...(b || [])].sort((x, y) => String(y.tao_luc).localeCompare(String(x.tao_luc))); if (!root.hidden && st.tab === 'da') render(); });
    }
    if (!Array.isArray(st.rows)) { body.append(el('p', 'cskh-mo', '…')); return; }
    if (!st.rows.length) { body.append(el('p', 'cskh-mo', T.chua_gui)); return; }
    for (const r of st.rows) {
      const tt = el('i', `cskh-tt st-${r.trang_thai}`, F.text.status[r.trang_thai] || r.trang_thai);
      body.append(bong('toi', el('p', null, r.tieu_de), el('small', null, gio(r.tao_luc)), tt));
      body.append(r.tra_loi ? bong('ho', el('b', null, T.cskh), el('p', null, r.tra_loi)) : el('p', 'cskh-cho', T.doi));
    }
  }

  function close() { root.hidden = true; if (document.getElementById('menu')?.hidden !== false) H.game.uiOpen = false; }
  async function open(tab) {
    if (tab) st.tab = tab;
    if (!st.imgTay && !st.busy) await Promise.race([chup(), new Promise(r => setTimeout(r, 1500))]);   // mỗi lần mở chụp lại màn đang thấy trước khi bảng che (ảnh tự chọn thì giữ; quá 1,5 giây thì mở luôn, ảnh tới sau)
    root.hidden = false; H.game.uiOpen = true; st.login = null; render();
  }
  x.onclick = e => { e.stopPropagation(); close(); };
  btn.onclick = e => { e.stopPropagation(); if (!root.hidden) close(); else open(); };
  window.__cskh(game);   // game.openCskh, game.openGopY (chỗ cũ: thông báo, thư trả lời góp ý) mở thẳng CSKH
}
