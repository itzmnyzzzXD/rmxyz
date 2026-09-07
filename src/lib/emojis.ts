/**
 * RM asset registry.
 * The supplied emoji pack lives in /public/emojis and is referenced by key so
 * both the dashboard and the Discord bot resolve the same names.
 * Discord custom-emoji IDs (once uploaded to the bot's application) can be
 * added to `discordIds` and are used by bot embeds via `bot/rm/assets.py`.
 */
export const EMOJI_KEYS = [
  "alert",
  "announce",
  "ban",
  "bank",
  "bell",
  "bolt",
  "bot",
  "calendar",
  "camera",
  "chat",
  "check",
  "checklist",
  "clock",
  "cloud",
  "coin",
  "contract",
  "cross",
  "crown",
  "database",
  "dice",
  "fire",
  "folder",
  "football",
  "gem",
  "gift",
  "headphones",
  "heart",
  "key",
  "kick",
  "levelup",
  "link",
  "lock",
  "mail",
  "mic",
  "mic_caster",
  "mute",
  "pin",
  "rocket",
  "search",
  "settings",
  "shield_check",
  "shield_staff",
  "shop",
  "star",
  "stats",
  "swords",
  "ticket",
  "transfer",
  "trophy",
  "unlock",
  "verified",
  "wand",
  "warn",
  "wave",
  "whistle_ref",
] as const;

export type EmojiKey = (typeof EMOJI_KEYS)[number];

export function emojiUrl(key: EmojiKey) {
  return `/emojis/axiom_${key}.png`;
}

/** Semantic mapping used across dashboard + bot responses. */
export const ICONS = {
  success: "check",
  error: "cross",
  warning: "warn",
  security: "shield_check",
  antinuke: "shield_staff",
  antiraid: "swords",
  lockdown: "lock",
  unlock: "unlock",
  moderation: "whistle_ref",
  ban: "ban",
  kick: "kick",
  mute: "mute",
  logging: "folder",
  tickets: "ticket",
  roles: "key",
  welcome: "wave",
  giveaways: "gift",
  leveling: "levelup",
  economy: "coin",
  shop: "shop",
  analytics: "stats",
  settings: "settings",
  automod: "bolt",
  filter: "search",
  commands: "wand",
  responders: "chat",
  overview: "bot",
  owner: "crown",
  premium: "gem",
  starboard: "star",
  suggestions: "checklist",
  fun: "dice",
  reminders: "clock",
  announce: "announce",
  database: "database",
  verified: "verified",
} as const satisfies Record<string, EmojiKey>;

export type IconName = keyof typeof ICONS;

export function iconUrl(name: IconName) {
  return emojiUrl(ICONS[name]);
}
