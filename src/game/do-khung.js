// Đo khung hình lúc đông người (CSKH #288, chủ dự án 26/11/2026: "đo trước rồi mới tối ưu" chuyện giật lag lúc đánh boss Thôn Thiên Mãng).
// Ở các bản đồ trong data/config.json → do_khung.maps, mỗi do_khung.s giây gửi PostHog sự kiện "khung_dong" (src/net/analytics.js; máy thử
// không gửi): số khung vẽ được mỗi giây, khoảng cách khung dài nhất, ms trung bình mỗi khung cho phần chạy game và phần vẽ, số người khác
// đang thấy, mức nhẹ máy, Tiết kiệm pin. Bỏ lúc tắt màn, mở bảng, ẩn trang. Chỉ để đo, không đổi gì trong game.
import { track } from '../net/analytics.js';

export function createDoKhung(game, cfg) {
  const C = cfg || {}, maps = new Set(C.maps || []), S = (C.s || 60) * 1000;
  let t0 = 0, n = 0, up = 0, ve = 0, gapMax = 0, prev = 0, nguoi = 0;
  const xoa = now => { t0 = now; n = 0; up = 0; ve = 0; gapMax = 0; nguoi = 0; };
  return {
    // now: mốc khung (rAF), u / v: ms chạy game / vẽ của khung này
    mark(now, u, v) {
      const g = now - prev; prev = now;
      if (!maps.has(game.map?.id) || game.manToi || game.uiOpen || game.dialog?.open || document.hidden) { xoa(now); return; }
      if (!t0 || g > 1000) { xoa(now); return; }   // vừa vào bản đồ / vừa quay lại trang: bắt đầu đo lại
      n++; up += u; ve += v; if (g > gapMax) gapMax = g; nguoi = Math.max(nguoi, game.others?.count?.() || 0);
      if (now - t0 < S) return;
      const P = game.perf, sec = (now - t0) / 1000;
      track('khung_dong', { ban_do: game.map.id, fps: Math.round(n / sec * 10) / 10, gap_max: Math.round(gapMax), js_ms: Math.round(up / n * 10) / 10,
        ve_ms: Math.round(ve / n * 10) / 10, nguoi, muc: P?.level ?? null, pin: !!P?.pin, dpr: Math.round((P?.dpr?.() || 1) * 100) / 100,
        nhan: navigator.hardwareConcurrency || null, ram: navigator.deviceMemory || null });
      xoa(now);
    },
  };
}
