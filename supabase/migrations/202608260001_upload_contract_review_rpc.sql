-- Atomic RPC Function for uploading contract and contract_review within a single PostgreSQL transaction.
-- If any part of the insertion fails (e.g. contract_review failure),
-- PostgreSQL automatically rolls back all changes to the contracts table.

create or replace function public.upload_contract_review(
  p_user_id uuid,
  p_title text,
  p_type text default 'review',
  p_is_pinned boolean default false,
  p_content text default '',
  p_fairness_score numeric default 0,
  p_total_clausul_risk integer default 0,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_contract_id uuid;
  v_review_id uuid;
begin
  -- 1. Insert contract record
  insert into public.contracts (
    user_id,
    title,
    type,
    is_pinned
  ) values (
    p_user_id,
    p_title,
    p_type,
    p_is_pinned
  )
  returning id into v_contract_id;

  -- 2. Insert contract_review record
  -- Automatic transaction rollback occurs if this fails
  insert into public.contract_review (
    contract_id,
    content,
    fairness_score,
    total_clausul_risk,
    metadata
  ) values (
    v_contract_id,
    p_content,
    p_fairness_score,
    p_total_clausul_risk,
    p_metadata
  )
  returning id into v_review_id;

  return jsonb_build_object(
    'contract_id', v_contract_id,
    'review_id', v_review_id,
    'success', true
  );
exception
  when others then
    raise exception 'Gagal mengunggah review kontrak: %', sqlerrm;
end;
$$;

grant execute on function public.upload_contract_review to authenticated;
grant execute on function public.upload_contract_review to service_role;
