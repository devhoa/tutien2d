// Máy người chơi báo về bảng lỗi (p2d_loi, qua src/net/errlog.js; chỉ khi đã đăng nhập) khi hình tải hỏng (26/11/2026: iPhone chủ dự án
// mất khung, icon, nền, hình nhân vật mà máy chủ không thấy gì). Đọc sổ src/core/hinh-so.js lúc 30 giây, 2 phút, 6 phút sau khi mở trang;
// có hình còn hỏng thì gửi một dòng: số tấm hỏng / sai cỡ / cỡ 0 / khung CSS, vài tên tấm, kèm thông tin máy (service worker, mạng, độ nét,
// số tệp đã tải, kho canvas). Mỗi phiên tối đa 3 lần, không gửi lại khi số không đổi. Không đổi gì trong game.
import { soHinh } from '../core/hinh-so.js';
import { canvasKho } from '../render/sprites.js';

const MOC_S = [30, 120, 360];

export function startHinhBao(game) {
  let cuoi = '';
  const xet = async () => {
    const s = soHinh(), tong = s.hong + s.saiCo + s.rong + s.css;
    if (!tong) return;
    const tin = `hinh: ${s.hong} hong, ${s.saiCo} sai co, ${s.rong} co 0, ${s.css} khung css`;
    if (tin === cuoi) return;
    cuoi = tin;
    const kho = canvasKho(), tep = performance.getEntriesByType?.('resource')?.length || 0;
    const may = [
      `dau ${s.lanDau}s`, `mo ${Math.round(performance.now() / 1000)}s`, `sw ${navigator.serviceWorker?.controller ? 1 : 0}`,
      `mang ${navigator.onLine ? 1 : 0}${navigator.connection?.effectiveType ? ' ' + navigator.connection.effectiveType : ''}`,
      `dpr ${devicePixelRatio}`, `man ${innerWidth}x${innerHeight}`, `tep ${tep}`, `kho ${kho.mb}MB/${kho.so}`,
      `ban_do ${game.save?.map || '-'}`,
    ].join(', ');
    const mau = Object.entries(s.mau).filter(([, v]) => v.length).map(([k, v]) => `${k}: ${v.join('; ')}`).join(' | ');
    try { const m = await import('../net/errlog.js'); await m.sendError(tin, `${may}\n${mau}`.slice(0, 1500), 'hinh'); } catch { /* chưa đăng nhập, mạng hỏng: thôi */ }
  };
  for (const s of MOC_S) setTimeout(xet, s * 1000);
}
