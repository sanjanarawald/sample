import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import superjson from 'superjson';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { gemini } from '@/lib/gemini'; // still used for text
import { genai, Modality } from '@/lib/genai';
import { auth0 } from '@/lib/auth0';

// 1. Create context (empty for now, can include auth info later)
export const createContext = async () => {
  const session = await auth0.getSession();
  return {
    userId: session?.user?.sub ?? null,
  };
};
export type Context = Awaited<ReturnType<typeof createContext>>;

// 2. Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// 3. Routers / Procedures
export const appRouter = t.router({
  ping: t.procedure.query(() => 'pong'),

  createConversation: t.procedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId ?? null;
      if (!userId) throw new Error('Unauthenticated');
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .insert([{ user_id: userId, title: input.title ?? 'New chat' }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  listConversations: t.procedure.query(async ({ ctx }) => {
    const userId = ctx.userId ?? null;
    if (!userId) throw new Error('Unauthenticated');
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }),

  listMessages: t.procedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId ?? null;
      if (!userId) throw new Error('Unauthenticated');
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', input.conversationId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    }),

  sendMessage: t.procedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId ?? null;
      if (!userId) throw new Error('Unauthenticated');
      // 1. store user message
      const { error: insertErr } = await supabaseAdmin.from('messages').insert([
        {
          conversation_id: input.conversationId,
          user_id: userId,
          role: 'user',
          content: input.content,
        },
      ]);
      if (insertErr) throw new Error(insertErr.message);

      // 2. call Gemini text model
      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(input.content);
      const reply = result.response.text();

      // 3. store bot reply
      await supabaseAdmin.from('messages').insert([
        {
          conversation_id: input.conversationId,
          user_id: userId,
          role: 'bot',
          content: reply,
        },
      ]);

      // 4. update conversation preview
      await supabaseAdmin
        .from('conversations')
        .update({
          updated_at: new Date().toISOString(),
          last_message: reply,
          last_message_role: 'bot',
        })
        .eq('id', input.conversationId);

      // If the conversation title is still default, generate a short title
      const { data: convRow } = await supabaseAdmin
        .from('conversations')
        .select('title')
        .eq('id', input.conversationId)
        .single();

      if (convRow && (!convRow.title || convRow.title.startsWith('New chat'))) {
        try {
          const titleModel = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const titleRes = await titleModel.generateContent(
            `Generate a concise 3-5 word title for a chat based on this first user message: "${input.content}". Respond with title only.`,
          );
          const title = titleRes.response.text().replace(/"/g, '').trim();
          if (title) {
            await supabaseAdmin
              .from('conversations')
              .update({ title })
              .eq('id', input.conversationId);
          }
        } catch (e) {
          console.error('Failed to generate chat title', e);
        }
      }

      return { reply };
    }),

  generateImage: t.procedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        prompt: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId ?? null;
      if (!userId) throw new Error('Unauthenticated');

      // store user message (prompt)
      await supabaseAdmin.from('messages').insert([
        {
          conversation_id: input.conversationId,
          user_id: userId,
          role: 'user',
          content: input.prompt,
        },
      ]);

      // call Gemini image generation
      const result = await genai.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents: input.prompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      } as any);

      const part = (result as any).candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data || p.fileData?.fileUri);
      let imageUrl: string | null = null;
      if (part?.inlineData?.data) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part?.fileData?.fileUri) {
        imageUrl = part.fileData.fileUri as string;
      }

      if (!imageUrl) {
        throw new Error('Failed to generate image');
      }

      // store bot image message
      await supabaseAdmin.from('messages').insert([
        {
          conversation_id: input.conversationId,
          user_id: userId,
          role: 'bot_image',
          content: input.prompt,
          image_url: imageUrl,
        },
      ]);

      await supabaseAdmin
        .from('conversations')
        .update({
          updated_at: new Date().toISOString(),
          last_message: '[Image]',
          last_message_role: 'bot_image',
        })
        .eq('id', input.conversationId);

      return { imageUrl };
    }),
});

export type AppRouter = typeof appRouter;
