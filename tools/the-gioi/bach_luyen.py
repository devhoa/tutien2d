"""Bách Luyện Tinh: tinh cầu farm mới ở vòng giữa tinh hệ (chủ dự án 24/11/2026 00:29 "thêm khu cho mọi ng farm", bảng chọn "1 và 2 có thể
mở rộng tinh hệ để thêm 1 vòng ở giữ cho tinh cầu mới"). Ai cũng vào được (cổng bay ở pháp trận Thiên Kiếm Tinh không cần cờ), nhiều bãi quái theo
sức mạnh: bảy vùng đất của bảy tinh cầu farm xếp vòng quanh pháp trận, đi theo chiều kim đồng hồ từ phía bắc là quái mạnh dần (Xích Diễm →
Hàn Băng → Hắc Phong → Thanh Mộc → Thiên Kim → Hậu Thổ → Ngoại Vực); mỗi vùng một bãi gần (×1) và một bãi xa (×2), quái đúng loài của tinh cầu đó.
Nền cỏ Thiên Kiếm Tinh; mỗi vùng lót nền đá chân núi của tinh cầu mình (bộ 15 mảnh nen.tc-*-nui làm lớp phủ "them" của draw-nen.js, ô đi được),
ranh giới uốn theo nhiễu, giữa hai vùng là dải cỏ có hoa; cây, đá, trụ của vùng là đồ SpriteCook của tinh cầu đó, mọc thành cụm có khoảng trống
(chân đồ tự chắn); đường mòn từ quảng trường pháp trận ra từng vùng, biển chỉ lối ghi tên vùng; vài hồ nước ven đường để câu cá (planet.luat:
câu ở nước thật). Không tốn credit: mọi hình đều đã có.
Chạy: python3 tools/the-gioi/bach_luyen.py   (ghi data/maps/bach-luyen.json; thêm --nhap thì chỉ ghi tools/the-gioi/nhap/bach-luyen.json để xem trước)
Ngẫu nhiên có hạt cố định: chạy lại ra y hệt. Sửa bố cục thì sửa máy sinh rồi chạy lại, không sửa tay bản đồ."""
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ban_do import ART, Canh, kind_of   # noqa: E402
from tc_nen import CFG as TC, NHO, chon   # noqa: E402
from tk_moi_canh import vnoise   # noqa: E402
from vanh_ngoai import CAY_HB, CAY_XD, DA_HB, DA_XD   # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
MAP = ROOT / 'data/maps/bach-luyen.json'
NHAP = Path(__file__).parent / 'nhap' / 'bach-luyen.json'
D = 96
C = D / 2
TRAN = (48, 48)   # tâm pháp trận = tâm quảng trường = điểm vào
NEN = {'nuoc': 'nen.tk-nuoc', 'dat': 'nen.tk-dat', 'san': 'nen.tk-san', 'gach': 'nen.tk-gach', 'nui': 'nen.tk-nui', 'mep': 'nen.tk-mep',
       'vach': 'nen.tk-vach', 'hoa': 'nen.tk-hoa'}
# Bảy vùng theo chiều kim đồng hồ từ phía bắc: (tinh cầu, ký tự ô nền vùng, bộ nền đá, quái bãi gần ×1, quái bãi xa ×2, tên vùng)
VUNG = [('dao-xich-dien', 'a', 'nen.tc-xd-nui', 'hoa-lang', 'viem-linh', 'Xích Diễm'),
        ('dao-han-bang', 'w', 'nen.tc-hb-nui', 'tuyet-lang', 'bang-tinh', 'Hàn Băng'),
        ('hac-phong-dao', 'd', 'nen.tc-hp-nui', 'phong-yeu', 'hac-diep', 'Hắc Phong'),
        ('dao-moc', 'm', 'nen.tc-tm-nui', 'moc-yeu', 'doc-dang', 'Thanh Mộc'),
        ('dao-thien-kim', 's', 'nen.tc-tkim-nui', 'kim-giap-trung', 'kiem-hon', 'Thiên Kim'),
        ('dao-hau-tho', 't', 'nen.tc-ht-nui', 'tho-khoi', 'thach-doi', 'Hậu Thổ'),
        ('vet-nut-ngoai', 'p', 'nen.tc-nv-nui', 'hu-khong-ma', 'hu-anh', 'Ngoại Vực')]
