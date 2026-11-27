// Tùy chọn tự hành (data/config.json → pilot.opts): người chơi bật tắt từng việc ở Menu → Tự động. Mặc định bật, trừ việc khai "def": false.
// Việc tách ra từ việc cũ khai "theo": chưa chọn thì theo lựa chọn của việc cũ (góp ý #183 23/11/2026: tách "Tự khảm, ghép ngọc" thành
// "Tự khảm ngọc" (giữ id ngoc) và "Tự ghép ngọc"; ai đã tắt việc cũ thì việc ghép cũng đang tắt).
export const pilotOpt = (game, id) => {   // chưa chọn thì theo mặc định: bật, trừ việc khai "def": false (vd tự hồi sinh tại chỗ)
  const v = game.save?.pilotOpt?.[id], o = game.data?.config?.pilot?.opts?.find(x => x.id === id);
  if (v === undefined && o?.theo) return pilotOpt(game, o.theo);
  return v === undefined ? o?.def !== false : v !== false;
};
// Loài quái tự hành đang tạm tránh (vừa hạ mình, pilot.js → pilotDied)
export const avoided = (game, id) => (game.pilot?.avoid?.[id] || 0) > Date.now();
export function togglePilotOpt(game, id) {
  (game.save.pilotOpt ??= {})[id] = !pilotOpt(game, id);
  game.persist();
}
