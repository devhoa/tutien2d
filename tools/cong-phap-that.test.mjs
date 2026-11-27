// Bài thử: bảng Công pháp hiện đúng số người chơi thật sự nhận (src/game/cong-phap-that.js), so với chính hàm luật chiến đấu dùng
// (src/game/he-chien.js extraPct) trên 300 tổ hợp ngẫu nhiên cuốn / tầng; phần chia của từng cuốn đang mang cộng lại đúng bằng tổng;
// cuốn chưa mang báo đúng phần mang thêm được. Chủ dự án 23/11/2026 12:43: "xem công pháp có thực sự đang hoạt động đúng chỉ số không".
// Chạy: node tools/cong-phap-that.test.mjs (check.mjs gọi)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const doc = f => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const data = { techniques: doc('techniques.json'), 'he-chien': doc('he-chien.json') };
const { cpThat, cpCuon, cpTran } = await import('../src/game/cong-phap-that.js');
const { extraPct } = await import('../src/game/he-chien.js');
const { techStats } = await import('../src/game/techniques.js');
const H = data['he-chien'], T = data.techniques, ids = Object.keys(T.list), CAP = H.extra_cap.tech;
assert.ok(H.on, 'luật chiến đấu mới đang tắt: bài thử này viết cho luật mới');
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const gan = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} ≠ ${b}`);

for (let lan = 0; lan < 300; lan++) {
  const techs = {}, slots = [];
  for (const id of ids) if (rnd() < 0.5) techs[id] = { lv: 1 + Math.floor(rnd() * T.max_level), exp: 0 };
  const co = Object.keys(techs);
  while (slots.length < Math.min(T.slots, co.length)) { const id = co[Math.floor(rnd() * co.length)]; if (!slots.includes(id)) slots.push(id); }
  const save = { techs, techSlots: slots };
  const that = new Map(cpThat(save, data).map(x => [x.k, x])), luat = extraPct(H, techStats(save, data), { atk: 100, hp: 1000, def: 10 }, CAP);
  for (const [k, v] of Object.entries(luat)) gan(that.get(k)?.that ?? 0, v, `lần ${lan}: ${k} bảng hiện khác luật chiến đấu`);
  for (const x of that.values()) {
    if (x.tran == null) { gan(x.that, x.tho, `lần ${lan}: ${x.k} không trần mà bị kẹp`); assert.ok(!(x.k in luat), `${x.k} đi thẳng mà luật lại kẹp`); }
    else { gan(x.that, luat[x.k] ?? 0, `lần ${lan}: ${x.k}`); gan(x.tran, CAP * (H.line_f[x.k] ?? 1), `${x.k}: trần sai`); }
  }
  // chia phần: các cuốn đang mang cộng lại bằng tổng thật nhận
  const chia = new Map();
  for (const id of slots) for (const x of cpCuon(save, data, id)) chia.set(x.k, (chia.get(x.k) || 0) + x.that);
  for (const [k, v] of chia) gan(v, that.get(k).that, `lần ${lan}: phần chia ${k} cộng lại khác tổng`);
  // cuốn chưa mang: mang thêm (giả sử thêm ô) thì tổng mới đúng bằng phần báo
  const ngoai = co.find(id => !slots.includes(id));
  if (ngoai) {
    const them = { techs, techSlots: [...slots, ngoai] }, sau = new Map(cpThat(them, data).map(x => [x.k, x]));
    for (const x of cpCuon(save, data, ngoai)) gan((that.get(x.k)?.that || 0) + x.that, sau.get(x.k).that, `lần ${lan}: ${ngoai} báo phần mang thêm sai ở ${x.k}`);
  }
}
// Trần 40 (chủ dự án 23/11/2026 13:4x "nới trần hoặc bỏ trần"): một cuốn tầng cao nhất mang một mình không bao giờ bị cắt;
// hai cuốn cùng chỉ số cũng nhận đủ, trừ đúng cặp phản đòn Kim Chung Tráo + Hậu Thổ (80 → 76); ba cuốn Công thì chạm trần.
const mang = ds => ({ techs: Object.fromEntries(ds.map(id => [id, { lv: T.max_level }])), techSlots: ds });
const bi = ds => cpThat(mang(ds), data).filter(x => x.tran != null && x.tho > x.that + 1e-9).map(x => x.k);
for (const id of ids) assert.deepEqual(bi([id]), [], `${T.list[id].name} tầng ${T.max_level} mang một mình mà bị trần cắt`);
for (const a of ids) for (const b of ids) if (a < b) {
  const cat = bi([a, b]).filter(k => !(k === 'thorns' && [a, b].includes('kim-chung-trao') && [a, b].includes('hau-tho-quyet')));
  assert.deepEqual(cat, [], `${T.list[a].name} + ${T.list[b].name}: hai cuốn bị cắt ở ${cat}`);
}
const ba = cpThat(mang(['hac-phong-quyet', 'canh-kim-kiem-quyet', 'thai-hu-quyet']), data).find(x => x.k === 'atk_pct');
assert.ok(ba.tho > ba.tran && ba.that === cpTran(data, 'atk_pct'), 'ba cuốn Công tầng 10: Công phải bị kẹp đúng trần');
console.log(`✅ Công pháp: số hiện khớp luật chiến đấu (300 tổ hợp), chia phần đúng; mỗi cuốn và mỗi cặp nhận đủ; ba cuốn Công ghi +${ba.tho}% nhận +${ba.that}%`);
