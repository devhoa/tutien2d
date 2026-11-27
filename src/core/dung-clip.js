// Dựng lại clip sau khi dừng quay (chủ dự án 26/11/2026 02:51: "khi quay xong video quá giật lag, không được, video phải chất lượng tốt
// nhất"; "vẫn có thể mở kho các thứ, quay được cả kho cả bảng xếp hạng khi đang mở"). Trước đây ảnh giao diện (bảng, Túi đồ, Xếp hạng)
// được dựng NGAY trong lúc quay: mỗi lần 0,1–0,9 giây, game khựng, mà giao diện trên clip vài giây mới đổi một lần.
// Nay trong lúc quay: khung vẽ game mã hoá thành bản thô (src/core/recorder-cfr.js), giao diện chỉ chép thành chuỗi vài lần mỗi giây
// (src/core/lop-ui.js ghiUi, không vẽ). Dừng quay: máy dựng (src/core/dung-may.js, luồng riêng) giải mã từng khung bản thô, dán ảnh giao
// diện đúng mốc, chữ góc, mã hoá lại; ở đây vẽ ảnh giao diện (cần trang thật) từng lần một, ghép MP4.
// Chữ, khung giao diện dựng thẳng ở độ phân giải clip (không phóng ảnh nhỏ). Ảnh giao diện dựng hỏng thì clip vẫn có hình game và chữ góc.
import { veSvg, ghepSvg, lamDay } from './lop-ui.js';
import { MAY } from './dung-may.js';

// Ghép MP4 từ các mẩu đã mã hoá; tiếng xen theo mốc hình (trình sửa video đọc dần file không phải nhảy qua lại)
export async function taoMux(size, fps, acfg, am) {
  const { Muxer, ArrayBufferTarget } = await import('../vendor/mp4-muxer.mjs');
  const target = new ArrayBufferTarget(), co = !!(acfg && am.length);
  const muxer = new Muxer({
    target, fastStart: 'in-memory', firstTimestampBehavior: 'offset',
    video: { codec: 'avc', width: size.w, height: size.h, frameRate: fps },
    ...(co ? { audio: { codec: 'aac', numberOfChannels: 2, sampleRate: acfg.sampleRate } } : {}),
  });
  let ai = 0;
  const tieng = t => { for (; ai < am.length && (t == null || am[ai].c.timestamp <= t); ai++) muxer.addAudioChunk(am[ai].c, am[ai].m); };
  return {
    hinh: (c, m) => { if (co) tieng(c.timestamp); muxer.addVideoChunk(c, m); },
    xong: () => { if (co) tieng(null); muxer.finalize(); return new Blob([target.buffer], { type: 'video/mp4' }); },
  };
}

// Cấu hình giải mã chép thành đồ vật thường (gửi qua postMessage được)
function sachCfg(d) {
  const cs = d.colorSpace, ds = d.description;
  const b = ds && (ArrayBuffer.isView(ds) ? ds.buffer.slice(ds.byteOffset, ds.byteOffset + ds.byteLength) : ds.slice(0));
  return { codec: d.codec, codedWidth: d.codedWidth, codedHeight: d.codedHeight, ...(b ? { description: new Uint8Array(b) } : {}), ...(cs ? { colorSpace: { primaries: cs.primaries, transfer: cs.transfer, matrix: cs.matrix, fullRange: cs.fullRange } } : {}) };
}

// Mở máy dựng: Worker (luồng riêng); không được thì chạy trên luồng game qua MessageChannel. Trả { cong, dong, rieng } hoặc null.
async function moMay() {
  try {
    const url = URL.createObjectURL(new Blob([`(${MAY})(self);`], { type: 'text/javascript' }));
    const w = new Worker(url);
    const san = await new Promise(res => { w.onmessage = e => res(e.data); w.onerror = () => res(null); setTimeout(() => res(null), 4000); });
    URL.revokeObjectURL(url);
    if (san?.ok) return { cong: w, dong: () => w.terminate(), rieng: true };
    w.terminate();
  } catch { /* máy không cho tạo Worker */ }
  if (typeof OffscreenCanvas === 'undefined' || typeof VideoDecoder === 'undefined') return null;
  const ch = new MessageChannel();
  new Function(`return (${MAY})`)()(ch.port1);
  return { cong: ch.port2, dong: () => { ch.port1.close(); ch.port2.close(); }, rieng: false };
}

