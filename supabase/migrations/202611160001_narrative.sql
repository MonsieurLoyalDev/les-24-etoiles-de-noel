-- Narrative framework only. No episode text, media or private memories in Git.
create table private.episode_content (
 day integer not null check(day between 1 and 24), version integer not null check(version>0),
 content jsonb not null, primary key(day,version)
);
create table private.episode_releases (
 day integer primary key check(day between 1 and 24), version integer not null,
 foreign key(day,version) references private.episode_content(day,version)
);
alter table private.episode_content enable row level security;
alter table private.episode_releases enable row level security;
revoke all on private.episode_content,private.episode_releases from public,anon,authenticated;
create table public.episode_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 day integer not null check(day between 1 and 24),
 mode text not null check(mode in ('live','preview','replay','preview-replay')),
 content_version integer not null, run_id uuid not null default gen_random_uuid(),
 revision integer not null default -1, progress jsonb, restored_at timestamptz, completed_at timestamptz,
 primary key(user_id,day,mode), foreign key(day,content_version) references private.episode_content(day,version)
);
alter table public.episode_progress enable row level security;
revoke all on public.episode_progress from public,anon,authenticated;
grant select on public.episode_progress to authenticated;
create policy own_episode on public.episode_progress for select to authenticated using (
 user_id=(select auth.uid()) and private.is_member() and
 case when mode like 'preview%' then private.is_admin() else private.day_unlocked(day) end
);

