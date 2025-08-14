# ChatGPT-Mobile Clone

A mobile-first ChatGPT clone built with **Next.js 14 App Router**, **tRPC**, **Supabase**, **Auth0**, **Google Gemini API**, and **Bootstrap 5**.

Live demo → https://sample-rdl5.vercel.app/chat

---

## ✨ Features

* **Text & Image generation** using Google Gemini (1.5 Flash for text, 2.0 Flash preview for images).
* **Auth0 authentication** – secure login/logout with Universal Login.
* **Conversation management**  
  – create new chat automatically on first prompt  
  – sidebar (Bootstrap Off-Canvas) lists all chats  
  – auto-generated 3–5-word chat titles based on first user message.
* **Realtime persistence** via Supabase  
  – `conversations` and `messages` tables with RLS  
  – messages streamed back to client through tRPC hooks.
* **End-to-end type-safe API** with tRPC + Zod validation.
* **Mobile-first UI**  
  – bottom input bar, bubble chat design  
  – image bubbles for AI-generated pictures.
* **CI-ready** – `npm run build` passes, Node ≥20 specified for Vercel.

## 🗄 Tech Stack

| Layer            | Tech                                    |
|------------------|-----------------------------------------|
| Frontend         | Next.js 14 (React 19) – App Router      |
| Styling          | Bootstrap 5 + custom CSS                |
| State / Data     | tRPC 11 + TanStack React Query 5        |
| Auth             | Auth0 Next.js SDK v4                    |
| Persistence      | Supabase Postgres                       |
| LLMs             | Google Gemini API (`@google/genai`, `@google/generative-ai`) |

## 📂 Project Structure

```
app/            Next.js routes (App Router)
  chat/         mobile chat UI (client component)
  api/trpc/     single tRPC edge route
lib/            shared helpers (supabase, gemini, genai)
server/         tRPC router & procedures (sendMessage, generateImage …)
```

## ⚙️ Local Setup

```bash
# 1. install deps
npm install

# 2. copy env vars
cp .env.example .env.local  # fill in values (see below)

# 3. run dev server
npm run dev
# open http://localhost:3000/login
```

### Environment Variables (`.env.local`)
| key | value |
|-----|-------|
| AUTH0_DOMAIN | eg. `dev-xxxx.us.auth0.com` |
| AUTH0_CLIENT_ID | Auth0 App client ID |
| AUTH0_CLIENT_SECRET | Auth0 App secret |
| AUTH0_SECRET | 32-byte random string |
| NEXT_PUBLIC_SUPABASE_URL | your Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | anon key |
| SUPABASE_SERVICE_ROLE_KEY | service-role key |
| GEMINI_API_KEY | Google Generative AI API key |
| APP_BASE_URL | `http://localhost:3000` (prod: Vercel URL) |

### Supabase Schema (SQL)
See `sql/0001_initial.sql` (or run this once):
```sql
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text,
  updated_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  user_id text not null,
  role text check (role in ('user','bot','bot_image')),
  content text,
  image_url text,
  created_at timestamptz default now()
);
```

## 🧪 Testing
Basic server-side unit test (tRPC `sendMessage` mock) is included and can be run with `npm test`.  
All test artefacts are excluded from production build (`tsconfig.json → exclude`).

## 🚀 Deployment (Vercel)
1. Push to Git (Bitbucket/GitHub).  
2. Import in Vercel → add the env vars above.  
3. Build runs on **Node 20** (enforced via `package.json "engines"`).  
4. Live URL (demo): https://sample-rdl5.vercel.app

---
© 2025 ChatGPT-Mobile Clone — MIT Licence
