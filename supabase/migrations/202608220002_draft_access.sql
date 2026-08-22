alter table public.contracts enable row level security;
alter table public.contract_draft enable row level security;

drop policy if exists "Users can manage their contracts" on public.contracts;
create policy "Users can manage their contracts"
on public.contracts for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can manage their contract drafts" on public.contract_draft;
create policy "Users can manage their contract drafts"
on public.contract_draft for all to authenticated
using (
  exists (
    select 1 from public.contracts
    where contracts.id = contract_draft.contract_id
      and contracts.user_id = auth.uid()
      and contracts.type = 'draft'
  )
)
with check (
  exists (
    select 1 from public.contracts
    where contracts.id = contract_draft.contract_id
      and contracts.user_id = auth.uid()
      and contracts.type = 'draft'
  )
);
