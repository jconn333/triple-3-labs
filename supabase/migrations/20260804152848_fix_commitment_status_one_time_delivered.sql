create or replace view public.vw_commitment_status as
select c.*,
  d.delivered_at as last_delivered,
  d.output_url   as last_output,
  case
    when not c.active then 'inactive'
    when c.kind = 'continuous' then 'see_canaries'
    when c.kind = 'one_time' and d.delivered_at is not null then 'delivered'
    when c.next_due is null then 'unscheduled'
    when current_date >  c.next_due + c.grace_days then 'OVERDUE'
    when current_date >= c.next_due - 3 then 'DUE_SOON'
    else 'on_track'
  end as status
from public.commitments c
left join lateral (
  select * from public.deliveries
  where commitment_id = c.id
  order by delivered_at desc limit 1
) d on true;;
