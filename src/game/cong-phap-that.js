// Công pháp thật sự cộng bao nhiêu (chủ dự án 23/11/2026 12:43: "xem công pháp có thực sự đang hoạt động đúng chỉ số không").
// Luật chiến đấu mới (data/he-chien.json on; src/game/he-chien.js extraPct, quyết định 16/11/2026 16:20 "thưởng nhỏ có trần"): Công %, Sinh lực %,
// bạo kích, sát thương bạo kích, giảm hồi chiêu, hút máu, phản đòn, giảm sát thương (luật mới tính thành Thủ %) của CẢ các cuốn đang mang cộng
// lại rồi kẹp trần extra_cap.tech × line_f của chỉ số đó (23/11/2026 nới 10 → 40: một hai cuốn cùng chỉ số luôn nhận đủ); tốc chạy, tốc tu,
// hồi máu %, linh lực đi thẳng như luật cũ (không trần).
// File này tính lại đúng như vậy để bảng Công pháp hiện số người chơi thật sự nhận, không chỉ số thô per_level × tầng.
// Công pháp chỉ có chỉ số % (data/techniques.json); số phẳng Công / Máu / Thủ (extraPct đổi theo tổng luật cũ) không xử lý ở đây.
import { techStats } from './techniques.js';

const HC = data => (data['he-chien']?.on ? data['he-chien'] : null);

// Khoá chỉ số luật mới mà một chỉ số công pháp đổ vào (null: đi thẳng như luật cũ)
export const cpKhoa = (data, k) => HC(data)?.line_from?.[k] || null;

// Trần của khoá luật mới nk (đơn vị %), null nếu không trần
export function cpTran(data, nk) {
  const H = HC(data);
  if (!H || !nk) return null;
  return (H.extra_cap?.tech ?? 10) * (H.line_f?.[nk] ?? 1);
}

// Gom một bảng chỉ số luật cũ theo khoá hiện: Map(khoá → { tho, tran })
function gom(data, m) {
  const out = new Map();
  for (const [k, v] of Object.entries(m)) {
    if (!v) continue;
    const nk = cpKhoa(data, k), key = nk || k, g = out.get(key) || { tho: 0, tran: cpTran(data, nk) };
    g.tho += v; out.set(key, g);
  }
  return out;
}
const kep = (v, tran) => (tran == null ? v : Math.max(0, Math.min(v, tran)));

// Tổng các cuốn đang mang: [{ k: khoá hiện (luật mới nếu có trần), tho: cộng thô, that: thật nhận, tran: trần | null }]
export function cpThat(save, data) {
  return [...gom(data, techStats(save, data))].map(([k, g]) => ({ k, tho: g.tho, that: kep(g.tho, g.tran), tran: g.tran }));
}

// Một cuốn: từng chỉ số của nó và phần thật nhận. Đang mang: phần đã kẹp trần chia theo tỉ lệ góp. Chưa mang: mang thêm vào (không thay
// cuốn nào) thì tổng mới kẹp trần cộng thêm được bao nhiêu. [{ k, tho, that, tran }]
export function cpCuon(save, data, id) {
  const t = data.techniques.list[id], lv = save.techs?.[id]?.lv || 0;
  if (!t || !lv) return [];
  const mang = (save.techSlots || []).includes(id), tong = gom(data, techStats(save, data));
  const rieng = gom(data, Object.fromEntries(Object.entries(t.per_level).map(([k, v]) => [k, v * lv])));
  return [...rieng].map(([k, g]) => {
    if (g.tran == null) return { k, tho: g.tho, that: g.tho, tran: null };
    const co = tong.get(k)?.tho || 0;
    if (mang) return { k, tho: g.tho, that: co > 0 ? kep(co, g.tran) * g.tho / co : 0, tran: g.tran };
    return { k, tho: g.tho, that: kep(co + g.tho, g.tran) - kep(co, g.tran), tran: g.tran };
  });
}
