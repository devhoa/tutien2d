"""Trang phục #17–19 vẽ đủ người (chủ dự án 23/11/2026 23:0x chọn "Vẽ thêm chân bằng SpriteCook"): bảng ảnh thứ hai chỉ vẽ tới hông,
SpriteCook (Nano Banana 2.1, edit = ô tranh gốc nguon-sc/NN-hd.png, mẫu dáng = ô tranh gốc bộ #02 ở style_asset_ids) vẽ lại cả người
đứng, ra du/NN-sc.png. File này đưa ảnh đó về cỡ điểm game CÙNG CỠ MẶT với tranh gốc thu theo hệ số K của bộ đầu (ds.json → k):
  hệ số = K × (cỡ mặt trên ô tranh gốc / cỡ mặt trên ảnh SpriteCook); mặt đo bằng face() của trang_phuc_ngoi.py (không chỉnh bằng mắt).
Rồi như ảnh đứng bộ đầu: giữ điểm đục, bỏ chấm rời, gom 24 màu, giữ mắt, viền mực.
Từ bộ #18 (chủ dự án 23/11/2026: "làm lại thân ngắn và độ nét tương đương bộ 10"): SpriteCook vẽ thân chibi ngắn theo dáng bộ #10
(style = 10-hd), và thu NGUYÊN LẦN f = round(1 / hệ số) bằng thu_net.py (hệ số lẻ làm lấm tấm); hệ số thật ghi ds.json → du = 1 / f.
Ra: tinh/NN.png (ảnh đứng đủ người, thay ảnh tới hông; ảnh tới hông chép sang xem/NN-hong.png), nguon-sc/NN-dem.png (đệm trong suốt
trái 6, phải 18 như bộ đầu, nguồn cho chuyển động), ds.json → ds[n] {w, h, du: k}. Chạy: python3 -I tools/art/trang_phuc_du.py 17 [18 19]"""
import json, shutil, sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ai_import import shrink, quantize, outline
from quai_tinh import drop_specks, auto_masks, paint_small
from trang_phuc_ngoi import face
from thu_net import net

D = Path(__file__).resolve().parent / 'nguon' / 'ai' / 'trang-phuc-moi'
COLORS = 24
DEM = (6, 18)   # đệm trái, phải như nguon-sc/01-dem.png
NET = 18        # từ bộ này thu nguyên lần bằng thu_net.py (bộ #17 làm lại cũng sẽ đổi sang)


def one(n, K):
    k = f'{n:02d}'
    hd = np.array(Image.open(D / 'nguon-sc' / f'{k}-hd.png').convert('RGBA'))
    c = np.array(Image.open(D / 'du' / f'{k}-sc.png').convert('RGBA')); c[..., 3] = np.where(c[..., 3] >= 200, 255, 0)
    c = drop_specks(c, 0.002); ys, xs = np.nonzero(c[..., 3] > 0); c = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    fw, fh = face(hd); sw, sh = face(c); ks = K * (fw / sw + fh / sh) / 2
    if n >= NET:
        f = max(1, round(1 / ks)); ks = 1 / f; out = net(c, f)
    else:
        th = round(c.shape[0] * ks); q = quantize(shrink(c, th), COLORS)
        for em in auto_masks(c): paint_small(q, c, em, th)
        out = outline(q); oy, ox = np.nonzero(out[..., 3]); out = out[oy.min():oy.max() + 1, ox.min():ox.max() + 1]
    hong = D / 'xem' / f'{k}-hong.png'
    if not hong.exists(): shutil.copy(D / 'tinh' / f'{k}.png', hong)
    Image.fromarray(out, 'RGBA').save(D / 'tinh' / f'{k}.png')
    h, w = out.shape[:2]; dem = np.zeros((h, w + sum(DEM), 4), np.uint8); dem[:, DEM[0]:DEM[0] + w] = out
    Image.fromarray(dem, 'RGBA').save(D / 'nguon-sc' / f'{k}-dem.png')
    return {'w': int(w), 'h': int(h), 'du': round(ks, 4), 'mat': [int(sw), int(sh)]}


def main(ns):
    p = D / 'ds.json'; ds = json.load(open(p, encoding='utf-8'))
    for n in ns:
        r = one(n, ds['k']); e = next(x for x in ds['ds'] if x['n'] == n)
        e.update(w=r['w'], h=r['h'], du=r['du']); e.pop('toi_hong', None); print(n, r)
    json.dump(ds, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main([int(x) for x in sys.argv[1:]] or [17, 18, 19])
