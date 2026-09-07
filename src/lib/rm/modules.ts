/**
 * Client-safe module registry: default settings for every configurable RM
 * system. The dashboard and the bot both read these defaults so an unsaved
 * guild behaves exactly like a freshly saved one.
 */
import type { IconName } from "@/lib/emojis";

export type ModuleKey =
  | "core"
  | "moderation"
  | "automod"
  | "wordfilter"
  | "antinuke"
  | "antiraid"
  | "logging"
  | "welcome"
  | "tickets"
  | "leveling"
  | "economy"
  | "starboard"
  | "suggestions"
  | "branding";

export const DEFAULTS: Record<ModuleKey, Record<string, unknown>> = {
  core: {
    prefixes: ["rm!", "rm?"],
    mention_prefix: true,
    language: "en",
    timezone: "UTC",
    default_reason: "No reason provided",
    admin_roles: [],
    moderator_roles: [],
    bypass_roles: [],
    delete_command_messages: false,
    dm_on_punishment: true,
    slash_commands: true,
  },
  moderation: {
    require_reason: false,
    warn_expiry_days: 0,
    escalation_enabled: true,
    escalation: [
      { points: 3, action: "timeout", duration_seconds: 3600 },
      { points: 5, action: "kick" },
      { points: 7, action: "ban" },
    ],
    default_timeout_seconds: 3600,
    softban_delete_days: 1,
    purge_limit: 200,
    confirm_dangerous: true,
  },
  automod: {
    modules: {
      spam: { enabled: true, messages: 6, seconds: 5, action: "timeout", duration_seconds: 300 },
      flood: { enabled: true, messages: 10, seconds: 3, action: "delete" },
      mention_spam: { enabled: true, limit: 6, action: "timeout", duration_seconds: 600 },
      mass_mentions: { enabled: true, limit: 12, action: "kick" },
      link_spam: { enabled: false, limit: 3, seconds: 10, action: "delete" },
      invites: { enabled: true, action: "delete" },
      ip_grabbers: { enabled: true, action: "ban" },
      scam_links: { enabled: true, action: "ban" },
      phishing: { enabled: true, action: "ban" },
      caps: { enabled: true, percent: 70, min_length: 12, action: "delete" },
      repeated_messages: { enabled: true, limit: 4, action: "timeout", duration_seconds: 300 },
      emoji_spam: { enabled: true, limit: 12, action: "delete" },
      sticker_spam: { enabled: false, limit: 4, action: "delete" },
      character_spam: { enabled: true, limit: 15, action: "delete" },
      zalgo: { enabled: true, action: "delete" },
      duplicate_messages: { enabled: true, limit: 3, seconds: 20, action: "delete" },
      fast_joins: { enabled: true, joins: 8, seconds: 10, action: "log" },
      bot_spam: { enabled: false, action: "log" },
      webhook_abuse: { enabled: true, action: "delete" },
    },
    exempt_channels: [],
    exempt_roles: [],
    exempt_users: [],
    allowed_domains: [],
    punishment_points: 1,
  },
  wordfilter: {
    partial_match: true,
    detect_substitutions: true,
    detect_repeats: true,
    detect_unicode_bypass: true,
    case_sensitive: false,
    action: "delete",
    warn_message: "That word isn't allowed here.",
    exempt_channels: [],
    exempt_roles: [],
  },
  antinuke: {
    punishment: "ban",
    watch: {
      channel_delete: { enabled: true, limit: 4, seconds: 10 },
      channel_create: { enabled: true, limit: 6, seconds: 10 },
      channel_update: { enabled: true, limit: 8, seconds: 15 },
      role_delete: { enabled: true, limit: 3, seconds: 10 },
      role_create: { enabled: true, limit: 5, seconds: 10 },
      role_update: { enabled: true, limit: 6, seconds: 15 },
      member_ban: { enabled: true, limit: 4, seconds: 15 },
      member_kick: { enabled: true, limit: 5, seconds: 15 },
      webhook_create: { enabled: true, limit: 3, seconds: 10 },
      webhook_delete: { enabled: true, limit: 3, seconds: 10 },
      emoji_delete: { enabled: true, limit: 6, seconds: 15 },
      emoji_create: { enabled: false, limit: 10, seconds: 15 },
      integration_update: { enabled: true, limit: 2, seconds: 20 },
      dangerous_permissions: { enabled: true, limit: 1, seconds: 10 },
      admin_role_created: { enabled: true, limit: 1, seconds: 10 },
      guild_update: { enabled: true, limit: 3, seconds: 30 },
      bot_added: { enabled: true, limit: 1, seconds: 10 },
    },
    strip_dangerous_permissions: true,
    remove_created_roles: true,
    restore_channels: true,
    restore_roles: true,
    delete_malicious_webhooks: true,
    auto_lockdown: true,
    alert_channel_id: null,
    recovery_mode: false,
  },
  antiraid: {
    join_threshold: 8,
    join_window_seconds: 10,
    min_account_age_days: 7,
    action: "kick",
    raid_mode: "auto",
    lockdown_minutes: 15,
    restrict_new_members: true,
    verification_level_on_raid: "high",
    detect_similar_names: true,
    detect_default_avatars: true,
    detect_bot_raids: true,
    alert_channel_id: null,
    exempt_roles: [],
  },
  logging: {
    channels: {
      mod: null,
      security: null,
      member: null,
      message: null,
      server: null,
      voice: null,
    },
    events: {
      message_delete: true,
      message_edit: true,
      member_join: true,
      member_leave: true,
      ban: true,
      unban: true,
      kick: true,
      timeout: true,
      warn: true,
      role_change: true,
      channel_change: true,
      server_change: true,
      permission_change: true,
      voice: false,
      nickname_change: true,
      username_change: false,
      invites: true,
      webhooks: true,
      automod: true,
      antinuke: true,
      antiraid: true,
    },
    ignored_channels: [],
    ignore_bots: false,
  },
  welcome: {
    welcome_enabled: false,
    welcome_channel_id: null,
    welcome_message: "Welcome {mention} to **{server}**! You are member #{membercount}.",
    welcome_embed: true,
    goodbye_enabled: false,
    goodbye_channel_id: null,
    goodbye_message: "{username} just left {server}.",
    dm_welcome_enabled: false,
    dm_welcome_message: "Thanks for joining {server}, {username}!",
    autoroles: [],
    rules_message: "",
    verification_enabled: false,
    verification_role_id: null,
  },
  tickets: {
    enabled: false,
    transcript_channel_id: null,
    log_channel_id: null,
    max_open_per_user: 1,
    dm_transcript: true,
    close_confirmation: true,
    auto_close_hours: 72,
  },
  leveling: {
    enabled: false,
    xp_per_message: 15,
    xp_cooldown_seconds: 60,
    announce: true,
    announce_channel_id: null,
    announce_message: "{mention} reached level **{level}**!",
    level_roles: [],
    multipliers: [],
    ignored_channels: [],
    stack_roles: true,
  },
  economy: {
    enabled: false,
    currency_name: "credits",
    currency_symbol: "coin",
    daily_amount: 250,
    weekly_amount: 1200,
    work_min: 50,
    work_max: 300,
    work_cooldown_seconds: 3600,
    starting_balance: 100,
  },
  starboard: {
    enabled: false,
    channel_id: null,
    emoji: "star",
    threshold: 4,
    ignore_bots: true,
    self_star: false,
    ignored_channels: [],
    ignored_roles: [],
  },
  suggestions: {
    enabled: false,
    channel_id: null,
    review_channel_id: null,
    allow_anonymous: false,
    auto_thread: true,
    staff_roles: [],
  },
  branding: {
    embed_color: "#EF4444",
    success_color: "#22C55E",
    error_color: "#EF4444",
    footer_text: "RM",
    logo_url: "",
    response_style: "embed",
    use_emojis: true,
  },
};

