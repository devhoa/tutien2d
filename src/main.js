// Khởi động: nạp dữ liệu, dựng màn hình, vòng lặp khung hình.
import { caIco, laDoCau } from './ui/cau-ico.js';
import { createCauThe } from './ui/cau-the.js';
import './core/host-guard.js';
import { laKhungNgoai } from './core/khung-doc.js';   // máy tính: trang ngoài chỉ là khung dọc ở giữa, game chạy trong khung (23/11/2026)   // chỉ chạy ở tên miền chính, địa chỉ khác chuyển về www.pixel2dtutien.com
import './core/clock.js';   // đồng hồ tin được: phải nạp trước mọi thứ dùng Date
import './ui/ban-phim.js';   // bàn phím ảo bật lên khi đang gõ trong bảng: đáy bảng đặt trên mép bàn phím (23/11/2026)
import { loadData } from './core/data.js';
import { createScreen } from './core/screen.js';
import { createPerf } from './core/perf.js';
import { createDoKhung } from './game/do-khung.js';
import { createInput } from './core/input.js';
import { createGame } from './game/game.js';
import { startBayCanh } from './ui/bay-canh-start.js';
import { createFrameDim } from './ui/frame-dim.js';
import { createManToi } from './ui/man-toi.js';
import { createRewardShow } from './ui/reward-show.js';
import { createNvHud } from './ui/nv-hud.js';
import { createHenMai } from './ui/hen-mai.js';
import { createMung } from './ui/mung.js';
import { createMungCanh } from './ui/mung-canh.js';
import { createMungThem } from './ui/mung-them.js';
import { createChuLon } from './ui/chu-lon.js';
import { createDauTruyen } from './game/dau-truyen.js';
import { createLeToc } from './game/le-toc.js';
import { createLeThe } from './game/le-the.js';
import { createNguyenAnh } from './game/nguyen-anh.js';
import { createLeAnh } from './game/le-anh.js';
import { createAnhBtn } from './ui/anh-btn.js';
import { createLeTheUI } from './ui/le-the.js';
import { knNap } from './game/ky-nang.js';   // Kỹ năng: bộ kỹ năng theo truyện vào bảng chiêu của bộ máy lúc nạp (data/ky-nang.json → chieu)
import { createLeTocUI } from './ui/le-toc.js';
import { createLeAnhUI } from './ui/le-anh.js';
import { startHenMai } from './game/hen-mai.js';
import { watchTuVao, tuVao } from './ui/tu-vao.js';
import { drawWorld, drawOverlay } from './render/draw.js';
import { drawTrip } from './render/flight.js';
import { createHud } from './ui/hud.js';
import { createLogin } from './ui/login.js';
import { createAudio } from './core/audio.js';
import { clickSounds } from './ui/click-sound.js';
import { createRecord } from './game/record.js';
import { createPortraits } from './ui/portrait.js';
import { createZalo } from './ui/zalo.js';
import { createFeedback } from './ui/feedback-panel.js';
import { createCskh } from './ui/cskh.js';
import { createInbox } from './ui/inbox-panel.js';
import { createProfile } from './ui/profile-panel.js';
import { createReferral } from './ui/referral-panel.js';
import { createNotice } from './ui/notice-panel.js';
import { createFaq } from './ui/faq-panel.js';
import { createHeThong } from './ui/he-thong.js';
import { createDunResult } from './ui/dun-result.js';
import { orderHud } from './ui/hud-order.js';
import { createHudGon } from './ui/hud-gon.js';
import { createHudAva } from './ui/hud-ava.js';
import { createSideNav } from './ui/side-nav.js';
import { createChatDock } from './ui/chat-dock.js';
import { startDaoLu } from './game/daolu.js';
import { startSuDo } from './game/su-do.js';
import { createSuDoPanel } from './ui/su-do-panel.js';
import { createQuestDock } from './ui/quest-dock.js';
import { createSelfPanel } from './ui/self-panel.js';
import { createRetreatPanel } from './ui/retreat-panel.js';
import { createFriendsPanel } from './ui/friends-panel.js';
import { hookVisit } from './game/friends.js';
import { createNameNudge } from './ui/name-nudge.js';
import { startReferral } from './game/referral.js';
import { startInbox } from './game/inbox-feed.js';
import { startChatPush } from './game/chat-push.js';
import { createBag } from './ui/bag.js';
import { createSkillsPanel } from './ui/skills-panel.js';
import { createCavePanel } from './ui/cave-panel.js';
import { createPetsPanel } from './ui/pets-panel.js';
import { createDailyPanel } from './ui/daily-panel.js';
import { createAchvPanel } from './ui/achv-panel.js';
import { createWorldMap } from './ui/world-map.js';
import { createMiniMap } from './ui/mini-map.js';
import { createHudBang } from './ui/hud-bang.js';
import { createHopThu } from './ui/hop-thu.js';
import { createSocialPanel } from './ui/social-panel.js';
import { initPwa, recoverStale } from './core/pwa.js';
import { initApkOffer } from './core/apk-offer.js';
import { catchErrors } from './core/catch-errors.js';
import { createMarketPanel } from './ui/market-panel.js';
import { startMailCheck } from './game/market.js';
import { startMangLich } from './game/mang-lich.js';
import { createTopupPanel } from './ui/topup-panel.js';
import { createGuildPanel } from './ui/guild-panel.js';
import { khWatch } from './game/khai-hoang.js';
import { createMenuPanel } from './ui/menu-panel.js';
import { gridCards } from './ui/grid-cards.js';
import { leHoi } from './ui/le-hoi.js';
import { createFeed } from './ui/feed.js';
import { startNetWatch } from './game/net-watch.js';
import { startTreoMay } from './game/treo-may.js';
import { startViTri } from './game/vi-tri.js';
import { startCheckinNudge } from './game/checkin-nudge.js';
import { createFarmTeamPanel } from './ui/farm-team-panel.js';
import { createPhapBaoPanel } from './ui/phap-bao-panel.js';
import { createMangPanel } from './ui/mang-panel.js';
import { createPvpBtn } from './ui/pvp-btn.js';
import { batPhongHao } from './game/phong-hao.js';   // phong hào trước tên: tải bảng Sức mạnh, Ma hóa để tra hạng (data/status.json → phong_hao)
import { createOtherMenu } from './ui/other-menu.js';
import { createDuelBtn } from './ui/duel-btn.js';
import { createKhRoiBtn } from './ui/kh-roi-btn.js';
import { createSapXep } from './ui/sap-xep.js';
import { gemIcon } from './ui/gem-icon.js';
import { spriteIcon } from './ui/sprite-icon.js';
import { createMangLeave } from './ui/mang-leave.js';
import { startAnalyticsHook } from './game/analytics-hook.js';
import { startHinhBao } from './game/hinh-bao.js';   // hình tải hỏng thì máy báo về bảng lỗi (26/11/2026)
import { hcData } from './game/he-chien.js';
import { startHoTong } from './game/ho-tong.js';   // Hộ Tông gia trì: + sức mạnh theo chức vụ khi ở tinh cầu tông môn mình (26/11/2026)
import { mocThu } from './game/thu-moc.js';   // móc cho bài thử tự động (chỉ khi ?thu=1)

