"""RM VPS bootstrap + verified-account onboarding command."""

from __future__ import annotations

import asyncio
import os
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
            return await interaction.response.send_message("Run /verify inside the server you want to manage.", ephemeral=True)
        member = interaction.user
        if not isinstance(member, discord.Member) or not (
            member.guild_permissions.administrator
            or member.guild_permissions.manage_guild
            or member.id == interaction.guild.owner_id
        ):
            return await interaction.response.send_message("You need Administrator or Manage Server to verify this server.", ephemeral=True)
        if bot.session is None:
            return await interaction.response.send_message("RM is still starting up. Try again in a moment.", ephemeral=True)

        email = str(self.email.value).strip().lower()
        if not __import__("re").fullmatch(r"\S+@\S+\.\S+", email):
            return await interaction.response.send_message("That doesn't look like a valid email address.", ephemeral=True)

        try:
            async with bot.session.post(
                f"{DASHBOARD_URL}/api/public/verify/start",
                json={"discord_id": str(member.id), "discord_username": str(member), "guild_id": str(interaction.guild.id)},
                headers={"x-bot-key": sync_key, "content-type": "application/json"},
                timeout=15,
            ) as response:
                body = await response.json(content_type=None)
            if response.status != 200 or not body.get("url"):
                raise RuntimeError(f"dashboard returned {response.status}")
            url = f"{body['url']}&email={urllib.parse.quote(email)}"
            view = discord.ui.View(timeout=300)
            view.add_item(discord.ui.Button(label="Finish RM signup", url=url, style=discord.ButtonStyle.link))
            await interaction.response.send_message(
                embed=discord.Embed(
                    title="Email saved",
                    description=(f"**{email}** will receive the verification email after you finish your RM profile setup.\n\n"
                                 "Open the button to choose your username, password and profile picture."),
                    color=0xEF4444,
                ),
                view=view,
                ephemeral=True,
            )
        except Exception as exc:
            print(f"[verify] failed: {exc}")
            await interaction.response.send_message("I couldn't create your verification link right now. Check the dashboard and sync key.", ephemeral=True)


@bot.tree.command(name="verify", description="Create your secure RM Dashboard account")
async def verify(interaction: discord.Interaction):
    if interaction.guild is None:
        return await interaction.response.send_message("Run /verify inside the server you want to manage.", ephemeral=True)
    member = interaction.user
    if not isinstance(member, discord.Member) or not (
        member.guild_permissions.administrator
        or member.guild_permissions.manage_guild
        or member.id == interaction.guild.owner_id
    ):
        return await interaction.response.send_message("You need Administrator or Manage Server to verify this server.", ephemeral=True)
    await interaction.response.send_modal(VerifyEmailModal())


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("shutting down")
