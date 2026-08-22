-- Shared users may comment and review a draft, but only its owner may edit it.
update public.draft_collaborators
set role = 'commenter'::public.draft_collaborator_role
where role <> 'commenter'::public.draft_collaborator_role;

create or replace function public.can_edit_draft(target_contract_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_draft_owner(target_contract_id);
$$;

create or replace function public.can_comment_draft(target_contract_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_draft_owner(target_contract_id) or exists (
    select 1 from public.draft_collaborators
    where contract_id = target_contract_id and user_id = auth.uid()
  );
$$;
