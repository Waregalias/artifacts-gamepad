import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {getCharacters} from '@/app/settings/services/api.service';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getCharacters', () => {
  it('returns the data array with an authorized request', async () => {
    fetchMock.mockReturnValue(
      Promise.resolve({json: () => Promise.resolve({data: [{name: 'Bob'}, {name: 'Lia'}]})} as Response),
    );

    const result = await getCharacters('KEY');

    expect(result).toEqual([{name: 'Bob'}, {name: 'Lia'}]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.artifactsmmo.com/my/characters');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer KEY');
  });
});
