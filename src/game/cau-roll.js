// Câu cá: tung loài cá cắn câu, cỡ cá (chủ dự án 24/11/2026 00:38; số ở data/fishing.json). Hàm thuần, không đụng game, để bài thử
// tools/cau-ca.test.mjs đo được tỉ lệ từng bộ đồ. ctx: { realm, map, noi: 'nuoc' | 'hai', night, rain, season, moi, can, phuc }
//   moi: mã mồi đang móc (null: câu trần), can: mã cần, phuc: lần này còn phúc duyên.
// Trọng số một loài = w × (mồi hút nhóm tag; cá từ phẩm may_p.tag_cao chỉ nhân căn bậc hai) × (mồi đổi phẩm pk)
//   × L^(mu × min(p − tu + 1, tran)) với cá phẩm p ≥ tu (may_p.tu), L = may cần × may mồi × phúc (Tiên, Thượng Cổ hiếm theo w, may chỉ nâng như Thiên).
// Câu trần chỉ ra cá tới phẩm tran_khong_moi. Cá có moi chỉ cắn đúng mồi đó (Thượng Cổ: Long Tiên Hương).

export const C = data => data.fishing;
export const phamCa = (data, id) => data.cave.materials[id]?.pham ?? 0;
export const canOf = (data, id) => C(data).can[id] || C(data).can[C(data).can_san];
export const moiOf = (data, id) => (id && C(data).moi[id]) || null;

export function mayOf(data, ctx) {
  const F = C(data);
  return canOf(data, ctx.can).may * (moiOf(data, ctx.moi)?.may || 1) * (ctx.phuc ? F.phuc.k : 1);
}

// Loài này cắn câu được lúc này, ở đây không (chưa tính mồi)
export function hopCho(data, f, ctx) {
  if ((ctx.realm || 0) < (f.realm || 0)) return false;
  if (f.maps && !f.maps.includes(ctx.map)) return false;
  if (f.noi && f.noi !== ctx.noi) return false;
  if (f.night && !ctx.night) return false;
  if (f.day && ctx.night) return false;
  if (f.rain && !ctx.rain) return false;
  if (f.season && f.season !== ctx.season) return false;
  return true;
}

// [[mã, trọng số]] các loài có thể cắn lần này
export function canNang(data, ctx) {
  const F = C(data), moi = moiOf(data, ctx.moi), L = mayOf(data, ctx), tu = F.may_p.tu, out = [];
  for (const [id, f] of Object.entries(F.fish)) {
    const p = phamCa(data, id);
    if (!hopCho(data, f, ctx)) continue;
    if (!moi && p > F.tran_khong_moi) continue;
    if (f.moi && f.moi !== ctx.moi) continue;
    let w = f.w;
    for (const t of f.tag || []) { const k = moi?.tag?.[t] || 1; w *= p >= F.may_p.tag_cao ? Math.sqrt(k) : k; }
    w *= moi?.pk?.[p] ?? 1;
    if (p >= tu) w *= Math.pow(L, F.may_p.mu * Math.min(p - tu + 1, F.may_p.tran));
    if (w > 0) out.push([id, w]);
  }
  return out;
}

export function tungCa(data, ctx, rnd = Math.random) {
  const ds = canNang(data, ctx);
  if (!ds.length) return null;
  let r = rnd() * ds.reduce((a, [, w]) => a + w, 0);
  for (const [id, w] of ds) if ((r -= w) <= 0) return id;
  return ds[ds.length - 1][0];
}

// Tỉ lệ từng phẩm (0..6) với ctx này: để bài thử, bảng Lão Ngư Ông đo
export function tiLePham(data, ctx) {
  const ds = canNang(data, ctx), tong = ds.reduce((a, [, w]) => a + w, 0) || 1, out = [0, 0, 0, 0, 0, 0, 0];
  for (const [id, w] of ds) out[phamCa(data, id)] += w / tong;
  return out;
}

// Cỡ cá: phần lớn nhỏ, hiếm con to; 2% là con khổng lồ dài hơn mức thường tới 25%
export function tungCm(data, id, rnd = Math.random) {
  const [a, b] = C(data).fish[id]?.cm || [10, 30], k = Math.pow(rnd(), 1.6), to = rnd() < 0.02 ? 1 + rnd() * 0.25 : 1;
  return Math.round((a + (b - a) * k) * to * 10) / 10;
}
export const kgCua = cm => Math.round(12 * Math.pow(cm / 100, 3) * 100) / 100;   // nặng theo dài mũ ba (cá dài gấp đôi nặng gấp tám)

// Thời gian chờ cá cắn (giây) với cần, mồi đang dùng
export function thoiGianCho(data, ctx, rnd = Math.random) {
  const F = C(data), [a, b] = F.wait, moi = moiOf(data, ctx.moi);
  return (a + rnd() * (b - a)) * canOf(data, ctx.can).nhanh * (moi ? moi.nhanh : F.khong_moi_cham);
}
