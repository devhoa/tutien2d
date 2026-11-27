// Màn lễ thức tỉnh thể phách (src/game/le-the.js gọi game.leTheUI(mã) sau khi kết quả đã ghi vào bản lưu).
// Làm lại 26/11/2026 (chủ dự án 13:4x: "hiệu ứng nhận thể phách cũng hoành tráng hơn, tắt các ô hiện phẩm cấp khi đang thức tỉnh thể phách để
// người chơi đỡ so sánh"): KHÔNG còn tháp sáu bậc phẩm, không dòng "Không phá nổi", không ô ghi phẩm trên màn lễ (phẩm vẫn xem được ở Túi đồ →
// Huyết mạch). Ai cũng diễn MỘT màn như nhau, chỉ khác màu: Kim Đan dưới chân soi lên, linh khí bốn phương xoáy về, chín khiếu trên thân lần
// lượt sáng, đan hoả dâng theo, hai vành ấn xoay quanh đan; đủ chín khiếu thì ba nhịp xung, bùng sáng cả màn; ấn thể chất nở ra giữa vầng tia
// xoay, đốm sáng bung rồi rơi như mưa, tên, đặc điểm, lai lịch, từng dòng chỉ số trời cho.
// Chạm lúc đang soi: chạy nhanh tới kết quả (không bỏ qua kết quả). Game đứng yên trong lúc lễ (game.uiOpen). Đang Tự hành / Tự đánh thì
// tự nhận sau ít giây. Số và chữ: data/the-chat.json → le. Kiểu: le-the.css. Phần sáng, hạt vẽ lên một canvas phủ màn (hàm nen).
import { goc } from '../core/build.js';
import { TC, phamThe, thePct } from '../game/the-chat.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

