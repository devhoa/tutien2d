"""Tinh Vực hai hệ mặt trời (chủ dự án 26/11/2026 00:17: "rộng quá thì cái tinh vực này xây thành 2 trong đó thiên kiếm tinh ở giữ, 2 bên là 2 hệ
mặt trời bản đồ nếu bị tràn thì cứ để nó thế, vuốt kéo để xem thêm toàn cảnh"). Sửa data/starmap.json → tv.ngang một lần (đã có `rong` thì thôi).
Kết giới thành hình viên thuốc: hai nửa elip như cũ (756 × 475) cách nhau 2L, nối bằng hai đoạn thẳng. Nửa trái là Tinh đồ cũ GIỮ NGUYÊN chỗ từng tinh
cầu so với Linh Nhật (chỉ Thiên Kiếm Tinh và Mảnh Vỡ Thanh Khê dời ra giữa); nửa phải là hệ mới quanh Huyền Nhật với sáu tinh cầu của
tools/the-gioi/tinh_cau_moi.py, cùng cỡ quỹ đạo. Thế giới rộng 3612 (trước 1920), màn chỉ thấy một phần, vuốt kéo ngang để xem.
Chạy: python3 tools/the-gioi/tinh_vuc_hai_he.py   (chạy sau tinh_cau_moi.py)"""
import json
import math
from pathlib import Path

P = Path(__file__).resolve().parents[2] / 'data/starmap.json'
RX, RY, LE, L = 756, 475, 110, 940          # nửa elip kết giới, lề thế giới hai đầu, nửa đoạn thẳng
RONG = 2 * (L + RX + LE)                     # 3612
XL, XG, XR = LE + RX, LE + RX + L, LE + RX + 2 * L   # tâm nửa trái, giữa (Thiên Kiếm Tinh), tâm nửa phải
DA = XL - 960                                # hệ cũ dời theo tâm nửa trái
SUN_B = (XR + 130, 465)                      # Huyền Nhật đối xứng Linh Nhật qua giữa
# tinh cầu hệ mới: vòng (như quỹ đạo chấm quanh mặt trời), góc (độ, 0 = đông, 90 = nam), đường kính
MOI = {'tc-luc-da': (6, 183, 66), 'tc-viem-duong': (3.2, 135, 64), 'tc-chu-tuoc': (3.6, 240, 64), 'tc-suong-nguyet': (4, 318, 66), 'tc-huyen-phong': (4.4, 28, 68), 'tc-thuy-lam': (4.6, 84, 68)}
TEN = {'sun2': 'Huyền Nhật', 'tc-luc-da': 'Lục Dã', 'tc-viem-duong': 'Viêm Dương', 'tc-chu-tuoc': 'Chu Tước', 'tc-suong-nguyet': 'Sương Nguyệt', 'tc-huyen-phong': 'Huyền Phong', 'tc-thuy-lam': 'Thúy Lâm'}
SUN2 = (' "sun2": {"name": "Huyền Nhật", "kind": "sun", "size": 9, "color": "#cfe0ff", "glow": "#7ab0ff", "he": 2, "lat": 1, '
        '"desc": "Mặt trời thứ hai của tinh vực, sáng lạnh hơn Linh Nhật. Sáu tinh cầu mới mở quay quanh nó."},\n')


def e(x, y):   # khoảng cách tới viền kết giới (1 = đúng viền)
    return math.hypot(max(0, abs(x - XG) - L) / RX, (y - 540) / RY)


DICH = {'Huyền Nhật': ('Mystic Sun', '玄日'),
        'Mặt trời thứ hai của tinh vực, sáng lạnh hơn Linh Nhật. Sáu tinh cầu mới mở quay quanh nó.':
        ('The second sun of the star region, colder and paler than the Spirit Sun. The six newly opened planets circle it.', '星域的第二顆太陽，比靈日更冷更淡。新開的六顆星球繞著它轉。')}


