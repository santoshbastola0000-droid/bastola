/** Match the upload filename to the browser's actual recording container. */
export function recordingExtension(mime: string) {
  if (/mp4|m4a/i.test(mime)) return 'm4a';
  if (/ogg/i.test(mime)) return 'ogg';
  if (/wav/i.test(mime)) return 'wav';
  return 'webm';
}

/** The speech endpoint accepts at most 1200 characters per request. */
export function speechChunks(text: string, limit = 1200): string[] {
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    const boundary = rest.lastIndexOf(' ', limit);
    const end = boundary > limit / 2 ? boundary : limit;
    chunks.push(rest.slice(0, end));
    rest = rest.slice(end).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

/** Invalidates async work when a session ends, restarts or is interrupted. */
export class VoiceSession {
  private version = 0;
  private controller = new AbortController();
  next() {
    this.controller.abort();
    this.controller = new AbortController();
    const version = ++this.version;
    return { signal: this.controller.signal, current: () => version === this.version && !this.controller.signal.aborted };
  }
  stop() { this.version++; this.controller.abort(); }
}
