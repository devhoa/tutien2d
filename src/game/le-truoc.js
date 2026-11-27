// Đột phá cảnh giới mà có lễ thức tỉnh đang chờ: lễ diễn ngay, xong mới tới bảng chúc mừng đột phá (tribulation.js ascend).
// Chủ dự án 27/11/2026 03:0x (Nguyên Anh: "thức tỉnh nguyên anh trước, sau đó mới chúc mừng"), 04:38 ("huyết mạch trc chúc mừng sau, thể phách trc
// chúc mừng sau giống nguyên anh"). Lên Trúc Cơ: lễ Cây Thế Giới gọi tên huyết mạch (le-toc.js); lên Kim Đan: lễ thức tỉnh thể phách (le-the.js);
// lên Nguyên Anh: lễ Kết Anh (le-anh.js). Lễ nào cũng một đời một lượt; lễ chưa làm được lúc này (máy chủ chưa trả lời) thì bảng chúc mừng vẫn hiện,
// lễ tự mở lại sau lúc màn yên như cũ (createLeToc / createLeThe / createLeAnh).
import { tnOn } from './tiem-nang.js';
import { tcOn, theMo } from './the-chat.js';
import { leToc, tocMo } from './le-toc.js';
import { leThe } from './le-the.js';
import { leAnh, anhTruoc } from './le-anh.js';

export const tocCho = game => { const s = game.save; return tnOn(game.data) && !!s?.element && !s.tiem?.toc && !game.leDang && tocMo(game); };
export const theCho = game => { const s = game.save, D = game.data; return tcOn(D) && !!s?.element && !s.theChat && !game.leDang && theMo(s, D) && (!tnOn(D) || !!s.tiem?.toc); };
export const coLeTruoc = game => tocCho(game) || theCho(game) || anhTruoc(game);

// Lần lượt: huyết mạch → thể phách → Nguyên Anh (người lên cảnh giới cao mà còn thiếu lễ dưới thì làm lễ dưới trước)
export async function leTruoc(game) {
  if (tocCho(game)) await leToc(game, 'he-thong');
  if (theCho(game)) await leThe(game);
  if (anhTruoc(game)) await leAnh(game);
}
