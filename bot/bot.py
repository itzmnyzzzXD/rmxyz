"""RM VPS bootstrap + verified-account onboarding commands."""

from __future__ import annotations

import asyncio
import os
import re
import urllib.parse
import urllib.request

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

DASHBOARD_URL = "https://rmxyz.vercel.app"
PINNED_BOT_URL = (
    "https://raw.githubusercontent.com/itzmnyzzzXD/rmxyz/"
    "50462518c1ee97db687e92562641a02413c402d1/bot/bot.py"
)

bot_token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
if not bot_token or bot_token == "PUT_YOUR_BOT_TOKEN_HERE":
    raise SystemExit("Set DISCORD_BOT_TOKEN in the VPS environment before starting RM.")

sync_key = os.environ.get("BOT_SYNC_KEY", "").strip()
if not sync_key or sync_key == "PUT_YOUR_SYNC_KEY_HERE":
    raise SystemExit("Set BOT_SYNC_KEY in the VPS environment before starting RM.")

os.environ["DASHBOARD_URL"] = DASHBOARD_URL
os.environ["BOT_SYNC_KEY"] = sync_key

code = urllib.request.urlopen(PINNED_BOT_URL, timeout=20).read()
core_globals = globals().copy()
core_globals["__name__"] = "rm_bot_core"
exec(compile(code, "rm_bot_core.py", "exec"), core_globals, core_globals)

bot = core_globals["bot"]
main = core_globals["main"]

import discord


def _managed(member: discord.Member, guild: discord.Guild) -> bool:
    return bool(
        member.id == guild.owner_id
        or member.guild_permissions.administrator
        or member.guild_permissions.manage_guild
    )


async def create_verify_link(member: discord.Member, guild: discord.Guild):
    if bot.session is None:
        raise RuntimeError("dashboard session unavailable")
    async with bot.session.post(
        f"{DASHBOARD_URL}/api/public/verify/start",
        json={
            "discord_id": str(member.id),
            "discord_username": str(member),
            "guild_id": str(guild.id),
        },
        headers={"x-bot-key": sync_key, "content-type": "application/json"},
        timeout=15,
    ) as response:
        body = await response.json(content_type=None)
    if response.status != 200 or not body.get("url"):
        raise RuntimeError(f"dashboard returned {response.status}")
    return str(body["url"])


class VerifyEmailModal(discord.ui.Modal, title="RM account verification"):
    email = discord.ui.TextInput(
        label="Email address",
        placeholder="you@example.com",
        required=True,
        min_length=5,
        max_length=254,
    )

    async def on_submit(self, interaction: discord.Interaction):
        if interaction.guild is None:
            return await interaction.response.send_message(
                "Run `rm!verify` inside the server you want to manage.", ephemeral=True
            )
        member = interaction.user
        if not isinstance(member, discord.Member) or not _managed(member, interaction.guild):
            return await interaction.response.send_message(
                "You need Administrator or Manage Server to verify this server.", ephemeral=True
            )
        email = str(self.email.value).strip().lower()
        if not re.fullmatch(r"\S+@\S+\.\S+", email):
            return await interaction.response.send_message(
                "That doesn't look like a valid email address.", ephemeral=True
            )
        try:
            url = await create_verify_link(member, interaction.guild)
            separator = "&" if "?" in url else "?"
            url = f"{url}{separator}email={urllib.parse.quote(email)}"
            view = discord.ui.View(timeout=300)
            view.add_item(
                discord.ui.Button(
                    label="Finish RM signup",
                    url=url,
                    style=discord.ButtonStyle.link,
                )
            )
            await interaction.response.send_message(
                embed=discord.Embed(
                    title="Email saved",
                    description=(
                        f"**{email}** is attached to your RM verification.\n\n"
                        "Open the button to choose your username, password and profile picture. "
                        "RM will send the verification email when you submit it."
                    ),
                    color=0xEF4444,
                ),
                view=view,
                ephemeral=True,
            )
        except Exception as exc:
            print(f"[verify] failed: {exc}")
            await interaction.response.send_message(
                "I couldn't create your verification link right now. Check the dashboard and sync key.",
                ephemeral=True,
            )


