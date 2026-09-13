-- Atomic RPC Function for saving chat and chat_conversations within a single PostgreSQL transaction.
-- If creating a new chat session (p_chat_id is null), inserts into chats first.
-- Then inserts the question & answer pair into chat_conversations.
-- If any part fails, PostgreSQL automatically rolls back the entire transaction.

create or replace function public.save_chat_conversation(
  p_user_id uuid,
  p_question text,
  p_answer text,
  p_chat_id uuid default null,
  p_title text default null,
  p_last_interaction_id text default null,
  p_metadata jsonb default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_chat_id uuid := p_chat_id;
  v_conversation_id uuid;
  v_title text;
begin
  -- 1. Create new chat record if chat_id is not provided
  if v_chat_id is null then
    v_title := coalesce(nullif(trim(p_title), ''), substring(trim(p_question) from 1 for 200));
    if v_title is null or v_title = '' then
      v_title := 'Percakapan Baru';
    end if;

    insert into public.chats (
      user_id,
      title,
      last_interaction_id
    ) values (
      p_user_id,
      v_title,
      p_last_interaction_id
    )
    returning id into v_chat_id;
  else
    -- Update existing chat session last_interaction_id and updated_at
    update public.chats
    set
      last_interaction_id = coalesce(p_last_interaction_id, last_interaction_id),
      updated_at = now()
    where id = v_chat_id and user_id = p_user_id;

    if not found then
      raise exception 'Percakapan tidak ditemukan atau Anda tidak memiliki akses.';
    end if;
  end if;

  -- 2. Insert chat_conversations entry
  insert into public.chat_conversations (
    chat_id,
    question,
    answer,
    metadata
  ) values (
    v_chat_id,
    p_question,
    p_answer,
    p_metadata
  )
  returning id into v_conversation_id;

  return jsonb_build_object(
    'chat_id', v_chat_id,
    'conversation_id', v_conversation_id,
    'success', true
  );
exception
  when others then
    raise exception 'Gagal menyimpan percakapan AI: %', sqlerrm;
end;
$$;

grant execute on function public.save_chat_conversation to authenticated;
grant execute on function public.save_chat_conversation to service_role;
