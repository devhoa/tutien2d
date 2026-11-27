// Lời mời tải bản Android (chủ dự án 24/11/2026: "khi người chơi vào link sẽ có dòng bạn có muốn tải xuống, ấn vào tải; Android thôi,
// iOS thì không cần"). Chỉ hiện trên trình duyệt Android, không hiện trong chính ứng dụng Android (TWA mở trang với referrer
// android-app://<tên gói>) và không hiện khi đã cài bản web vào máy. Bấm "Để sau" thì ẩn again_days ngày. Số, chữ ở data/config.json → android.
const KEY = 'p2d-apk-hoi', APP = 'p2d-trong-app';

export function initApkOffer(cfg) {
  if (!cfg?.on || !cfg.apk) return;
  if (!/android/i.test(navigator.userAgent)) return;
  try {
    if (document.referrer.startsWith('android-app://')) sessionStorage.setItem(APP, '1');
    if (sessionStorage.getItem(APP)) return;                      // đang chạy trong ứng dụng Android
    const sau = +localStorage.getItem(KEY) || 0;
    if (Date.now() < sau) return;                                 // vừa bấm "Để sau"
  } catch { /* không có bộ nhớ: vẫn hỏi */ }
  if (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches) return;

  const box = document.createElement('div');
  box.id = 'apk-offer';
  box.setAttribute('role', 'dialog');
  const p = document.createElement('p');
  p.textContent = cfg.ask;
  const yes = document.createElement('a');
  yes.className = 'apk-yes';
  yes.href = cfg.apk + (cfg.ver ? '?v=' + encodeURIComponent(cfg.ver) : '');
  yes.setAttribute('download', cfg.file || '');
  yes.textContent = cfg.yes;
  const no = document.createElement('button');
  no.className = 'apk-no';
  no.type = 'button';
  no.textContent = cfg.no;
  const close = () => box.remove();
  no.onclick = () => {
    try { localStorage.setItem(KEY, String(Date.now() + (cfg.again_days ?? 3) * 864e5)); } catch { /* chỉ ẩn lần này */ }
    close();
  };
  yes.onclick = () => {
    try { localStorage.setItem(KEY, String(Date.now() + (cfg.after_dl_days ?? 30) * 864e5)); } catch { /* bỏ qua */ }
    setTimeout(close, 300);
  };
  const row = document.createElement('div');
  row.className = 'apk-row';
  row.append(yes, no);
  box.append(p, row);
  document.body.append(box);
}
