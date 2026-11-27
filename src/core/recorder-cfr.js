// Ghi clip nhịp đều (chủ dự án 09/11/2026 18:06: video lưu vào máy xem mượt, vào trình sửa của TikTok thì giật, mất hình). Nguyên nhân:
// MediaRecorder của trình duyệt ghi khung lúc nhanh lúc chậm và ghép file từng đoạn, trình sửa video đòi nhịp đều thì bỏ, lặp khung.
// Ở đây tự mã hoá bằng WebCodecs: khung thứ i mang mốc đúng i/fps giây (đủ fps khung mỗi giây theo đồng hồ thật, game vẽ chậm thì
// lặp khung mới nhất), tiếng AAC lấy mẫu liên tục từ nút âm lượng tổng, ghép thành MP4 có mục lục ở đầu như video quay bằng camera
// (mp4-muxer, src/vendor/, MIT). Máy không có WebCodecs, H.264 (hoặc AAC khi cfg.cfr.need_audio) thì quay cách cũ (src/core/recorder.js).
import { startRecording, clipSize, isWeak, makeMark, khungQuay, taoLop } from './recorder.js';
import { ghiUi, svgDuoc } from './lop-ui.js';
import { dungClip, taoMux } from './dung-clip.js';

const AVC = ['avc1.640028', 'avc1.4D4028', 'avc1.42E028', 'avc1.640033', 'avc1.42E01F'];   // High / Main / Baseline 4.0, 5.1, 3.1
const TAP = `class T extends AudioWorkletProcessor { process(i) { const c = i[0]; if (c && c.length) this.port.postMessage(c.map(x => x.slice())); return true; } }
registerProcessor('p2d-tap', T);`;

async function pickVideo(w, h, fps, bitrate) {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return null;
  for (const codec of AVC) {
    const c = { codec, width: w, height: h, bitrate, framerate: fps, avc: { format: 'avc' } };
    try { if ((await VideoEncoder.isConfigSupported(c)).supported) return c; } catch { /* thử mã khác */ }
  }
  return null;
}

// Mô tả AAC-LC (AudioSpecificConfig, 2 byte) tự dựng: Safari 26–27 trả mô tả sai, ghép vào MP4 thành tiếng câm (WebKit bug 302253)
function asc(sampleRate, channels = 2) {
  const fi = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000].indexOf(sampleRate);
  return fi < 0 ? null : new Uint8Array([(2 << 3) | (fi >> 1), ((fi & 1) << 7) | (channels << 3)]);
}

