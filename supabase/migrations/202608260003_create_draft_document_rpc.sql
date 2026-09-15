-- Atomic RPC Function for creating contract and contract_draft within a single PostgreSQL transaction.
-- If any part of the insertion fails (e.g., contract_draft failure),
-- PostgreSQL automatically rolls back all changes to the contracts table.

create or replace function public.create_draft_document(
  p_user_id uuid,
  p_title text,
  p_content text default '',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_contract_id uuid;
  v_draft_id uuid;
  v_title text;
begin
  v_title := coalesce(nullif(trim(p_title), ''), 'Draf Surat Perjanjian');

  -- 1. Insert contract record
  insert into public.contracts (
    user_id,
    title,
    type,
    is_pinned
  ) values (
    p_user_id,
    v_title,
    'draft',
    false
  )
  returning id into v_contract_id;

  -- 2. Insert contract_draft record
  insert into public.contract_draft (
    contract_id,
    content,
    metadata
  ) values (
    v_contract_id,
    p_content,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_draft_id;

  return jsonb_build_object(
    'contract_id', v_contract_id,
    'draft_id', v_draft_id,
    'title', v_title,
    'success', true
  );
exception
  when others then
    raise exception 'Gagal membuat draf kontrak: %', sqlerrm;
end;
$$;

grant execute on function public.create_draft_document to authenticated;
grant execute on function public.create_draft_document to service_role;
