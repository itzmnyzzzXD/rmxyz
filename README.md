# RM Suite

Build a complete, production-ready Discord bot called **RM** with a premium web dashboard.

This should be a serious all-in-one Discord management bot inspired by the best parts of **Carl-bot, Titanium, Dyno, Wick, Sapphire, ProBot, MEE6, Ticket Tool, YAGPDB, and other major moderation/security bots**, while still having its own identity and UI.

Do NOT make this a simple frontend mockup. Build the actual application architecture, database structure, Discord bot integration, API routes, dashboard, settings system, permissions system, logging system, and configuration system so the project can realistically be connected to a Discord bot token and deployed.

## 1. BOT IDENTITY

Bot name:
**RM**

Default command prefixes:

* `rm!`
* `rm?`

Both prefixes must work automatically.

Example:
`rm!help`
`rm?help`

Allow server administrators to change the prefix from the dashboard.

Support:

* Custom prefix
* Multiple prefixes
* Prefix reset
* Mention prefix support such as `@RM help`
* Prefix shown in the server dashboard

The bot should also support modern Discord slash commands where practical.

Use a clean, premium identity. Avoid copying another bot's branding exactly.

---

# 2. DASHBOARD

Create a beautiful, modern Discord-style dashboard.

The dashboard should feel like a real premium SaaS control panel, not a generic admin template.

Use:

* Dark theme by default
* Modern cards
* Smooth animations
* Responsive design
* Desktop + tablet + mobile support
* Sidebar navigation
* Server switcher
* Search
* Toast notifications
* Confirmation dialogs
* Status indicators
* Live configuration updates
* Discord OAuth2 login
* Guild/server selection
* Permission-aware settings
* Save/apply buttons
* Reset buttons
* Audit history where useful

Dashboard sections:

### Overview

Show:

* Bot online/offline status
* Bot latency
* Server name
* Server icon
* Member count
* Channel count
* Role count
* Moderation statistics
* Warnings
* Mutes
* Kicks
* Bans
* AutoMod triggers
* Anti-raid events
* Anti-nuke events
* Recent logs
* Recent actions
* Security status
* Configuration summary

### Server Settings

Allow:

* Prefix
* Language
* Timezone
* Default moderation reason
* Command permissions
* Moderator roles
* Admin roles
* Staff bypass roles
* Bot behavior
* Embed settings
* Color/theme settings
* Server-specific settings

---

# 3. MODERATION SYSTEM

Build a complete professional moderation system.

Commands should include at minimum:

`rm!warn`
`rm!warnings`
`rm!clearwarns`
`rm!unwarn`
`rm!mute`
`rm!unmute`
`rm!timeout`
`rm!untimeout`
`rm!kick`
`rm!ban`
`rm!unban`
`rm!softban`
`rm!purge`
`rm!slowmode`
`rm!lock`
`rm!unlock`
`rm!nick`
`rm!role`
`rm!dehoist`
`rm!removerole`
`rm!reason`
`rm!history`
`rm!modlogs`
`rm!case`
`rm!cases`
`rm!note`

Add a proper case system.

Every moderation action should optionally create a case number.

Example:

Case #1842
Action: Warn
User: @User
Moderator: @Moderator
Reason: Spam
Timestamp: ...

Store moderation history in the database.

Add configurable:

* Warning thresholds
* Automatic punishments
* Escalation system
* Moderator permissions
* Staff roles
* Punishment duration
* DM notifications
* Logging

Example escalation:

1 warning → warning
3 warnings → timeout
5 warnings → kick
7 warnings → ban

Make every threshold configurable from the dashboard.

---

# 4. AUTOMOD

Build an extremely advanced AutoMod system.

Include:

* Anti-spam
* Anti-flood
* Anti-mention spam
* Anti-link spam
* Anti-invite links
* Anti-IP grabber links
* Anti-scam links
* Anti-phishing links
* Anti-caps
* Anti-repeated messages
* Anti-emoji spam
* Anti-sticker spam
* Anti-character spam
* Anti-Zalgo
* Anti-mass mentions
* Anti-duplicate messages
* Anti-fast joins
* Anti-bot spam
* Anti-webhook abuse

Allow admins to configure each module independently.

Actions:

