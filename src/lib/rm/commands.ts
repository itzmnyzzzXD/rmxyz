/**
 * Command catalog shared by the dashboard (permissions page, help preview) and
 * the Python bot (exported to bot/rm/catalog.json by `bun run sync:catalog`).
 */
export type CommandCategory =
  | "Moderation"
  | "Security"
  | "Anti-Nuke"
  | "Anti-Raid"
  | "AutoMod"
  | "Logging"
  | "Utility"
  | "Tickets"
  | "Roles"
  | "Welcome"
  | "Giveaways"
  | "Economy"
  | "Leveling"
  | "Fun"
  | "Configuration";

export type CommandDef = {
  name: string;
  category: CommandCategory;
  description: string;
  usage: string;
  permission: "everyone" | "moderator" | "admin" | "owner";
  cooldown: number;
  aliases?: string[];
  slash?: boolean;
};

export const COMMANDS: CommandDef[] = [
  // Moderation
  { name: "warn", category: "Moderation", description: "Warn a member and add a case", usage: "warn <user> [reason]", permission: "moderator", cooldown: 3, aliases: ["w"], slash: true },
  { name: "warnings", category: "Moderation", description: "List a member's warnings", usage: "warnings <user>", permission: "moderator", cooldown: 3, aliases: ["warns"], slash: true },
  { name: "unwarn", category: "Moderation", description: "Remove a single warning", usage: "unwarn <user> <warn id>", permission: "moderator", cooldown: 3 },
  { name: "clearwarns", category: "Moderation", description: "Clear all warnings for a member", usage: "clearwarns <user>", permission: "admin", cooldown: 5 },
  { name: "mute", category: "Moderation", description: "Mute a member", usage: "mute <user> [duration] [reason]", permission: "moderator", cooldown: 3, slash: true },
  { name: "unmute", category: "Moderation", description: "Unmute a member", usage: "unmute <user>", permission: "moderator", cooldown: 3 },
  { name: "timeout", category: "Moderation", description: "Apply a Discord timeout", usage: "timeout <user> <duration> [reason]", permission: "moderator", cooldown: 3, slash: true },
  { name: "untimeout", category: "Moderation", description: "Remove a timeout", usage: "untimeout <user>", permission: "moderator", cooldown: 3 },
  { name: "kick", category: "Moderation", description: "Kick a member", usage: "kick <user> [reason]", permission: "moderator", cooldown: 3, slash: true },
  { name: "ban", category: "Moderation", description: "Ban a member", usage: "ban <user> [duration] [reason]", permission: "moderator", cooldown: 3, aliases: ["b"], slash: true },
  { name: "unban", category: "Moderation", description: "Unban a user", usage: "unban <user id> [reason]", permission: "moderator", cooldown: 3 },
  { name: "softban", category: "Moderation", description: "Ban and immediately unban to purge messages", usage: "softban <user> [reason]", permission: "moderator", cooldown: 3 },
  { name: "purge", category: "Moderation", description: "Bulk delete messages", usage: "purge <amount> [user]", permission: "moderator", cooldown: 5, aliases: ["clear"], slash: true },
  { name: "slowmode", category: "Moderation", description: "Set channel slowmode", usage: "slowmode <seconds>", permission: "moderator", cooldown: 3 },
  { name: "lock", category: "Moderation", description: "Lock the current channel", usage: "lock [channel]", permission: "moderator", cooldown: 3 },
  { name: "unlock", category: "Moderation", description: "Unlock a channel", usage: "unlock [channel]", permission: "moderator", cooldown: 3 },
  { name: "nick", category: "Moderation", description: "Change a member's nickname", usage: "nick <user> <nickname>", permission: "moderator", cooldown: 3 },
  { name: "role", category: "Moderation", description: "Add a role to a member", usage: "role <user> <role>", permission: "moderator", cooldown: 3 },
  { name: "removerole", category: "Moderation", description: "Remove a role from a member", usage: "removerole <user> <role>", permission: "moderator", cooldown: 3 },
  { name: "dehoist", category: "Moderation", description: "Strip hoisting characters from nicknames", usage: "dehoist", permission: "admin", cooldown: 30 },
  { name: "reason", category: "Moderation", description: "Update the reason on a case", usage: "reason <case> <reason>", permission: "moderator", cooldown: 3 },
  { name: "history", category: "Moderation", description: "Show a member's full history", usage: "history <user>", permission: "moderator", cooldown: 5 },
  { name: "modlogs", category: "Moderation", description: "Recent moderation actions", usage: "modlogs [user]", permission: "moderator", cooldown: 5 },
  { name: "case", category: "Moderation", description: "View one case", usage: "case <number>", permission: "moderator", cooldown: 3 },
  { name: "cases", category: "Moderation", description: "Browse cases", usage: "cases [user]", permission: "moderator", cooldown: 5 },
  { name: "note", category: "Moderation", description: "Add a private staff note", usage: "note <user> <text>", permission: "moderator", cooldown: 3 },
  // Security
  { name: "lockdown", category: "Security", description: "Lock the entire server", usage: "lockdown [soft|full|raid|emergency]", permission: "admin", cooldown: 10, slash: true },
  { name: "unlockdown", category: "Security", description: "Lift an active lockdown", usage: "unlockdown", permission: "admin", cooldown: 10, slash: true },
  { name: "raidmode", category: "Anti-Raid", description: "Toggle raid mode", usage: "raidmode <on|off>", permission: "admin", cooldown: 10 },
  { name: "antinuke", category: "Anti-Nuke", description: "View or toggle anti-nuke", usage: "antinuke <on|off|status>", permission: "admin", cooldown: 5 },
  { name: "trust", category: "Anti-Nuke", description: "Add a trusted user or role", usage: "trust <user|role>", permission: "admin", cooldown: 5 },
  { name: "untrust", category: "Anti-Nuke", description: "Remove trust", usage: "untrust <user|role>", permission: "admin", cooldown: 5 },
  { name: "security", category: "Security", description: "Security status summary", usage: "security", permission: "moderator", cooldown: 10 },
  // AutoMod / filter
  { name: "automod", category: "AutoMod", description: "Toggle an AutoMod module", usage: "automod <module> <on|off>", permission: "admin", cooldown: 5 },
  { name: "filter", category: "AutoMod", description: "Manage the word filter", usage: "filter <add|remove|list> [word]", permission: "admin", cooldown: 5 },
  // Logging / config
  { name: "logs", category: "Logging", description: "Configure log channels", usage: "logs <category> <#channel>", permission: "admin", cooldown: 5 },
  { name: "prefix", category: "Configuration", description: "View or change prefixes", usage: "prefix [add|remove|reset] [value]", permission: "admin", cooldown: 5 },
  { name: "config", category: "Configuration", description: "Open the configuration summary", usage: "config", permission: "admin", cooldown: 5 },
  { name: "customcommand", category: "Configuration", description: "Create or edit a custom command", usage: "customcommand <add|remove|list>", permission: "admin", cooldown: 5, aliases: ["cc"] },
  { name: "autoresponder", category: "Configuration", description: "Manage auto responders", usage: "autoresponder <add|remove|list>", permission: "admin", cooldown: 5, aliases: ["ar"] },
  { name: "alias", category: "Configuration", description: "Manage command aliases", usage: "alias <command> <alias>", permission: "admin", cooldown: 5 },
  // Tickets / roles / welcome
  { name: "ticket", category: "Tickets", description: "Ticket controls", usage: "ticket <close|claim|add|remove|rename>", permission: "everyone", cooldown: 5, slash: true },
  { name: "ticketpanel", category: "Tickets", description: "Publish a ticket panel", usage: "ticketpanel <name>", permission: "admin", cooldown: 10 },
  { name: "rolepanel", category: "Roles", description: "Publish a role panel", usage: "rolepanel <name>", permission: "admin", cooldown: 10 },
  { name: "welcome", category: "Welcome", description: "Preview the welcome message", usage: "welcome test", permission: "admin", cooldown: 10 },
  // Giveaways
  { name: "giveaway", category: "Giveaways", description: "Start a giveaway", usage: "giveaway <duration> <winners> <prize>", permission: "moderator", cooldown: 10, slash: true },
  { name: "reroll", category: "Giveaways", description: "Reroll giveaway winners", usage: "reroll <message id>", permission: "moderator", cooldown: 10 },
  { name: "end", category: "Giveaways", description: "End a giveaway early", usage: "end <message id>", permission: "moderator", cooldown: 10 },
  // Leveling
  { name: "rank", category: "Leveling", description: "Show your rank card", usage: "rank [user]", permission: "everyone", cooldown: 10, slash: true },
  { name: "levels", category: "Leveling", description: "Show configured level roles", usage: "levels", permission: "everyone", cooldown: 10 },
  { name: "leaderboard", category: "Leveling", description: "Top members by XP", usage: "leaderboard", permission: "everyone", cooldown: 10, aliases: ["lb"] },
  // Economy
  { name: "balance", category: "Economy", description: "Check a balance", usage: "balance [user]", permission: "everyone", cooldown: 5, aliases: ["bal"], slash: true },
  { name: "daily", category: "Economy", description: "Claim the daily reward", usage: "daily", permission: "everyone", cooldown: 5 },
  { name: "weekly", category: "Economy", description: "Claim the weekly reward", usage: "weekly", permission: "everyone", cooldown: 5 },
  { name: "work", category: "Economy", description: "Work for currency", usage: "work", permission: "everyone", cooldown: 5 },
  { name: "shop", category: "Economy", description: "Browse the shop", usage: "shop", permission: "everyone", cooldown: 5 },
  { name: "buy", category: "Economy", description: "Buy a shop item", usage: "buy <item>", permission: "everyone", cooldown: 5 },
  // Fun
  { name: "8ball", category: "Fun", description: "Ask the magic 8 ball", usage: "8ball <question>", permission: "everyone", cooldown: 5 },
  { name: "choose", category: "Fun", description: "Pick between options", usage: "choose <a> | <b>", permission: "everyone", cooldown: 5 },
  { name: "roll", category: "Fun", description: "Roll dice", usage: "roll [NdN]", permission: "everyone", cooldown: 5 },
  { name: "coinflip", category: "Fun", description: "Flip a coin", usage: "coinflip", permission: "everyone", cooldown: 5 },
  { name: "ship", category: "Fun", description: "Ship two members", usage: "ship <user> <user>", permission: "everyone", cooldown: 5 },
  { name: "rate", category: "Fun", description: "Rate anything out of ten", usage: "rate <thing>", permission: "everyone", cooldown: 5 },
  { name: "say", category: "Fun", description: "Repeat a message", usage: "say <text>", permission: "moderator", cooldown: 5 },
  // Utility
  { name: "help", category: "Utility", description: "Interactive help menu", usage: "help [command]", permission: "everyone", cooldown: 3, slash: true },
  { name: "botinfo", category: "Utility", description: "RM status and uptime", usage: "botinfo", permission: "everyone", cooldown: 10 },
  { name: "serverinfo", category: "Utility", description: "Server information", usage: "serverinfo", permission: "everyone", cooldown: 10 },
  { name: "userinfo", category: "Utility", description: "User information", usage: "userinfo [user]", permission: "everyone", cooldown: 10, slash: true },
  { name: "roleinfo", category: "Utility", description: "Role information", usage: "roleinfo <role>", permission: "everyone", cooldown: 10 },
  { name: "channelinfo", category: "Utility", description: "Channel information", usage: "channelinfo [channel]", permission: "everyone", cooldown: 10 },
  { name: "avatar", category: "Utility", description: "Show a user's avatar", usage: "avatar [user]", permission: "everyone", cooldown: 5 },
  { name: "banner", category: "Utility", description: "Show a user's banner", usage: "banner [user]", permission: "everyone", cooldown: 5 },
  { name: "membercount", category: "Utility", description: "Member count", usage: "membercount", permission: "everyone", cooldown: 10 },
  { name: "permissions", category: "Utility", description: "Show a member's permissions", usage: "permissions [user]", permission: "moderator", cooldown: 10 },
  { name: "remind", category: "Utility", description: "Set a reminder", usage: "remind <duration> <text>", permission: "everyone", cooldown: 5 },
  { name: "afk", category: "Utility", description: "Set your AFK status", usage: "afk [reason]", permission: "everyone", cooldown: 10 },
  { name: "poll", category: "Utility", description: "Create a poll", usage: "poll <question> | <option> | <option>", permission: "moderator", cooldown: 10 },
  { name: "suggest", category: "Utility", description: "Submit a suggestion", usage: "suggest <text>", permission: "everyone", cooldown: 30 },
  { name: "embed", category: "Utility", description: "Send a built embed", usage: "embed <json>", permission: "admin", cooldown: 10 },
];

export const CATEGORIES = Array.from(new Set(COMMANDS.map((c) => c.category)));

export function commandsByCategory(category: CommandCategory) {
  return COMMANDS.filter((c) => c.category === category);
}
