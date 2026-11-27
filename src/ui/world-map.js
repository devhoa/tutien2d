// Nút Bản đồ (ngoài HUD): hai tab. "Tinh cầu này": bản đồ tinh cầu đang đứng, chạm chỗ nào là nhân vật tự đi tới (src/ui/planet-map.js).
// "Tinh hệ": tinh đồ Thiên Kiếm Tinh Hệ vẽ bằng canvas; chạm thiên thể để xem. Bản đồ chỉ để xem, không bay (chủ dự án 23/11/2026 21:41 "Bỏ bay ở
// Tinh hệ"): nút trên thẻ đưa tới pháp trận truyền tống của tinh cầu đang đứng, đứng giữa trận rồi thì Dịch chuyển luôn (src/game/tran-sang.js).
// Chế độ truyền tống (open({ tt: true, chon }), nút Dịch chuyển khi đứng giữa pháp trận, src/game/truyen-tong.js): chỉ tab Tinh hệ, nút trên thẻ
// là Dịch chuyển (luật nơi nào tới được ở starmap.js whyNot), chọn xong thì trận khởi; chon: mã bản đồ chọn sẵn (tới trận từ nút Tới pháp trận).
import { bodiesOf, dangerOf, whyNot, flyOpen } from '../game/starmap.js';
import { drawStarmap } from '../render/draw-starmap.js';
import { drawNgang } from '../render/draw-tv-ngang.js';   // giống video tinh-do-ngang (19/11/2026)
import { panZoom } from './pan-zoom.js';
import { weekLine } from '../game/demon.js';
import { drawPlanet, tapPlanet } from './planet-map.js';
import { hopTo, hopWhy } from '../game/hop.js';
import { goArena, mangOn } from '../game/thien-mang.js';
import { ttChan, batDauTruyen, ttCfg } from '../game/truyen-tong.js';
import { nutSang } from '../game/tran-sang.js';

const $ = id => document.getElementById(id);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