* Delete message
* Warn
* Timeout
* Kick
* Ban
* Log
* Add points
* Trigger custom response

Allow:

* Whitelisted channels
* Whitelisted roles
* Whitelisted users
* Whitelisted domains
* Custom limits
* Custom punishments

---

# 5. ANTI-SWEAR / WORD FILTER

Build a configurable profanity and word filtering system.

Features:

* Blocked words
* Allowed words
* Partial-word detection
* Word variants
* Character substitutions
* Repeated-character bypass detection
* Unicode bypass detection
* Case-insensitive matching

Admins can add/remove words through the dashboard.

Example:

Blocked:
`word1`
`word2`
`word3`

Actions:

* Delete
* Warn
* Timeout
* Kick
* Ban
* Log

Allow custom warning messages.

Include channel/role exemptions.

---

# 6. ANTI-NUKE / SERVER SECURITY

This needs to be one of the strongest parts of the bot.

Create an advanced anti-nuke system.

Monitor:

* Mass channel deletion
* Mass channel creation
* Mass channel edits
* Mass role deletion
* Mass role creation
* Mass role edits
* Mass bans
* Mass kicks
* Mass webhook creation
* Mass webhook deletion
* Mass emoji deletion
* Mass emoji creation
* Mass integration changes
* Dangerous permission changes
* Administrator role creation
* Administrator permission grants
* Server setting modifications
* Bot additions
* Unusual moderator activity

Use configurable thresholds and time windows.

Example:

10 channels deleted within 10 seconds → trigger protection.

Actions:

* Revoke dangerous permissions
* Ban attacker
* Kick attacker
* Remove newly created roles
* Restore deleted channels when possible
* Restore deleted roles when possible
* Delete malicious webhooks
* Lock the server
* Enable emergency lockdown
* Notify staff
* Log all events

Add a trusted whitelist system.

Trusted users/roles should be configurable.

Have:

* Trusted users
* Trusted roles
* Trusted bots
* Emergency bypass
* Recovery mode

Make anti-nuke settings available from the dashboard.

---

# 7. ANTI-RAID

Create advanced anti-raid protection.

Detect:

* Mass joins
* Join bursts
* New-account raids
* Suspicious account age
* Repeated usernames
* Repeated avatars where practical
* Bot raids
* Mention raids
* Spam raids

Actions:

* Server verification mode
* Temporary lockdown
* Kick suspicious users
* Ban suspicious users
* Increase verification
* Restrict new members
* Alert staff
* Automatically unlock after configurable duration

Configurable:

* Join threshold
* Time period
* Minimum account age
* Raid mode
* Punishment
* Exemptions

Add an emergency "LOCK SERVER" control to the dashboard.

---

# 8. LOCKDOWN SYSTEM

Create:

`rm!lockdown`
`rm!unlockdown`

Dashboard controls should allow admins to instantly lock down:

* Whole server
* Categories
* Selected channels

Modes:

* Soft lockdown
* Full lockdown
* Raid lockdown
* Emergency lockdown

Show active lockdown status in dashboard.

---

# 9. LOGGING SYSTEM

Create detailed logging.

Log:

* Message deletes
* Message edits
* Member joins
* Member leaves
* Bans
* Unbans
* Kicks
* Timeouts
* Warnings
* Role changes
* Channel changes
* Server changes
* Permission changes
* Voice events
* Nickname changes
* Username changes
* Invites
* Webhooks
* Automod actions
* Anti-nuke actions
* Anti-raid actions

Allow admins to choose separate channels for different logs.

Example:

* `#mod-logs`
* `#security-logs`
* `#member-logs`
* `#message-logs`

Add configurable log toggles.

---

# 10. WELCOME / GOODBYE

Create a full welcome system.

Features:

* Welcome messages
* Goodbye messages
* Welcome embeds
* Auto-role
* DM welcome
* Rules message
* Verification message
* Custom variables

Variables:

`{user}`
`{username}`
`{server}`
`{membercount}`
`{userid}`
`{mention}`

Allow complete dashboard customization.

---

# 11. AUTO RESPONDER

Build an advanced auto responder.

Example:

Trigger:
`hello`

Response:
`Hey {user}! 👋`

Support:

* Exact match
* Contains
* Starts with
* Ends with
* Regex where appropriate
* Case sensitivity
* Channel restrictions
* Role restrictions
* Cooldowns
* Random responses
* Embeds

