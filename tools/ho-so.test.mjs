// Bài thử Hồ sơ đúng chỉ số thực tế (chủ dự án 23/11/2026 19:35; migration 20261123090000_p2d_xem_nguoi_du.sql + src/game/profile.js cleanSave).
// Dựng một bản lưu đủ thứ (Tiềm năng, thời trang bản thêm "#…", thú cưỡi bản thêm, hai khôi lỗi), cắt ra đúng những gì p2d_xem_nguoi trả
// (bản mới) rồi lọc bằng cleanSave: chỉ số và lực chiến trong Hồ sơ phải bằng bảng Nhân vật của chính người đó. Thêm: bản hàm cũ (thiếu bốn
// thứ) cho số thấp hơn, để bài thử bắt được nếu ai lỡ bỏ một trường.
// Chạy ở gốc kho: node tools/ho-so.test.mjs
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { playerStats } from '../src/game/stats.js';
import { cleanSave } from '../src/game/profile.js';
import { power } from '../src/game/achieve.js';

const data = {};
for (const f of readdirSync('data')) if (f.endsWith('.json')) data[f.slice(0, -5)] = JSON.parse(readFileSync('data/' + f, 'utf8'));
const L = a => a.map(([s, t, v]) => ({ s, t, v }));
const pet = Object.keys(data.pets.pets).find(k => !k.startsWith('_')), mount = Object.keys(data.pets.mounts).find(k => !k.startsWith('_'));
const comps = Object.keys(data.companions.list).filter(id => data.npcs[id]).slice(0, 2), outfit = Object.keys(data.fashion.list).find(k => !k.startsWith('_'));
const toc = Object.keys(data['tiem-nang'].toc)[0], huong = Object.keys(data['tiem-nang'].toc[toc].huong);
const look = data.heroes.default, ok = `${outfit}:${look}#abc123`, mk = `${mount}#xyz789`;
const save = {
  realm: 2, layer: 9, element: 'hoa', root: Object.keys(data.roots || {})[0], weapon: 'kiem', look, gems: {}, mats: {},
  bag: [
    { uid: 1, base: 'van-van-ngoa', rarity: 'thien', lvl: 25, plus: 10, main: { speed: 7 }, lines: L([['cdr', 4, 6], ['hp_pct', 2, 9], ['crit', 3, 6]]), sockets: ['luc-ngoc:5'] },
    { uid: 2, base: 'thiet-thuong', rarity: 'thien', lvl: 25, plus: 10, main: { atk: 42 }, lines: L([['atk_pct', 3, 9], ['crit_dmg', 4, 54]]), sockets: ['hong-ngoc:8'] },
    { uid: 3, base: 'bo-can', rarity: 'dia', lvl: 25, plus: 10, main: { hp: 105 }, lines: L([['hp', 2, 90]]), sockets: [] },
    { uid: 4, base: 'bo-y', rarity: 'dia', lvl: 25, plus: 10, main: { hp: 158 }, lines: L([['def', 2, 9]]), sockets: [] },   // trong túi, không mặc: Hồ sơ không có
  ],
  equip: { giay: 1, 'vu-khi': 2, mu: 3 },
  techSlots: [], techs: {}, flags: { boiNguyen: 5 },
  pet, pets: { [pet]: { lv: 30, star: 4, evo: false, lines: L([['atk_pct', 2, 8], ['crit', 1, 3]]) } },
  companion: comps[0], companion2: comps[1],
  comps: { [comps[0]]: { lv: 20, lines: L([['atk_pct', 5, 27]]) }, [comps[1]]: { lv: 20, lines: L([['crit_dmg', 2, 31], ['atk_pct', 1, 9]]) } },
  mount, mountKey: mk, mounts: { [mount]: true, [mk]: true }, mountLine: { [mount]: { s: 'hp_pct', t: 0, v: 3 }, [mk]: { s: 'crit_dmg', t: 4, v: 31 } },
  outfit, outfitKey: ok, outfits: { [ok]: true }, outfitLine: { [`${outfit}:${look}`]: { s: 'hp_pct', t: 0, v: 4 }, [ok]: { s: 'atk_pct', t: 4, v: 8 } },
  tiem: { toc, goc: Object.fromEntries(huong.map(k => [k, 2.5])), cong: { atk_pct: 6, crit: 2 }, max: 1, tay: 0 },
  phapBao: { items: [], wear: [null, null, null, null] },
};
// đúng những khoá p2d_xem_nguoi (bản 20261123090000) trả về, giữ cùng cách chọn bản đang dùng
const tra = (s, moi) => {
  const equipped = new Set(Object.values(s.equip));
  const o = {
    realm: s.realm, layer: s.layer, element: s.element, weapon: s.weapon, root: s.root, equip: s.equip, bag: s.bag.filter(i => equipped.has(i.uid)),
    techSlots: s.techSlots, techs: s.techs, flags: { boiNguyen: s.flags.boiNguyen }, pet: s.pet, pets: { [s.pet]: s.pets[s.pet] },
    companion: s.companion, comps: { [s.companion]: s.comps[s.companion] }, phapBao: s.phapBao, look: s.look, outfit: s.outfit,
  };
  if (!moi) return o;
  return { ...o, companion2: s.companion2, comps: { [s.companion]: s.comps[s.companion], [s.companion2]: s.comps[s.companion2] },
    tiem: { toc: s.tiem.toc, goc: s.tiem.goc, cong: s.tiem.cong, max: Math.max(s.tiem.max, 2) },
    mount: s.mount, mountKey: s.mountKey, mounts: { [s.mountKey]: s.mounts[s.mountKey] }, mountLine: { [s.mountKey]: s.mountLine[s.mountKey] },
    outfitKey: s.outfitKey, outfits: { [s.outfitKey]: s.outfits[s.outfitKey] }, outfitLine: s.outfitLine };
};
const g = { data };
const that = playerStats(save, data), moi = playerStats(cleanSave(data, tra(save, true)), data), cu = playerStats(cleanSave(data, tra(save, false)), data);
const so = s => [s.maxHp, s.atk, s.def, Math.round(s.crit * 1000), Math.round(s.critMult * 1000), power(g, s)];
assert.deepEqual(so(moi), so(that), `Hồ sơ phải bằng bảng Nhân vật: ${so(moi)} / ${so(that)}`);
assert.ok(power(g, cu) < power(g, that) * 0.95, 'bản hàm cũ (thiếu Tiềm năng, thời trang, thú cưỡi, khôi lỗi 2) thấp hơn rõ');
// mỗi phần thêm đều có tác dụng: bỏ riêng từng phần thì số khác bản đủ
for (const bo of ['tiem', 'outfitLine', 'mountLine', 'companion2']) {
  const p = tra(save, true); delete p[bo];
  assert.notEqual(power(g, playerStats(cleanSave(data, p), data)), power(g, that), `bỏ ${bo} thì Hồ sơ phải khác`);
}
// dữ liệu lạ từ máy chủ không lọt qua: tộc không có, điểm âm / quá trần
const la = cleanSave(data, { ...tra(save, true), tiem: { toc: 'khong-co', goc: { atk_pct: 99 } } });
assert.equal(la.tiem, undefined, 'tộc lạ bị bỏ');
const tran = cleanSave(data, { ...tra(save, true), tiem: { toc, goc: { [huong[0]]: -5 }, cong: { atk_pct: 999 } } });
assert.ok(!tran.tiem.goc[huong[0]] && tran.tiem.cong.atk_pct <= data['tiem-nang'].diem.tran, 'điểm âm / quá trần bị kẹp');
// Thể chất (25/11/2026): Hồ sơ giữ MÃ thể chất của người được xem (dòng "Thể chất" ở src/ui/profile-side.js và chỉ số đều lấy từ mã), mã lạ bị bỏ
if (data['the-chat']?.on) {
  const ma = Object.keys(data['the-chat'].the).at(-1);
  const co = cleanSave(data, { ...tra(save, true), realm: 2, theChat: ma });
  assert.equal(co.theChat, ma, 'mã thể chất có trong data thì giữ');
  assert.ok(power(g, playerStats(co, data)) > power(g, playerStats(cleanSave(data, { ...tra(save, true), realm: 2 }), data)), 'có thể chất thì Hồ sơ mạnh hơn');
  assert.equal(cleanSave(data, { ...tra(save, true), theChat: 'the-bia' }).theChat, undefined, 'mã thể chất lạ bị bỏ');
  assert.equal(cleanSave(data, { ...tra(save, true), theChat: 7 }).theChat, undefined, 'mã không phải chữ bị bỏ');
}
console.log('ho-so: ok');
