// Mục Cá trong bảng Nhân vật (chủ dự án 24/11/2026 00:38: "giống như mục công pháp thì có công pháp, thân pháp và kỹ năng, thì mục cá cũng có
// cá, mồi và cần"; thêm Món cho món nấu từ thủy sản). Cá: giỏ đồ câu được (cá, tôm cua, trai sò, bảo vật chìm, châu) và Sổ câu (mọi loài, loài
// chưa câu được tối màu, chỗ hay gặp); Mồi: móc mồi nào; Cần: dùng cần nào; Món: nấu, ăn (chung đan độc với đan). Ô như Kho (src/ui/o-luoi.js),
// chạm ô xem tấm chi tiết. self-panel.js gọi renderCau. Số, chữ: data/fishing.json.
import { FC, cauOf, canDung, moiDung, dungCan, dungMoi, coCan, soLoai, tongLoai, phamOf, phamTen, hintOf } from '../game/cau-do.js';
import { nau, nauDuoc, tongThuySan, phongSinh, giaThu } from '../game/cau-mon.js';
import { usePill, qiPillLeft, qiPillRate } from '../game/cave.js';
import { caUrl } from '../render/ca-hinh.js';
import { cauCss } from './cau-the.js';
import { el, fill, so, olCss, khungPham, oVuong, luoi, hinhDau, tamDau, nut, hangNut } from './o-luoi.js';

const vn = n => Math.round(n || 0).toLocaleString('vi-VN');
const ic = (D, id) => { const s = D.art.sprites['ui.vk-' + id]; if (s) return `url("${s.file}?v=${s.v}")`; const u = caUrl(D, id); return u ? `url("${u}")` : ''; };
const ten = (D, id) => D.cave.materials[id]?.name || D.cave.pills[id]?.name || id;

export function renderCau(game, st, mid, bar, changed) {
  olCss(); cauCss();
  bar.hidden = true; bar.replaceChildren();
  if (st.cauSel) { const ok = chiTiet(game, st, mid, changed); if (ok) return; st.cauSel = null; }
  mid.classList.remove('sheet');
  const wrap = el('div', 'ol'), sub = st.sub;
  if (sub === 'moi') luoiMoi(game, st, wrap, changed);
  else if (sub === 'can') luoiCan(game, st, wrap, changed);
  else if (sub === 'mon') luoiMon(game, st, wrap, changed);
  else luoiGio(game, st, wrap, changed);
  const keep = mid.scrollTop; mid.replaceChildren(wrap); mid.scrollTop = keep;
}

const chon = (st, changed, id) => () => { st.cauSel = id; changed(false); };

function luoiGio(game, st, wrap, changed) {
  const D = game.data, F = D.fishing, X = F.texts, s = game.save, c = cauOf(s);
  const hang = el('div', 'cau-hang'), gio = el('button', st.cauSo ? '' : 'on', X.gio_nut), so_ = el('button', st.cauSo ? 'on' : '', fill(X.so_nut, { n: soLoai(s), tong: tongLoai(D) }));
  gio.onclick = () => { st.cauSo = false; changed(false); }; so_.onclick = () => { st.cauSo = true; changed(false); };
  hang.append(gio, so_); wrap.append(hang);
  wrap.append(el('div', 'ol-ghi vang', fill(X.phuc, { n: c.phuc, max: F.phuc.max, k: so(F.phuc.k) })));
  if (st.cauSo) {
    wrap.append(el('div', 'ol-ghi', X.so_ghi));
    const ids = Object.keys(F.fish).sort((a, b) => phamOf(D, a) - phamOf(D, b));
    wrap.append(luoi(ids.map(id => {
      const o = oVuong(D, { o: khungPham(D, phamOf(D, id)), ic: ic(D, id), br: c.so[id] ? vn(c.so[id]) : '?', ten: ten(D, id), onClick: chon(st, changed, id) });
      if (!c.so[id]) o.classList.add('cau-chua');
      return o;
    })));
    return;
  }
  const ids = Object.keys(s.mats || {}).filter(id => s.mats[id] > 0 && (F.fish[id] || D.cave.materials[id]?.loai === 'chau'))
    .sort((a, b) => phamOf(D, b) - phamOf(D, a) || ten(D, a).localeCompare(ten(D, b), 'vi'));
  if (!ids.length) wrap.append(el('div', 'ol-ghi', X.gio_trong));
  wrap.append(luoi(ids.map(id => oVuong(D, { o: khungPham(D, phamOf(D, id)), ic: ic(D, id), br: vn(s.mats[id]), ten: ten(D, id), onClick: chon(st, changed, id) })), 20));
}

