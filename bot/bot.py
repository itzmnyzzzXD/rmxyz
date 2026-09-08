"""
RM — Discord bot core.

Run on your VPS:
    python3 -m pip install -r requirements.txt
    cp .env.example .env      # then paste your bot token
    python3 bot.py

The bot talks to the dashboard through one HTTPS endpoint
(/api/public/bot/sync) using the shared BOT_SYNC_KEY, so no database
credentials ever live on the VPS.
"""

from __future__ import annotations

import asyncio
import os
import random
import time
from datetime import datetime, timedelta, timezone

import aiohttp
import discord
from discord.ext import commands, tasks
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# >>> PASTE YOUR BOT TOKEN IN bot/.env AS DISCORD_BOT_TOKEN <<<
TOKEN = os.getenv("DISCORD_BOT_TOKEN", "PUT_YOUR_BOT_TOKEN_HERE")

DASHBOARD_URL = os.getenv(
    "DASHBOARD_URL",
    "https://project--f2a55353-ce5e-4311-a120-e3848520a0d8.lovable.app",
).rstrip("/")
SYNC_KEY = os.getenv("BOT_SYNC_KEY", "")
SYNC_URL = f"{DASHBOARD_URL}/api/public/bot/sync"

DEFAULT_PREFIXES = [
    p.strip() for p in os.getenv("BOT_PREFIXES", "rm!,rm?").split(",") if p.strip()
]
OWNER_IDS = {int(x) for x in os.getenv("BOT_OWNER_IDS", "").replace(" ", "").split(",") if x.isdigit()}

VERSION = "1.0.0"
BRAND = 0xEF4444
STARTED_AT = datetime.now(timezone.utc)

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.guilds = True


def prefix_for(bot: "RM", message: discord.Message):
    prefixes = list(DEFAULT_PREFIXES)
    if message.guild:
        prefixes = bot.prefix_cache.get(str(message.guild.id), prefixes)
    return commands.when_mentioned_or(*prefixes)(bot, message)


