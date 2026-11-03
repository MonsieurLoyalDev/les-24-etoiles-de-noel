-- Private Advent 2026. Run as postgres through Supabase migrations.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.app_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('player','admin'))
);
alter table public.app_members enable row level security;
revoke all on public.app_members from public, anon, authenticated;
grant select on public.app_members to authenticated;
create policy member_self on public.app_members for select to authenticated using (user_id=(select auth.uid()));

create function private.is_member() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.app_members where user_id=auth.uid());
$$;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.app_members where user_id=auth.uid() and role='admin');
$$;
create function private.server_now() returns timestamptz language sql stable set search_path='' as $$select pg_catalog.now();$$;
create function private.unlocked_at(d integer, instant timestamptz) returns boolean language sql immutable set search_path='' as $$
 select case when d between 1 and 24 then instant >= pg_catalog.make_timestamptz(2026,12,d,0,0,0,'Europe/Paris') else false end;
$$;
create function private.day_unlocked(d integer) returns boolean language sql stable security definer set search_path='' as $$
 select private.unlocked_at(d,private.server_now());
$$;

create table public.advent_days (
 day integer primary key check(day between 1 and 24),
 content jsonb not null check(jsonb_typeof(content)='object'),
 version integer not null default 1 check(version>0),
 updated_at timestamptz not null default now()
);
create table private.advent_rules (
 day integer primary key references public.advent_days(day) on delete cascade,
 rules jsonb not null check(jsonb_typeof(rules)='object')
);
alter table public.advent_days enable row level security;
alter table private.advent_rules enable row level security;
revoke all on public.advent_days from public, anon, authenticated;
revoke all on private.advent_rules from public, anon, authenticated;
grant select on public.advent_days to authenticated;
create policy unlocked_days on public.advent_days for select to authenticated using (
 private.is_admin() or (private.is_member() and private.day_unlocked(day))
);

create table public.advent_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 day integer not null references public.advent_days(day),
 mode text not null check(mode in ('live','preview')),
 run_id uuid not null default gen_random_uuid(),
 content_version integer not null,
 checked jsonb not null default '[]'::jsonb,
 answers jsonb not null default '{}'::jsonb,
 memory jsonb not null default '{}'::jsonb,
 completed_at timestamptz,
 updated_at timestamptz not null default now(),
 primary key(user_id,day,mode)
);
alter table public.advent_progress enable row level security;
revoke all on public.advent_progress from public, anon, authenticated;
grant select on public.advent_progress to authenticated;
create policy own_progress on public.advent_progress for select to authenticated using (
 user_id=(select auth.uid()) and private.is_member() and (mode='live' or private.is_admin())
);

