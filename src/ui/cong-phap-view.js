// Mục Công pháp trong bảng Nhân vật → Công pháp (chủ dự án 23/11/2026 12:43: "công pháp thân pháp kỹ năng chưa đồng bộ, khá là khó nhìn… mấy ô có
// thể làm nhỏ thì làm nhỏ, thành ô giống kho trang bị, ấn vào để xem chi tiết"; "xem công pháp có thực sự đang hoạt động đúng chỉ số không").
// Trước đây gắn bảng Chiêu cũ (src/ui/skills-panel.js) vào khung phải, hiện số thô per_level × tầng; luật chiến đấu mới kẹp trần tổng các cuốn
// nên số hiện lệch số thật (Kiếm Tông Tâm Pháp tầng 10 ghi Công +16% mà nhận +10%). Giờ tự vẽ như Kỹ năng, Thân pháp: ba ô đang mang, dòng
// "đang nhận" (số thật, chạm trần thì ghi "trần"), lưới ô khung phẩm theo tầng (data/techniques.json → khung); chạm cuốn: tấm chi tiết với từng
// chỉ số thô và phần thật nhận (src/game/cong-phap-that.js), kinh nghiệm, nút mang vào ô 1 / 2 / 3. self-panel.js gọi renderCongPhap.
import { setTechSlot, techNeed } from '../game/techniques.js';
import { cpThat, cpCuon } from '../game/cong-phap-that.js';
import { uiIco } from './self-gear.js';
import { el, fill, so, olCss, khungCap, oVuong, luoi, hinhDau, tamDau, nut, hangNut } from './o-luoi.js';

// Hình chỉ số (bộ hình thẻ nhân vật, src/ui/self-left.js)
const ICO = { atk_pct: 'cong', hp_pct: 'hp', def_pct: 'thu', crit: 'bao', crit_dmg: 'st-bao', cdr: 'hoi-chieu', lifesteal: 'hut-mau', thorns: 'phan-don',
  speed: 'toc', qi_gain: 'tu-luyen', regen_pct: 'hoi-mau', mp_pct: 'linh-luc', mp_regen: 'linh-luc' };
const pct = v => `+${so(v)}%`;
const hinh = (D, id) => { const spr = D.art.sprites['ui.vk-' + id]; return spr ? `url("${spr.file}?v=${spr.v}")` : ''; };

export function renderCongPhap(game, st, mid, bar, changed) {
  olCss();
  const D = game.data, T = D.techniques, X = T.text, s = game.save, wrap = el('div', 'ol');
  bar.hidden = true; bar.replaceChildren();
  const sl = s.techSlots || [], co = Object.keys(s.techs || {}).filter(id => T.list[id]);
  if (!(st.cpSlot >= 0 && st.cpSlot < T.slots)) st.cpSlot = Math.min(sl.length, T.slots - 1);
  const khung = id => khungCap(D, T.khung, s.techs[id]?.lv || 1);
  if (st.cpSel && co.includes(st.cpSel)) { chiTiet(game, st, mid, st.cpSel, khung, changed); return; }
  st.cpSel = null;
  mid.classList.remove('sheet');
  // Ba ô đang mang
  const hang = el('div', 'ol-hang');
  for (let i = 0; i < T.slots; i++) {
    const id = sl[i], t = id && T.list[id], o2 = el('span');
    o2.append(oVuong(D, { o: t && khung(id), ic: t ? hinh(D, id) : null, tl: t ? s.techs[id].lv : '', sel: i === st.cpSlot, trong: !t, moi: st.olMoi === 'cp' + i, ten: t ? t.name : fill(X.o, { i: i + 1 }),
      onClick: () => { st.cpSlot = i; st.cpSel = id || null; game.sfx?.('click'); changed(false); } }), el('small', 'ol-nhan', t ? t.name : fill(X.o, { i: i + 1 })));
    hang.append(o2);
  }
  wrap.append(hang); st.olMoi = null;
  // Đang nhận: số thật sau trần
  const tong = cpThat(s, D).filter(x => x.that > 0 || x.tho > 0);
  if (tong.length) {
    const box = el('div', 'ol-tong');
    box.title = X.tong;
    for (const x of tong) {
      const kep = x.tran != null && x.that < x.tho - 1e-6, c = el('span', 'ol-cs' + (kep ? ' tran' : ''));
      c.title = X.chi_so[x.k] || x.k;
      c.append(uiIco(D, 'ui.nv-' + (ICO[x.k] || 'cong'), 'sv-sico'), pct(x.that));
      if (kep) c.append(el('small', null, X.tran_ngan));
      box.append(c);
    }
    wrap.append(el('div', 'ol-ghi vang', X.tong), box);
  }
  if (!co.length) wrap.append(el('div', 'ol-ghi', X.chua));
  else wrap.append(el('div', 'ol-ghi', X.ghi));
  const ds = co.sort((a, b) => (s.techs[b].lv - s.techs[a].lv) || T.list[a].name.localeCompare(T.list[b].name, 'vi'));
  wrap.append(luoi(ds.map(id => oVuong(D, { o: khung(id), ic: hinh(D, id), tl: s.techs[id].lv, mang: sl.includes(id), ten: T.list[id].name,
    onClick: () => { st.cpSel = id; game.sfx?.('click'); changed(false); } }))));
  const keep = mid.scrollTop; mid.replaceChildren(wrap); mid.scrollTop = keep;
}

