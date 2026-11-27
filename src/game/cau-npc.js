// Lão Ngư Ông ở Bến Câu Bích Thủy (data/fishing.json → npc; đặt bằng tools/the-gioi/tk_moi.py). Lần đầu gặp tặng mồi (qua_gap); quầy bán
// mồi (gói 10 con), cần câu (máy chủ p2d_nl_mua cùng giá data/market.json → quick.price); thu mua đồ câu được và châu ra Linh Thạch, khai trai
// (máy chủ p2d_cau_doi: giá theo cảnh giới, trần mỗi ngày, ngọc khai ra do máy chủ quay; chủ dự án 24/11/2026 01:2x "câu cá không lên linh
// khí nên bán linh thạch phải nhanh gấp đôi hoặc gấp 3"); quà sổ câu theo mốc số loài; hỏi chuyện câu. Chơi khách (chưa đăng nhập): tính ở máy.
import { FC, cauOf, coCan, dungCan, soLoai, tongLoai, ngayVN, phamOf } from './cau-do.js';
import { giaThu, tranNgay } from './cau-mon.js';
import { coins, addCoins } from './shop.js';
import { buyMats } from './quick-buy.js';
import { pickQty } from './so-luong.js';
import { gemInfo } from './items.js';

const vn = n => Math.round(n || 0).toLocaleString('vi-VN');
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));
const net = async () => (await import('../net/ky-mon.js')).kyCalls;

export async function talkLaoNgu(game, npc) {
  const D = game.data, F = D.fishing, X = F.texts, c = cauOf(game.save), ten = npc.def.name;
  if (!c.gap) {   // quà ra mắt
    c.gap = true;
    for (const [k, n] of Object.entries(F.qua_gap)) game.save.mats[k] = (game.save.mats[k] || 0) + n;
    if (!c.moi) c.moi = Object.keys(F.qua_gap)[0];
    game.persist();
    await game.dialog.say([[ten, X.gap]]);
  }
  await quaSo(game, ten);
  let msg = X.npc_chao;
  for (;;) {
    const opts = [{ id: 'mua', label: X.npc_mua, color: '#f2c94c' }, { id: 'ban', label: X.npc_ban, color: '#7dff8a' }];
    if (Object.keys(F.khai).some(k => k !== '_' && game.save.mats?.[k] > 0)) opts.push({ id: 'khai', label: X.npc_khai, color: '#b8a8ff' });
    opts.push({ id: 'hoi', label: X.npc_hoi }, { id: 'thoi', label: X.npc_thoi, desc: fill(X.so_nut, { n: soLoai(game.save), tong: tongLoai(D) }) });
    const pick = await game.dialog.choose(`${ten}: ${msg}`, opts);
    if (!pick || pick === 'thoi') return;
    if (pick === 'mua') { await quay(game, npc); msg = X.npc_chao; continue; }
    if (pick === 'ban') { msg = await ban(game) || X.npc_chao; continue; }
    if (pick === 'khai') { msg = await khai(game) || X.npc_chao; continue; }
    if (pick === 'hoi') { msg = X.hoi[Math.floor(Math.random() * X.hoi.length)]; continue; }
  }
}

// Quầy: mồi gói 10 con, cần câu chưa có
async function quay(game, npc) {
  const D = game.data, F = D.fishing, s = game.save;
  for (;;) {
    const list = F.shop.filter(x => !x.can || !coCan(game, x.ref));
    const opts = list.map((x, i) => ({ id: String(i), label: D.cave.materials[x.ref].name, spr: 'ui.vk-' + x.ref, tag: x.n > 1 ? '×' + x.n : (x.can ? '' : ''), price: vn(x.price), cur: 'ui.ic-linh-thach',
      desc: x.can ? '' : `Có ${vn(s.mats?.[x.ref] || 0)}`, dim: coins(s) < x.price, color: '#f2c94c' }));
    opts.push({ id: 'out', label: 'Thôi', desc: `Bạn có ${vn(coins(s))} Linh Thạch` });
    const pick = await game.dialog.choose(`${npc.def.name}: ${F.texts.npc_mua}.`, opts);
    if (!pick || pick === 'out') return;
    const x = list[+pick];
    if (!x) return;
    const max = x.can ? 1 : Math.min(Math.floor(coins(s) / Math.max(1, x.price)), Math.floor(999 / x.n));
    const q = max < 1 ? 1 : x.can ? 1 : await pickQty(game, `${D.cave.materials[x.ref].name} ×${x.n}: ${vn(x.price)} mỗi gói`, x.price, max);
    if (!q) continue;
    const r = await buyMats(game, { [x.ref]: x.n * q }, false);
    if (!r.ok) { game.toast(r.msg || 'Không đủ Linh Thạch.', 2); game.sfx('hurt'); continue; }
    if (x.can) { dungCan(game, x.ref); game.toast(`Đã mua ${D.cave.materials[x.ref].name}, dùng luôn.`, 2); }
    else { const c = cauOf(s); if (!c.moi) c.moi = x.ref; game.toast(`Đã mua ${x.n * q} ${D.cave.materials[x.ref].name}.`, 1.8); }
    game.cauTheVe?.();
  }
}