export function createWorldMap(game) {
  const { data } = game, sm = data.starmap, H = data.dungeon.hint;
  let bodies = bodiesOf(sm, data.maps);   // dựng lại mỗi lần mở: tinh cầu khai hoang tải từ máy chủ (src/game/khai-hoang.js)
  const hint = { easy: H.easy_color, fair: H.fair_color, hard: H.hard_color };
  const hintText = { easy: H.easy_text, fair: H.fair_text, hard: H.hard_text };
  let canvas = null, ctx = null, raf = 0, pts = [], sel = null, t0 = 0, view = null, mode = 'sys', lay = null, tabs = null, tt = false;   // tt: mở từ pháp trận truyền tống

  // Đang ở bí cảnh, đang độ kiếp hay truyện đang chạy thì không sang tinh cầu khác
  const blocked = () => (game.map.def.rooms || []).length ? 'Đang ở bí cảnh, ra cổng trước đã.'
    : game.map.def.tower || game.map.def.res ? 'Đang trong tháp hoặc bí cảnh, ra cổng trước đã.'
    : game.trib.active ? 'Đang độ kiếp!' : game.story.busy ? 'Đang có chuyện, đợi xong đã.' : null;

  const seen = b => b.sun || b.kind === 'lost' || b.kind === 'soon' || !!data.maps[b.map]?.demon || !!game.save.visited?.[b.map] || !!b.kh || !!b.mo || (!!b.map && flyOpen(game, b.map));   // mo: tinh cầu mở cho mọi người (hệ thứ hai)

  function fit() {
    const box = $('world-sky'), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = box.clientWidth, h = box.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  function frame() {
    if ($('world').hidden) { raf = 0; return; }
    const { w, h } = fit();
    if (mode === 'here') { lay = drawPlanet(ctx, w, h, (performance.now() - t0) / 1000, game); raf = requestAnimationFrame(frame); return; }
    pts = (sm.tv?.ngang ? drawNgang : drawStarmap)(ctx, w, h, sm, bodies, {   // dọc lẫn ngang đều theo video 2 (04:21)
      min: Date.now() / 60000, t: (performance.now() - t0) / 1000, realm: game.save.realm || 0,
      here: game.map.id, sel: sel?.id, seen, hint, view, art: data.art.sprites,
      mang: data['thien-mang']?.sky && { spr: data.art.sprites['boss.mang'], sky: data['thien-mang'].sky, name: data['thien-mang'].name },   // boss lượn ngoài kết giới
    });
    raf = requestAnimationFrame(frame);
  }

  function card() {
    const box = $('world-card'); box.innerHTML = '';
    box.hidden = !sel;
    if (!sel) return;
    const b = sel, known = b.mang || seen(b);
    if (b.mang) { mangCard(box); return; }
    box.append(el('b', null, known ? b.name : sm.texts.unknown), el('small', null, sm.kinds[b.kind] || ''));
    if (known && b.desc) box.append(el('p', null, b.desc));
    const dg = known && dangerOf(b, game.save.realm || 0);
    if (data.maps[b.map]?.demon) box.append(el('p', 'wc-danger', weekLine(game)));   // Ma Vương tuần này
    if (dg) { const p = el('p', 'wc-danger', sm.texts.danger + ' '); const s = el('span', null, hintText[dg]); s.style.color = hint[dg]; p.append(s); box.append(p); }
    if (b.sun || b.kind === 'lost' || b.kind === 'soon') return;
    if (b.kh && b.trong && !tt) {   // tinh cầu khai hoang bỏ trống: tông chủ chưa có tinh cầu khiêu chiến tông chủ cũ (src/game/kh-act.js)
      const kc = el('button', 'wc-go', data['khai-hoang'].text.kc);
      kc.onclick = () => { close(); import('../game/kh-act.js').then(M => M.khChallenge(game, game.kh?.list.find(x => x.id === b.map) || { id: b.map, ten: b.name })); };
      box.append(kc);
    }
    const T = ttCfg(game).texts || {}, why = tt ? ttChan(game, b) : game.map.id === b.map ? sm.texts.here : whyNot(game, b) || blocked();
    // truyền tống: Dịch chuyển (trận khởi, tải nơi đến trong lúc đó); Bản đồ thường: Tới pháp trận / Dịch chuyển / ra tinh cầu có trận
    const n = tt ? { chu: why || T.go, tat: !!why, tt: true, lam: () => batDauTruyen(game, b) } : why ? { chu: why, tat: true } : nutSang(game, b);
    if (n.di) box.append(el('p', 'wc-ghi', T.ghi));
    const go = el('button', 'wc-go' + (n.tt ? ' wc-tt' : ''), n.chu);
    go.disabled = !!n.tat;
    go.onclick = () => { close(); n.lam?.(); };
    box.append(go);
  }

  // Thẻ Cửu Đầu Thôn Thiên Mãng (chạm con rắn lượn ngoài kết giới): đang mở thì nút Bay tới ra vùng không gian (game/thien-mang.js)
  function mangCard(box) {
    const c = data['thien-mang'], T = c.text, on = mangOn(game) && !(game.mang?.board?.mo === 0 && Date.now() - (game.mang.boardAt || 0) < 60000);   // theo lịch; máy chủ vừa báo đã tắt thì cũng khoá nút
    box.append(el('b', null, c.name), el('small', null, T.boss_kind || ''), el('p', null, on ? T.enter_ask : T.closed));
    const why = on ? (game.map.id === c.arena?.map ? sm.texts.here : blocked()) : T.closed;
    const go = el('button', 'wc-go', why || T.enter);
    go.disabled = !!why;
    go.onclick = () => { close(); goArena(game); };
    box.append(go);
  }

  // Chạm ở tab tinh cầu: bay tới chỗ đó (bị chặn thì báo lý do, bảng vẫn mở)
  function hop(x, y) {
    const hit = tapPlanet(lay, x, y, game);
    if (!hit) return;
    const why = hopWhy(game);
    if (why) { game.toast(why, 1.6); return; }
    close();
    hopTo(game, hit.at[0], hit.at[1], hit.name);
  }

  function setMode(m) {
    mode = m; sel = null; view?.reset(); card();
    for (const b of tabs.children) b.classList.toggle('on', b.dataset.mode === m);
    const T = ttCfg(game).texts || {};
    $('world-title').textContent = m === 'here' ? game.map.def.name : tt ? T.title : sm.name;
    $('world-sub').textContent = m === 'here' ? hopWhy(game) || '' : tt ? ttChan(game) || T.sub : blocked() || sm.sub;
  }

  // Chạm: chọn thiên thể gần nhất; chạm chỗ trống thì đóng thẻ
  function tap(x, y) {
    if (mode === 'here') { hop(x, y); return; }
    let best = null, bd = Infinity;
    for (const p of pts) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < Math.max(16, p.r + 8) && d - p.r < bd) { bd = d - p.r; best = p.b; }
    }
    // Tinh đồ hai hệ: chạm mũi tên ở mép trái / phải thì lướt sang phần chưa thấy. Chạm TRÚNG một thiên thể sát mép thì vẫn là chọn nó
    // (26/11/2026, soát bản thật sau khi đưa lên: vuốt hết sang phải thì Lục Dã Tinh nằm ngay chỗ mũi tên trái, chạm nó lại thành lướt).
    if (!best && view.ex > 4 && view.z < 1.05) {
      const w = canvas.clientWidth;
      if (x < 34 && view.x < view.ex - 4) { view.toi = view.x + w * 0.75; return; }
      if (x > w - 34 && view.x > -view.ex + 4) { view.toi = view.x - w * 0.75; return; }
    }
    sel = best; card();
  }

  function open(o = {}) {
    if (!game.save || game.dialog.open || game.trip || game.traveling) return;
    tt = !!o.tt;
    game.uiOpen = true; $('world').hidden = false;
    bodies = bodiesOf(game.data.starmap, data.maps);
    if (view) view.reset();   // mở lại: về cỡ thường, canh vào tinh cầu đang đứng
    if (!canvas) {
      canvas = el('canvas'); ctx = canvas.getContext('2d');
      view = panZoom(canvas, { max: 3.5, onTap: tap }); view.canh = true;
      $('world-sky').prepend(canvas);
      tabs = el('div', 'world-tabs');
      for (const [m, label] of [['here', sm.texts.tab_here], ['sys', sm.texts.tab_sys]]) {
        const b = el('button', null, label); b.dataset.mode = m;
        b.onclick = () => setMode(m);
        tabs.append(b);
      }
      const kh = el('button', 'world-kh', data['khai-hoang'].text.map_btn);   // Khai Hoang Tinh Cầu: mở bảng Tông môn tab Tinh cầu
      kh.onclick = () => { close(); game.openGuild?.('kh'); };
      tabs.append(kh);
      $('world-sky').before(tabs);
    }
    tabs.children[0].hidden = !game.map.def.planet || tt;   // trong bí cảnh, động phủ thì chỉ có tinh hệ; truyền tống: chỉ tinh hệ
    tabs.children[2].hidden = tt;
    setMode(game.map.def.planet && !tt ? 'here' : 'sys');
    if (o.chon) { sel = bodies.find(b => b.map === o.chon) || null; card(); }   // tới trận từ nút Tới pháp trận: chọn sẵn nơi đã chọn
    t0 = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function close() { game.uiOpen = false; $('world').hidden = true; }

  $('world-close').onclick = close;
  $('btn-world').addEventListener('pointerdown', ev => { ev.stopPropagation(); open(); });
  // Truyện bảo sang tinh cầu khác: mũi tên chỉ đường trỏ pháp trận (src/game/guide.js); nút Bản đồ thôi sáng nhắc vì Bản đồ không bay nữa
  return { open, close, get pts() { return pts; }, get view() { return view; }, get sel() { return sel; } }; // pts: chỗ vẽ từng thiên thể (kiểm thử tự động chạm theo); view, sel: bài thử Tinh đồ hai hệ
}
