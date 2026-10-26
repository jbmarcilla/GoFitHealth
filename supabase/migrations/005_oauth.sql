-- ========================== OAUTH (conectores MCP de Claude / ChatGPT) =====
-- Solo accesibles con la service role key (RLS sin policies).

create table public.oauth_clients (
  client_id     text primary key,
  client_name   text,
  redirect_uris text[] not null,
  created_at    timestamptz not null default now()
);

create table public.oauth_codes (
  code_hash      text primary key,
  client_id      text not null references public.oauth_clients(client_id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  redirect_uri   text not null,
  code_challenge text not null,
  scope          text,
  expires_at     timestamptz not null,
  used_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index oauth_codes_expires_idx on public.oauth_codes(expires_at);

alter table public.oauth_clients enable row level security;
alter table public.oauth_codes   enable row level security;

alter table public.api_keys
  add column oauth_client_id text references public.oauth_clients(client_id) on delete set null;