// Lớp sáng của màn lễ. S: { pha 0 soi thân · 2 đã ra ấn, len: số khiếu đã sáng, n: tổng khiếu, mau, xung: giờ nhịp xung gần nhất, t2: giờ ra ấn, tam(): tâm đang diễn }
function nen(cv, S) {
  const x = cv.getContext('2d');
  if (!x) return () => {};   // máy hết bộ nhớ canvas: màn lễ vẫn chạy, chỉ thiếu lớp sáng
  let raf = 0, W = 0, H = 0, cu = performance.now(), no = 0, du = 0;
  const hat = [], R = Math.random;
  const co = () => { const r = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * r); cv.height = Math.round(H * r); x.setTransform(r, 0, 0, r, 0, 0); };
  const vanh = (cx, cy, r, n, q, mau, al) => {   // vành ấn: vòng tròn + n vạch
    x.globalAlpha = al; x.strokeStyle = mau; x.lineWidth = 1.2; x.beginPath(); x.arc(cx, cy, r, 0, 6.2832);
    for (let i = 0; i < n; i++) { const a = q + i / n * 6.2832; x.moveTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9); x.lineTo(cx + Math.cos(a) * r * (i % 3 ? 0.96 : 1.08), cy + Math.sin(a) * r * (i % 3 ? 0.96 : 1.08)); }
    x.stroke();
  };
  const khung = now => {
    raf = requestAnimationFrame(khung);
    if (cv.clientWidth !== W || cv.clientHeight !== H) co();
    const dt = Math.min(0.05, (now - cu) / 1000), t = now / 1000, [cx, cy] = S.tam(); cu = now;
    x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    if (S.pha < 2) {
      const k = S.len / S.n, nay = Math.max(0, 1 - (now - (S.xung || 0)) / 260), r0 = 44 + 78 * k + nay * 16;
      vanh(cx, cy, r0, 24, t * 0.5, S.mau, 0.22 + 0.45 * k); vanh(cx, cy, r0 * 0.64, 12, -t * 0.9, '#fff6d8', 0.18 + 0.35 * k);
      for (du += (10 + 90 * k) * dt; du >= 1; du--) { const a = R() * 6.2832, r = Math.hypot(W, H) * (0.36 + R() * 0.3); hat.push({ k: 0, a, r, w: (R() < 0.5 ? 1 : -1) * (0.6 + R()), v: 90 + R() * 140, s: R() < 0.2 ? 2 : 1 }); }   // linh khí bốn phương xoáy về Kim Đan
    } else {
      const a = Math.min(1, (now - S.t2) / 500), g = x.createRadialGradient(cx, cy, 10, cx, cy, 230);   // vầng tia xoay sau ấn
      g.addColorStop(0, S.mau); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g;
      for (let i = 0; i < 16; i++) { const q = t * 0.22 + i / 16 * 6.2832, w = i % 2 ? 0.05 : 0.09, L = (i % 2 ? 150 : 230) * a; x.globalAlpha = (i % 2 ? 0.22 : 0.3) * a; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(q - w) * L, cy + Math.sin(q - w) * L); x.lineTo(cx + Math.cos(q + w) * L, cy + Math.sin(q + w) * L); x.fill(); }
      vanh(cx, cy, 78 + 6 * Math.sin(t * 2), 36, -t * 0.3, S.mau, 0.5 * a); vanh(cx, cy, 96, 12, t * 0.2, '#fff6d8', 0.3 * a);
      if (!no) { no = 1; for (let i = 0; i < 120; i++) { const q = R() * 6.2832, v = 80 + R() * 420; hat.push({ k: 1, x: cx, y: cy, vx: Math.cos(q) * v, vy: Math.sin(q) * v, l: 0.7 + R() * 0.9, t: 0, s: R() < 0.3 ? 3 : 2, c: R() < 0.35 }); } }   // đốm sáng bung ra lúc ấn nở
      for (du += 26 * dt; du >= 1; du--) hat.push({ k: 2, x: R() * W, y: -6, vx: (R() - 0.5) * 14, vy: 26 + R() * 44, l: 6, t: 0, s: R() < 0.25 ? 2 : 1, p: R() * 6, c: R() < 0.3 });   // rồi rơi như mưa sáng suốt lúc xem kết quả
    }
    for (let i = hat.length - 1; i >= 0; i--) {
      const q = hat[i];
      if (q.k === 0) {   // xoáy vào: càng gần càng nhanh, để lại vệt ngắn
        if (S.pha >= 2) { hat.splice(i, 1); continue; }
        const px = cx + Math.cos(q.a) * q.r, py = cy + Math.sin(q.a) * q.r * 0.8;
        q.v += 260 * dt; q.r -= q.v * dt; q.a += q.w * dt * (1 + 60 / Math.max(20, q.r));
        if (q.r < 12) { hat.splice(i, 1); continue; }
        x.globalAlpha = Math.min(1, 0.25 + 60 / q.r); x.strokeStyle = q.s > 1 ? '#fff6d8' : S.mau; x.lineWidth = q.s; x.beginPath(); x.moveTo(px, py); x.lineTo(cx + Math.cos(q.a) * q.r, cy + Math.sin(q.a) * q.r * 0.8); x.stroke();
      } else {
        q.t += dt; if (q.t >= q.l || q.y > H + 8) { hat.splice(i, 1); continue; }
        if (q.k === 1) { q.vx *= 1 - 2.2 * dt; q.vy = q.vy * (1 - 2.2 * dt) + 60 * dt; } else q.vx += Math.sin(t * 1.7 + q.p) * 8 * dt;
        q.x += q.vx * dt; q.y += q.vy * dt;
        x.globalAlpha = q.k === 1 ? 1 - q.t / q.l : 0.75; x.fillStyle = q.c ? '#fff6d8' : S.mau; x.fillRect(q.x, q.y, q.s, q.s);
      }
    }
    x.globalAlpha = 1;
  };
  co(); raf = requestAnimationFrame(khung);
  return () => cancelAnimationFrame(raf);
}

