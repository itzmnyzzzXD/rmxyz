"""
RM — Discord bot core.

Run on your VPS:
    python3 -m pip install -r requirements.txt
    cp .env.example .env      # then paste your bot token + dashboard URL + sync key
    python3 bot.py

The bot talks to the dashboard through one HTTPS endpoint
(/api/public/bot/sync) using the shared BOT_SYNC_KEY, so no database
credentials ever live on the VPS.
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import io
import math
import os
import platform
import random
import re
import string
import time
import unicodedata
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

import aiohttp
import discord
from discord.ext import commands, tasks
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")
DASHBOARD_URL = os.getenv("DASHBOARD_URL", "").strip().rstrip("/")
SYNC_KEY = os.getenv("BOT_SYNC_KEY", "").strip()

# Never silently point a production bot at the old Lovable preview.
if not DASHBOARD_URL:
    print("[dashboard] ERROR: DASHBOARD_URL is missing from bot/.env")
    print("[dashboard] Set it to your deployed Vercel URL, e.g. https://rmxyz.vercel.app")
    SYNC_URL = ""
else:
    SYNC_URL = f"{DASHBOARD_URL}/api/public/bot/sync"

if not SYNC_KEY:
    print("[dashboard] WARNING: BOT_SYNC_KEY is missing; dashboard sync is disabled")
else:
    print(f"[dashboard] Sync target: {SYNC_URL}")

DEFAULT_PREFIXES = [
    p.strip() for p in os.getenv("BOT_PREFIXES", "rm!,rm?").split(",") if p.strip()
]
OWNER_IDS = {
    int(x)
    for x in os.getenv("BOT_OWNER_IDS", "").replace(" ", "").split(",")
    if x.isdigit()
}

VERSION = "2.0.0"
BRAND = 0xEF4444
OK = 0x22C55E
BAD = 0xEF4444
STARTED_AT = datetime.now(timezone.utc)

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.guilds = True

INVITE_RE = re.compile(r"(discord\.(gg|io|me|li)|discord(app)?\.com/invite)/\S+", re.I)
LINK_RE = re.compile(r"https?://\S+", re.I)
EMOJI_RE = re.compile(r"<a?:\w+:\d+>|[\U0001F300-\U0001FAFF\u2600-\u27BF]")
ZALGO_RE = re.compile(r"[\u0300-\u036f\u0489]")
SCAM_HINTS = (
    "free-nitro",
    "freenitro",
    "steamcommunity.ru",
    "discordgift",
    "discord-gift",
    "nitro-drop",
    "gift-nitro",
    "airdrop-claim",
)
IP_GRABBER_HINTS = ("grabify.link", "iplogger.", "2no.co", "yip.su", "blasze.")

LEET = str.maketrans({"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "$": "s", "@": "a"})


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = ZALGO_RE.sub("", text)
    text = text.lower().translate(LEET)
    return re.sub(r"(.)\1{2,}", r"\1\1", text)


def parse_duration(raw: str | None) -> int | None:
    """`10m`, `2h30m`, `7d` -> seconds."""
    if not raw:
        return None
    total = 0
    found = False
    for value, unit in re.findall(r"(\d+)\s*([smhdw])", raw.lower()):
        found = True
        total += int(value) * {"s": 1, "m": 60, "h": 3600, "d": 86400, "w": 604800}[unit]
    return total if found else None


def human_delta(seconds: int) -> str:
    seconds = int(seconds)
    parts = []
    for label, size in (("d", 86400), ("h", 3600), ("m", 60), ("s", 1)):
        if seconds >= size:
            parts.append(f"{seconds // size}{label}")
            seconds %= size
    return " ".join(parts[:3]) or "0s"


def prefix_for(bot: "RM", message: discord.Message):
    prefixes = list(DEFAULT_PREFIXES)
    if message.guild:
        prefixes = bot.prefix_cache.get(str(message.guild.id), prefixes)
    return commands.when_mentioned_or(*prefixes)(bot, message)


# ---------------------------------------------------------------------------
# Bot
# ---------------------------------------------------------------------------


class RM(commands.Bot):
    def __init__(self) -> None:
        super().__init__(
            command_prefix=prefix_for,
            intents=intents,
            help_command=None,
            case_insensitive=True,
            allowed_mentions=discord.AllowedMentions(everyone=False, roles=False),
        )
        self.session: aiohttp.ClientSession | None = None
        self.prefix_cache: dict[str, list[str]] = {}
        self.config_cache: dict[str, dict] = {}
        self.filter_cache: dict[str, list[dict]] = {}
        self.commands_processed = 0
        self.msg_times: dict[tuple[int, int], deque] = defaultdict(lambda: deque(maxlen=25))
        self.msg_hashes: dict[tuple[int, int], deque] = defaultdict(lambda: deque(maxlen=8))
        self.join_times: dict[int, deque] = defaultdict(lambda: deque(maxlen=60))
        self.nuke_counters: dict[tuple[int, int, str], deque] = defaultdict(lambda: deque(maxlen=40))
        self.raid_mode: set[int] = set()
        self.afk: dict[int, str] = {}
        self.snipes: dict[int, tuple[str, str, str]] = {}
        self.starting = True

    async def setup_hook(self) -> None:
        self.session = aiohttp.ClientSession()
        self.heartbeat_loop.start()
        self.guild_loop.start()
        self.task_loop.start()

    # -- dashboard bridge ---------------------------------------------------
    async def sync(self, action: str, data: dict | None = None) -> dict | None:
        if not SYNC_KEY or not SYNC_URL or self.session is None:
            return None
        try:
            async with self.session.post(
                SYNC_URL,
                json={"action": action, "data": data or {}},
                headers={"x-bot-key": SYNC_KEY, "content-type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                body = await resp.text()
                if resp.status != 200:
                    print(f"[sync:{action}] HTTP {resp.status}: {body[:500]}")
                    return None
                try:
                    import json
                    return json.loads(body)
                except Exception:
                    print(f"[sync:{action}] dashboard returned non-JSON: {body[:500]}")
                    return None
        except aiohttp.InvalidURL:
            print(f"[sync:{action}] Invalid DASHBOARD_URL/SYNC_URL: {SYNC_URL}")
            return None
        except Exception as exc:
            print(f"[sync:{action}] failed: {exc}")
            return None

    async def guild_config(self, guild_id: int, force: bool = False) -> dict:
        key = str(guild_id)
        cached = self.config_cache.get(key)
