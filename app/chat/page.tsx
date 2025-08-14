'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useUser } from '@auth0/nextjs-auth0';


interface Message {
  id: string;
  role: 'user' | 'bot' | 'bot_image';
  content: string | null;
  image_url?: string | null;
  created_at: string;
}

export default function ChatPage() {
  const { user, isLoading } = useUser();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // load Bootstrap JS once on mount (offcanvas)
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  // tRPC hooks
  const convoQuery = trpc.listConversations.useQuery(undefined, {
    enabled: !isLoading && !!user,
  } as any);
  // separate onSuccess effect
  useEffect(() => {
    if (convoQuery.data && !activeConvId && convoQuery.data.length) {
      setActiveConvId(convoQuery.data[0].id);
    }
  },
  [convoQuery.data, activeConvId]);

  const messagesQuery = trpc.listMessages.useQuery(
    { conversationId: activeConvId as string },
    { enabled: !!activeConvId }
  );

  const createConversation = trpc.createConversation.useMutation({
    onSuccess: (data) => {
      convoQuery.refetch();
      setActiveConvId(data.id);
    },
  });

  const sendText = trpc.sendMessage.useMutation({
    onSuccess: () => {
      messagesQuery.refetch();
      convoQuery.refetch();
    },
  });

  const sendImage = trpc.generateImage.useMutation({
    onSuccess: () => {
      messagesQuery.refetch();
      convoQuery.refetch();
    },
  });

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messagesQuery.data]);

  if (!isLoading && !user) {
    if (typeof window !== 'undefined') window.location.href = '/auth/login';
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    let convId = activeConvId;
    // lazily create a conversation on first send
    if (!convId) {
      const conv = await createConversation.mutateAsync({});
      convId = conv.id;
      setActiveConvId(convId);
    }

    if (!convId) return; // safety

    if (mode === 'text') {
      sendText.mutate({ conversationId: convId, content: prompt });
    } else {
      sendImage.mutate({ conversationId: convId, prompt });
    }
    setInput('');
  };

  return (
    <div className="d-flex flex-column vh-100">
      {/* Header */}
      <header className="py-2 px-3 border-bottom bg-light d-flex justify-content-between align-items-center">
        {/* Burger icon to open sidebar */}
        <button
          className="btn btn-outline-secondary btn-sm"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#chatSidebar"
          aria-controls="chatSidebar"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="d-flex gap-2 align-items-center">
          <select
            className="form-select form-select-sm w-auto"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
          </select>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => (window.location.href = '/auth/logout')}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Offcanvas sidebar for conversations */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex={-1}
        id="chatSidebar"
        aria-labelledby="chatSidebarLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="chatSidebarLabel">
            Conversations
          </h5>
          <button
            type="button"
            className="btn-close text-reset"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body p-0 d-flex flex-column">
          <div className="list-group list-group-flush flex-grow-1 overflow-auto">
            {convoQuery.data?.map((c) => (
              <button
                key={c.id}
                className={`list-group-item list-group-item-action text-truncate ${c.id === activeConvId ? 'active' : ''}`}
                onClick={() => {
                  setActiveConvId(c.id);
                  (document.getElementById('chatSidebar') as any)?.classList.remove('show');
                }}
              >
                {c.title ?? 'Untitled'}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary m-3 w-100"
            onClick={() => createConversation.mutate({})}
          >
            + New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <main className="flex-grow-1 overflow-auto px-3 py-2">
        {messagesQuery.data?.map((m: Message) => (
          <div
            key={m.id}
            className={`d-flex mb-2 ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
          >
            {m.role === 'bot_image' && m.image_url ? (
              <img
                src={m.image_url}
                alt="Generated"
                className="rounded-3"
                style={{ maxWidth: '70%' }}
              />
            ) : (
              <div
                className={`p-2 rounded-3 ${m.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-white'} text-wrap`}
                style={{ maxWidth: '75%' }}
              >
                {m.content}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </main>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-top p-2 bg-white">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder={mode === 'text' ? 'Type your message...' : 'Describe the image...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={!input.trim() || sendText.isPending || sendImage.isPending}>
            {mode === 'image' ? 'Generate' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
