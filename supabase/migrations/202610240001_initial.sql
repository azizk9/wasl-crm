-- Wasl CRM: isolated single-user workspace per authenticated user.
-- Run once in Supabase SQL Editor on a NEW Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 160),
  phone text not null default '',
  email text not null default '',
  source text not null default 'Other' check (source in ('Instagram','WhatsApp','Facebook','Website','Referral','Other')),
  status text not null default 'New' check (status in ('New','Contacted','Interested','Customer','Inactive')),
  notes text not null default '',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null,
  title text not null check (char_length(trim(title)) between 2 and 180),
  value numeric(14,2) not null default 0 check (value >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  stage text not null default 'New Lead' check (stage in ('New Lead','Contacted','Qualified','Proposal','Negotiation','Won','Lost')),
  expected_close_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id, owner_id),
  constraint deals_customer_owner_fk foreign key (customer_id, owner_id)
    references public.customers(id, owner_id) on delete cascade
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid,
  deal_id uuid,
  title text not null check (char_length(trim(title)) between 2 and 180),
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  status text not null default 'Pending' check (status in ('Pending','Completed')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_customer_owner_fk foreign key (customer_id, owner_id)
    references public.customers(id, owner_id) on delete set null (customer_id),
  constraint tasks_deal_owner_fk foreign key (deal_id, owner_id)
    references public.deals(id, owner_id) on delete set null (deal_id)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null,
  title text not null check (char_length(trim(title)) between 2 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'Scheduled' check (status in ('Scheduled','Completed','Cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_appointment_range check (ends_at > starts_at),
  constraint appointments_customer_owner_fk foreign key (customer_id, owner_id)
    references public.customers(id, owner_id) on delete cascade
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null,
  type text not null default 'Note' check (type in ('Note','Call','Message','Meeting')),
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  constraint activities_customer_owner_fk foreign key (customer_id, owner_id)
    references public.customers(id, owner_id) on delete cascade
);

create index if not exists idx_customers_owner on public.customers(owner_id, created_at desc);
create index if not exists idx_deals_owner on public.deals(owner_id, created_at desc);
create index if not exists idx_deals_customer on public.deals(customer_id);
create index if not exists idx_tasks_owner on public.tasks(owner_id, due_at);
create index if not exists idx_tasks_customer on public.tasks(customer_id);
create index if not exists idx_tasks_deal on public.tasks(deal_id);
create index if not exists idx_appointments_owner on public.appointments(owner_id, starts_at);
create index if not exists idx_appointments_customer on public.appointments(customer_id);
create index if not exists idx_activities_owner on public.activities(owner_id, created_at desc);
create index if not exists idx_activities_customer on public.activities(customer_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger deals_updated_at before update on public.deals for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill any test users created before the migration.
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name','') from auth.users
on conflict(id) do nothing;

-- Explicit privileges: anon gets NO access to business records.
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;
alter table public.appointments enable row level security;
alter table public.activities enable row level security;

revoke all on table public.profiles, public.customers, public.deals, public.tasks, public.appointments, public.activities from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.customers, public.deals, public.tasks, public.appointments, public.activities to authenticated;

create policy profiles_select on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy customers_select on public.customers for select to authenticated using ((select auth.uid()) = owner_id);
create policy customers_insert on public.customers for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy customers_update on public.customers for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy customers_delete on public.customers for delete to authenticated using ((select auth.uid()) = owner_id);

create policy deals_select on public.deals for select to authenticated using ((select auth.uid()) = owner_id);
create policy deals_insert on public.deals for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy deals_update on public.deals for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy deals_delete on public.deals for delete to authenticated using ((select auth.uid()) = owner_id);

create policy tasks_select on public.tasks for select to authenticated using ((select auth.uid()) = owner_id);
create policy tasks_insert on public.tasks for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy tasks_update on public.tasks for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy tasks_delete on public.tasks for delete to authenticated using ((select auth.uid()) = owner_id);

create policy appointments_select on public.appointments for select to authenticated using ((select auth.uid()) = owner_id);
create policy appointments_insert on public.appointments for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy appointments_update on public.appointments for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy appointments_delete on public.appointments for delete to authenticated using ((select auth.uid()) = owner_id);

create policy activities_select on public.activities for select to authenticated using ((select auth.uid()) = owner_id);
create policy activities_insert on public.activities for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy activities_update on public.activities for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy activities_delete on public.activities for delete to authenticated using ((select auth.uid()) = owner_id);
