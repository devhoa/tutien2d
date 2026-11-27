"""Hình Tinh đồ của Bách Luyện Tinh (24/11/2026, không tốn credit): ghép bảy lát quạt cắt từ hình bảy tinh cầu farm đang có (tv.<mã>, khung
k của mỗi hình cho khung k), theo đúng thứ tự bảy vùng trên bản đồ (tools/the-gioi/bach_luyen.py VUNG: từ phía bắc theo chiều kim đồng hồ), viền
lát tối một điểm ảnh, 16 khung. Ghi assets/art/tv-bach-luyen.png và mục tv.bach-luyen trong data/art.json.
Chạy: python3 -I tools/art/tv_bach_luyen.py"""
import hashlib, json, math, os, sys
import numpy as np
from PIL import Image

R = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from png_nho import luu  # noqa: E402

VUNG = ['dao-xich-dien', 'dao-han-bang', 'hac-phong-dao', 'dao-moc', 'dao-thien-kim', 'dao-hau-tho', 'vet-nut-ngoai']
N, S = 16, 160


def main():
    ap = os.path.join(R, 'data/art.json'); A = json.load(open(ap, encoding='utf-8'))
    src = []
    for mid in VUNG:
        s = A['sprites']['tv.' + mid]; im = Image.open(os.path.join(R, s['file'])).convert('RGBA')
        fr = [im.crop((k * s['w'], 0, (k + 1) * s['w'], s['h'])) for k in range(s['frames'])]
        src.append([np.array(f.crop(f.getbbox()).resize((S, S), Image.NEAREST)) for f in fr])
    yy, xx = np.mgrid[0:S, 0:S] - (S - 1) / 2
    goc = (np.degrees(np.arctan2(yy, xx)) - 270 + 360) % 360           # 0 = bắc, tăng theo chiều kim đồng hồ
    lat = np.floor(goc / (360 / 7)).astype(int)
    vien = np.zeros((S, S), bool)
    for dy, dx in ((0, 1), (1, 0)):
        vien |= lat != np.roll(np.roll(lat, dy, 0), dx, 1)
    tron = np.hypot(yy, xx) <= S / 2 - 1
    frames = []
    for k in range(N):
        out = np.zeros((S, S, 4), np.uint8)
        for i in range(7):
            f = src[i][k % len(src[i])]; m = (lat == i) & tron
            out[m] = f[m]; out[m, 3] = np.maximum(f[m, 3], 255 * (np.hypot(yy, xx)[m] < S / 2 - 6))
        v = vien & tron & (np.hypot(yy, xx) > 6)
        out[v, :3] = (out[v, :3] * 0.45).astype(np.uint8)
        rr = np.hypot(yy + S * 0.18, xx + S * 0.18) / (S * 0.82)          # bóng cầu: sáng góc trên trái, tối dần ra mép dưới phải
        k = np.clip(1.12 - 0.5 * rr ** 2, 0.45, 1.15)[..., None]
        out[..., :3] = np.clip(out[..., :3] * k, 0, 255).astype(np.uint8)
        frames.append(Image.fromarray(out))
    sheet = Image.new('RGBA', (S * N, S))
    for k, f in enumerate(frames): sheet.alpha_composite(f, (k * S, 0))
    name = 'tv-bach-luyen.png'; luu(sheet, os.path.join(R, 'assets/art', name))
    v = hashlib.sha1(open(os.path.join(R, 'assets/art', name), 'rb').read()).hexdigest()[:8]
    A['sprites']['tv.bach-luyen'] = {'file': f'assets/art/{name}', 'v': v, 'w': S, 'h': S, 'frames': N, 'anchor': [S // 2, S // 2],
                                     'note': 'Bách Luyện Tinh 24/11/2026: bảy lát quạt từ hình bảy tinh cầu farm (tools/art/tv_bach_luyen.py), 8 khung/giây'}
    open(ap, 'w', encoding='utf-8').write(json.dumps(A, ensure_ascii=False, indent=1) + '\n')
    print('tv.bach-luyen', v)


if __name__ == '__main__':
    main()
