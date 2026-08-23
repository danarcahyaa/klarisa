-- Keep each draft discussion attached to the exact snapshot it was created on.
-- This migration is intentionally limited to the draft collaboration domain.
alter table public.draft_comments
  add column if not exists document_version_id uuid
  references public.document_drafts(id) on delete set null;

create index if not exists draft_comments_document_version_idx
  on public.draft_comments(document_version_id, created_at);

-- Attach legacy comments to the closest snapshot that existed when the comment was created.
update public.draft_comments as comment
set document_version_id = (
  select version.id
  from public.document_drafts as version
  where version.document_id = comment.contract_id
  order by
    case when version.created_at <= comment.created_at then 0 else 1 end,
    version.created_at desc
  limit 1
)
where comment.document_version_id is null;
