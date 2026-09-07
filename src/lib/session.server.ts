import { useSession } from "@tanstack/react-start/server";

export type RMSession = {
  userId?: string;
  username?: string;
  globalName?: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  oauthState?: string;
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