function luoiMoi(game, st, wrap, changed) {
  const D = game.data, F = D.fishing, X = F.texts, s = game.save, md = moiDung(game);
  wrap.append(el('div', 'ol-ghi vang', md ? `${X.dang_dung}: ${ten(D, md)} ×${vn(s.mats[md])}` : X.the_tran));
  const ids = Object.keys(F.moi);
  if (!ids.some(id => s.mats?.[id] > 0)) wrap.append(el('div', 'ol-ghi', X.moi_trong));
  wrap.append(luoi(ids.map(id => oVuong(D, { o: khungPham(D, phamOf(D, id)), ic: ic(D, id), br: vn(s.mats?.[id] || 0), khoa: !(s.mats?.[id] > 0), mang: id === md, ten: ten(D, id), onClick: chon(st, changed, id) }))));
}

function luoiCan(game, st, wrap, changed) {
  const D = game.data, F = D.fishing, X = F.texts, cd = canDung(game);
  wrap.append(el('div', 'ol-ghi vang', `${X.dang_dung}: ${ten(D, cd)}`));
  wrap.append(luoi(Object.keys(F.can).map(id => oVuong(D, { o: khungPham(D, phamOf(D, id)), ic: ic(D, id), khoa: !coCan(game, id), mang: id === cd, ten: ten(D, id), onClick: chon(st, changed, id) }))));
}

function luoiMon(game, st, wrap, changed) {
  const D = game.data, F = D.fishing, X = F.texts, s = game.save, L = D.cave.qi_pill_day;
  wrap.append(el('div', 'ol-ghi', X.mon_ghi));
  const con = qiPillLeft(game);
  wrap.append(el('div', 'ol-ghi vang', con > 0 ? L.left.replace('{n}', con) : fill(X.an_doc, { pct: Math.round(qiPillRate(game) * 100) })));
  wrap.append(luoi(Object.keys(F.mon).map(id => {
    const co = s.pills?.[id] || 0, nd = nauDuoc(game, id);
    return oVuong(D, { o: khungPham(D, F.mon[id].pham), ic: ic(D, id), br: co ? vn(co) : '', tl: nd ? '+' + nd : '', khoa: !co && !nd, ten: ten(D, id), onClick: chon(st, changed, id) });
  })));
}

