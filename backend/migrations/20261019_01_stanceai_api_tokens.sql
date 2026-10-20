-- Organization-scoped credentials for customer integrations with StanceAI.
-- These are distinct from org_api_keys, which contain encrypted provider
-- credentials used by the model router. Only a SHA-256 verifier is stored.

create table if not exists public.org_api_tokens (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  token_prefix text not null check (char_length(token_prefix) between 8 and 32),
  scopes text[] not null default '{}',
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint org_api_tokens_scopes_check
    check (scopes <@ array['analysis:read', 'analysis:write']::text[])
);

create index if not exists idx_org_api_tokens_org_created
  on public.org_api_tokens(org_id, created_at desc);
create index if not exists idx_org_api_tokens_active_hash
  on public.org_api_tokens(token_hash) where revoked_at is null;

alter table public.org_api_tokens enable row level security;
revoke all on public.org_api_tokens from anon, authenticated;
grant select, insert, update, delete on public.org_api_tokens to service_role;
