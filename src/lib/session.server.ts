import { useSession } from "@tanstack/react-start/server";

export type RMSession = {
  userId?: string | undefined;
  username?: string | undefined;
  globalName?: string | undefined;
  avatar?: string | undefined;
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
  expiresAt?: number | undefined;
  oauthState?: string | undefined;
};

function sessionConfig() {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("SESSION_SECRET is not configured");
  return {
    password,
    name: "rm_session",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: true,
      path: "/",
    },
  };
}

export async function getRMSession() {
  return useSession<RMSession>(sessionConfig());
}
