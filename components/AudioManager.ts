"use client";

// Web Audio API Procedural Synthesizer for Immersive, Asset-Free Audio
class AudioManager {
  private static ctx: AudioContext | null = null;
  private static isMuted = false;
  private static initialized = false;

  // Procedural Nodes
  private static synthAmbientNode1: OscillatorNode | null = null;
  private static synthAmbientNode2: OscillatorNode | null = null;
  private static synthAmbientGain: GainNode | null = null;
  
  private static footstepsInterval: any = null;
  private static isFootstepsPlaying = false;

  static init() {
    if (typeof window === "undefined" || this.initialized) return;
    this.initialized = true;
    console.log("Procedural AudioManager initialized successfully.");
  }

  private static getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  static toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    
    // Update synth nodes
    if (this.isMuted) {
      if (this.synthAmbientGain) {
        this.synthAmbientGain.gain.setValueAtTime(0, this.getAudioContext().currentTime);
      }
      this.stopFootstepsSynth();
    } else {
      if (this.synthAmbientGain) {
        this.synthAmbientGain.gain.setValueAtTime(0.08, this.getAudioContext().currentTime);
      }
    }

    return this.isMuted;
  }

  static getMuteStatus(): boolean {
    return this.isMuted;
  }

  // --- Background Ambience ---
  static startAmbient() {
    this.init();
    if (this.isMuted) return;
    this.startAmbientSynth();
  }

  private static startAmbientSynth() {
    try {
      const ctx = this.getAudioContext();
      if (this.synthAmbientNode1) return; // Already running

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Low hum (65.41 Hz - low C)
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(65.41, ctx.currentTime);

      // Warm harmonic (130.81 Hz - C3)
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(130.81, ctx.currentTime);

      // Lowpass filter for smooth hum
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(120, ctx.currentTime);

      // Warm background gain
      gain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      this.synthAmbientNode1 = osc1;
      this.synthAmbientNode2 = osc2;
      this.synthAmbientGain = gain;

      // Start random plate & utensil clinks
      this.startKitchenClinks();
    } catch (e) {
      console.error("Failed to start ambient synth:", e);
    }
  }

  private static startKitchenClinks() {
    const playClink = () => {
      if (this.isMuted || !this.initialized) return;
      try {
        const ctx = this.getAudioContext();
        if (ctx.state === "suspended") return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        // High crystalline metallic frequency (1500Hz to 3200Hz)
        osc.frequency.setValueAtTime(1500 + Math.random() * 1700, ctx.currentTime);

        gain.gain.setValueAtTime(0.012, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch (e) {}

      // Schedule next kitchen clink randomly
      setTimeout(playClink, 4000 + Math.random() * 8000);
    };

    setTimeout(playClink, 3000);
  }

  // --- Footsteps ---
  static setFootstepsActive(active: boolean) {
    this.init();
    if (this.isMuted || !active) {
      this.stopFootstepsSynth();
      return;
    }
    this.startFootstepsSynth();
  }

  private static startFootstepsSynth() {
    if (this.isFootstepsPlaying) return;
    this.isFootstepsPlaying = true;

    const step = () => {
      if (!this.isFootstepsPlaying || this.isMuted) return;

      try {
        const ctx = this.getAudioContext();

        // 1. Heel Strike: Low-frequency solid thump
        const heelOsc = ctx.createOscillator();
        const heelGain = ctx.createGain();
        const heelFilter = ctx.createBiquadFilter();

        heelOsc.type = "sine";
        heelOsc.frequency.setValueAtTime(100, ctx.currentTime);
        heelOsc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12);

        heelFilter.type = "lowpass";
        heelFilter.frequency.setValueAtTime(80, ctx.currentTime);

        heelGain.gain.setValueAtTime(0.15, ctx.currentTime);
        heelGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

        heelOsc.connect(heelFilter);
        heelFilter.connect(heelGain);
        heelGain.connect(ctx.destination);

        heelOsc.start();
        heelOsc.stop(ctx.currentTime + 0.15);

        // 2. Tile Scuff: Medium-high bandpass white noise burst for shoe friction
        const bufferSize = ctx.sampleRate * 0.08; // 80ms
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }

        const scuffSource = ctx.createBufferSource();
        scuffSource.buffer = noiseBuffer;

        const scuffFilter = ctx.createBiquadFilter();
        scuffFilter.type = "bandpass";
        scuffFilter.frequency.setValueAtTime(1200, ctx.currentTime);
        scuffFilter.Q.setValueAtTime(1.2, ctx.currentTime);

        const scuffGain = ctx.createGain();
        scuffGain.gain.setValueAtTime(0.015, ctx.currentTime);
        scuffGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        scuffSource.connect(scuffFilter);
        scuffFilter.connect(scuffGain);
        scuffGain.connect(ctx.destination);

        scuffSource.start();
        scuffSource.stop(ctx.currentTime + 0.09);

      } catch (e) {
        console.error("Footstep procedural play error:", e);
      }

      // Keep repeating footsteps with walking rhythm
      this.footstepsInterval = setTimeout(step, 350);
    };

    step();
  }

  private static stopFootstepsSynth() {
    this.isFootstepsPlaying = false;
    if (this.footstepsInterval) {
      clearTimeout(this.footstepsInterval);
      this.footstepsInterval = null;
    }
  }

  // --- Sizzle (Cooking sound) ---
  static playSizzle() {
    this.init();
    if (this.isMuted) return;
    this.playSizzleSynth();
  }

  private static playSizzleSynth() {
    try {
      const ctx = this.getAudioContext();
      const bufferSize = ctx.sampleRate * 2.0; // 2 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate White Noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      // Sizzling hot filter bands
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(4500, ctx.currentTime);
      bandpass.Q.setValueAtTime(1.8, ctx.currentTime);

      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(2200, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.15); // fade in
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.95); // fade out

      noiseNode.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(gain);
      gain.connect(ctx.destination);

      noiseNode.start();
    } catch (e) {
      console.error("Sizzle procedural play error:", e);
    }
  }
}

export default AudioManager;