GOC0, BUOC = 270, 360 / len(VUNG)   # vùng đầu ở phía bắc (độ, 0 = đông, 90 = nam)
R_TRONG, R_NGOAI = 19.5, 35          # bán kính bãi gần, bãi xa
HO = [(0.5, 27), (3.5, 26), (5.5, 27.5)]   # hồ câu ở dải cỏ giữa hai vùng (chỉ số ranh giới, bán kính)
MOC = {'dao-moc': [('tk.co-thu-lon-sc', 1, 0.7, 0.8)], 'dao-thien-kim': [('tc.cay-ho-duong-sc', 1, 0.8, 0.9)]}   # cảnh lớn riêng của vùng


def do_vung(mid):
    """Đồ của một vùng: (cây, đá / trụ, đồ nhỏ) lấy từ bộ SpriteCook của tinh cầu đó (tools/the-gioi/tc_nen.py)."""
    if mid == 'dao-xich-dien':
        return CAY_XD, DA_XD, NHO('xd')
    if mid == 'dao-han-bang':
        return CAY_HB, DA_HB, NHO('hb')
    c = TC[mid]
    tat = [it for k, v in c['cay'].items() if k != '^' for it in v] + c.get('thua', [])
    cay = [it for it in tat if kind_of(it[0]) == 'cay']
    da = [it for it in tat if kind_of(it[0]) in ('tru', 'tuong')]
    nho = [it for it in c['rai'][0] if kind_of(it[0]) == 'nho']
    return cay or da, da or cay, nho


def goc(x, y):
    return math.degrees(math.atan2(y + 0.5 - C, x + 0.5 - C)) % 360