async function pickAudio(sampleRate, bitrate) {
  if (typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined') return null;
  const c = { codec: 'mp4a.40.2', sampleRate, numberOfChannels: 2, bitrate };
  try { return (await AudioEncoder.isConfigSupported(c)).supported ? c : null; } catch { return null; }
}

// Cách tốt nhất máy làm được: nhịp đều (WebCodecs), không thì cách cũ. Trả về như startRecording (stop() trả { blob, sec, ext, mime }).
export async function startBest(src, master, cfg) {
  if (cfg.cfr?.on) { try { const r = await startCfr(src, master, cfg); if (r) return r; } catch { /* rơi về cách cũ */ } }
  return startRecording(src, master, cfg);
}

async function startCfr(src, master, cfg) {
  const weak = isWeak(cfg), F = khungQuay(cfg), fps = weak ? cfg.fps_weak || cfg.fps : cfg.fps;
  const crop = () => { const y = Math.round(src.height * F.top); return [0, y, src.width, Math.max(2, Math.round(src.height * F.bottom) - y)]; };
  const [, , cw0, ch0] = crop(), size = clipSize(cw0, ch0, weak ? cfg.long.weak : cfg.long.strong), kbps = (weak ? cfg.kbps.weak : cfg.kbps.strong) * 1000;
  const vcfg = await pickVideo(size.w, size.h, fps, kbps);
  if (!vcfg) return null;
  const actx = master?.context, acfg = actx ? await pickAudio(actx.sampleRate, cfg.audio_kbps * 1000) : null;
  if (!acfg && cfg.cfr.need_audio) return null;
  // Dựng sau (src/core/dung-clip.js): quay bản thô chỉ có hình game, giao diện chép thành chuỗi, dừng quay mới ghép giao diện + chữ góc.
  // Máy không giải mã được / không vẽ được ảnh SVG thì dán giao diện ngay lúc quay như bản 25/11.
  const sau = !!(cfg.ui?.on && cfg.cfr.dung_sau && typeof VideoDecoder !== 'undefined' && await svgDuoc());
  const tcfg = sau ? { ...vcfg, bitrate: Math.round(kbps * (cfg.cfr.tho_k || 1)) } : vcfg;   // bản thô nhiều bit hơn: mã hoá hai lần vẫn nét

  let err = null;
  const ve = [], am = [];
  const venc = new VideoEncoder({ output: (c, m) => ve.push({ c, m }), error: e => { err = e; } });
  venc.configure(tcfg);

  // Tấm chép: cắt khung giữa, phóng số nguyên lần (điểm ảnh vuông) hoặc thu nhỏ có làm mịn, dán chữ góc
  const copy = document.createElement('canvas'); copy.width = size.w; copy.height = size.h;
  const ctx = copy.getContext('2d'), mk = makeMark(size.w, size.h, cfg.mark);
  const lop = sau ? ghiUi(cfg.ui.ghi || cfg.ui, F, () => Math.round(vt * 1000)) : taoLop(cfg, size, F);
  ctx.imageSmoothingEnabled = !size.up; ctx.imageSmoothingQuality = 'high';
  const grab = () => {
    if (!src.width || !src.height) return;
    const [sx, sy, sw, sh] = crop();
    ctx.drawImage(src, sx, sy, sw, sh, 0, 0, size.w, size.h);
    if (sau) return;
    if (lop?.ok) ctx.drawImage(lop.canvas, 0, 0);
    ctx.drawImage(mk.img, 0, mk.y);
  };

  // Tiếng: AudioWorklet chép từng mẻ mẫu của nút âm lượng tổng; mốc thời gian theo số mẫu đã nhận (liền mạch, không lệch nhịp)
  let aenc = null, tap = null, sink = null, samples = 0, boMau = 0;
  if (acfg) {
    try {
      const d = asc(acfg.sampleRate);
      aenc = new AudioEncoder({ output: (c, m) => am.push({ c, m: m?.decoderConfig && d ? { ...m, decoderConfig: { ...m.decoderConfig, description: d } } : m }), error: e => { err = e; } });
      aenc.configure(acfg);
      actx.p2dTap ??= actx.audioWorklet.addModule(URL.createObjectURL(new Blob([TAP], { type: 'application/javascript' })));   // nạp một lần mỗi bộ tiếng (nạp lại là trùng tên)
      await actx.p2dTap;
      tap = new AudioWorkletNode(actx, 'p2d-tap', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
      sink = actx.createGain(); sink.gain.value = 0;
      master.connect(tap); tap.connect(sink); sink.connect(actx.destination);   // nối ra loa câm để trình duyệt chịu chạy nút này
      tap.port.onmessage = e => {
        if (!aenc || aenc.state !== 'configured') return;
        let ch = e.data, n = ch[0].length;
        if (boMau >= 1) {   // phần tiếng của quãng máy khựng (khung hình đã bỏ quãng đó): bỏ theo, tiếng khớp hình
          const k = Math.min(n, Math.floor(boMau)); boMau -= k;
          if (k >= n) return;
          ch = ch.map(c => c.subarray(k)); n -= k;
        }
        const data = new Float32Array(n * 2);
        data.set(ch[0], 0); data.set(ch[1] || ch[0], n);
        const ad = new AudioData({ format: 'f32-planar', sampleRate: acfg.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(samples * 1e6 / acfg.sampleRate), data });
        samples += n; aenc.encode(ad); ad.close();
      };
    } catch { aenc = null; }
  }

  // Hình: mỗi khung màn hình xem đồng hồ clip đã tới khung thứ mấy, chép hình mới nhất rồi mã hoá đủ số khung còn thiếu.
  // Đồng hồ clip chạy theo giờ GAME, không theo giờ thật (chủ dự án 26/11/2026 02:51: "khi quay xong video quá giật lag, không được"):
  // máy khựng (chụp lớp giao diện, nạp bảng, máy yếu) thì game mỗi bước chỉ đi tối đa NHAY giây (src/main.js chặn dt) nên clip cũng
  // chỉ đi chừng đó; trước đây clip theo giờ thật nên quãng khựng thành một đoạn hình đứng yên 0,2–0,6 giây. Tiếng quãng đó bỏ theo.
  const t0 = performance.now(), dur = 1e6 / fps, NHAY = (cfg.cfr.nhay_s || 0.05) * 1000;
  let i = 0, raf = 0, live = true, vt = 0, truoc = t0;
  const step = now => {
    if (!live) return;
    raf = requestAnimationFrame(step);
    const dt = Math.max(0, now - truoc), d = Math.min(dt, NHAY); truoc = now;
    vt += d;
    if (acfg && dt > d) boMau += (dt - d) * acfg.sampleRate / 1000;
    const want = Math.floor(vt / 1000 * fps) + 1;
    if (want <= i) return;
    grab();
    for (; i < want; i++) {
      const vf = new VideoFrame(copy, { timestamp: Math.round(i * dur), duration: Math.round(dur) });
      venc.encode(vf, { keyFrame: i % (fps * 2) === 0 }); vf.close();
    }
  };
  grab(); raf = requestAnimationFrame(step);

  const cleanup = () => {
    live = false; cancelAnimationFrame(raf); lop?.stop();
    if (tap) { try { master.disconnect(tap); tap.disconnect(); sink.disconnect(); } catch { /* đã ngắt */ } tap.port.onmessage = null; }
  };
  // Ghép thẳng bản đã quay (không dựng sau, hoặc dựng sau hỏng trước khi đụng bản thô: clip không có giao diện, chữ góc)
  const ghepThang = async () => { const m = await taoMux(size, fps, acfg, am); for (const x of ve) m.hinh(x.c, x.m); return m.xong(); };
  return {
    type: { mime: 'video/mp4', ext: 'mp4' }, size, weak, cfr: true, sau,
    elapsed: () => vt / 1000,
    // tien(phần 0–1): dựng sau mất vài giây, báo cho người chơi biết đang làm
    stop: async tien => {
      cleanup();
      await venc.flush(); if (aenc) await aenc.flush();
      if (err) throw err;
      venc.close(); aenc?.close();
      const sec = i / fps, ra = { sec, ext: 'mp4', mime: 'video/mp4' };
      if (!sau || !ve.length) return { ...ra, blob: await ghepThang() };
      const t0 = performance.now();
      try {
        const r = await dungClip({ vcfg, ve, am, acfg, size, fps, ui: lop.ds, mk, tien });
        if (window.__thu) window.__thu.dungClip = { ms: Math.round(performance.now() - t0), khung: r.khung, rieng: r.rieng, ui: lop.ds.length, uiMs: r.uiMs, uiHong: r.uiHong, chep: lop.lan, chepMs: Math.round(lop.ms), chepMax: Math.round(lop.maxMs) };
        return { ...ra, blob: r.blob };
      } catch (e) {
        if (ve[0]) return { ...ra, blob: await ghepThang() };
        throw e;
      }
    },
    cancel: () => { cleanup(); try { venc.close(); aenc?.close(); } catch { /* đã đóng */ } },
  };
}
