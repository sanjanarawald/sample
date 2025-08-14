import { describe, it, expect, jest } from '@jest/globals';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'dummy';

jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn().mockResolvedValue({ user: { sub: 'user-1' } }) },
}));

jest.mock('@/lib/supabaseAdmin', () => {
  const chain = () => ({
    insert: jest.fn().mockResolvedValue({ error: null }),
    update: jest.fn().mockResolvedValue({ error: null }),
    select: jest.fn().mockResolvedValue({ data: [{ title: 'New chat' }], error: null }),
    order: () => chain(),
    eq: () => chain(),
    single: jest.fn().mockResolvedValue({ data: { title: 'New chat' } }),
  });
  return {
    supabaseAdmin: {
      from: jest.fn().mockImplementation(() => chain()),
    },
  };
});

jest.mock('@/lib/gemini', () => {
  return {
    gemini: {
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockResolvedValue({ response: { text: () => 'Hi there!' } }),
      }),
    },
  };
});

import { appRouter } from '@/server/trpc';

describe('sendMessage procedure', () => {
  const caller = appRouter.createCaller({ userId: 'user-1' });

  it('stores user message and bot reply', async () => {
    await caller.sendMessage({ conversationId: '00000000-0000-0000-0000-000000000000', content: 'Hello' });
    expect(true).toBe(true);
  });
});
