"""RM VPS bootstrap + verified-account onboarding command."""

from __future__ import annotations

import asyncio
import os
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

# Import the stable RM core without triggering its __main__ block. This lets us
# add the new slash command before the core starts and syncs Discord commands.
code = urllib.request.urlopen(PINNED_BOT_URL, timeout=20).read()
core_globals = globals().copy()
core_globals["__name__"] = "rm_bot_core"
exec(compile(code, "rm_bot_core.py", "exec"), core_globals, core_globals)

bot = core_globals["bot"]
main = core_globals["main"]

import discord
from discord import app_commands


@bot.tree.command(name="verify", description="Create your secure RM Dashboard account")
async def verify(interaction: discord.Interaction):
    if interaction.guild is None:
        return await interaction.response.send_message(
            "Run /verify inside the server you want to manage.", ephemeral=True
        )
    member = interaction.user
    if not isinstance(member, discord.Member) or not (
        member.guild_permissions.administrator
        or member.guild_permissions.manage_guild
        or member.id == interaction.guild.owner_id
    ):
        return await interaction.response.send_message(
            "You need Administrator or Manage Server to verify this server.", ephemeral=True
        )

    session = bot.session
    if session is None:
        return await interaction.response.send_message("RM is still starting up. Try again in a moment.", ephemeral=True)

    try:
        async with session.post(
            f"{DASHBOARD_URL}/api/public/verify/start",
            json={
                "discord_id": str(member.id),
                "discord_username": str(member),
                "guild_id": str(interaction.guild.id),
            },
            headers={"x-bot-key": sync_key, "content-type": "application/json"},
            timeout=15,
        ) as response:
            body = await response.json(content_type=None)
        if response.status != 200 or not body.get("url"):
            raise RuntimeError(f"dashboard returned {response.status}")

        view = discord.ui.View(timeout=300)
        view.add_item(discord.ui.Button(label="Open RM Verification", url=body["url"], style=discord.ButtonStyle.link))
        await interaction.response.send_message(
            embed=discord.Embed(
                title="RM Verification",
                description=(
                    "Your Discord permissions have been checked.\n\n"
                    "Open the verification page, choose your email, password, username and profile picture, "
                    "then verify the email we send you."
                ),
                color=0xEF4444,
            ),
            view=view,
            ephemeral=True,
        )
    except Exception as exc:
        print(f"[verify] failed: {exc}")
        await interaction.response.send_message(
            "I couldn't create your verification link right now. Check that the dashboard is online and the sync key matches.",
            ephemeral=True,
        )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("shutting down")