Allow unlimited custom responders stored in database.

Dashboard should have a clean Auto Responder manager.

---

# 12. CUSTOM COMMANDS

Build a custom command system.

Admins can create:

`rm!customcommand`

Example:

Trigger:
`rules`

Response:
`Please read #rules`

Support:

* Text
* Embeds
* Buttons
* Mentions
* Variables
* Cooldowns
* Permissions
* Channel restrictions
* Role restrictions

Dashboard must make this easy without coding.

---

# 13. REACTION ROLES / BUTTON ROLES

Create a full role assignment system.

Support:

* Reaction roles
* Button roles
* Select menus
* Multiple role panels
* Role removal
* Role limits
* Verification roles
* Self roles

Dashboard builder should allow admins to visually create role panels.

---

# 14. TICKETS

Build a professional ticket system.

Features:

* Ticket panels
* Buttons
* Categories
* Staff roles
* Ticket transcripts
* Close/reopen
* Claim ticket
* Add user
* Remove user
* Rename ticket
* Auto-close
* Ticket logging
* DM notifications

Ticket panel builder should be available in dashboard.

---

# 15. GIVEAWAYS

Create a giveaway system.

Commands:

`rm!giveaway`
`rm!reroll`
`rm!end`

Features:

* Duration
* Winners
* Prize
* Required role
* Minimum account age
* Minimum server activity
* Bonus entries
* Blacklisted roles
* Automatic winner selection
* Rerolls

Dashboard giveaway management.

---

# 16. POLLS / SUGGESTIONS

Create:

* Poll system
* Suggestion system
* Upvote/downvote
* Staff approve/deny
* Suggestion channels
* Automatic status messages

Statuses:

* Pending
* Approved
* Denied
* Implemented

---

# 17. STARBOARD

Create:

* Configurable star reaction
* Threshold
* Starboard channel
* Ignored channels
* Ignored roles
* Ignore bots
* Custom formatting

---

# 18. LEVELING / XP

Create a server leveling system.

Features:

* XP per message
* XP cooldown
* Levels
* Level-up announcements
* Level roles
* XP multipliers
* Leaderboard
* Admin XP controls

Commands:
`rm!rank`
`rm!levels`
`rm!leaderboard`

Dashboard controls for everything.

---

# 19. ECONOMY

Create an optional server economy.

Features:

* Currency
* Balance
* Daily rewards
* Weekly rewards
* Work
* Leaderboards
* Items
* Shop
* Custom currency name
* Admin economy controls

Keep this completely optional per server.

---

# 20. FUN COMMANDS

Add a large collection of safe fun commands.

Examples:

* `rm!8ball`
* `rm!choose`
* `rm!roll`
* `rm!coinflip`
* `rm!ship`
* `rm!rate`
* `rm!say`
* `rm!avatar`
* `rm!banner`
* `rm!userinfo`
* `rm!serverinfo`
* `rm!membercount`

Make the command system modular so new commands can easily be added later.

---

# 21. UTILITY COMMANDS

Include:

* Help
* Bot info
* Server info
* User info
* Role info
* Channel info
* Avatar
* Banner
* Permissions
* Invite info
* Server icon
* Search utilities
* Reminders
* AFK
* Polls
* Embed builder

---

# 22. EMBED BUILDER

Create an advanced dashboard embed builder.

Allow admins to visually configure:

* Title
* Description
* Author
* Footer
* Thumbnail
* Image
* Fields
* Timestamp
* Color
* Buttons
* Links

Allow preview before sending.

---

# 23. COMMAND PERMISSIONS

Every command must support configurable permissions.

Allow:

* Admin only
* Moderator roles
* Specific roles
* Specific users
* Channel restrictions
* Permission checks
* Disabled commands
* Custom command aliases

Dashboard page:

**Command Permissions**

Search for any command and configure exactly who can use it.

---

# 24. CUSTOM ALIASES

Allow admins to configure aliases.

Example:

`rm!ban`
aliases:
`rm!b`
`rm!hammer`

Aliases should be stored per server.

---

# 25. BOT EMOJIS

I will provide a ZIP file containing the emojis/assets that the bot has access to.

IMPORTANT:

