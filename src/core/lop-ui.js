// Lớp giao diện cho clip quay trong game (chủ dự án 25/11/2026: "nút quay bây h sẽ quay toàn bộ mọi thứ xuất hiện trong khung hình…
// các loại bảng, tên… nhiều người review game và cách phối đồ nhưng chỉ quay được màn hình chính").
// Khung vẽ game chép mỗi khung như cũ (src/core/recorder*.js); phần HTML (bảng, nút, thanh, chữ) chụp thành ảnh vài lần mỗi giây rồi dán
// đè lên. Cách chụp: dựng lại trang trong một ảnh SVG (foreignObject) với đúng bộ CSS đang chạy, nên khung viền border-image, :has(),
// biến CSS… giống hệt màn hình. Ảnh trong CSS, thẻ img, canvas nhỏ (bản đồ nhỏ, chân dung) chuyển thành data URL; @media xét theo cửa sổ
// thật (trong ảnh SVG không có chuột / ngón tay). Không lên clip: khung vẽ game (đã chép riêng), nút quay, nút và bảng CSKH.
// Máy không dựng được (ảnh SVG làm bẩn canvas, lỗi, quá chậm): báo hỏng, clip chỉ còn khung vẽ game như trước.
// 26/11/2026 (chủ dự án: quay trong khung hình giới hạn ban đầu): chỉ dựng phần giao diện nằm trong khung quay (dải giữa màn, cfg.frame):
// phần tử nằm ngoài dải bỏ khỏi bản dựng, ảnh của chúng không nhúng; thay đổi ngoài dải (số trên thanh, chat dưới đáy) không gây chụp lại.

const BO = new Set(['game', 'btn-rec', 'btn-cskh', 'cskh']);
const URL_RE = /url\(\s*(['"]?)([^'")]+?)\1\s*\)/g;
const anh = new Map();   // địa chỉ tuyệt đối → Promise<data URL | null>, giữ qua các lần quay

const docFile = b => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(b); });

// Ảnh PNG nặng ghi lại thành WebP cùng cỡ (máy nào ghi được WebP) cho ảnh SVG nhẹ, máy giải mã nhanh, đỡ giật game. Không thu nhỏ:
// thử bọc ảnh nhỏ trong vỏ SVG giữ cỡ gốc thì border-image mất hẳn và hình mờ (25/11/2026)
const NANG = 9000;
let webp = null;
async function thuNho(b) {
  if (!/^image\/png/.test(b.type) || b.size < NANG) return docFile(b);
  const goc = await docFile(b);
  let bm; try { bm = await createImageBitmap(b); } catch { return goc; }
  const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
  c.getContext('2d').drawImage(bm, 0, 0); bm.close?.();
  webp ??= c.toDataURL('image/webp', 0.9).startsWith('data:image/webp');
  if (!webp) return goc;
  const nho = c.toDataURL('image/webp', 0.9);
  return goc && nho.length < goc.length * 0.8 ? nho : goc;
}

function dataUrl(u, nho = true) {
  const k = (nho ? 'n:' : 'g:') + u;
  if (!anh.has(k)) anh.set(k, fetch(u).then(r => (r.ok ? r.blob() : null)).then(b => b && (nho ? thuNho(b) : docFile(b))).catch(() => null));
  return anh.get(k);
}

const tuyetDoi = (u, base) => { try { return new URL(u, base).href; } catch { return null; } };

async function nhungUrl(text, base) {
  const ds = new Set();
  for (const m of text.matchAll(URL_RE)) if (!m[2].startsWith('data:') && !m[2].startsWith('#')) { const a = tuyetDoi(m[2], base); if (a) ds.add(a); }
  const map = new Map();
  await Promise.all([...ds].map(async a => map.set(a, await dataUrl(a))));
  return text.replace(URL_RE, (m, q, u) => {
    if (u.startsWith('data:') || u.startsWith('#')) return m;
    const d = map.get(tuyetDoi(u, base));
    return d ? `url("${d}")` : 'none';
  });
}

// Chép luật CSS: @media xét luôn theo cửa sổ thật (khớp thì lấy luật bên trong, không khớp thì bỏ)
function chepLuat(rules, out, base) {
  for (const r of rules) {
    if (r.type === CSSRule.MEDIA_RULE) { try { if (matchMedia(r.conditionText || r.media.mediaText).matches) chepLuat(r.cssRules, out, base); } catch { /* bỏ */ } continue; }
    if (r.type === CSSRule.IMPORT_RULE) { try { if (r.styleSheet) chepLuat(r.styleSheet.cssRules, out, r.styleSheet.href || base); } catch { /* khác nguồn */ } continue; }
    const text = r.cssText;
    out.push({ text, base, q: r.type === CSSRule.STYLE_RULE ? boChon(r.selectorText) : null, url: URL_RE.test(text) });
    URL_RE.lastIndex = 0;
  }
}

// Chỉ lấy luật CSS khớp ít nhất một phần tử của bản dựng (đã cắt theo khung quay): luật không khớp bản dựng thì ảnh SVG cũng không dùng.
// Cả bộ CSS game ~330 KB kèm ảnh, bảng Túi đồ chỉ cần một phần: ảnh SVG nhỏ thì máy vẽ nhanh (dựng clip sau khi quay chờ ít hơn).
// Bỏ giả phần tử, trạng thái chuột khi so (::before khớp theo phần tử chủ). :root không khớp được trên bản tách rời: luôn giữ.
const GIA = /::?(before|after|placeholder|selection|marker|first-letter|first-line|backdrop|file-selector-button|-webkit-[a-z-]+|-moz-[a-z-]+)(\([^)]*\))?/g;
const TT = /:(hover|active|focus|focus-visible|focus-within|visited|link|checked|disabled|enabled)\b/g;
const boChon = sel => (sel && !sel.includes(':root') ? sel.replace(GIA, '').replace(TT, '').replace(/(^|,)\s*(?=,|$)/g, '$1*') : null);
function khop(q, vo) {
  if (!q) return true;
  try { return !!vo.querySelector(q); } catch { return true; }
}