async function boot() {
  catchErrors();   // lỗi trên máy người chơi gửi về máy chủ (khi đã đăng nhập)
  initPwa(document.getElementById('btn-install'));
  const canvas = document.getElementById('game');
  const data = knNap(hcData(await loadData()));   // luật chiến đấu mới (data/he-chien.json on): đổi bảng quái một lần lúc nạp (src/game/he-chien.js)
  initApkOffer(data.config.android);   // lời mời tải bản Android (chỉ trình duyệt Android)
  let screen = null;
  const perf = createPerf(data.config, () => screen.resize());   // nhẹ máy: giới hạn khung hình, tự hạ độ phân giải khi chậm
  screen = createScreen(canvas, data.config, perf.dpr);
  const input = createInput(canvas);
  const audio = createAudio(data.sounds, data['tieng-chieu']?.sfx);   // tiếng chung + tiếng riêng từng chiêu (data/tieng-chieu.json)
  const ui = createHud(audio, data.config.dialog);
  const game = createGame(data, screen, input, ui, audio);
  game.perf = perf;   // Menu → Tiết kiệm pin (src/ui/side-nav.js), số quầng sáng (src/render/draw-lights.js)
  createBag(game);
  createSkillsPanel(game);
  createCavePanel(game);
  createPetsPanel(game);
  createDailyPanel(game);
  createAchvPanel(game);
  game.worldMap = createWorldMap(game);
  createMiniMap(game);   // bản đồ tròn góc phải trên (thay nút Bản đồ)
  createHopThu(game);   // nút Thư gộp Hòm thư, Zalo, Đề xuất, Báo lỗi
  createSocialPanel(game);
  createMarketPanel(game); startMailCheck(game); startMangLich(game);   // boss Thôn Thiên Mãng 20:30–21:00 giờ VN
  createTopupPanel(game);
  createGuildPanel(game);
  createMenuPanel(game);   // nút Menu: mọi chức năng, phó bản (data/menu.json)
  leHoi(game);
  createFeed(game);   // linh khí, Linh Thạch, nhặt đồ: cột thông báo bên trái   // khung giao diện đổi đèn theo mùa lễ hội (style-khung.css)
  gridCards(game);   // thẻ trong các bảng hiện thành lưới ô như túi đồ, chạm ô xem chi tiết
  clickSounds(game);
  window.__game = game; // để kiểm thử tự động đọc trạng thái
  mocThu();
  createRecord(game, audio).catch(() => {});   // nút quay clip cạnh nút tiếng (data/record.json); lỗi thì game vẫn chạy
  createPortraits(game).catch(() => {});   // chân dung NPC trên hộp thoại (data/portraits.json)
  createZalo(game);   // nút nhóm Zalo cạnh nút quay clip (data/community.json)
  createFeedback(game);   // nút ẩn Báo lỗi, Đề xuất cho chỗ cũ bấm hộ: mở CSKH (src/ui/cskh.js)
  createProfile(game);   // chạm tên ở bảng xếp hạng: hồ sơ, nút So tài (data/duel.json)
  createReferral(game); startReferral(game);   // sự kiện giới thiệu nhận ngọc (data/referral.json)
  game.openFame = () => { game.closeAll?.(); game.rankKind?.('qtv'); game.openSocial?.('rank'); };   // bảng vinh danh góp ý cũ đã thay bằng Bảng quản trị viên (Xếp hạng)
  createDunResult(game);   // bảng kết quả bí cảnh: ô vuông đồ thu được, Tiếp tục / Càn quét / Thoát
  createHeThong(game);   // Hệ Thống Tu Tiên đi theo ký chủ (data/he-thong.json)
  createCskh(game);   // nút CSKH (thay mục Góp ý của Hệ Thống, data/community.json → cskh); sau Hệ Thống để game.openGopY trỏ về CSKH
  createFaq(game);   // nút ! góc trên phải: bảng Câu hỏi thường gặp cho người mới (data/faq.json)
  createNotice(game); createNameNudge(game);   // nhắc người còn tên mặc định đặt tên; nút 📢 bảng thông báo, nút sự kiện trên bảng điều khiển (data/notice.json)
  startNetWatch(game); if (!game.data.daily?.off) startCheckinNudge(game); khWatch(game); startHoTong(game);   // startHoTong: Hộ Tông gia trì (src/game/ho-tong.js); khWatch: tinh cầu khai hoang (src/game/khai-hoang.js); game online: mất liên lạc máy chủ quá 10 giây thì đứng hình, quá 1 phút về màn đăng nhập (data/config.json → net_watch)
  startChatPush(game);   // chat, truyền âm máy chủ đẩy qua Realtime; các vòng đọc cũ thành đọc bù (data/config.json → realtime)
  createInbox(game); startInbox(game);   // nút Hòm thư cạnh Menu, gom tin chợ, truyền âm, tông môn, thế giới (data/inbox.json)
  createSelfPanel(game); createRetreatPanel(game); createFriendsPanel(game); hookVisit(game);   // bạn bè, thăm nhà bạn   // bảng thưởng bế quan tích luỹ (Nhiệm vụ)   // chạm tên / cảnh giới: bảng nhân vật (nhóm D)
  startDaoLu(game);   // đạo lữ giữa hai người chơi: đọc trạng thái định kỳ, thưởng +5%
  startSuDo(game); createSuDoPanel(game);   // sư đồ: chỉ điểm, hành lễ (src/game/su-do.js)
  createMangLeave(game);   // nút Rời đi vùng Thôn Thiên Mãng
  createDuelBtn(game);   // nút Rời đài lúc so tài
  createKhRoiBtn(game);   // nút Rời trận lúc ở bản đồ trận Khai Tinh (CSKH #267)
  createOtherMenu(game);   // chạm người chơi khác: Trò chuyện / Xem thông tin / Kết bạn
  game.dialog.iconOf = (k, size) => (k.startsWith('gem:') ? gemIcon(game, k.slice(4), size) : !game.data.art.sprites[k] && k.startsWith('ui.vk-') && laDoCau(game.data, k.slice(6)) ? caIco(game.data, k.slice(6), size, 'mt-ico') : spriteIcon(game, k, 0, size, 'mt-ico', true));   // hình món ở lưới quầy bán (ui/dialog.js); đồ câu chưa có ảnh GPT: vẽ bằng code (ui/cau-ico.js)
  createCauThe(game);   // thẻ nhận đồ câu, giữ trên màn tới khi bấm đóng (src/ui/cau-the.js)
  createPvpBtn(game);   // nút Bảo vệ PvP ở Ngoại Vực Vết Nứt (data/pvp.json)
  batPhongHao(game);
  createMangPanel(game);   // bảng boss thế giới Cửu Đầu Thôn Thiên Mãng bên phải (data/thien-mang.json)
  createPhapBaoPanel(game);   // Hệ Pháp Bảo Luyện Chế: game.openPhapBao mở Trang bị → Pháp bảo (src/ui/self-pb-page.js)
  createFarmTeamPanel(game);   // tổ đội farm ngoài thế giới mở: danh sách đội trên tinh cầu, thưởng +10% mỗi đồng đội cùng chỗ (data/doi-farm.json)
  createChatDock(game); if (!game.data.daily?.off) createQuestDock(game);   // off: bỏ nhiệm vụ hằng ngày (chủ dự án 06/11/2026), hệ thống thay
    // khung trò chuyện nhỏ dưới màn hình, cột nhiệm vụ hằng ngày bên phải
  createSideNav(game);   // nút Túi đồ, Menu, Động phủ: cột mục bên trái, nội dung bên cạnh (data/menu.json → nav)
  orderHud(game); createHudGon(game); createHudAva(game); createHudBang(game);   // thu gọn nút, ẩn giao diện (hud-gon.js); nút trên màn hình theo nhóm A–L (data/menu.json → hud), sau khi các nút đã được tạo; bố cục hai bảng trên / dưới (hud-bang.js)
  createSapXep(game);   // Menu → Sắp xếp giao diện: kéo, co giãn khung, lưu trong máy (chủ dự án 19/11/2026 10:50)
  document.getElementById('loading').hidden = true;
  try { sessionStorage.removeItem('p2d-recover'); } catch { /* chế độ riêng tư */ }

  createFrameDim(game);   // dải trên, dải dưới tối đi, phần giữa là khung chơi và khung quay video (src/ui/frame-dim.js)
  createManToi(game);   // nút Tắt màn khi treo game: lớp đen kín màn hình, game vẫn chạy nhưng thôi vẽ (src/ui/man-toi.js)
  createNvHud(game);   // thẻ nhiệm vụ chính 1 → N, kể cả các bậc của chặng leo bậc đầu game (src/ui/nv-hud.js)
  createHenMai(game); startHenMai(game);   // thẻ "Hẹn ngày mai": bế quan được gì, quà ngày mai, bậc kế tiếp (docs/10-CAI-HON.md việc 5b)
  createRewardShow(game);   // nghi lễ nhận thưởng: nền tối, vầng sáng xoay sau món đồ (src/ui/reward-show.js, docs/10-CAI-HON.md việc 4)
  createChuLon(game); createDauTruyen(game);   // Trấn Ma Kỷ đi theo nhiệm vụ chính: hàng chữ lớn bên trái màn cho khẩu quyết và khoảnh khắc truyện (src/ui/chu-lon.js), dấu việc đã làm để lại trên bản đồ (src/game/dau-truyen.js)
  createNguyenAnh(game); createLeAnhUI(game); createLeAnh(game); createAnhBtn(game);   // Nguyên Anh: lễ Kết Anh lần đầu, xuất khiếu đánh cùng (src/game/nguyen-anh.js, le-anh.js; docs/21)
  createLeTheUI(game); createLeThe(game);   // Thể chất: lễ thức tỉnh thể phách lúc Kết Đan, một đời một lượt (src/game/le-the.js, màn lễ src/ui/le-the.js)
  createLeTocUI(game); createLeToc(game);   // Tiềm năng: lễ Cây Thế Giới gọi tên huyết mạch, một đời một lượt (src/game/le-toc.js, màn lễ src/ui/le-toc.js)
  createMung(game); createMungCanh(game); createMungThem(game);   // màn mừng mạnh lên: cường hoá, tẩy luyện… (src/ui/mung.js); lên tầng, đột phá cảnh giới (src/ui/mung-canh.js); linh thú, động phủ, ngọc, công pháp (src/ui/mung-them.js); docs/10-CAI-HON.md việc 4b
  startBayCanh(game);   // bố cục đồ chủ dự án tự bày (máy chủ), nút Bày cho người có quyền (src/ui/bay-canh*.js)
  startHinhBao(game);
  startAnalyticsHook(game);   // đo người chơi bằng PostHog (data/config.json → analytics), bọc game.begin nên đặt trước màn đăng nhập
  watchTuVao(game);   // trang tự tải lại (bản mới, mất kết nối lâu) thì vào lại game, bật lại Tự đánh / Tự hành (src/ui/tu-vao.js)
  startTreoMay(game);   // đứng yên quá treo_may.phut phút mà không treo việc gì: lưu rồi về màn đăng nhập (src/game/treo-may.js)
  startViTri(game);   // nhớ chỗ đứng trên máy này để vào lại đúng chỗ (src/game/vi-tri.js)
  const login = createLogin(opts => game.begin(opts), { google: !!game.data.config.auth?.google, tuVao: go => tuVao(game, go) });
  login.start();

  let last = performance.now(), lastErr = '', lastUi = 0;
  const doKhung = createDoKhung(game, data.config.do_khung);
  function frame(now) {
    requestAnimationFrame(frame);   // xếp khung sau trước: một lỗi trong khung này không làm đứng hình cả game
    if (!perf.tick(now, game)) return;   // màn 120 Hz, đang mở bảng: bỏ bớt khung cho mát máy
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const bao = e => { if (e.message !== lastErr) { lastErr = e.message; setTimeout(() => { throw e; }); } };   // báo một lần (core/catch-errors.js gửi về máy chủ)
    try {
      const tU = performance.now(); game.update(dt); const tV = performance.now();
      try {
        if (game.manToi || !screen.coVe()) { /* đang tắt màn (src/ui/man-toi.js) hoặc máy chưa cấp được khung vẽ: game vẫn chạy, không vẽ gì */ }
        else if (game.trip) drawTrip(game, screen);
        else { drawWorld(game, screen, now / 1000); drawOverlay(game, screen, input); }
      } catch (e) { screen.lamSach(); bao(e); }   // vẽ lỗi: dọn lớp vẽ treo (không thì khung sau trắng xoá), chữ HUD vẫn chạy tiếp
      doKhung.mark(now, tV - tU, performance.now() - tV);   // đo khung lúc đông người (src/game/do-khung.js, CSKH #288)
      if (now - lastUi >= (game.manToi ? 1000 : data.config.perf.hud_ms)) { lastUi = now; ui.update(game); }   // chữ, thanh máu HUD: 15 lần mỗi giây là đủ (tắt màn: mỗi giây một lần)
    } catch (e) { bao(e); }
  }
  requestAnimationFrame(frame);
}

if (!laKhungNgoai) boot().catch(async e => {
  console.error(e);
  if (await recoverStale()) return;
  document.getElementById('loading').textContent = 'Lỗi tải game: ' + e.message;
});