def vung_cua(x, y, nz):
    """Vùng của ô (chỉ số) và khoảng cách góc (độ) tới ranh giới gần nhất; ranh giới uốn theo nhiễu."""
    a = (goc(x, y) - GOC0 + BUOC / 2 + (nz(x, y, 9) - 0.5) * 22 + (nz(x + 500, y, 4) - 0.5) * 9) % 360
    i = int(a // BUOC)
    return i, min(a - i * BUOC, (i + 1) * BUOC - a)


def dung():
    S = Canh(D, R=D / 2 - 0.41, seed=2411)
    G = S.G
    nz, nz2 = vnoise(24), vnoise(11)
    # 1. nền: quảng trường lát quanh pháp trận, dải cỏ quanh quảng trường, bảy vùng nền đá, dải cỏ giữa hai vùng, vài bãi cỏ trong vùng
    for y in range(D):
        for x in range(D):
            if G.get(x, y) == '~':
                continue
            r = math.hypot(x + 0.5 - C, y + 0.5 - C)
            if ((x + 0.5 - C) / 7.2) ** 2 + ((y + 0.5 - C) / 6.4) ** 2 <= 1:
                G.g[y][x] = '2'
                continue
            i, bien = vung_cua(x, y, nz)
            if r < 11 + nz(x, y, 6) * 3 or bien * math.pi / 180 * r < 1 + nz2(x, y, 5) * 1.5 or nz2(x + 300, y, 7) > 0.8:
                continue   # cỏ
            G.g[y][x] = VUNG[i][1]
    for _ in range(2):   # mượt ranh giới: ô lẻ khác hẳn xung quanh theo số đông (bớt răng cưa của lớp phủ)
        g0 = [r[:] for r in G.g]
        for y in range(1, D - 1):
            for x in range(1, D - 1):
                if g0[y][x] not in '.' + ''.join(v[1] for v in VUNG):
                    continue
                quanh = [g0[y + b][x + a] for a in (-1, 0, 1) for b in (-1, 0, 1) if a or b]
                tot = max(set(quanh), key=quanh.count)
                if tot != g0[y][x] and quanh.count(tot) >= 5 and tot in '.' + ''.join(v[1] for v in VUNG):
                    G.g[y][x] = tot
    # 2. mốc: pháp trận, bãi quái (chừa trống cho Tự đánh)
    S.keep.append((TRAN[0] + 0.5, TRAN[1] + 0.5, 7.5))
    bai = []
    for i, v in enumerate(VUNG):
        for r, lech, mob, mul in ((R_TRONG, -7, v[3], 1), (R_NGOAI, 7, v[4], 2)):
            a = math.radians(GOC0 + i * BUOC + lech)
            x, y = int(C + math.cos(a) * r), int(C + math.sin(a) * r)
            bai.append((i, x, y, mob, mul))
            S.clear.append((x + 0.5, y + 0.5, 5.5))
            S.keep.append((x + 0.5, y + 0.5, 3))
    # 3. hồ câu ở dải cỏ giữa hai vùng, bờ cong
    ben = []
    for k, rr in HO:
        a = math.radians(GOC0 + (k + 0.5) * BUOC)
        cx, cy = C + math.cos(a) * rr, C + math.sin(a) * rr
        el = [(cx, cy, 2.8, 2.1), (cx + 1.6, cy + 0.7, 1.9, 1.5), (cx - 1.3, cy - 0.6, 1.7, 1.3)]
        for y in range(int(cy - 5), int(cy + 6)):
            for x in range(int(cx - 6), int(cx + 7)):
                if any(((x + 0.5 - ex) / rx) ** 2 + ((y + 0.5 - ey) / ry) ** 2 <= 1 for ex, ey, rx, ry in el):
                    G.g[y][x] = '='
        ben.append((cx, cy))
    # 4. đường mòn: quảng trường → bãi gần → bãi xa của mỗi vùng (lối vòng qua hồ, đồ), rộng hai ô
    ra = []
    for i in range(len(VUNG)):
        a = math.radians(GOC0 + i * BUOC)
        dau = (int(C + math.cos(a) * 7.5), int(C + math.sin(a) * 6.8))
        _, x1, y1, _, _ = bai[2 * i]
        _, x2, y2, _, _ = bai[2 * i + 1]
        S.trail(dau, (x1, y1), wide=True)
        S.trail((x1, y1), (x2, y2), wide=True)
        ra.append((a, dau))
    for cx, cy in ben:   # bến câu: lối nhỏ từ đường gần nhất ra bờ hồ
        bo = min(((x, y) for y in range(int(cy) - 5, int(cy) + 6) for x in range(int(cx) - 6, int(cx) + 7)
                  if G.get(x, y) not in '=~' and any(G.get(x + dx, y + dy) == '=' for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))),
                 key=lambda p: min((abs(p[0] - x) + abs(p[1] - y) for y in range(D) for x in range(D) if G.get(x, y) == ','), default=99))
        duong = min(((x, y) for y in range(D) for x in range(D) if G.get(x, y) == ','), key=lambda p: math.hypot(p[0] - bo[0], p[1] - bo[1]))
        S.trail(duong, bo)
        S.keep.append((bo[0] + 0.5, bo[1] + 0.5, 1.2))
    S.must = False
    # 5. quảng trường: đèn đá quanh vành, biển chỉ lối ở đầu mỗi đường ra vùng
    for k in range(10):
        a = math.radians(GOC0 + BUOC / 2 + k * 36)
        S.put('tk.den-da-sc', round(C + math.cos(a) * 7.9, 1), round(C + math.sin(a) * 7.0 + 0.6, 1), on='.,2' + ''.join(v[1] for v in VUNG))
    for (a, (x, y)), v in zip(ra, VUNG):
        for d in (1.8, 2.6, 3.4):
            bx, by = x + 0.5 + math.cos(a + 0.9) * d, y + 0.5 + math.sin(a + 0.9) * d
            if S.put('chung.bien-go', round(bx, 1), round(by + 0.4, 1), label=f'→ {v[5]}', on='.,2' + ''.join(w[1] for w in VUNG)):
                break
    # 6. cây, đá của từng vùng mọc thành cụm có khoảng trống; đồ nhỏ rải thưa; cây ưa nước bên hồ
    rnd = S.R
    for i, v in enumerate(VUNG):
        cay, da, nho = do_vung(v[0])
        o = [(x, y) for y in range(D) for x in range(D) if G.get(x, y) == v[1] and 13 < math.hypot(x + 0.5 - C, y + 0.5 - C) < D / 2 - 4]
        for _ in range(len(o) // 42):
            gx, gy = rnd.choice(o)
            for _ in range(rnd.randint(3, 6)):
                it = chon(rnd, cay if rnd.random() < 0.62 else da)
                x, y = gx + rnd.uniform(-3, 3) + 0.5, gy + rnd.uniform(-3, 3) + 0.85
                S.put(it[0], round(x, 1), round(y, 1), s=round(rnd.uniform(it[2], it[3]), 2), f=rnd.random() < 0.5, on=v[1] + '.')
        for x, y in o:
            if rnd.random() < 0.03:
                it = chon(rnd, nho)
                S.put(it[0], round(x + rnd.uniform(0.2, 0.8), 1), round(y + rnd.uniform(0.6, 0.95), 1), s=round(rnd.uniform(it[2], it[3]), 2), f=rnd.random() < 0.5,
                      on=v[1] + '.')
    for i, v in enumerate(VUNG):   # cuối mỗi đường mòn, sau bãi xa: cụm đồ cao nhất của vùng (nhìn thấy từ xa, luật định hướng)
        cay, da, _ = do_vung(v[0])
        cao = sorted({it[0]: it for it in cay + da + MOC.get(v[0], [])}.values(), key=lambda it: -ART[it[0]]['h'] * ART[it[0]].get('scale', 1) * it[3])[:3]
        a = math.radians(GOC0 + i * BUOC + 13)
        mx, my = C + math.cos(a) * 41, C + math.sin(a) * 41
        for k, it in enumerate(cao * 2):
            g = rnd.random() * 2 * math.pi
            S.put(it[0], round(mx + math.cos(g) * (0.3 + k * 0.9), 1), round(my + math.sin(g) * (0.3 + k * 0.7) + 0.8, 1), s=it[3], f=rnd.random() < 0.5, on=v[1] + '.')
    for cx, cy in ben:
        for _ in range(4):
            a = rnd.random() * 2 * math.pi
            S.put(rnd.choice(['tk.lieu-sc', 'tk.truc-sc', 'tk.bui-co-cao-sc']), round(cx + math.cos(a) * 4.6, 1), round(cy + math.sin(a) * 3.8 + 0.8, 1))
    # 7. dữ liệu bản đồ
    spawns = {'vao': list(TRAN), 'tu-thien-kiem': [TRAN[0], TRAN[1] + 3]}
    portals = [{'at': [TRAN[0], TRAN[1] - 5], 'to': 'thien-kiem-phong', 'spawn': 'tu-bach-luyen', 'label': 'Truyền tống về Thiên Kiếm Tinh', 'fly': True}]
    spawners = [{'mob': mob, 'at': [x, y], 'farm': True, **({'mul': mul} if mul != 1 else {})} for _, x, y, mob, mul in bai]
    for _, x, y, _, _ in bai:
        assert S.passable(x, y), f'bãi quái {x, y} nằm trong vật cản'
    moc = {'phap-tran': list(TRAN), 'ben-cau': [round(ben[0][0]), round(ben[0][1])]}
    return S, spawns, portals, spawners, moc


def main():
    nhap = '--nhap' in sys.argv
    S, spawns, portals, spawners, moc = dung()
    S.items.sort(key=lambda it: (it[2], it[1]))
    m = {'id': 'bach-luyen', 'name': 'Bách Luyện Tinh',
         '_note': 'Dựng bằng tools/the-gioi/bach_luyen.py (KHÔNG sửa tay: sửa máy sinh rồi chạy lại). Bảy vùng đất của bảy tinh cầu farm quanh pháp trận, '
                  'mỗi vùng một bãi gần ×1 và một bãi xa ×2, quái mạnh dần theo chiều kim đồng hồ từ phía bắc. nen.ky.them: ô nền mỗi vùng lót bộ nền đá '
                  'chân núi của tinh cầu đó (src/world/draw-nen.js). planet.luat: câu cá chỉ ở nước thật (ba hồ ven đường).',
         'sky': '#b8d8f8', 'dark': 0.04, 'ground': '#7cc46a', 'island': {'top': '#9cd08a', 'under': '#8a7a6a', 'trees': '#2f7a44'}, 'world': True,
         'planet': {'d': D, 'origin': [0, 0], 'luat': 1, 'terrain': 1, 'settle': 1, 'open': 1, 'grown': 1},
         'nen': {**NEN, 'ky': {'nen': '.', 'them': [[v[2], v[1]] for v in VUNG]}}, 'prop_hide': '^',
         'grid': S.G.rows(), 'spawns': spawns, 'phap_tran': {'at': list(TRAN)}, 'portals': portals, 'npcs': [], 'spawners': spawners, 'rooms': [],
         'hoi': {'do': S.items}, 'moc': moc}
    out = NHAP if nhap else MAP
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(m, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    from collections import Counter
    print(out.name, '| ô:', dict(Counter(''.join(m['grid']))), '| đồ:', len(S.items), 'loại:', len({i[0] for i in S.items}), '| bãi:', len(spawners))


if __name__ == '__main__':
    main()
