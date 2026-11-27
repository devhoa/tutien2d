"""Sáu tinh cầu farm mới (chủ dự án 26/11/2026 00:17: "mở rộng tinh cầu và thêm 1 số tinh cầu mới… đừng có giống cái đợt vừa làm vừa rồi, ghép
mấy loại đấy vào nhau, nhìn chả ra sao. Ước lượng xem bao nhiêu khách thì mở thêm bấy nhiêu tinh cầu"; bảng chọn 00:3x: "giống loại băng diễm mộc
như 9 tinh cầu kia đều đc, sắp xếp khác và đổi tên là thành tinh cầu mới rồi, k cần phải mua thêm", "Cứ lấy của thiên kiếm tinh cũng k sao").
Luật của đợt này: MỖI tinh cầu MỘT loại (không trộn nhiều loại như Bách Luyện Tinh): nền, nước, cây, đá, quái đều của đúng một tinh cầu gốc;
mỗi tinh cầu một KIỂU bố cục riêng (hào quanh pháp trận, sông chia hai bờ, hồ lớn hình lưỡi liềm, bốn phương, vòng ao, xoáy theo chiều kim đồng hồ).
Số tinh cầu theo số người (7 ngày tới 26/11: Luyện Khí 76%, Trúc Cơ 20%, Kim Đan trở lên 4%): ba cho Luyện Khí, hai cho Trúc Cơ, một cho Kim Đan.
Không tốn credit: mọi hình đều đã có. Quái: đúng loài của tinh cầu gốc, bãi gần pháp trận ×1, xa dần ×2, ×4 (như vành ngoài 24/11).
Chạy: python3 tools/the-gioi/tinh_cau_moi.py   (ghi data/maps/tc-*.json; thêm --nhap thì ghi tools/the-gioi/nhap/ để xem trước)
Ngẫu nhiên có hạt cố định: chạy lại ra y hệt. Sửa bố cục thì sửa máy sinh rồi chạy lại, không sửa tay bản đồ."""
import json
import math
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ban_do import Canh, astar, solid_tile   # noqa: E402
from bach_luyen import do_vung   # noqa: E402
from tc_nen import TKHOA, chon   # noqa: E402
from tk_moi_canh import vnoise   # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
NHAP = Path(__file__).parent / 'nhap'
TK = lambda *ds: [(f'tk.{t}-sc', w, a, b) for t, w, a, b in ds]
# Loại: tinh cầu gốc (lấy bộ nền, màu trời, màu đất), ô nền, ô nước, ô đường mòn, ô lát quanh pháp trận, ô nền phụ (đi được, rải thành mảng),
# ô vật chắn rải thành cụm (ký tự → số cụm mỗi 1000 ô đất), quái (loài chính, loài phụ)
LOAI = {
    'diem': dict(goc='dao-xich-dien', nen='a', nuoc='L', duong=',', lat='2', quai=('hoa-lang', 'viem-linh')),
    'bang': dict(goc='dao-han-bang', nen='w', nuoc='O', duong=',', lat='2', phu='i', quai=('tuyet-lang', 'bang-tinh')),
    'phong': dict(goc='hac-phong-dao', nen='d', nuoc='=', duong=',', vat={'V': 2.4, 'U': 1.6}, quai=('phong-yeu', 'hac-diep')),
    'moc': dict(goc='dao-moc', nen='m', nuoc='=', phu='n', vat={'Z': 3.2}, quai=('moc-yeu', 'doc-dang')),
    'thao': dict(goc='bach-luyen', nen='.', nuoc='=', duong=',', lat='2', quai=('moc-linh', 'ma-tieu'),
                 do=(TK(('cay-anh-dao', 2, .8, .95), ('cay-ngan-hanh', 2, .8, .95), ('cay-phong', 2, .8, .95), ('cay-thong', 2, .8, 1), ('lieu', 1, .8, .9), ('truc', 1, .8, .95)),
                     TK(('da-reu-lon', 2, .7, .9), ('da-lon', 2, .7, .9), ('da-vua', 2, .8, 1), ('da-cum', 1, .8, 1), ('da-dung', 1, .7, .9), ('pha-le-luc', 1, .6, .8)),
                     TKHOA + TK(('bui-xanh-nho', 2, .8, 1), ('bui-duong-xi', 2, .8, 1), ('nam-nau', 1, .9, 1.1), ('linh-thao', 1, .9, 1.1), ('soi-reu', 1, .9, 1.1)))),
}
# id, tên, loại, đường kính, hạt, kiểu bố cục, dải người chơi (ghi chú), tên bãi ngoài trên biển chỉ lối
TINH = [
    dict(id='tc-luc-da', ten='Lục Dã Tinh', loai='thao', d=104, hat=2611, kieu='xoan', dai='Luyện Khí tầng 1–5', quy_dao=1.5, goc=40, realm=0, hinh='thien-kiem-phong',
         mau='#7cc46a', ta='Đồng cỏ hoa nở quanh năm, quái hiền nhất tinh vực. Người mới rời Thiên Kiếm Tinh thường ghé đây trước.', en='Verdant Wilds Star', zh='綠野星'),
    dict(id='tc-viem-duong', ten='Viêm Dương Tinh', loai='diem', d=104, hat=2612, kieu='hao', dai='Luyện Khí', quy_dao=2, goc=120, realm=0, hinh='dao-xich-dien',
         mau='#d8703a', ta='Một hào dung nham ôm lấy pháp trận. Qua bốn dải đất là bãi săn của hỏa lang.', en='Blazing Sun Star', zh='炎陽星'),
    dict(id='tc-chu-tuoc', ten='Chu Tước Tinh', loai='diem', d=108, hat=2613, kieu='doi-bo', dai='Luyện Khí', quy_dao=2.5, goc=300, realm=0, hinh='dao-xich-dien',
         mau='#c8502a', ta='Sông dung nham chia tinh cầu làm hai bờ. Bờ đông quái dữ hơn, qua ba khúc cạn mới tới.', en='Vermilion Bird Star', zh='朱雀星'),
    dict(id='tc-suong-nguyet', ten='Sương Nguyệt Tinh', loai='bang', d=108, hat=2614, kieu='luoi-liem', dai='Trúc Cơ', quy_dao=3, goc=330, realm=1, mo=9, hinh='dao-han-bang',
         mau='#bfe0f2', ta='Hồ băng lớn nằm giữa, đất còn lại cong như vầng trăng. Càng vòng ra sau hồ quái càng mạnh.', en='Frost Moon Star', zh='霜月星'),
    dict(id='tc-huyen-phong', ten='Huyền Phong Tinh', loai='phong', d=96, hat=2615, kieu='tu-phuong', dai='Trúc Cơ tầng 5 trở lên', quy_dao=4, goc=60, realm=2, mo=13, hinh='hac-phong-dao',
         mau='#6a6088', ta='Hai khe nước đen cắt tinh cầu làm bốn phương. Từ đông bắc theo chiều kim đồng hồ, gió càng dữ.', en='Dark Wind Star', zh='玄風星'),
    dict(id='tc-thuy-lam', ten='Thúy Lâm Tinh', loai='moc', d=100, hat=2616, kieu='vong', dai='Kim Đan', quy_dao=5, goc=200, realm=3, mo=18, hinh='dao-moc',
         mau='#3f8a4a', ta='Rừng biếc không lối mòn, năm ao nước nằm giữa ba vòng bãi săn.', en='Jade Forest Star', zh='翠林星'),
]
SO_BAI = 22   # mỗi tinh cầu (tinh cầu cũ 15–17 bãi)


