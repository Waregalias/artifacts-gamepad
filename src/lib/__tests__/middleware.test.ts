import {describe, it, expect, vi} from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => ({type: 'redirect', location: url.toString()}),
    next: () => ({type: 'next'}),
  },
}));

import {middleware, config} from '@/lib/middleware';

describe('middleware', () => {
  it('redirects the root path to /controller', () => {
    const result = middleware({nextUrl: {pathname: '/'}, url: 'https://app.test/'}) as unknown as {
      type: string;
      location: string;
    };
    expect(result.type).toBe('redirect');
    expect(result.location).toBe('https://app.test/controller');
  });

  it('passes through any other path', () => {
    const result = middleware({nextUrl: {pathname: '/controller'}, url: 'https://app.test/controller'}) as unknown as {
      type: string;
    };
    expect(result.type).toBe('next');
  });

  it('only matches the root path', () => {
    expect(config.matcher).toEqual(['/']);
  });
});