// Đồ bán được đang có: loài câu được, châu (mồi, cần không thu)
function banDuoc(game, toiDa = 9) {
  const D = game.data, F = D.fishing, s = game.save;
  return Object.keys(s.mats || {}).filter(id => s.mats[id] > 0 && F.ban.gia[id] && phamOf(D, id) <= toiDa).map(id => [id, s.mats[id]]);
}
const reTruoc = (game, ds) => [...ds].sort((a, b) => giaThu(game, a[0]) - giaThu(game, b[0]));
// Ước số bán được như máy chủ: rẻ trước, dừng ở trần ngày; du = số món còn lại vì hết tiền
function uoc(game, ds, con) {
  let n = 0, lt = 0, du = 0;
  const lay = {};
  for (const [id, c] of reTruoc(game, ds)) {
    const g = giaThu(game, id), k = Math.min(c, g ? Math.floor(con / g) : 0);
    n += k; lt += g * k; con -= g * k; du += c - k; lay[id] = k;
  }
  return { n, lt, du, lay };
}

async function ban(game) {
  const D = game.data, X = D.fishing.texts, c = cauOf(game.save), s = game.save;
  const con = Math.max(0, tranNgay(game) - (c.ban?.d === ngayVN() ? c.ban.lt : 0));
  const tat = banDuoc(game), duoi = banDuoc(game, 2);
  if (!tat.length) return X.ban_trong;
  const u = uoc(game, tat, con), ud = duoi.length && duoi.length < tat.length ? uoc(game, duoi, con) : null, opts = [];
  if (u.n) opts.push({ id: 'tat', label: fill(X.ban_tat_ca, { n: vn(u.n), lt: vn(u.lt) }), color: '#7dff8a' });
  if (ud?.n && ud.n < u.n) opts.push({ id: 'duoi', label: fill(X.ban_duoi, { n: vn(ud.n), lt: vn(ud.lt) }) });
  // con quý nhất còn bán riêng được mà "Bán hết" (rẻ trước) không tới lượt: cá Tiên, Thượng Cổ
  const quy = u.du > 0 ? tat.filter(([id, c]) => giaThu(game, id) <= con && u.lay[id] < c).sort((a, b) => giaThu(game, b[0]) - giaThu(game, a[0]))[0] : null;
  if (quy) opts.push({ id: 'rieng', label: fill(X.ban_rieng, { ten: D.cave.materials[quy[0]].name, lt: vn(giaThu(game, quy[0])) }), color: '#f2c94c' });
  if (!opts.length) return X.ban_het;
  opts.push({ id: 'thoi', label: X.npc_thoi });
  const pick = await game.dialog.choose(fill(X.ban_chon, { con: vn(con) }), opts);
  if (!['tat', 'duoi', 'rieng'].includes(pick)) return null;
  const ds = pick === 'rieng' ? [[quy[0], 1]] : reTruoc(game, pick === 'tat' ? tat : duoi);
  const truoc = Object.fromEntries(ds.map(([id]) => [id, s.mats[id] || 0]));
  const r = await doi(game, Object.fromEntries(ds), {});
  if (!r?.lt) return r?.msg ?? null;
  const ban1 = ds.filter(([id]) => (s.mats[id] || 0) < truoc[id]);
  let msg = ban1.some(([id]) => giaThu(game, id) >= tranNgay(game)) ? X.ban_quy : r.msg;
  const con2 = pick === 'rieng' ? 0 : ds.reduce((a, [id]) => a + (s.mats[id] || 0), 0);
  if (con2 > 0) msg += ' ' + fill(X.ban_du, { n: vn(con2) });
  return fill(msg, { lt: vn(r.lt) });
}

async function khai(game) {
  const D = game.data, F = D.fishing, X = F.texts, s = game.save, mo = {};
  for (const k of Object.keys(F.khai)) if (k !== '_' && s.mats?.[k] > 0) mo[k] = Math.min(50, s.mats[k]);
  const n = Object.values(mo).reduce((a, b) => a + b, 0);
  if (!n) return X.khai_trong;
  const ok = await game.dialog.choose(fill(X.khai_chon, { n }), [{ id: 'co', label: X.npc_khai, color: '#b8a8ff' }, { id: 'thoi', label: X.npc_thoi }]);
  if (ok !== 'co') return null;
  return (await doi(game, {}, mo))?.msg ?? null;
}

