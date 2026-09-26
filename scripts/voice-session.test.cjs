const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const moduleExports = {};
new Function('exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/voice/voice-utils.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(moduleExports);
const { VoiceSession, speechChunks, recordingExtension } = moduleExports;
test('End aborts in-flight work; late mic/transcription completions are invalid', () => {
  const session = new VoiceSession(); const first = session.next();
  let aborted = 0; first.signal.addEventListener('abort', () => aborted++);
  session.stop(); assert.equal(first.current(), false); assert.equal(aborted, 1);
  const second = session.next(); assert.equal(second.current(), true); assert.equal(first.current(), false);
});
test('interrupt invalidates old playback without invalidating the new listening turn', () => {
  const session = new VoiceSession(); const speaking = session.next(); const listening = session.next();
  assert.equal(speaking.signal.aborted, true); assert.equal(speaking.current(), false); assert.equal(listening.current(), true);
});
test('long Nepali replies fit speech limit without losing the end', () => {
  const text = 'नमस्ते तपाईंलाई सहयोग गर्छु। '.repeat(250).trim();
  const chunks = speechChunks(text); assert.ok(chunks.length > 1);
  assert.ok(chunks.every(chunk => chunk.length <= 1200)); assert.equal(chunks.join(' '), text);
  assert.equal(speechChunks('x'.repeat(2501)).join(''), 'x'.repeat(2501));
});
test('Safari and other recorder containers get matching filenames', () => {
  assert.equal(recordingExtension('audio/mp4'), 'm4a');
  assert.equal(recordingExtension('audio/ogg;codecs=opus'), 'ogg');
  assert.equal(recordingExtension('audio/webm;codecs=opus'), 'webm');
});
