do $$ begin
  create type public.draft_status as enum ('private', 'shared', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.draft_collaborator_role as enum ('editor', 'commenter', 'viewer');
exception when duplicate_object then null;
end $$;

create table if not exists public.draft_settings (
  contract_id uuid primary key references public.contracts(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  status public.draft_status not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.draft_collaborators (
  contract_id uuid not null references public.contracts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.draft_collaborator_role not null default 'viewer',
  invited_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (contract_id, user_id)
);

create table if not exists public.draft_comments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  parent_id uuid references public.draft_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  selected_text text,
  position_start integer check (position_start is null or position_start >= 0),
  position_end integer,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (position_end is null or (position_start is not null and position_end >= position_start))
);

create index if not exists draft_settings_workspace_idx on public.draft_settings(workspace_id, updated_at desc);
create index if not exists draft_collaborators_user_idx on public.draft_collaborators(user_id, created_at desc);
create index if not exists draft_comments_contract_idx on public.draft_comments(contract_id, created_at);
create index if not exists draft_comments_parent_idx on public.draft_comments(parent_id) where parent_id is not null;

create or replace function public.is_draft_owner(target_contract_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.contracts
    where id = target_contract_id and type = 'draft' and user_id = auth.uid()
  );
$$;

create or replace function public.can_view_draft(target_contract_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_draft_owner(target_contract_id) or exists (
    select 1 from public.draft_collaborators
    where contract_id = target_contract_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_draft(target_contract_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_draft_owner(target_contract_id) or exists (
    select 1 from public.draft_collaborators
    where contract_id = target_contract_id and user_id = auth.uid() and role = 'editor'
  );
$$;

create or replace function public.can_comment_draft(target_contract_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_draft_owner(target_contract_id) or exists (
    select 1 from public.draft_collaborators
    where contract_id = target_contract_id and user_id = auth.uid() and role in ('editor', 'commenter')
  );
$$;

drop trigger if exists draft_settings_updated_at on public.draft_settings;
create trigger draft_settings_updated_at before update on public.draft_settings
for each row execute procedure public.set_updated_at();

drop trigger if exists draft_comments_updated_at on public.draft_comments;
create trigger draft_comments_updated_at before update on public.draft_comments
for each row execute procedure public.set_updated_at();

alter table public.contracts enable row level security;
alter table public.contract_draft enable row level security;
alter table public.document_drafts enable row level security;
alter table public.draft_settings enable row level security;
alter table public.draft_collaborators enable row level security;
alter table public.draft_comments enable row level security;

drop policy if exists "draft owners create contracts" on public.contracts;
drop policy if exists "draft participants view contracts" on public.contracts;
drop policy if exists "draft owners update contracts" on public.contracts;
drop policy if exists "draft owners delete contracts" on public.contracts;
create policy "draft owners create contracts" on public.contracts for insert to authenticated
with check (type = 'draft' and user_id = auth.uid());
create policy "draft participants view contracts" on public.contracts for select to authenticated
using (type = 'draft' and public.can_view_draft(id));
create policy "draft owners update contracts" on public.contracts for update to authenticated
using (type = 'draft' and user_id = auth.uid()) with check (type = 'draft' and user_id = auth.uid());
create policy "draft owners delete contracts" on public.contracts for delete to authenticated
using (type = 'draft' and user_id = auth.uid());

drop policy if exists "draft participants view content" on public.contract_draft;
drop policy if exists "draft editors manage content" on public.contract_draft;
create policy "draft participants view content" on public.contract_draft for select to authenticated
using (public.can_view_draft(contract_id));
create policy "draft editors manage content" on public.contract_draft for all to authenticated
using (public.can_edit_draft(contract_id)) with check (public.can_edit_draft(contract_id));

drop policy if exists "members view drafts" on public.document_drafts;
drop policy if exists "editors manage drafts" on public.document_drafts;
drop policy if exists "draft participants view versions" on public.document_drafts;
drop policy if exists "draft editors create versions" on public.document_drafts;
create policy "draft participants view versions" on public.document_drafts for select to authenticated
using (public.can_view_draft(document_id));
create policy "draft editors create versions" on public.document_drafts for insert to authenticated
with check (created_by = auth.uid() and public.can_edit_draft(document_id));

create policy "draft participants view settings" on public.draft_settings for select to authenticated
using (public.can_view_draft(contract_id));
create policy "draft owners manage settings" on public.draft_settings for all to authenticated
using (public.is_draft_owner(contract_id)) with check (public.is_draft_owner(contract_id));

create policy "draft participants view collaborators" on public.draft_collaborators for select to authenticated
using (public.can_view_draft(contract_id));
create policy "draft owners manage collaborators" on public.draft_collaborators for all to authenticated
using (public.is_draft_owner(contract_id)) with check (public.is_draft_owner(contract_id) and invited_by = auth.uid());

create policy "draft participants view comments" on public.draft_comments for select to authenticated
using (public.can_view_draft(contract_id));
create policy "draft participants add comments" on public.draft_comments for insert to authenticated
with check (author_id = auth.uid() and public.can_comment_draft(contract_id));
create policy "comment authors update comments" on public.draft_comments for update to authenticated
using (author_id = auth.uid()) with check (author_id = auth.uid() and public.can_comment_draft(contract_id));
create policy "comment authors delete comments" on public.draft_comments for delete to authenticated
using (author_id = auth.uid());