create function private.episode_content_valid(c jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare s jsonb; o jsonb; q jsonb; b jsonb; pair record; seen text[]:='{}'; ids text[]; opts text[];
begin
 if jsonb_typeof(c) is distinct from 'object' or octet_length(c::text)>200000 or
  c->>'schema' is distinct from '1' or c->>'scriptStatus' is distinct from 'validated' or
  jsonb_typeof(c->'day') is distinct from 'number' or jsonb_typeof(c->'version') is distinct from 'number' or
  (c->>'day')::int not between 1 and 24 or (c->>'version')::int<1 or
  coalesce(length(c->>'title'),0) not between 1 and 180 or
  coalesce(length(c->'book'->>'text'),0) not between 1 and 4000 or
  coalesce(length(c->'book'->>'title'),0) not between 1 and 200 or
  jsonb_typeof(c->'dependsOn') is distinct from 'array' or
  jsonb_typeof(c->'scenes') is distinct from 'array' or jsonb_array_length(c->'scenes') not between 1 and 100 then return false; end if;
 for o in select value from jsonb_array_elements(c->'dependsOn') loop
  if jsonb_typeof(o)<>'number' or (o#>>'{}')::int not between 1 and (c->>'day')::int-1 then return false; end if;
 end loop;
 for s in select value from jsonb_array_elements(c->'scenes') loop
  if coalesce(s->>'id','') !~ '^[a-z][a-z0-9-]{0,79}$' or s->>'id'=any(seen) or
   coalesce(s->>'kind','') not in ('arrival','meet','tree','scatter','trail','restore','home') or
   jsonb_typeof(s->'objectives') is distinct from 'array' or jsonb_array_length(s->'objectives')>100 or
   jsonb_typeof(s->'choices') is distinct from 'array' or jsonb_array_length(s->'choices')>30 or
   jsonb_array_length(s->'objectives')+jsonb_array_length(s->'choices')=0 or
   jsonb_typeof(s->'dialogues') is distinct from 'object' or jsonb_typeof(s->'dialogueEvents') is distinct from 'object' then return false; end if;
  seen:=array_append(seen,s->>'id'); ids:='{}';
  for o in select value from jsonb_array_elements(s->'objectives') loop
   if coalesce(o->>'id','') !~ '^[a-z][a-z0-9-]{0,79}$' or o->>'id'=any(ids) or
    coalesce(o->'event'->>'kind','') not in ('talk','explore','find','solve','minigame','interact') or
    coalesce(length(o->'event'->>'target'),0) not between 1 and 160 then return false; end if;
   if o ? 'after' then
    if jsonb_typeof(o->'after')<>'array' then return false; end if;
    for q in select value from jsonb_array_elements(o->'after') loop
     if not (q#>>'{}'=any(ids)) then return false; end if;
    end loop;
   end if;
   ids:=array_append(ids,o->>'id');
  end loop;
  ids:='{}';
  for o in select value from jsonb_array_elements(s->'choices') loop
   if coalesce(o->>'id','') !~ '^[a-z][a-z0-9-]{0,79}$' or o->>'id'=any(ids) or
    jsonb_typeof(o->'options') is distinct from 'array' or jsonb_array_length(o->'options') not between 1 and 4 then return false; end if;
   ids:=array_append(ids,o->>'id'); opts:='{}';
   for q in select value from jsonb_array_elements(o->'options') loop
    if coalesce(q->>'id','') !~ '^[a-z][a-z0-9-]{0,79}$' or q->>'id'=any(opts) or
     coalesce(length(q->>'label'),0) not between 1 and 300 then return false; end if;
    opts:=array_append(opts,q->>'id');
   end loop;
  end loop;
  for pair in select * from jsonb_each(s->'dialogues') loop
   if pair.key !~ '^[a-z][a-z0-9-]{0,79}$' or jsonb_typeof(pair.value)<>'array' or
    jsonb_array_length(pair.value) not between 1 and 100 or not (s->'dialogueEvents' ? pair.key) then return false; end if;
   for b in select value from jsonb_array_elements(pair.value) loop
    if coalesce(length(b->>'speaker'),0) not between 1 and 80 or coalesce(length(b->>'text'),0) not between 1 and 2000 or
     (b ? 'choiceId' and not (b->>'choiceId'=any(ids))) then return false; end if;
   end loop;
  end loop;
 end loop;
 return true;
exception when others then return false;
end;$$;

create function private.episode_progress_valid(c jsonb,p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare s jsonb; o jsonb; choice jsonb; pair record; n integer; i integer:=0; expected jsonb:='[]';
 goals text[]:='{}'; choice_keys text[]:='{}'; goal_key text; r jsonb:=p->'runtime';
begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>65536 or
  p->>'schema' is distinct from '1' or p->>'episodeId' is distinct from 'episode-'||lpad(c->>'day',2,'0') or
  p->>'definitionVersion' is distinct from c->>'version' or
  jsonb_typeof(p->'revision') is distinct from 'number' or (p->>'revision')::int<0 or
  jsonb_typeof(p->'sceneIndex') is distinct from 'number' or
  jsonb_typeof(p->'complete') is distinct from 'boolean' or
  jsonb_typeof(p->'objectives') is distinct from 'array' or jsonb_typeof(p->'choices') is distinct from 'object' or
  jsonb_typeof(p->'completedScenes') is distinct from 'array' or jsonb_typeof(r) is distinct from 'object' then return false; end if;
 n:=(p->>'sceneIndex')::int;
 if n<0 or n>jsonb_array_length(c->'scenes') or (p->>'complete')::boolean<>(n=jsonb_array_length(c->'scenes')) then return false; end if;
 if exists(select 1 from jsonb_object_keys(p) k where k not in ('schema','episodeId','definitionVersion','revision','sceneIndex','complete','objectives','choices','completedScenes','runtime')) then return false; end if;
 if (select count(distinct v::text) from jsonb_array_elements(p->'objectives') v)<>jsonb_array_length(p->'objectives') then return false; end if;
 for s in select value from jsonb_array_elements(c->'scenes') loop
  if i<n then expected:=expected||jsonb_build_array(s->>'id'); end if;
  if i<=n then
   for o in select value from jsonb_array_elements(s->'objectives') loop
    goal_key:=s->>'id'||'/'||(o->>'id'); goals:=array_append(goals,goal_key);
    if i<n and not coalesce((o->>'optional')::boolean,false) and not (p->'objectives' ? goal_key) then return false; end if;
    if p->'objectives' ? goal_key then
     for choice in select value from jsonb_array_elements(coalesce(o->'after','[]')) loop
      if not (p->'objectives' ? ((s->>'id')||'/'||(choice#>>'{}'))) then return false; end if;
     end loop;
    end if;
   end loop;
   for choice in select value from jsonb_array_elements(s->'choices') loop
    goal_key:=s->>'id'||'/'||(choice->>'id'); choice_keys:=array_append(choice_keys,goal_key);
    if i<n and not coalesce((choice->>'optional')::boolean,false) and not (p->'choices' ? goal_key) then return false; end if;
    if p->'choices' ? goal_key and not exists(select 1 from jsonb_array_elements(choice->'options') x where x->>'id'=p->'choices'->>goal_key) then return false; end if;
   end loop;
  end if;
  i:=i+1;
 end loop;
 if p->'completedScenes'<>expected or exists(select 1 from jsonb_array_elements_text(p->'objectives') v where not (v=any(goals))) or
  exists(select 1 from jsonb_object_keys(p->'choices') k where not (k=any(choice_keys))) then return false; end if;
 if jsonb_typeof(r->'clueIndex') is distinct from 'number' or (r->>'clueIndex')::int not between 0 and 3 or
  jsonb_typeof(r->'hintMs') is distinct from 'number' or (r->>'hintMs')::numeric not between 0 and 86400000 then return false; end if;
 foreach goal_key in array array['dispersalStarted','dispersed','restored','bookOpened'] loop
  if jsonb_typeof(r->goal_key) is distinct from 'boolean' then return false; end if;
 end loop;
 if r->'firstMetVillager'<>'null'::jsonb and coalesce(r->>'firstMetVillager','') not in ('emile','augustin','celestine') then return false; end if;
 if not (r ?& array['origin','dialogue','cinematic','escort','visited','firstMetVillager']) then return false; end if;
 if jsonb_typeof(r->'visited') is distinct from 'array' or jsonb_array_length(r->'visited')>5 or
  exists(select 1 from jsonb_array_elements_text(r->'visited') v where v not in ('village','house','library','workshop','inn')) or
  (select count(distinct v::text) from jsonb_array_elements(r->'visited') v)<>jsonb_array_length(r->'visited') then return false; end if;
 if r->'origin'<>'null'::jsonb and (jsonb_typeof(r->'origin'->'x') is distinct from 'number' or jsonb_typeof(r->'origin'->'y') is distinct from 'number' or
  (r->'origin'->>'x')::numeric not between 0 and 1920 or (r->'origin'->>'y')::numeric not between 0 and 1408) then return false; end if;
 if r->'dialogue'<>'null'::jsonb then
  s:=c->'scenes'->n;
  if s is null or jsonb_typeof(r->'dialogue') is distinct from 'object' or
   jsonb_typeof(s->'dialogues'->(r->'dialogue'->>'block')) is distinct from 'array' or
   jsonb_typeof(r->'dialogue'->'beat') is distinct from 'number' or
   (r->'dialogue'->>'beat')::int not between 0 and jsonb_array_length(s->'dialogues'->(r->'dialogue'->>'block'))-1 or
   not (r->'dialogue' ? 'actor') or (r->'dialogue'->'actor'<>'null'::jsonb and r->'dialogue'->>'actor' not in ('mira','noe','emile')) then return false; end if;
 end if;
 if r->'cinematic'<>'null'::jsonb and (jsonb_typeof(r->'cinematic') is distinct from 'object' or
  coalesce(r->'cinematic'->>'kind','') not in ('scatter','restore') or jsonb_typeof(r->'cinematic'->'elapsed') is distinct from 'number' or
  (r->'cinematic'->>'elapsed')::numeric not between 0 and 30000) then return false; end if;
 if r->'escort'<>'null'::jsonb and (jsonb_typeof(r->'escort') is distinct from 'object' or
  coalesce(r->'escort'->>'room','') not in ('library','village') or coalesce(r->'escort'->>'phase','') not in ('out','place','return','inside') or
  jsonb_typeof(r->'escort'->'position'->'x') is distinct from 'number' or jsonb_typeof(r->'escort'->'position'->'y') is distinct from 'number' or
  (r->'escort'->'position'->>'x')::numeric not between 0 and 1920 or (r->'escort'->'position'->>'y')::numeric not between 0 and 1408) then return false; end if;
 return true;
exception when others then return false;
end;$$;

create function public.episode_admin_put(p_content jsonb) returns void language plpgsql security definer set search_path='' as $$
declare d integer; v integer; old jsonb;
begin
 if not private.is_admin() then raise exception 'Administrateur requis' using errcode='42501'; end if;
 if not private.episode_content_valid(p_content) then raise exception 'Cahier invalide'; end if;
 d:=(p_content->>'day')::int; v:=(p_content->>'version')::int;
 select content into old from private.episode_content where day=d and version=v;
 if old is not null and old<>p_content then raise exception 'Version immuable : publier une nouvelle version'; end if;
 insert into private.episode_content values(d,v,p_content) on conflict do nothing;
 insert into private.episode_releases values(d,v) on conflict(day) do update set version=excluded.version;
end;$$;

create function public.episode_status(p_preview boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_member() or (p_preview and not private.is_admin()) then raise exception 'Accès privé requis' using errcode='42501'; end if;
 select jsonb_agg(jsonb_build_object('day',d,'available',r.day is not null,
  'unlocked',p_preview or private.day_unlocked(d),'title',case when p_preview or private.day_unlocked(d) then c.content->>'title' else null end,
  'complete',p.completed_at is not null,'restored',p.restored_at is not null) order by d) into result
 from generate_series(1,24) d left join private.episode_releases r on r.day=d
 left join private.episode_content c on c.day=r.day and c.version=r.version
 left join public.episode_progress p on p.day=d and p.user_id=auth.uid() and p.mode=case when p_preview then 'preview' else 'live' end;
 return result;
end;$$;

create function public.episode_load(p_day integer,p_preview boolean default false,p_replay boolean default false,p_restart boolean default false)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare m text:=case when p_preview then case when p_replay then 'preview-replay' else 'preview' end else case when p_replay then 'replay' else 'live' end end;
 p public.episode_progress; c jsonb; v integer; dependency jsonb;
begin
 perform private.assert_day(p_day,p_preview);
 if p_restart and not p_replay then raise exception 'Ne pas réinitialiser une progression canonique'; end if;
 select * into p from public.episode_progress where user_id=auth.uid() and day=p_day and mode=m for update;
 if p.run_id is null or p_restart then
  select content_version into v from public.episode_progress where user_id=auth.uid() and day=p_day and mode=case when p_preview then 'preview' else 'live' end;
  if v is null then select version into v from private.episode_releases where day=p_day; end if;
  if v is null then raise exception 'Épisode non intégré'; end if;
  insert into public.episode_progress(user_id,day,mode,content_version) values(auth.uid(),p_day,m,v) on conflict do nothing;
  if p_restart then
   update public.episode_progress set run_id=gen_random_uuid(),content_version=v,revision=-1,progress=null,restored_at=null,completed_at=null
   where user_id=auth.uid() and day=p_day and mode=m;
  end if;
  select * into p from public.episode_progress where user_id=auth.uid() and day=p_day and mode=m for update;
 end if;
 select content into c from private.episode_content where day=p_day and version=p.content_version;
 for dependency in select value from jsonb_array_elements(c->'dependsOn') loop
  if not exists(select 1 from public.episode_progress where user_id=auth.uid() and day=(dependency#>>'{}')::int and mode=case when p_preview then 'preview' else 'live' end and completed_at is not null)
   then raise exception 'Épisode précédent incomplet'; end if;
 end loop;
 return jsonb_build_object('content',c,'progress',p.progress,'runId',p.run_id,'revision',p.revision,'restored',p.restored_at is not null,'complete',p.completed_at is not null);
end;$$;

create function public.episode_save(p_day integer,p_preview boolean,p_run uuid,p_expected integer,p_progress jsonb)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.episode_progress; c jsonb; scene jsonb; goal_key text; granted boolean:=false;
begin
 perform private.assert_day(p_day,p_preview);
 select * into p from public.episode_progress where user_id=auth.uid() and day=p_day and run_id=p_run for update;
 if p.run_id is null or (p.mode like 'preview%')<>p_preview then raise exception 'Session narrative invalide' using errcode='42501'; end if;
 select content into c from private.episode_content where day=p_day and version=p.content_version;
 if not private.episode_progress_valid(c,p_progress) then raise exception 'Checkpoint narratif invalide'; end if;
 if p.progress=p_progress then return jsonb_build_object('revision',p.revision); end if;
 if p.revision<>p_expected or (p_progress->>'revision')::int<=p.revision then raise exception 'Conflit de checkpoint : recharger sans écraser la progression'; end if;
 if p.progress is not null and (not ((p.progress->'choices') <@ (p_progress->'choices')) or
   not ((p.progress->'objectives') <@ (p_progress->'objectives')) or (p_progress->>'sceneIndex')::int<(p.progress->>'sceneIndex')::int or
   (p.progress->'runtime'->>'firstMetVillager' is not null and p.progress->'runtime'->>'firstMetVillager' is distinct from p_progress->'runtime'->>'firstMetVillager'))
   then raise exception 'Progression ou choix historiques supprimés'; end if;
 if p.progress is not null then
  if (p_progress->'runtime'->>'clueIndex')::int < (p.progress->'runtime'->>'clueIndex')::int or
   not ((p.progress->'runtime'->'visited') <@ (p_progress->'runtime'->'visited')) then raise exception 'État historique supprimé'; end if;
  foreach goal_key in array array['dispersalStarted','dispersed','restored','bookOpened'] loop
   if (p.progress->'runtime'->>goal_key)::boolean and not (p_progress->'runtime'->>goal_key)::boolean then raise exception 'État historique supprimé'; end if;
  end loop;
 end if;
 for scene in select value from jsonb_array_elements(c->'scenes') loop
  if scene->>'kind'='restore' and p_progress->'completedScenes' ? (scene->>'id') then granted:=true; end if;
 end loop;
 update public.episode_progress set progress=p_progress,revision=(p_progress->>'revision')::int,
  restored_at=case when granted then coalesce(restored_at,now()) else restored_at end,
  completed_at=case when (p_progress->>'complete')::boolean then coalesce(completed_at,now()) else completed_at end
 where user_id=p.user_id and day=p.day and mode=p.mode;
 return jsonb_build_object('revision',(p_progress->>'revision')::int);
end;$$;

revoke all on function private.episode_content_valid(jsonb),private.episode_progress_valid(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.episode_admin_put(jsonb),public.episode_status(boolean),public.episode_load(integer,boolean,boolean,boolean),public.episode_save(integer,boolean,uuid,integer,jsonb) from public,anon;
grant execute on function public.episode_admin_put(jsonb),public.episode_status(boolean),public.episode_load(integer,boolean,boolean,boolean),public.episode_save(integer,boolean,uuid,integer,jsonb) to authenticated;
