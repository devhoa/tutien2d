"""Vành ngoài cho bảy tinh cầu farm (chủ dự án 24/11/2026 00:29 "mở rộng map và thêm khu cho mọi ng farm", bảng chọn: "1 và 2").
Mỗi tinh cầu rộng thêm khoảng 40%: đĩa cũ giữ nguyên ở giữa (không giãn, không đổi ô nào bên trong), quanh nó thêm một vành đất mới
cùng nền, cùng cây cỏ của tinh cầu đó, theo luật thế giới (docs/12-LUAT-THE-GIOI.md):
  sông cũ chảy tới mép đĩa cũ thì chảy tiếp ra mép mới (nước không đứt quãng); vài dãy núi, hồ (dung nham, hồ băng, khe hư không theo
  tinh cầu); cây, đá mọc thành cụm có khoảng trống (rừng không dày quá một màn); bãi quái treo máy mới ở giữa vành, quái mạnh gấp MUL
  (luật 7 → 14 → 28 của data/planets.json: vòng trong ×1, vòng ngoài ×2, vành mới ×4); đường mòn từ mỗi bãi mới nhập vào đường có sẵn
  (tinh cầu có đường), biển chỉ lối ở chỗ rẽ (tinh cầu có biển); mép mới để trống.
Mọi toạ độ trỏ vào bản đồ dịch theo (+o ô): bản đồ, data/story.json (bước truyện, dấu trên đất), data/do-cu.json, data/le-hoi.json,
đầu boss thế giới ở cloud/src/mang-cfg.js. Bản đồ ghi planet.vanh = {tu: đường kính cũ, them: o} (src/game/vi-tri.js dịch chỗ đứng đã nhớ).
Chạy MỘT LẦN (bản đồ đã có planet.vanh thì bỏ qua):  python3 tools/the-gioi/vanh_ngoai.py [mã bản đồ…]
Ngẫu nhiên có hạt cố định theo bản đồ: dựng lại từ cùng bản gốc thì ra y hệt."""
import heapq
import json
import math
import random
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ban_do import ART, TILES, box, foot, kind_of   # noqa: E402  (chân món chép đúng src/world/hoi-foot.js)
from tc_nen import CFG as TC, NHO, NUI, chon, ghi, mon   # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data'
MUL = 4   # quái vành mới mạnh gấp mấy lần
BIEN = 'chung.bien-go'
# Cây, đá chỉ đặt bằng đồ (Xích Diễm, Hàn Băng: lưới không có ô cây, đồ tự chắn theo chân)
CAY_XD = [('tc.cay-chay-sc', 2, 0.85, 1), ('tc.cay-chay-mai-sc', 2, 0.85, 1), ('tc.cay-chay-la-sc', 1, 0.85, 0.95)]
DA_XD = [('tc.da-nui-lua-sc', 2, 0.6, 0.8), ('tc.soi-nui-lua-sc', 1, 0.6, 0.75), ('tc.bui-tro-sc', 1, 0.5, 0.6)]
CAY_HB = [('tc.tung-tuyet-sc', 2, 0.85, 1), ('tc.tung-tuyet-vua-sc', 2, 0.9, 1.05), ('tc.tung-tuyet-non-sc', 1, 1, 1.15), ('tc.cay-bang-sc', 2, 0.9, 1)]
DA_HB = [('tc.da-tuyet-sc', 2, 0.7, 0.85), ('tc.bui-tuyet-sc', 1, 0.5, 0.6)]
# d: đường kính mới; bai: số bãi mới; duong: ký tự đường mòn (None: tinh cầu không có đường); mang: ô đường có sẵn để nhập vào;
# nuoc: ô nước của tinh cầu; ho: số hồ; khe: số khe nứt (Ngoại Vực); nui: số dãy núi; vat: ký tự rải thành cụm → phần trăm vành;
# mon: ký tự chỉ đặt bằng đồ (lưới giữ nền) → danh sách đồ; nui_do: đồ trên ô núi khi CFG tc_nen không có; bien: có biển chỉ lối
VANH = {
    'dao-xich-dien': dict(d=128, bai=4, duong=',', mang=',12', nuoc='L', ho=2, nui=2, vat={'C': 2.2, 'R': 1.2}, mon={'C': CAY_XD, 'R': DA_XD},
                          nui_do=NUI('xd'), bien=True),
    'dao-han-bang': dict(d=128, bai=4, duong=',', mang=',12', nuoc='O', ho=2, nui=2, vat={'C': 2.6, 'R': 1}, mon={'C': CAY_HB, 'R': DA_HB},
                         nui_do=NUI('hb'), bien=True),
    'hac-phong-dao': dict(d=70, bai=3, duong=',', mang=',', nuoc='=', ho=1, nui=2, vat={'V': 3, 'U': 2}),
    'dao-moc': dict(d=76, bai=3, duong=None, nuoc='=', ho=1, nui=2, vat={'Z': 4, 'n': 3}),
    'dao-thien-kim': dict(d=82, bai=3, duong=',', mang=',g', nuoc='=', ho=1, nui=2, vat={'b': 2.5, 'J': 1.5, 'h': 2, 'T': 0.6}),
    'dao-hau-tho': dict(d=84, bai=3, duong='o', mang='o', nuoc='=', ho=1, nui=2, vat={'I': 2.5, 'T': 0.8, 'y': 2}),
    'vet-nut-ngoai': dict(d=86, bai=3, duong=None, nuoc='f', ho=0, khe=4, nui=2, vat={'*': 3}),
}
SOLID = lambda ch: bool(TILES.get(ch, {}).get('solid'))


