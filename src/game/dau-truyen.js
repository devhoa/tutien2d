// Dấu truyện: việc người chơi đã làm trong một nhiệm vụ chính để lại một dấu nhỏ trên bản đồ CỦA RIÊNG HỌ, quay lại lúc nào cũng còn thấy
// (ngọn nến thứ mười hai trên bàn lễ trước Hỏa Quật…). Khai ở data/story.json → dau: [{ co: cờ trong save.flags, map, at: [ô x, ô y], kieu, mau }].
// Dấu là hiệu ứng vẽ bằng code đặt lên vật đã có sẵn trên bản đồ, không thêm hình tĩnh nào. Kiểu:
//   nen  một ngọn lửa nến nhỏ lay nhẹ, có quầng sáng (src/render/draw-lights.js đọc f.dau để khoét bóng tối)
//   the  một tấm thẻ gỗ nhỏ có lỗ xỏ dây, thỉnh thoảng ánh lên một nét (thẻ tên người chơi đặt lên bàn lễ lúc vào quật; ra thì lấy lại: lệnh unflag tắt cờ)
//   bep  bếp lửa giữa trại: hai thanh củi bắt chéo, lửa nhảy, than đỏ, có quầng sáng (trại tán tu Hắc Phong dựng lại)
//   bat  một cái bát mẻ rửa sạch, thỉnh thoảng loé lên (bát của Mặc Ảnh trước cửa Hắc Phong Động)
//   bat-canh  cái bát ấy có canh: mặt canh vàng, hơi nóng bốc lên uốn lượn
//   giay  một chiếc giày nhỏ, mũi quay ra đường (lệ làng Thanh Khê: để người đi xa biết lối về)
//   nam   một cây nấm phát sáng cắm xuống đất (đèn mọc từ đất, lối vào Làng Tinh Linh), có quầng sáng, bào tử bay lên
//   re    rễ Cây mẹ trồi lên khỏi đất ở đầu Làng Tinh Linh, một đốm nhựa sáng chạy dọc thân rễ như mạch đang đập
//   mam   một cái mầm hai lá, lay theo gió (hạt Cây mẹ gieo cạnh quả chuông Thiên Kiếm)
// Một cờ có thể có nhiều dấu (bếp và mấy ngọn đèn quanh trại): mỗi dấu là một cặp cờ + chỗ đặt.
// Cờ tắt (unflag) thì dấu cũng mất ở nhịp kế.
import { addFx } from './combat.js';
import { every } from '../core/ticker.js';

