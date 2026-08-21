create extension if not exists "pgcrypto";

create type public.document_status as enum ('draft', 'processing', 'review_ready', 'archived');
create type public.finding_severity as enum ('critical', 'attention', 'fair');
create type public.member_role as enum ('owner', 'editor', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 200),
  source_file_name text,
  storage_path text,
  status public.document_status not null default 'draft',
  review_score smallint check (review_score between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.review_findings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  clause_number text,
  clause_title text,
  quoted_text text not null,
  severity public.finding_severity not null,
  explanation text not null,
  legal_basis text,
  suggested_revision text,
  position_start integer,
  position_end integer,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (position_start is null or position_start >= 0),
  check (position_end is null or position_end >= position_start)
);

create table public.document_drafts (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  title text not null,
  body text not null,
  version integer not null default 1 check (version > 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, version)
);

create table public.finding_comments (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.review_findings(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_workspace_id_idx on public.documents(workspace_id, updated_at desc);
create index review_findings_document_id_idx on public.review_findings(document_id, severity);
create index finding_comments_finding_id_idx on public.finding_comments(finding_id, created_at);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_editor(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger workspaces_updated_at before update on public.workspaces for each row execute procedure public.set_updated_at();
create trigger documents_updated_at before update on public.documents for each row execute procedure public.set_updated_at();
create trigger findings_updated_at before update on public.review_findings for each row execute procedure public.set_updated_at();
create trigger drafts_updated_at before update on public.document_drafts for each row execute procedure public.set_updated_at();
create trigger comments_updated_at before update on public.finding_comments for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.documents enable row level security;
alter table public.review_findings enable row level security;
alter table public.document_drafts enable row level security;
alter table public.finding_comments enable row level security;

create policy "profiles visible to signed-in users" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "members view workspaces" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "users create workspaces" on public.workspaces for insert to authenticated with check (owner_id = auth.uid());
create policy "owners update workspaces" on public.workspaces for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete workspaces" on public.workspaces for delete to authenticated using (owner_id = auth.uid());

create policy "members view membership" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "owners manage membership" on public.workspace_members for all to authenticated using (
  exists (select 1 from public.workspaces where id = workspace_id and owner_id = auth.uid())
) with check (
  exists (select 1 from public.workspaces where id = workspace_id and owner_id = auth.uid())
);

create policy "members view documents" on public.documents for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "editors create documents" on public.documents for insert to authenticated with check (public.is_workspace_editor(workspace_id) and created_by = auth.uid());
create policy "editors update documents" on public.documents for update to authenticated using (public.is_workspace_editor(workspace_id)) with check (public.is_workspace_editor(workspace_id));
create policy "editors delete documents" on public.documents for delete to authenticated using (public.is_workspace_editor(workspace_id));

create policy "members view findings" on public.review_findings for select to authenticated using (exists (select 1 from public.documents d where d.id = document_id and public.is_workspace_member(d.workspace_id)));
create policy "editors manage findings" on public.review_findings for all to authenticated using (exists (select 1 from public.documents d where d.id = document_id and public.is_workspace_editor(d.workspace_id))) with check (exists (select 1 from public.documents d where d.id = document_id and public.is_workspace_editor(d.workspace_id)));
create policy "members view drafts" on public.document_drafts for select to authenticated using (exists (select 1 from public.documents d where d.id = document_id and public.is_workspace_member(d.workspace_id)));
create policy "editors manage drafts" on public.document_drafts for all to authenticated using (exists (select 1 from public.documents d where d.id = document_id and public.is_workspace_editor(d.workspace_id))) with check (exists (select 1 from public.documents d where d.id = document_id and public.is_workspace_editor(d.workspace_id)));
create policy "members view comments" on public.finding_comments for select to authenticated using (exists (select 1 from public.review_findings f join public.documents d on d.id = f.document_id where f.id = finding_id and public.is_workspace_member(d.workspace_id)));
create policy "members add comments" on public.finding_comments for insert to authenticated with check (author_id = auth.uid() and exists (select 1 from public.review_findings f join public.documents d on d.id = f.document_id where f.id = finding_id and public.is_workspace_member(d.workspace_id)));
create policy "authors update comments" on public.finding_comments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "authors delete comments" on public.finding_comments for delete to authenticated using (author_id = auth.uid());
