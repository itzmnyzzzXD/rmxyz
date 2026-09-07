
-- ============ RM CORE SCHEMA ============
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- guilds
CREATE TABLE public.guilds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Unknown',
  icon TEXT,
  owner_id TEXT,
  member_count INT NOT NULL DEFAULT 0,
  channel_count INT NOT NULL DEFAULT 0,
  role_count INT NOT NULL DEFAULT 0,
  bot_present BOOLEAN NOT NULL DEFAULT false,
  premium BOOLEAN NOT NULL DEFAULT false,
  blacklisted BOOLEAN NOT NULL DEFAULT false,
  setup_completed BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.guilds TO service_role;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_guilds BEFORE UPDATE ON public.guilds FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- generic per-guild JSON config modules (prefix, automod, antinuke, antiraid, logging, welcome, tickets, levels, economy, branding, starboard, suggestions)
CREATE TABLE public.guild_configs (
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, module)
);
GRANT ALL ON public.guild_configs TO service_role;
ALTER TABLE public.guild_configs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_guild_configs_module ON public.guild_configs(module);
CREATE TRIGGER t_guild_configs BEFORE UPDATE ON public.guild_configs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- moderation cases
CREATE TABLE public.mod_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  case_number INT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_tag TEXT,
  moderator_id TEXT NOT NULL,
  moderator_tag TEXT,
  reason TEXT,
  duration_seconds INT,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'command',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, case_number)
);
GRANT ALL ON public.mod_cases TO service_role;
ALTER TABLE public.mod_cases ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cases_guild_created ON public.mod_cases(guild_id, created_at DESC);
CREATE INDEX idx_cases_target ON public.mod_cases(guild_id, target_id);
CREATE INDEX idx_cases_action ON public.mod_cases(guild_id, action);
CREATE INDEX idx_cases_expiry ON public.mod_cases(expires_at) WHERE active;
CREATE TRIGGER t_cases BEFORE UPDATE ON public.mod_cases FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- atomic case number allocation
CREATE OR REPLACE FUNCTION public.next_case_number(p_guild TEXT) RETURNS INT AS $$
DECLARE n INT;
BEGIN
  SELECT COALESCE(MAX(case_number), 0) + 1 INTO n FROM public.mod_cases WHERE guild_id = p_guild;
  RETURN n;
END; $$ LANGUAGE plpgsql SET search_path = public;

-- warnings / points
CREATE TABLE public.warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  moderator_id TEXT NOT NULL,
  reason TEXT,
  points INT NOT NULL DEFAULT 1,
  case_id UUID REFERENCES public.mod_cases(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  cleared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.warnings TO service_role;
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_warnings_guild_user ON public.warnings(guild_id, user_id) WHERE NOT cleared;

-- notes
CREATE TABLE public.mod_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.mod_notes TO service_role;
ALTER TABLE public.mod_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notes_guild_user ON public.mod_notes(guild_id, user_id);

-- word filter entries
CREATE TABLE public.filter_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  list_type TEXT NOT NULL DEFAULT 'blocked',
  match_mode TEXT NOT NULL DEFAULT 'partial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, list_type, word)
);
GRANT ALL ON public.filter_words TO service_role;
ALTER TABLE public.filter_words ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_filter_guild ON public.filter_words(guild_id, list_type);

-- whitelist / trusted entities (anti-nuke, automod exemptions)
CREATE TABLE public.whitelists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  label TEXT,
  added_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, scope, entity_type, entity_id)
);
GRANT ALL ON public.whitelists TO service_role;
ALTER TABLE public.whitelists ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_whitelist_guild_scope ON public.whitelists(guild_id, scope);

-- logging events (bot -> db)
CREATE TABLE public.log_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  target_id TEXT,
  channel_id TEXT,
  summary TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.log_events TO service_role;
ALTER TABLE public.log_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_logs_guild_created ON public.log_events(guild_id, created_at DESC);
CREATE INDEX idx_logs_category ON public.log_events(guild_id, category, created_at DESC);

-- security events (anti-nuke / anti-raid)
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  system TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  actor_id TEXT,
  actor_tag TEXT,
  action_taken TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sec_guild_created ON public.security_events(guild_id, created_at DESC);
CREATE INDEX idx_sec_severity ON public.security_events(guild_id, severity) WHERE NOT resolved;

-- lockdown state
CREATE TABLE public.lockdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'server',
  channel_ids TEXT[] NOT NULL DEFAULT '{}',
  reason TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  started_by TEXT,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.lockdowns TO service_role;
