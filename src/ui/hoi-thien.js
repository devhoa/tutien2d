// Hỏi lại trước khi phân giải, bán, tẩy luyện món phẩm Thiên trở lên ở tấm chi tiết món (chủ dự án 25/11/2026, sau CSKH #237:
// một người bấm nhầm Phân giải, mất kiếm phẩm Thiên +10 vừa cường hoá). Phẩm phải hỏi, chữ ở data/shop.json → hoi_lai.
// hoiThien(game, it, viec, fn): viec 'pg' | 'ban' | 'tay'; trả hàm bấm nút: món phẩm thấp gọi thẳng fn, phẩm cao hiện hộp hỏi nhỏ (hoi-nho.js),
// chọn đúng việc mới gọi fn. Nút gốc truyền lại cho fn (hàm wait của bag-detail.js đọc currentTarget để hiện "Đang hỏi máy chủ…").
import { hoiNho } from './hoi-nho.js';
import { itemTier } from '../game/tiers.js';
import { itemName } from '../game/items.js';

export const canHoi = (data, it) => !!it && !data.items.bases[it.base]?.dv && (   // món Đạo Vận đã có bấm hai lần (bag-detail.js sure)
  data.shop.hoi_lai?.pham || []).includes(itemTier(data, it).id);

export function hoiThien(game, it, viec, fn) {
  return async e => {
    const b = e?.currentTarget, { data } = game, H = data.shop.hoi_lai;
    if (canHoi(data, it)) {
      const chu = H['chu_' + viec].replace('{item}', itemName(data, it)).replace('{tier}', itemTier(data, it).name);
      const r = await hoiNho(chu, [{ id: 'ok', label: H['ok_' + viec], gold: true }, { id: 'thoi', label: H.thoi, nho: true }]);
      if (r !== 'ok') return;
    }
    return fn({ currentTarget: b });
  };
}
