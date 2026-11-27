"""Trang phục bảng thứ hai (chủ dự án 21/11/2026 10:17: bảng ảnh GPT 4×4 16 nhân vật chibi nền trắng, khoanh ba người #3 #6 #16,
"làm thêm 3 bộ này"; "làm ảnh tĩnh trước"). Đánh số nối tiếp bộ 16 trang phục đầu: 17, 18, 19.
Khác bảng đầu: ảnh JPEG nền trắng có nét bút khoanh (net_but.py xoá), nhân vật chỉ vẽ tới hông (không có chân).
1. Xoá nét bút, bỏ nền trắng (ai_import.remove_bg), bỏ quầng trắng JPEG quanh mép, chia ô theo lưới 4×4.
2. Đọc theo đúng lưới điểm giả của tranh (luoi_diem.py, ô ~6,1 điểm tranh): mỗi ô tranh ra đúng một điểm game, nét như tranh
   (21/11 bản đầu thu theo hệ số 0,145 lệch lưới, chủ dự án chê "vỡ hình và mờ"). Cỡ ra gần bằng bộ đầu (cao 48–50).
3. Gom màu (48 màu) nhưng giữ nguyên điểm nhấn lệch hẳn màu gom (mắt, ấn trán, hoa); tranh đã có viền mực nên không thêm viền.
Ra: tinh/NN.png (ảnh tới hông, làm nguồn cho SpriteCook vẽ đủ người), nguon-sc/NN-hd.png (ô tranh gốc cỡ lớn đã bỏ nền),
xem/NN-goc.png, ds.json (ghi thêm, không ghi đè).
Chạy: python3 -I tools/art/trang_phuc_2.py"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ai_import import remove_bg, quantize
from quai_tinh import drop_specks
from net_but import net_but
from thu_cuoi_moi import vien_jpeg, le_canh
from luoi_diem import luoi, doc

D = Path(__file__).resolve().parent / 'nguon' / 'ai' / 'trang-phuc-moi'
COLORS = 48
NHAN = 60      # điểm lệch màu gom quá mức này (tổng ba kênh) giữ màu thật: mắt, ấn trán
CHON = {3: (17, 'Nguyệt hoa tiên tử'), 6: (18, 'Lang thủ bạch phát'), 16: (19, 'Lộc giác tiên cơ')}   # ô bảng → (số bộ, tên tả tạm)


def gom(e):
    q = quantize(e, COLORS)
    lech = np.abs(q[..., :3].astype(int) - e[..., :3].astype(int)).sum(2) > NHAN
    q[lech] = e[lech]
    return q


def main():
    a, nb = net_but(np.array(Image.open(D / 'goc-2.jpg').convert('RGB')))
    H, W = a.shape[:2]
    cw, ch = W / 4, H / 4
    ds = json.load(open(D / 'ds.json', encoding='utf-8'))
    ds['ds'] = [d for d in ds['ds'] if d['n'] not in [v[0] for v in CHON.values()]]
    for o, (n, ten) in CHON.items():
        r, c = (o - 1) // 4, (o - 1) % 4
        x0, y0, x1, y1 = int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch)
        g = luoi(a[y0:y1, x0:x1])
        cell = np.dstack([a[y0:y1, x0:x1], np.full((y1 - y0, x1 - x0), 255)]).astype(np.uint8)
        cell[0, 0, :3] = 252
        cl = drop_specks(le_canh(vien_jpeg(remove_bg(cell, 40))), 0.002)
        out = gom(doc(cl, g, 0.4))
        Image.fromarray(out, 'RGBA').save(D / 'tinh' / f'{n:02d}.png')
        ys, xs = np.nonzero(cl[..., 3] > 0); cl = cl[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        Image.fromarray(cl, 'RGBA').save(D / 'nguon-sc' / f'{n:02d}-hd.png')   # ô tranh gốc cỡ lớn: nguồn để SpriteCook vẽ đủ người, ảnh ngồi
        gi = Image.fromarray(cl, 'RGBA'); s = 180 / gi.height
        gi.resize((round(gi.width * s), 180), Image.LANCZOS).save(D / 'xem' / f'{n:02d}-goc.png')
        ds['ds'].append({'n': n, 'ten': ten, 'w': int(out.shape[1]), 'h': int(out.shape[0]), 'bang': 2, 'o': o, 'toi_hong': True,
                         'luoi': [round(g[0], 3), round(g[2], 3)]})
        print(n, ten, out.shape[1], 'x', out.shape[0], 'lưới %.3f × %.3f' % (g[0], g[2]))
    ds.pop('k2', None)
    json.dump(ds, open(D / 'ds.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('nét bút', nb)


if __name__ == '__main__':
    main()
