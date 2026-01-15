/**
 * SwitchCom — Audio System
 * Procedural audio using Web Audio API
 */

const SwitchComAudio = {
  context: null,
  enabled: true,
  initialized: false,

  // ========================================
  // Initialize Audio Context
  // ========================================
  init() {
    if (this.initialized && this.context) return;
    
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('Audio initialized successfully');
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
      this.enabled = false;
    }
  },

  // Ensure context is ready before playing
  ensureContext() {
    if (!this.context) {
      this.init();
    }
    this.resume();
    return this.context !== null;
  },

  // Resume context (required after user interaction)
  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  },

  // ========================================
  // Sound: Toggle On (Swish up)
  // ========================================
  playToggleOn() {
    if (!this.enabled || !this.ensureContext()) return;

    const now = this.context.currentTime;
    
    // Create oscillator for swish
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    
    // Swish sound - rising pitch
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);
    
    // Filter for softer tone
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, now);
    filter.Q.setValueAtTime(0.7, now);
    
    // Volume envelope - louder
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    
    // Connect
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start(now);
    osc.stop(now + 0.12);
  },

  // ========================================
  // Sound: Toggle Off (Soft whoosh down)
  // ========================================
  playToggleOff() {
    if (!this.enabled || !this.ensureContext()) return;

    const now = this.context.currentTime;
    
    // Soft descending whoosh - contrasts with the rising swish
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    
    // Gentle falling tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    
    // Soft lowpass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    
    // Smooth envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start(now);
    osc.stop(now + 0.12);
    
    // Add soft breath/air texture
    const bufferSize = this.context.sampleRate * 0.08;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.context.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.Q.setValueAtTime(0.5, now);
    
    const noiseGain = this.context.createGain();
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.context.destination);
    
    noise.start(now);
  },

  // ========================================
  // Sound: Success / Unlock (Dramatic chord)
  // ========================================
  playSuccess() {
    if (!this.enabled || !this.ensureContext()) return;

    const now = this.context.currentTime;
    
    // Play a major chord progression for dramatic effect
    const frequencies = [
      { freq: 523.25, delay: 0 },      // C5
      { freq: 659.25, delay: 0.05 },   // E5
      { freq: 783.99, delay: 0.1 },    // G5
      { freq: 1046.50, delay: 0.2 },   // C6 (octave up)
    ];
    
    frequencies.forEach(({ freq, delay }) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      // Slight shimmer
      const vibrato = this.context.createOscillator();
      const vibratoGain = this.context.createGain();
      vibrato.frequency.setValueAtTime(5, now);
      vibratoGain.gain.setValueAtTime(3, now);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      vibrato.start(now + delay);
      vibrato.stop(now + delay + 1);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, now + delay);
      filter.frequency.exponentialRampToValueAtTime(800, now + delay + 0.8);
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.05);
      gain.gain.setValueAtTime(0.12, now + delay + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.context.destination);
      
      osc.start(now + delay);
      osc.stop(now + delay + 1);
    });

    // Add a subtle "whoosh" layer
    this.playWhoosh(0.15);
  },

  // ========================================
  // Sound: Whoosh effect
  // ========================================
  playWhoosh(volume = 0.1) {
    if (!this.enabled || !this.context) return;
    
    const now = this.context.currentTime;
    
    // White noise burst filtered
    const bufferSize = this.context.sampleRate * 0.3;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.3);
    filter.Q.setValueAtTime(1, now);
    
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    
    noise.start(now);
  },

  // ========================================
  // Sound: Zero Correct (Distinctive warning sound)
  // ========================================
  playZeroCorrect() {
    if (!this.enabled || !this.ensureContext()) return;

    const now = this.context.currentTime;

    // Two-tone descending alarm
    const frequencies = [
      { freq: 400, delay: 0 },
      { freq: 300, delay: 0.12 },
    ];

    frequencies.forEach(({ freq, delay }) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + delay + 0.1);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.1, now + delay + 0.02);
      gain.gain.setValueAtTime(0.1, now + delay + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);

      osc.connect(gain);
      gain.connect(this.context.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.12);
    });
  },

  // ========================================
  // Sound: Failure (Soft thud)
  // ========================================
  playFail() {
    if (!this.enabled || !this.ensureContext()) return;

    const now = this.context.currentTime;
    
    // Low thud
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
    
    // Add subtle noise
    const bufferSize = this.context.sampleRate * 0.1;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.context.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(300, now);
    
    const noiseGain = this.context.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.context.destination);
    
    noise.start(now);
  },

  // ========================================
  // Sound: Tick (for timer, subtle)
  // ========================================
  playTick() {
    if (!this.enabled || !this.context) return;
    this.resume();

    const now = this.context.currentTime;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start(now);
    osc.stop(now + 0.03);
  },

  // ========================================
  // Enable/Disable
  // ========================================
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled && !this.initialized) {
      this.init();
    }
  }
};

// Initialize on first user interaction
document.addEventListener('click', () => SwitchComAudio.init(), { once: true });
document.addEventListener('touchstart', () => SwitchComAudio.init(), { once: true });