def dich_ten():   # tên và lời tả Huyền Nhật sang tiếng Anh, tiếng Trung (thiếu mới thêm)
    for i, ng in enumerate(('en', 'zh-Hant')):
        p = P.parent / f'i18n/{ng}.json'
        d = json.loads(p.read_text(encoding='utf-8'))
        if all(k in d for k in DICH):
            continue
        for k, v in DICH.items():
            d.setdefault(k, v[i])
        p.write_text(json.dumps(d, ensure_ascii=False, indent=0) + '\n', encoding='utf-8')


def main():
    dich_ten()
    s = P.read_text(encoding='utf-8')
    d = json.loads(s)
    N = d['tv']['ngang']
    if N.get('rong'):
        print('đã là hai hệ, bỏ qua')
        return
    tu = lambda v: json.dumps(v, ensure_ascii=False)
    tk = N['pos']['thien-kiem-phong']; kh = N['pos']['thanh-khe']
    pos = {}
    for k, (x, y, dk) in N['pos'].items():
        if k == 'thien-kiem-phong':
            pos[k] = [XG, 556, 92]
        elif k == 'thanh-khe':
            pos[k] = [XG + kh[0] - tk[0], 556 + kh[1] - tk[1], dk]
        else:
            pos[k] = [x + DA, y, dk]
    pos['sun2'] = [SUN_B[0], SUN_B[1], 140]
    for k, (vong, goc, dk) in MOI.items():
        r = 95 + vong * 92
        pos[k] = [round(SUN_B[0] + math.cos(math.radians(goc)) * r), round(SUN_B[1] + math.sin(math.radians(goc)) * r * 0.6), dk]
    ks = list(pos)
    for k in ks:
        assert e(pos[k][0], pos[k][1]) < 0.93, (k, pos[k], e(pos[k][0], pos[k][1]))
    gan = min((math.hypot(pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]) - (pos[a][2] + pos[b][2]) / 2, a, b) for i, a in enumerate(ks) for b in ks[i + 1:])
    assert gan[0] > 40, gan
    dich = RONG - 1920
    may = [[i, x + dich if x > 960 else x, y, k, lat] for i, x, y, k, lat in N['may']]
    tinh_the = [[x + dich, y, ph] for x, y, ph in N['tinh_the']]
    may_doc = [[i, x + o, y + (dy if n % 2 else -dy), k, (lat + c) % 2] for c, (o, dy) in enumerate(((0, 0), (dich // 2, 40), (dich, 20)))
               for n, (i, x, y, k, lat) in enumerate(N['may_doc'])]
    vong = {**N['vong'], 'cx': XG, 'L': L}
    ten = {**N['ten'], **TEN}
    for khoa, moi in (('pos', pos), ('may', may), ('tinh_the', tinh_the), ('may_doc', may_doc), ('vong', vong), ('ten', ten)):
        cu = f'"{khoa}": {tu(N[khoa])}'
        assert s.count(cu) == 1, f'{khoa}: không khớp định dạng ({s.count(cu)} lần)'
        s = s.replace(cu, f'"{khoa}": {tu(moi)}')
    moc = '"pos": '
    i = s.index(moc, s.index('"ngang": {'))
    s = s[:i] + f'"rong": {RONG}, "he": {tu({"k": 1, "sun": ["sun", "sun2"]})}, "tru": 12, ' + s[i:]
    moc = ' "makhi": {'
    assert s.count(moc) == 1
    s = s.replace(moc, SUN2 + moc)
    json.loads(s)
    P.write_text(s, encoding='utf-8')
    print(f'đã ghi hai hệ: rộng {RONG}, giữa {XG}, cặp gần nhất hở {gan[0]:.0f} ({gan[1]}, {gan[2]})')
    print({k: v for k, v in pos.items() if k in ('sun', 'sun2', 'thien-kiem-phong', 'thanh-khe', 'ma-vuong', 'vet-nut-ngoai') or k.startswith('tc-')})


if __name__ == '__main__':
    main()
