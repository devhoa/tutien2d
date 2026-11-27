// Tông môn người chơi (data/guild.json): giữ bản tóm tắt tông môn của mình, gọi máy chủ qua net/guild.js.
// Lệnh nào đụng Linh Thạch trong bản lưu (lập, góp, nhận thưởng mốc) chạy qua game.cloud.run: máy chủ trừ/cộng
// trong bản lưu trên máy chủ, trả phien_ban mới, máy này sửa y như vậy (như chợ). Chat tông môn: kênh "bang:<id>" (world-chat.js).
import { addCoins } from './shop.js';
import { chanState, pullChan, sendChan } from './world-chat.js';
import { cleanName } from './others-net.js';

const G = game => game.data.guild;
const net = async () => (await import('../net/guild.js')).guildCalls;

export const canGuild = game => !!(game.online && game.cloud && game.save);

export function guildErr(game, e) {
  const m = String(e?.message || ''), E = G(game).err;
  return E[Object.keys(E).find(k => m.includes(k))] || E.other;
}

// mine: undefined (chưa tải) | null (chưa vào tông môn) | { bang, chuc, toi, tv, xin, tuan }
export const guildState = game => (game.guild ??= { mine: undefined, list: [] });

// Tên tông môn của mình, vẽ trên đầu mình (src/render/draw-nguoi.js; chủ dự án 23/11/2026 23:45: "tên tông môn của mọi người đã hiện nhưng
// bản thân thì chưa"). Người khác thấy tên do máy chủ phòng gắn (p2d_bang_ten_toi, data/dong-bo.json → ho_so.tong, không cho tự khai);
// phòng không gửi lại hồ sơ của chính mình nên mình lấy bản tông môn đã tải (p2d_bang_toi: lúc vào game, mỗi 10 phút, mở bảng Tông môn),
// lọc y như máy người xem (others-net.js cleanName) để hai bên cùng một chữ, cùng một màu.
let nhoTong = [null, null];
export function tenTongToi(game) {
  const t = guildState(game).mine?.bang?.ten || null;
  if (nhoTong[0] !== t) nhoTong = [t, t && (cleanName(t, game.data['dong-bo']?.ho_so?.tong?.dai || 20) || null)];
  return nhoTong[1];
}

export async function loadMine(game) {
  const s = guildState(game);
  s.mine = (await (await net()).mine()) || null;
  return s.mine;
}

export async function loadList(game, tim) {
  const s = guildState(game);
  s.list = (await (await net()).list(tim)) || [];
  return s.list;
}

// Lệnh không đụng bản lưu (xin vào, duyệt, chức vụ, mời ra, rời, sửa, điểm danh): gọi thẳng
export async function guildAct(game, name, ...args) {
  return (await net())[name](...args);
}

export async function createGuild(game, ten, moTa) {
  const c = await net();
  return game.cloud.run(() => c.create(ten, moTa), r => { addCoins(game, -r.gia, 'tong-mon'); game.persist(); });
}

// Tông chủ đổi tên tông môn: máy chủ trừ Tiên Ngọc (data/guild.json → rename.tn; p2d_bang_doi_ten), máy này lấy số dư máy chủ trả
export async function renameGuild(game, ten) {
  const c = await net();
  return game.cloud.run(() => c.rename(ten), r => {
    game.save.tn = r.tn;
    const m = guildState(game).mine; if (m?.bang) m.bang.ten = r.ten;
    game.persist();
  });
}

export async function donate(game, lt) {
  const c = await net();
  return game.cloud.run(() => c.donate(lt), r => { addCoins(game, -r.lt, 'tong-mon'); game.persist(); });
}

export async function claimMilestone(game, i) {
  const c = await net();
  return game.cloud.run(() => c.claim(i), r => {
    addCoins(game, r.coins, 'tong-mon');
    game.save.mats['tay-luyen-thach'] = (game.save.mats['tay-luyen-thach'] || 0) + r.stones;
    game.refreshStats?.(); game.persist();
  });
}

export const chatKey = game => { const m = guildState(game).mine; return m ? 'bang:' + m.bang.id : null; };
export const guildChat = game => chatKey(game) ? chanState(game, chatKey(game)) : null;
export const pullGuildChat = game => chatKey(game) ? pullChan(game, chatKey(game)) : Promise.resolve(false);
export const sendGuildChat = (game, text) => chatKey(game) ? sendChan(game, chatKey(game), text) : Promise.resolve('');
