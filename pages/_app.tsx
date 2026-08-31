import type { AppProps } from "next/app";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../client/src/lib/trpc";
import { COOKIE_NAME } from "@shared/const";
import "../client/src/index.css";

export default function NextApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          headers() {
            try {
              const raw = sessionStorage.getItem("manus-cookie");
              const prefix = `${COOKIE_NAME}=`;
              const token = raw?.split(";").find((s) => s.trim().startsWith(prefix))?.trim().slice(prefix.length);
              return token ? { Authorization: `Bearer ${token}` } : {};
            } catch {
              return {};
            }
          },
          fetch(input, init) {
            return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
