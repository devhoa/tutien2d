// Chữ "trần" cho chỉ số % đã chạm trần cứng (chủ dự án 23/11/2026 19:1x, bảng chọn "Hiện chữ trần": người chơi đổi giày Giảm hồi chiêu
// qua lại không thấy chỉ số đổi vì đã chạm trần 41%, game không báo gì). Trần, dòng dồn càng nhiều càng ít thêm: src/game/he-chien.js
// sumStats (s.tran). Bảng Nhân vật: chữ "trần" cạnh số; tấm chi tiết món: dòng nhắc thêm dòng đó không mạnh hơn. Chữ ở data/he-chien.json → tran_chu.
import { mapLine } from '../game/he-chien.js';

const H = data => data?.['he-chien'];
const el = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls; e.textContent = text; return e; };
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

// stt: chỉ số của người đang xem (playerStats); k: khoá luật mới (cdr, crit, crit_dmg, lifesteal, thorns)
export function tranTag(data, stt, k) {
  if (!H(data)?.on || stt?.hc?.tran?.[k] == null) return null;
  return el('small', 'sv-tran', H(data).tran_chu?.nhan || 'trần');
}

// Dòng nhắc trong tấm chi tiết món: những chỉ số của món này mà người chơi đã chạm trần
export function tranNote(game, it) {
  const D = game.data, h = H(D), tran = game.player?.st?.hc?.tran;
  if (!h?.on || !tran || !it?.lines?.length) return null;
  const ks = [...new Set(it.lines.map(l => mapLine(h, l)?.k).filter(k => k && tran[k] != null))];
  if (!ks.length) return null;
  const t = ks.map(k => fill(h.tran_chu?.mon || '{ten} đang chạm trần {cap}%: thêm dòng này không mạnh hơn.', { ten: h.ten?.[k] || k, cap: tran[k] })).join(' ');
  return el('div', 'd-line d-tran', t);
}
