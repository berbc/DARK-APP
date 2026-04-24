-- ============================================================
-- BERNARDO OS — Supabase Schema
-- ============================================================

-- CLIENTS
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text default '#FBBF24',
  type text default 'YouTube',
  frequency text default '',
  rate_per_hour numeric default 0,
  notes text default '',
  active boolean default true,
  created_at timestamptz default now()
);

-- TASKS
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  type text default 'Roteiro',
  status text default 'pendente',
  urgency text default 'normal',
  estimated_hours numeric default 1,
  actual_hours numeric default 0,
  deadline date,
  day_of_week int,
  notes text default '',
  done boolean default false,
  done_at timestamptz,
  created_at timestamptz default now()
);

-- TIME ENTRIES (timesheet automático)
create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes numeric default 0,
  created_at timestamptz default now()
);

-- VIDEOS (Canais Dark kanban)
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  niche text default 'Curiosidades',
  status text default 'ideia',
  script text default '',
  script_version int default 1,
  hook text default '',
  thumbnail_desc text default '',
  cta text default '',
  publish_date date,
  views int default 0,
  ctr numeric default 0,
  retention numeric default 0,
  performance_score numeric default 0,
  notes text default '',
  approval_token text unique default gen_random_uuid()::text,
  approved boolean default false,
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- IDEAS (banco de ideias + inbox rápido)
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  niche text default '',
  client_id uuid references clients(id) on delete set null,
  source text default 'manual',
  score int default 0,
  used boolean default false,
  created_at timestamptz default now()
);

-- POSTS (calendário de publicação)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  video_id uuid references videos(id) on delete set null,
  title text default '',
  platform text default 'YouTube',
  status text default 'pendente',
  scheduled_date date,
  scheduled_time text default '18:00',
  published_at timestamptz,
  link text default '',
  notes text default '',
  created_at timestamptz default now()
);

-- INVOICES (notas fiscais)
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  number text default '',
  description text default '',
  amount numeric not null default 0,
  status text default 'pendente',
  issued_date date not null,
  due_date date not null,
  paid_date date,
  notes text default '',
  created_at timestamptz default now()
);

-- GOALS (metas mensais)
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  month text not null,
  videos_target int default 0,
  videos_done int default 0,
  revenue_target numeric default 0,
  hours_target numeric default 0,
  created_at timestamptz default now()
);

-- LIBRARY (hooks, títulos, CTAs, thumbnails)
create table if not exists library (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  content text not null,
  niche text default '',
  client_id uuid references clients(id) on delete set null,
  views int default 0,
  score int default 0,
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- TRENDING CACHE (YouTube trending)
create table if not exists trending_cache (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  data jsonb not null,
  fetched_at timestamptz default now()
);

-- POMODOROS
create table if not exists pomodoros (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  completed boolean default false,
  duration_minutes int default 25,
  created_at timestamptz default now()
);

-- USER STATS (XP, streak, level)
create table if not exists user_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  xp int default 0,
  level int default 1,
  streak int default 0,
  last_active date,
  tasks_completed int default 0,
  pomodoros_completed int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- SEED: clientes iniciais
-- ============================================================
insert into clients (name, color, type, frequency) values
  ('Sr. Waldemar',  '#FBBF24', 'AI Entertainment', '3x semana'),
  ('Bulldog Show',  '#60A5FA', 'YouTube / Rádio',  '3x semana'),
  ('Charla',        '#F87171', 'Podcast',           '3x semana'),
  ('F4',            '#A78BFA', 'Canal YouTube',     '2x semana'),
  ('Canais Dark',   '#34D399', 'YouTube Faceless',  '4x semana')
on conflict do nothing;