// Tấm chi tiết mã đang chọn; false khi mã không còn hợp lệ ở mục này
function chiTiet(game, st, mid, changed) {
  const D = game.data, F = D.fishing, X = F.texts, s = game.save, c = cauOf(s), id = st.cauSel, sub = st.sub, box = el('div', 'ol-tam');
  const p = phamOf(D, id), t = phamTen(D, p), dong = () => { st.cauSel = null; changed(false); };
  const head = (phu) => box.append(tamDau(hinhDau(khungPham(D, p), ic(D, id)), ten(D, id), phu, dong));
  const line = txt => box.append(el('div', 'd-line', txt));
  mid.classList.add('sheet');
  if (sub === 'moi' && F.moi[id]) {
    const m = F.moi[id], M = X.moi_cs, co = s.mats?.[id] || 0, dang = moiDung(game) === id;
    head(`${t.name} · ${fill(X.d_co, { n: vn(co) })}`);
    if (m.may !== 1) line(fill(M.may, { x: so(m.may) }));
    if (m.nhanh < 1) line(fill(M.nhanh, { x: Math.round((1 - m.nhanh) * 100) }));
    if (m.tag) line(fill(M.tag, { ds: Object.keys(m.tag).map(k => `${X.tag_ten[k] || k} ×${m.tag[k]}`).join(', ') }));
    if (m.pk) m.pk.forEach((x, i) => line(fill(M.pk, { pham: phamTen(D, i).name, x: so(x) })));
    if (Object.values(F.fish).some(f => f.moi === id)) line(M.thuong_co);
    line(D.cave.materials[id].desc);
    line(`${X.mua_o}: ${vn(m.gia * 10)} Linh Thạch / 10 con`);
    box.append(hangNut(nut(D, dang ? X.dang_dung : X.dung_moi, '', () => { dungMoi(game, id); game.cauTheVe?.(); dong(); }, { chinh: !dang && co > 0, tat: dang || !co }),
      nut(D, X.bo_moi, '', () => { dungMoi(game, null); game.cauTheVe?.(); dong(); }, { tat: !moiDung(game) })));
  } else if (sub === 'can' && F.can[id]) {
    const m = F.can[id], M = X.can_cs, co = coCan(game, id), dang = canDung(game) === id;
    head(t.name);
    line(fill(M.toi_da, { pham: phamTen(D, m.toi_da).name }));
    if (m.nhanh < 1) line(fill(M.nhanh, { x: Math.round((1 - m.nhanh) * 100) }));
    if (m.may > 1) line(fill(M.may, { x: so(m.may) }));
    if (m.doi) line(fill(M.doi, { x: Math.round(m.doi * 100) }));
    if (m.cua_so) line(fill(M.cua_so, { x: so(m.cua_so) }));
    line(fill(M.gc, { x: so(m.vung), n: m.ben }));
    line(D.cave.materials[id].desc);
    if (!co) line(`${X.mua_o}: ${vn(m.gia)} Linh Thạch`);
    box.append(hangNut(nut(D, dang ? X.dang_dung : X.dung_can, '', () => { dungCan(game, id); dong(); }, { chinh: co && !dang, tat: !co || dang })));
  } else if (sub === 'mon' && F.mon[id]) {
    const m = F.mon[id], P = D.cave.pills[id], co = s.pills?.[id] || 0, nd = nauDuoc(game, id), khoa = (P.use.realm || 0) > (s.realm || 0);
    head(`${t.name} · ${fill(X.d_co, { n: vn(co) })}`);
    line(P.desc);
    line(fill(X.d_nau, { mon: P.name, n: m.can, pham: t.name }) + ` · có ${vn(tongThuySan(game, m.pham))}`);
    if (khoa) line(fill(X.an_khoa, { realm: D.realms.names[P.use.realm] }));
    box.append(hangNut(
      nut(D, X.nau, `${m.can} → 1`, () => { const k = nau(game, id, 1); game.toast(k ? fill(X.nau_ok, { n: k, mon: P.name }) : fill(X.nau_thieu, { n: m.can, pham: t.name }), 1.8); changed(); }, { chinh: nd > 0 && !co, tat: nd < 1 }),
      nd > 1 && nut(D, fill(X.nau_het, { n: nd }), '', () => { const k = nau(game, id, nd); game.toast(fill(X.nau_ok, { n: k, mon: P.name }), 1.8); changed(); }),
      nut(D, X.an, '', () => { const msg = usePill(game, id); game.toast(msg ? `${P.name}: ${msg}` : khoa ? fill(X.an_khoa, { realm: D.realms.names[P.use.realm] }) : 'Lúc này ăn không có tác dụng.', 2.2); if (msg) game.sfx('ca.an', 0.7); changed(); }, { chinh: co > 0 && !khoa, tat: !co || khoa })));
  } else if (sub === 'ca' && F.fish[id] || (sub === 'ca' && D.cave.materials[id]?.loai === 'chau')) {
    const f = F.fish[id], co = s.mats?.[id] || 0, nhom = f ? X.nhom[f.nhom] : X.nhom.chau;
    if (!co && !st.cauSo) return false;
    head(`${fill(X.d_nhom, { nhom, pham: t.name })}${co ? ' · ' + fill(X.d_co, { n: vn(co) }) : ''}`);
    if (!c.so[id] && f) line(X.chua_cau);
    if (c.so[id]) line(fill(X.d_da, { n: vn(c.so[id]) }) + (c.ky[id] ? ' · ' + fill(X.d_ky, { cm: so(c.ky[id]) }) : ''));
    if (f) line(fill(X.d_o, { hint: hintOf(D, id) }));
    if (giaThu(game, id)) line(fill(X.d_gia, { gia: vn(giaThu(game, id)) }));
    if (f?.nhom === 'trai') line(X.d_khai);
    line(D.cave.materials[id]?.desc || '');
    const mon = f && F.mon_nhom.includes(f.nhom) && Object.keys(F.mon).find(k => F.mon[k].pham === p);
    if (co) box.append(hangNut(
      mon && nut(D, X.nau, D.cave.pills[mon].name, () => { st.sub = 'mon'; st.cauSel = mon; changed(false); }, { chinh: nauDuoc(game, mon) > 0 }),
      f && nut(D, X.b_phong, fill(X.b_phong_nho, { p: p + 1 }), () => { const k = phongSinh(game, id); game.toast(k ? fill(X.phong_ok, { name: ten(D, id), p: k, n: c.phuc, max: F.phuc.max }) : X.phong_day, 1.8); changed(); }, { tat: c.phuc >= F.phuc.max })));
  } else return false;
  const keep = mid.scrollTop; mid.replaceChildren(box); mid.scrollTop = keep;
  return true;
}
