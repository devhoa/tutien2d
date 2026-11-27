// Bàn phím ảo che bảng (chủ dự án 23/11/2026 17:25, ảnh iPhone: "Sửa bảng chat đi, k thấy chữ đang chat rồi").
// Bảng (Trò chuyện, Túi đồ, Tông môn, hộp thoại…) nằm nửa dưới màn hình, ô gõ ở đáy bảng nên bàn phím bật lên là che mất ô gõ. Safari tự
// cuộn trang đưa ô gõ lên nhưng không phải lúc nào cũng đủ (trình duyệt Android có máy không cuộn). Ở đây: đang gõ trong một bảng mà phần
// dưới khung bố cục bị bàn phím che (đo bằng visualViewport) thì đặt đáy bảng ngay trên mép bàn phím, bảng thấp lại cho vừa phần còn thấy;
// thôi gõ thì bảng về chỗ cũ. Trình duyệt tự thu khung bố cục khi bàn phím bật (bảng đã nằm trên bàn phím) thì không làm gì.
import { dangGo } from '../core/xoay.js';

const HOP = '#bag, .panel, #dialog';
const vv = typeof window !== 'undefined' ? window.visualViewport : null;
let hop = null, cao = 0, hen = 0, thuoc = null;

function bo() {
  if (hop) { hop.classList.remove('bp-o'); hop.style.removeProperty('--bp-b'); hop.style.removeProperty('--bp-h'); }
  hop = null;
}

function dat() {
  hen = 0;
  const a = document.activeElement, h = dangGo(a) ? a.closest(HOP) : null;
  if (h !== hop) bo();
  if (!h || !vv) return;
  const L = thuoc.getBoundingClientRect().height;   // cao khung bố cục, chỗ bảng position: fixed bám vào
  const che = L - vv.offsetTop - vv.height;          // phần đáy khung bố cục đang nằm dưới bàn phím
  if (che < 40) { bo(); return; }
  if (!hop) { cao = h.getBoundingClientRect().height; hop = h; h.classList.add('bp-o'); }   // cao gốc đo lúc chưa dời
  h.style.setProperty('--bp-b', Math.round(che + 6) + 'px');
  h.style.setProperty('--bp-h', Math.round(Math.min(cao, vv.height - 12)) + 'px');
}
const hoi = () => { if (!hen) hen = requestAnimationFrame(dat); };

if (vv && typeof document !== 'undefined') {
  const S = document.createElement('style');
  S.textContent = 'html body .bp-o.bp-o:not([hidden]){top:auto!important;bottom:var(--bp-b)!important;height:var(--bp-h)!important;max-height:var(--bp-h)!important}'
    + '#bp-thuoc{position:fixed;top:0;left:0;width:0;height:100%;visibility:hidden;pointer-events:none}';
  const lap = () => {
    document.head.append(S);
    thuoc = document.createElement('div'); thuoc.id = 'bp-thuoc'; thuoc.setAttribute('aria-hidden', 'true');
    document.body.append(thuoc);
    vv.addEventListener('resize', hoi);
    vv.addEventListener('scroll', hoi);
    addEventListener('focusin', hoi);
    addEventListener('focusout', () => setTimeout(hoi, 0));   // sang ô gõ khác thì activeElement mới có sau focusout
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lap); else lap();
}
