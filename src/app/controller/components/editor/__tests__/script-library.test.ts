import {describe, it, expect} from 'vitest';
import {
  createScript,
  upsertScript,
  removeScript,
  renameScriptInList,
} from '@/app/controller/components/editor/script-library';

describe('script-library', () => {
  it('creates a script with id, name, code', () => {
    const s = createScript('My Script', 'await fight();');
    expect(s.name).toBe('My Script');
    expect(s.code).toBe('await fight();');
    expect(typeof s.id).toBe('string');
    expect(s.id.length).toBeGreaterThan(0);
  });

  it('upsert adds a new script', () => {
    const s = createScript('A');
    expect(upsertScript([], s)).toEqual([s]);
  });

  it('upsert replaces an existing script by id', () => {
    const s = createScript('A');
    const updated = {...s, code: 'changed'};
    expect(upsertScript([s], updated)).toEqual([updated]);
  });

  it('removes by id', () => {
    const a = createScript('A');
    const b = createScript('B');
    expect(removeScript([a, b], a.id)).toEqual([b]);
  });

  it('renames by id', () => {
    const a = createScript('A');
    const result = renameScriptInList([a], a.id, 'B');
    expect(result[0].name).toBe('B');
  });
});
