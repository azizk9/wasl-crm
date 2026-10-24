/*
# Add follow-up fields to customers table

1. Changes to existing tables
- `customers.next_action` (text, default '') — a short description of the next
  follow-up action the user plans to take with this customer (e.g. "إرسال عرض سعر", "اتصال متابعة").
- `customers.next_follow_up_at` (timestamptz, nullable) — the scheduled date/time
  for the next follow-up. When it arrives or passes, the customer appears in the
  Follow-Up Center as needing action today or as overdue.

2. Security
- No new tables. Existing RLS policies on `customers` already cover
  SELECT/INSERT/UPDATE/DELETE scoped to the owner via `auth.uid() = owner_id`.
- The existing `GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated`
  already covers the new columns (table-level grant applies to all current columns).
- No new policies needed.

3. Important notes
- Both columns are nullable/defaulted so existing rows are unaffected.
- The `set_updated_at` trigger already on `customers` will bump `updated_at`
  whenever these fields are modified.
- Idempotent: uses `IF NOT EXISTS` guards via a DO block.
*/

do $$ begin
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'customers' and column_name = 'next_action') then
    alter table public.customers add column next_action text not null default '';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'customers' and column_name = 'next_follow_up_at') then
    alter table public.customers add column next_follow_up_at timestamptz;
  end if;
end $$;

create index if not exists idx_customers_follow_up on public.customers(owner_id, next_follow_up_at);
