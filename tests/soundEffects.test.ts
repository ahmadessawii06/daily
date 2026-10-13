import test from 'node:test';
import assert from 'node:assert/strict';
import { preloadChallengeCompleteSound, playChallengeCompleteSound } from '../src/utils/soundEffects';

test('completion clip preloads once, restarts a shared player, and tolerates rejected or unavailable playback', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'Audio');
  const players: FakeAudio[] = [];
  class FakeAudio {
    preload = '';
    currentTime = 0;
    loads = 0;
    plays = 0;
    failure: 'reject' | 'throw' | null = null;
    constructor(public src: string) { players.push(this); }
    load() { this.loads++; }
    play() {
      this.plays++;
      if (this.failure === 'throw') throw new Error('Media unavailable');
      return this.failure === 'reject' ? Promise.reject(new Error('Autoplay blocked')) : Promise.resolve();
    }
  }
  try {
    Reflect.deleteProperty(globalThis, 'Audio');
    assert.doesNotThrow(playChallengeCompleteSound);
    Object.defineProperty(globalThis, 'Audio', { value: FakeAudio, configurable: true });
    preloadChallengeCompleteSound(); preloadChallengeCompleteSound();
    assert.equal(players.length, 1);
    assert.equal(players[0].src, '/sounds/challenge-complete.mp3');
    assert.equal(players[0].loads, 1); assert.equal(players[0].preload, 'auto');
    players[0].currentTime = 4;
    playChallengeCompleteSound();
    assert.equal(players[0].currentTime, 0); assert.equal(players[0].plays, 1);
    players[0].failure = 'reject'; assert.doesNotThrow(playChallengeCompleteSound); await Promise.resolve();
    players[0].failure = 'throw'; assert.doesNotThrow(playChallengeCompleteSound);
    assert.equal(players[0].plays, 3); assert.equal(players.length, 1);
  } finally {
    if (original) Object.defineProperty(globalThis, 'Audio', original);
    else Reflect.deleteProperty(globalThis, 'Audio');
  }
});
