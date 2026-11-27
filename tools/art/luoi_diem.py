"""Đọc tranh GPT kiểu pixel theo đúng lưới điểm giả của nó (chủ dự án 21/11/2026: ảnh thu về cỡ game "vỡ hình và mờ").
Tranh GPT kiểu pixel vẽ mỗi điểm thành một ô vuông p × p điểm tranh (p không nguyên, ví dụ 6,15). Thu với hệ số lệch lưới thì một điểm
game rơi vắt qua hai ô: ra răng cưa, đốm lẻ ("vỡ") hoặc màu pha ("mờ"). Ở đây dò cỡ ô và độ lệch (pha) từ năng lượng biên, rồi lấy
màu giữa từng ô: ra đúng một điểm game cho một ô tranh, nét như bản gốc.
luoi(rgb) → (px, ox, py, oy, độ rõ x, độ rõ y); doc(a, lưới) → mảng RGBA cỡ game."""
import numpy as np


def _pho(g, ps):
    x = np.arange(len(g)) + 0.5   # biên giữa điểm k và k+1
    best = None
    for p in ps:
        z = (g * np.exp(2j * np.pi * x / p)).sum() / g.sum()
        if best is None or abs(z) > best[1]:
            best = (p, abs(z), np.angle(z))
    p, c, ph = best
    return p, (-ph / (2 * np.pi) * p) % p, c   # cỡ ô, chỗ biên ô đầu tiên, độ rõ


def luoi(rgb, lo=3.0, hi=12.0):
    """Ô tranh GPT là ô vuông: hai trục lệch nhau quá 4% thì lấy cỡ của trục rõ hơn cho cả hai, dò lại pha trục kia."""
    a = rgb[..., :3].astype(float)
    gx = np.abs(np.diff(a, axis=1)).sum(2).sum(0)
    gy = np.abs(np.diff(a, axis=0)).sum(2).sum(1)
    ps = np.arange(lo, hi, 0.005)
    px, ox, cx = _pho(gx, ps)
    py, oy, cy = _pho(gy, ps)
    if abs(px - py) > 0.04 * min(px, py):
        if cx >= cy: py, oy, cy = _pho(gy, np.array([px]))
        else: px, ox, cx = _pho(gx, np.array([py]))
    return px, ox, py, oy, cx, cy


def doc(a, g, trong=0.5):
    """a: RGBA (alpha 0/255) cỡ tranh; g: kết quả luoi. Lấy trung vị màu phần giữa mỗi ô (trong: tỉ lệ cạnh ô lấy mẫu), ô có hình khi
    quá nửa phần giữa có hình."""
    px, ox, py, oy = g[:4]
    H, W = a.shape[:2]
    xs = np.arange(ox - px, W, px); ys = np.arange(oy - py, H, py)
    out = np.zeros((len(ys), len(xs), 4), np.uint8)
    m = (1 - trong) / 2
    for j, y0 in enumerate(ys):
        ya, yb = int(round(y0 + m * py)), int(round(y0 + (1 - m) * py))
        ya, yb = max(0, ya), min(H, max(yb, ya + 1))
        if ya >= yb:
            continue
        for i, x0 in enumerate(xs):
            xa, xb = int(round(x0 + m * px)), int(round(x0 + (1 - m) * px))
            xa, xb = max(0, xa), min(W, max(xb, xa + 1))
            if xa >= xb:
                continue
            c = a[ya:yb, xa:xb].reshape(-1, 4)
            on = c[c[:, 3] >= 128]
            if len(on) * 2 <= len(c):
                continue
            out[j, i] = (*np.median(on[:, :3], axis=0).astype(np.uint8), 255)
    ys_, xs_ = np.nonzero(out[..., 3])
    return out[ys_.min():ys_.max() + 1, xs_.min():xs_.max() + 1]