ALTER TABLE public.lockdowns ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_lockdown_active ON public.lockdowns(guild_id) WHERE active;
CREATE TRIGGER t_lockdowns BEFORE UPDATE ON public.lockdowns FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- custom commands
CREATE TABLE public.custom_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  trigger TEXT NOT NULL,
  response TEXT NOT NULL,
  embed JSONB,
  enabled BOOLEAN NOT NULL DEFAULT true,
  cooldown_seconds INT NOT NULL DEFAULT 3,
  allowed_roles TEXT[] NOT NULL DEFAULT '{}',
  allowed_channels TEXT[] NOT NULL DEFAULT '{}',
  uses INT NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, trigger)
);
GRANT ALL ON public.custom_commands TO service_role;
ALTER TABLE public.custom_commands ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_customcmd BEFORE UPDATE ON public.custom_commands FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- auto responders
CREATE TABLE public.auto_responders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  trigger TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains',
  case_sensitive BOOLEAN NOT NULL DEFAULT false,
  responses TEXT[] NOT NULL DEFAULT '{}',
  embed JSONB,
  enabled BOOLEAN NOT NULL DEFAULT true,
  cooldown_seconds INT NOT NULL DEFAULT 5,
  delete_trigger BOOLEAN NOT NULL DEFAULT false,
  allowed_roles TEXT[] NOT NULL DEFAULT '{}',
  allowed_channels TEXT[] NOT NULL DEFAULT '{}',
  uses INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.auto_responders TO service_role;
ALTER TABLE public.auto_responders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_responders_guild ON public.auto_responders(guild_id) WHERE enabled;
CREATE TRIGGER t_responders BEFORE UPDATE ON public.auto_responders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- command permission overrides + aliases + cooldowns
CREATE TABLE public.command_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  permission_level TEXT NOT NULL DEFAULT 'default',
  allowed_roles TEXT[] NOT NULL DEFAULT '{}',
  denied_roles TEXT[] NOT NULL DEFAULT '{}',
  allowed_users TEXT[] NOT NULL DEFAULT '{}',
  allowed_channels TEXT[] NOT NULL DEFAULT '{}',
  denied_channels TEXT[] NOT NULL DEFAULT '{}',
  aliases TEXT[] NOT NULL DEFAULT '{}',
  cooldown_seconds INT,
  cooldown_scope TEXT NOT NULL DEFAULT 'user',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, command)
);
GRANT ALL ON public.command_settings TO service_role;
ALTER TABLE public.command_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_cmdset BEFORE UPDATE ON public.command_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- role panels
CREATE TABLE public.role_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel_id TEXT,
  message_id TEXT,
  panel_type TEXT NOT NULL DEFAULT 'button',
  title TEXT,
  description TEXT,
  color TEXT,
  max_roles INT,
  allow_removal BOOLEAN NOT NULL DEFAULT true,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.role_panels TO service_role;
ALTER TABLE public.role_panels ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_panels_guild ON public.role_panels(guild_id);
CREATE TRIGGER t_panels BEFORE UPDATE ON public.role_panels FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- tickets
CREATE TABLE public.ticket_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel_id TEXT,
  message_id TEXT,
  category_id TEXT,
  transcript_channel_id TEXT,
  staff_roles TEXT[] NOT NULL DEFAULT '{}',
  title TEXT,
  description TEXT,
  button_label TEXT NOT NULL DEFAULT 'Open a ticket',
  naming_scheme TEXT NOT NULL DEFAULT 'ticket-{number}',
  auto_close_hours INT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ticket_panels TO service_role;
ALTER TABLE public.ticket_panels ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_tpanels BEFORE UPDATE ON public.ticket_panels FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  panel_id UUID REFERENCES public.ticket_panels(id) ON DELETE SET NULL,
  ticket_number INT NOT NULL,
  channel_id TEXT,
  opener_id TEXT NOT NULL,
  claimed_by TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  subject TEXT,
  participants TEXT[] NOT NULL DEFAULT '{}',
  transcript TEXT,
  closed_by TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, ticket_number)
);
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tickets_guild_status ON public.tickets(guild_id, status);
CREATE TRIGGER t_tickets BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- giveaways
CREATE TABLE public.giveaways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  channel_id TEXT,
  message_id TEXT,
  prize TEXT NOT NULL,
  winners_count INT NOT NULL DEFAULT 1,
  host_id TEXT,
  required_roles TEXT[] NOT NULL DEFAULT '{}',
  blacklisted_roles TEXT[] NOT NULL DEFAULT '{}',
  min_account_age_days INT NOT NULL DEFAULT 0,
  bonus_entries JSONB NOT NULL DEFAULT '{}'::jsonb,
  entries TEXT[] NOT NULL DEFAULT '{}',
  winners TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'scheduled',
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.giveaways TO service_role;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_giveaways_active ON public.giveaways(ends_at) WHERE status = 'running';
CREATE TRIGGER t_giveaways BEFORE UPDATE ON public.giveaways FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- suggestions
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  suggestion_number INT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  upvotes INT NOT NULL DEFAULT 0,
  downvotes INT NOT NULL DEFAULT 0,
  staff_note TEXT,
  handled_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, suggestion_number)
);
GRANT ALL ON public.suggestions TO service_role;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_suggestions BEFORE UPDATE ON public.suggestions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- starboard entries
CREATE TABLE public.starboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  source_message_id TEXT NOT NULL,
  starboard_message_id TEXT,
  channel_id TEXT,
  author_id TEXT,
  star_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, source_message_id)
);
GRANT ALL ON public.starboard_entries TO service_role;
ALTER TABLE public.starboard_entries ENABLE ROW LEVEL SECURITY;

