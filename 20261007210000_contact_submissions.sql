create table public.contact_submissions (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 1 and 100),
    email text not null check (
        char_length(email) between 3 and 254
        and email = lower(btrim(email))
        and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ),
    message text not null check (char_length(message) between 1 and 3000),
    created_at timestamptz not null default now()
);

create index contact_submissions_email_created_idx
on public.contact_submissions (email, created_at desc);

alter table public.contact_submissions enable row level security;

create function public.submit_contact_message(p_name text, p_email text, p_message text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    normalized_email text;
    submission_id uuid;
    recent_submissions integer;
begin
    if p_name is null or char_length(btrim(p_name)) not between 1 and 100 then
        raise exception 'Enter a name between 1 and 100 characters.' using errcode = '22023';
    end if;
    if p_email is null or char_length(btrim(p_email)) not between 3 and 254 then
        raise exception 'Enter a valid email address.' using errcode = '22023';
    end if;
    normalized_email := lower(btrim(p_email));
    if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
        raise exception 'Enter a valid email address.' using errcode = '22023';
    end if;
    if p_message is null or char_length(btrim(p_message)) not between 1 and 3000 then
        raise exception 'Enter a message between 1 and 3000 characters.' using errcode = '22023';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(normalized_email, 0));
    select count(*)::integer
    into recent_submissions
    from public.contact_submissions
    where email = normalized_email
      and created_at > now() - interval '1 hour';

    if recent_submissions >= 3 then
        raise exception 'Too many messages from this email address. Try again later.' using errcode = 'P0001';
    end if;

    insert into public.contact_submissions (name, email, message)
    values (btrim(p_name), normalized_email, btrim(p_message))
    returning id into submission_id;

    return submission_id;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text) to anon, authenticated;
