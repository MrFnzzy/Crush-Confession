import { createNextApiHandler } from "@trpc/server/adapters/next";
import type { NextApiRequest, NextApiResponse } from "next";
import { appRouter } from "../../../server/routers";
import { createContext } from "../../../server/_core/context";

function createNextContext({ req, res }: { req: NextApiRequest; res: NextApiResponse }) {
  return createContext({
    req: req as never,
    res: {
      ...res,
      clearCookie(name: string) {
        res.setHeader("Set-Cookie", `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
      },
    } as never,
  });
}

export default createNextApiHandler({
  router: appRouter,
  createContext: createNextContext,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};
