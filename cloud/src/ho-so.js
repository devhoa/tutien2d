// Hồ sơ thật của người vào phòng: đọc dòng của chính họ trong p2d_nhan_vat bằng vé của họ (RLS chỉ cho đọc dòng mình):
// tên hiển thị, lực chiến máy chủ đang giữ (đã qua chống hack); cờ đỏ hỏi p2d_co_toi (bảng cờ đỏ thật p2d_co_do, trừ tài khoản miễn
// khoá — 06/11/2026: trước đây lấy nghi_van ≥ 10 nên Đại Ma Thần, nghi_van tích từ cảnh báo lực chiến, bị chặn thưởng boss).
// Tổng tầng tu tl (canh_gioi × 9 + tang − 1; 4 = Luyện Khí tầng 5) để phòng che người mới khỏi ma (src/ma.js, 22/11/2026).
// Tên tông môn (góp ý #195, chủ dự án chọn kiểu A 23/11/2026): p2d_bang_ten_toi, hiện trên đầu cho người khác thấy, không cho tự khai.
// Hộ Tông gia trì (26/11/2026, ho-tong.js): p2d_bang_vai_toi trả { ten, chuc, tinh } (tên tông môn, chức vụ, mã tinh cầu đang sống của tông môn)
// trong MỘT lần gọi, thay p2d_bang_ten_toi. Máy chủ dữ liệu chưa có hàm mới (404) thì hỏi tên như cũ, không có gia trì.
// Giữ 60 giây trong bộ nhớ.
const cache = new Map();
const CHUC = new Set(['chu', 'pho', 'lao', 'de']), LA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function profileOf(uid, token, env) {
  const c = cache.get(uid);
  if (c && Date.now() - c.at < 60000) return c.v;
  try {
    const h = { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${token}` };
    const rpc = ten => fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${ten}`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{}' });
    const [r, rc, rv] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/p2d_nhan_vat?select=ten,luc_chien,canh_gioi,tang&user_id=eq.${encodeURIComponent(uid)}`, { headers: h }),
      rpc('p2d_co_toi'),
      rpc('p2d_bang_vai_toi').catch(() => null),
    ]);
    let tg = null, vai = null;
    if (rv?.ok) { vai = await rv.json().catch(() => null); tg = vai?.ten; }
    else { const rt = await rpc('p2d_bang_ten_toi').catch(() => null); tg = rt?.ok ? await rt.json().catch(() => null) : null; }   // hàm mới chưa có: chỉ tên tông (hàm tên cũng chưa có: không có tên)
    if (!r.ok) return null;
    const row = (await r.json())[0], co = rc.ok ? (await rc.json().catch(() => false)) === true : false;
    const v = row ? { name: String(row.ten || 'Đạo hữu').slice(0, 24), power: Math.max(0, Number(row.luc_chien) || 0), co, tl: Math.max(0, (Number(row.canh_gioi) || 0) * 9 + (Number(row.tang) || 1) - 1), tong: typeof tg === 'string' ? tg.slice(0, 20) : '',
      chuc: CHUC.has(vai?.chuc) ? vai.chuc : '', tinh: typeof vai?.tinh === 'string' && LA.test(vai.tinh) ? vai.tinh.toLowerCase() : '' } : null;
    if (cache.size > 5000) cache.clear();
    cache.set(uid, { at: Date.now(), v });
    return v;
  } catch { return null; }
}