// o: { vcfg, ve: [{ c, m }] bản thô, am: [{ c, m }] tiếng, acfg, size, fps, ui: [{ t, p }], mk, tien(phần 0–1) }. Trả { blob, … }.
// Mẩu bản thô chuyển hẳn sang máy dựng (bộ nhớ chỉ giữ cỡ một bản clip). Hỏng trước khi chuyển thì ném lỗi 'khong_giai_ma' (bản thô còn nguyên).
export async function dungClip(o) {
  const { ve, size, fps } = o, ui = o.ui || [], dau = ve[0]?.m?.decoderConfig;
  if (!dau || typeof VideoDecoder === 'undefined' || !(await VideoDecoder.isConfigSupported(dau)).supported) throw new Error('khong_giai_ma');
  const may = await moMay();
  if (!may) throw new Error('khong_giai_ma');
  const mux = await taoMux(size, fps, o.acfg, o.am), tong = ve.length, { w, h } = size;
  const so = { rieng: may.rieng, uiMs: 0, uiHong: 0 };
  let toi = -1, gui = 0, dangGui = false, tat = false;

  // Ảnh giao diện: vẽ trước chỗ máy dựng cần tối đa 3 lần chép (mỗi ảnh vài MB), vẽ song song cả 3 (đo trên Chromium: nhanh hơn ~30%),
  // gửi theo đúng thứ tự
  const dang = new Map();
  const veUi = j => {
    if (!dang.has(j)) {
      const p = ui[j].p; ui[j] = null;   // chuỗi trang đã dùng: nhả
      dang.set(j, tat ? Promise.resolve(null) : (async () => createImageBitmap(await veSvg(ghepSvg(await lamDay(p), w, h), w, h)))()
        .catch(e => { so.uiHong++; if (e?.name === 'SecurityError') tat = true; return null; }));
    }
    return dang.get(j);
  };
  async function guiUi() {
    if (dangGui) return;
    dangGui = true;
    while (gui < ui.length && gui <= toi + 3) {
      for (let x = gui; x < ui.length && x <= toi + 3; x++) veUi(x);
      const j = gui++, t0 = performance.now(), bm = await veUi(j);
      dang.delete(j);
      so.uiMs += performance.now() - t0;
      may.cong.postMessage({ k: 'ui', j, bm }, bm ? [bm] : []);
    }
    dangGui = false;
  }

  const xong = new Promise((res, rej) => {
    may.cong.onmessage = e => {
      const m = e.data;
      if (m.k === 'ra') mux.hinh(new EncodedVideoChunk({ type: m.type, timestamp: m.ts, duration: m.dur ?? undefined, data: m.b }), m.meta);
      else if (m.k === 'can') { toi = Math.max(toi, m.j - 1); guiUi(); }
      else if (m.k === 'tien') o.tien?.(m.n / tong);
      else if (m.k === 'xong') res(m.n);
      else if (m.k === 'loi') rej(new Error(m.msg));
    };
    if (may.rieng) may.cong.onerror = ev => rej(new Error(ev.message || 'worker'));
  });
  try {
    const mkBm = o.mk ? await createImageBitmap(o.mk.img) : null;
    may.cong.postMessage({ k: 'bat', dau: sachCfg(dau), vcfg: o.vcfg, w, h, fps, tong, uiT: ui.map(x => x.t), mk: mkBm, mkY: o.mk?.y || 0 }, mkBm ? [mkBm] : []);
    // bản thô: chép từng mẩu ra ArrayBuffer rồi chuyển hẳn, mỗi lần 30 mẩu (bộ nhớ không nhân đôi)
    for (let k = 0; k < tong; k += 30) {
      const ds = [], bs = [];
      for (let x = k; x < Math.min(tong, k + 30); x++) {
        const c = ve[x].c, b = new ArrayBuffer(c.byteLength);
        c.copyTo(b); ve[x] = null;
        ds.push({ type: c.type, ts: c.timestamp, dur: c.duration, b }); bs.push(b);
      }
      may.cong.postMessage({ k: 'manh', ds }, bs);
    }
    guiUi();
    const n = await xong;
    o.tien?.(1);
    return { blob: mux.xong(), khung: n, ...so, uiMs: Math.round(so.uiMs) };
  } finally { may.dong(); }
}
