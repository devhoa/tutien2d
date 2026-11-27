// Bài thử: trang ẩn (sang ứng dụng khác, về màn hình chính, khoá máy) thì game tắt hẳn tiếng, mở lại thì bật lại đúng âm lượng; người đã tắt tiếng
// thì mở lại vẫn im (src/core/audio.js; chủ dự án 23/11/2026 12:43: "game k hoạt động thì tắt âm thanh"). AudioContext giả, không cần trình duyệt.
// Chạy: node tools/am-thanh-an.test.mjs (check.mjs gọi)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const nghe = {}, ghi = (o, ev, f) => { (o.ds ||= {})[ev] = [...(o.ds[ev] || []), f]; };
const phat = (o, ev, e = {}) => { for (const f of o.ds?.[ev] || []) f(e); };
const doc = { hidden: false, addEventListener: (ev, f) => ghi(doc, ev, f) };
globalThis.document = doc;
globalThis.addEventListener = (ev, f) => ghi(nghe, ev, f);
globalThis.localStorage = { getItem: () => null, setItem() {} };
Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true, writable: true });
let ac = null;
const gain = () => {
  const g = { value: 1, setValueAtTime(v) { g.value = v; }, setTargetAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {} };
  return g;
};
const nut = () => {   // nút âm thanh giả: tham số nào chưa khai (threshold, ratio, delayTime...) cũng là một tham số giả
  const o = { gain: gain(), connect() {}, disconnect() {}, start() {}, stop() {}, buffer: null, type: '', curve: null, loop: false };
  return new Proxy(o, { get: (t, k) => (k in t ? t[k] : typeof k === 'string' ? (t[k] = gain()) : undefined) });
};
class AC {
  constructor() { ac = this; this.state = 'running'; this.currentTime = 1; this.sampleRate = 8000; this.destination = {}; this.lan = { suspend: 0, resume: 0 }; }
  createGain() { return nut(); } createBufferSource() { return nut(); } createStereoPanner() { return nut(); } createConvolver() { return nut(); }
  createOscillator() { return nut(); } createBiquadFilter() { return nut(); } createDynamicsCompressor() { return nut(); } createDelay() { return nut(); }
  createWaveShaper() { return nut(); }
  createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
  suspend() { this.lan.suspend++; this.state = 'suspended'; return Promise.resolve(); }
  resume() { this.lan.resume++; this.state = 'running'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}
globalThis.window = { AudioContext: AC, addEventListener: (ev, f) => ghi(nghe, ev, f) };
globalThis.setTimeout = () => 0; globalThis.setInterval = () => 0;

const cfg = JSON.parse(readFileSync(new URL('../data/sounds.json', import.meta.url), 'utf8'));
const { createAudio } = await import('../src/core/audio.js');
const A = createAudio(cfg);
phat(nghe, 'pointerdown');   // chạm đầu tiên: dựng âm thanh
assert.ok(ac && ac.state === 'running' && A.master?.gain.value === 1, 'chạm đầu tiên mà chưa có âm thanh');

// 1. sang ứng dụng khác: dừng hẳn, âm lượng 0
doc.hidden = true; phat(doc, 'visibilitychange');
assert.equal(ac.state, 'suspended', 'trang ẩn mà âm thanh vẫn chạy ngầm');
assert.equal(A.master.gain.value, 0, 'trang ẩn mà âm lượng chưa về 0');
// 2. mở lại: chạy lại, đúng âm lượng cũ
doc.hidden = false; phat(doc, 'visibilitychange');
assert.ok(ac.state === 'running' && A.master.gain.value === 1, 'mở lại mà tiếng không về như cũ');
// 3. pagehide (đóng thẻ, iPhone dọn ứng dụng) cũng tắt
phat(nghe, 'pagehide');
assert.equal(ac.state, 'suspended', 'pagehide mà âm thanh vẫn chạy');
doc.hidden = false; phat(nghe, 'pageshow');
assert.equal(ac.state, 'running', 'pageshow mà không bật lại');
// 4. người đã tắt tiếng: ẩn rồi mở lại vẫn im
A.toggle(); assert.equal(A.master.gain.value, 0);
doc.hidden = true; phat(doc, 'visibilitychange'); doc.hidden = false; phat(doc, 'visibilitychange');
assert.equal(A.master.gain.value, 0, 'đã tắt tiếng mà mở lại game tự bật tiếng');
// 5. nối dây: main.js dựng âm thanh bằng createAudio
assert.ok(/createAudio\(data\.sounds/.test(readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')), 'main.js không dựng âm thanh bằng createAudio');
console.log('✅ Âm thanh: trang ẩn thì tắt hẳn, mở lại bật đúng âm lượng, đã tắt tiếng thì vẫn im');