// Gửi máy chủ (hoặc tính ở máy khi chơi khách), sửa bản lưu trong máy theo kết quả; trả { msg: câu Lão Ngư Ông nói, lt: Linh Thạch nhận }
async function doi(game, banDs, mo) {
  const D = game.data, X = D.fishing.texts;
  let r;
  if (game.cloud) {
    if (game.kyBusy) return null;
    game.kyBusy = true;
    try { r = await game.cloud.run(async () => (await net()).cauDoi(banDs, mo), kq => apDung(game, kq)); }
    catch (e) { const m = String(e?.message || ''); return { msg: m.includes('qua_nhanh') ? X.cham : m.includes('het_tran') ? X.ban_het : X.loi, lt: 0 }; }
    finally { game.kyBusy = false; }
  } else { r = tinhMay(game, banDs, mo); apDung(game, r); }
  const lt = r?.them?.coins || 0, gems = Object.entries(r?.them?.gems || {}), chau = Object.entries(r?.them?.mats || {});
  if (lt) game.sfx('pickup');
  if (Object.keys(mo).length) {
    const kq = [...chau.map(([k, n]) => `${D.cave.materials[k]?.name} ×${n}`), ...gems.map(([k, n]) => `${gemInfo(D, k).name} ×${n}`)];
    if (gems.length) game.sfx('levelup');
    return { msg: fill(X.khai_ok, { n: Object.values(r?.tru?.mats || {}).reduce((a, b) => a + b, 0), kq: kq.join(', ') || X.khai_rong }), lt };
  }
  return { msg: lt ? X.ban_ok : X.ban_het, lt };
}

// Sửa bản lưu trong máy theo kết quả máy chủ (hoặc kết quả tính ở máy)
function apDung(game, r) {
  if (!r) return;
  const s = game.save, c = cauOf(s);
  for (const [k, n] of Object.entries(r.tru?.mats || {})) s.mats[k] = Math.max(0, (s.mats[k] || 0) - n);
  for (const [k, n] of Object.entries(r.them?.mats || {})) s.mats[k] = (s.mats[k] || 0) + n;
  for (const [k, n] of Object.entries(r.them?.gems || {})) s.gems[k] = (s.gems[k] || 0) + n;
  if (r.them?.coins) addCoins(game, r.them.coins, 'ban-cau');
  // sổ đã bán hôm nay: máy chủ báo còn mua được bao nhiêu (con) thì lấy theo đó, chơi khách thì tự cộng
  if (r.con != null) c.ban = { d: ngayVN(), lt: Math.max(0, tranNgay(game) - r.con) };
  else if (r.them?.coins) { if (c.ban?.d !== ngayVN()) c.ban = { d: ngayVN(), lt: 0 }; c.ban.lt += r.them.coins; }
  game.persist(); game.cauTheVe?.();
}

// Chơi khách: cùng luật với máy chủ (tools/cau-ca-sql.py); bài thử tools/cau-ca.test.mjs gọi thẳng
export function tinhMay(game, banDs, mo) {
  const D = game.data, F = D.fishing, s = game.save, c = cauOf(s), out = { tru: { mats: {} }, them: { coins: 0, mats: {}, gems: {} } };
  let con = Math.max(0, tranNgay(game) - (c.ban?.d === ngayVN() ? c.ban.lt : 0));
  for (const [id, n0] of Object.entries(banDs)) {
    const g = giaThu(game, id), n = Math.min(n0, s.mats?.[id] || 0, g ? Math.floor(con / g) : 0);
    if (n < 1) continue;
    out.tru.mats[id] = n; out.them.coins += g * n; con -= g * n;
  }
  const loai = Object.keys(D.items.gems.types);
  for (const [id, n0] of Object.entries(mo)) {
    const K = F.khai[id], n = Math.min(n0, s.mats?.[id] || 0, 50);
    if (!K || n < 1) continue;
    out.tru.mats[id] = (out.tru.mats[id] || 0) + n;
    for (let i = 0; i < n; i++) {
      for (const [ma, p, so] of K.chau) if (Math.random() < p) out.them.mats[ma] = (out.them.mats[ma] || 0) + so;
      const [p, a, b] = K.ngoc;
      if (Math.random() < p) { const k = `${loai[Math.floor(Math.random() * loai.length)]}:${a + Math.floor(Math.random() * (b - a + 1))}`; out.them.gems[k] = (out.them.gems[k] || 0) + 1; }
    }
  }
  return out;
}

// Quà sổ câu: đủ n loài thì nhận (mỗi mốc một lần)
async function quaSo(game, ten) {
  const D = game.data, F = D.fishing, X = F.texts, c = cauOf(game.save), n = soLoai(game.save);
  for (const m of F.so_ca.moc) {
    if (n < m.n || c.moc.includes(m.n)) continue;
    c.moc.push(m.n);
    for (const [k, v] of Object.entries(m.qua)) game.save.mats[k] = (game.save.mats[k] || 0) + v;
    game.persist(); game.sfx('levelup');
    await game.dialog.say([[ten, fill(X.so_qua, { n: m.n, qua: Object.entries(m.qua).map(([k, v]) => `${D.cave.materials[k].name} ×${v}`).join(', ') })]]);
  }
}
