// Bài thử thu chiến lợi phẩm sau khi hạ người (src/game/pvp-thu.js; chủ dự án 22/11/2026 11:09: "người hóa ma sau khi giết người nhận Linh Thạch thì
// hình như chưa có thông báo nhận Linh Thạch, tui giết xong mà chẳng thấy gì"). Đồng hồ giả, Hòm thư giả (thư tới lúc máy người gục trả nợ), đi đúng
// đường của game: tin pd của máy chủ phòng → src/game/pvp.js onPvp / src/game/pvp-ma.js maPd → hỏi Hòm thư → src/game/market.js claimMail → báo.
// Chạy: node tools/pvp-thu.test.mjs (tools/check.mjs gọi)
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const data = {};
for (const f of readdirSync(new URL('../data/', import.meta.url))) if (f.endsWith('.json')) data[f.slice(0, -5)] = JSON.parse(readFileSync(new URL('../data/' + f, import.meta.url), 'utf8'));

// đồng hồ giả: setTimeout và Date.now chạy theo tay (toi)
let now = 1.8e12;
const hang = [];
globalThis.setTimeout = (f, ms = 0) => { hang.push({ t: now + ms, f }); return hang.length; };
Date.now = () => now;
const nghi = () => new Promise(r => setImmediate(r));
async function toi(ms) {
  const het = now + ms;
  for (;;) {
    hang.sort((a, b) => a.t - b.t);
    if (!hang.length || hang[0].t > het) break;
    const x = hang.shift(); now = Math.max(now, x.t); await x.f(); for (let i = 0; i < 6; i++) await nghi();
  }
  now = het;
}

const { thuSauHa, nhanChienLoi, NHIP } = await import('../src/game/pvp-thu.js');
const { claimMail } = await import('../src/game/market.js');
const { onPvp, createPvp } = await import('../src/game/pvp.js');
const T = data.pvp.text, fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

// Hòm thư giả: thư có từ lúc toi (máy người gục trả nợ), nhận rồi thì thôi
function homThu(thu) {
  const N = { hoi: 0, thu,
    peekMail: async () => { N.hoi++; return thu.filter(x => x.toi <= now && !x.nhan).map(({ id, ly_do, noi_dung }) => ({ id, ly_do, noi_dung })); },
    takeMail: async ids => ({ thu: thu.filter(x => ids.includes(x.id) && !x.nhan).map(x => { x.nhan = true; return { id: x.id, ly_do: x.ly_do, noi_dung: x.noi_dung }; }) }) };
  return N;
}
function moi(N) {
  const g = { data, save: { bag: [], nextUid: 100, lingshi: 0, mats: {}, gems: {}, pills: {}, stats: { coins: 0 }, flags: {} }, player: { x: 50, y: 50, hp: 10, maxHp: 10 }, fx: [], time: 0,
    cloud: { run: async (fn, ok) => ok(await fn()) }, online: { me: { id: 'A' } }, others: { list: new Map([['B', { id: 'B', def: { name: 'Bé Ba' }, x: 60, y: 60 }]]) },
    chu: [], so: [], tieng: [], toast(t) { this.chu.push(t); }, number(...a) { this.so.push(a); }, sfx(n) { this.tieng.push(n); }, refreshStats() {}, persist() {}, screen: { shake() {} } };
  createPvp(g);   // đăng ký game.chienLoi như game thật (hẹn trả nợ cũ sau 20 giây: canTrade không đủ điều kiện nên bỏ qua)
  g.claim = gg => claimMail(gg, N);
  return g;
}
const coChu = (g, s) => g.chu.some(t => t.includes(s));
const loot = n => ({ coins: n, tu: 'Bé Ba' });

// 1. Ma đồ sát người, phòng ghi nợ (loot): báo ngay "đang về", máy người gục trả nợ sau 1,2 giây, lượt hỏi 2,5 giây nhận được: số bay lên, chữ báo của ai, Linh Thạch vào túi
{
  const N = homThu([{ id: 1, ly_do: 'ma_ha', noi_dung: loot(1234), toi: now + 1200 }]), g = moi(N);
  g.pvp.ma = 1;
  const { maPd } = await import('../src/game/pvp-ma.js');
  const realThu = thuSauHa;   // pvp-ma.js gọi thuSauHa với Hòm thư thật: ở đây chạy lại bằng Hòm thư giả cho cùng lần hạ
  maPd(g, { t: 'pd', k: 'giet', from: 'A', to: 'B', loot: 1, ma: 4 }, 'A', g.others.list.get('B'));
  assert.ok(coChu(g, fill(T.ma_kill, { name: 'Bé Ba', n: 4 })) && coChu(g, T.thu_cho), `ma đồ sát có ghi nợ: chữ báo phải nói chiến lợi phẩm đang về (${g.chu})`);
  hang.length = 0; g.pvp.thuCho = [];   // bỏ lượt hỏi Hòm thư thật (Node không có mạng), hỏi lại bằng Hòm thư giả
  realThu(g, 'Bé Ba', g.claim);
  await toi(3000);
  assert.ok(N.thu[0].nhan, 'lượt hỏi 2,5 giây phải nhận thư chiến lợi phẩm');
  assert.equal(g.save.lingshi, 1234, 'Linh Thạch vào túi');
  assert.ok(coChu(g, fill(T.thu_lt, { head: data.pvp.mail.ma_ha, got: `+1234 ${data.shop.name}`, name: 'Bé Ba' })), `chữ báo thu Linh Thạch của ai (${g.chu})`);
  assert.ok(g.so.some(a => String(a[2]).includes('+1.234')), 'số +1.234 Linh Thạch bay lên trên đầu');
  assert.ok(g.tieng.includes('pickup'), 'có tiếng nhặt');
  await toi(60000);
  assert.ok(!coChu(g, fill(T.thu_chua, { name: 'Bé Ba' })), 'đã nhận thì không báo "chưa có"');
  assert.ok(N.hoi <= 2, `đã nhận rồi thì thôi hỏi Hòm thư (${N.hoi} lần)`);
}