When I upload the ZIP, inspect the available assets and integrate them throughout the dashboard and bot responses where appropriate.

Use the supplied emojis for:

* Embeds
* Buttons
* Status indicators
* Moderation messages
* Dashboard UI
* Success/error messages
* Help command
* Tickets
* Logging
* Security alerts

Do not randomly replace every normal UI icon with an emoji. Use them where they actually improve the design.

Create an organized asset system so the bot can easily reference the supplied emoji assets.

---

# 26. HELP COMMAND

Create a premium help menu.

`rm!help`

Show:

* Categories
* Commands
* Descriptions
* Usage
* Examples
* Permissions

Categories should include:

Moderation
Security
Anti-Nuke
Anti-Raid
AutoMod
Logging
Utility
Tickets
Roles
Welcome
Giveaways
Economy
Leveling
Fun
Configuration

Support interactive buttons/select menus.

---

# 27. COMMAND HANDLER ARCHITECTURE

Build the bot using a scalable command architecture.

Each command should have:

* Name
* Description
* Usage
* Permissions
* Cooldown
* Category
* Aliases
* Slash command support where appropriate
* Prefix command support

The system should make it easy to add hundreds of commands later.

Do NOT create one massive unreadable command file.

Use modular services and folders.

---

# 28. DATABASE

Use a real database architecture.

Store:

* Guild configuration
* Prefix
* Moderation cases
* Warnings
* Mutes/timeouts
* AutoMod configuration
* Anti-nuke configuration
* Anti-raid configuration
* Logs
* Custom commands
* Auto responders
* Tickets
* Giveaways
* Levels
* Economy
* Role panels
* Whitelists
* User settings

Design the schema properly and add indexes for common queries.

---

# 29. SECURITY

Take security seriously.

Implement:

* Permission checks
* Role hierarchy checks
* Bot permission checks
* Input validation
* Rate limiting
* API authentication
* Secure OAuth2 flow
* Session security
* CSRF protection where applicable
* Environment variables for secrets
* Never expose Discord bot token
* Audit logging
* Safe database queries

Never put secrets directly into frontend code.

---

# 30. DISCORD BOT STATUS

Dashboard should show:

🟢 Online
🟡 Connecting
🔴 Offline

Show:

* Ping
* Uptime
* Servers
* Users
* Commands processed
* CPU/memory where available

---

# 31. DASHBOARD ANALYTICS

Add useful server analytics:

* Members joined
* Members left
* Moderation actions
* Warnings
* Bans
* Kicks
* Messages moderated
* AutoMod triggers
* Anti-nuke incidents
* Anti-raid incidents

Use attractive charts.

---

# 32. SERVER SETUP WIZARD

When a server is first added, show a setup wizard.

Steps:

1. Welcome
2. Moderation
3. AutoMod
4. Security
5. Logging
6. Tickets
7. Roles
8. Welcome messages
9. Finish

Allow admins to configure everything quickly.

Include presets:

**Basic**
**Balanced**
**Strict**
**Maximum Security**

---

# 33. EMERGENCY SECURITY CENTER

Create a dashboard page called:

**Security Center**

Show:

* Current risk level
* Recent security events
* Anti-nuke status
* Anti-raid status
* Suspicious activity
* Trusted members
* Recent permission changes

Add large emergency controls:

**LOCK SERVER**
**ENABLE RAID MODE**
**DISABLE INVITES**
**DISABLE NEW MEMBERS**
**RESTORE SECURITY SETTINGS**

Require confirmation for dangerous actions.

---

# 34. ROLE / CHANNEL MANAGEMENT

Add dashboard tools for:

* Create role
* Delete role
* Edit role
* Create channel
* Delete channel
* Rename channel
* Edit channel permissions
* Reorder channels where Discord permissions/API allow
* Category management

Always respect Discord permission and hierarchy rules.

---

# 35. CUSTOM SERVER BRANDING

Allow admins to customize:

* Embed colors
* Bot response style
* Welcome style
* Logo
* Server branding
* Footer text
* Moderation message style

---

# 36. COMMAND COOLDOWNS

Every command should have configurable cooldown support.

Allow:

* Global cooldown
* Per-user cooldown
* Per-channel cooldown
* Per-role cooldown

---