let cssHua = null, cssKhoa = '';
function boCss() {
  const khoa = [...document.styleSheets].map(s => s.href || 'inline:' + (s.ownerNode?.textContent?.length || 0)).join('|') + '|' + innerWidth + 'x' + innerHeight;
  if (cssHua && khoa === cssKhoa) return cssHua;
  cssKhoa = khoa;
  cssHua = (async () => {
    const ds = [];
    for (const s of document.styleSheets) {
      let rules; try { rules = s.cssRules; } catch { continue; }   // bảng CSS khác nguồn: bỏ (game không dùng phông ngoài)
      if (s.media?.mediaText && !matchMedia(s.media.mediaText).matches) continue;
      chepLuat(rules, ds, s.href || location.href);
    }
    await Promise.all(ds.filter(r => r.url).map(async r => { r.text = await nhungUrl(r.text, r.base); }));
    // nền trang trong suốt để thấy khung vẽ game bên dưới; tắt chuyển động (ảnh chụp là một khoảnh khắc)
    ds.push({ text: 'html,body{background:transparent!important}*{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}', q: null });
    return ds;
  })();
  return cssHua;
}

// Dải khung quay theo điểm CSS: { y0, y1 } (vung: phần chiều cao màn { top, bottom })
const daiCss = vung => ({ y0: innerHeight * (vung?.top ?? 0), y1: innerHeight * (vung?.bottom ?? 1) });
const trongDai = (r, d) => r.width > 0 && r.height > 0 && r.bottom > d.y0 && r.top < d.y1 && r.right > 0 && r.left < innerWidth;

