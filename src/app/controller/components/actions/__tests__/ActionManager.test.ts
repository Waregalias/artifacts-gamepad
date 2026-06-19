import {describe, it, expect, vi, beforeEach} from 'vitest';

const rest = vi.fn();
const fight = vi.fn();
const gathering = vi.fn();
const transition = vi.fn();
const move = vi.fn();
const toast = vi.fn();

vi.mock('@/app/controller/services/api.service', () => ({
  rest: (...args: unknown[]) => rest(...args),
  fight: (...args: unknown[]) => fight(...args),
  gathering: (...args: unknown[]) => gathering(...args),
  transition: (...args: unknown[]) => transition(...args),
  move: (...args: unknown[]) => move(...args),
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: (...args: unknown[]) => toast(...args),
}));

import {actionManager} from '@/app/controller/components/actions/ActionManager';
import type {ArtifactCharacter} from '@/app/controller/models/artifact.model';

const character: ArtifactCharacter = {name: 'Bob', x: 3, y: 4, hp: 100, max_hp: 100};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('actionManager — button actions', () => {
  it('maps buttonRight to fight and resolves the returned character', async () => {
    fight.mockResolvedValue({character: {name: 'Bob', hp: 90}});
    const result = await actionManager('KEY', character, 'buttonRight');

    expect(fight).toHaveBeenCalledWith('KEY', 'Bob');
    expect(result).toEqual({name: 'Bob', hp: 90});
  });

  it('maps buttonUp to rest', async () => {
    rest.mockResolvedValue({character: {name: 'Bob'}});
    await actionManager('KEY', character, 'buttonUp');
    expect(rest).toHaveBeenCalledWith('KEY', 'Bob');
  });

  it('falls back to the current character when the response has none', async () => {
    fight.mockResolvedValue({});
    const result = await actionManager('KEY', character, 'buttonRight');
    expect(result).toBe(character);
  });

  it('rejects and toasts when the action throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fight.mockRejectedValue(new Error('boom'));
    await expect(actionManager('KEY', character, 'buttonRight')).rejects.toThrow('boom');
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({variant: 'destructive'}));
    errorSpy.mockRestore();
  });
});

describe('actionManager — movement', () => {
  it('moves right with deltaX = +1, deltaY = 0', async () => {
    move.mockResolvedValue({character: {name: 'Bob'}});
    await actionManager('KEY', character, 'directionRight');
    expect(move).toHaveBeenCalledWith('KEY', 'Bob', 3, 4, 1, 0);
  });

  it('moves up with deltaY = -1, deltaX = 0', async () => {
    move.mockResolvedValue({character: {name: 'Bob'}});
    await actionManager('KEY', character, 'directionUp');
    expect(move).toHaveBeenCalledWith('KEY', 'Bob', 3, 4, 0, -1);
  });
});

describe('actionManager — unknown key', () => {
  it('resolves the current character without calling the API', async () => {
    const result = await actionManager('KEY', character, 'unknown');
    expect(result).toBe(character);
    expect(fight).not.toHaveBeenCalled();
    expect(move).not.toHaveBeenCalled();
  });
});
