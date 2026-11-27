"""Pháp tượng bảng thứ hai (chủ dự án 21/11/2026 10:17: bảng ảnh GPT 4×4 16 pháp tượng, khoanh ba cái #1 #8 #13, "làm thêm 3 bộ này";
"làm ảnh tĩnh trước"). Đánh số nối tiếp 16 pháp tượng đầu: 17, 18, 19. Cắt y như phap_tuong.py (32 màu, không viền mực, trục đối xứng,
lỗ giữa), thêm bước xoá nét bút khoanh (net_but.py). Nền bảng trong suốt thật; quầng mờ (alpha dưới 128) rơi hết lúc cắt.
Khác bảng đầu: bảng này là tranh điểm ảnh có lưới rõ (ô ~3,23 điểm tranh). Bản đầu thu theo hệ số K của bảng đầu (lệch lưới) bị chê
"vỡ hình và mờ" (21/11), nên đọc theo đúng lưới (luoi_diem.py): ra ~92 điểm, nhỏ hơn 16 cái đầu (~128). Để trong game cùng cỡ với
16 cái đầu thì vẽ to thêm `phong` = K × cỡ ô lần (ghi ở ds.json; draw-phap-tuong.js nhân thêm khi đưa vào game).
Ra: goc/NN.png (ảnh cắt cỡ gốc), tinh/NN.png, ds.json → pt.NN (ghi thêm). Chạy: python3 -I tools/art/phap_tuong_2.py"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ai_import import quantize
from net_but import net_but
from phap_tuong import D, K, COLORS, COLS, ROWS, axis, hole
from luoi_diem import luoi, doc

CHON = {1: 17, 8: 18, 13: 19}   # ô bảng → số pháp tượng


def main():
    a, nb = net_but(np.array(Image.open(D / 'goc' / 'bang-2.png').convert('RGBA')))
    H, W = a.shape[:2]; m = a[..., 3] >= 128
    lab, n = nd.label(m); sz = nd.sum(m, lab, range(1, n + 1)); cells = {}
    for i in range(1, n + 1):
        if sz[i - 1] < 30: continue
        ys, xs = np.nonzero(lab == i); c = int(xs.mean() // (W / COLS)) + COLS * int(ys.mean() // (H / ROWS))
        cells.setdefault(c + 1, []).append(i)
    p = D / 'ds.json'; ds = json.load(open(p, encoding='utf-8'))
    for o, n2 in CHON.items():
        keep = np.isin(lab, cells[o]); ys, xs = np.nonzero(keep); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        r = a[y0:y1, x0:x1].copy(); r[..., 3] = np.where(keep[y0:y1, x0:x1], 255, 0)
        Image.fromarray(r, 'RGBA').save(D / 'goc' / f'{n2:02d}.png')
        g = luoi(r[..., :3].astype(float) * (r[..., 3:4] / 255))
        e = quantize(doc(r, g, 0.4), COLORS)
        Image.fromarray(e, 'RGBA').save(D / 'tinh' / f'{n2:02d}.png'); ax, fit = axis(e); lo, rad = hole(e, ax)
        phong = round(K * (g[0] + g[2]) / 2, 3)
        ds['pt'][f'{n2:02d}'] = {'w': int(e.shape[1]), 'h': int(e.shape[0]), 'truc': ax, 'khop': fit, 'lo': lo, 'lo_r': rad, 'bang': 2, 'o': o,
                                 'luoi': [round(g[0], 3), round(g[2], 3)], 'phong': phong}
        print(n2, r.shape[1], 'x', r.shape[0], '→', e.shape[1], 'x', e.shape[0], 'lưới %.3f × %.3f' % (g[0], g[2]), 'phóng', phong, 'lỗ', lo, rad)
    json.dump(ds, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('nét bút', nb)


if __name__ == '__main__':
    main()