// Chép body thành bản dựng: bỏ thứ không lên clip, canvas thành ảnh, giữ chữ đang gõ, giữ chỗ đang cuộn
// hoan (chép để dựng sau): ảnh chưa đổi thành data URL, chỉ ghi địa chỉ tuyệt đối vào can (lamDay đổi lúc dựng) để lần chép đầu khi mở
// bảng mới không phải chờ đọc, nén vài chục ảnh (có khi vài giây; trong lúc đó không chép được lần nào)
const tuyetDoiUrl = (text, can) => text.replace(URL_RE, (m, q, u) => { if (u.startsWith('data:') || u.startsWith('#')) return m; const a = tuyetDoi(u, location.href); if (!a) return 'none'; can.add(a); return `url("${a}")`; });
async function banDung(d, can) {
  const goc = document.body, ban = goc.cloneNode(true);
  const A = [...goc.getElementsByTagName('*')], B = [...ban.getElementsByTagName('*')];
  // Phần tử chạm khung quay, hoặc có con cháu chạm (con định vị tuyệt đối có thể nằm ngoài khung cha): giữ; còn lại bỏ
  const giu = new Set();
  for (let i = A.length - 1; i >= 0; i--) { const a = A[i]; if (giu.has(a) || trongDai(a.getBoundingClientRect(), d)) { giu.add(a); if (a.parentElement) giu.add(a.parentElement); } }
  const bo = [], cho = [];
  for (let i = 0; i < A.length && i < B.length; i++) {
    const a = A[i], b = B[i], tag = a.tagName;
    if (bo.length && bo[bo.length - 1].contains(b)) continue;   // nằm trong nhánh đã bỏ
    if (!giu.has(a)) { bo.push(b); continue; }   // ngoài khung quay (hoặc đang ẩn, cỡ 0): bỏ cho ảnh nhẹ
    if (BO.has(a.id) || tag === 'SCRIPT' || tag === 'NOSCRIPT' || tag === 'IFRAME' || tag === 'VIDEO' || tag === 'AUDIO') { bo.push(b); continue; }
    if (tag === 'CANVAS') {
      const img = document.createElement('img');
      for (const at of a.attributes) img.setAttribute(at.name, at.value);
      if (a.width && a.height && a.width * a.height <= 1.2e6 && trongDai(a.getBoundingClientRect(), d)) { try { img.src = webp ? a.toDataURL('image/webp', 0.9) : a.toDataURL(); } catch { img.removeAttribute('src'); } }
      const r = a.getBoundingClientRect();
      if (!a.style.width && r.width) img.style.width = r.width + 'px';
      if (!a.style.height && r.height) img.style.height = r.height + 'px';
      b.replaceWith(img); continue;
    }
    if (tag === 'IMG') { const src = a.currentSrc || a.src; if (src && !src.startsWith('data:')) { if (can) { b.setAttribute('src', src); can.add(src); } else cho.push(dataUrl(src).then(d => { if (d) b.setAttribute('src', d); else b.removeAttribute('src'); })); } b.removeAttribute('srcset'); b.removeAttribute('loading'); }
    if (tag === 'INPUT') { if (a.type === 'checkbox' || a.type === 'radio') { if (a.checked) b.setAttribute('checked', ''); else b.removeAttribute('checked'); } else b.setAttribute('value', a.value); }
    if (tag === 'TEXTAREA') b.textContent = a.value;
    if (a.scrollTop || a.scrollLeft) for (const c of b.children) c.style.translate = `${-a.scrollLeft}px ${-a.scrollTop}px`;   // dời con như đang cuộn, không đổi bố cục
    const st = b.getAttribute?.('style');   // ảnh trong style riêng, kể cả biến CSS (--ic: url(…) của ô chờ trong Túi đồ)
    if (st && st.includes('url(')) { if (can) b.setAttribute('style', tuyetDoiUrl(st, can)); else cho.push(nhungUrl(st, location.href).then(t => b.setAttribute('style', t))); }
  }
  for (const b of bo) b.remove();
  await Promise.all(cho);
  return ban;
}

// Ảnh dùng ở nhiều luật chỉ nhúng một lần: đặt thành biến CSS trên :root, luật gọi var(--lu-n)
function gopAnh(css) {
  const ma = new Map();
  const ra = css.replace(/url\("(data:[^"]+)"\)/g, (m, d) => { if (!ma.has(d)) ma.set(d, '--lu-' + ma.size); return `var(${ma.get(d)})`; });
  return ':root{' + [...ma].map(([d, k]) => `${k}:url("${d}");`).join('') + '}\n' + ra;
}

const thuocTinh = el => [...el.attributes].map(a => `${a.name}="${a.value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"`).join(' ');

// Phần của ảnh SVG lớp giao diện trong khung quay (vung: phần chiều cao màn { top, bottom }; điểm CSS).
// Bộ CSS giống hệt một lần trước thì dùng lại đúng chuỗi cũ (mỗi bộ vài trăm KB, bản ghi trong lúc quay giữ nhiều lần chép).
// Ảnh trong style riêng của phần tử (biến --ic của ô Túi đồ…) đặt thành biến --lb-n dùng chung, mỗi lần chép chỉ ghi tên biến.
const cssKho = new Map(), anhKho = new Map();
const ANH_STYLE = /url\((?:&quot;|["'])?(data:[^"'&)]+)(?:&quot;|["'])?\)/g;
const veBien = du => { if (!anhKho.has(du)) anhKho.set(du, '--lb-' + anhKho.size); return anhKho.get(du); };
// khiChep(): gọi đúng lúc chép trang (sau khi bộ CSS sẵn sàng, có khi vài giây lúc bảng mới nạp CSS) để mốc clip khớp nội dung chép.
// hoan: chép để dựng sau (ảnh để địa chỉ, lamDay đổi sau)
export async function phanUi(vung, khiChep, hoan) {
  const W = innerWidth, H = innerHeight, d = daiCss(vung), ds = await boCss();
  khiChep?.();
  const can = hoan ? new Set() : null, ban = await banDung(d, can), vo = document.documentElement.cloneNode(false);
  vo.append(ban);   // bọc trong <html> cùng thuộc tính để luật "html.x …" khớp như trên trang
  let css = gopAnh(ds.filter(r => khop(r.q, vo)).map(r => r.text).join('\n'));
  if (cssKho.has(css)) css = cssKho.get(css); else { if (cssKho.size > 24) cssKho.clear(); cssKho.set(css, css); }
  const dung = new Set();
  const body = new XMLSerializer().serializeToString(ban).replace(ANH_STYLE, (m, du) => { const k = veBien(du); dung.add(k); return `var(${k})`; });
  const y0 = Math.round(d.y0);
  if (can) for (const u of can) dataUrl(u);   // đọc sẵn trong lúc chờ, lúc dựng là có
  return { W, H, y0, vh: Math.max(1, Math.round(d.y1) - y0), at: thuocTinh(document.documentElement), css, body, anh: [...dung], can: can && [...can] };
}

