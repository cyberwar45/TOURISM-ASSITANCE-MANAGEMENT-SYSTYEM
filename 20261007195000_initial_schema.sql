create extension if not exists pgcrypto;

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.trips (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users (id) on delete cascade,
    city text not null,
    days integer not null check (days between 1 and 3),
    budget numeric(12, 2) not null default 0 check (budget between 0 and 100000000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.trip_stops (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid not null references public.trips (id) on delete cascade,
    name text not null,
    detail text not null default '',
    trip_day integer not null check (trip_day between 1 and 3),
    stop_time text not null check (stop_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create table public.expenses (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid not null references public.trips (id) on delete cascade,
    description text not null check (char_length(description) between 1 and 80),
    amount numeric(12, 2) not null check (amount between 0.01 and 10000000),
    people_count integer not null check (people_count between 1 and 100),
    created_at timestamptz not null default now()
);

create table public.packing_items (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users (id) on delete cascade,
    trip_id uuid references public.trips (id) on delete cascade,
    label text not null check (char_length(label) between 1 and 120),
    is_checked boolean not null default false,
    created_at timestamptz not null default now()
);

create table public.reviews (
    id uuid primary key default gen_random_uuid(),
    author_id uuid not null references auth.users (id) on delete cascade,
    place text not null check (char_length(place) between 1 and 160),
    rating integer not null check (rating between 1 and 5),
    body text not null check (char_length(body) between 1 and 500),
    video_path text,
    status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (video_path is null or char_length(video_path) <= 500)
);

create table public.travel_documents (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users (id) on delete cascade,
    trip_id uuid references public.trips (id) on delete cascade,
    storage_path text not null unique,
    file_name text not null check (char_length(file_name) between 1 and 255),
    mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
    size_bytes bigint not null check (size_bytes between 1 and 15728640),
    created_at timestamptz not null default now()
);

create index trips_owner_updated_idx on public.trips (owner_id, updated_at desc);
create index trip_stops_trip_order_idx on public.trip_stops (trip_id, trip_day, sort_order);
create index expenses_trip_created_idx on public.expenses (trip_id, created_at desc);
create index packing_items_owner_trip_idx on public.packing_items (owner_id, trip_id);
create index reviews_public_created_idx on public.reviews (created_at desc) where status = 'published';
create index travel_documents_owner_created_idx on public.travel_documents (owner_id, created_at desc);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
    return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_stops enable row level security;
alter table public.expenses enable row level security;
alter table public.packing_items enable row level security;
alter table public.reviews enable row level security;
alter table public.travel_documents enable row level security;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can manage their own trips"
on public.trips for all to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Users can manage stops on their own trips"
on public.trip_stops for all to authenticated
using (exists (
    select 1 from public.trips
    where trips.id = trip_stops.trip_id
      and trips.owner_id = (select auth.uid())
))
with check (exists (
    select 1 from public.trips
    where trips.id = trip_stops.trip_id
      and trips.owner_id = (select auth.uid())
      and trip_stops.trip_day <= trips.days
));

create policy "Users can manage expenses on their own trips"
on public.expenses for all to authenticated
using (exists (
    select 1 from public.trips
    where trips.id = expenses.trip_id
      and trips.owner_id = (select auth.uid())
))
with check (exists (
    select 1 from public.trips
    where trips.id = expenses.trip_id
      and trips.owner_id = (select auth.uid())
));

create policy "Users can manage their packing items"
on public.packing_items for all to authenticated
using ((select auth.uid()) = owner_id)
with check (
    (select auth.uid()) = owner_id
    and (
        trip_id is null
        or exists (
            select 1 from public.trips
            where trips.id = packing_items.trip_id
              and trips.owner_id = (select auth.uid())
        )
    )
);

create policy "Anyone can read published reviews"
on public.reviews for select to anon, authenticated
using (status = 'published' or (select auth.uid()) = author_id);
create policy "Authenticated users can submit reviews for moderation"
on public.reviews for insert to authenticated
with check ((select auth.uid()) = author_id and status = 'pending');
create policy "Authors can update their pending reviews"
on public.reviews for update to authenticated
using ((select auth.uid()) = author_id and status = 'pending')
with check ((select auth.uid()) = author_id and status = 'pending');
create policy "Authors can delete their own reviews"
on public.reviews for delete to authenticated
using ((select auth.uid()) = author_id);

create policy "Users can manage their own document metadata"
on public.travel_documents for all to authenticated
using ((select auth.uid()) = owner_id)
with check (
    (select auth.uid()) = owner_id
    and storage_path like (select auth.uid())::text || '/%'
    and (
        trip_id is null
        or exists (
            select 1 from public.trips
            where trips.id = travel_documents.trip_id
              and trips.owner_id = (select auth.uid())
        )
    )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    ('travel-documents', 'travel-documents', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
    ('review-videos', 'review-videos', false, 52428800, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload documents into their own folder"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'travel-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Users can read their own documents"
on storage.objects for select to authenticated
using (
    bucket_id = 'travel-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Users can delete their own documents"
on storage.objects for delete to authenticated
using (
    bucket_id = 'travel-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload review videos into their own folder"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'review-videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Users can read videos for published reviews or their own reviews"
on storage.objects for select to anon, authenticated
using (
    bucket_id = 'review-videos'
    and exists (
        select 1 from public.reviews
        where reviews.video_path = storage.objects.name
          and (
              reviews.status = 'published'
              or reviews.author_id = (select auth.uid())
          )
    )
);
create policy "Users can delete videos in their own folder"
on storage.objects for delete to authenticated
using (
    bucket_id = 'review-videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);
