// Thẻ nhận đồ câu (chủ dự án 24/11/2026 00:38: "sau khi nhận sẽ hiện bảng quà nhận cá gì, nếu không ấn đóng thì nó vẫn ở trên màn hình").
// Góc phải dưới bảng trên, không chặn game: hình con vừa câu, tên màu phẩm, cỡ, kỷ lục, loài mới; hàng nhỏ các con vừa câu với con quý nhất
// từ lúc mở thẻ ghim đầu hàng (Tự câu treo máy về vẫn thấy con quý); dưới cùng: số con hôm nay, mồi đang móc (chạm: mở mục Mồi), nút Tự câu.
// Đóng bằng ✕. game.cauThe(tin) do src/game/cau-nhan.js gọi. Kiểu: src/ui/cau.css.
import { goc } from '../core/build.js';
import { caIco } from './cau-ico.js';
import { cauOf, moiDung, phamTen, FC } from '../game/cau-do.js';
import { waterDir } from '../game/fishing.js';

const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
let css = false;
export const cauCss = () => { if (css) return; css = true; const l = el('link'); l.rel = 'stylesheet'; l.href = goc('src/ui/cau.css'); document.head.append(l); };

export function createCauThe(game) {
  const data = game.data, X = FC(game).texts;
  let root = null, ds = [], quy = null;
  game.cauIco = (id, size) => caIco(data, id, size);
  function dung() {
    cauCss();
    root = el('div'); root.id = 'cau-the'; root.hidden = true;
    document.body.append(root);
    root.addEventListener('pointerdown', e => e.stopPropagation());
  }
  function ve(tin, moi) {
    if (!root) dung();
    const t = phamTen(data, tin.p), m = data.cave.materials[tin.id];
    root.replaceChildren();
    const x = el('button', 'ct-x', '✕'); x.setAttribute('aria-label', X.the_dong);
    x.onclick = () => { root.hidden = true; ds = []; quy = null; };
    const head = el('div', 'ct-dau'), o = el('div', 'ct-o'), txt = el('div', 'ct-txt');
    o.dataset.o = t.id; o.style.setProperty('--q', t.color); o.append(caIco(data, tin.id, 44));
    txt.append(el('small', null, X.the_tieu + (tin.n > 1 ? ` ×${tin.n}` : '')));
    const nm = el('b', null, m.name); nm.style.color = t.edge ? '#ffd6d6' : t.color; txt.append(nm);
    txt.append(el('em', null, `${t.name} · ${X.the_cm.replace('{cm}', String(tin.cm).replace('.', ',')).replace('{kg}', String(tin.kg).replace('.', ','))}`));
    const nhan = el('div', 'ct-nhan');
    if (tin.moi) nhan.append(el('span', 'moi', X.loai_moi.replace('{n}', tin.so).replace('{tong}', tin.tong)));
    else if (tin.ky) nhan.append(el('span', 'ky', X.ky));
    if (nhan.childElementCount) txt.append(nhan);
    head.append(o, txt, x);
    // các con vừa câu, con quý nhất ghim đầu
    const hang = el('div', 'ct-hang');
    for (const k of [quy, ...ds.filter(d => d !== quy)].filter(Boolean).slice(0, 7)) {
      const c = el('i', 'ct-nho' + (k === quy ? ' quy' : '')), tt = phamTen(data, k.p);
      c.style.setProperty('--q', tt.color); c.append(caIco(data, k.id, 18)); c.title = data.cave.materials[k.id].name;
      hang.append(c);
    }
    // chân: hôm nay, mồi, tự câu
    const chan = el('div', 'ct-chan'), md = moiDung(game);
    chan.append(el('span', 'ct-hom', X.the_hom_nay.replace('{n}', tin.hom)));
    const mb = el('button', 'ct-moi');
    if (md) mb.append(caIco(data, md, 14), X.the_moi.replace('{moi}', data.cave.materials[md].name).replace('{n}', game.save.mats[md] || 0));
    else mb.append(X.the_tran);
    mb.onclick = () => game.openSelf?.('ca', 'moi');
    const phuc = cauOf(game.save).phuc;
    if (phuc > 0) chan.append(el('span', 'ct-phuc', X.the_phuc.replace('{n}', phuc)));
    const tu = el('button', 'ct-tu' + (game.tuCau ? ' on' : ''), game.tuCau ? X.the_tu_on : X.the_tu);
    tu.onclick = () => {
      game.tuCau = !game.tuCau;
      if (game.tuCau) { if (!waterDir(game) && !game.fish) game.tuCau = false; else game.cauTha = 0.3; }
      game.sfx?.('click'); ve(tin, false);
    };
    chan.append(mb, tu);
    root.append(head, hang, chan);
    root.hidden = false;
    if (moi) { root.classList.remove('pop'); void root.offsetWidth; root.classList.add('pop'); root.style.setProperty('--q', t.color); }
  }
  let cuoi = null;
  game.cauThe = tin => {
    ds.unshift(tin); if (ds.length > 12) ds.pop();
    if (!quy || tin.p > quy.p || (tin.p === quy.p && tin.moi)) quy = tin;
    cuoi = tin; ve(tin, true);
  };
  game.cauTheVe = () => { if (root && !root.hidden && cuoi) ve(cuoi, false); };   // mồi, tự câu đổi: vẽ lại chân thẻ
}