async def send_verify_flow(ctx_or_interaction):
    guild = ctx_or_interaction.guild
    member = ctx_or_interaction.author if hasattr(ctx_or_interaction, "author") else ctx_or_interaction.user
    if guild is None:
        target = ctx_or_interaction
        if isinstance(target, discord.Interaction):
            return await target.response.send_message(
                "Run `rm!verify` inside the server you want to manage.", ephemeral=True
            )
        return await target.send("Run `rm!verify` inside the server you want to manage.")
    if not isinstance(member, discord.Member) or not _managed(member, guild):
        msg = "You need Administrator or Manage Server to verify this server."
        if isinstance(ctx_or_interaction, discord.Interaction):
            return await ctx_or_interaction.response.send_message(msg, ephemeral=True)
        return await ctx_or_interaction.send(msg)

    if isinstance(ctx_or_interaction, discord.Interaction):
        return await ctx_or_interaction.response.send_modal(VerifyEmailModal())

    try:
        url = await create_verify_link(member, guild)
        view = discord.ui.View(timeout=300)
        view.add_item(discord.ui.Button(label="Open RM Verification", url=url, style=discord.ButtonStyle.link))
        await ctx_or_interaction.reply(
            embed=discord.Embed(
                title="RM Verification",
                description=(
                    "Your Discord permissions are valid. Click below, enter your email, "
                    "then finish your RM account setup."
                ),
                color=0xEF4444,
            ),
            view=view,
            mention_author=False,
        )
    except Exception as exc:
        print(f"[verify] failed: {exc}")
        await ctx_or_interaction.reply(
            "I couldn't create your verification link right now. Check the dashboard and sync key.",
            mention_author=False,
        )


@bot.command(name="verify", aliases=["verifyaccount"])
async def prefix_verify(ctx: commands.Context):
    await send_verify_flow(ctx)


@bot.tree.command(name="verify", description="Create your secure RM Dashboard account")
async def verify(interaction: discord.Interaction):
    await send_verify_flow(interaction)


# Extra useful shortcut commands. These intentionally use existing bot state and
# do not require new services or external APIs.

@bot.command(name="dashboard", aliases=["panel"])
async def dashboard(ctx: commands.Context):
    await ctx.reply(f"RM Dashboard: {DASHBOARD_URL}", mention_author=False)


@bot.command(name="serverinfo", aliases=["server"])
async def serverinfo(ctx: commands.Context):
    if ctx.guild is None:
        return await ctx.reply("Use this command inside a server.", mention_author=False)
    g = ctx.guild
    e = discord.Embed(title=g.name, color=0xEF4444)
    e.add_field(name="Members", value=str(g.member_count or 0))
    e.add_field(name="Channels", value=str(len(g.channels)))
    e.add_field(name="Roles", value=str(len(g.roles)))
    e.add_field(name="Owner", value=f"<@{g.owner_id}>" if g.owner_id else "Unknown")
    if g.icon:
        e.set_thumbnail(url=g.icon.url)
    await ctx.reply(embed=e, mention_author=False)


@bot.command(name="botinfo", aliases=["about"])
async def botinfo(ctx: commands.Context):
    version = core_globals.get("VERSION", "2.0.0")
    e = discord.Embed(
        title="RM",
        description="Security, moderation and server management.",
        color=0xEF4444,
    )
    e.add_field(name="Version", value=version)
    e.add_field(name="Servers", value=str(len(bot.guilds)))
    e.add_field(name="Latency", value=f"{round(bot.latency * 1000)}ms")
    e.add_field(name="Dashboard", value=DASHBOARD_URL, inline=False)
    await ctx.reply(embed=e, mention_author=False)


@bot.command(name="membercount", aliases=["members"])
async def membercount(ctx: commands.Context):
    if ctx.guild is None:
        return await ctx.reply("Use this command inside a server.", mention_author=False)
    await ctx.reply(f"**{ctx.guild.name}** has **{ctx.guild.member_count or 0:,}** members.", mention_author=False)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("shutting down")
