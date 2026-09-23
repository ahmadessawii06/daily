// Web Audio API Sound Effects Engine for Daily Track
// Zero external files, zero latency, runs 100% in browser

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = 
        window.AudioContext || 
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('AudioContext not available:', err);
    return null;
  }
}

/**
 * Play a sparkling, uplifting achievement chime when a task is completed (Done).
 * Ascending harmonious arpeggio: C5 -> E5 -> G5 -> C6 with smooth warm decay.
 */
export function playAchievementSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0.00, dur: 0.20, gain: 0.18 }, // C5
    { freq: 659.25, time: 0.07, dur: 0.22, gain: 0.20 }, // E5
    { freq: 783.99, time: 0.14, dur: 0.26, gain: 0.22 }, // G5
    { freq: 1046.50, time: 0.21, dur: 0.55, gain: 0.26 }, // C6 (shimmer)
  ];

  notes.forEach(({ freq, time, dur, gain: targetGain }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + time);

    // Warm overtone for a richer chime bell sound
    const harmonicOsc = ctx.createOscillator();
    const harmonicGain = ctx.createGain();
    harmonicOsc.type = 'triangle';
    harmonicOsc.frequency.setValueAtTime(freq * 2, now + time);

    harmonicGain.gain.setValueAtTime(targetGain * 0.25, now + time);
    harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur * 0.7);

    // Main envelope
    gainNode.gain.setValueAtTime(0.0001, now + time);
    gainNode.gain.linearRampToValueAtTime(targetGain, now + time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

    osc.connect(gainNode);
    harmonicOsc.connect(harmonicGain);
    gainNode.connect(ctx.destination);
    harmonicGain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur);
    harmonicOsc.start(now + time);
    harmonicOsc.stop(now + time + dur);
  });
}

/**
 * Play a mellow, descending failure sound when a task is marked as Not Done.
 * Low dual-tone with soft rounded decay.
 */
export function playFailureSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Tone 1: Slightly somber tone
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(329.63, now); // E4
  osc1.frequency.exponentialRampToValueAtTime(293.66, now + 0.14); // D4

  gain1.gain.setValueAtTime(0.0001, now);
  gain1.gain.linearRampToValueAtTime(0.20, now + 0.015);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.18);

  // Tone 2: Lower resolution note
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(246.94, now + 0.12); // B3
  osc2.frequency.exponentialRampToValueAtTime(220.00, now + 0.32); // A3

  gain2.gain.setValueAtTime(0.0001, now + 0.12);
  gain2.gain.linearRampToValueAtTime(0.22, now + 0.14);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc2.start(now + 0.12);
  osc2.stop(now + 0.40);
}

/**
 * Play a gentle tactile click when a task is set to Pending.
 */
export function playPendingSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now); // A4
  osc.frequency.exponentialRampToValueAtTime(380, now + 0.08);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.10);
}