// 2. Ma đồ sát quá lượt thu trong ngày: điểm ma vẫn tăng, không ghi nợ → báo hết lượt, không hỏi Hòm thư
{
  const g = moi(homThu([]));
  g.pvp.ma = 10;
  const { maPd } = await import('../src/game/pvp-ma.js');
  hang.length = 0;
  maPd(g, { t: 'pd', k: 'giet', from: 'A', to: 'B', loot: 0, ma: 13 }, 'A', g.others.list.get('B'));
  assert.ok(coChu(g, fill(T.thu_het, { n: data.pvp.ma.lt_ngay })), `quá lượt: phải báo hết lượt thu hôm nay (${g.chu})`);
  assert.ok(!hang.length || !g.pvp.thuCho?.length, 'quá lượt: không chờ thư');
  // tin lặp (điểm ma không đổi, vd phòng không hỏi được Supabase): không nói hết lượt cho sai
  const g2 = moi(homThu([])); g2.pvp.ma = 13;
  maPd(g2, { t: 'pd', k: 'giet', from: 'A', to: 'B', loot: 0, ma: 13 }, 'A', g2.others.list.get('B'));
  assert.ok(!coChu(g2, T.thu_het.split('{n}')[0]), 'điểm ma không tăng: không báo hết lượt');
}

// 3. Thư không tới (người gục thoát game / không còn Linh Thạch): hết lượt chờ thì nói rõ vì sao
{
  hang.length = 0;
  const N = homThu([]), g = moi(N);
  thuSauHa(g, 'Bé Ba', g.claim);
  await toi(NHIP.at(-1) + 2000);
  assert.ok(coChu(g, fill(T.thu_chua, { name: 'Bé Ba' })), `chờ hết lượt mà không có thư: báo "chưa có" (${g.chu})`);
  assert.ok(N.hoi >= 3 && N.hoi <= NHIP.length, `hỏi Hòm thư ${N.hoi} lần trong lúc chờ`);
}

// 4. Hạ ba người liền nhau: không hỏi Hòm thư dồn dập (cách nhau ít nhất 2 giây), thư của ai báo người ấy
{
  hang.length = 0;
  const N = homThu([{ id: 5, ly_do: 'ma_ha', noi_dung: { coins: 50, tu: 'X' }, toi: now + 3000 }, { id: 6, ly_do: 'ma_ha', noi_dung: { coins: 70, tu: 'Y' }, toi: now + 9000 }]), g = moi(N);
  thuSauHa(g, 'X', g.claim); await toi(300); thuSauHa(g, 'Y', g.claim); await toi(300); thuSauHa(g, 'Z', g.claim);
  await toi(60000);
  assert.ok(N.hoi <= 6, `ba lần hạ liền: chỉ hỏi Hòm thư ${N.hoi} lần`);
  assert.ok(coChu(g, 'từ X') && coChu(g, 'từ Y') && coChu(g, fill(T.thu_chua, { name: 'Z' })) && !coChu(g, fill(T.thu_chua, { name: 'X' })), `báo đúng người (${g.chu})`);
}

// 5. Lượt tự nhận 90 giây (hay bảng Hòm thư) nhận thư chiến lợi phẩm: vẫn báo kiểu chiến lợi phẩm, không lẫn vào dòng chữ chung; thư khác vẫn vào dòng chung
{
  const N = homThu([{ id: 7, ly_do: 'pvp_ha', noi_dung: { coins: 900, tu: 'Bé Ba' }, toi: 0 }, { id: 8, ly_do: 'ban_hang', noi_dung: { coins: 300 }, toi: 0 }]), g = moi(N);
  const got = await claimMail(g, N);
  assert.equal(g.save.lingshi, 1200, 'nhận cả hai thư');
  assert.ok(coChu(g, fill(T.thu_lt, { head: data.pvp.mail.pvp_ha, got: `+900 ${data.shop.name}`, name: 'Bé Ba' })), `thư chiến lợi phẩm PvP báo riêng (${g.chu})`);
  assert.ok(got.length === 1 && got[0].includes('+300') && !got.some(x => x.includes('+900')), `dòng chữ chung chỉ còn thư bán hàng (${got})`);
}

// 6. PvP thường (hai người tắt khiên): hạ người có nợ cũng báo chiến lợi phẩm đang về
{
  hang.length = 0;
  const g = moi(homThu([]));
  onPvp(g, { t: 'pd', from: 'A', to: 'B', loot: 1, n: 30, by: 'A' });
  assert.ok(coChu(g, fill(T.kill, { name: 'Bé Ba' })) && coChu(g, T.thu_cho), `PvP thường có nợ: báo đang về (${g.chu})`);
  assert.equal(g.pvp.thuCho?.length, 1, 'PvP thường có nợ: chờ thư');
  const g2 = moi(homThu([]));
  onPvp(g2, { t: 'pd', from: 'A', to: 'B', loot: 0, n: 30, by: 'A' });
  assert.ok(!coChu(g2, T.thu_cho) && !g2.pvp.thuCho?.length, 'PvP thường không nợ (vd cờ đỏ): không hứa chiến lợi phẩm');
}

console.log(`✅ Thu chiến lợi phẩm: báo lúc hạ, nhận thư trong ${NHIP[0] / 1000} giây, báo của ai, hết lượt, không có thư, lượt 90 giây`);