# 37. BOT OWNER / GLOBAL ADMIN PANEL

Create an owner-only dashboard area for RM developers.

Include:

* Total servers
* Total users
* Bot uptime
* Error logs
* Command usage
* Server growth
* Shard information if sharding is used
* API health
* Database health
* Maintenance mode
* Global announcements
* Feature flags
* Blacklisted guilds/users
* Global bot settings

This area must be completely inaccessible to normal Discord server admins.

---

# 38. ERROR HANDLING

The bot should never randomly crash from a single command failure.

Implement:

* Global error handler
* Command error handling
* API error handling
* Database error handling
* Discord API retry handling where appropriate
* Logging
* Useful developer diagnostics

Users should receive friendly errors.

Example:

❌ Something went wrong while processing that command.

The technical error should be available in logs, not exposed to users.

---

# 39. RATE LIMITING

Protect the bot and dashboard from abuse.

Implement sensible:

* Command rate limits
* API rate limits
* Dashboard rate limits
* Login protection
* Ticket spam protection
* Auto responder cooldowns

---

# 40. RESPONSIVE UI

The dashboard MUST work properly on:

* Desktop
* Laptop
* Tablet
* Mobile

Do not create a desktop-only dashboard.

Navigation should collapse cleanly on smaller screens.

---

# 41. QUALITY BAR

The project should feel like a legitimate top-tier Discord bot.

Avoid:

* Fake statistics
* Fake buttons that do nothing
* Fake settings
* Placeholder moderation features
* Dummy dashboard data pretending to be live
* Broken navigation
* Generic template styling

Every implemented setting should actually connect to the application's backend architecture.

When a feature cannot be fully implemented without Discord credentials/API access, create the complete integration-ready architecture and clearly isolate the missing environment configuration rather than pretending it works.

---

# 42. DOCUMENTATION

Create a proper README containing:

* Project overview
* Setup instructions
* Environment variables
* Discord application setup
* OAuth2 setup
* Bot token configuration
* Database setup
* Development commands
* Production deployment
* Dashboard configuration
* Bot permissions
* Required Discord intents
* Troubleshooting

Also include an `.env.example`.

---

# 43. PROJECT STRUCTURE

Use a clean scalable structure.

Separate:

* Frontend
* Backend
* Discord bot
* Commands
* Events
* Services
* Database
* API
* Authentication
* Dashboard components
* Utilities
* Security
* Assets

Keep the code maintainable.

---

# 44. IMPORTANT IMPLEMENTATION RULES

Use real functionality wherever possible.

Do not hardcode fake guilds, users, statistics, warnings, bans, or logs.

Do not build fake dashboards.

Do not make the dashboard merely simulate Discord.

Create the actual database models, APIs, command handlers, event listeners, configuration management, and Discord integration structure.

Use environment variables for secrets.

Make server-specific configuration isolated by guild ID.

Make permission checks happen server-side.

Make dangerous security settings require proper Discord permissions.

Design the system so RM can eventually support thousands of guilds.

---

# 45. FINAL UI STYLE

The design should feel:

Premium
Clean
Dark
Modern
Fast
Professional
Discord-native
Slightly futuristic

Think:

**Titanium-level moderation + Carl-bot-level configurability + Wick-level security + Dyno-level utility + MEE6-style dashboard + a modern SaaS interface.**

But do NOT copy their exact branding, logos, text, or UI.

RM needs its own visual identity.

---

# 46. BUILD ORDER

Build in this order:

1. Project architecture
2. Discord authentication
3. Database
4. Discord bot core
5. Command framework
6. Server configuration
7. Moderation
8. Logging
9. AutoMod
10. Anti-nuke
11. Anti-raid
12. Dashboard
13. Tickets
14. Roles
15. Welcome system
16. Auto responder
17. Custom commands
18. Giveaways
19. Leveling
20. Economy
21. Analytics
22. Security center
23. Owner dashboard
24. Asset/emoji integration
25. Final polish

Do not stop after creating the frontend.

The goal is a **real, scalable RM Discord bot ecosystem with a high-quality dashboard and backend**, not a concept page.

Start by building the full application architecture and core working functionality, then expand each system while keeping everything modular and production-ready.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rmxyz.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f2a55353-ce5e-4311-a120-e3848520a0d8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
