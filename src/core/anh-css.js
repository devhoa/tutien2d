// Hình khung trong CSS (bảng trên, ô nút, khung bảng: src/ui/hud-khung.css, style.css…) tải HỎNG thì trình duyệt không tự tải lại: khung mất
// tới khi mở lại game (26/11/2026 00:40, máy chủ dự án: trang tự tải lại đúng lúc đưa bản mới, mất khung bảng trên và khung các nút).
// Ở đây: theo dõi các hình do CSS gọi (PerformanceObserver, chỉ những hình trình duyệt ĐÃ gọi, không tải trước hình nào); hình nào hỏng thì tải
// lại bằng fetch cache 'reload' (ghi đè luôn bản hỏng trình duyệt còn lưu tạm), 2 giây, 4, 8… tối đa 30 giây một lần; tải được thì nạp lại tệp
// CSS có hình đó cho khung hiện ra. Chỉ tải lại tệp tĩnh của chính trang game, không đụng game. Bài thử: tools/kiem/hinh-hong.thu.mjs.
import { ghiHinh, boHinh } from './hinh-so.js';
const LA_HINH = /\.(png|webp|jpe?g|gif|svg)(\?|#|$)/i;

// Các thẻ <link> có tệp CSS nhắc tới hình này (so theo tên tệp)
function theChua(url) {
  const ten = new URL(url).pathname.split('/').pop(), ra = [];
  const co = rules => { for (const r of rules || []) if ((r.cssRules && co(r.cssRules)) || (r.style && r.cssText.includes(ten))) return true; return false; };
  for (const sh of document.styleSheets) {
    if (sh.ownerNode?.tagName !== 'LINK') continue;
    try { if (co(sh.cssRules)) ra.push(sh.ownerNode); } catch { /* tệp khác nguồn */ }
  }
  return ra;
}

export function canhAnhCss() {
  if (typeof document === 'undefined' || typeof PerformanceObserver === 'undefined' || globalThis.__canhAnhCss) return;
  globalThis.__canhAnhCss = true;
  const da = new Set(), cho = new Map();   // hình đã xét; thẻ <link> đang hẹn nạp lại
  const napLai = node => {
    clearTimeout(cho.get(node));
    cho.set(node, setTimeout(() => {
      cho.delete(node);
      if (!node.isConnected) return;
      const moi = node.cloneNode();
      moi.onload = moi.onerror = () => node.remove();
      node.after(moi);
    }, 600));
  };
  const cuu = (url, lan = 0) => {
    if (!lan) ghiHinh('css', url);
    setTimeout(async () => {
      try { const r = await fetch(url, { cache: 'reload' }); if (r.ok) { await r.blob(); boHinh('css', url); theChua(url).forEach(napLai); return; } } catch { /* mạng còn hỏng: thử tiếp */ }
      cuu(url, lan + 1);
    }, Math.min(30000, 2000 * 2 ** lan) + Math.random() * 800);
  };
  const xet = e => {
    if (e.initiatorType !== 'css' || !LA_HINH.test(e.name) || !e.name.startsWith(location.origin) || da.has(e.name)) return;
    da.add(e.name);
    if (e.responseStatus >= 400) { cuu(e.name); return; }
    if (e.responseStatus >= 200) return;   // trình duyệt báo rõ là tải được
    // trình duyệt không báo trạng thái (Safari): thử bằng một thẻ hình (đã tải được thì lấy từ bộ nhớ đệm); tải xong mà cỡ 0 cũng là hỏng
    const im = new Image(); im.onerror = () => cuu(e.name); im.onload = () => { if (!im.naturalWidth) cuu(e.name); }; im.src = e.name;
  };
  try { new PerformanceObserver(l => l.getEntries().forEach(xet)).observe({ type: 'resource', buffered: true }); } catch { /* máy cũ: thôi */ }
}
