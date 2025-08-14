import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Dummy env vars
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_key';
process.env.GEMINI_API_KEY = 'test_key';
process.env.AUTH0_DOMAIN = 'dummy';
process.env.AUTH0_CLIENT_ID = 'dummy';
process.env.AUTH0_CLIENT_SECRET = 'dummysecret';
process.env.AUTH0_SECRET = 'dummysecretdummysecretdummysecretdummy';
process.env.APP_BASE_URL = 'http://localhost';

// Mock global fetch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}), text: async () => '' });

// Mock Auth0Client to prevent warnings
jest.mock('@auth0/nextjs-auth0/server', () => {
  return {
    Auth0Client: class {
      getSession() {
        return Promise.resolve({ user: { sub: 'user-1' } });
      }
    },
  };
});