export function createLeTheUI(game) {
  const C = TC(game.data);
  if (!C) return;
  const css = el('link'); css.rel = 'stylesheet'; css.href = goc('src/ui/le-the.css'); document.head.append(css);
  const root = el('div'); root.id = 'le-the'; root.hidden = true; document.body.append(root);
  game.leTheUI = ma => new Promise(xong => {
    const L = C.le, t = C.the[ma], P = phamThe(game.data, t), H = game.data['he-chien'], N = L.huyet ?? 9, sfx = (k, v) => { if (L.sfx?.[k]) game.sfx?.(L.sfx[k], v); };
    const ngan = game.data['tiem-nang']?.text?.ngan || {};
    root.textContent = ''; root.className = ''; root.style.setProperty('--mau', L.mau_soi || '#ffd98a'); root.style.setProperty('--len', '0'); root.style.setProperty('--n', String(N));
    const cv = el('canvas', 'lh-cv'), goi = el('div', 'lh-goi', L.goi), san = el('div', 'lh-san'), mach = el('div', 'lh-mach'), lua = el('i', 'lh-lua'), dan = el('b', 'lh-dan', '丹'), an = el('div', 'lh-an'), han = el('b', 'lh-han', t.han), duoi = el('div', 'lh-duoi');
    const huyet = Array.from({ length: N }, (_, i) => { const h = el('u', 'lh-huyet'); h.style.setProperty('--i', i); mach.append(h); return h; });   // chín khiếu, dưới lên
    mach.append(lua); san.append(mach, dan); an.append(han); root.append(cv, goi, san, an, duoi);
    const wasOpen = game.uiOpen; game.uiOpen = true; root.hidden = false; sfx('mo');
    const giua = e => { const a = e.getBoundingClientRect(), b = root.getBoundingClientRect(); return [a.left - b.left + a.width / 2, a.top - b.top + a.height / 2]; };
    const S = { pha: 0, len: 0, n: N, mau: L.mau_soi || '#ffd98a', xung: 0, t2: 0, tam: () => giua(S.pha < 2 ? dan : an) };
    const tat = nen(cv, S);
    let tm = 0, nhanh = false, het = false, i = 0, lan = 0;
    const cho = (ms, fn) => { tm = setTimeout(fn, nhanh ? Math.min(ms, 40) : ms); };
    const buoc = () => {   // từng khiếu sáng lên, đan hoả dâng theo; khiếu sau lâu hơn khiếu trước một chút cho dồn nén
      if (i >= N) { xung(); return; }
      huyet[i].classList.add('sang'); S.len = ++i; root.style.setProperty('--len', String(i)); sfx('bac', 0.45 + 0.55 * i / N);
      cho((L.huyet_s ?? 0.3) * 1000 * (1 + i * 0.06), buoc);
    };
    const xung = () => {   // đủ chín khiếu: ba nhịp xung (màn rung, vành ấn nảy) rồi bùng
      if (lan >= (L.xung ?? 3)) { ra(); return; }
      lan++; S.xung = performance.now(); san.classList.remove('rung'); void san.offsetWidth; san.classList.add('rung'); sfx('xung');
      cho((L.xung_s ?? 0.32) * 1000, xung);
    };
    const dong = (cls, text, tre) => { const d = el('div', cls, text); d.style.setProperty('--tre', `${tre.toFixed(2)}s`); duoi.append(d); return d; };
    function ra() {   // bùng sáng, ấn thể chất nở ra giữa vầng tia
      het = true; sfx('dung');
      root.style.setProperty('--mau', P.mau); root.classList.add('ra'); goi.textContent = L.ten; S.pha = 2; S.mau = P.mau; S.t2 = performance.now();
      dong('lh-ten', t.ten, 0.25); dong('lh-dd', t.dac_diem, 0.5); dong('lh-loi', t.loi, 0.65);
      const ds = Object.entries(thePct({ theChat: ma }, game.data)).sort((a, b) => b[1] - a[1]), d0 = 1.15, ds_s = L.dong_s ?? 0.4;
      dong('lh-nhan', L.cho, d0 - 0.1);
      const luoi = el('div', 'lh-luoi'); luoi.style.setProperty('--tre', `${d0.toFixed(2)}s`); duoi.append(luoi);
      ds.forEach(([k, v], j) => {
        const c = el('div', 'lh-so'); c.style.setProperty('--tre', `${(d0 + j * ds_s).toFixed(2)}s`); c.append(el('span', '', ngan[k] || H.ten?.[k] || k), el('b', '', `+${String(v).replace('.', ',')}%`)); luoi.append(c);
        setTimeout(() => { if (!root.hidden) sfx('dong'); }, (d0 + j * ds_s) * 1000);
      });
      const sau = d0 + ds.length * ds_s;
      dong('lh-mot', L.mot_luot, sau + 0.1);
      const nut = el('button', 'lh-nut', L.nhan); nut.style.setProperty('--tre', `${(sau + 0.4).toFixed(2)}s`); duoi.append(nut);
      const dong_lai = () => { if (root.hidden) return; clearTimeout(tm); tat(); root.hidden = true; game.uiOpen = wasOpen; sfx('nhan'); xong(); };
      nut.onclick = e => { e.stopPropagation(); dong_lai(); };
      const tu = () => { if (root.hidden) return; if (game.pilot || game.auto) dong_lai(); else tm = setTimeout(tu, 500); };   // Tự hành / Tự đánh: không giữ chân
      tm = setTimeout(tu, (sau + 0.4 + (L.tu_dong_s ?? 2)) * 1000);
    }
    root.onclick = () => { if (!het) nhanh = true; };
    tm = setTimeout(buoc, 900);
  });
}
