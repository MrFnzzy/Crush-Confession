import type { NextApiRequest, NextApiResponse } from "next";
import { parse, serialize } from "cookie";
import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "../../../shared/const";
import * as db from "../../../server/db";
import { getSessionCookieOptions } from "../../../server/_core/cookies";
import { sdk } from "../../../server/_core/sdk";

export default async function oauthCallback(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const code = typeof req.query.code === "string" ? req.query.code : undefined;
  const state = typeof req.query.state === "string" ? req.query.state : undefined;
  if (!code || !state) {
    res.status(400).json({ error: "code and state are required" });
    return;
  }

  const { nonce } = decodeOAuthState(state);
  const expectedNonce = parse(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
  if (!nonce || nonce !== expectedNonce) {
    res.status(403).json({ error: "invalid oauth state" });
    return;
  }

  const cookieOptions = getSessionCookieOptions(req as never) as Record<string, unknown>;
  const clearStateCookie = serialize(OAUTH_STATE_COOKIE, "", {
    path: "/",
    maxAge: 0,
    secure: Boolean(cookieOptions.secure),
    sameSite: "lax",
  });

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
    if (!userInfo.openId) {
      res.setHeader("Set-Cookie", clearStateCookie);
      res.status(400).json({ error: "openId missing from user info" });
      return;
    }

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });
    const sessionCookie = serialize(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      maxAge: Math.floor(ONE_YEAR_MS / 1000),
      secure: Boolean(cookieOptions.secure),
      sameSite: "lax",
    });
    res.setHeader("Set-Cookie", [clearStateCookie, sessionCookie]);
    res.redirect(302, "/admin");
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    res.status(500).json({ error: "OAuth callback failed" });
  }
}