const VE = {
  nen(ctx, f, k, game) {
    const t = game.time || 0, x = Math.round(f.x), y = Math.round(f.y), lay = Math.sin(t * 9 + f.seed) > 0.4 ? 1 : 0, cao = 3 + (Math.sin(t * 5 + f.seed * 2) > 0 ? 1 : 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.16; ctx.fillStyle = f.color; ctx.fillRect(x - 4, y - cao - 4, 9, cao + 7);   // quầng
    ctx.globalAlpha = 0.9; ctx.fillRect(x - 1 + lay, y - cao, 2, cao);   // thân lửa
    ctx.fillStyle = '#fff6d8'; ctx.fillRect(x + lay, y - 2, 1, 2);   // lõi sáng
    ctx.restore();
  },
  the(ctx, f, k, game) {
    const t = game.time || 0, x = Math.round(f.x), y = Math.round(f.y), anh = (t * 0.5 + f.seed) % 3 < 0.18;
    ctx.save();
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 3, y - 2, 7, 5);   // viền
    ctx.fillStyle = f.color; ctx.fillRect(x - 2, y - 1, 5, 3);   // mặt gỗ
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 1, y, 3, 1);   // nét khắc tên
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x + 1, y - 1, 1, 1);   // lỗ xỏ dây
    if (anh) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; ctx.fillStyle = '#fff6d8'; ctx.fillRect(x - 2, y - 1, 2, 1); }
    ctx.restore();
  },
  bep(ctx, f, k, game) {
    const t = game.time || 0, x = Math.round(f.x), y = Math.round(f.y);
    ctx.save();
    ctx.fillStyle = '#3a2416'; ctx.fillRect(x - 6, y, 12, 2); ctx.fillRect(x - 5, y - 1, 2, 1); ctx.fillRect(x + 3, y - 1, 2, 1);   // hai thanh củi bắt chéo
    ctx.fillStyle = '#6a3a1e'; ctx.fillRect(x - 4, y, 3, 1); ctx.fillRect(x + 1, y + 1, 3, 1);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const a = Math.sin(t * (6 + i * 1.7) + f.seed + i * 2.1), h = 5 + i % 2 * 2 + (a > 0 ? 2 : 0), dx = i - 1 + (a > 0.5 ? 1 : 0);   // ba lưỡi lửa nhảy so le
      ctx.globalAlpha = 0.85; ctx.fillStyle = i === 1 ? '#ffd98a' : f.color; ctx.fillRect(x + dx * 2 - 1, y - h, 2, h); }
    ctx.globalAlpha = 0.95; ctx.fillStyle = '#fff6d8'; ctx.fillRect(x - 1, y - 2, 2, 2);   // lõi
    for (let i = 0; i < 4; i++) { const q = (t * 0.7 + i * 0.25 + f.seed * 0.01) % 1;   // đốm than bay lên
      ctx.globalAlpha = (1 - q) * 0.9; ctx.fillStyle = '#ff9a5a'; ctx.fillRect(Math.round(x + Math.sin(q * 6 + i * 2) * 3), Math.round(y - 6 - q * 14), 1, 1); }
    ctx.restore();
  },
  bat(ctx, f, k, game) {
    const t = game.time || 0, x = Math.round(f.x), y = Math.round(f.y), anh = (t * 0.4 + f.seed) % 4 < 0.22;
    ctx.save();
    ctx.fillStyle = '#1e1a28'; ctx.fillRect(x - 4, y - 2, 9, 1); ctx.fillRect(x - 3, y - 1, 7, 2); ctx.fillRect(x - 2, y + 1, 5, 1);   // viền bát
    ctx.fillStyle = f.color; ctx.fillRect(x - 3, y - 1, 7, 1); ctx.fillRect(x - 2, y, 5, 1);   // thân sứ
    ctx.fillStyle = '#1e1a28'; ctx.fillRect(x + 2, y - 2, 2, 1);   // chỗ mẻ trên miệng
    if (anh) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.8; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y - 1, 2, 1); }
    ctx.restore();
  },
  'bat-canh'(ctx, f, k, game) {
    VE.bat(ctx, { ...f, color: '#c8c0e0' }, k, game);
    const t = game.time || 0, x = Math.round(f.x), y = Math.round(f.y);
    ctx.save();
    ctx.fillStyle = f.color; ctx.fillRect(x - 3, y - 2, 6, 1);   // mặt canh
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const q = (t * 0.45 + i / 3 + f.seed * 0.01) % 1;   // ba sợi hơi uốn lên rồi tan
      ctx.globalAlpha = Math.min(1, q * 4) * (1 - q) * 0.6; ctx.fillStyle = '#fff4e0';
      ctx.fillRect(Math.round(x - 2 + i * 2 + Math.sin(q * 7 + i) * 2), Math.round(y - 4 - q * 12), 1, 2); }
    ctx.restore();
  },
  giay(ctx, f, k, game) {
    const t = game.time || 0, x = Math.round(f.x), y = Math.round(f.y), anh = (t * 0.35 + f.seed) % 5 < 0.2;
    ctx.save();
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 4, y - 1, 8, 3); ctx.fillRect(x - 4, y - 3, 3, 2);   // viền: cổ giày bên trái, mũi quay phải (ra đường)
    ctx.fillStyle = f.color; ctx.fillRect(x - 3, y, 6, 1); ctx.fillRect(x - 3, y - 2, 1, 2);   // vải giày
    ctx.fillStyle = '#e8d8c0'; ctx.fillRect(x - 3, y + 1, 7, 1);   // đế
    if (anh) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6; ctx.fillStyle = '#fff6d8'; ctx.fillRect(x + 1, y, 2, 1); }
    ctx.restore();
  },
  nam(ctx, f, k, game) { veNam(ctx, Math.round(f.x), Math.round(f.y), f.color, game.time || 0, f.seed); },
  re(ctx, f, k, game) {
    const t = game.time || 0, x = Math.round(f.x), y = Math.round(f.y), D = 22;
    const cao = i => Math.round(Math.sin(i / D * Math.PI) * 6);   // vòm rễ: từ đất trồi lên rồi cắm xuống, dài 22 điểm ảnh, cao 6
    ctx.save();
    for (let i = 0; i <= D; i++) {
      const px = x - D / 2 + i, py = y - cao(i), day = i > 3 && i < D - 3 ? 4 : 3;
      ctx.fillStyle = '#21160e'; ctx.fillRect(px, py - 2, 1, day + 1);   // viền tối
      ctx.fillStyle = '#4a3220'; ctx.fillRect(px, py - 1, 1, day - 1);   // thân rễ (tối hơn ván gỗ lối đi cho dễ nhận)
      ctx.fillStyle = '#7a5a36'; ctx.fillRect(px, py - 1, 1, 1);   // mép trên bắt sáng
      if (i % 4 === 2) { ctx.fillStyle = '#5f8f3e'; ctx.fillRect(px, py - 2, 1, 1); ctx.fillRect(px + 1, py - 2, 1, 1); }   // rêu
    }
    for (const [dx, dy, w] of [[-D / 2 - 3, 1, 4], [D / 2, 1, 4], [D / 2 - 6, 2, 5]]) {   // rễ con bò ra hai bên rồi chui xuống đất
      ctx.fillStyle = '#21160e'; ctx.fillRect(x + dx, y + dy - 1, w, 2); ctx.fillStyle = '#4a3220'; ctx.fillRect(x + dx + 1, y + dy - 1, w - 2, 1);
    }
    ctx.globalCompositeOperation = 'lighter';
    const tho = 0.5 + 0.5 * Math.sin(t * 1.4 + f.seed);   // rễ thở chậm: mạch nhựa sáng lên rồi dịu
    ctx.fillStyle = f.color;
    for (let i = 2; i <= D - 2; i++) { ctx.globalAlpha = (0.25 + 0.35 * tho) * Math.sin(i / D * Math.PI); ctx.fillRect(x - D / 2 + i, y - cao(i) - 1, 1, 1); }   // mạch nhựa dọc lưng rễ
    const q = (t * 0.3 + f.seed * 0.013) % 1, i = Math.floor(q * (D + 1));   // một đốm nhựa chạy dọc rễ
    ctx.globalAlpha = 0.95 * Math.sin(q * Math.PI); ctx.fillRect(x - D / 2 + i, y - cao(i) - 1, 1, 1);
    ctx.globalAlpha = 0.3 * Math.sin(q * Math.PI); ctx.fillRect(x - D / 2 + i - 1, y - cao(i) - 2, 3, 3);
    ctx.globalAlpha = 0.07 + 0.07 * tho; ctx.fillRect(x - D / 2 + 2, y - 8, D - 3, 8);   // cả rễ ấm lên theo nhịp thở
    ctx.restore();
  },
  mam(ctx, f, k, game) {
    const t = game.time || 0, x = Math.round(f.x), y = Math.round(f.y), dx = Math.round(Math.sin(t * 1.7 + f.seed) * 1.2), sang = 0.6 + 0.4 * Math.sin(t * 1.1 + f.seed);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = f.color;   // ánh xanh rất nhẹ quanh mầm (bầu dục mờ, không thành khung vuông)
    for (const [rx, ry, a] of [[10, 7, 0.05], [6, 5, 0.08]]) { ctx.globalAlpha = a * sang; ctx.beginPath(); ctx.ellipse(x, y - 7, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = '#21160e'; ctx.fillRect(x - 5, y, 11, 2); ctx.fillStyle = '#4a3220'; ctx.fillRect(x - 4, y - 1, 9, 2); ctx.fillStyle = '#6a4a2c'; ctx.fillRect(x - 2, y - 1, 4, 1);   // ụ đất mới vun
    ctx.fillStyle = '#2f6a34'; ctx.fillRect(x, y - 6, 1, 5); ctx.fillRect(x + (dx > 0 ? 1 : dx < 0 ? -1 : 0), y - 9, 1, 3);   // thân mầm, ngọn nghiêng theo gió
    ctx.fillStyle = '#2f6a34'; ctx.fillRect(x - 6 + dx, y - 8, 6, 2); ctx.fillRect(x + 1 + dx, y - 11, 6, 2);   // viền hai lá
    ctx.fillStyle = f.color; ctx.fillRect(x - 5 + dx, y - 8, 4, 1); ctx.fillRect(x - 4 + dx, y - 9, 3, 1); ctx.fillRect(x + 2 + dx, y - 11, 4, 1); ctx.fillRect(x + 2 + dx, y - 12, 3, 1);   // lá trái, lá phải
    ctx.fillStyle = '#e8fff0'; ctx.fillRect(x - 4 + dx, y - 8, 1, 1); ctx.fillRect(x + 4 + dx, y - 11, 1, 1);   // gân lá bắt sáng
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.45 * sang; ctx.fillRect(x - 5 + dx, y - 9, 4, 2); ctx.fillRect(x + 2 + dx, y - 12, 4, 2);   // lá tự sáng nhẹ (đêm vẫn thấy)
    const q = (t * 0.22 + f.seed * 0.01) % 1; ctx.globalAlpha = (1 - q) * 0.7 * Math.min(1, q * 5); ctx.fillRect(Math.round(x + Math.sin(q * 6) * 3), Math.round(y - 12 - q * 14), 1, 1);   // một đốm sáng bay lên rồi tan
    ctx.restore();
  },
};
const SANG = { nen: 1, bep: 1, nam: 0.7, mam: 0.45 };   // kiểu dấu có quầng sáng trong bóng tối, độ sáng so với ngọn nến (src/render/draw-lights.js)

// Nấm phát sáng (dấu nam; vật nhặt nấm phát sáng trên đất cũng vẽ bằng hàm này, src/render/draw-loot.js): một cây to, một cây nhỏ, mũ sáng, bào tử bay lên
export function veNam(ctx, x, y, mau, t, seed = 0) {
  const sang = 0.75 + 0.25 * Math.sin(t * 2.2 + seed);   // nấm thở: sáng lên rồi dịu
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = mau;   // quầng sáng tròn: ba lớp bầu dục mờ dần ra ngoài (không thành khung vuông)
  for (const [rx, ry, a] of [[11, 7, 0.06], [8, 5, 0.09], [5, 3.5, 0.13]]) { ctx.globalAlpha = a * sang; ctx.beginPath(); ctx.ellipse(x, y - 6, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#16232a'; ctx.fillRect(x - 1, y - 6, 4, 6); ctx.fillRect(x + 4, y - 3, 3, 3);   // viền chân nấm (cây to, cây nhỏ)
  ctx.fillStyle = '#e4f0ea'; ctx.fillRect(x, y - 6, 2, 6); ctx.fillRect(x + 5, y - 3, 1, 3);   // chân nấm
  ctx.fillStyle = '#16232a'; ctx.fillRect(x - 5, y - 9, 12, 3); ctx.fillRect(x - 3, y - 10, 8, 1); ctx.fillRect(x + 3, y - 5, 5, 2);   // viền mũ
  ctx.fillStyle = mau; ctx.fillRect(x - 4, y - 8, 10, 1); ctx.fillRect(x - 3, y - 9, 8, 1); ctx.fillRect(x + 4, y - 4, 3, 1);   // mũ nấm
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y - 9, 1, 1); ctx.fillRect(x + 2, y - 8, 1, 1); ctx.fillRect(x + 5, y - 4, 1, 1);   // đốm trắng trên mũ
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.35 * sang; ctx.fillStyle = mau; ctx.fillRect(x - 3, y - 7, 8, 1);   // mép dưới mũ hắt sáng xuống chân
  for (let i = 0; i < 2; i++) { const q = (t * 0.28 + i * 0.5 + seed * 0.017) % 1;   // bào tử bay lên rồi tan
    ctx.globalAlpha = (1 - q) * 0.8; ctx.fillRect(Math.round(x - 2 + i * 5 + Math.sin(q * 5 + i) * 2), Math.round(y - 11 - q * 12), 1, 1); }
  ctx.restore();
}
export const DAU_KIEU = Object.keys(VE);

export function createDauTruyen(game) {
  const L = game.data.story.dau || [];
  if (!L.length) return;
  every(() => {
    const s = game.save, m = game.map;
    if (!s?.flags || !m || game.trip) return;
    for (const f of game.fx) if (f.dau && !s.flags[f.dau]) f.life = 0;   // cờ đã tắt: dấu mất
    for (const d of L) {
      const key = d.co + '@' + d.at;
      if (d.map !== m.id || !s.flags[d.co] || !VE[d.kieu] || game.fx.some(f => f.dauKey === key && f.map === m.id && f.life > 0)) continue;
      const c = m.center(d.at[0], d.at[1]);
      addFx(game, { type: 'dau', dau: d.co, dauKey: key, sang: SANG[d.kieu] || 0, map: m.id, x: c.x, y: c.y, life: 1e9, color: d.mau || '#ffb060', seed: d.at[0] * 7 + d.at[1], draw: VE[d.kieu] });
    }
  }, 700);
}
