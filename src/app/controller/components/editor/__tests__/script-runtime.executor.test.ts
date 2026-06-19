import {describe, it, expect, vi} from 'vitest';
import {runScript, createRunState, type ScriptContext} from '@/app/controller/components/editor/script-runtime';
import type {ArtifactCharacter} from '@/app/controller/models/artifact.model';

function makeCtx(overrides: Partial<ScriptContext> = {}): {ctx: ScriptContext; logs: string[]; updates: ArtifactCharacter[]} {
  const logs: string[] = [];
  const updates: ArtifactCharacter[] = [];
  let character: ArtifactCharacter | null = {name: 'Bob', hp: 50, max_hp: 100, x: 0, y: 0};
  const ctx: ScriptContext = {
    apiKey: 'KEY',
    characterName: 'Bob',
    getCharacter: () => character,
    onCharacterUpdate: (c) => {
      character = c;
      updates.push(c);
    },
    log: (_level, message) => logs.push(message),
    state: createRunState(),
    autoCooldown: false,
    ...overrides,
  };
  return {ctx, logs, updates};
}

function jsonResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({data}),
  } as Response);
}

describe('runScript', () => {
  it('calls fight() against the right endpoint and updates character', async () => {
    const fetchImpl = vi.fn().mockReturnValue(
      jsonResponse({character: {name: 'Bob', hp: 90, max_hp: 100}, cooldown: {remaining_seconds: 0}}),
    );
    const {ctx, updates} = makeCtx({fetchImpl});
    await runScript('await fight();', ctx);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const url = (fetchImpl.mock.calls[0][0] as string);
    expect(url).toBe('https://api.artifactsmmo.com/my/Bob/action/fight');
    expect(updates[0].hp).toBe(90);
  });

  it('exposes a live character proxy', async () => {
    const fetchImpl = vi.fn().mockReturnValue(
      jsonResponse({character: {name: 'Bob', hp: 100, max_hp: 100}, cooldown: {remaining_seconds: 0}}),
    );
    const {ctx, logs} = makeCtx({fetchImpl});
    await runScript('log("hp=" + character.hp); await fight(); log("hp=" + character.hp);', ctx);
    expect(logs).toContain('hp=50');
    expect(logs).toContain('hp=100');
  });

  it('stops cleanly (no throw) when aborted before an action', async () => {
    const fetchImpl = vi.fn().mockReturnValue(jsonResponse({character: {name: 'Bob'}, cooldown: {remaining_seconds: 0}}));
    const {ctx} = makeCtx({fetchImpl});
    ctx.state.aborted = true;
    await expect(runScript('await fight();', ctx)).resolves.toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('logs and rethrows a real script error', async () => {
    const {ctx, logs} = makeCtx();
    await expect(runScript('throw new Error("boom");', ctx)).rejects.toThrow('boom');
    expect(logs.some((l) => l.includes('boom'))).toBe(true);
  });

  it('api() nests a non-/my route under the character', async () => {
    const fetchImpl = vi.fn().mockReturnValue(jsonResponse({character: {name: 'Bob'}, cooldown: {remaining_seconds: 0}}));
    const {ctx} = makeCtx({fetchImpl});
    await runScript('await api("POST", "/action/rest");', ctx);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.artifactsmmo.com/my/Bob/action/rest');
  });
});
