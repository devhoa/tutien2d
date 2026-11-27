// Bài thử Hộ Tông gia trì phía máy khách (src/game/ho-tong.js; data/guild.json → ho_tong), thuần Node:
// chỉ nhân theo số máy chủ phòng báo, đúng bản đồ đó; số lạ bị kẹp; tắt công tắc thì thôi; lực chiến gốc không đổi.
// Chạy: node tools/ho-tong.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { hoTongPct, hoTongAp, hoTongTin, hoTongLuc } from '../src/game/ho-tong.js';

const guild = JSON.parse(readFileSync(new URL('../data/guild.json', import.meta.url), 'utf8')), H = guild.ho_tong;
assert.ok(H.on && H.text.on.includes('{pct}') && H.text.on.includes('{chuc}') && H.text.hud.includes('{pct}') && H.text.row_v.includes('{pct}') && H.text.off && H.text.row, 'ho_tong: thiếu chữ hoặc chỗ điền');
assert.deepEqual(Object.keys(H.pct).sort(), Object.keys(guild.roles).sort(), 'ho_tong.pct phải có đủ đúng các chức vụ của tông môn');
assert.ok(H.pct.chu > H.pct.pho && H.pct.pho > H.pct.lao && H.pct.lao > H.pct.de && H.pct.de > 0, 'chức cao hơn thì gia trì cao hơn');

const NHA = '00000000-0000-4000-8000-00000000aaaa';
const game = { data: { guild: structuredClone(guild) }, map: { id: NHA }, hoTong: null };
const st = { maxHp: 1000, atk: 200, def: 51, crit: 0.1, hc: { hp: 1000, atk: 200, def: 51 } };

assert.equal(hoTongPct(game), 0); assert.equal(hoTongAp(game, st), st, 'không có gia trì: trả nguyên bảng chỉ số');
hoTongTin(game, 60, NHA);
assert.equal(hoTongPct(game), 60);
const a = hoTongAp(game, st);
assert.deepEqual([a.maxHp, a.atk, a.def, a.hoTong, a.crit], [1600, 320, 82, 60, 0.1], 'Công, Sinh lực, Thủ × 1,6; chỉ số khác giữ nguyên');
assert.equal(a.hc, st.hc, 'chỉ số gốc tính lực chiến không đổi (bảng xếp hạng, thành tựu, máy chủ lưu theo số gốc)');
assert.deepEqual([st.maxHp, st.atk, st.def], [1000, 200, 51], 'không sửa bảng chỉ số gốc');
assert.equal(hoTongLuc(game, 9884), 15814, 'lực chiến hiện trên HUD = gốc × 1,6');
game.map = { id: 'dao-moc' };
assert.equal(hoTongPct(game), 0, 'sang bản đồ khác: hết ngay dù phòng chưa báo lại');
assert.equal(hoTongLuc(game, 9884), 9884);
game.map = { id: NHA };
hoTongTin(game, 0, null); assert.equal(hoTongPct(game), 0, 'rời phòng: hết');
for (const [gui, ra] of [[20, 20], [61, 60], [9999, 60], [-5, 0], ['abc', 0], [null, 0], [40.9, 40]]) { hoTongTin(game, gui, NHA); assert.equal(hoTongPct(game), ra, `phòng báo ${gui} → ${ra}`); }
hoTongTin(game, 50, null); assert.equal(hoTongPct(game), 0, 'không rõ bản đồ: không nhận');
hoTongTin(game, 50, NHA); game.data.guild.ho_tong.on = false; assert.equal(hoTongPct(game), 0, 'tắt công tắc: thôi');
console.log('✅ Hộ Tông gia trì (máy khách): nhân đúng, đúng bản đồ, kẹp số lạ, giữ lực chiến gốc');
