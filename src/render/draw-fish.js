// Câu cá (src/game/fishing.js): cần câu, dây, phao; phao rỉa, chìm khi cắn; thanh giằng co trên đầu; con vật bay khỏi nước về tay
// (game.cauBay: vòng cung, quẫy, bóng dưới đất, vệt sáng loài quý, loé lúc tới tay); gợn sóng (game.cauGon), giọt nước (game.cauHat);
// người khác đang câu (o.fishing, hồ sơ st 'cau'): cần, dây, phao nhấp nhô.
import { caHinh, anhCau } from './ca-hinh.js';
import { spriteImage } from './sprites.js';

const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export function drawFishing(ctx, game, t) {
  ctx.save();
  for (const o of game.others?.list?.values?.() || []) if (o.fishing && o.x != null) veNguoiKhac(ctx, game, o, t);
  if (game.fish) veCan(ctx, game, game.fish, t);
  veGon(ctx, game);
  for (const h of game.cauHat || []) { ctx.globalAlpha = 1 - h.t / h.T; ctx.fillStyle = h.t < h.T * 0.4 ? '#e8f6ff' : '#9ad0f0'; ctx.fillRect(h.x - 0.6, h.y - 0.6, 1.3, 1.3); }
  ctx.globalAlpha = 1;
  for (const b of game.cauBay || []) veBay(ctx, game, b, t);
  ctx.restore();
}

function mauCan(game, id) { return game.data.cave.materials[id]?.color || '#c8b070'; }

// Chỗ tay cầm, đầu cần theo hướng nước: cần chĩa ra phía nước và vểnh lên; câu thẳng lên / xuống thì cần lệch sang một bên cho khỏi đè người
function canHinh(x, y, dir, cang) {
  const d = Math.hypot(dir.x, dir.y) || 1, ux = dir.x / d, uy = dir.y / d, ben = Math.abs(uy) > 0.7 ? (ux >= 0 ? 7 : -7) : 0;
  const hx = x + ux * 3 + ben * 0.3, hy = y - 7;
  return { hx, hy, tx: hx + ux * 13 + ben, ty: hy + uy * 7 - 13 + (cang ? 4 : 0), ux, uy };
}
// Thân cần: viền tối dưới, màu cần trên, cong khi đang căng
function veThan(ctx, hx, hy, tx, ty, ux, cang, mau) {
  const mx = (hx + tx) / 2 + (cang ? ux * 3 : 0), my = (hy + ty) / 2 - (cang ? 1 : 3);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(20,14,10,0.85)'; ctx.lineWidth = 2.3; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke();
  ctx.strokeStyle = mau; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke();
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(hx - 1, hy - 1, 2, 2);
}

// Cần, dây, phao của mình
function veCan(ctx, game, f, t) {
  const p = game.player, cang = f.st === 'can' || f.st === 'gc', rung = f.st === 'gc' ? Math.sin(t * 40) * 1.2 : 0;
  const { hx, hy, tx, ty, ux } = canHinh(p.x, p.y, f.dir, cang);
  veThan(ctx, hx, hy, tx + rung, ty, ux, cang, mauCan(game, f.can || game.save.cau?.can));
  // phao
  let bx = f.bx, by = f.by;
  if (f.st === 'quang') { const k = 1 - cl(f.t / 0.45); bx = tx + (f.bx - tx) * k; by = ty + (f.by - ty) * k - Math.sin(k * Math.PI) * 14; }
  else if (f.st === 'cho') { const r = game.time - f.riaT; by += Math.sin(t * 3) * 0.6 + (r < 0.35 ? Math.sin(r / 0.35 * Math.PI) * 2.2 : 0); }
  else if (f.st === 'can') by += 2.5 + Math.sin(t * 30) * 0.8;
  else if (f.st === 'gc') { bx += Math.sin(t * 13) * 3; by += 2 + Math.cos(t * 17) * 1.5; }
  const chung = f.st === 'dut' ? cl(f.t / 0.6) : 1;
  ctx.strokeStyle = `rgba(240,240,255,${0.75 * chung})`; ctx.lineWidth = cang ? 0.7 : 0.5;
  ctx.beginPath(); ctx.moveTo(tx, ty);
  if (f.st === 'dut') ctx.quadraticCurveTo(tx + ux * 4, ty + 10, tx + ux * 6, ty + 16);
  else if (cang) ctx.lineTo(bx, by);
  else ctx.quadraticCurveTo((tx + bx) / 2, Math.max(ty, by) + 4, bx, by);
  ctx.stroke();
  if (f.st === 'dut') return;
  const chim = f.st === 'can' || f.st === 'gc';
  ctx.fillStyle = '#e0484a'; ctx.fillRect(bx - 1.2, by - 2.5 + (chim ? 1.5 : 0), 2.4, chim ? 1 : 2);
  if (!chim) { ctx.fillStyle = '#fff'; ctx.fillRect(bx - 1.2, by - 0.8, 2.4, 1.2); }
  if (f.st === 'can') {   // dấu chấm than trên phao: kéo ngay
    const a = 0.6 + 0.4 * Math.sin(t * 18);
    ctx.fillStyle = `rgba(255,228,90,${a})`; ctx.fillRect(bx - 0.9, by - 15, 1.8, 6); ctx.fillRect(bx - 0.9, by - 7.5, 1.8, 1.8);
  }
  if (f.st === 'gc') veGc(ctx, game, f, t);
}

