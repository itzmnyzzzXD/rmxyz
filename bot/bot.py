"""
RM — Discord bot core.

Run on your VPS:
    python3 -m pip install -r requirements.txt
    cp .env.example .env      # then paste your bot token + sync key
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

TOKEN = os.getenv("DISCORD_BOT_TOKEN", "PUT_YOUR_BOT_TOKEN_HERE")
DASHBOARD_URL = os.getenv("DASHBOARD_URL", "https://rmxyz.lovable.app").rstrip("/")
SYNC_KEY = os.getenv("BOT_SYNC_KEY", "")
SYNC_URL = f"{DASHBOARD_URL}/api/public/bot/sync"
DEFAULT_PREFIXES = [p.strip() for p in os.getenv("BOT_PREFIXES", "rm!,rm?").split(",") if p.strip()]
OWNER_IDS = {int(x) for x in os.getenv("BOT_OWNER_IDS", "").replace(" ", "").split(",") if x.isdigit()}
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
SCAM_HINTS = ("free-nitro", "freenitro", "steamcommunity.ru", "discordgift", "discord-gift", "nitro-drop", "gift-nitro", "airdrop-claim")
IP_GRABBER_HINTS = ("grabify.link", "iplogger.", "2no.co", "yip.su", "blasze.")
LEET = str.maketrans({"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "$": "s", "@": "a"})

def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = ZALGO_RE.sub("", text)
    text = text.lower().translate(LEET)
    return re.sub(r"(.)\1{2,}", r"\1\1", text)

def parse_duration(raw: str | None) -> int | None:
    if not raw: return None
    total = 0; found = False
    for value, unit in re.findall(r"(\d+)\s*([smhdw])", raw.lower()):
        found = True; total += int(value) * {"s":1,"m":60,"h":3600,"d":86400,"w":604800}[unit]
    return total if found else None

def human_delta(seconds: int) -> str:
    seconds = int(seconds); parts=[]
    for label,size in (("d",86400),("h",3600),("m",60),("s",1)):
        if seconds >= size: parts.append(f"{seconds//size}{label}"); seconds %= size
    return " ".join(parts[:3]) or "0s"

def prefix_for(bot: "RM", message: discord.Message):
    prefixes = bot.prefix_cache.get(str(message.guild.id), DEFAULT_PREFIXES) if message.guild else DEFAULT_PREFIXES
    return commands.when_mentioned_or(*prefixes)(bot, message)

class RM(commands.Bot):
    def __init__(self):
        super().__init__(command_prefix=prefix_for, intents=intents, help_command=None, case_insensitive=True, allowed_mentions=discord.AllowedMentions(everyone=False, roles=False))
        self.session=None; self.prefix_cache={}; self.config_cache={}; self.filter_cache={}; self.commands_processed=0
        self.msg_times=defaultdict(lambda: deque(maxlen=25)); self.msg_hashes=defaultdict(lambda: deque(maxlen=8)); self.join_times=defaultdict(lambda: deque(maxlen=60)); self.nuke_counters=defaultdict(lambda: deque(maxlen=40)); self.raid_mode=set(); self.afk={}; self.snipes={}; self.starting=True
    async def setup_hook(self):
        self.session=aiohttp.ClientSession(); self.heartbeat_loop.start(); self.guild_loop.start(); self.task_loop.start()
    async def sync(self, action, data=None):
        if not SYNC_KEY or self.session is None: return None
        try:
            async with self.session.post(SYNC_URL, json={"action":action,"data":data or {}}, headers={"x-bot-key":SYNC_KEY}, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                body=await resp.text()
                if resp.status != 200:
                    print(f"[sync:{action}] HTTP {resp.status}: {body[:500]}"); return None
                try: return __import__("json").loads(body)
                except Exception: print(f"[sync:{action}] dashboard returned non-JSON: {body[:500]}"); return None
        except aiohttp.InvalidURL: print(f"[sync:{action}] Invalid DASHBOARD_URL/SYNC_URL: {SYNC_URL}")
        except Exception as exc: print(f"[sync:{action}] failed: {exc}")
        return None
    async def guild_config(self, guild_id, force=False):
        key=str(guild_id); cached=self.config_cache.get(key)
        if cached and not force and cached["_at"] > time.time()-60: return cached
        result=await self.sync("config", {"guild_id":key}); config={"_at":time.time()}
        for row in (result or {}).get("config",[]): config[row["module"]]={"enabled":row["enabled"],**(row["settings"] or {})}
        self.filter_cache[key]=(result or {}).get("words",[]) or []; core=config.get("core") or {}; self.prefix_cache[key]=list(core.get("prefixes") or DEFAULT_PREFIXES); self.config_cache[key]=config; return config
    def module(self,config,name): return config.get(name) or {}
    def enabled(self,config,name,default=True):
        mod=config.get(name); return default if mod is None else bool(mod.get("enabled",default))
    async def log_case(self,guild,action,target,moderator,reason,duration=None):
        result=await self.sync("case",{"guild_id":str(guild.id),"action_type":action,"target_id":str(target.id),"target_tag":str(target),"moderator_id":str(moderator.id),"moderator_tag":str(moderator),"reason":reason,"duration_seconds":duration,"source":"bot"}); return (result or {}).get("case_number")
    async def log_event(self,guild_id,category,event_type,summary,**extra): await self.sync("log",{"guild_id":str(guild_id),"category":category,"event_type":event_type,"summary":summary[:500],**extra})
    async def log_security(self,guild_id,system,event_type,severity,actor,action_taken): await self.sync("security",{"guild_id":str(guild_id),"system":system,"event_type":event_type,"severity":severity,"actor_id":str(actor.id) if actor else None,"actor_tag":str(actor) if actor else None,"action_taken":action_taken})
    @tasks.loop(seconds=45)
    async def heartbeat_loop(self):
        await self.wait_until_ready(); mem=cpu=None
        try:
            import psutil; proc=psutil.Process(); mem=round(proc.memory_info().rss/1048576,1); cpu=round(psutil.cpu_percent(interval=None),1)
        except Exception: pass
        await self.sync("heartbeat",{"shard_id":0,"status":"online","latency_ms":round(self.latency*1000) if self.latency else None,"guild_count":len(self.guilds),"user_count":sum(g.member_count or 0 for g in self.guilds),"commands_processed":self.commands_processed,"memory_mb":mem,"cpu_percent":cpu,"started_at":STARTED_AT.isoformat(),"version":VERSION})
    @tasks.loop(minutes=5)
    async def guild_loop(self):
        await self.wait_until_ready(); rows=[{"id":str(g.id),"name":g.name,"icon":g.icon.key if g.icon else None,"owner_id":str(g.owner_id) if g.owner_id else None,"member_count":g.member_count or 0,"channel_count":len(g.channels),"role_count":len(g.roles)} for g in self.guilds]
        if rows: await self.sync("guilds",{"guilds":rows})
    @tasks.loop(seconds=20)
    async def task_loop(self):
        await self.wait_until_ready(); result=await self.sync("tasks")
        for task in (result or {}).get("tasks",[]):
            err=None
            try: await self.run_task(task)
            except Exception as exc: err=str(exc)[:400]
            await self.sync("task_done",{"id":task["id"],"error":err})
    async def run_task(self,task):
        guild=self.get_guild(int(task["guild_id"])) if task.get("guild_id") else None; kind=task["task_type"]; payload=task.get("payload") or {}
        if kind=="reload_config" and guild: await self.guild_config(guild.id,force=True)
        elif kind=="raidmode_on" and guild: self.raid_mode.add(guild.id)
        elif kind=="raidmode_off" and guild: self.raid_mode.discard(guild.id)
        elif kind=="sync_slash": await self.tree.sync()

bot=RM()

def embed(description,title=None,color=BRAND): return discord.Embed(title=title,description=description,color=color)
def ok(description): return embed(f"✅ {description}",color=OK)
def err(description): return embed(f"❌ {description}",color=BAD)
def above(actor,target): return actor.guild.owner_id==actor.id or actor.top_role>target.top_role
async def is_trusted(guild,member): return member.id==guild.owner_id or member.id in OWNER_IDS or member.id==bot.user.id
async def set_lockdown(guild,on,reason):
    changed=0; everyone=guild.default_role
    for channel in guild.text_channels:
        try:
            overwrite=channel.overwrites_for(everyone); overwrite.send_messages=False if on else None; await channel.set_permissions(everyone,overwrite=overwrite,reason=reason); changed+=1
        except discord.HTTPException: continue
    await bot.log_security(guild.id,"lockdown","enabled" if on else "disabled","high",None,f"{changed} channels"); return changed
async def punish(guild,member,action,reason,seconds=None):
    try:
        if action=="ban": await guild.ban(member,reason=reason,delete_message_days=0)
        elif action=="kick": await guild.kick(member,reason=reason)
        elif action in ("timeout","mute"): await member.timeout(discord.utils.utcnow()+timedelta(seconds=seconds or 3600),reason=reason)
        elif action=="strip": await member.edit(roles=[r for r in member.roles if r.is_default() or r.managed],reason=reason)
    except (discord.Forbidden,discord.HTTPException): return False
    return True

@bot.event
async def on_ready():
    print(f"RM v{VERSION} online as {bot.user} in {len(bot.guilds)} guilds")
    await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.watching,name=f"{len(bot.guilds)} servers | rm!help"))
    if bot.starting:
        bot.starting=False
        await bot.sync("catalog",{"commands":[{"name":c.qualified_name,"description":c.help or "","category":c.cog_name or "General"} for c in bot.walk_commands()]})
        try: await bot.tree.sync()
        except Exception as exc: print(f"slash sync failed: {exc}")

@bot.event
async def on_message(message):
    if message.author.bot or message.guild is None: return await bot.process_commands(message)
    await bot.process_commands(message)

@bot.event
async def on_command_completion(ctx):
    bot.commands_processed+=1
    await bot.sync("command",{"guild_id":str(ctx.guild.id) if ctx.guild else None,"command":ctx.command.qualified_name,"user_id":str(ctx.author.id),"success":True})

@bot.event
async def on_command_error(ctx,error):
    if isinstance(error,commands.CommandNotFound): return
    print(f"[error] {ctx.command}: {error!r}")
    await bot.sync("error",{"guild_id":str(ctx.guild.id) if ctx.guild else None,"command":ctx.command.qualified_name if ctx.command else None,"message":repr(error)})

@bot.command()
async def ping(ctx): await ctx.send(embed=embed(f"🏓 {round(bot.latency*1000)}ms"))
@bot.command()
async def botinfo(ctx): await ctx.send(embed=embed(f"**Version** {VERSION}\n**Uptime** {human_delta((datetime.now(timezone.utc)-STARTED_AT).total_seconds())}\n**Servers** {len(bot.guilds)}"))
@bot.command()
@commands.has_permissions(administrator=True)
async def synctest(ctx):
    result=await bot.sync("heartbeat",{"shard_id":0,"status":"online","guild_count":len(bot.guilds),"version":VERSION})
    await ctx.send(embed=ok("Dashboard reachable and key accepted.") if result else err("Dashboard unreachable or BOT_SYNC_KEY mismatch."))

async def main():
    if not TOKEN or TOKEN=="PUT_YOUR_BOT_TOKEN_HERE": raise SystemExit("Set DISCORD_BOT_TOKEN in bot/.env before starting RM.")
    if not SYNC_KEY or SYNC_KEY=="PUT_YOUR_SYNC_KEY_HERE": print("WARNING: BOT_SYNC_KEY is not set — dashboard bridge disabled.")
    async with bot:
        await bot.start(TOKEN)
if __name__=="__main__":
    try: asyncio.run(main())
    except KeyboardInterrupt: print("shutting down")
