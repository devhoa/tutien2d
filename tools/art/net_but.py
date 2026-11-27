"""Xoá nét bút khoanh của chủ dự án trên bảng ảnh GPT (21/11/2026: chủ dự án khoanh tròn bằng bút xám những ô chọn làm).
Nét bút là đường cong xám trung tính (~#7e7e7e), dày 4–6 điểm, dài: mảng xám liền rất thưa trong khung của nó (dưới 15% khung).
Điểm nét bút (nới thêm 2 điểm cho mép mờ JPEG) lấy màu và độ trong suốt của điểm không phải nét bút gần nhất: nằm trên nền thì
thành nền, đè lên hình thì vá bằng màu hình bên cạnh (nét chỉ 4–6 điểm, thu về cỡ game 0,33–0,4 thì không còn thấy vết vá)."""
import numpy as np
from scipy import ndimage


def net_but(a):
    """a: mảng RGB hoặc RGBA (uint8). Trả về (mảng đã xoá nét, số điểm nét)."""
    a = a.copy()
    rgb = a[..., :3].astype(int)
    xam = (rgb.max(2) - rgb.min(2) < 14) & (rgb.mean(2) > 80) & (rgb.mean(2) < 175)
    if a.shape[2] == 4:
        xam &= a[..., 3] > 200
    lab, _ = ndimage.label(xam)
    net = np.zeros(xam.shape, bool)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        m = lab[sl] == i
        c = int(m.sum())
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        mean = rgb[sl][m].mean(0)
        if c > 300 and c / (w * h) < 0.15 and 110 < mean.mean() < 140 and np.ptp(mean) < 6:
            net[sl] |= m
    if not net.any():
        return a, 0
    net = ndimage.binary_dilation(net, iterations=2)
    _, (iy, ix) = ndimage.distance_transform_edt(net, return_indices=True)
    a[net] = a[iy[net], ix[net]]
    return a, int(net.sum())