def bo_cuc(kieu, D, rnd):
    """Kiểu bố cục → (tâm pháp trận, danh sách hình nước [(cx, cy, rx, ry)…], hàm độ nguy hiểm của một ô: càng lớn quái càng mạnh)."""
    C, R = D / 2, D / 2 - 0.41
    at = lambda r, deg: (C + math.cos(math.radians(deg)) * r, C + math.sin(math.radians(deg)) * r)
    xa = lambda x, y: math.hypot(x - C, y - C) / R
    nuoc = []
    if kieu == 'hao':   # hào nước vành khăn quanh quảng trường pháp trận, bốn dải đất bắc qua; ra khỏi hào là quái mạnh dần theo vòng
        for deg in range(0, 360, 3):
            if min(abs((deg - b + 180) % 360 - 180) for b in (45, 135, 225, 315)) > 9:
                nuoc.append((*at(0.335 * R + math.sin(deg / 28) * 0.8, deg), 2.3, 2.3))
        return (int(C), int(C)), nuoc, xa
    if kieu == 'doi-bo':   # sông uốn từ bắc xuống nam chia hai bờ, ba khúc cạn; pháp trận ở bờ tây, bờ đông quái mạnh
        for y in range(int(C - R + 2), int(C + R - 1)):
            if min(abs(y - C - k * R) for k in (-0.46, 0.02, 0.5)) > 2.7:
                nuoc.append((C + 2 + math.sin(y / 14) * 4.2, y + 0.5, 3.1, 1.6))
        return (int(C - 0.5 * R), int(C)), nuoc, lambda x, y: (x - (C - R)) / (2 * R) + 0.12 * xa(x, y)
    if kieu == 'luoi-liem':   # hồ lớn lệch bắc, đất còn hình lưỡi liềm ôm hồ; pháp trận ở mũi nam, vòng ra sau hồ là quái mạnh
        hx, hy = C + 0.03 * D, C - 0.09 * D
        nuoc += [(hx, hy, 0.20 * D, 0.155 * D), (hx - 0.11 * D, hy + 0.06 * D, 0.10 * D, 0.08 * D), (hx + 0.12 * D, hy - 0.04 * D, 0.09 * D, 0.10 * D)]
        tr = (int(C), int(C + 0.60 * R))
        return tr, nuoc, lambda x, y: math.hypot(x - tr[0], y - tr[1]) / (2 * R)
    if kieu == 'tu-phuong':   # hai khe nước chữ thập chia bốn phương, mỗi nhánh một chỗ qua; quanh pháp trận yếu, ra xa mạnh dần, mạnh nhất ở góc tây bắc
        for k, deg in enumerate((0, 90, 180, 270)):
            for r10 in range(int(0.24 * R * 10), int((R - 1) * 10), 8):
                r = r10 / 10
                if abs(r - (0.60 + 0.07 * (k % 2)) * R) > 3.3:
                    nuoc.append((*at(r, deg + math.sin(r / 6.5 + k) * 5), 1.9, 1.9))
        return (int(C), int(C)), nuoc, lambda x, y: 0.62 * xa(x, y) + 0.38 * ((math.degrees(math.atan2(y - C, x - C)) + 90) % 360) / 360   # gần pháp trận phương nào cũng yếu; ra xa, phương tây bắc mạnh nhất
    if kieu == 'vong':   # ba vòng bãi quanh pháp trận, năm ao giữa các vòng
        for k in range(5):
            cx, cy = at((0.40 if k % 2 else 0.66) * R, 20 + k * 72)
            nuoc += [(cx, cy, 3.4, 2.6), (cx + 1.8, cy + 0.9, 2.2, 1.7)]
        return (int(C), int(C)), nuoc, xa
    # 'xoan': quanh pháp trận yếu; ra xa mạnh dần và xoáy theo chiều kim đồng hồ từ phía bắc (mạnh nhất ở rìa tây bắc); bốn ao rải giữa các cung
    for k, (r, deg) in enumerate(((0.36, 40), (0.62, 130), (0.42, 215), (0.66, 310))):
        cx, cy = at(r * R, deg)
        nuoc += [(cx, cy, 3.6, 2.7), (cx - 1.9, cy + 1.0, 2.3, 1.8)]
    return (int(C), int(C)), nuoc, lambda x, y: 0.62 * xa(x, y) + 0.38 * ((math.degrees(math.atan2(y - C, x - C)) + 90) % 360) / 360


