import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
  getCharacter,
  rest,
  fight,
  gathering,
  transition,
  move,
} from '@/app/controller/services/api.service';

function okResponse(payload: unknown) {
  return Promise.resolve({json: () => Promise.resolve(payload)} as Response);
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('action endpoints', () => {
  it('rest posts to the rest action and returns json.data', async () => {
    fetchMock.mockReturnValue(okResponse({data: {character: {name: 'Bob'}}}));
    const result = await rest('KEY', 'Bob');

    expect(result).toEqual({character: {name: 'Bob'}});
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.artifactsmmo.com/my/Bob/action/rest');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer KEY');
  });

  it('fight sends an empty participants body', async () => {
    fetchMock.mockReturnValue(okResponse({data: {character: {name: 'Bob'}}}));
    await fight('KEY', 'Bob');

    const init = fetchMock.mock.calls[0][1];
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.artifactsmmo.com/my/Bob/action/fight');
    expect(JSON.parse(init.body as string)).toEqual({participants: []});
  });

  it('gathering posts to the gathering action', async () => {
    fetchMock.mockReturnValue(okResponse({data: {character: {name: 'Bob'}}}));
    await gathering('KEY', 'Bob');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.artifactsmmo.com/my/Bob/action/gathering');
  });

  it('transition posts to the transition action', async () => {
    fetchMock.mockReturnValue(okResponse({data: {character: {name: 'Bob'}}}));
    await transition('KEY', 'Bob');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.artifactsmmo.com/my/Bob/action/transition');
  });

  it('move adds the delta to the current coordinates in the body', async () => {
    fetchMock.mockReturnValue(okResponse({data: {character: {name: 'Bob'}}}));
    await move('KEY', 'Bob', 5, 7, 1, -1);

    const init = fetchMock.mock.calls[0][1];
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.artifactsmmo.com/my/Bob/action/move');
    expect(JSON.parse(init.body as string)).toEqual({x: 6, y: 6});
  });

  it('throws when the API returns an error object', async () => {
    fetchMock.mockReturnValue(okResponse({error: {message: 'in cooldown', code: 486}}));
    await expect(rest('KEY', 'Bob')).rejects.toThrow('in cooldown');
  });
});

describe('getCharacter', () => {
  it('reads a character with a GET request', async () => {
    fetchMock.mockReturnValue(okResponse({data: {name: 'Bob', level: 5}}));
    const result = await getCharacter('KEY', 'Bob');

    expect(result).toEqual({name: 'Bob', level: 5});
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.artifactsmmo.com/characters/Bob');
    expect(init.method).toBe('GET');
  });

  it('throws when the API returns an error', async () => {
    fetchMock.mockReturnValue(okResponse({error: 'not found'}));
    await expect(getCharacter('KEY', 'Ghost')).rejects.toThrow();
  });
});
