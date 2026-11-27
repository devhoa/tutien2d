// Ô Nguyên Anh trong mục Tiềm năng, cạnh Huyết mạch và Thể chất (chủ dự án 27/11/2026 01:21: "kết anh thì nguyên anh sẽ nằm chung mục với thể phách
// và huyết mạch"; src/ui/tiem-nang-view.js gọi). Ô: ấn 嬰, phẩm (màu phẩm), phần sát thương mỗi nhát; chưa qua lễ Kết Anh thì ô mờ ghi mốc.
// Chi tiết: Nguyên Anh vàng của chính mình (vẽ bằng code từ hình nhân vật, src/render/draw-nguyen-anh.js veVang, không cần ảnh riêng), tên phẩm,
// lời Hệ Thống về thể phách và Nguyên Anh, các dòng công dụng (cùng chữ với màn thức tỉnh, data/nguyen-anh.json → le.man.dong), dòng nghịch phẩm.
import { NA, naThuc, naMo, naPham, naTen, naBac, naK } from '../game/nguyen-anh.js';
import { veVang } from '../render/draw-nguyen-anh.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const thay = (s, o) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));

// [nhãn, ấn, tên, dòng phụ, màu, khoá] cho hàm dựng ô của tiem-nang-view.js
export function oAnh(game, XAM) {
  const D = game.data, X = NA(D)?.text || {}, s = game.save;
  if (!naThuc(s, D)) return [X.title, '?', '···', naMo(s, D) ? X.cho_le : X.chua_ngan, XAM, true];
  const P = naTen(s, D);
  return [X.title, X.an || '嬰', P.ten, `${Math.round(naK(s, D) * 100)}%`, P.mau, false];
}

function ve(cv, game, mau) {
  const r = Math.min(3, window.devicePixelRatio || 1), W = cv.clientWidth || 132, H = cv.clientHeight || 112, x = cv.getContext('2d');
  if (!x || !game.hoSo) return;
  cv.width = Math.round(W * r); cv.height = Math.round(H * r); x.setTransform(r, 0, 0, r, 0, 0);
  const M = NA(game.data)?.mau || {}, cy = H * 0.5;
  for (const [rr, m, a] of [[60, mau, 0.45], [34, M.quang || '#ffd27a', 0.55]]) {
    const g = x.createRadialGradient(W / 2, cy, 0, W / 2, cy, rr); g.addColorStop(0, m); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = a; x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
  x.globalAlpha = 1;
  const e = { na: true, face: { x: 1, y: 0 }, lookX: 1, swingT: 0, moving: false, walkT: 0, heroAnim: null, atkN: 0, top: 26, x: W / 2, y: H - 16 };
  veVang(x, game, e, game.hoSo, game.time || 0, 1, 2.6, 0.25);
}

export function chiTietAnh(game, wrap) {
  const D = game.data, C = NA(D), X = C?.text || {}, s = game.save;
  if (!naThuc(s, D)) { wrap.append(el('div', 'tn-chua', X.chua)); return; }
  const P = naTen(s, D), B = naBac(s, D), A = C.anh || {}, ph = naPham(s, D), L = C.le || {}, M = L.man || {}, S = Array.isArray(L.sau) ? L.sau : [L.sau];
  wrap.style.setProperty('--mau', P.mau);
  const cv = el('canvas', 'tn-anh-cv');
  wrap.append(cv, el('div', 'tn-dd', thay(M.ten, { pham: P.ten })), el('div', 'tn-loi', S[Math.min(S.length - 1, ph >= 4 ? 2 : ph >= 2 ? 1 : 0)] || ''));
  const vals = { ra: B.ra_s, k: Math.round(naK(s, D) * 100), hoi: B.hoi, phut: Math.round((A.hoi_s ?? 300) / 60), giu: A.giu_s ?? 30 };
  for (const txt of M.dong || []) { const [a, b] = thay(txt, vals).split('|'), d = el('div', 'tn-anh-so'); d.append(el('b', '', a), el('span', '', b || '')); wrap.append(d); }
  wrap.append(el('div', 'tn-ghi', X.nghich));
  requestAnimationFrame(() => { if (cv.isConnected) ve(cv, game, P.mau); });   // đã vào trang thì mới biết cỡ
}