def dung(t):
    L, D = LOAI[t['loai']], t['d']
    C, R = D / 2, D / 2 - 0.41
    S = Canh(D, R=R, seed=t['hat'])
    G, rnd = S.G, S.R
    nz, nz2 = vnoise(t['hat']), vnoise(t['hat'] + 7)
    nen, nuoc_ch, duong, lat = L['nen'], L['nuoc'], L.get('duong'), L.get('lat')
    dat = nen + L.get('phu', '')   # các ô nền đi được, đặt đồ được
    S.passable = lambda x, y: (x, y) in S.open or (not solid_tile(G.get(x, y)) and G.get(x, y) != '~' and (x, y) not in S.solid and S.walk_r(x, y))
    tran, hinh_nuoc, nguy = bo_cuc(t['kieu'], D, rnd)
    # 1. nền của loại; mảng nền phụ (băng trên tuyết, đất rừng) uốn theo nhiễu
    for y in range(D):
        for x in range(D):
            if G.get(x, y) != '~':
                G.g[y][x] = L['phu'] if L.get('phu') and nz(x, y, 9) > 0.66 else nen
    # 2. nước (bờ cong theo nhiễu), chừa quảng trường pháp trận
    for cx, cy, rx, ry in hinh_nuoc:
        for y in range(int(cy - ry - 2), int(cy + ry + 3)):
            for x in range(int(cx - rx - 2), int(cx + rx + 3)):
                k = 1 + (nz2(x, y, 4) - 0.5) * 0.35
                if ((x + 0.5 - cx) / (rx * k)) ** 2 + ((y + 0.5 - cy) / (ry * k)) ** 2 <= 1 and math.hypot(x + 0.5 - C, y + 0.5 - C) < R - 2.6 \
                        and math.hypot(x + 0.5 - tran[0], y + 0.5 - tran[1]) > 9.5:
                    G.set(x, y, nuoc_ch)
    # 3. quảng trường pháp trận: lát (loại có bộ gạch) hoặc để nền trống
    if lat:
        G.disc(tran[0] + 0.5, tran[1] + 0.5, 6.6, lat, keep='~' + nuoc_ch, ry=5.8)
    S.keep.append((tran[0] + 0.5, tran[1] + 0.5, 7.5))
    # 4. bãi quái: lưới tổ ong xê dịch, bỏ chỗ sát nước, sát mép, sát pháp trận; bớt dần cặp gần nhau nhất tới khi còn SO_BAI
    ung = []
    s = 11.5
    for j in range(-6, 7):
        for i in range(-6, 7):
            x, y = C + (i + 0.5 * (j % 2)) * s + rnd.uniform(-2, 2), C + j * s * 0.87 + rnd.uniform(-2, 2)
            x, y = int(x), int(y)
            if math.hypot(x + 0.5 - C, y + 0.5 - C) > R - 9 or math.hypot(x - tran[0], y - tran[1]) < 13:
                continue
            if any(G.get(x + a, y + b) == nuoc_ch for a in range(-5, 6) for b in range(-5, 6) if a * a + b * b <= 27):
                continue
            ung.append((x, y))
    while len(ung) > SO_BAI:
        gan = min(((math.hypot(a[0] - b[0], a[1] - b[1]), i) for i, a in enumerate(ung) for b in ung if b is not a))[1]
        ung.pop(gan)
    assert len(ung) >= SO_BAI - 4, f'{t["id"]}: chỉ đặt được {len(ung)} bãi'
    ung.sort(key=lambda p: nguy(*p))
    n1, n2 = round(len(ung) * 0.3), round(len(ung) * 0.65)
    bai = []
    for k, (x, y) in enumerate(ung):
        mul = 1 if k < n1 else 2 if k < n2 else 4
        mob = L['quai'][1] if (mul == 2 and k % 3 == 0) or (mul == 4 and k % 4 == 1) else L['quai'][0]
        bai.append((x, y, mob, mul))
        S.clear.append((x + 0.5, y + 0.5, 5.5))
        S.keep.append((x + 0.5, y + 0.5, 3))
    # 5. vật chắn của loại (trụ đá, khe gió, cây rừng) thành cụm 2–6 ô, tránh pháp trận, bãi quái
    tu_do = lambda x, y, r: all(math.hypot(x + 0.5 - kx, y + 0.5 - ky) > kr + r for kx, ky, kr in S.keep + S.clear)
    o_dat = [(x, y) for y in range(D) for x in range(D) if G.get(x, y) in dat and S.walk_r(x, y)]
    for ch, mat_do in (L.get('vat') or {}).items():
        for _ in range(int(len(o_dat) / 1000 * mat_do)):
            gx, gy = rnd.choice(o_dat)
            for _ in range(rnd.randint(2, 6)):
                x, y = gx + rnd.randint(-1, 1), gy + rnd.randint(-1, 1)
                if G.get(x, y) in dat and tu_do(x, y, 1.5) and math.hypot(x + 0.5 - C, y + 0.5 - C) < R - 3:
                    G.g[y][x] = ch
    # 6. đường mòn: pháp trận → bãi gần nhất đã nối (cây đường mọc dần ra ngoài); loại không có đường mòn thì chỉ soát lối đi
    da_noi = [tran]
    for x, y, _, _ in bai:
        goc = min(da_noi, key=lambda p: math.hypot(p[0] - x, p[1] - y))
        if duong:
            S.trail(goc, (x, y), wide=goc == tran)
        else:
            assert astar(D, goc, (x, y), lambda a, b: 1 if S.passable(a, b) else None), f'{t["id"]}: bãi {x, y} không có lối'
        da_noi.append((x, y))
    # 7. bến câu: lối nhỏ từ đường gần nhất ra bờ nước gần pháp trận nhất
    bo = [(x, y) for y in range(D) for x in range(D) if G.get(x, y) in dat + ',' and S.walk_r(x, y)
          and any(G.get(x + a, y + b) == nuoc_ch for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    ben = min(bo, key=lambda p: math.hypot(p[0] - tran[0], p[1] - tran[1]))
    if duong:
        S.trail(min(da_noi, key=lambda p: math.hypot(p[0] - ben[0], p[1] - ben[1])), ben)
    S.keep.append((ben[0] + 0.5, ben[1] + 0.5, 1.2))
    S.must = False
    # 8. đồ của loại: cây, đá thành cụm có khoảng trống; đồ nhỏ rải thưa; cụm đồ cao nhất ở ba hướng xa (mốc nhìn từ xa)
    cay, da, nho = L.get('do') or do_vung(L['goc'])
    o = [(x, y) for x, y in o_dat if G.get(x, y) in dat and math.hypot(x - tran[0], y - tran[1]) > 9]
    for _ in range(len(o) // 40):
        gx, gy = rnd.choice(o)
        for _ in range(rnd.randint(3, 6)):
            it = chon(rnd, cay if rnd.random() < 0.6 else da)
            S.put(it[0], round(gx + rnd.uniform(-3, 3) + 0.5, 1), round(gy + rnd.uniform(-3, 3) + 0.85, 1), s=round(rnd.uniform(it[2], it[3]), 2), f=rnd.random() < 0.5, on=dat)
    for x, y in o:
        if rnd.random() < 0.03:
            it = chon(rnd, nho)
            S.put(it[0], round(x + rnd.uniform(0.2, 0.8), 1), round(y + rnd.uniform(0.6, 0.95), 1), s=round(rnd.uniform(it[2], it[3]), 2), f=rnd.random() < 0.5, on=dat)
    if lat:   # đèn đá quanh quảng trường, biển chỉ lối ra bãi mạnh nhất
        for k in range(8):
            a = math.radians(22.5 + k * 45)
            S.put('tk.den-da-sc', round(tran[0] + 0.5 + math.cos(a) * 7.3, 1), round(tran[1] + 1.1 + math.sin(a) * 6.4, 1), on=dat + lat + ',')
    manh = max(bai, key=lambda b: nguy(b[0], b[1]))
    a = math.atan2(manh[1] - tran[1], manh[0] - tran[0])
    for d in (8.4, 9.2, 10):
        if S.put('chung.bien-go', round(tran[0] + 0.5 + math.cos(a + 0.35) * d, 1), round(tran[1] + 0.9 + math.sin(a + 0.35) * d, 1), label='→ Quái mạnh', on=dat + ','):
            break
    # 9. soát: mọi bãi, bến câu đều tới được từ pháp trận sau khi đã đặt đồ
    for x, y, *_ in bai + [(*ben, 0, 0)]:
        assert S.passable(x, y) and astar(D, tran, (x, y), lambda a, b: 1 if S.passable(a, b) else None), f'{t["id"]}: {x, y} bị chặn'
    return S, tran, bai, ben


def main():
    nhap = '--nhap' in sys.argv
    for t in TINH:
        L = LOAI[t['loai']]
        g = json.loads((ROOT / 'data/maps' / f'{L["goc"]}.json').read_text(encoding='utf-8'))
        S, tran, bai, ben = dung(t)
        S.items.sort(key=lambda it: (it[2], it[1]))
        ky = {k: v for k, v in g['nen'].get('ky', {}).items() if k != 'them' or t['loai'] == 'bang'}
        m = {'id': t['id'], 'name': t['ten'],
             '_note': f'Dựng bằng tools/the-gioi/tinh_cau_moi.py (KHÔNG sửa tay: sửa máy sinh rồi chạy lại). Một loại duy nhất: bộ hình của {g["name"]}; '
                      f'bố cục kiểu {t["kieu"]}; cho {t["dai"]}. Bãi gần pháp trận ×1, xa dần ×2, ×4. planet.luat: câu cá chỉ ở nước thật.',
             'sky': g['sky'], 'dark': g['dark'], 'ground': g['ground'], 'island': g['island'], 'world': True,
             'planet': {'d': t['d'], 'origin': [0, 0], 'luat': 1, 'terrain': 1, 'settle': 1, 'open': 1, 'grown': 1, 'goc': L['goc']},
             'nen': {**{k: v for k, v in g['nen'].items() if k != 'ky'}, 'ky': ky}, 'prop_hide': g.get('prop_hide', '^'),
             'grid': S.G.rows(), 'spawns': {'vao': list(tran)}, 'phap_tran': {'at': list(tran)},
             'portals': [],   # không đặt cổng bay: đi và về bằng pháp trận truyền tống giữa quảng trường hoặc Tinh đồ (cổng nằm trên lối ra bãi thì người đang đi, đang Tự đánh giẫm phải là bị đưa về)
             'npcs': [], 'spawners': [{'mob': mob, 'at': [x, y], 'farm': True, **({'mul': mul} if mul != 1 else {})} for x, y, mob, mul in bai],
             'rooms': [], 'hoi': {'do': S.items}, 'moc': {'phap-tran': list(tran), 'ben-cau': list(ben)}}
        out = (NHAP if nhap else ROOT / 'data/maps') / f'{t["id"]}.json'
        out.parent.mkdir(exist_ok=True)
        out.write_text(json.dumps(m, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(out.name, t['ten'], '| ô:', dict(Counter(''.join(m['grid'])).most_common(7)), '| đồ:', len(S.items), '| bãi:', len(bai),
              dict(Counter(b[3] for b in bai)), dict(Counter(b[2] for b in bai)))


def chen(tep, moc, them, co):
    """Chèn đoạn chữ `them` ngay sau `moc` trong tệp data (giữ nguyên định dạng tệp); đã có `co` thì thôi."""
    p = ROOT / 'data' / tep
    s = p.read_text(encoding='utf-8')
    if co in s:
        return
    assert s.count(moc) == 1, f'{tep}: mốc {moc!r} xuất hiện {s.count(moc)} lần'
    p.write_text(s.replace(moc, moc + them), encoding='utf-8')


def dang_ky():
    """Ghi sáu tinh cầu vào các tệp data khác (chạy lại không ghi trùng): danh sách bản đồ, quái chung, cảnh giới mở, thời tiết, nhạc, thú hoang,
    Tinh đồ, bản dịch tên. Hệ mặt trời thứ hai (he: 2), ai đủ cảnh giới cũng tới được (mo: 1), hình Tinh đồ dùng lại hình tinh cầu gốc lật ngang."""
    ids = [t['id'] for t in TINH]
    chen('config.json', '  "bach-luyen",\n', ''.join(f'  "{i}",\n' for i in ids), f'  "{ids[0]}",')
    chen('config.json', '"vet-nut-ngoai", "bach-luyen"]', '', '"bach-luyen", "tc-')
    p = ROOT / 'data/config.json'
    s = p.read_text(encoding='utf-8')
    if '"bach-luyen", "tc-' not in s:
        p.write_text(s.replace('"vet-nut-ngoai", "bach-luyen"]', '"vet-nut-ngoai", "bach-luyen", ' + ', '.join(f'"{i}"' for i in ids) + ']'), encoding='utf-8')
    chen('realms.json', '"phuong-thien-dia": 36', ''.join(f', "{t["id"]}": {t["mo"]}' for t in TINH if t.get('mo')), '"tc-suong-nguyet": 9')
    w = json.loads((ROOT / 'data/weather.json').read_text(encoding='utf-8'))
    for t in TINH:
        g = LOAI[t['loai']]['goc']
        w['maps'].setdefault(t['id'], w['maps'][g])
        if g in w['motes']['colors']:
            w['motes']['colors'].setdefault(t['id'], w['motes']['colors'][g])
    (ROOT / 'data/weather.json').write_text(json.dumps(w, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    am = json.loads((ROOT / 'data/sounds.json').read_text(encoding='utf-8'))['music']['maps']
    khoi = ''
    for t in TINH:
        g = LOAI[t['loai']]['goc']
        than = json.dumps(am['thien-kiem-phong' if t['loai'] == 'thao' else g], ensure_ascii=False, indent=1).replace('\n', '\n   ')
        khoi += f'   "{t["id"]}": {than},\n'
    chen('sounds.json', '    "mood": "sang"\n   },\n', khoi, f'"{ids[0]}"') if False else None
    p = ROOT / 'data/sounds.json'
    s = p.read_text(encoding='utf-8')
    if f'"{ids[0]}"' not in s:
        moc = '   "bach-luyen": {'
        assert s.count(moc) == 1
        p.write_text(s.replace(moc, khoi + moc), encoding='utf-8')
    tu = json.loads((ROOT / 'data/wildlife.json').read_text(encoding='utf-8'))['maps']
    dong = ''.join(f'  "{t["id"]}": {json.dumps(tu["thien-kiem-phong" if t["loai"] == "thao" else LOAI[t["loai"]]["goc"]])},\n' for t in TINH)
    p = ROOT / 'data/wildlife.json'
    s = p.read_text(encoding='utf-8')
    if f'"{ids[0]}"' not in s:
        moc = '  "bach-luyen": '
        assert s.count(moc) == 1
        p.write_text(s.replace(moc, dong + moc), encoding='utf-8')
    than = ''
    for t in TINH:
        than += (f'  {{"map": "{t["id"]}", "name": "{t["ten"]}", "kind": "planet", "orbit": {t["quy_dao"]}, "angle": {t["goc"]}, "size": 9, "color": "{t["mau"]}", '
                 f'"realm": {t["realm"]}, "he": 2, "mo": 1, "hinh": "{t["hinh"]}", "lat": 1,\n   "desc": "{t["ta"]}"}},\n')
    p = ROOT / 'data/starmap.json'
    s = p.read_text(encoding='utf-8')
    if f'"{ids[0]}"' not in s:
        moc = '  {"map": "dao-moc", "name": "Thanh Mộc Tinh"'
        assert s.count(moc) == 1
        p.write_text(s.replace(moc, than + moc), encoding='utf-8')
    for ng, khoa in (('en', 'en'), ('zh-Hant', 'zh')):
        p = ROOT / f'data/i18n/{ng}.json'
        d = json.loads(p.read_text(encoding='utf-8'))
        for t in TINH:
            d.setdefault(t['ten'], t[khoa])
            d.setdefault(t['ten'].removesuffix(' Tinh'), t[khoa].removesuffix(' Star').removesuffix('星'))
        d.setdefault('→ Quái mạnh', '→ Stronger monsters' if ng == 'en' else '→ 強怪')
        p.write_text(json.dumps(d, ensure_ascii=False, indent=0) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
    if '--nhap' not in sys.argv:
        dang_ky()