// Tấm chi tiết một cuốn
function chiTiet(game, st, mid, id, khung, changed) {
  const D = game.data, T = D.techniques, X = T.text, s = game.save, t = T.list[id], me = s.techs[id], sl = s.techSlots || [], box = el('div', 'ol-tam');
  mid.classList.add('sheet');
  const dang = sl.indexOf(id), he = D.elements?.[t.el]?.name;
  const phu = [fill(X.tang, { lv: me.lv, max: T.max_level }), he && fill(X.he, { he })].filter(Boolean).join(' · ');
  box.append(tamDau(hinhDau(khung(id), hinh(D, id)), t.name, phu, () => { st.cpSel = null; changed(false); }));
  box.append(el('div', 'd-line', me.lv >= T.max_level ? X.vien_man : fill(X.kn, { a: Math.floor(me.exp || 0), b: techNeed(D, me.lv) })));
  // Từng chỉ số: thô theo tầng, phần thật nhận (đang mang) hay phần mang thêm được (chưa mang)
  box.append(el('div', 'd-label', X.cong));
  const tran = [];
  for (const x of cpCuon(s, D, id)) {
    const r = el('div', 'd-line ol-cs-dong');
    r.append(uiIco(D, 'ui.nv-' + (ICO[x.k] || 'cong'), 'sv-sico'), el('span', null, X.chi_so[x.k] || x.k), el('b', null, pct(x.tho)));
    if (x.tran != null) {
      if (dang >= 0 && x.that < x.tho - 1e-6) r.append(el('em', null, '→ ' + fill(X.nhan, { x: pct(x.that) })));
      if (dang < 0) r.append(x.that > 1e-6 ? el('i', 'ok', fill(X.them, { x: pct(x.that) })) : el('em', null, X.them0));
      tran.push(`${X.chi_so[x.k] || x.k} ${pct(x.tran)}`);
    }
    box.append(r);
  }
  if (tran.length) box.append(el('div', 'd-line', fill(X.tran, { ds: tran.join(', ') })));
  box.append(el('div', 'd-line', t.desc || ''));
  // Mang vào ô: ba nút, ô đang chọn là nút chính
  box.append(hangNut(...[...Array(T.slots).keys()].map(i => nut(D, fill(X.o, { i: i + 1 }), sl[i] === id ? X.dang_mang : sl[i] ? T.list[sl[i]].name : X.trong, () => {
    setTechSlot(game, i, id); st.cpSel = null; st.cpSlot = Math.max(0, (s.techSlots || []).indexOf(id)); st.olMoi = 'cp' + st.cpSlot; game.sfx('pickup'); changed();   // về lưới, ô vừa mang loé lên
  }, { chinh: i === st.cpSlot && sl[i] !== id, tat: sl[i] === id, ico: 'mac-tot' }))));
  const keep = mid.scrollTop; mid.replaceChildren(box); mid.scrollTop = keep;
}
