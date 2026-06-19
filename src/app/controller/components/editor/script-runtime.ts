import type {ArtifactCharacter} from '@/app/controller/models/artifact.model';

export type RunState = {aborted: boolean};

export function createRunState(): RunState {
  return {aborted: false};
}

export class AbortError extends Error {
  constructor() {
    super('Script stopped');
    this.name = 'AbortError';
  }
}

export function checkAbort(state: RunState): void {
  if (state.aborted) {
    throw new AbortError();
  }
}

export function extractCooldownSeconds(data: unknown): number {
  if (!data || typeof data !== 'object') {
    return 0;
  }
  const raw = (data as {cooldown?: {remaining_seconds?: number | string}}).cooldown?.remaining_seconds;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, raw);
  }
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return 0;
}

export function interruptibleSleep(ms: number, state: RunState): Promise<void> {
  const total = Math.max(0, Math.floor(ms));
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (state.aborted) {
        reject(new AbortError());
        return;
      }
      if (Date.now() - start >= total) {
        resolve();
        return;
      }
      const remaining = total - (Date.now() - start);
      setTimeout(tick, Math.min(100, remaining));
    };
    tick();
  });
}

export type ScriptLog = (level: 'info' | 'result' | 'error', message: string) => void;

export type ScriptContext = {
  apiKey: string;
  characterName: string;
  getCharacter: () => ArtifactCharacter | null;
  onCharacterUpdate: (character: ArtifactCharacter) => void;
  log: ScriptLog;
  state: RunState;
  autoCooldown?: boolean;
  fetchImpl?: typeof fetch;
};

const API_BASE = 'https://api.artifactsmmo.com';

function buildUrl(route: string, characterName: string): string {
  const normalized = route.startsWith('/') ? route : `/${route}`;
  return normalized.startsWith('/my/')
    ? `${API_BASE}${normalized}`
    : `${API_BASE}/my/${characterName}${normalized}`;
}

export function buildSdk(ctx: ScriptContext): Record<string, unknown> {
  const fetchImpl = ctx.fetchImpl ?? fetch;

  async function request(method: string, route: string, body?: unknown): Promise<unknown> {
    checkAbort(ctx.state);
    const init: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${ctx.apiKey}`,
      },
    };
    if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
      (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    const response = await fetchImpl(buildUrl(route, ctx.characterName), init);
    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && 'error' in json && (json as {error?: unknown}).error) {
      const err = (json as {error: {message?: string; code?: string}}).error;
      throw new Error(err.message || 'API error');
    }
    const data = (json as {data?: unknown}).data ?? json;
    if (data && typeof data === 'object' && 'character' in data) {
      const nextCharacter = (data as {character?: ArtifactCharacter}).character;
      if (nextCharacter) {
        ctx.onCharacterUpdate(nextCharacter);
      }
    }
    if (ctx.autoCooldown !== false) {
      const seconds = extractCooldownSeconds(data);
      if (seconds > 0) {
        ctx.log('info', `cooldown ${seconds}s`);
        await interruptibleSleep(seconds * 1000, ctx.state);
      }
    }
    return data;
  }

  async function action(name: string, body?: unknown): Promise<unknown> {
    const data = await request('POST', `/action/${name}`, body);
    ctx.log('result', `${name} ok`);
    return data;
  }

  const characterProxy = new Proxy({} as Record<string, unknown>, {
    get: (_target, prop) => {
      const current = ctx.getCharacter() as Record<string, unknown> | null;
      return current ? current[prop as string] : undefined;
    },
  });

  return {
    rest: () => action('rest'),
    fight: () => action('fight', {participants: []}),
    gather: () => action('gathering'),
    transition: () => action('transition'),
    move: (x: number, y: number) => action('move', {x, y}),
    refresh: async () => {
      checkAbort(ctx.state);
      const response = await fetchImpl(`${API_BASE}/characters/${ctx.characterName}`, {
        headers: {'Accept': 'application/json'},
      });
      const json = await response.json().catch(() => ({}));
      const data = (json as {data?: ArtifactCharacter}).data;
      if (data) {
        ctx.onCharacterUpdate(data);
      }
      ctx.log('result', 'refreshed');
      return data;
    },
    api: (method: string, route: string, body?: unknown) => request(method.toUpperCase(), route, body),
    sleep: (ms: number) => interruptibleSleep(ms, ctx.state),
    log: (...parts: unknown[]) =>
      ctx.log('info', parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ')),
    character: characterProxy,
  };
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => (...values: unknown[]) => Promise<unknown>;

export async function runScript(code: string, ctx: ScriptContext): Promise<void> {
  const sdk = buildSdk(ctx);
  const names = Object.keys(sdk);
  const values = names.map((name) => sdk[name]);
  try {
    const fn = new AsyncFunction(...names, code);
    await fn(...values);
  } catch (error) {
    if (error instanceof AbortError) {
      return;
    }
    ctx.log('error', (error as Error).message ?? String(error));
    throw error;
  }
}
