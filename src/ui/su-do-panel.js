// Bảng Sư đồ (Menu → Sư đồ; chủ dự án 25/11/2026 10:08: "trong mục sư đồ sẽ có nút này"): sư phụ của mình (Hành lễ, Rời sư môn),
// các đồ đệ (Chỉ điểm, Trục xuất), lời tới (Đồng ý / Từ chối), lời đã gửi (Rút). Nút Bái sư / Thu đồ trên từng người ở bảng Bạn bè
// và Hồ sơ: suDoBtn. Logic src/game/su-do.js; chữ data/social.json → su_do.text.
import { loadSuDo, inviteSuDo, leaveSuDo, teachSuDo, bowSuDo, suDoErr, suDoVai, suDoMo } from '../game/su-do.js';
import { realmLabel } from '../game/stats.js';

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const ask = async (game, text, yes, color) => (await game.dialog.choose(text, [{ id: 'no', label: 'Thôi' }, { id: 'yes', label: yes, color }])) === 'yes';   // "Thôi" đứng trước: chạm vội không làm nhầm

// Nút Bái sư / Thu đồ cho người r { k, ten, canh_gioi } (bảng Bạn bè, Hồ sơ). btn(nhãn, hàm). Không đủ điều kiện thì không thêm nút.
export function suDoBtn(game, r, btn, xong) {
  const T = game.data.social.su_do.text, vai = suDoVai(game, r);
  if (!vai) return;
  btn(vai === 'su' ? T.bai_su : T.thu_do, async () => {
    if (!(await ask(game, `${fill(vai === 'su' ? T.hoi_bai : T.hoi_thu, { name: r.ten })}\n${T.luat}`, vai === 'su' ? T.bai_su : T.thu_do, '#ffd56a'))) return;
    try { xong(await inviteSuDo(game, r.k)); } catch (e) { xong(suDoErr(game, e)); }
  });
}

export function createSuDoPanel(game) {
  const C = game.data.social.su_do, T = C.text;
  const root = el('div', 'panel ev-panel su-do-panel'); root.hidden = true;
  const head = el('div', 'bag-head'), x = el('button', 'mini', '✕'), body = el('div', 'ev-body');
  head.append(el('b', null, T.title), x);
  root.append(head, body);
  document.body.append(root);
  const close = () => { root.hidden = true; game.uiOpen = false; };
  x.onclick = close;
  const say = t => body.prepend(el('p', 'fb-reward', t));
  const canh = r => realmLabel({ realm: r.canh_gioi, layer: r.tang }, game.data.realms);

  function the(r, sub) {   // thẻ một người: tên, cảnh giới, dòng phụ; trả { card, btn }
    const card = el('div', 'ev-note'), acts = el('div', 'pf-acts');
    card.append(el('b', 'ev-note-title', r.ten), el('p', null, canh(r)));
    if (sub) card.append(el('p', 'muted', sub));
    const btn = (t, fn, cls = 'act-btn', tat = false) => {
      const b = el('button', cls, t); b.disabled = tat;
      b.onclick = async () => { b.disabled = true; try { await fn(); } catch (e) { say(suDoErr(game, e)); b.disabled = false; } };
      acts.append(b); return b;
    };
    card.append(acts);
    return { card, btn };
  }

  async function render(note) {
    body.replaceChildren(el('p', null, 'Đang tải…'));
    if (!suDoMo(game)) { body.replaceChildren(el('p', null, T.dang_nhap), el('p', 'muted', T.luat)); return; }
    let st;
    try { st = await loadSuDo(game); } catch (e) { body.replaceChildren(el('p', null, suDoErr(game, e))); return; }
    if (root.hidden) return;
    body.replaceChildren(el('p', 'muted', T.luat));
    if (note) say(note);
    if (!st) { body.append(el('p', null, T.err.net)); return; }

    body.append(el('div', 'pf-label', T.su_phu));
    if (st.su_phu) {
      const s = st.su_phu, { card, btn } = the(s, s.chi_diem ? T.buff_qi : T.cho_qi);
      if (s.chi_diem) card.classList.add('top');
      btn(s.hanh_le ? T.da_hanh_le : T.hanh_le, async () => render(await bowSuDo(game)), 'act-btn primary', s.hanh_le);
      if (game.openProfile) btn('Hồ sơ', async () => { close(); game.openProfile(s.k, s.ten); });
      btn(T.roi, async () => { if (await ask(game, fill(T.hoi_roi, { name: s.ten }), T.roi, '#e0484a')) render(await leaveSuDo(game, s.k)); else render(); });
      body.append(card);
    } else body.append(el('p', 'muted', `${T.chua_su} ${T.cach_ket}`));

    const dd = st.do_de || [];
    body.append(el('div', 'pf-label', fill(T.do_de, { n: dd.length, max: C.toi_da })));
    if (dd.length) body.append(el('p', dd.some(d => d.hanh_le) ? 'fb-reward' : 'muted', dd.some(d => d.hanh_le) ? T.buff_lt : T.cho_lt));
    else body.append(el('p', 'muted', T.chua_do));
    for (const d of dd) {
      const { card, btn } = the(d, d.hanh_le ? T.do_le : T.do_chua_le);
      btn(d.chi_diem ? T.da_chi_diem : T.chi_diem, async () => render(await teachSuDo(game, d.k)), 'act-btn primary', d.chi_diem);
      if (game.openProfile) btn('Hồ sơ', async () => { close(); game.openProfile(d.k, d.ten); });
      btn(T.truc, async () => { if (await ask(game, fill(T.hoi_truc, { name: d.ten }), T.truc, '#e0484a')) render(await leaveSuDo(game, d.k)); else render(); });
      body.append(card);
    }

    for (const [key, den] of [['moi_toi', true], ['toi_moi', false]]) {
      for (const r of st[key] || []) {
        // vai: vai của NGƯỜI KIA trong lời này ('do': họ sẽ là đồ đệ của mình, 'su': họ sẽ là sư phụ của mình)
        const chu = den ? (r.vai === 'do' ? T.moi_do : T.moi_su) : (r.vai === 'do' ? T.cho_do : T.cho_su);
        const { card, btn } = the(r, fill(chu, { name: r.ten }));
        if (den) btn(T.dong_y, async () => render(await inviteSuDo(game, r.k)), 'act-btn primary');
        btn(den ? T.tu_choi : T.rut, async () => render(await leaveSuDo(game, r.k)));
        body.append(card);
      }
    }
  }

  game.openSuDo = () => {
    if (!game.save || game.dialog.open) return;
    for (const p of document.querySelectorAll('.panel, #bag')) if (p !== root && !p.hidden) p.querySelector('[id$="-close"]')?.click();
    game.uiOpen = true; root.hidden = false; render();
  };
}
