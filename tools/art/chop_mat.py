"""Chớp mắt lúc đứng nghỉ cho trang phục mới (chủ dự án 23/11/2026: "đứng im phải thêm hiệu ứng chớp mắt nữa"). Không tốn credit:
mỗi khung đứng nghỉ (sc/NN-dung.webp, 8 khung) có thêm một bản nhắm mắt, game thỉnh thoảng thay khung đứng bằng bản nhắm trong
một nhịp ngắn (src/render/chop-mat.js, số ở data/heroes.json → chop_mat).
Chỗ mắt: ô bao mi trên + tròng mắt ở khung 0, đo bằng tay trên bản đồ màu từng điểm (dò tự động bắt nhầm tóc vàng, vành nón, miệng),
ghi ở MAT. Khung 1–7 nhân vật nhún / lắc đầu 0–2 điểm: dời ô theo chỗ vùng mặt quanh mắt khớp nhất với khung 0.
Nhắm: mọi điểm không phải da trong ô thành màu da (trung vị da quanh mắt), rồi kẻ mi nhắm một hàng ở 2/3 ô bằng màu tối nhất của mắt.
Gọi từ trang_phuc_game.py (khung 33–40 của tấm hero-tp-NN.png). Xem thử: python3 -I tools/art/chop_mat.py <tệp ra.png>"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageSequence

Q = Path(__file__).resolve().parent / 'nguon' / 'ai' / 'trang-phuc-moi'
# ô mắt ở khung 0 của sc/NN-dung.webp: [x0, y0, x1, y1] (gồm hai đầu), mắt sau rồi mắt trước
MAT = {
    '01': [[31, 33, 35, 37], [41, 33, 42, 37]], '02': [[31, 32, 35, 35], [40, 32, 42, 35]], '03': [[28, 30, 32, 34], [37, 30, 39, 34]],
    '04': [[30, 32, 34, 35], [39, 32, 41, 35]], '05': [[31, 30, 35, 34], [40, 30, 42, 34]], '06': [[33, 32, 37, 35], [42, 32, 44, 35]],
    '07': [[31, 31, 34, 36], [39, 31, 42, 35]], '08': [[32, 32, 36, 36], [40, 32, 42, 35]], '09': [[30, 31, 34, 35], [39, 31, 41, 35]],
    '10': [[31, 30, 35, 34], [40, 30, 42, 33]], '11': [[31, 32, 35, 35], [40, 32, 41, 35]], '12': [[31, 32, 35, 36], [40, 32, 42, 36]],
    '13': [[33, 31, 36, 35], [41, 31, 43, 34]], '14': [[33, 31, 37, 34], [42, 31, 44, 34]], '15': [[34, 31, 38, 35], [42, 31, 44, 35]],
    '16': [[32, 33, 35, 37], [41, 33, 43, 37]], '18': [[32, 34, 35, 37], [41, 34, 42, 38]], '19': [[33, 32, 37, 35], [43, 32, 44, 35]],
}
LECH = 2   # dời ô tối đa mỗi chiều giữa các khung


def la_da(p):
    r, g, b = (int(v) for v in p[:3])
    return p[3] > 0 and r >= 170 and g >= 120 and b >= 0.66 * r and r >= g and g >= b - 8 and r - b >= 15


def doi(f0, f, box):
    """Độ dời (dx, dy) của vùng quanh ô mắt từ khung 0 sang khung f."""
    x0, y0, x1, y1 = box; m = 3
    a = f0[y0 - m:y1 + m + 1, x0 - m:x1 + m + 1].astype(int); best = (1e18, 0, 0)
    for dy in range(-LECH, LECH + 1):
        for dx in range(-LECH, LECH + 1):
            b = f[y0 - m + dy:y1 + m + 1 + dy, x0 - m + dx:x1 + m + 1 + dx].astype(int)
            if b.shape != a.shape: continue
            s = np.abs(a - b).sum() + 40 * (abs(dx) + abs(dy))   # bằng nhau thì chọn dời ít
            if s < best[0]: best = (s, dx, dy)
    return best[1], best[2]


def nham(f, box):
    """Bản nhắm của một mắt trên khung f (đã dời ô)."""
    x0, y0, x1, y1 = box; g = f.copy(); o = f[y0:y1 + 1, x0:x1 + 1]
    da = [f[y, x] for y in range(y0 - 1, y1 + 3) for x in range(x0 - 1, x1 + 2)
          if 0 <= y < f.shape[0] and 0 <= x < f.shape[1] and la_da(f[y, x])]
    if not da: return g
    c = np.median(np.array(da)[:, :3], axis=0).astype(np.uint8)
    on = o[o[..., 3] > 0][:, :3].astype(int); mi = on[np.argmin(on.sum(1))].astype(np.uint8)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if f[y, x, 3] and not la_da(f[y, x]): g[y, x, :3] = c
    row = y0 + int(round((y1 - y0) * 2 / 3))
    g[row, x0:x1 + 1, :3] = mi; g[row, x0:x1 + 1, 3] = 255
    return g


def khung_nham(k, fr):
    """fr: 8 khung đứng nghỉ (RGBA) của bộ k. Trả 8 khung nhắm mắt, hoặc None nếu chưa đo mắt bộ này."""
    if k not in MAT: return None
    out = []
    for f in fr:
        g = f
        for box in MAT[k]:
            dx, dy = doi(fr[0], f, box); x0, y0, x1, y1 = box
            g = nham(g, [x0 + dx, y0 + dy, x1 + dx, y1 + dy])
        out.append(g)
    return out


def xem(dst):
    """Ảnh thử: mỗi bộ khung 0 mở / nhắm, phóng 6 lần, cắt quanh mặt."""
    tiles = []
    for k in sorted(MAT):
        fr = [np.array(x.convert('RGBA')) for x in ImageSequence.Iterator(Image.open(Q / 'sc' / f'{k}-dung.webp'))]
        nh = khung_nham(k, fr); x0 = min(b[0] for b in MAT[k]) - 8; y0 = min(b[1] for b in MAT[k]) - 9
        pair = np.concatenate([fr[0][y0:y0 + 18, x0:x0 + 22], nh[0][y0:y0 + 18, x0:x0 + 22]], axis=1)
        im = Image.new('RGBA', (pair.shape[1], pair.shape[0]), (150, 150, 160, 255)); im.alpha_composite(Image.fromarray(pair))
        tiles.append(im.resize((im.width * 6, im.height * 6), Image.NEAREST))
    w, h, cols = tiles[0].width + 12, tiles[0].height + 12, 4
    o = Image.new('RGBA', (cols * w, (len(tiles) + cols - 1) // cols * h), (50, 50, 60, 255))
    for i, t in enumerate(tiles): o.alpha_composite(t, (i % cols * w, i // cols * h))
    o.save(dst)


if __name__ == '__main__':
    xem(sys.argv[1])
