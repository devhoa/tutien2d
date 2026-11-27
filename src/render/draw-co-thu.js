// Vòng sáng linh khí quanh gốc Cổ Thụ Ngàn Năm (chủ dự án 23/11/2026 15:33: "vài vòng sáng linh khí bao quanh cây cổ thụ"; luật ở src/game/co-thu.js).
// Vẽ bằng điểm ảnh nguyên trên mặt đất, dưới chân người: ba vòng hạt sáng xoay ngược chiều nhau, vòng ngoài đúng mép vùng không ai đánh ai
// (data/pvp.json → server.ma.co.r). Cây càng tích nhiều linh khí (game.coThu.lk, tin 'ctl' của phòng / p2d_co_thu_xem) thì vòng càng sáng, càng dày
// hạt; người đang ngồi trong vòng có sợi linh khí từ gốc cây chảy về (người thường) hay từ người chảy lên cây (ma sám hối).
// Lớp trên người (drawCoThuTren, chủ dự án 15:58: "code thêm hiệu ứng ma khí thoát ra cho vui mắt"): ma đang sám hối bốc ma khí đỏ đen từ thân, càng lên
// cao càng bị linh khí cây tịnh hoá thành điểm sáng trắng trôi về gốc cây; mỗi phút tan một điểm ma thì ma khí nổ bung ra quanh người rồi bị hút về cây
// (game.coThu.bung, src/game/co-thu.js coTick ghi), điểm ma cuối cùng tan thì nổ lớn hơn.
const MAU = '#9fe8ff', VANG = '#ffe08a', TIM = '#e8d6ff';
const MA = ['#1a0508', '#2a0610', '#5a0a14', '#a0182a', '#ff4040', TIM, '#ffffff'];   // ma khí: lõi đen → đỏ → tịnh hoá tím nhạt → trắng
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function hat(ctx, x, y, c, s = 1) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), s, s); }

export function drawCoThu(ctx, game, t) {
  const c = game.data.pvp?.server?.ma?.co;
  if (!c || game.map?.id !== c.map) return;
  const lk = game.coThu?.lk || 0, sang = Math.min(1, 0.35 + Math.log10(1 + lk) / 7);   // 0 linh khí: vẫn thấy vòng; khoảng 10 triệu: sáng hết mức
  const vong = [[c.r * 0.42, 0.5, VANG], [c.r * 0.72, -0.32, MAU], [c.r, 0.2, MAU]];
  for (const [r, toc, mau] of vong) {
    const n = Math.round(r * 2 * Math.PI / 3);   // vành liền: 3 đơn vị một hạt
    for (let i = 0; i < n; i++) {
      const g = i / n * Math.PI * 2, x = c.x + Math.cos(g) * r, y = c.y + Math.sin(g) * r;
      const song = 0.5 + 0.5 * Math.sin(g * 3 - t * toc * 6);   // sóng sáng chạy quanh vành
      ctx.globalAlpha = sang * (0.22 + 0.5 * song * song); hat(ctx, x - 1, y - 1, mau, 2);
    }
    const so = Math.round(8 + 10 * sang);   // hạt sáng trắng chạy trên vành
    for (let i = 0; i < so; i++) {
      const g = t * toc + i / so * Math.PI * 2;
      ctx.globalAlpha = sang * 0.9;
      hat(ctx, c.x + Math.cos(g) * r - 1, c.y + Math.sin(g) * r - 1, '#ffffff', 2);
    }
  }
  // hạt linh khí bốc lên từ trong vòng
  for (let i = 0; i < 10; i++) {
    const k = (t * 0.25 + i / 10) % 1, g = i * 2.399, rr = c.r * (0.2 + 0.7 * ((i * 0.37) % 1));
    ctx.globalAlpha = sang * (1 - k) * 0.8;
    hat(ctx, c.x + Math.cos(g) * rr, c.y + Math.sin(g) * rr - k * 46, i % 3 ? MAU : VANG);
  }
  // sợi linh khí giữa gốc cây và người đang ngồi trong vòng (mình và người khác)
  const ngoi = [];
  const p = game.player;
  if (p?.meditating && Math.hypot(p.x - c.x, p.y - c.y) <= c.r) ngoi.push([p.x, p.y, (game.pvp?.ma || 0) > 0]);
  for (const o of game.others?.list?.values?.() || []) {
    if (o.x == null || !o.meditating || Math.hypot(o.x - c.x, o.y - c.y) > c.r) continue;
    ngoi.push([o.x, o.y, +o.ma > 0]);
  }
  for (const [x, y, ma] of ngoi) {
    if (ma) {   // vũng ma khí dưới thân, phập phồng như thở
      const th = 0.5 + 0.5 * Math.sin(t * 2.4);
      for (let i = 0; i < 22; i++) {
        const g = i / 22 * Math.PI * 2, rr = 9 + th * 3 + hash(i) * 3;
        ctx.globalAlpha = 0.35 + 0.3 * hash(i + 7);
        hat(ctx, x + Math.cos(g) * rr - 1, y + Math.sin(g) * rr * 0.45 - 1, i % 3 ? MA[2] : MA[0], 2);
      }
    }
    for (let j = 0; j < 6; j++) {
      let k = (t * 0.6 + j / 6) % 1;
      if (ma) k = 1 - k;   // ma: tu vi chảy lên cây; người thường: linh khí cây chảy về người
      const px = c.x + (x - c.x) * k, py = c.y - 10 + (y - 8 - (c.y - 10)) * k - Math.sin(k * Math.PI) * 14;
      ctx.globalAlpha = sang * Math.sin(k * Math.PI);
      hat(ctx, px, py, ma ? TIM : MAU, 2);
    }
  }
  ctx.globalAlpha = 1;
}

