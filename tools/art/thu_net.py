"""Thu ảnh SpriteCook (Nano Banana, kiểu pixel) về cỡ điểm game mà vẫn nét (chủ dự án 23/11/2026: "làm lại thân ngắn và độ nét
tương đương bộ 10"). Ảnh SpriteCook ra ~200 điểm, mỗi điểm game ~4 điểm ảnh nhưng KHÔNG có lưới thật (gần như điểm nào cũng khác màu
điểm bên cạnh, luoi_diem.py dò ra lưới yếu, đọc theo lưới mất viền). Thu theo hệ số lẻ (bộ #17: 0,2423) thì mỗi điểm game vắt qua
hai mảng màu, ra lấm tấm. Ở đây:
  1. Thu đúng số nguyên f (mỗi điểm game = ô f × f), dò độ lệch ô (0..f-1 mỗi trục) cho các ô ít lẫn màu nhất; mỗi ô lấy màu đa số.
  2. Bỏ điểm lẻ trước khi gom màu (4 điểm kề, 3 cùng một màu khác hẳn), gom COLORS màu, tô lại mắt / điểm nhấn (quai_tinh.paint_small).
  3. Bỏ điểm lẻ sau khi gom (8 điểm quanh không điểm nào cùng màu, 5/8 cùng một màu), không đụng điểm nhấn vừa tô; viền mực.
net(c, f) → ảnh cỡ game đã viền; f = round(1 / hệ số cỡ mặt) (bộ 18, 19: hệ số 0,25 → f 4)."""
import sys
from collections import Counter
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ai_import import quantize, outline
from quai_tinh import auto_masks, paint_small

COLORS = 20


def _mode(a, f, ox, oy):
    H, W = a.shape[:2]; pa = np.zeros((H + 2 * f, W + 2 * f, 4), np.uint8); pa[f:f + H, f:f + W] = a
    a = pa[f - oy:, f - ox:]; th, tw = a.shape[0] // f, a.shape[1] // f
    out = np.zeros((th, tw, 4), np.uint8); lan = 0.0
    for y in range(th):
        for x in range(tw):
            o = a[y * f:(y + 1) * f, x * f:(x + 1) * f].reshape(-1, 4); s = o[o[:, 3] >= 128]
            if len(s) * 2 < len(o): continue
            q = (s[:, :3] // 16) * 16; col = Counter(map(tuple, q)).most_common(1)[0][0]
            out[y, x] = (*s[(q == col).all(1)][:, :3].mean(0).astype(np.uint8), 255)
            lan += s[:, :3].astype(float).std(0).sum()
    return out, lan


def thu(a, f):
    """Thu nguyên lần f, độ lệch ô chọn theo ô ít lẫn màu nhất. Trả (ảnh, (ox, oy)): điểm (y, x) của a rơi vào ô ((y+oy)//f, (x+ox)//f)."""
    best = None
    for oy in range(f):
        for ox in range(f):
            o, lan = _mode(a, f, ox, oy)
            if best is None or lan < best[1]: best = (o, lan, (ox, oy))
    return best[0], best[2]


def le4(q):
    out = q.copy(); H, W = q.shape[:2]
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if not q[y, x, 3]: continue
            nb = [q[y - 1, x], q[y + 1, x], q[y, x - 1], q[y, x + 1]]
            if any(n[3] == 0 for n in nb): continue
            c = q[y, x, :3].astype(int)
            if any(np.abs(n[:3].astype(int) - c).sum() < 30 for n in nb): continue
            m, k = Counter(tuple(n[:3]) for n in nb).most_common(1)[0]
            if k >= 3: out[y, x, :3] = m
    return out


def le8(q, giu):
    out = q.copy(); H, W = q.shape[:2]
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if not q[y, x, 3] or giu[y, x]: continue
            nb = [tuple(q[y + dy, x + dx]) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx]
            if any(v[3] == 0 for v in nb) or tuple(q[y, x]) in nb: continue
            m, k = Counter(nb).most_common(1)[0]
            if k >= 5: out[y, x] = m
    return out


def net(c, f, colors=COLORS, doi=False):
    """c: ảnh SpriteCook đã giữ điểm đục (alpha 0/255) và cắt sát hình. Ra ảnh cỡ game đã viền mực, cắt sát.
    doi=True: trả thêm hàm đổi toạ độ ảnh c (x, y) → toạ độ ảnh ra (tâm khí cầu của ảnh ngồi)."""
    q0, (ox, oy) = thu(c, f); th, tw = q0.shape[:2]
    cs = np.zeros((th * f, tw * f, 4), np.uint8); h, w = min(c.shape[0], th * f - oy), min(c.shape[1], tw * f - ox)
    cs[oy:oy + h, ox:ox + w] = c[:h, :w]   # đặt ảnh gốc đúng lưới ô đã chọn để paint_small (k = f) tô đúng điểm
    q = quantize(le4(q0), colors); truoc = q.copy()
    for em in auto_masks(cs): paint_small(q, cs, em, th)
    q = le8(q, np.abs(q.astype(int) - truoc.astype(int)).sum(2) > 0)
    out = outline(q); yy, xx = np.nonzero(out[..., 3]); y0, x0 = yy.min(), xx.min(); out = out[y0:yy.max() + 1, x0:xx.max() + 1]
    if not doi: return out
    return out, lambda x, y: ((x + ox) / f + 1 - x0, (y + oy) / f + 1 - y0)   # outline() thêm 1 điểm viền mỗi phía
