"""Thú cưỡi mới (chủ dự án 16/11/2026 16:50–16:58): 16 con từ bảng ảnh GPT 4×4 (tools/art/nguon/ai/thu-cuoi-moi/goc.png), mỗi con có một
ô hồng đánh dấu chỗ người ngồi; sẽ làm ba chuyển động SpriteCook "đứng nghỉ, chạy, tấn công" sau khi chủ dự án duyệt ảnh tĩnh và credit.
File này làm ảnh tĩnh đúng chuẩn pixel game (docs/02-CHUAN-PIXEL.md):
1. Mặt nạ hồng = ĐÚNG những điểm màu hồng của 16 mảng hồng lớn (mảng liền trên 2000 điểm), cộng mép lem hồng với nền trắng sát mảng đó.
   Không lấy theo khung chữ nhật: yên, khoen vàng, tai, pha lê vẽ đè lên mảng hồng phải giữ nguyên (chủ dự án 16/11/2026 17:18: "chỉ cần
   xoá màu hồng là được, có phải nền hồng nào cũng hình vuông đâu"; bản trước cắt theo khung, ăn vào yên). Mép lem hồng với viền mực trả về màu mực;
   mép lem hồng với yên, khoen vàng lấy màu điểm không hồng sát bên (hong_lem), không còn sợi hồng nào trên mặt yên.
2. Tách từng con theo khe nền giữa các con (hàng trước, rồi cột trong hàng; hai con chạm nhau thì cắt ở cột ít điểm nhất giữa hai mảng hồng).
3. Bỏ nền (ai_import.remove_bg) với mảng hồng làm tường chắn (nền không tràn qua chỗ hồng vào lông trắng); rồi điểm hồng thành trong suốt
   (chỗ người ngồi, không vẽ thêm gì), gỡ túi nền trắng kẹt giữa mảng hồng và thân.
4. Thu về cỡ điểm game với MỘT hệ số K cho cả 16 con (giữ tương quan to nhỏ như tranh): mảng hồng rộng ~80 điểm tranh ≈ bề ngang người cưỡi
   ~26 điểm game (nhân vật cao 44 điểm, 1 điểm = 0,5333 đơn vị như quái, nhân vật). Gom màu, giữ mắt (cách của quai_tinh.py), viền mực.
5. Chỗ ngồi: giữa mảng hồng theo bề ngang; độ cao = đáy mảng hồng ở khúc giữa (ngay trên mặt yên).
Ra: tinh/NN.png (ảnh tĩnh), xem/NN-goc.png (ô tranh gốc còn ô hồng, thu nhỏ để so), ds.json (cỡ, chỗ ngồi [x, y] trên ảnh ra, hệ số).
Bảng thứ hai (chủ dự án 21/11/2026 10:17, goc-2.jpg, 16 con mới, khoanh ba con #1 #13 #14, "nhớ cái yên… phải sửa lại": vẫn chỉ xoá
đúng điểm hồng): xoá nét bút khoanh trước (net_but.py), chỉ làm các ô chọn, đánh số nối tiếp (17, 18, 19), ds.json ghi thêm, không ghi đè.
21/11 chủ dự án chấm bảng thứ hai: "chưa ngồi đúng lưng", "ảnh 3 bị cắt hỏng yên", "vỡ hình và mờ": vẽ lại nửa sau vành yên bị ô hồng
che (yen_tron.py), chỗ ngồi giữa vòng yên, thu bằng trung bình vùng (thu_vung); bảng đầu giữ nguyên cách cũ.
Chạy: python3 -I tools/art/thu_cuoi_moi.py   (bảng đầu, 16 con)
      python3 -I tools/art/thu_cuoi_moi.py goc-2.jpg 1,13,14 17   (bảng, ô chọn, số đầu)"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ai_import import remove_bg, shrink, quantize, outline, INK
from quai_tinh import drop_specks, auto_masks, paint_small
from net_but import net_but
from yen_tron import yen_tron


def ndimage_dil(m, it=3):
    from scipy import ndimage
    return ndimage.binary_dilation(m, iterations=it)

D = Path(__file__).resolve().parent / 'nguon' / 'ai' / 'thu-cuoi-moi'
K = 0.33          # hệ số thu chung (điểm game / điểm tranh)
COLORS = 24       # thú cưỡi nhiều chi tiết (yên, đèn, chuông) hơn quái: 24 màu
THU = shrink     # cách thu về cỡ game (bảng thứ hai đổi ở main)
TEN = ['Cửu vĩ hồ trắng', 'Rùa non bộ', 'Sư thứu trắng', 'Hươu sao đêm', 'Hỏa long dung nham', 'Rùa nấm đỏ', 'Mèo cơ quan', 'Cá voi mây',
       'Cóc sen', 'Hổ pha lê', 'Phượng hoàng lửa', 'Sứa đèn lồng', 'Sư tử đá rêu', 'Bạch tuộc đèn lồng', 'Hươu mây', 'Nhện pha lê',
       'Hắc lang huyết nguyệt', 'Tượng lầu xích', 'Kình mây tím']   # tên tả tạm (17–19: bảng thứ hai #1, #13, #14)


def boxes(rgb):
    from scipy import ndimage
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = (r > 200) & (g < 60) & (b > 170)
    lab, n = ndimage.label(m)
    out = []
    for k in range(1, n + 1):
        ys, xs = np.nonzero(lab == k)
        if len(ys) > 2000: out.append([int(xs.min()) - 3, int(ys.min()) - 3, int(xs.max()) + 4, int(ys.max()) + 4])
    return out


def runs0(p, lo, hi):
    """Các khúc cột / hàng không có hình trong [lo, hi)."""
    out, s = [], None
    for i in range(lo, hi):
        if p[i] == 0 and s is None: s = i
        if p[i] != 0 and s is not None: out.append((s, i)); s = None
    if s is not None: out.append((s, hi))
    return out


def cells(rgb, B):
    """Khung từng con: chia hàng theo khe nền ngang, trong hàng chia cột giữa hai ô hồng liền nhau."""
    nb = (np.abs(rgb - 252).sum(2) > 45)
    H, W = nb.shape
    rows = sorted(B, key=lambda b: b[1])
    bands, cur = [], [rows[0]]
    for b in rows[1:]:
        if b[1] - cur[-1][1] > 120: bands.append(cur); cur = [b]
        else: cur.append(b)
    bands.append(cur)
    rp = nb.sum(1); edges = [0]
    for i in range(len(bands) - 1):
        lo, hi = max(b[3] for b in bands[i]), min(b[1] for b in bands[i + 1])
        lo = max(lo, max(b[3] for b in bands[i]) + 60)   # khe phải nằm dưới chân hàng trên
        gs = [g for g in runs0(rp, lo, H) if g[0] < hi + 200]
        edges.append((gs[0][0] + gs[0][1]) // 2 if gs else (lo + hi) // 2)
    edges.append(H)
    out = []
    for i, band in enumerate(bands):
        y0, y1 = edges[i], edges[i + 1]
        cp = nb[y0:y1].sum(0); band = sorted(band, key=lambda b: b[0]); cut = [0]
        for a, c in zip(band, band[1:]):
            ca, cc = (a[0] + a[2]) // 2, (c[0] + c[2]) // 2
            gs = [g for g in runs0(cp, ca, cc) if g[1] - g[0] >= 2]
            cut.append((max(gs, key=lambda g: g[1] - g[0])[0] + max(gs, key=lambda g: g[1] - g[0])[1]) // 2 if gs else ca + int(np.argmin(cp[ca:cc])))
        cut.append(W)
        for j, b in enumerate(band): out.append(((cut[j], y0, cut[j + 1], y1), b))
    return out


def pockets(a, hole, tol=15, near=16):
    """Túi nền bị ô hồng chắn lại (kẹp giữa ô và thân, nền tràn từ ngoài không tới): loang từ mép ô qua điểm đúng màu nền (xám trắng,
    không tối hơn 252 − tol − 1, không ngả màu), chỉ trong near điểm quanh ô. Lông trắng có ngả xanh / hồng và có viền nên không bị ăn."""
    from collections import deque
    rgb = a[..., :3].astype(int); H, W = hole.shape
    bgish = (rgb.min(2) >= 252 - tol - 1) & (rgb.max(2) - rgb.min(2) <= 8)   # nền ô cờ xám trắng 236–255, không ngả màu
    ys, xs = np.nonzero(hole); y0, y1, x0, x1 = ys.min() - near, ys.max() + near, xs.min() - near, xs.max() + near
    seen = np.zeros_like(hole); q = deque()
    for y, x in zip(*np.nonzero(hole)):
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < H and 0 <= xx < W and not hole[yy, xx] and bgish[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; q.append((yy, xx))
    while q:
        y, x = q.popleft()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if y0 <= yy <= y1 and x0 <= xx <= x1 and 0 <= yy < H and 0 <= xx < W and not hole[yy, xx] and bgish[yy, xx] and not seen[yy, xx]:
                seen[yy, xx] = True; q.append((yy, xx))
    return seen


PINK = np.array([249, 6, 207])


def seg(rgb, q):
    """Điểm có phải màu trộn giữa hồng và màu q không: trả (t: tỉ lệ q, d: lệch khỏi đoạn hồng–q)."""
    v = np.array(q, float) - PINK; c = rgb.astype(float) - PINK
    t = np.clip((c @ v) / (v @ v), 0, 1); d = np.linalg.norm(c - t[..., None] * v, axis=-1)
    return t, d


def pink_masks(rgb):
    """big: điểm hồng của các mảng hồng lớn; bg: mép lem hồng–trắng sát mảng (thành nền); ink: mép lem hồng–mực sát mảng (thành màu mực);
    near: dải 3 điểm quanh mảng hồng (chỗ còn mép lem hồng với yên, khoen vàng... xử lý ở hong_lem)."""
    from scipy import ndimage
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    core = (r > 200) & (g < 60) & (b > 170)
    lab, n = ndimage.label(core); sizes = ndimage.sum(core, lab, range(1, n + 1))
    big = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 2000])
    near = ndimage.binary_dilation(big, iterations=3) & ~big
    tw, dw = seg(rgb, (252, 252, 252)); tk, dk = seg(rgb, INK[:3])
    bg = near & (dw < 34) & (tw < 0.92)
    ink = near & ~bg & (dk < 40) & (tk > 0.25)
    return big, bg, ink, near


def hong_lem(a, ring):
    """Mép lem hồng còn sót trong dải quanh mảng hồng (hồng trộn với yên, khoen vàng, mực nhạt): điểm sắc tím hồng đậm (hue 285–340°,
    bão hoà > 0,5, sáng > 0,35) lấy màu điểm không hồng gần nhất bên trong (giữ đúng hình yên, chỉ bỏ sắc hồng); xa quá 3 điểm thì bỏ."""
    from scipy import ndimage
    c = a[..., :3].astype(float) / 255; mx, mn = c.max(-1), c.min(-1); d = mx - mn + 1e-9
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    fr = ring & (a[..., 3] > 0) & (h > 285) & (h < 340) & (d / np.maximum(mx, 1e-9) > 0.5) & (mx > 0.35)
    keep = (a[..., 3] > 0) & ~fr
    if not fr.any() or not keep.any(): return a
    dist, (iy, ix) = ndimage.distance_transform_edt(~keep, return_indices=True)
    a[fr, :3] = a[iy[fr], ix[fr], :3]
    a[fr & (dist > 3), 3] = 0
    return a


def vien_jpeg(a, lap=3):
    """Bảng JPEG (bảng thứ hai): bỏ quầng trắng xám lem quanh mép hình sau khi bỏ nền (điểm sáng, nhạt màu chạm chỗ trong suốt), lặp vài lần.
    Hình có viền mực nên phần trắng của hình (bụng cá voi, lông trắng) không chạm thẳng chỗ trong suốt."""
    from scipy import ndimage
    for _ in range(lap):
        op = a[..., 3] > 0; rgb = a[..., :3].astype(int)
        sang = (rgb.min(2) > 175) & (rgb.max(2) - rgb.min(2) < 40)
        bo = op & sang & ndimage.binary_dilation(~op)
        if not bo.any(): break
        a[bo, 3] = 0
    return a


def le_canh(a, frac=0.05):
    """Bỏ mảnh hình lấn từ ô bên cạnh: mảng liền chạm mép trái / phải ô và nhỏ hơn frac tổng điểm hình."""
    from scipy import ndimage
    lab, n = ndimage.label(a[..., 3] > 0); tot = (lab > 0).sum()
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if (sl[1].start == 0 or sl[1].stop == a.shape[1]) and (lab[sl] == i).sum() < frac * tot: a[lab == i, 3] = 0
    return a


def thu_vung(src, th):
    """Bảng thứ hai (JPEG, không có lưới điểm rõ): thu bằng trung bình vùng (có tính độ trong) thay vì lấy màu đa số từng ô; lấy màu đa số
    trên ảnh JPEG nhiễu ra đốm lẻ, răng cưa (21/11 chủ dự án chê "vỡ hình và mờ"). Gom màu, giữ mắt, viền mực vẫn làm sau đó như cũ."""
    import cv2
    h, w = src.shape[:2]; k = h / th; tw = max(1, round(w / k))
    pm = src.astype(float); pm[..., :3] *= pm[..., 3:4] / 255
    r = cv2.resize(pm, (tw, th), interpolation=cv2.INTER_AREA)
    al = r[..., 3]; out = np.zeros((th, tw, 4), np.uint8); on = al >= 128
    out[on, :3] = np.clip(r[on, :3] / (al[on, None] / 255), 0, 255); out[on, 3] = 255
    return out


def one(rgb, cell, n, big, bgm, ink, near, jpeg=False):
    x0, y0, x1, y1 = cell
    a = np.dstack([rgb[y0:y1, x0:x1], np.full((y1 - y0, x1 - x0), 255)]).astype(np.uint8)
    pm, bm = big[y0:y1, x0:x1], bgm[y0:y1, x0:x1]
    a[ink[y0:y1, x0:x1], :3] = INK[:3]   # mép lem hồng–mực: về màu mực
    a[0, 0, :3] = 252
    wall = a.copy(); wall[pm | bm, :3] = PINK   # điểm hồng chặn nền tràn vào lông trắng
    clean = remove_bg(wall, 40); clean[..., :3] = a[..., :3]
    gone = pm | bm
    clean[gone, 3] = 0
    clean[pockets(a, gone), 3] = 0
    clean = hong_lem(clean, near[y0:y1, x0:x1] & ~gone)
    e = None
    if jpeg:
        clean = le_canh(vien_jpeg(clean))
        clean, e = yen_tron(clean, gone | ~(clean[..., 3] > 0) & ndimage_dil(pm), pm)   # vẽ lại nửa sau vành yên bị ô hồng che
    clean = drop_specks(clean, 0.0015)
    ys, xs = np.nonzero(clean[..., 3] > 0)
    cy0, cy1, cx0, cx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    src = clean[cy0:cy1, cx0:cx1]
    th = max(12, round((cy1 - cy0) * K)); k = (cy1 - cy0) / th
    q = quantize(THU(src, th), COLORS)
    for em in auto_masks(src): paint_small(q, src, em, th)
    out = outline(q)
    py, px = np.nonzero(pm); mx0, mx1 = px.min(), px.max(); cxm = (mx0 + mx1) / 2; half = (mx1 - mx0) * 0.2
    bottoms = [py[px == c].max() for c in range(int(cxm - half), int(cxm + half) + 1) if (px == c).any()]
    sy = float(np.median(bottoms)) + 1   # mặt yên ngay dưới đáy mảng hồng
    if jpeg:   # bảng thứ hai: ô hồng lơ lửng trên yên (21/11 "chưa ngồi đúng lưng"): ngồi giữa vòng yên, hoặc mặt yên thật dưới ô hồng
        if e: cxm, sy = e['xc'], e['cat'] + 1 + 0.4 * e['dem']   # đáy người ngồi lún vào đệm yên
        else:
            op = clean[..., 3] > 0; tops = []
            for c in range(int(cxm - half), int(cxm + half) + 1):
                r = np.nonzero(op[py.min():, c])[0]
                if len(r): tops.append(py.min() + r[0])
            sy = float(np.median(tops))
    seat = [round((cxm - cx0) / k) + 1, round((sy - cy0) / k) + 1]   # +1: viền mực
    oy, ox = np.nonzero(out[..., 3]); out = out[oy.min():oy.max() + 1, ox.min():ox.max() + 1]
    seat = [seat[0] - int(ox.min()), seat[1] - int(oy.min())]
    Image.fromarray(out, 'RGBA').save(D / 'tinh' / f'{n:02d}.png')
    g = np.dstack([rgb[y0:y1, x0:x1], np.full((y1 - y0, x1 - x0), 255)]).astype(np.uint8)
    gy, gx = np.nonzero(np.abs(rgb[y0:y1, x0:x1] - 252).sum(2) > 45); g = g[gy.min():gy.max() + 1, gx.min():gx.max() + 1]
    Image.fromarray(g, 'RGBA').resize((max(1, round(g.shape[1] * K)), max(1, round(g.shape[0] * K))), Image.LANCZOS).save(D / 'xem' / f'{n:02d}-goc.png')
    r = {'n': n, 'ten': TEN[n - 1], 'w': int(out.shape[1]), 'h': int(out.shape[0]), 'seat': seat, 'hong': int(pm.sum() + bm.sum())}
    if e: r['yen'] = {k: round(v, 1) for k, v in e.items()}
    return r


def main(argv):
    bang, chon, tu = (argv + [None, None, None])[:3] if argv else ('goc.png', None, None)
    rgb, nb = net_but(np.array(Image.open(D / bang).convert('RGB')))
    rgb = rgb.astype(int)
    (D / 'tinh').mkdir(exist_ok=True); (D / 'xem').mkdir(exist_ok=True)
    big, bgm, ink, near = pink_masks(rgb)
    B = boxes(rgb)
    assert len(B) == 16, f'tìm thấy {len(B)} mảng hồng, cần 16'
    cs = cells(rgb, B)
    pick = [int(x) for x in chon.split(',')] if chon else list(range(1, 17))
    so = int(tu) if tu else 1
    global THU
    if bang.endswith('.jpg'): THU = thu_vung
    res = [one(rgb, cs[o - 1][0], so + i, big, bgm, ink, near, bang.endswith('.jpg')) for i, o in enumerate(pick)]
    p = D / 'ds.json'
    ds = json.load(open(p, encoding='utf-8')) if chon and p.exists() else {'thu': []}
    ds['thu'] = [t for t in ds['thu'] if t['n'] not in {r['n'] for r in res}] + res
    ds['_note'] = 'Thú cưỡi mới (chủ dự án 16/11/2026; 17–19 từ bảng thứ hai 21/11/2026): ảnh tĩnh ở tinh/NN.png, cỡ điểm game (1 điểm = 0,5333 đơn vị); chỉ xoá đúng điểm hồng (17:18); seat: chỗ chân người cưỡi trên ảnh ra (bảng đầu: giữa mảng hồng, ngay trên mặt yên; bảng thứ hai: giữa vòng yên đã vẽ lại nửa sau, đáy người lún vào đệm, hoặc mặt yên thật dưới ô hồng); yen: vòng yên vẽ lại (yen_tron.py); ten: tên tả tạm; hong: số điểm hồng đã xoá (cỡ tranh).'
    ds['k'] = K
    json.dump(ds, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('nét bút', nb)
    for r in res: print(r)


if __name__ == '__main__':
    main(sys.argv[1:])
