"""RM VPS bootstrap + verified-account onboarding.

The pinned RM core owns the general command catalog. This wrapper adds the
verified-account onboarding flow and provides a safer startup path for the
core so a pre-registered command cannot crash cog loading.
"""

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

# Load the stable RM core without executing its __main__ block.
code = urllib.request.urlopen(PINNED_BOT_URL, timeout=20).read()
core_globals = globals().copy()
core_globals["__name__"] = "rm_bot_core"
exec(compile(code, "rm_bot_core.py", "exec"), core_globals, core_globals)

bot = core_globals["bot"]
core_setup_hook = bot.setup_hook
core_classes = {
    name: core_globals[name]
    for name in (
        "Moderation", "Security", "Info", "Tools", "Fun", "Economy",
        "Tickets", "Owner", "Interactions", "Generators", "Links"
    )
    if name in core_globals
}

import discord
from discord.ext import commands


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
        raise RuntimeError(f"dashboard returned {response.status}: {body}")
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


class VerifyStartView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=300)

    @discord.ui.button(label="Start RM Verification", style=discord.ButtonStyle.danger)
    async def start(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.guild is None:
            return await interaction.response.send_message(
                "Run `rm!verify` inside the server you want to manage.", ephemeral=True
            )
        member = interaction.user
        if not isinstance(member, discord.Member) or not _managed(member, interaction.guild):
            return await interaction.response.send_message(
                "You need Administrator or Manage Server to verify this server.", ephemeral=True
            )
        await interaction.response.send_modal(VerifyEmailModal())


async def send_verify_flow(ctx: commands.Context):
    if ctx.guild is None:
        return await ctx.reply(
            "Run `rm!verify` inside the server you want to manage.",
            mention_author=False,
        )
    member = ctx.author
    if not isinstance(member, discord.Member) or not _managed(member, ctx.guild):
        return await ctx.reply(
            "You need Administrator or Manage Server to verify this server.",
            mention_author=False,
        )

    await ctx.reply(
        embed=discord.Embed(
            title="RM Verification",
            description=(
                "Your Discord permissions are valid. Click the button below and enter "
                "your email. RM will then give you the secure dashboard signup link."
            ),
            color=0xEF4444,
        ),
        view=VerifyStartView(),
        mention_author=False,
    )


@bot.command(name="verify", aliases=["verifyaccount"])
async def prefix_verify(ctx: commands.Context):
    """Start RM verification with rm!verify or rm?verify."""
    await send_verify_flow(ctx)


@bot.tree.command(name="verify", description="Create your secure RM Dashboard account")
async def verify(interaction: discord.Interaction):
    if interaction.guild is None:
        return await interaction.response.send_message(
            "Run `/verify` inside the server you want to manage.", ephemeral=True
        )
    member = interaction.user
    if not isinstance(member, discord.Member) or not _managed(member, interaction.guild):
        return await interaction.response.send_message(
            "You need Administrator or Manage Server to verify this server.", ephemeral=True
        )
    await interaction.response.send_modal(VerifyEmailModal())


async def safe_core_main():
    """Start the pinned core while allowing duplicate command names to be replaced."""
    token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
    if not token or token == "PUT_YOUR_BOT_TOKEN_HERE":
        raise SystemExit("Set DISCORD_BOT_TOKEN in the VPS environment before starting RM.")

    bot.setup_hook = core_setup_hook

    async with bot:
        for name in (
            "Moderation", "Security", "Info", "Tools", "Fun", "Economy",
            "Tickets", "Owner", "Interactions", "Generators", "Links"
        ):
            cls = core_classes.get(name)
            if cls is None:
                continue
            await bot.add_cog(cls(), override=True)
        await bot.start(token)


if __name__ == "__main__":
    try:
        asyncio.run(safe_core_main())
    except KeyboardInterrupt:
        print("shutting down")
