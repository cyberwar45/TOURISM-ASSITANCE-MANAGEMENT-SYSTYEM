create table public.saved_trips (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users (id) on delete cascade,
    city text not null,
    days integer not null check (days between 1 and 3),
    snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (owner_id, city, days)
);

create index saved_trips_owner_updated_idx on public.saved_trips (owner_id, updated_at desc);

alter table public.saved_trips enable row level security;

create policy "Users can manage their own saved trip snapshots"
on public.saved_trips for all to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