export type ModuleMeta = {
  key: ModuleKey;
  label: string;
  description: string;
  icon: IconName;
};

export const MODULE_META: ModuleMeta[] = [
  { key: "core", label: "Server Settings", description: "Prefixes, language, staff roles and bot behaviour", icon: "settings" },
  { key: "moderation", label: "Moderation", description: "Cases, warning thresholds and escalation", icon: "moderation" },
  { key: "automod", label: "AutoMod", description: "19 independent spam and content protections", icon: "automod" },
  { key: "wordfilter", label: "Word Filter", description: "Profanity and blocked-word detection", icon: "filter" },
  { key: "antinuke", label: "Anti-Nuke", description: "Destructive-action thresholds and recovery", icon: "antinuke" },
  { key: "antiraid", label: "Anti-Raid", description: "Join bursts, new accounts and raid mode", icon: "antiraid" },
  { key: "logging", label: "Logging", description: "Split log channels and event toggles", icon: "logging" },
  { key: "welcome", label: "Welcome", description: "Welcome, goodbye, autorole and verification", icon: "welcome" },
  { key: "tickets", label: "Tickets", description: "Panels, staff roles and transcripts", icon: "tickets" },
  { key: "leveling", label: "Leveling", description: "XP, level roles and announcements", icon: "leveling" },
  { key: "economy", label: "Economy", description: "Currency, rewards and shop", icon: "economy" },
  { key: "starboard", label: "Starboard", description: "Highlight starred messages", icon: "starboard" },
  { key: "suggestions", label: "Suggestions", description: "Community suggestions with staff review", icon: "suggestions" },
  { key: "branding", label: "Branding", description: "Embed colours, footer and response style", icon: "settings" },
];

export function withDefaults(module: ModuleKey, settings: Record<string, unknown> | null | undefined) {
  return deepMerge(DEFAULTS[module], settings ?? {});
}

export function deepMerge<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const out: Record<string, unknown> = Array.isArray(base) ? [...(base as unknown[])] as unknown as T : { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const current = out[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      out[key] = deepMerge(current as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

export const SETUP_PRESETS = {
  basic: { label: "Basic", description: "Light moderation, logging on, security relaxed" },
  balanced: { label: "Balanced", description: "Recommended defaults for most communities" },
  strict: { label: "Strict", description: "Aggressive AutoMod and fast escalation" },
  maximum: { label: "Maximum Security", description: "Lockdown-first anti-nuke and anti-raid" },
} as const;

export type PresetKey = keyof typeof SETUP_PRESETS;
