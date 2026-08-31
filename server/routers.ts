import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  confessions: router({
    create: publicProcedure
      .input(z.object({
        fromName: z.string().trim().min(1).max(100),
        toName: z.string().trim().min(1).max(100),
        message: z.string().trim().min(1).max(2000),
      }))
      .mutation(async ({ input }) => {
        return await db.createConfession(input);
      }),

    list: publicProcedure.query(async () => {
      const list = await db.getConfessions();
      return list.map(c => ({
        ...c,
        number: c.id // Use database ID for persistent sequential numbering
      }));
    }),

    count: publicProcedure.query(async () => {
      const list = await db.getConfessions();
      return list.length;
    }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteConfession(input.id);
      }),
  }),

  replies: router({
    create: publicProcedure
      .input(z.object({
        confessionId: z.number(),
        message: z.string().trim().min(1).max(1000),
      }))
      .mutation(async ({ input }) => {
        return await db.createReply(input);
      }),

    list: publicProcedure
      .input(z.object({ confessionId: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getReplies(input.confessionId);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteReply(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