def doc(p):
    return json.loads(Path(p).read_text(encoding='utf-8'))


def dich(v, o):
    """Cộng o vào mọi cặp toạ độ [x, y] (số nguyên giữ nguyên kiểu, số thực làm tròn 2 chữ)."""
    if isinstance(v, list) and len(v) == 2 and all(isinstance(a, (int, float)) and not isinstance(a, bool) for a in v):
        return [a + o if isinstance(a, int) else round(a + o, 2) for a in v]
    if isinstance(v, list):
        return [dich(a, o) for a in v]
    return v


class Vanh:
    def __init__(self, m, C):
        self.m, self.C, self.tc = m, C, TC[m['id']]
        self.rng = random.Random(m['id'] + ':vanh')
        g0 = m['grid']
        self.D0, D = len(g0), C['d']
        assert (D - self.D0) % 2 == 0, 'chênh đường kính phải chẵn'
        self.o = o = (D - self.D0) // 2
        self.D, self.c = D, D / 2
        self.R0, self.R1 = self.D0 / 2 - 0.41, D / 2 - 0.41   # bán kính phần có ô đất (như tools/mo-rong-dao.py)
        self.base = self.tc['ky']['nen'][0]
        old = lambda x, y: g0[y - o][x - o] if 0 <= y - o < self.D0 and 0 <= x - o < len(g0[y - o]) else '~'
        self.G = [['~'] * D for _ in range(D)]
        self.ring = set()
        for y in range(D):
            for x in range(D):
                if self.r(x, y) <= self.R1:
                    ch = old(x, y)
                    self.G[y][x] = ch if ch != '~' else self.base
                    if ch == '~':
                        self.ring.add((x, y))
        self.keep = set()   # ô không đặt vật cản (quanh bãi, sông, đường, mép)
        self.moi = []       # đồ mới (hoi.do)
        self.o_do = {}      # ô → chỉ số đồ mới đứng trên / chắn ô đó (mở lối thì bỏ theo)
        self.cay = []       # chân cây (mật độ một màn)
        self.boxes = []     # khung hình đồ cao (không chồng hình quá nửa)
        self.solid = set()  # ô bị chân đồ chắn (đồ cũ và mới)
        for it in m.get('hoi', {}).get('do', []):
            if it[0] not in ART:
                continue
            x, y, s = it[1] + o, it[2] + o, ((it[4] or {}).get('s', 1) if len(it) > 4 else 1)
            self.solid |= foot(it[0], x, y, s)[0]
            if kind_of(it[0]) in ('cay', 'nha', 'tru', 'tuong', 'sap', 'cong'):
                self.boxes.append(box(it[0], x, y, s))
            if kind_of(it[0]) == 'cay':
                self.cay.append((x, y))

    # ---------- hình học ----------
    def r(self, x, y):
        return math.hypot(x + 0.5 - self.c, y + 0.5 - self.c)

    def ang(self, x, y):
        return math.degrees(math.atan2(y + 0.5 - self.c, x + 0.5 - self.c)) % 360

    def at(self, x, y):
        return self.G[y][x] if 0 <= x < self.D and 0 <= y < self.D else '~'

    def mep(self, x, y, k=2.2):   # dải mép mới để trống
        return self.r(x, y) > self.R1 - k

    def trong(self, x, y):   # ô vành còn trống: nền, không giữ chỗ, không sát mép
        return (x, y) in self.ring and self.at(x, y) == self.base and (x, y) not in self.keep and not self.mep(x, y)

    def giu(self, x, y, r):
        for yy in range(int(y - r - 1), int(y + r + 2)):
            for xx in range(int(x - r - 1), int(x + r + 2)):
                if math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= r:
                    self.keep.add((xx, yy))

    # ---------- dịch toạ độ của chính bản đồ ----------
    def dich_ban_do(self):
        m, o = self.m, self.o
        m['spawns'] = {k: dich(v, o) for k, v in m['spawns'].items()}
        if m.get('phap_tran'):
            m['phap_tran']['at'] = dich(m['phap_tran']['at'], o)
        for k in ('portals', 'npcs', 'spawners'):
            for e in m.get(k, []):
                e['at'] = dich(e['at'], o)
        if m.get('hamlets'):
            m['hamlets'] = dich(m['hamlets'], o)
        assert not m.get('rooms'), 'bản đồ có phòng: chưa biết dịch'
        for it in m.get('hoi', {}).get('do', []):
            it[1], it[2] = round(it[1] + o, 2), round(it[2] + o, 2)
        m['planet']['origin'] = dich(m['planet']['origin'], o)

    # ---------- sông cũ chảy tiếp ra mép mới ----------
    def song(self):
        w = self.C['nuoc']
        self.o_song = set()
        if w != '=':
            return []
        cells = {(x, y) for (x, y) in self.ring_near_old() if self.at(x, y) == w}
        out, seen = [], set()
        for s in sorted(cells):
            if s in seen:
                continue
            comp, st = set(), [s]
            while st:   # cả con sông: các khúc cách nhau chỗ lội (1–2 ô) tính là một, để không mọc hai dòng song song
                p = st.pop()
                if p in comp:
                    continue
                comp.add(p)
                st += [(p[0] + a, p[1] + b) for a in range(-2, 3) for b in range(-2, 3) if self.at(p[0] + a, p[1] + b) == w and (p[0] + a, p[1] + b) not in comp]
            seen |= comp
            xs, ys = [p[0] for p in comp], [p[1] for p in comp]
            if len(comp) > 14 and min(max(xs) - min(xs), max(ys) - min(ys)) > 3:
                continue   # hồ sát mép cũ: để nguyên
            x, y = max(comp, key=lambda p: self.r(*p))
            path = []
            for _ in range(200):
                vx, vy = x + 0.5 - self.c, y + 0.5 - self.c
                if self.rng.random() < 0.3:
                    vx, vy = (-vy, vx) if self.rng.random() < 0.5 else (vy, -vx)
                nx, ny = (x + (1 if vx > 0 else -1), y) if abs(vx) >= abs(vy) else (x, y + (1 if vy > 0 else -1))
                if self.r(nx, ny) > self.R1 - 1.6:
                    break
                if self.at(nx, ny) == w:
                    x, y = nx, ny
                    continue
                if self.at(nx, ny) != self.base:   # vướng đường, núi, đồ cũ: dừng (chưa ra vành thì bỏ cả nhánh)
                    break
                x, y = nx, ny
                path.append((x, y))
            if path and self.r(*path[-1]) > self.R1 - 3:
                for p in path:
                    self.G[p[1]][p[0]] = w
                    self.giu(p[0] + 0.5, p[1] + 0.5, 1.6)
                    self.o_song.add(p)
                out.append(path)
        return out

    def ring_near_old(self):
        o, R0 = self.o, self.R0
        c0 = self.D0 / 2
        return [(x, y) for y in range(self.D) for x in range(self.D)
                if (x, y) not in self.ring and math.hypot(x - o + 0.5 - c0, y - o + 0.5 - c0) > R0 - 3]

    # ---------- bãi quái mới ----------
    def bai(self):
        m, n = self.m, self.C['bai']
        loai = []
        for s in m['spawners']:
            if s.get('farm') and s['mob'] not in loai:
                loai.append(s['mob'])
        rz = self.R0 + (self.R1 - self.R0) * 0.45
        cu = [(s['at'][0] + 0.5, s['at'][1] + 0.5, 1) for s in m['spawners'] if s.get('farm')]
        cu += [(p[0] + 0.5, p[1] + 0.5, 1.4) for p in self.o_song]   # sông mới (đứng cách sông vài ô là được)
        cu += [(p['at'][0] + 0.5, p['at'][1] + 0.5, 1.2) for p in m['portals']]

        def diem(a0):   # bãi mới cách các bãi cũ, sông, cổng càng xa càng tốt (khoảng cách gần nhất, có trọng số)
            ps = [(self.c + math.cos(math.radians(a0 + i * 360 / n)) * rz, self.c + math.sin(math.radians(a0 + i * 360 / n)) * rz) for i in range(n)]
            return min(math.hypot(x - a, y - b) * k for x, y in ps for a, b, k in cu) if cu else 0
        best = max(range(0, 360 // n), key=diem)
        out = []
        for i in range(n):
            a = best + i * 360 / n
            cand = []
            for dr in (0, -1, 1, -2, 2, -3, 3):
                for dd in range(0, 15, 2):
                    for sg in (1, -1):
                        g = math.radians(a + sg * dd)
                        x, y = int(self.c + math.cos(g) * (rz + dr)), int(self.c + math.sin(g) * (rz + dr))
                        k = sum(1 for xx in range(x - 4, x + 5) for yy in range(y - 4, y + 5) if not self.trong(xx, yy))
                        cand.append((k, abs(dr) + dd / 4, x, y))
            k, _, x, y = min(cand)
            sp = {'mob': loai[i % len(loai)], 'at': [x, y], 'farm': True, 'mul': MUL}
            m['spawners'].append(sp)
            self.giu(x + 0.5, y + 0.5, 5.2)
            out.append(sp)
        return out

    # ---------- dãy núi, hồ, khe ----------
    def chon_cho(self, rmin, rmax, cach):
        for _ in range(400):
            a = self.rng.random() * 2 * math.pi
            rr = self.rng.uniform(rmin, rmax)
            x, y = int(self.c + math.cos(a) * rr), int(self.c + math.sin(a) * rr)
            if all(self.trong(x + dx, y + dy) for dx in range(-cach, cach + 1) for dy in range(-cach, cach + 1)):
                return x, y
        return None

    def nui(self):
        n = 0
        for _ in range(self.C.get('nui', 0)):
            p = self.chon_cho(self.R0 + 2.5, self.R1 - 5, 2)
            if not p:
                continue
            x, y = p
            a = math.atan2(y + 0.5 - self.c, x + 0.5 - self.c) + math.pi / 2 * self.rng.choice((1, -1))
            for _ in range(self.rng.randint(6, 10)):
                for px, py in ((x, y), (x + self.rng.choice((-1, 0, 1)), y + self.rng.choice((-1, 0, 1)))):
                    if self.trong(px, py) and not self.mep(px, py, 4):
                        self.G[py][px] = '^'
                        n += 1
                a += self.rng.uniform(-0.45, 0.45)
                x, y = int(round(x + math.cos(a))), int(round(y + math.sin(a)))
        return n

    def ho(self):
        """Hồ ở chỗ trũng, bờ cong (luật nước): hợp hai, ba vòng elip lệch nhau; cả hồ phải nằm gọn trên đất trống của vành."""
        w, n = self.C['nuoc'], 0
        self.o_ho = []
        for _ in range(self.C.get('ho', 0)):
            for _ in range(300):
                big = self.rng.uniform(2.2, 3.4)
                a = self.rng.random() * 2 * math.pi
                rr = self.rng.uniform(self.R0 + big + 1.5, self.R1 - big - 3)
                cx, cy = self.c + math.cos(a) * rr, self.c + math.sin(a) * rr
                el = [(cx, cy, big, big * self.rng.uniform(0.65, 0.85))]
                for _ in range(self.rng.randint(1, 2)):
                    g = self.rng.random() * 2 * math.pi
                    el.append((cx + math.cos(g) * big * 0.7, cy + math.sin(g) * big * 0.55, big * self.rng.uniform(0.5, 0.75), big * self.rng.uniform(0.45, 0.6)))
                o = [(xx, yy) for yy in range(int(cy - 6), int(cy + 7)) for xx in range(int(cx - 7), int(cx + 8))
                     if any(((xx + 0.5 - ex) / rx) ** 2 + ((yy + 0.5 - ey) / ry) ** 2 <= 1 for ex, ey, rx, ry in el)]
                vien = {(xx + dx, yy + dy) for xx, yy in o for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1, 2)}
                if len(o) >= 8 and all(self.trong(*c) for c in vien):   # bờ trống hai ô quanh hồ
                    for xx, yy in o:
                        self.G[yy][xx] = w
                    n += len(o)
                    self.giu(cx, cy, big + 2.5)
                    self.o_ho.append((cx, cy))
                    break
        for _ in range(self.C.get('khe', 0)):   # khe hư không: vết nứt dài, mảnh
            p = self.chon_cho(self.R0 + 2, self.R1 - 4, 1)
            if not p:
                continue
            x, y = p
            a = self.rng.random() * 2 * math.pi
            for _ in range(self.rng.randint(4, 8)):
                if self.trong(x, y):
                    self.G[y][x] = w
                    n += 1
                a += self.rng.uniform(-0.6, 0.6)
                x, y = int(round(x + math.cos(a))), int(round(y + math.sin(a)))
        return n

    # ---------- cụm cây, đá rải ----------
    def rai_cum(self):
        free = [p for p in self.ring if self.trong(*p)]
        self.chi_do = {}   # ô → ký tự (chỉ đặt bằng đồ, lưới giữ nền)
        mon_ = self.C.get('mon', {})
        for ch, pct in self.C['vat'].items():
            target, placed, tries = len(free) * pct / 100, 0, 0
            while placed < target and tries < 6000:
                tries += 1
                sx, sy = self.rng.choice(free)
                r = self.rng.choice((1, 1, 2, 2, 3))
                for y in range(sy - r, sy + r + 1):
                    for x in range(sx - r, sx + r + 1):
                        if (x - sx) ** 2 + (y - sy) ** 2 <= r * r + 0.5 and self.trong(x, y) and (x, y) not in self.chi_do and self.rng.random() < 0.7:
                            if ch in mon_:
                                self.chi_do[(x, y)] = ch
                            else:
                                self.G[y][x] = ch
                            placed += 1

    # ---------- đường mòn ----------
    def duong(self, bai):
        pc, mang = self.C.get('duong'), self.C.get('mang', '')
        if not pc:
            return []
        out = []
        for sp in bai:
            sx, sy = sp['at']
            best, prev, q, hit = {(sx, sy): 0}, {}, [(0, sx, sy)], None
            while q:
                d, x, y = heapq.heappop(q)
                if d > best.get((x, y), 1e18):
                    continue
                if self.at(x, y) in mang and (x, y) != (sx, sy):
                    hit = (x, y)
                    break
                for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + a, y + b
                    ch = self.at(nx, ny)
                    if ch == '~' or self.mep(nx, ny, 2.6) or (nx, ny) in self.solid or (nx, ny) in self.chi_do:
                        continue
                    if ch in mang:
                        c = 0.35
                    elif SOLID(ch) or ch == self.C['nuoc'] or ch == '=':
                        continue
                    else:
                        c = 1 + ((nx * 7 + ny * 13) % 5) * 0.12
                    nd = d + c
                    if nd < best.get((nx, ny), 1e18):
                        best[(nx, ny)], prev[(nx, ny)] = nd, (x, y)
                        heapq.heappush(q, (nd, nx, ny))
            if not hit:
                print(f'  {self.m["id"]}: bãi {sp["at"]} không nối được đường')
                continue
            path, v = [], hit
            while v in prev:
                v = prev[v]
                path.append(v)
            noi = path[0] if path else None   # ô đường mới sát đường cũ (chỗ rẽ: đặt biển)
            for x, y in path:
                for dx, dy in ((0, 0), (1, 0), (0, 1)):   # vệt rộng cho lưới đôi vẽ liền
                    X, Y = x + dx, y + dy
                    if (dx or dy) and (self.at(X, Y) in mang or (X, Y) in self.solid or SOLID(self.at(X, Y)) or self.at(X, Y) in ('=', self.C['nuoc'])):
                        continue
                    if self.at(X, Y) not in mang and self.at(X, Y) != '~':
                        self.G[Y][X] = pc
                        self.keep.add((X, Y))
                        self.chi_do.pop((X, Y), None)
            out.append((sp, noi, path))
        return out

    # ---------- đồ: cây, đá, núi, đồ nhỏ, biển ----------
    def them(self, it, cells):
        self.moi.append(it)
        for c in cells:
            self.o_do.setdefault(c, set()).add(len(self.moi) - 1)

    def dat_do(self, it, x, y, s, nho_ok=False):
        """Đặt một món; False nếu chân vướng (đường, nước, đồ khác), che đường, chồng hình, rừng dày."""
        sid = it[0]
        sol = foot(sid, x, y, s)[0]
        k = kind_of(sid)
        if any(c in self.solid or self.at(*c) != self.base or c in self.keep or self.r(*c) > self.D / 2 - 1.46 for c in sol):
            return False
        b = box(sid, x, y, s)
        if k in ('cay', 'tru', 'tuong', 'sap', 'nha'):
            for X in range(int(b[0]), int(b[2]) + 1):   # tán, thân không trùm đường (người đi đường luôn thấy được)
                for Y in range(int(b[1]), int(y) + 1):
                    if b[0] < X + 0.5 < b[2] and b[1] < Y + 0.5 < y and self.at(X, Y) == self.C.get('duong'):
                        return False
            for ob in self.boxes:
                ix, iy = min(b[2], ob[2]) - max(b[0], ob[0]), min(b[3], ob[3]) - max(b[1], ob[1])
                if ix > 0 and iy > 0 and ix * iy > 0.45 * min((b[2] - b[0]) * (b[3] - b[1]), (ob[2] - ob[0]) * (ob[3] - ob[1])):
                    return False
        if k == 'cay' and sum(1 for tx, ty in self.cay if abs(tx - x) <= 8.5 and abs(ty - y) <= 19) >= 12:
            return False
        self.solid |= sol
        if k in ('cay', 'tru', 'tuong', 'sap', 'nha'):
            self.boxes.append(b)
        if k == 'cay':
            self.cay.append((x, y))
        o = {'s': round(s, 2)}
        if self.rng.random() < 0.5:
            o['f'] = 1
        self.them([sid, round(x, 2), round(y, 2), None, o], sol)
        return True

    def do_vat(self):
        cay = dict(self.tc.get('cay', {}))
        if '^' not in cay:
            cay['^'] = self.C['nui_do']
        thua = self.tc.get('thua') or [d for d in self.tc['rai'][0] if '.nho-' not in d[0]] or self.tc['rai'][0]
        n = 0
        for (x, y) in sorted(self.ring):   # ô ký tự cây, đá, núi trên lưới (đồ vẽ, ô vẫn chắn theo lưới)
            ch = self.at(x, y)
            if ch not in cay:
                continue
            it = chon(self.rng, cay[ch])
            cx, cy = x + 0.5 + self.rng.uniform(-0.15, 0.15), y + 0.85
            gan = min((math.hypot(cx - a, cy - b) for a, b in self.cay), default=9)
            if ch != '^' and kind_of(it[0]) == 'cay' and (gan < 1.8 or sum(1 for tx, ty in self.cay if abs(tx - cx) <= 8.5 and abs(ty - cy) <= 19) >= 12):
                it = chon(self.rng, thua)
            elif kind_of(it[0]) == 'cay':
                self.cay.append((cx, cy))
            self.them(mon(self.rng, it, cx, cy), [(x, y)])
            n += 1
        for (x, y), ch in sorted(self.chi_do.items()):   # đồ tự chắn theo chân (Xích Diễm, Hàn Băng)
            ds = self.C['mon'][ch]
            for _ in range(3):
                it = chon(self.rng, ds)
                if self.dat_do(it, x + 0.5 + self.rng.uniform(-0.3, 0.3), y + 0.8 + self.rng.uniform(0, 0.15), self.rng.uniform(it[2], it[3])):
                    n += 1
                    break
        ds, p = self.tc['rai']
        for (x, y) in sorted(self.ring):   # đồ nhỏ in nền, rải thưa
            if self.trong(x, y) and (x, y) not in self.chi_do and all(self.at(x + a, y + b) == self.base for a in (-1, 0, 1) for b in (-1, 0, 1)) and self.rng.random() < p:
                it = chon(self.rng, ds)
                if kind_of(it[0]) in ('nho', 'phang') or self.dat_do(it, x + 0.5, y + 0.8, self.rng.uniform(it[2], it[3])):
                    if kind_of(it[0]) in ('nho', 'phang'):
                        self.them(mon(self.rng, it, x + self.rng.uniform(0.2, 0.8), y + self.rng.uniform(0.6, 0.95)), [])
                    n += 1
        return n

    def bien(self, noi, mobs):
        if not self.C.get('bien'):
            return 0
        n = 0
        for sp, cho, _ in noi:
            if not cho:
                continue
            ten = '→ Bãi ' + mobs.get(sp['mob'], {}).get('name', sp['mob'])
            for dx, dy in ((1.6, 0.5), (-0.6, 0.5), (0.5, 1.7), (0.5, -0.7), (1.6, 1.7), (-0.6, -0.7)):
                x, y = cho[0] + dx, cho[1] + dy
                c = (int(x), int(y))
                if self.at(*c) == self.base and c not in self.solid:
                    self.them([BIEN, round(x, 2), round(y, 2), ten], [c])
                    self.solid.add(c)
                    n += 1
                    break
        return n

    # ---------- liên thông: vành mới không có túi kín, bãi mới tới được ----------
    def lien_thong(self, bai):
        start = tuple(self.m['spawns']['vao'])
        bo = set()
        for _ in range(60):
            chan = lambda x, y: self.at(x, y) == '~' or SOLID(self.at(x, y)) or (x, y) in self.solid or self.r(x, y) > self.D / 2 - 1.46
            seen, st = {start}, [start]
            while st:
                x, y = st.pop()
                for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nb = (x + a, y + b)
                    if nb not in seen and not chan(*nb):
                        seen.add(nb)
                        st.append(nb)
            kin = [p for p in self.ring if not chan(*p) and p not in seen]
            if not kin:
                break
            # mở một ô chắn nằm giữa túi kín và vùng đã tới (ô núi, cây lưới, hoặc chân đồ mới)
            p = kin[0]
            q, prev, found = [p], {p: None}, None
            while q and not found:
                nq = []
                for x, y in q:
                    for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nb = (x + a, y + b)
                        if nb in prev or self.at(*nb) == '~' or self.r(*nb) > self.D / 2 - 1.46:
                            continue
                        prev[nb] = (x, y)
                        if nb in seen:
                            found = nb
                            break
                        nq.append(nb)
                    if found:
                        break
                q = nq
            v = found
            while v:
                if chan(*v) and v in self.ring:
                    if SOLID(self.at(*v)):
                        self.G[v[1]][v[0]] = self.base
                    for i in self.o_do.get(v, ()):   # đồ đứng trên ô vừa mở, hoặc chân đồ chắn ô đó: bỏ cả món
                        if i not in bo:
                            bo.add(i)
                            it = self.moi[i]
                            self.solid -= foot(it[0], it[1], it[2], (it[4] or {}).get('s', 1) if len(it) > 4 and it[4] else 1)[0]
                    self.solid.discard(v)
                v = prev[v]
        self.moi = [it for i, it in enumerate(self.moi) if i not in bo]
        for sp in bai:
            x, y = sp['at']
            assert (x, y) in seen or any((x + a, y + b) in seen for a in (-1, 0, 1) for b in (-1, 0, 1)), f'bãi {sp["at"]} không tới được'
        return len(bo)


def lam(mid, mobs):
    C = VANH[mid]
    p = DATA / 'maps' / f'{mid}.json'
    m = doc(p)
    if m['planet'].get('vanh'):
        print(f'{mid}: đã có vành ngoài, bỏ qua')
        return None
    v = Vanh(m, C)
    d0 = v.D0
    v.dich_ban_do()
    for y in range(v.D):   # mép mới, ô sát mép: giữ trống
        for x in range(v.D):
            if (x, y) in v.ring and v.mep(x, y):
                v.keep.add((x, y))
    song = v.song()
    bai = v.bai()
    nui = v.nui()
    ho = v.ho()
    v.rai_cum()
    noi = v.duong(bai)
    vat = v.do_vat()
    bien = v.bien(noi, mobs)
    mo = v.lien_thong(bai)
    m['grid'] = [''.join(r) for r in v.G]
    m['hoi']['do'] = m['hoi']['do'] + v.moi
    if nui and '^' not in m.get('prop_hide', ''):
        m['prop_hide'] = ''.join(sorted(set(m.get('prop_hide', '')) | {'^'}))
    m['planet']['d'] = v.D
    m['planet']['vanh'] = {'tu': d0, 'them': v.o, 'note': 'tools/the-gioi/vanh_ngoai.py 24/11/2026'}
    ghi(p, m)
    print(f'{mid}: {d0} → {v.D} ô (+{v.o}), sông nối {len(song)}, bãi mới {[s["mob"] + " " + str(s["at"]) for s in bai]}, núi {nui} ô, '
          f'nước {ho} ô, đường {sum(len(x[2]) for x in noi)} ô, đồ thêm {len(v.moi)} ({vat} cây đá, {bien} biển), mở lối {mo}')
    return v.o


def dich_ngoai(off):
    """Toạ độ ngoài bản đồ: bước truyện, dấu trên đất, NPC đồ cũ, phố hội Hàn Băng."""
    sp = DATA / 'story.json'
    st = doc(sp)
    for s in st['steps']:
        mp = s.get('target_map') or s.get('map')
        if mp not in off:
            continue
        o = off[mp]
        if isinstance(s.get('target'), list):
            s['target'] = dich(s['target'], o)
        for d in s.get('do', []):
            if 'at' in d:
                d['at'] = dich(d['at'], o)
            if isinstance(d.get('canh'), dict) and 'tai' in d['canh']:
                d['canh']['tai'] = dich(d['canh']['tai'], o)
        if isinstance(s.get('until'), dict) and 'reach' in s['until']:
            s['until']['reach'] = dich(s['until']['reach'], o)
    for d in st.get('dau', []):
        if d.get('map') in off:
            d['at'] = dich(d['at'], off[d['map']])
    sp.write_text(json.dumps(st, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    dp = DATA / 'do-cu.json'
    dc = doc(dp)
    for n in dc['npc'].values():
        if isinstance(n, dict) and n.get('map') in off:
            n['at'] = dich(n['at'], off[n['map']])
    dp.write_text(json.dumps(dc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    lp = DATA / 'le-hoi.json'
    L = doc(lp)
    for mid, f in L['festivals'].items():
        if mid not in off:
            continue
        o = off[mid]
        f['khu'] = [[a + o for a in k] for k in f.get('khu', [])]
        k = f.get('khach', {})
        if k.get('nodes'):
            k['nodes'] = dich(k['nodes'], o)
        if k.get('ban'):
            k['ban'] = [[b[0]] + dich(b[1:3], o) + b[3:] for b in k['ban']]
        assert not f.get('tro'), 'phố hội có trò diễn: chưa biết dịch'
    lp.write_text(json.dumps(L, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def dau_boss():
    """Đầu boss thế giới mỗi tinh cầu (cloud/src/mang-cfg.js HEAD): giữa mép trên, tính lại theo lưới mới (tools/cloud/phong.test.mjs soát)."""
    p = ROOT / 'cloud/src/mang-cfg.js'
    t = p.read_text(encoding='utf-8')
    for mid in VANH:
        g = doc(DATA / 'maps' / f'{mid}.json')['grid']
        cx = len(g[0]) // 2
        ry = next(y for y in range(len(g)) if g[y][cx] != '~')
        t, n = re.subn(r'("' + re.escape(mid) + r'": )\[[\d.]+, [\d.]+\]', lambda mm: f'{mm.group(1)}[{(cx + 0.5) * 16}, {(max(0, ry - 1) + 0.5) * 16}]', t, count=1)
        assert n == 1, mid
    p.write_text(t, encoding='utf-8')


def main():
    ids = [a for a in sys.argv[1:] if not a.startswith('-')] or list(VANH)
    mobs = doc(DATA / 'mobs.json')
    off = {}
    for mid in ids:
        o = lam(mid, mobs)
        if o:
            off[mid] = o
    if off:
        dich_ngoai(off)
        dau_boss()
        print('Đã dịch toạ độ ngoài bản đồ:', off)


if __name__ == '__main__':
    main()
