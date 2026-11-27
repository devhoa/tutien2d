// Bản lưu mẫu để so code tính Lực chiến đã gói (supabase/functions/luc-chien/game.js) với code game (src/game/stats.js + achieve.js).
// Dùng chung cho tools/luc-chien.test.mjs và bước KIEM của tools/goi-luc-chien.mjs: gói lại mà chữ khác (đổi tên biến vì một tệp không liên
// quan trong cùng cây import đổi) nhưng mọi bản lưu mẫu ra cùng số thì KHÔNG phải đưa hàm lên lại; ra số khác mới là cách tính đã đổi.
// Mẫu: 3 bản lưu viết tay (người mới, Kim Đan đủ thứ, trường lạ / thiếu) + n bản sinh ngẫu nhiên có hạt cố định, đủ mọi cảnh giới, mọi ô
// trang bị, phẩm, dòng, ngọc, linh thú, khôi lỗi, thú cưỡi, thời trang, Tiềm năng, công pháp, pháp bảo lấy từ data/.
const L = a => a.map(([s, t, v]) => ({ s, t, v }));
const dau = o => Object.keys(o || {}).find(k => !k.startsWith('_'));
const ds = o => Object.keys(o || {}).filter(k => !k.startsWith('_'));

function hat(n) { let x = n >>> 0 || 1; return () => ((x = Math.imul(x ^ (x >>> 15), 2246822519) + 0x6d2b79f5 >>> 0) % 1e6) / 1e6; }

