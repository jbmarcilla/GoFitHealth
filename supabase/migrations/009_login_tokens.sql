-- Enlaces de un solo uso para abrir el dashboard ya logueado desde el chat (MCP).
create table public.login_tokens (
  token_hash  text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index login_tokens_user_idx on public.login_tokens(user_id);
alter table public.login_tokens enable row level security;
