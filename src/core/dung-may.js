// Máy dựng clip (src/core/dung-clip.js): giải mã bản thô → dán ảnh giao diện + chữ góc → mã hoá lại. Chạy trong một Worker riêng để game
// vẫn chạy mượt và máy dựng không phải chờ từng khung game (đo 26/11/2026 trên Chromium: dựng chung luồng với game chậm gấp 3 lần).
// Viết thành CHUỖI (như bộ chép tiếng TAP ở recorder-cfr.js) vì bản gói (tools/goi.mjs) đổi tên, chèn hàm phụ vào code; Worker tạo từ Blob
// cần code đứng một mình. Máy không chạy được trong Worker thì chạy chính chuỗi này trên luồng game qua MessageChannel (cùng cách nói chuyện).
// Nói chuyện (cong: self của Worker hoặc một đầu MessageChannel):
//   máy → game  { k: 'san', ok }               sẵn sàng (ok: có WebCodecs, OffscreenCanvas)
//   game → máy  { k: 'bat', dau, vcfg, w, h, fps, tong, uiT, mk, mkY }   dau: cấu hình giải mã bản thô; uiT: mốc (µs) các lần chép giao diện
//   game → máy  { k: 'manh', ds: [{ type, ts, dur, b }] }                 mẩu bản thô (ArrayBuffer chuyển hẳn sang)
//   game → máy  { k: 'ui', j, bm }                                        ảnh giao diện lần chép j (ImageBitmap; null: dựng hỏng, giữ ảnh trước)
//   máy → game  { k: 'can', j }  cần ảnh j · { k: 'ra', type, ts, dur, b, meta } mẩu đã mã hoá · { k: 'tien', n } · { k: 'xong', n } · { k: 'loi', msg }
export const MAY = `function (cong) {
  const cho = ms => new Promise(r => setTimeout(r, ms));
  let o = null, loi = null, doiManh = null, doiUi = null;
  const manh = [], ui = new Map();
  cong.onmessage = e => {
    const m = e.data;
    if (m.k === 'bat') { o = m; chay().catch(err => cong.postMessage({ k: 'loi', msg: String((err && err.message) || err) })); }
    else if (m.k === 'manh') { for (const x of m.ds) manh.push(x); if (doiManh) doiManh(); }
    else if (m.k === 'ui') { ui.set(m.j, m.bm); if (doiUi) doiUi(); }
  };
  cong.postMessage({ k: 'san', ok: typeof VideoDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined' && typeof OffscreenCanvas !== 'undefined' });

  let j = -1, cur = null;
  async function layUi(t) {
    const T = o.uiT;
    if (!T.length) return null;
    let k = Math.max(j, 0);
    while (k + 1 < T.length && T[k + 1] <= t) k++;
    if (k === j) return cur;
    while (!ui.has(k)) { cong.postMessage({ k: 'can', j: k }); await new Promise(r => { doiUi = r; }); doiUi = null; }
    const bm = ui.get(k);
    for (const [x, b] of ui) if (x <= k) { ui.delete(x); if (b && b !== bm && b !== cur) b.close(); }
    if (bm) { if (cur) cur.close(); cur = bm; }
    j = k;
    return cur;
  }

  const sach = m => {
    const d = m && m.decoderConfig;
    if (!d) return undefined;
    const cs = d.colorSpace;
    return { decoderConfig: { codec: d.codec, codedWidth: d.codedWidth, codedHeight: d.codedHeight,
      description: d.description ? new Uint8Array(ArrayBuffer.isView(d.description) ? d.description.buffer.slice(d.description.byteOffset, d.description.byteOffset + d.description.byteLength) : d.description.slice(0)) : undefined,
      colorSpace: cs ? { primaries: cs.primaries, transfer: cs.transfer, matrix: cs.matrix, fullRange: cs.fullRange } : undefined } };
  };

  async function chay() {
    const { w, h, fps, tong } = o, dur = Math.round(1e6 / fps);
    const cv = new OffscreenCanvas(w, h), g = cv.getContext('2d'), ra = [];
    const enc = new VideoEncoder({ output: (c, meta) => { const b = new ArrayBuffer(c.byteLength); c.copyTo(b); cong.postMessage({ k: 'ra', type: c.type, ts: c.timestamp, dur: c.duration, b, meta: sach(meta) }, [b]); }, error: e => { loi = e; } });
    enc.configure(o.vcfg);
    const dec = new VideoDecoder({ output: f => ra.push(f), error: e => { loi = e; } });
    dec.configure(o.dau);
    let n = 0, i = 0;
    async function veRa() {
      while (ra.length) {
        const f = ra.shift(), anh = await layUi(f.timestamp);
        g.drawImage(f, 0, 0, w, h);
        if (anh) g.drawImage(anh, 0, 0);
        if (o.mk) g.drawImage(o.mk, 0, o.mkY);
        const vf = new VideoFrame(cv, { timestamp: f.timestamp, duration: f.duration || dur });
        f.close();
        enc.encode(vf, { keyFrame: n % (fps * 2) === 0 }); vf.close(); n++;
        while (enc.encodeQueueSize > 6 && !loi) await cho(1);
        if (loi) throw loi;
        if (n % 15 === 0) cong.postMessage({ k: 'tien', n });
      }
    }
    try {
      while (i < tong) {
        if (i >= manh.length) { await new Promise(r => { doiManh = r; }); doiManh = null; continue; }
        const m = manh[i]; manh[i] = null; i++;
        dec.decode(new EncodedVideoChunk({ type: m.type, timestamp: m.ts, duration: m.dur == null ? undefined : m.dur, data: m.b }));
        while (dec.decodeQueueSize > 8 && !loi) { await cho(1); await veRa(); }
        if (loi) throw loi;
        await veRa();
      }
      await dec.flush(); await veRa();
      await enc.flush();
      if (loi) throw loi;
    } finally {
      for (const f of ra) f.close();
      try { dec.close(); } catch (e) { /* đã đóng */ }
      try { enc.close(); } catch (e) { /* đã đóng */ }
      if (cur) cur.close();
      for (const b of ui.values()) if (b) b.close();
    }
    cong.postMessage({ k: 'xong', n });
  }
}`;