// Thanh giằng co trên đầu người chơi
function veGc(ctx, game, f, t) {
  const g = f.gc, p = game.player, W = 54, H = 6, x0 = p.x - W / 2 + (g.rung ? Math.sin(t * 60) * g.rung * 1.5 : 0), y0 = p.y + 12;   // dưới chân: khỏi đè tên mốc, tên người trên đầu
  ctx.fillStyle = 'rgba(12,10,24,0.85)'; ctx.fillRect(x0 - 1.5, y0 - 1.5, W + 3, H + 3);
  ctx.fillStyle = '#3a2f5a'; ctx.fillRect(x0, y0, W, H);
  ctx.fillStyle = g.loe ? `rgba(255,255,200,${0.6 + 0.4 * g.loe})` : '#ffd24a'; ctx.fillRect(x0 + (g.z - g.w / 2) * W, y0, g.w * W, H);
  ctx.fillStyle = '#fff'; ctx.fillRect(x0 + g.kim * W - 0.8, y0 - 2, 1.6, H + 4);
  for (let i = 0; i < g.can; i++) { ctx.fillStyle = i < g.trung ? '#7dff8a' : 'rgba(255,255,255,0.25)'; ctx.fillRect(x0 + i * 4, y0 + H + 3, 2.6, 2.6); }
  for (let i = 0; i < g.ben; i++) { ctx.fillStyle = i < g.truot ? '#ff5a5a' : 'rgba(255,255,255,0.18)'; ctx.fillRect(x0 + W - 2.6 - i * 4, y0 + H + 3, 2.6, 2.6); }
}

function veGon(ctx, game) {
  ctx.lineWidth = 0.6;
  for (const g of game.cauGon || []) {
    const k = (game.time - g.t0) / 0.9;
    if (k < 0 || k > 1) continue;
    ctx.strokeStyle = `rgba(230,245,255,${(1 - k) * 0.7})`;
    ctx.beginPath(); ctx.ellipse(g.x, g.y + 0.5, 2 + k * 9, 1 + k * 3.5, 0, 0, Math.PI * 2); ctx.stroke();
  }
}

// Con vật bay khỏi nước về tay
function veBay(ctx, game, b, t) {
  const F = game.data.fishing, k = cl(b.t / b.T), p = game.data.cave.materials[b.id]?.pham || 0, ve = b.khac || game.player;
  const x1 = b.khac ? ve.x : game.player.x, y1 = (b.khac ? ve.y : game.player.y) - 14;
  if (b.t >= b.T) {   // tới tay: loé, tia nhỏ
    const a = 1 - cl((b.t - b.T) / 0.35), col = game.data.items.line_tiers.list[Math.min(6, p)].color;
    ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x1, y1, 4 + (1 - a) * 12, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i++) { const g = i / 6 * Math.PI * 2 + b.T, r = 5 + (1 - a) * 14; ctx.fillStyle = col; ctx.fillRect(x1 + Math.cos(g) * r - 0.7, y1 + Math.sin(g) * r - 0.7, 1.4, 1.4); }
    ctx.globalAlpha = 1; return;
  }
  const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2, x = b.x0 + (x1 - b.x0) * e, yl = b.y0 + (y1 - b.y0) * e;
  const cao = F.bay.cao * (b.to ? 1.25 : 1), y = yl - Math.sin(k * Math.PI) * cao;
  const s = (16 + p * 4) * (b.id === 'bac-minh-con' || b.id === 'thanh-long-ngu' ? 1.5 : 1);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, yl + 2, s * 0.35, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
  if (p >= 2) {   // vệt sáng loài quý
    const col = game.data.items.line_tiers.list[Math.min(6, p)].color;
    for (let i = 1; i <= 5; i++) {
      const kk = Math.max(0, k - i * 0.04), ee = kk < 0.5 ? 2 * kk * kk : 1 - (-2 * kk + 2) ** 2 / 2;
      ctx.globalAlpha = 0.5 * (1 - i / 6); ctx.fillStyle = col;
      ctx.fillRect(b.x0 + (x1 - b.x0) * ee - 1, b.y0 + (y1 - b.y0) * ee - Math.sin(kk * Math.PI) * cao - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  const quay = Math.sin(b.t * (b.to ? 11 : 18)) * (b.to ? 0.35 : 0.6), lat = x1 > b.x0 ? -1 : 1;
  ctx.save(); ctx.translate(x, y); ctx.rotate(quay); ctx.scale(lat, 1);
  const spr = anhCau(game.data, b.id), im = spr && spriteImage(spr);
  if (im) { ctx.imageSmoothingEnabled = true; ctx.drawImage(im, -s / 2, -s / 2, s, s); }
  else { ctx.imageSmoothingEnabled = false; ctx.drawImage(caHinh(game.data, b.id), -s / 2, -s / 2, s, s); }
  ctx.restore();
  if (b.n > 1) { ctx.fillStyle = '#ffe45a'; ctx.font = 'bold 6px sans-serif'; ctx.fillText('×' + b.n, x + s / 2, y - s / 2); }
}

// Người khác đang câu: cần theo hướng mặt, dây, phao nhấp nhô
function veNguoiKhac(ctx, game, o, t) {
  const { hx, hy, tx, ty, ux, uy } = canHinh(o.x, o.y, o.face || { x: 0, y: 1 }, false);
  const bx = o.x + ux * 28, by = o.y + uy * 24 + 4 + Math.sin(t * 3 + (o.id?.length || 0)) * 0.6;
  veThan(ctx, hx, hy, tx, ty, ux, false, '#c8b070');
  ctx.strokeStyle = 'rgba(240,240,255,0.6)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo((tx + bx) / 2, Math.max(ty, by) + 4, bx, by); ctx.stroke();
  ctx.fillStyle = '#e0484a'; ctx.fillRect(bx - 1.2, by - 2.5, 2.4, 2); ctx.fillStyle = '#fff'; ctx.fillRect(bx - 1.2, by - 0.8, 2.4, 1.2);
}