// Ma khí bốc lên từ một người đang sám hối (mình hoặc người khác): draw-nguoi.js gọi ngay sau khi vẽ thân, trước tên, nên tên không bị khói che
// và cây đứng trước / sau người đúng thứ tự. ma: điểm ma của người đó.
export function drawMaKhiNgoi(ctx, game, e, t, ma) {
  const c = game.data.pvp?.server?.ma?.co;
  if (!c || !(ma > 0) || !e.meditating || game.map?.id !== c.map || Math.hypot(e.x - c.x, e.y - c.y) > c.r) return;
  const x = e.x, y = e.y, lech = typeof e.id === 'string' ? [...e.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 7 : 0,   // mỗi người một nhịp khói riêng
    A = ctx.globalAlpha;
  for (let i = 0; i < 30; i++) {
    const h = hash(i + lech), k = (t * (0.32 + h * 0.18) + i / 30 + h) % 1;
    const sx = x + (i % 2 ? 1 : -1) * (7 + h * 8) * (1 - k * 0.6) + Math.sin(t * 3 + i * 1.7) * (2 + k * 7) + (c.x - x) * 0.3 * k * k;   // bốc từ hai bên vai, không che mặt nhân vật
    const sy = y - 6 - hash(i + 3) * 8 - k * 58 + (c.y - 40 - y) * 0.15 * k * k;
    const mau = MA[Math.min(MA.length - 1, Math.floor(k * MA.length * 0.999))];
    ctx.globalAlpha = A * (k > 0.8 ? (1 - k) * 5 : k < 0.32 ? 0.8 : 0.92);
    if (k < 0.32) { const r = 3 - Math.floor(k * 4); hat(ctx, sx - r - 1, sy - r - 1, MA[0], r * 2 + 2); hat(ctx, sx - r, sy - r, mau, r * 2); hat(ctx, sx - r, sy - r, MA[3], 1); }   // cụm khói đặc viền đen, đốm đỏ
    else if (k < 0.62) { hat(ctx, sx - 2, sy - 2, MA[1], 4); hat(ctx, sx - 1, sy - 1, mau, 2); }
    else hat(ctx, sx - 1, sy - 1, mau, k > 0.85 ? 3 : 2);   // tịnh hoá: điểm sáng
  }
  for (let i = 0; i < 3; i++) {   // vài tia ma khí giật quanh thân
    const g = t * 1.3 + i * 2.1, k = 0.5 + 0.5 * Math.sin(t * 7 + i * 3);
    ctx.globalAlpha = A * 0.5 * k;
    for (let j = 0; j < 5; j++) hat(ctx, x + Math.cos(g) * (6 + j * 2), y - 10 + Math.sin(g) * (6 + j * 2) * 0.6 - j, j % 2 ? MA[3] : MA[1], 1);
  }
  ctx.globalAlpha = A;
}

// Lớp trên cùng: các lần nổ bung mỗi phút (ngắn, phải thấy rõ nên vẽ đè lên mọi thứ)
export function drawCoThuTren(ctx, game, t) {
  const c = game.data.pvp?.server?.ma?.co;
  if (!c || game.map?.id !== c.map) return;
  // nổ bung mỗi phút: ma khí văng ra quanh người (0–0,45 giây), tịnh hoá rồi bị hút về gốc cây
  const B = game.coThu?.bung;
  if (B?.length) {
    const now = game.time || 0;
    game.coThu.bung = B.filter(b => now - b.t0 < 1.8);
    for (const b of game.coThu.bung) {
      const u = now - b.t0, n = b.lon ? 56 : 30;
      for (let i = 0; i < n; i++) {
        const g = i / n * Math.PI * 2 + hash(i) * 0.4, v = (b.lon ? 60 : 38) * (0.6 + hash(i + 9) * 0.6);
        const a = Math.min(u, 0.45), ox = b.x + Math.cos(g) * v * a * (1.6 - a), oy = b.y - 10 + Math.sin(g) * v * a * (1.6 - a) * 0.7 - u * 10;
        const keo = Math.max(0, (u - 0.55) / 1.1), kk = keo * keo;   // sau 0,55 giây bị hút về gốc cây
        const px = ox + (c.x - ox) * kk, py = oy + (c.y - 20 - oy) * kk;
        const mau = u < 0.25 ? MA[i % 2 ? 0 : 2] : u < 0.5 ? MA[3 + (i % 2)] : u < 0.8 ? MA[5] : (i % 3 ? MAU : '#ffffff');
        ctx.globalAlpha = Math.min(1, (1.8 - u) * 2);
        hat(ctx, px - 1, py - 1, mau, u < 0.4 ? 3 : 2);
      }
      if (u < 0.35) {   // vòng sóng đen đỏ nở ra
        const r = 8 + u / 0.35 * (b.lon ? 46 : 28);
        ctx.globalAlpha = 1 - u / 0.35;
        for (let i = 0; i < 40; i++) { const g = i / 40 * Math.PI * 2; hat(ctx, b.x + Math.cos(g) * r - 1, b.y - 8 + Math.sin(g) * r * 0.6 - 1, i % 2 ? MA[3] : MA[1], 2); }
      }
    }
  }
  ctx.globalAlpha = 1;
}
