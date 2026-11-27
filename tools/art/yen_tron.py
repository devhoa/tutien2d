"""Vẽ lại phần yên bị ô hồng che (chủ dự án 21/11/2026: "ảnh 3 thì bị cắt hỏng yên"; 16/11: "lần trước cắt ảnh phẳng làm mất cái yên").
Bảng thứ hai vẽ ô hồng đè lên nửa sau vành yên: chỉ xoá điểm hồng thì yên còn hình chữ U (vành vàng + đệm), mép trên phẳng như bị cắt.
Cách lấp: vành vàng chạm đáy ô hồng cho bề ngang yên [xl, xr]; mỗi cột trong khoảng đó (và nằm dưới ô hồng) đo phần yên dưới đường cắt
(đệm tới vành, rồi bề dày vành, bỏ phần móc treo dài hơn vành thường), rồi soi gương lên trên đường cắt, ép thấp lại K_SAU lần (nửa sau yên
nhìn chéo thấp hơn nửa trước): ra vành sau và đệm yên khép kín, đúng màu, đúng viền mực của chính yên đó. Phần ô hồng ngoài đó vẫn trong
suốt (chỗ người ngồi). Không thấy vành vàng chạm ô hồng thì để nguyên.
yen_tron(clean, gone, pm) → (clean đã lấp, thông tin yên hoặc None); toạ độ theo ô tranh."""
import numpy as np

K_SAU = 0.6   # vành sau cao bằng chừng này lần phần yên thấy được dưới đường cắt


def _hsv(rgb):
    c = rgb.astype(float) / 255; mx, mn = c.max(-1), c.min(-1); d = mx - mn + 1e-9
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, d / np.maximum(mx, 1e-9), mx


def vang(clean, op):
    h, s, v = _hsv(clean[..., :3])
    return op & (h > 22) & (h < 58) & (s > 0.4) & (v > 0.45)


def yen_tron(clean, gone, pm):
    from scipy import ndimage
    if not pm.any():
        return clean, None
    py, px = np.nonzero(pm); bx0, bx1, by1 = px.min(), px.max(), py.max(); w = bx1 - bx0 + 1
    H, W = clean.shape[:2]; op = (clean[..., 3] > 0) & ~gone
    gold = vang(clean, op)
    lab, _ = ndimage.label(gold, np.ones((3, 3)))
    band = np.zeros_like(gold); band[by1 + 1:by1 + 4, max(0, bx0 - 2):min(W, bx1 + 3)] = True
    keep = np.unique(lab[band & gold]); keep = keep[keep > 0]
    if not len(keep):
        return clean, None
    rim = np.isin(lab, keep)
    xs = np.nonzero(rim[by1 + 1:by1 + 4 + int(0.15 * w)].any(0))[0]
    xl, xr = max(xs.min(), bx0), min(xs.max(), bx1)
    if xr - xl < 0.3 * w:
        return clean, None
    cols = range(xl, xr + 1); seat, thick = {}, {}
    for x in cols:   # dưới đường cắt: đệm (không vàng) rồi vành (vàng)
        y = by1 + 1; s = 0
        while y < H and op[y, x] and not gold[y, x] and s < w: y += 1; s += 1
        t = 0
        while y < H and gold[y, x] and t < w: y += 1; t += 1
        seat[x], thick[x] = s, t
    tt = np.array([thick[x] for x in cols if thick[x]]); tm = float(np.median(tt)) if len(tt) else 0
    if tm == 0:
        return clean, None
    src = clean.copy(); lap = 0
    for x in cols:
        if not op[by1 + 1, x] and not gold[by1 + 1, x]:
            continue
        d = seat[x] + min(thick[x], tm * 1.5) + 2   # +2: viền mực dưới vành
        hh = int(round(d * K_SAU))
        for u in range(1, hh + 1):   # u điểm trên đường cắt ← u / K_SAU điểm dưới đường cắt
            y = by1 + 1 - u; ys = by1 + int(round(u / K_SAU))
            if y < 0 or ys >= H or not gone[y, x] or src[ys, x, 3] == 0:
                continue
            clean[y, x] = src[ys, x]; lap += 1
    xc = (xl + xr) / 2
    return clean, {'xl': int(xl), 'xr': int(xr), 'cat': int(by1), 'dem': float(np.median([seat[x] for x in cols])), 'vanh': tm, 'lap': lap,
                   'xc': float(xc)}
