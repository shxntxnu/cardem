// Walkie-Talkie Audio Engine: Push-to-Talk Squelch Effects & Non-Interfering Ambient Audio Mix

class AudioService {
  constructor() {
    this.audioCtx = null;
    this.gainNode = null;
    this.mediaRecorder = null;
    this.audioStream = null;
    this.isRecording = false;
  }

  // Initialize non-exclusive WebAudio context that mixes over background car music
  init() {
    this.initContext();
  }

  initContext() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass({ latencyHint: 'interactive' });
          this.gainNode = this.audioCtx.createGain();
          this.gainNode.gain.value = 0.8;
          this.gainNode.connect(this.audioCtx.destination);
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (err) {
      console.warn('Web Audio initialization error:', err);
    }
  }

  // Realistic Walkie-Talkie Radio Squelch Tone (Opening chirp)
  playSquelchOpen() {
    this.playMicOpenSquelch();
  }

  playMicOpenSquelch() {
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Walkie-Talkie Radio Roger / Squelch Close Chirp
  playSquelchClose() {
    this.playMicCloseSquelch();
  }

  playMicCloseSquelch() {
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      // 1. Two-tone Roger Beep
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1174.66, now); // D6
      osc.frequency.setValueAtTime(880, now + 0.06); // A5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.13);

      // 2. Subtle White Noise Radio Static Burst (Burst of static)
      const bufferSize = this.audioCtx.sampleRate * 0.05; // 50ms burst
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800; // Radio frequency pass

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.15, now + 0.1);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);

      noise.start(now + 0.1);
    } catch (e) {
      console.warn('Audio squelch error:', e);
    }
  }

  // Hazard Alert Chime
  playHazardChime() {
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(987.77, now + 0.1); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.2); // E6

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      console.warn('Hazard chime error:', e);
    }
  }

  // Request Microphone Access
  async requestMic() {
    try {
      if (!this.audioStream) {
        this.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      }
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unsupported:', err);
      return false;
    }
  }

  // Start PTT transmission
  async startTransmission() {
    this.playMicOpenSquelch();
    this.isRecording = true;
    await this.requestMic();
  }

  // Stop PTT transmission
  stopTransmission() {
    this.isRecording = false;
    this.playMicCloseSquelch();
  }
}

const audioService = new AudioService();
export default audioService;
