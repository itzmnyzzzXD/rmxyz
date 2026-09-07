/**
 * Server-only Discord REST + OAuth2 helpers.
 * Never import this file from client code.
 */

export const DISCORD_API = "https://discord.com/api/v10";

export const PERMISSIONS = {
  ADMINISTRATOR: 1n << 3n,
  MANAGE_GUILD: 1n << 5n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_CHANNELS: 1n << 4n,
  BAN_MEMBERS: 1n << 2n,
  KICK_MEMBERS: 1n << 1n,
  MODERATE_MEMBERS: 1n << 40n,
};

export type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

export type DiscordPartialGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

export function discordConfig() {
  const clientId = process.env["DISCORD_CLIENT_ID"];
  const clientSecret = process.env["DISCORD_CLIENT_SECRET"];
  const botToken = process.env["DISCORD_BOT_TOKEN"];
  return { clientId, clientSecret, botToken };
}

export function isDiscordConfigured() {
  const { clientId, clientSecret } = discordConfig();
  return Boolean(clientId && clientSecret);
}

export function buildAuthorizeUrl(redirectUri: string, state: string) {
  const { clientId } = discordConfig();
  const params = new URLSearchParams({
    client_id: clientId ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds",
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = discordConfig();
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId ?? "",
      client_secret: clientSecret ?? "",
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

async function discordFetch<T>(path: string, token: string, bot = false): Promise<T> {
  const res = await fetch(`${DISCORD_API}${path}`, {
    headers: { authorization: `${bot ? "Bot" : "Bearer"} ${token}` },
  });
  if (!res.ok) throw new Error(`Discord API ${path} failed (${res.status})`);
  return (await res.json()) as T;
}

export function fetchCurrentUser(accessToken: string) {
  return discordFetch<DiscordUser>("/users/@me", accessToken);
}

export function fetchUserGuilds(accessToken: string) {
  return discordFetch<DiscordPartialGuild[]>("/users/@me/guilds", accessToken);
}

export async function fetchBotGuild(guildId: string) {
  const { botToken } = discordConfig();
  if (!botToken) return null;
  try {
    return await discordFetch<{
      id: string;
      name: string;
      icon: string | null;
      owner_id: string;
      approximate_member_count?: number;
      roles: { id: string; name: string; color: number; position: number; managed: boolean }[];
    }>(`/guilds/${guildId}?with_counts=true`, botToken, true);
  } catch {
    return null;
  }
}

export async function fetchBotGuildChannels(guildId: string) {
  const { botToken } = discordConfig();
  if (!botToken) return [];
  try {
    return await discordFetch<
      { id: string; name: string; type: number; parent_id: string | null; position: number }[]
    >(`/guilds/${guildId}/channels`, botToken, true);
  } catch {
    return [];
  }
}

/** A user may manage a guild if they own it or hold Manage Server / Administrator. */
export function canManageGuild(guild: DiscordPartialGuild) {
  if (guild.owner) return true;
  const perms = BigInt(guild.permissions ?? "0");
  return (
    (perms & PERMISSIONS.ADMINISTRATOR) === PERMISSIONS.ADMINISTRATOR ||
    (perms & PERMISSIONS.MANAGE_GUILD) === PERMISSIONS.MANAGE_GUILD
  );
}

export function guildIconUrl(id: string, icon: string | null | undefined, size = 128) {
  return icon
    ? `https://cdn.discordapp.com/icons/${id}/${icon}.${icon.startsWith("a_") ? "gif" : "png"}?size=${size}`
    : null;
}

export function avatarUrl(id: string, avatar: string | null | undefined, size = 128) {
  return avatar
    ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=${size}`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;
}

export function botOwnerIds() {
  return (process.env["BOT_OWNER_IDS"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