// Lần chép để dựng sau (hoan): đổi địa chỉ ảnh còn lại thành data URL (ảnh trong style thành biến --lb-n như lúc chép thường)
const RA_ATTR = s => s.replace(/&amp;/g, '&');
export async function lamDay(p) {
  if (!p.can?.length) return p;
  const map = new Map(await Promise.all(p.can.map(async u => [u, await dataUrl(u)])));
  const dung = new Set(p.anh);
  const body = p.body
    .replace(/url\(&quot;(https?:[^)]*?)&quot;\)/g, (m, u) => { const du = map.get(RA_ATTR(u)); if (!du) return 'none'; const k = veBien(du); dung.add(k); return `var(${k})`; })
    .replace(/ src="(https?:[^"]+)"/g, (m, u) => { const du = map.get(RA_ATTR(u)); return du ? ` src="${du}"` : ''; });
  return { ...p, body, anh: [...dung], can: null };
}
// Ảnh SVG cỡ pw × ph điểm ảnh clip (viewBox theo điểm CSS): trình duyệt dựng chữ, khung đúng độ phân giải clip, không phóng ảnh nhỏ cho mờ
export function ghepSvg(p, pw = p.W, ph = p.vh) {
  let goc = '';
  if (p.anh?.length) { const ten = new Map([...anhKho].map(([du, k]) => [k, du])); goc = ':root{' + p.anh.map(k => `${k}:url("${ten.get(k)}");`).join('') + '}\n'; }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="0 ${p.y0} ${p.W} ${p.vh}" preserveAspectRatio="none"><foreignObject x="0" y="0" width="${p.W}" height="${p.H}">`
    + `<html xmlns="http://www.w3.org/1999/xhtml" ${p.at}><head><style><![CDATA[${(goc + p.css).replace(/]]>/g, ']] >')}]]></style></head>${p.body}</html></foreignObject></svg>`;
}
export const svgUi = async (vung, pw, ph) => { const p = await phanUi(vung); return ghepSvg(p, pw, ph); };

// Máy này vẽ được ảnh SVG có HTML lên canvas mà không làm bẩn canvas không (một số Safari: không). Thử một lần.
let duoc = null;
export const svgDuoc = () => (duoc ??= veSvg('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><foreignObject width="4" height="4"><div xmlns="http://www.w3.org/1999/xhtml" style="width:4px;height:4px;background:#fff"></div></foreignObject></svg>', 4, 4).then(() => true, () => false));

// Vẽ một ảnh SVG thành canvas w × h. Ảnh làm bẩn canvas (một số Safari) thì ném lỗi, không để lọt vào clip.
export async function veSvg(svg, w, h) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, w, h);
  g.getImageData(0, 0, 1, 1);
  return c;
}

// Mỗi lần chụp, máy dựng lại cả trang trong ảnh SVG: máy tầm trung mất khoảng 0,3–0,6 giây, trong lúc đó game khựng. Nên chỉ chụp khi giao
// diện đổi: chạm màn hình, bảng / nút hiện ra hay tắt đi (attribute hidden, thêm bớt phần tử ngoài hai bảng HUD) thì chụp sớm (nhanh_ms);
// số trên thanh máu, chữ chat, style do code đổi liên tục thì chụp thưa (cham_ms); không đổi gì thì không chụp.
const VUNG_HUD = '#bang-tren, #bang-duoi, #hud';
function loai(m, d) {
  const e = m.target.nodeType === 1 ? m.target : m.target.parentElement;
  if (!e || e.closest('#btn-rec, #btn-cskh, #cskh')) return null;
  if (m.type === 'attributes' && m.attributeName === 'hidden') return 'nhanh';
  if (!trongDai(e.getBoundingClientRect(), d)) return null;   // đổi ở ngoài khung quay (thanh máu, chat dưới đáy): không cần chụp lại
  if (m.type === 'attributes') return 'cham';
  if (m.type === 'childList' && !e.closest(VUNG_HUD) && [...m.addedNodes, ...m.removedNodes].some(n => n.nodeType === 1)) return 'nhanh';
  return 'cham';
}

// Lịch chụp chung: giao diện đổi thì gọi chup() (không chồng hai lần), cfg { nhanh_ms, cham_ms, tre_ms }. Trả hàm dừng.
function theoDoi(cfg, vung, chup) {
  const d = daiCss(vung);
  let can = 'nhanh', ban = false, hen = 0, last = -1e9, xong = false;
  function lich() {
    if (ban || hen || !can || xong) return;
    const cho = Math.max(cfg.tre_ms, last + (can === 'nhanh' ? cfg.nhanh_ms : cfg.cham_ms) - performance.now());
    hen = setTimeout(async () => { hen = 0; can = null; ban = true; await chup(); ban = false; last = performance.now(); lich(); }, cho);
  }
  const bao = muc => { if (muc === 'nhanh') { if (can === 'cham') { clearTimeout(hen); hen = 0; } can = 'nhanh'; } else if (muc && !can) can = 'cham'; lich(); };
  const mo = new MutationObserver(ds => { let muc = null; for (const m of ds) { const k = loai(m, d); if (k === 'nhanh') { muc = k; break; } muc ||= k; } bao(muc); });
  mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  // chạm, cuộn (Túi đồ, Xếp hạng: chạm cuộn trên điện thoại báo pointercancel chứ không pointerup), gõ chữ: chụp sớm
  const cham = () => bao('nhanh'), SK = ['pointerup', 'scroll', 'input'];
  for (const k of SK) addEventListener(k, cham, { capture: true, passive: true });
  lich();
  return () => { xong = true; clearTimeout(hen); mo.disconnect(); for (const k of SK) removeEventListener(k, cham, { capture: true }); };
}

// Lớp giao diện vẽ NGAY trong lúc quay (máy không dựng lại clip sau được): canvas cỡ w × h (đúng khung quay vung) luôn giữ ảnh mới nhất
export function lopUi(w, h, cfg, vung) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const st = { canvas: cv, ok: false, hong: false, dung: false, lan: 0, ms: 0 };
  const stop = theoDoi(cfg, vung, async () => {
    if (st.dung) return;
    const t0 = performance.now();
    try {
      const anh = await veSvg(await svgUi(vung, w, h), w, h);
      if (st.dung) return;
      g.clearRect(0, 0, w, h); g.drawImage(anh, 0, 0);
      st.ok = true; st.lan++; st.ms = performance.now() - t0;
    } catch { st.hong = true; st.ok = false; g.clearRect(0, 0, w, h); dung(); }
  });
  function dung() { st.dung = true; stop(); }
  st.stop = dung;
  if (window.__thu) window.__thu.lopUi = st;   // bài thử tools/kiem/quay-ui.thu.mjs đọc số lần chụp
  return st;
}

// Lớp giao diện GHI LẠI để dựng sau (src/core/dung-clip.js; chủ dự án 26/11/2026 02:51: clip quay xong giật lag): trong lúc quay chỉ chép
// trang thành chuỗi (khoảng 20–80 ms), không vẽ ảnh (phần nặng 0,1–0,9 giây). ds: [{ t: mốc clip µs, p: phần ảnh SVG }], cùng nội dung thì
// không ghi thêm; quá cfg.toi_da lần thì thôi ghi lần mới (giữ bộ nhớ).
export function ghiUi(cfg, vung, layT) {
  const st = { ds: [], hong: false, lan: 0, ms: 0, maxMs: 0 };
  let truoc = null;
  st.stop = theoDoi(cfg, vung, async () => {
    if (st.ds.length >= (cfg.toi_da || 240)) return;
    let t = 0, t0 = 0;
    try {
      const p = await phanUi(vung, () => { t = layT(); t0 = performance.now(); }, true), ms = performance.now() - t0;
      st.lan++; st.ms += ms; st.maxMs = Math.max(st.maxMs, ms);
      if (truoc && p.body === truoc.body && p.css === truoc.css && p.vh === truoc.vh) return;
      truoc = p; st.ds.push({ t, p });
    } catch { st.hong = true; }
  });
  if (window.__thu) window.__thu.lopUi = st;
  return st;
}

// Chuẩn bị sẵn bộ CSS (đọc, nhúng ảnh) lúc máy rảnh để lần bấm quay đầu tiên có giao diện ngay
export const soanSan = () => boCss().catch(() => {});