export function mauLuu(goc, n = 200) {
  const pet = dau(goc.pets.pets), mount = dau(goc.pets.mounts), comps = ds(goc.companions.list).filter(id => goc.npcs[id]).slice(0, 2);
  const outfit = dau(goc.fashion.list), look = goc.heroes.default, toc = dau(goc['tiem-nang'].toc), tech = ds(goc.techniques.list).slice(0, 3);
  const pbt = ds(goc['phap-bao'].types).slice(0, 3), pbg = goc['phap-bao'].grades.map(g => g.id);
  const tay = [
    { ten: 'người mới', s: { realm: 0, layer: 1, weapon: 'kiem', bag: [], equip: {} } },
    { ten: 'Kim Đan đủ thứ', s: {
      realm: 2, layer: 9, element: 'hoa', weapon: 'kiem', look, outfit,
      bag: [
        { uid: 1, base: 'van-van-ngoa', rarity: 'thien', lvl: 25, plus: 10, main: { speed: 7 }, el: 'hoa', lines: L([['cdr', 4, 6], ['hp_pct', 2, 9], ['crit', 3, 6]]), sockets: ['luc-ngoc:5'] },
        { uid: 2, base: 'thiet-thuong', rarity: 'thien', lvl: 25, plus: 10, main: { atk: 42 }, el: 'hoa', lines: L([['atk_pct', 3, 9], ['crit_dmg', 4, 54]]), sockets: ['hong-ngoc:8', 'hong-ngoc:4'] },
        { uid: 3, base: 'bo-can', rarity: 'dia', lvl: 25, plus: 10, main: { hp: 105 }, lines: L([['hp', 2, 90]]), sockets: [] },
      ],
      equip: { giay: 1, 'vu-khi': 2, mu: 3 }, techSlots: tech, techs: Object.fromEntries(tech.map(id => [id, { lv: 10 }])), flags: { boiNguyen: 10 },
      pet, pets: { [pet]: { lv: 40, star: 10, evo: true, lines: L([['atk_pct', 2, 8], ['crit', 1, 3]]) } },
      companion: comps[0], companion2: comps[1], comps: { [comps[0]]: { lv: 30, lines: L([['atk_pct', 5, 27]]) }, [comps[1]]: { lv: 30, lines: L([['crit_dmg', 2, 31]]) } },
      mount, mounts: { [mount]: true }, mountLine: { [mount]: { s: 'crit', t: 2, v: 6 } }, outfitLine: { [`${outfit}:${look}`]: { s: 'crit_dmg', t: 4, v: 41 } },
      tiem: { toc, goc: { atk_pct: 2.5 }, cong: { atk_pct: 6, crit: 2 }, max: 2 },
      theChat: dau(goc['the-chat'].the),
      phapBao: { items: pbt.map((type, i) => ({ uid: 10 + i, type, grade: pbg[i % pbg.length], lv: 15, slots: 3, mods: [] })), wear: [10, 11, 12, null] },
    } },
    { ten: 'trường lạ, thiếu', s: { realm: 9, layer: 99, bag: [{ uid: 1, base: 'khong-co' }], equip: { giay: 1, mu: 5 }, pets: null, tiem: { toc: 'khong-co' }, theChat: 'khong-co' } },
  ];
  // Sinh ngẫu nhiên (hạt cố định: CI, máy nào cũng ra cùng bộ mẫu)
  const r = hat(20261123), pick = a => a[Math.floor(r() * a.length)], so = (a, b) => Math.floor(a + r() * (b - a + 1));
  const bases = ds(goc.items.bases), rar = goc.items.rarities.map(x => x.id), stats = ds(goc.items.stats), gems = ds(goc.items.gems?.types);
  const els = ds(goc.elements).filter(k => goc.elements[k]?.color), pets = ds(goc.pets.pets), mounts = ds(goc.pets.mounts), cps = ds(goc.companions.list);
  const wps = ds(goc.weapons), outs = ds(goc.fashion.list), tocs = ds(goc['tiem-nang'].toc), techs = ds(goc.techniques.list), pts = ds(goc['phap-bao'].types);
  const thes = ds(goc['the-chat']?.the);
  const dong = () => L(Array.from({ length: so(0, 5) }, () => [pick(stats), so(0, 6), so(1, 60)]));
  const sinh = [];
  for (let i = 0; i < n; i++) {
    const bag = [], equip = {};
    for (let k = 0; k < so(0, 8); k++) {
      const base = pick(bases), slot = goc.items.bases[base]?.slot;
      const it = { uid: 100 + k, base, rarity: pick(rar), lvl: so(1, 90), plus: so(0, 20), main: {}, lines: dong(),
        sockets: gems.length ? Array.from({ length: so(0, 3) }, () => `${pick(gems)}:${so(1, 10)}`) : [] };
      if (r() < 0.5) it.main[pick(['atk', 'hp', 'def', 'speed'])] = so(1, 120);
      if (r() < 0.3) it.sp = so(0, 6);
      if (r() < 0.3) it.el = pick(els);
      bag.push(it);
      if (slot && !equip[slot] && r() < 0.8) equip[slot] = it.uid;
    }
    const s = { realm: so(0, 8), layer: so(1, 9), element: r() < 0.8 ? pick(els) : undefined, weapon: pick(wps), look, bag, equip };
    if (r() < 0.6) { const p = pick(pets); s.pet = p; s.pets = { [p]: { lv: so(1, 80), star: so(0, 10), evo: r() < 0.3, lines: dong() } }; }
    if (r() < 0.5) { const c = pick(cps), c2 = pick(cps); s.companion = c; s.companion2 = r() < 0.5 ? c2 : undefined; s.comps = { [c]: { lv: so(1, 60), lines: dong() }, [c2]: { lv: so(1, 60), lines: dong() } }; }
    if (r() < 0.5) { const m = pick(mounts); s.mount = m; s.mounts = { [m]: true }; s.mountLine = { [m]: { s: pick(stats), t: so(0, 6), v: so(1, 40) } }; }
    if (r() < 0.5) { const o = pick(outs); s.outfit = o; s.outfitLine = { [`${o}:${look}`]: { s: pick(stats), t: so(0, 6), v: so(1, 40) } }; }
    if (r() < 0.6) s.tiem = { toc: pick(tocs), goc: { atk_pct: so(0, 5), hp_pct: so(0, 5) }, cong: { atk_pct: so(0, 10), crit: so(0, 5) }, max: so(0, 8) };
    if (r() < 0.5) { const t = techs.slice(0, so(0, 3)); s.techSlots = t; s.techs = Object.fromEntries(t.map(id => [id, { lv: so(0, 20) }])); }
    if (r() < 0.5) { const items = Array.from({ length: so(1, 4) }, (_, j) => ({ uid: 500 + j, type: pick(pts), grade: pick(pbg), lv: so(0, 30), slots: 3, mods: [] })); s.phapBao = { items, wear: items.map(x => x.uid) }; }
    if (r() < 0.3) s.flags = { boiNguyen: so(0, 20) };
    if (r() < 0.5) s.theChat = pick(thes);   // Thể chất (25/11/2026): bản lưu chỉ giữ mã
    sinh.push({ ten: `ngẫu nhiên #${i}`, s });
  }
  return [...tay, ...sinh];
}

// So hai cặp (playerStats, power) trên mọi bản lưu mẫu; trả danh sách chỗ khác (rỗng là cùng kết quả)
export function soSanh(a, b, goc, mau = mauLuu(goc)) {
  const khac = [];
  for (const { ten, s } of mau) {
    const chay = f => { try { return { v: f.power({ data: goc }, f.playerStats({ ...structuredClone(s), gems: {}, mats: {} }, goc)) }; } catch (e) { return { e: e.message }; } };
    const x = chay(a), y = chay(b);
    if (x.v !== y.v || x.e !== y.e) khac.push(`${ten}: ${x.v ?? x.e} ≠ ${y.v ?? y.e}`);
  }
  return khac;
}
