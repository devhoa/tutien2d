// Khung dọc cố định trên máy tính (chủ dự án 23/11/2026 03:31: "để khung màn hình cố định cho mọi máy kể cả bản web trên máy tính như màn
// hình tôi đang chơi; máy tính hình ngang thì 2 bên thành viền đen, ở giữa vẫn là game màn hình dọc, vì trên máy tính mắc khá nhiều lỗi";
// bảng chọn "Máy tính"). Máy dùng chuột (hover + pointer fine), không nằm trong khung khác: trang ngoài chỉ còn nền đen và một khung (iframe)
// dọc ở giữa, tỉ lệ màn điện thoại của chủ dự án 390 × 844; game chạy trong khung, tưởng mình đang ở một điện thoại màn dọc nên bố cục,
// tầm nhìn y như bản điện thoại (bố cục màn ngang src/ui/hud-ngang.css không còn dùng trên máy tính). Điện thoại, máy tính bảng giữ nguyên.
// Trong khung có tham số khung=trong (không lồng thêm khung); ?khung=0 thì chơi cả màn như cũ (thử, đo).
// Nạp đầu tiên ở src/ui/man-dau.js và src/main.js: trang ngoài không chạy màn tải, không nạp game.
// 23/11/2026 22:02 (chủ dự án gửi ảnh máy tính của người chơi: "trên máy đth thì ok rồi mà trên máy tính nó vỡ khung với hình"): trước
// đây khung rộng theo chiều cao màn (laptop 1366 × 657 chỉ còn 304 điểm, hẹp hơn mọi điện thoại) nên bố cục co lại: chữ chỉ số bị cắt
// "Bạo…", Lực chiến mất số, tên đè hình. Nay khung LUÔN là 390 × 844 điểm như điện thoại, phóng to / thu nhỏ cả khung cho vừa màn
// (transform scale), và trong khung độ phân giải vẽ nhân theo đúng hệ số đó (devicePixelRatio) để hình vẽ ra đúng số điểm màn hình, nét
// như điện thoại.
const W = 390, H = 844;
const q = new URLSearchParams(location.search);
const mayTinh = typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
let tren = false;
try { tren = window.top !== window; } catch { tren = true; }
export const laKhungNgoai = mayTinh && !tren && !q.has('khung');

if (laKhungNgoai) {
  const dung = () => {
    q.set('khung', 'trong');
    const f = document.createElement('iframe');
    f.src = location.pathname + '?' + q.toString() + location.hash;
    f.title = document.title || 'Pixel 2D Tu Tiên';
    f.allow = 'autoplay; fullscreen; clipboard-read; clipboard-write';
    f.setAttribute('allowfullscreen', '');
    const S = document.createElement('style');
    S.textContent = 'html,body{margin:0;height:100%;background:#000;overflow:hidden}'
      + `iframe.khung-doc{position:fixed;top:0;left:0;width:${W}px;height:${H}px;transform-origin:0 0;border:0;display:block;background:#000}`;
    f.className = 'khung-doc';
    document.head.append(S);
    document.body.replaceChildren(f);
    document.body.className = '';
    // hệ số phóng: khung 390 × 844 vừa khít chiều cao (hay chiều ngang nếu màn hẹp), đặt giữa; trong khung đọc hệ số này qua window.__khungTl
    const dat = () => {
      const k = Math.min(innerWidth / W, innerHeight / H);
      window.__khungTl = k;
      f.style.transform = `translate(${Math.round((innerWidth - W * k) / 2)}px, ${Math.round((innerHeight - H * k) / 2)}px) scale(${k})`;
      try { f.contentWindow?.dispatchEvent(new Event('resize')); } catch { /* khung chưa tải */ }   // trong khung vẽ lại theo độ phân giải mới
    };
    dat();
    addEventListener('resize', dat);
    const giu = () => { try { f.focus(); } catch { /* khung chưa tải */ } };   // bấm ra viền đen: bàn phím vẫn điều khiển game
    f.addEventListener('load', giu);
    addEventListener('mousedown', e => { if (e.target !== f) { e.preventDefault(); giu(); } });
    addEventListener('keydown', giu);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dung); else dung();
}

// Trong khung: độ phân giải vẽ = độ phân giải màn thật × hệ số phóng của khung (trang ngoài đặt __khungTl), nên khung vẽ 390 × 844 điểm
// phóng lên vẫn đúng một điểm khung vẽ một điểm màn hình (không nhoè, không vỡ hạt); mọi chỗ đọc devicePixelRatio (src/core/perf.js) theo luôn.
if (tren && q.get('khung') === 'trong') {
  try {
    const d0 = window.devicePixelRatio || 1, goc = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio')?.get, that = () => (goc ? goc.call(window) : d0) || 1;
    const tl = () => { try { const k = +window.parent.__khungTl; return k > 0.2 && k < 8 ? k : 1; } catch { return 1; } };
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => that() * tl() });
  } catch { /* trình duyệt không cho đổi: vẽ theo độ phân giải thật */ }
}
