import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
  createRunState,
  checkAbort,
  AbortError,
  extractCooldownSeconds,
  interruptibleSleep,
} from '@/app/controller/components/editor/script-runtime';

describe('checkAbort', () => {
  it('does nothing when not aborted', () => {
    expect(() => checkAbort(createRunState())).not.toThrow();
  });

  it('throws AbortError when aborted', () => {
    const state = createRunState();
    state.aborted = true;
    expect(() => checkAbort(state)).toThrow(AbortError);
  });
});

describe('extractCooldownSeconds', () => {
  it('reads a numeric remaining_seconds', () => {
    expect(extractCooldownSeconds({cooldown: {remaining_seconds: 12}})).toBe(12);
  });
  it('parses a string remaining_seconds', () => {
    expect(extractCooldownSeconds({cooldown: {remaining_seconds: '7'}})).toBe(7);
  });
  it('returns 0 for missing/invalid data', () => {
    expect(extractCooldownSeconds(null)).toBe(0);
    expect(extractCooldownSeconds({})).toBe(0);
    expect(extractCooldownSeconds({cooldown: {remaining_seconds: 'x'}})).toBe(0);
  });
  it('never returns a negative value', () => {
    expect(extractCooldownSeconds({cooldown: {remaining_seconds: -5}})).toBe(0);
  });
});

describe('interruptibleSleep', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves after the delay when not aborted', async () => {
    const state = createRunState();
    const done = vi.fn();
    const p = interruptibleSleep(1000, state).then(done);
    await vi.advanceTimersByTimeAsync(1000);
    await p;
    expect(done).toHaveBeenCalled();
  });

  it('rejects AbortError when aborted mid-sleep', async () => {
    const state = createRunState();
    const p = interruptibleSleep(10000, state);
    const assertion = expect(p).rejects.toBeInstanceOf(AbortError);
    state.aborted = true;
    await vi.advanceTimersByTimeAsync(200);
    await assertion;
  });
});
