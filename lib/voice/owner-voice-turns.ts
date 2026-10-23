/** Serializes real answers and occasional out-of-band listening cues. */
export class OwnerVoiceTurns {
  private speaking = false;
  private busy = false;
  private playing = false;
  private pending = false;
  private usedCue = false;
  private startedAt = 0;
  private lastCue = -Infinity;
  private cueIndex = 0;
  private closed = false;
  constructor(private readonly send: (event: Record<string, unknown>) => void) {}

  greet() {
    this.create({ instructions: 'Introduce yourself as RoomKhoj AI in Nepali and ask whether the owner has any vacant rental rooms. Ask only this one question.' });
  }
  handle(type: string, now: number) {
    if (this.closed) return;
    if (type === 'input_audio_buffer.speech_started') {
      this.speaking = true; this.pending = false; this.usedCue = false; this.startedAt = now;
    } else if (type === 'input_audio_buffer.speech_stopped') {
      this.speaking = false;
    } else if (type === 'input_audio_buffer.committed') {
      this.pending = true;
    } else if (type === 'response.created') {
      this.busy = true;
    } else if (type === 'response.done') {
      this.busy = false;
    } else if (type === 'output_audio_buffer.started') {
      this.playing = true;
    } else if (type === 'output_audio_buffer.stopped' || type === 'output_audio_buffer.cleared') {
      this.playing = false;
    }
    this.pump();
  }
  tick(now: number) {
    if (this.closed || !this.speaking || this.busy || this.playing || this.usedCue ||
        now - this.startedAt < 7000 || now - this.lastCue < 14000) return;
    this.usedCue = true; this.lastCue = now;
    const cue = ['हजुर', 'अँ', 'हजुर, सुन्दैछु'][this.cueIndex++ % 3];
    this.create({
      conversation: 'none', input: [],
      instructions: 'The user is still talking. Say ONLY "' + cue + '" softly as a brief listening cue, then stop. Do not answer, ask a question, confirm facts, or finish their sentence.',
    });
  }
  private pump() {
    if (this.closed || !this.pending || this.speaking || this.busy || this.playing) return;
    this.pending = false;
    this.create({});
  }
  private create(response: Record<string, unknown>) {
    if (this.closed || this.busy) return;
    this.busy = true; // Reserve before response.created to prevent duplicate requests.
    this.send({ type: 'response.create', response: { output_modalities: ['audio'], ...response } });
  }
  stop() { this.closed = true; this.pending = false; }
}
