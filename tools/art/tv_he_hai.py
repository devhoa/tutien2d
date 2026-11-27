"""Hình Tinh đồ của hệ mặt trời thứ hai (26/11/2026, không tốn credit; chủ dự án 00:3x: "sắp xếp khác và đổi tên là thành tinh cầu mới rồi, k cần
phải mua thêm"): mặt trời Huyền Nhật và sáu tinh cầu mới lấy hình tinh cầu cùng loại đang có rồi XOAY MÀU bảng màu (sắc độ, độ đậm, độ sáng), không đổi
điểm ảnh nào khác, cho hai tinh cầu cùng loại không trông y hệt nhau. Ghi assets/art/tv-<mã>.png và mục tv.<mã> trong data/art.json.
Chạy: python3 -I tools/art/tv_he_hai.py   (thêm --xem <tệp.png> để ghi một tấm xem trước, không đụng kho)"""
import colorsys, hashlib, json, os, sys
from PIL import Image

R = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from png_nho import luu  # noqa: E402

# mã mới: (hình gốc, xoay sắc độ (độ), nhân độ đậm, nhân độ sáng)
BIEN = {
    'sun2': ('sun', 185, 0.72, 1.04),                   # Huyền Nhật: mặt trời lam lạnh
    'tc-luc-da': ('thien-kiem-phong', -28, 0.95, 1.04),  # Lục Dã: đồng cỏ ngả vàng
    'tc-viem-duong': ('dao-xich-dien', 22, 1.0, 1.08),   # Viêm Dương: lửa vàng kim
    'tc-chu-tuoc': ('dao-xich-dien', -24, 1.05, 0.98),   # Chu Tước: lửa đỏ thẫm
    'tc-suong-nguyet': ('dao-han-bang', 38, 0.8, 1.04),  # Sương Nguyệt: băng tím bạc
    'tc-huyen-phong': ('hac-phong-dao', -52, 1.0, 1.06), # Huyền Phong: gió lục lam
    'tc-thuy-lam': ('dao-moc', 34, 1.05, 0.98),          # Thúy Lâm: rừng ngọc bích
}


def xoay(im, do, dam, sang):
    rgba = im.convert('RGBA'); px = rgba.load(); nho = {}
    for y in range(rgba.height):
        for x in range(rgba.width):
            c = px[x, y]
            if not c[3]: continue
            if c not in nho:
                h, s, v = colorsys.rgb_to_hsv(c[0] / 255, c[1] / 255, c[2] / 255)
                r, g, b = colorsys.hsv_to_rgb((h + do / 360) % 1, min(1, s * dam), min(1, v * sang))
                nho[c] = (round(r * 255), round(g * 255), round(b * 255), c[3])
            px[x, y] = nho[c]
    return rgba


def main():
    ap = os.path.join(R, 'data/art.json'); A = json.load(open(ap, encoding='utf-8'))
    xem = sys.argv[sys.argv.index('--xem') + 1] if '--xem' in sys.argv else None
    tam = []
    for ma, (goc, do, dam, sang) in BIEN.items():
        s = A['sprites']['tv.' + goc]; im = xoay(Image.open(os.path.join(R, s['file'])), do, dam, sang)
        if xem:
            tam.append((Image.open(os.path.join(R, s['file'])).convert('RGBA').crop((0, 0, s['w'], s['h'])), im.crop((0, 0, s['w'], s['h'])), ma)); continue
        name = f'tv-{ma}.png'; luu(im, os.path.join(R, 'assets/art', name))
        v = hashlib.sha1(open(os.path.join(R, 'assets/art', name), 'rb').read()).hexdigest()[:8]
        A['sprites']['tv.' + ma] = {'file': f'assets/art/{name}', 'v': v, 'w': s['w'], 'h': s['h'], 'frames': s['frames'], 'anchor': s['anchor'],
                                    'note': f'hệ mặt trời thứ hai 26/11/2026: hình tv.{goc} xoay màu (tools/art/tv_he_hai.py), 8 khung/giây'}
        print('tv.' + ma, v)
    if xem:
        W = sum(max(a.width, b.width) for a, b, _ in tam); out = Image.new('RGBA', (W, 2 * max(a.height for a, _, _ in tam)), (12, 10, 30, 255)); x = 0
        for a, b, _ in tam: out.alpha_composite(a, (x, 0)); out.alpha_composite(b, (x, out.height // 2)); x += max(a.width, b.width)
        out.save(xem); print('xem trước:', xem, [m for _, _, m in tam]); return
    open(ap, 'w', encoding='utf-8').write(json.dumps(A, ensure_ascii=False, indent=1) + '\n')


if __name__ == '__main__':
    main()