-- leveling
CREATE TABLE public.member_levels (
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  xp BIGINT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 0,
  messages INT NOT NULL DEFAULT 0,
  last_xp_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);
GRANT ALL ON public.member_levels TO service_role;
ALTER TABLE public.member_levels ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_levels_leaderboard ON public.member_levels(guild_id, xp DESC);
CREATE TRIGGER t_levels BEFORE UPDATE ON public.member_levels FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- economy
CREATE TABLE public.member_economy (
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  balance BIGINT NOT NULL DEFAULT 0,
  bank BIGINT NOT NULL DEFAULT 0,
  inventory JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_daily_at TIMESTAMPTZ,
  last_weekly_at TIMESTAMPTZ,
  last_work_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);
GRANT ALL ON public.member_economy TO service_role;
ALTER TABLE public.member_economy ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_eco_leaderboard ON public.member_economy(guild_id, balance DESC);
CREATE TRIGGER t_eco BEFORE UPDATE ON public.member_economy FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL DEFAULT 100,
  role_reward TEXT,
  stock INT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.shop_items TO service_role;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- dashboard audit trail
CREATE TABLE public.dashboard_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT REFERENCES public.guilds(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_tag TEXT,
  action TEXT NOT NULL,
  target TEXT,
  before_state JSONB,
  after_state JSONB,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.dashboard_audit TO service_role;
ALTER TABLE public.dashboard_audit ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_guild ON public.dashboard_audit(guild_id, created_at DESC);

-- daily analytics rollups
CREATE TABLE public.guild_stats_daily (
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  joins INT NOT NULL DEFAULT 0,
  leaves INT NOT NULL DEFAULT 0,
  messages INT NOT NULL DEFAULT 0,
  warns INT NOT NULL DEFAULT 0,
  mutes INT NOT NULL DEFAULT 0,
  kicks INT NOT NULL DEFAULT 0,
  bans INT NOT NULL DEFAULT 0,
  automod_triggers INT NOT NULL DEFAULT 0,
  antinuke_events INT NOT NULL DEFAULT 0,
  antiraid_events INT NOT NULL DEFAULT 0,
  commands_used INT NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, day)
);
GRANT ALL ON public.guild_stats_daily TO service_role;
ALTER TABLE public.guild_stats_daily ENABLE ROW LEVEL SECURITY;

-- bot runtime status heartbeat (single-row per shard)
CREATE TABLE public.bot_status (
  shard_id INT PRIMARY KEY DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'offline',
  latency_ms INT,
  guild_count INT NOT NULL DEFAULT 0,
  user_count BIGINT NOT NULL DEFAULT 0,
  commands_processed BIGINT NOT NULL DEFAULT 0,
  cpu_percent NUMERIC,
  memory_mb NUMERIC,
  started_at TIMESTAMPTZ,
  version TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_status TO service_role;
ALTER TABLE public.bot_status ENABLE ROW LEVEL SECURITY;

-- global settings / feature flags / blacklists (owner panel)
CREATE TABLE public.global_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.global_settings TO service_role;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.global_settings(key, value) VALUES
  ('maintenance', '{"enabled": false, "message": "RM is undergoing maintenance."}'::jsonb),
  ('feature_flags', '{"economy": true, "leveling": true, "tickets": true, "giveaways": true}'::jsonb),
  ('announcement', '{"active": false, "text": ""}'::jsonb);

CREATE TABLE public.blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  reason TEXT,
  added_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);
GRANT ALL ON public.blacklist TO service_role;
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;

-- error log (bot + dashboard)
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  guild_id TEXT,
  command TEXT,
  message TEXT NOT NULL,
  stack TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.error_logs TO service_role;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_errors_created ON public.error_logs(created_at DESC);

-- command usage analytics
CREATE TABLE public.command_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT,
  command TEXT NOT NULL,
  user_id TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.command_usage TO service_role;
ALTER TABLE public.command_usage ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_usage_created ON public.command_usage(created_at DESC);
CREATE INDEX idx_usage_command ON public.command_usage(command);

-- pending actions queue: dashboard -> bot (lock server, publish panel, etc.)
CREATE TABLE public.bot_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by TEXT,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
GRANT ALL ON public.bot_tasks TO service_role;
ALTER TABLE public.bot_tasks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tasks_pending ON public.bot_tasks(created_at) WHERE status = 'pending';
