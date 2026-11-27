// Mục Kỹ năng trong bảng Nhân vật → Công pháp (chủ dự án 21/11/2026 17:23: "kỹ năng thì nằm trong phần công pháp"; src/ui/self-panel.js gọi renderKyNang).
// 23/11/2026 12:43 (chủ dự án: "mấy ô có thể làm nhỏ thì làm nhỏ, thành ô giống kho trang bị, ấn vào để xem chi tiết"): trên là ba ô đang mang,
// dưới là lưới ô khung phẩm theo cấp sách (data/ky-nang.json → khung) như Kho; kỹ năng chưa học mờ, có khoá. Chạm ô đang mang: chọn ô đó (vàng)
// và mở kỹ năng trong ô; chạm kỹ năng: tấm chi tiết như món trang bị: mang vào ô 1 / 2 / 3, SÁCH (ghép hai cuốn cùng cấp thành một cuốn cấp
// trên, chép sách trống), KHẢM TÍNH CHẤT (ô mở theo cấp sách). Logic ở src/game/ky-nang.js; ô, tấm chi tiết dùng chung src/ui/o-luoi.js.
import { KN, knOn, knCua, knO, knDat, knDef, knCap, knDem, knThuong, ghepDuoc, ghepSach, knSoO, knKham, khamVao, thaoRa, tinhHop, chepSach } from '../game/ky-nang.js';
import { manaCost } from '../game/mana.js';
import { totalLayer } from '../game/stats.js';
import { el, fill, so, olCss, khungCap, oVuong, luoi, hinhDau, tamDau, nut, hangNut } from './o-luoi.js';

const hinh = (d, id) => { const s = d.skills[id], spr = d.art.sprites['ui.vk-' + id] || d.art.sprites['pxi.' + id] || d.art.sprites['vfx.' + id] || d.art.sprites['icon.' + (s.icon || s.fx || 'orb')]; return spr ? `url("${spr.file}?v=${spr.v}")` : ''; };

export function renderKyNang(game, st, mid, bar, changed) {
  olCss();
  const D = game.data, K = KN(D), X = K.text, wrap = el('div', 'ol');
  bar.hidden = true; bar.replaceChildren();
  if (!knOn(game)) { mid.classList.remove('sheet'); mid.replaceChildren(wrap); return; }
  const lo = knO(game), ds = knCua(game);
  if (!(st.knSlot >= 0 && st.knSlot < 3)) st.knSlot = Math.max(0, lo.indexOf(null));
  const veLai = (luu = true) => { if (luu) game.persist(); changed(false); };
  const khung = id => { const lv = knCap(game, id); return lv ? khungCap(D, K.khung, lv) : null; };
  if (st.knSel && ds.includes(st.knSel)) { chiTiet(game, st, mid, st.knSel, lo, khung, veLai); return; }
  st.knSel = null;
  mid.classList.remove('sheet');
  // Ba ô đang mang
  const hang = el('div', 'ol-hang');
  lo.forEach((id, i) => {
    const o = oVuong(D, { o: id && khung(id), ic: id ? hinh(D, id) : null, tl: id ? knCap(game, id) : '', sel: i === st.knSlot, trong: !id, moi: st.olMoi === 'kn' + i, ten: id ? D.skills[id].name : fill(X.mang_o, { i: i + 1 }),
      onClick: () => { st.knSlot = i; st.knSel = id || null; game.sfx?.('click'); veLai(false); } });
    const o2 = el('span'); o2.append(o, el('small', 'ol-nhan', id ? D.skills[id].name : fill(X.mang_o, { i: i + 1 }))); hang.append(o2);
  });
  wrap.append(hang); st.olMoi = null;
  const trong = game.save.knTrong | 0;   // sách trống từ mốc nhiệm vụ chính 5, 10, 15...
  if (trong > 0) wrap.append(el('div', 'ol-chip', fill(X.trong_ngan, { n: trong })));
  wrap.append(el('div', 'ol-ghi', ds.some(id => knCap(game, id)) ? X.sub : X.chua));
  wrap.append(luoi(ds.map(id => {
    const lv = knCap(game, id);
    return oVuong(D, { o: khung(id), ic: hinh(D, id), tl: lv || '', khoa: !lv, mang: lo.includes(id), ten: D.skills[id].name,
      onClick: () => { st.knSel = id; game.sfx?.('click'); veLai(false); } });
  })));
  const keep = mid.scrollTop; mid.replaceChildren(wrap); mid.scrollTop = keep;
}

