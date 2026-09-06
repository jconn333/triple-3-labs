-- One RPC transaction: blockers or any later FK failure roll back every delete.
create function public.delete_contact_safely(p_contact_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  account_ids uuid[];
  commitment_count bigint;
  ticket_count bigint;
  link_count bigint;
begin
  -- FOR UPDATE conflicts with FK key-share locks from new child inserts.
  perform id from public.contacts where id = p_contact_id for update;
  if not found then
    raise sqlstate 'PT404' using message = 'Contact not found';
  end if;
  perform id from public.accounts where contact_id = p_contact_id order by id for update;
  select coalesce(array_agg(id), '{}'::uuid[]) into account_ids
    from public.accounts where contact_id = p_contact_id;
  perform id from public.contracts where account_id = any(account_ids) order by id for update;

  -- Inactive commitments also block: their FK still references the account.
  select count(*) into commitment_count from public.commitments
    where account_id = any(account_ids)
       or contract_id in (select id from public.contracts where account_id = any(account_ids));
  select count(*) into ticket_count from public.tickets
    where account_id = any(account_ids) or contact_id = p_contact_id;
  select count(*) into link_count from public.client_links
    where account_id = any(account_ids);

  if commitment_count > 0 or ticket_count > 0 or link_count > 0 then
    raise sqlstate 'PT409' using message = format(
      'Cannot delete: this client has %s commitments / %s tickets / %s client links — resolve those first. Nothing was deleted.',
      commitment_count, ticket_count, link_count
    );
  end if;

  delete from public.contracts where account_id = any(account_ids);
  delete from public.accounts where id = any(account_ids);
  delete from public.ai_agent_logs where contact_id = p_contact_id;
  delete from public.activities where contact_id = p_contact_id;
  delete from public.deals where contact_id = p_contact_id;
  delete from public.contacts where id = p_contact_id;
end;
$$;

revoke all on function public.delete_contact_safely(uuid) from public, anon;
grant execute on function public.delete_contact_safely(uuid) to authenticated;