class RM(commands.Bot):
    def __init__(self) -> None:
        super().__init__(
            command_prefix=prefix_for,
            intents=intents,
            help_command=None,
            case_insensitive=True,
        )
        self.session: aiohttp.ClientSession | None = None
        self.prefix_cache: dict[str, list[str]] = {}
        self.config_cache: dict[str, dict] = {}
        self.commands_processed = 0

    # -- dashboard bridge ---------------------------------------------------
    async def sync(self, action: str, data: dict | None = None) -> dict | None:
        if not SYNC_KEY or self.session is None:
            return None
        try:
            async with self.session.post(
                SYNC_URL,
                json={"action": action, "data": data or {}},
                headers={"x-bot-key": SYNC_KEY},
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                if resp.status != 200:
                    print(f"[sync:{action}] HTTP {resp.status}: {await resp.text()}")
                    return None
                return await resp.json()
        except Exception as exc:  # network hiccups must never kill the bot
            print(f"[sync:{action}] failed: {exc}")
            return None

    async def guild_config(self, guild_id: int) -> dict:
        key = str(guild_id)
        cached = self.config_cache.get(key)
        if cached and cached["_at"] > time.time() - 60:
            return cached
        result = await self.sync("config", {"guild_id": key})
        config: dict = {"_at": time.time()}
        for row in (result or {}).get("config", []):
            config[row["module"]] = {"enabled": row["enabled"], **(row["settings"] or {})}
        core = config.get("core") or {}
        prefixes = core.get("prefixes") or DEFAULT_PREFIXES
        self.prefix_cache[key] = list(prefixes)
        self.config_cache[key] = config
        return config

    async def log_case(self, ctx: commands.Context, action: str, target: discord.abc.User,
                       reason: str | None, duration: int | None = None) -> int | None:
        result = await self.sync(
            "case",
            {
                "guild_id": str(ctx.guild.id),
                "action_type": action,
                "target_id": str(target.id),
                "target_tag": str(target),
                "moderator_id": str(ctx.author.id),
                "moderator_tag": str(ctx.author),
                "reason": reason,
                "duration_seconds": duration,
            },
        )
        return (result or {}).get("case_number")

    # -- lifecycle ----------------------------------------------------------
    async def setup_hook(self) -> None:
        self.session = aiohttp.ClientSession()
        self.heartbeat.start()

    async def close(self) -> None:
        try:
            await self.sync("heartbeat", {"status": "offline", "guild_count": len(self.guilds)})
        finally:
            if self.session:
                await self.session.close()
            await super().close()

    @tasks.loop(seconds=60)
    async def heartbeat(self) -> None:
        await self.wait_until_ready()
        memory = None
        try:
            import psutil

            memory = round(psutil.Process().memory_info().rss / 1024 / 1024, 1)
        except Exception:
            pass
        await self.sync(
            "heartbeat",
            {
                "status": "online",
                "latency_ms": int(self.latency * 1000) if self.latency else None,
                "guild_count": len(self.guilds),
                "user_count": sum(g.member_count or 0 for g in self.guilds),
                "commands_processed": self.commands_processed,
                "memory_mb": memory,
                "started_at": STARTED_AT.isoformat(),
                "version": VERSION,
            },
        )
        await self.sync(
            "guilds",
            {
                "guilds": [
                    {
                        "id": str(g.id),
                        "name": g.name,
                        "icon": g.icon.key if g.icon else None,
                        "owner_id": str(g.owner_id) if g.owner_id else None,
                        "member_count": g.member_count or 0,
                        "channel_count": len(g.channels),
                        "role_count": len(g.roles),
                    }
                    for g in self.guilds
                ]
            },
        )


bot = RM()


def embed(title: str, description: str = "", color: int = BRAND) -> discord.Embed:
    e = discord.Embed(title=title, description=description, color=color)
    e.set_footer(text="RM")
    return e


def parse_duration(text: str | None) -> int | None:
    """'10m', '2h', '7d', '30s' -> seconds."""
    if not text:
        return None
    units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
    unit = text[-1].lower()
    if unit not in units or not text[:-1].isdigit():
        return None
    return int(text[:-1]) * units[unit]


@bot.event
async def on_ready() -> None:
    print(f"RM online as {bot.user} — {len(bot.guilds)} guild(s)")
    await bot.change_presence(
        activity=discord.Activity(type=discord.ActivityType.watching, name="rm!help")
    )
    for guild in bot.guilds:
        await bot.guild_config(guild.id)


@bot.event
async def on_guild_join(guild: discord.Guild) -> None:
    await bot.guild_config(guild.id)


@bot.event
async def on_command_completion(ctx: commands.Context) -> None:
    bot.commands_processed += 1
    await bot.sync(
        "command",
        {
            "guild_id": str(ctx.guild.id) if ctx.guild else None,
            "command": ctx.command.qualified_name if ctx.command else "unknown",
            "user_id": str(ctx.author.id),
            "success": True,
        },
    )


@bot.event
async def on_command_error(ctx: commands.Context, error: Exception) -> None:
    if isinstance(error, commands.CommandNotFound):
        return
    if isinstance(error, commands.MissingPermissions):
        await ctx.send(embed=embed("Missing permissions", "You can't use that command."))
        return
    if isinstance(error, commands.CommandOnCooldown):
        await ctx.send(embed=embed("Slow down", f"Try again in {error.retry_after:.1f}s."))
        return
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.send(embed=embed("Usage", f"`{ctx.prefix}{ctx.command} {ctx.command.signature}`"))
        return
    print(f"[error] {ctx.command}: {error}")
    await ctx.send(embed=embed("Something went wrong", str(error)))


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

@bot.command(name="help")
async def help_cmd(ctx: commands.Context) -> None:
    e = embed("RM commands", f"Prefixes: `{'`, `'.join(DEFAULT_PREFIXES)}` or mention me.")
    e.add_field(
        name="Moderation",
        value="`warn` `warnings` `kick` `ban` `unban` `timeout` `untimeout` `purge` `slowmode` `lock` `unlock` `nick`",
        inline=False,
    )
    e.add_field(name="Utility", value="`ping` `botinfo` `serverinfo` `userinfo` `avatar` `membercount` `prefix`", inline=False)
    e.add_field(name="Fun", value="`8ball` `roll` `coinflip` `choose` `say`", inline=False)
    e.add_field(name="Dashboard", value=DASHBOARD_URL, inline=False)
    await ctx.send(embed=e)


@bot.command()
async def ping(ctx: commands.Context) -> None:
    await ctx.send(embed=embed("Pong", f"Gateway latency: **{int(bot.latency * 1000)}ms**"))


@bot.command()
async def botinfo(ctx: commands.Context) -> None:
    uptime = datetime.now(timezone.utc) - STARTED_AT
    e = embed("RM", f"Version `{VERSION}`")
    e.add_field(name="Servers", value=str(len(bot.guilds)))
    e.add_field(name="Users", value=str(sum(g.member_count or 0 for g in bot.guilds)))
    e.add_field(name="Uptime", value=str(uptime).split(".")[0])
    e.add_field(name="Commands run", value=str(bot.commands_processed))
    e.add_field(name="Dashboard", value=DASHBOARD_URL, inline=False)
    await ctx.send(embed=e)


@bot.command()
@commands.guild_only()
async def serverinfo(ctx: commands.Context) -> None:
    g = ctx.guild
    e = embed(g.name, f"ID `{g.id}`")
    e.add_field(name="Members", value=str(g.member_count))
    e.add_field(name="Channels", value=str(len(g.channels)))
    e.add_field(name="Roles", value=str(len(g.roles)))
    e.add_field(name="Created", value=discord.utils.format_dt(g.created_at, "D"))
    if g.icon:
        e.set_thumbnail(url=g.icon.url)
    await ctx.send(embed=e)


@bot.command()
@commands.guild_only()
async def userinfo(ctx: commands.Context, member: discord.Member | None = None) -> None:
    member = member or ctx.author
    e = embed(str(member), f"ID `{member.id}`")
    e.add_field(name="Joined", value=discord.utils.format_dt(member.joined_at, "D") if member.joined_at else "—")
    e.add_field(name="Created", value=discord.utils.format_dt(member.created_at, "D"))
    e.add_field(name="Top role", value=member.top_role.mention)
    e.set_thumbnail(url=member.display_avatar.url)
    await ctx.send(embed=e)


@bot.command()
async def avatar(ctx: commands.Context, member: discord.Member | None = None) -> None:
    member = member or ctx.author
    e = embed(f"{member}'s avatar")
    e.set_image(url=member.display_avatar.url)
    await ctx.send(embed=e)


@bot.command()
@commands.guild_only()
async def membercount(ctx: commands.Context) -> None:
    await ctx.send(embed=embed("Members", f"**{ctx.guild.member_count}** members"))


@bot.command()
@commands.guild_only()
async def prefix(ctx: commands.Context) -> None:
    prefixes = bot.prefix_cache.get(str(ctx.guild.id), DEFAULT_PREFIXES)
    await ctx.send(
        embed=embed("Prefixes", "`" + "`, `".join(prefixes) + "`\nChange them on the dashboard.")
    )


# ---------------------------------------------------------------------------
# Moderation
# ---------------------------------------------------------------------------

@bot.command()
@commands.guild_only()
@commands.has_permissions(moderate_members=True)
async def warn(ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided") -> None:
    case = await bot.log_case(ctx, "warn", member, reason)
    await ctx.send(embed=embed("Member warned", f"{member.mention} — {reason}" + (f"\nCase #{case}" if case else "")))
    try:
        await member.send(embed=embed(f"Warned in {ctx.guild.name}", reason))
    except discord.Forbidden:
        pass


@bot.command()
@commands.guild_only()
@commands.has_permissions(kick_members=True)
async def kick(ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided") -> None:
    await member.kick(reason=f"{ctx.author}: {reason}")
    case = await bot.log_case(ctx, "kick", member, reason)
    await ctx.send(embed=embed("Member kicked", f"{member} — {reason}" + (f"\nCase #{case}" if case else "")))


@bot.command()
@commands.guild_only()
@commands.has_permissions(ban_members=True)
async def ban(ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided") -> None:
    await member.ban(reason=f"{ctx.author}: {reason}", delete_message_days=1)
    case = await bot.log_case(ctx, "ban", member, reason)
    await ctx.send(embed=embed("Member banned", f"{member} — {reason}" + (f"\nCase #{case}" if case else "")))


@bot.command()
@commands.guild_only()
@commands.has_permissions(ban_members=True)
async def unban(ctx: commands.Context, user_id: int, *, reason: str = "No reason provided") -> None:
    user = await bot.fetch_user(user_id)
    await ctx.guild.unban(user, reason=f"{ctx.author}: {reason}")
    await bot.log_case(ctx, "unban", user, reason)
    await ctx.send(embed=embed("User unbanned", str(user)))


@bot.command()
@commands.guild_only()
@commands.has_permissions(moderate_members=True)
async def timeout(ctx: commands.Context, member: discord.Member, duration: str = "10m", *, reason: str = "No reason provided") -> None:
    seconds = parse_duration(duration)
    if not seconds:
        await ctx.send(embed=embed("Bad duration", "Use formats like `30s`, `10m`, `2h`, `7d`."))
        return
    await member.timeout(timedelta(seconds=seconds), reason=f"{ctx.author}: {reason}")
    case = await bot.log_case(ctx, "timeout", member, reason, seconds)
    await ctx.send(embed=embed("Member timed out", f"{member.mention} for {duration} — {reason}" + (f"\nCase #{case}" if case else "")))


@bot.command()
@commands.guild_only()
@commands.has_permissions(moderate_members=True)
async def untimeout(ctx: commands.Context, member: discord.Member) -> None:
    await member.timeout(None)
    await bot.log_case(ctx, "untimeout", member, None)
    await ctx.send(embed=embed("Timeout removed", member.mention))


@bot.command(aliases=["clear"])
@commands.guild_only()
@commands.has_permissions(manage_messages=True)
async def purge(ctx: commands.Context, amount: int = 10) -> None:
    amount = max(1, min(amount, 200))
    deleted = await ctx.channel.purge(limit=amount + 1)
    await ctx.send(embed=embed("Purged", f"Deleted **{len(deleted) - 1}** messages."), delete_after=5)


@bot.command()
@commands.guild_only()
@commands.has_permissions(manage_channels=True)
async def slowmode(ctx: commands.Context, seconds: int = 0) -> None:
    await ctx.channel.edit(slowmode_delay=max(0, min(seconds, 21600)))
    await ctx.send(embed=embed("Slowmode updated", f"{seconds}s"))


@bot.command()
@commands.guild_only()
@commands.has_permissions(manage_channels=True)
async def lock(ctx: commands.Context) -> None:
    await ctx.channel.set_permissions(ctx.guild.default_role, send_messages=False)
    await ctx.send(embed=embed("Channel locked"))


@bot.command()
@commands.guild_only()
@commands.has_permissions(manage_channels=True)
async def unlock(ctx: commands.Context) -> None:
    await ctx.channel.set_permissions(ctx.guild.default_role, send_messages=None)
    await ctx.send(embed=embed("Channel unlocked"))


@bot.command()
@commands.guild_only()
@commands.has_permissions(manage_nicknames=True)
async def nick(ctx: commands.Context, member: discord.Member, *, nickname: str) -> None:
    await member.edit(nick=nickname)
    await ctx.send(embed=embed("Nickname updated", f"{member.mention} → {nickname}"))


# ---------------------------------------------------------------------------
# Fun
# ---------------------------------------------------------------------------

@bot.command(name="8ball")
async def eight_ball(ctx: commands.Context, *, question: str) -> None:
    answers = ["Yes.", "No.", "Definitely.", "Ask again later.", "Doubtful.", "Absolutely."]
    await ctx.send(embed=embed("Magic 8 ball", f"**Q:** {question}\n**A:** {random.choice(answers)}"))


@bot.command()
async def roll(ctx: commands.Context, dice: str = "1d6") -> None:
    try:
        count, sides = (int(x) for x in dice.lower().split("d"))
        count, sides = max(1, min(count, 20)), max(2, min(sides, 1000))
    except Exception:
        await ctx.send(embed=embed("Bad dice", "Try `roll 2d20`."))
        return
    rolls = [random.randint(1, sides) for _ in range(count)]
    await ctx.send(embed=embed(f"Rolled {dice}", f"{rolls} = **{sum(rolls)}**"))


@bot.command()
async def coinflip(ctx: commands.Context) -> None:
    await ctx.send(embed=embed("Coin flip", random.choice(["Heads", "Tails"])))


@bot.command()
async def choose(ctx: commands.Context, *, options: str) -> None:
    picks = [o.strip() for o in options.split("|") if o.strip()]
    if len(picks) < 2:
        await ctx.send(embed=embed("Need options", "Separate options with `|`."))
        return
    await ctx.send(embed=embed("I choose", random.choice(picks)))


@bot.command()
@commands.has_permissions(manage_messages=True)
async def say(ctx: commands.Context, *, text: str) -> None:
    await ctx.message.delete()
    await ctx.send(text)


def main() -> None:
    if not TOKEN or TOKEN == "PUT_YOUR_BOT_TOKEN_HERE":
        raise SystemExit("Set DISCORD_BOT_TOKEN in bot/.env before starting RM.")
    bot.run(TOKEN)


if __name__ == "__main__":
    main()
