create table public.user_preferences (
    owner_id uuid primary key references auth.users (id) on delete cascade,
    app_language text not null default 'en'
        check (app_language ~ '^[a-z]{2,3}$'),
    translator_language text not null default 'en'
        check (translator_language in ('en', 'hi', 'es', 'fr', 'de', 'ar', 'pt', 'ja', 'zh')),
    planner_city text not null default 'Jaipur'
        check (planner_city in ('Jaipur', 'Mumbai', 'Delhi')),
    planner_style text not null default 'Balanced day'
        check (planner_style in ('Balanced day', 'Food first', 'Slow explorer')),
    updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can manage their own preferences"
on public.user_preferences for all to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.user_preferences to authenticated;
revoke all on public.user_preferences from anon;