create function private.assert_day(d integer, preview boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_member() then raise exception 'Accès privé requis' using errcode='42501'; end if;
 if d not between 1 and 24 then raise exception 'Jour invalide'; end if;
 if preview then
  if not private.is_admin() then raise exception 'Aperçu administrateur uniquement' using errcode='42501'; end if;
 elsif not private.day_unlocked(d) then raise exception 'Journée verrouillée' using errcode='42501';
 end if;
end;$$;

create function private.run_json(p public.advent_progress) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('day',p.day,'runId',p.run_id,'contentVersion',p.content_version,'checked',p.checked,'complete',p.completed_at is not null,'completedAt',p.completed_at,'values',p.answers,'memory',p.memory);
$$;

create function private.evidence_valid(s jsonb,r jsonb,v jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare k text:=s->>'kind'; x jsonb; n text:='start'; edge jsonb; count_items integer; expected jsonb:=r->'expected';
begin
 if v is null or v='null'::jsonb or r is null or s is null or octet_length(v::text)>50000 then return false; end if;
 if r ? 'expected' then
  if jsonb_typeof(expected)='array' then
   if jsonb_typeof(v)<>'array' then return false; end if;
   if k in ('sequence','melody','photo','connect') then return v=expected; end if;
   return array(select value::text from jsonb_array_elements(v) order by value::text)=array(select value::text from jsonb_array_elements(expected) order by value::text);
  elsif jsonb_typeof(expected)='string' then return jsonb_typeof(v)='string' and lower(btrim(v#>>'{}'))=lower(btrim(expected#>>'{}'));
  else return v=expected; end if;
 end if;
 if k in ('read','collect','decorate','hunt') then
  if jsonb_typeof(v)<>'array' then return false; end if;
  select count(distinct value::text) into count_items from jsonb_array_elements(v);
  if count_items<>jsonb_array_length(v) or count_items<coalesce((r->>'minimum')::int,(s->>'minimum')::int,jsonb_array_length(s->'items'),1) then return false; end if;
  for x in select value from jsonb_array_elements(v) loop
   if jsonb_typeof(x)<>'string' or not exists(select 1 from jsonb_array_elements(s->'items') i where i->>'id'=x#>>'{}') then return false; end if;
  end loop; return true;
 elsif k='choice' then return jsonb_typeof(v)='string' and exists(select 1 from jsonb_array_elements(s->'options') i where i->>'id'=v#>>'{}');
 elsif k in ('write','input') then return jsonb_typeof(v)='string' and length(btrim(v#>>'{}'))>=coalesce((r->>'minLength')::int,12) and length(v#>>'{}')<=10000;
 elsif k='media' then return v='true'::jsonb;
 elsif k='voucher' then
  if jsonb_typeof(v)<>'object' or coalesce(length(btrim(v->>'recipient')),0)<1 or length(v->>'recipient')>80 or coalesce(v->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
  perform (v->>'date')::date;
  return exists(select 1 from jsonb_array_elements(s->'options') i where i->>'id'=v->>'option');
 elsif k='story' then
  if jsonb_typeof(v)<>'array' or jsonb_array_length(v)<1 or jsonb_array_length(v)>50 then return false; end if;
  for x in select value from jsonb_array_elements(v) loop
   edge:=null;
   select c into edge from jsonb_array_elements(s->'story'->n->'choices') c where n||':'||(c->>'id')=x#>>'{}' limit 1;
   if edge is null then return false; end if;
   n:=edge->>'next';
  end loop; return n='end';
 elsif k='scene' then return v='4'::jsonb;
 end if;
 return false;
exception when others then return false;
end;$$;

create function public.advent_status(p_preview boolean default false) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_member() or (p_preview and not private.is_admin()) then raise exception 'Accès privé requis' using errcode='42501'; end if;
 select jsonb_agg(jsonb_build_object('day',d.day,'unlocked',(p_preview or private.day_unlocked(d.day)) and a.day is not null,'complete',p.completed_at is not null,'run',case when p.day is not null and (p_preview or private.day_unlocked(d.day)) then private.run_json(p) else null end) order by d.day) into result
 from generate_series(1,24) d(day) left join public.advent_days a on a.day=d.day
 left join public.advent_progress p on p.day=d.day and p.user_id=auth.uid() and p.mode=case when p_preview then 'preview' else 'live' end;
 return result;
end;$$;
create function public.advent_day(p_day integer,p_preview boolean default false) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.assert_day(p_day,p_preview);
 select content into result from public.advent_days where day=p_day;
 if result is null then raise exception 'Journée non configurée'; end if;
 return result;
end;$$;
create function public.advent_start(p_day integer,p_preview boolean default false,p_replay boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.advent_progress; v integer; m text:=case when p_preview then 'preview' else 'live' end;
begin
 perform private.assert_day(p_day,p_preview);
 select version into v from public.advent_days where day=p_day;
 if v is null then raise exception 'Journée non configurée'; end if;
 insert into public.advent_progress(user_id,day,mode,content_version) values(auth.uid(),p_day,m,v) on conflict do nothing;
 select * into p from public.advent_progress where user_id=auth.uid() and day=p_day and mode=m for update;
 if p_replay or p.content_version<>v then
  update public.advent_progress set run_id=gen_random_uuid(),content_version=v,checked='[]',answers='{}',updated_at=private.server_now() where user_id=auth.uid() and day=p_day and mode=m returning * into p;
 end if;
 return private.run_json(p);
end;$$;
create function public.advent_check_step(p_day integer,p_run uuid,p_step text,p_value jsonb,p_preview boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.advent_progress; content jsonb; rules jsonb; version integer; s jsonb; m text:=case when p_preview then 'preview' else 'live' end; final_step boolean;
begin
 perform private.assert_day(p_day,p_preview);
 select a.content,a.version,r.rules into content,version,rules from public.advent_days a join private.advent_rules r using(day) where a.day=p_day;
 select * into p from public.advent_progress where user_id=auth.uid() and day=p_day and mode=m for update;
 if p.run_id is null or p.run_id<>p_run or p.content_version<>version then raise exception 'Reprendre la journée : version ou session modifiée'; end if;
 if p.checked ? p_step then return jsonb_build_object('accepted',true,'run',private.run_json(p)); end if;
 s:=content->'steps'->jsonb_array_length(p.checked);
 if s is null or s->>'id'<>p_step or not coalesce(private.evidence_valid(s,rules->p_step,p_value),false) then return jsonb_build_object('accepted',false,'run',private.run_json(p)); end if;
 final_step:=jsonb_array_length(p.checked)+1=jsonb_array_length(content->'steps');
 update public.advent_progress set checked=checked||jsonb_build_array(p_step),answers=answers||jsonb_build_object(p_step,p_value),
  memory=case when final_step then answers||jsonb_build_object(p_step,p_value) else memory end,
  completed_at=case when final_step then coalesce(completed_at,private.server_now()) else completed_at end,updated_at=private.server_now()
 where user_id=auth.uid() and day=p_day and mode=m returning * into p;
 return jsonb_build_object('accepted',true,'run',private.run_json(p));
end;$$;

create function public.advent_admin_get(p_day integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_admin() then raise exception 'Administrateur requis' using errcode='42501'; end if;
 select jsonb_build_object('content',a.content,'rules',r.rules) into result from public.advent_days a join private.advent_rules r using(day) where a.day=p_day;
 return result;
end;$$;
create function public.advent_admin_save(p_content jsonb,p_rules jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare d integer; s jsonb; v integer; seen text[]:=array[]::text[]; path text;
begin
 if not private.is_admin() then raise exception 'Administrateur requis' using errcode='42501'; end if;
 d:=(p_content->>'day')::int;
 if d is null or d not between 1 and 24 or jsonb_typeof(p_rules) is distinct from 'object' or octet_length(p_content::text)+octet_length(p_rules::text)>200000
 or coalesce(length(btrim(p_content->>'title')),0)<1 or jsonb_typeof(p_content->'intro') is distinct from 'string' or jsonb_typeof(p_content->'reward') is distinct from 'string'
 or coalesce(p_content->>'room','') not in ('village','house','library','workshop','inn') or jsonb_typeof(p_content->'steps') is distinct from 'array' or jsonb_array_length(p_content->'steps') not between 1 and 12 then raise exception 'Journée invalide'; end if;
 for s in select value from jsonb_array_elements(p_content->'steps') loop
  if coalesce(s->>'id','') !~ '^[a-z0-9_-]{1,40}$' or (s->>'id')=any(seen) or not (p_rules ? (s->>'id')) or s ?| array['expected','answer','rules']
  or coalesce(s->>'kind','') not in ('read','choice','input','write','collect','sequence','melody','photo','memory','wrap','media','hunt','decorate','story','voucher','connect','scene')
  or jsonb_typeof(s->'prompt') is distinct from 'string' then raise exception 'Étape invalide'; end if;
  seen:=array_append(seen,s->>'id');path:=s->>'mediaPath';
  if path is not null and path not like d::text||'/%' and path not like '/demo/%' then raise exception 'Chemin média invalide'; end if;
 end loop;
 select version into v from public.advent_days where day=d for update;
 if v is not null and v is distinct from (p_content->>'version')::int then raise exception 'Version modifiée : recharger avant d’enregistrer'; end if;
 v:=coalesce(v,0)+1;
 insert into public.advent_days(day,content,version) values(d,jsonb_set(p_content,'{version}',to_jsonb(v)),v)
 on conflict(day) do update set content=excluded.content,version=excluded.version,updated_at=private.server_now();
 insert into private.advent_rules(day,rules) values(d,p_rules) on conflict(day) do update set rules=excluded.rules;
 return v;
end;$$;

-- Explicit permissions: SECURITY DEFINER does not imply permission to call it.
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_member(),private.is_admin(),private.day_unlocked(integer) to authenticated;
revoke all on function public.advent_status(boolean),public.advent_day(integer,boolean),public.advent_start(integer,boolean,boolean),public.advent_check_step(integer,uuid,text,jsonb,boolean),public.advent_admin_get(integer),public.advent_admin_save(jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.advent_status(boolean),public.advent_day(integer,boolean),public.advent_start(integer,boolean,boolean),public.advent_check_step(integer,uuid,text,jsonb,boolean),public.advent_admin_get(integer),public.advent_admin_save(jsonb,jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('advent-media','advent-media',false,52428800,array['image/png','image/jpeg','image/webp','video/mp4','video/webm','audio/mpeg','audio/ogg']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create function private.media_visible(path text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare d text:=split_part(path,'/',1);
begin
 if private.is_admin() then return true; end if;
 if not private.is_member() or d !~ '^([1-9]|1[0-9]|2[0-4])$' then return false; end if;
 return private.day_unlocked(d::int);
end;$$;
revoke all on function private.media_visible(text) from public,anon,authenticated;
grant execute on function private.media_visible(text) to authenticated;
create policy advent_private_read on storage.objects for select to authenticated using(bucket_id='advent-media' and private.media_visible(name));
create policy advent_admin_insert on storage.objects for insert to authenticated with check(bucket_id='advent-media' and private.is_admin() and split_part(name,'/',1) ~ '^([1-9]|1[0-9]|2[0-4])$');
create policy advent_admin_update on storage.objects for update to authenticated using(bucket_id='advent-media' and private.is_admin()) with check(bucket_id='advent-media' and private.is_admin() and split_part(name,'/',1) ~ '^([1-9]|1[0-9]|2[0-4])$');
create policy advent_admin_delete on storage.objects for delete to authenticated using(bucket_id='advent-media' and private.is_admin());