// Tấm chi tiết một kỹ năng (đã học hay chưa)
function chiTiet(game, st, mid, id, lo, khung, veLai) {
  const D = game.data, K = KN(D), X = K.text, s = knDef(game, id), lv = knCap(game, id), R = D.realms, n = totalLayer(game.save, R);
  const moc = t => `${R.names[Math.floor(t / R.layers)]} tầng ${t % R.layers + 1}`, box = el('div', 'ol-tam');
  mid.classList.add('sheet');
  const dang = lo.indexOf(id), phu = lv ? [fill(X.cap, { lv }), dang >= 0 && fill(X.mang_o, { i: dang + 1 })].filter(Boolean).join(' · ') : X.khoa_truyen;
  box.append(tamDau(hinhDau(khung(id), hinh(D, id)), s.name, phu, () => { st.knSel = null; veLai(false); }));
  box.append(el('div', 'd-line', lv ? fill(X.day, { ai: s.day }) : fill(X.mo_khi, { ai: s.day })));
  box.append(el('div', 'd-line', `${fill(X.hoi, { x: so(s.cd) })} · ${fill(X.ton, { x: manaCost(game, id, s) })}${lv > 1 ? ' · ' + fill(X.sat_thuong, { x: Math.round((knThuong(game, id) - 1) * 100) }) : ''}`));
  box.append(el('div', 'd-line', s.desc || ''));
  if (!lv) { mid.replaceChildren(box); return; }
  // Mang vào ô: ba nút, ô đang chọn là nút chính
  box.append(hangNut(...[0, 1, 2].map(i => nut(D, fill(X.mang_o, { i: i + 1 }), lo[i] === id ? X.nho_dang : lo[i] ? D.skills[lo[i]].name : X.nho_trong, () => {
    knDat(game, i, id); st.knSlot = i; st.knSel = null; st.olMoi = 'kn' + i; game.sfx('pickup'); veLai(false);   // về lưới, ô vừa mang loé lên
  }, { chinh: i === st.knSlot && lo[i] !== id, tat: lo[i] === id, ico: 'mac-tot' }))));
  // Sách: đang có những cuốn nào, chép sách trống, ghép hai cuốn cùng cấp
  const dem = knDem(game, id), cao = dem.find(([l]) => ghepDuoc(game, id, l)), trong = game.save.knTrong | 0;
  box.append(el('div', 'd-label', fill(X.dem, { ds: dem.map(([l, c]) => fill(X.cuon, { n: c, lv: l })).join(', ') })));
  const sach = [];
  if (cao) sach.push(nut(D, X.ghep_ngan, fill(X.ghep, { n: K.sach.ghep, a: cao[0], b: cao[0] + 1 }), () => {
    if (ghepSach(game, id, cao[0])) { game.sfx('levelup'); if (knCap(game, id) > lv) game.toast(fill(X.ghep_ok, { ten: s.name, lv: knCap(game, id) }), 2.2); veLai(); }
  }, { chinh: true, ico: 'ghep' }));
  if (trong > 0) sach.push(nut(D, X.chep_ngan, `×${trong}`, () => { if (chepSach(game, id)) { game.sfx('pickup'); veLai(); } }, { ico: 'tab-bi-kip' }));
  if (sach.length) box.append(hangNut(...sach));
  if (!cao) box.append(el('div', 'd-line', lv >= K.sach.max ? X.toi_da : fill(X.ghep_thieu, { n: K.sach.ghep, b: lv + 1 })));
  // Khảm tính chất
  const soO = knSoO(game, lv), co = knKham(game, id), ke = K.kham.o.find(x => lv < x);
  box.append(el('div', 'd-label', [fill(X.kham_dem, { a: co.length, b: soO }), ke ? fill(X.o_ke, { lv: ke }) : ''].filter(Boolean).join(' · ')));
  for (const [m, T] of Object.entries(K.kham.tinh)) {
    if (!tinhHop(game, id, m)) continue;
    const da = co.includes(m), khoa = n < T.at, b = el('button', 'kn-t' + (da ? ' co' : ''));
    b.append(el('b', null, T.ten), el('small', null, khoa ? fill(X.kham_khoa, { moc: moc(T.at) }) : da ? `${T.mo_ta} · ${X.thao}` : T.mo_ta));
    b.disabled = !da && (khoa || co.length >= soO);
    b.onclick = () => { if (da) thaoRa(game, id, m); else if (!khamVao(game, id, m)) return; game.sfx(da ? 'click' : 'pickup'); veLai(); };
    box.append(b);
  }
  const keep = mid.scrollTop; mid.replaceChildren(box); mid.scrollTop = keep;
}
