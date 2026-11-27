"""Hình ba món cơ duyên (25/11/2026, không tốn credit): đổi sắc từ hình đang có.
  ui.vk-chu-qua           ← ui.vk-hong-qua (quả ngả son vàng, thêm quầng sáng vàng sau lưng)
  ui.vk-that-diep-linh-chi ← ui.vk-hoa-linh-chi (cam → lục ngọc)
  ui.vk-toa-vong-dan      ← ui.vk-tu-van-dan (tím → lam ngọc)
Chạy: python3 -I tools/art/co_duyen_icon.py"""
import colorsys, hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageFilter

R = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from png_nho import luu  # noqa: E402

rgb2hsv = np.vectorize(colorsys.rgb_to_hsv); hsv2rgb = np.vectorize(colorsys.hsv_to_rgb)


def doi_sac(im, fn):
    a = np.array(im.convert('RGBA')).astype(float); h, s, v = rgb2hsv(a[..., 0] / 255, a[..., 1] / 255, a[..., 2] / 255)
    h, s, v = fn(h * 360, s, v); r, g, b = hsv2rgb((h % 360) / 360, np.clip(s, 0, 1), np.clip(v, 0, 1))
    a[..., 0], a[..., 1], a[..., 2] = r * 255, g * 255, b * 255
    return Image.fromarray(a.round().astype(np.uint8))


def quang(im, mau, r=10, k=0.85):   # quầng sáng sau lưng hình
    w, h = im.size; pad = r * 3; big = Image.new('RGBA', (w + pad * 2, h + pad * 2)); big.alpha_composite(im, (pad, pad))
    al = big.getchannel('A').filter(ImageFilter.GaussianBlur(r)).point(lambda x: min(255, int(x * k)))
    glow = Image.new('RGBA', big.size, mau + (0,)); glow.putalpha(al)
    glow.alpha_composite(big)
    return glow.crop(glow.getbbox())


def main():
    ap = os.path.join(R, 'data/art.json'); A = json.load(open(ap, encoding='utf-8')); S = A['sprites']
    src = lambda k: Image.open(os.path.join(R, S['ui.vk-' + k]['file'])).convert('RGBA')
    do = lambda h: (h < 40) | (h > 330)   # vùng đỏ
    mon = {
        'chu-qua': ('nguyên liệu cơ duyên Chu Quả (đổi sắc từ ui.vk-hong-qua)',
                    quang(doi_sac(src('hong-qua'), lambda h, s, v: (np.where(do(h), h + 14, h), np.where(do(h), s * 1.08, s), np.where(do(h), v * 1.12 + 0.03, v))), (255, 214, 96))),
        'that-diep-linh-chi': ('nguyên liệu cơ duyên Thất Diệp Linh Chi (đổi sắc từ ui.vk-hoa-linh-chi)',
                               doi_sac(src('hoa-linh-chi'), lambda h, s, v: (h + 140, s * 0.9, v * 1.02))),
        'toa-vong-dan': ('Tọa Vong Đan (đổi sắc từ ui.vk-tu-van-dan)',
                         doi_sac(src('tu-van-dan'), lambda h, s, v: (h - 82, s * 0.95, v * 1.04))),
    }
    for k, (note, im) in mon.items():
        name = f'ui-vk-{k}.png'; f = os.path.join(R, 'assets/art', name); luu(im, f)
        v = hashlib.sha1(open(f, 'rb').read()).hexdigest()[:8]
        S['ui.vk-' + k] = {'file': f'assets/art/{name}', 'v': v, 'w': im.width, 'h': im.height, 'frames': 1, 'anchor': [im.width // 2, im.height // 2], 'note': note + ', tools/art/co_duyen_icon.py'}
        print(k, im.size, v)
    open(ap, 'w', encoding='utf-8').write(json.dumps(A, ensure_ascii=False, indent=1) + '\n')


if __name__ == '__main__':
    main()
