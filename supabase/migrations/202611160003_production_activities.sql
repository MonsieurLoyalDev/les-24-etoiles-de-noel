-- Additive activity validation. No private story, answers, assets or account data.
alter function private.episode_content_valid(jsonb) rename to episode_content_valid_v1;
alter function private.episode_progress_valid(jsonb,jsonb) rename to episode_progress_valid_v2;

create function private.activity_solved(c jsonb,d jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare pair record; v jsonb; x integer; y integer; n integer; i integer; j integer;
 mask integer; rotation integer; masks integer[]:='{}'; queue integer[]:='{}'; seen integer[]:='{}';
 dx integer[]:=array[0,1,0,-1]; dy integer[]:=array[-1,0,1,0]; ports integer[]:=array[1,2,4,8]; opposite integer[]:=array[4,8,1,2]; k integer; cursor integer:=1;
begin
 if jsonb_typeof(d) is distinct from 'object' then return false; end if;
 case c->>'kind'
 when 'order' then return d->'order'=c->'answer';
 when 'sequence' then return d->'sequence'=c->'answer';
 when 'matching' then
  for pair in select * from jsonb_each(c->'matches') loop
   if d->'values'->pair.key is distinct from pair.value then return false; end if;
  end loop; return true;
 when 'selection' then
  for v in select value from jsonb_array_elements(c->'items') loop
   if coalesce((d->'values'->>(v->>'id'))::boolean,false) <> (c->'answer' ? (v->>'id')) then return false; end if;
  end loop; return true;
 when 'cooking' then
  for pair in select * from jsonb_each(c->'quantities') loop
   if d->'values'->pair.key is distinct from pair.value->'target' then return false; end if;
  end loop;
  return (d->>'mix')::int>=coalesce((c->>'mix')::int,5) and (d->>'heat')::int between coalesce((c->'golden'->>0)::int,60) and coalesce((c->'golden'->>1)::int,80);
 when 'circuit' then
  n:=(c->'circuit'->>'size')::int;
  for i in 0..n*n-1 loop
   mask:=(c->'circuit'->'masks'->>i)::int; rotation:=(d->'rotations'->>i)::int;
   if rotation is null or rotation not between 0 and 3 then return false; end if;
   for j in 1..rotation loop mask:=((mask<<1)&15)|(mask>>3); end loop;
   masks:=array_append(masks,mask);
  end loop;
  i:=(c->'circuit'->>'source')::int;
  if (masks[i+1] & (c->'circuit'->>'input')::int)=0 then return false; end if;
  queue:=array[i];seen:=queue;
  while cursor<=coalesce(array_length(queue,1),0) loop
   i:=queue[cursor];cursor:=cursor+1;x:=i%n;y:=i/n;
   for k in 1..4 loop
    if x+dx[k]<0 or x+dx[k]>=n or y+dy[k]<0 or y+dy[k]>=n then continue; end if;
    j:=(y+dy[k])*n+x+dx[k];
    if not (j=any(seen)) and (masks[i+1]&ports[k])<>0 and (masks[j+1]&opposite[k])<>0 then seen:=array_append(seen,j);queue:=array_append(queue,j);end if;
   end loop;
  end loop;
  for v in select value from jsonb_array_elements(c->'circuit'->'outputs') loop
   i:=(v->>'cell')::int;
   if not (i=any(seen)) or (masks[i+1] & (v->>'port')::int)=0 then return false; end if;
  end loop; return true;
 else return false;
 end case;
exception when others then return false;
end;$$;

create function private.episode_content_valid(c jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare s jsonb; a jsonb; p jsonb; v jsonb; b jsonb; pair record; ids text[]:='{}'; idx integer; jump record;
begin
 if not private.episode_content_valid_v1(c) then return false; end if;
 if not (c ? 'flow') then return true; end if;
 if c->'flow'->>'schema' is distinct from '1' or jsonb_typeof(c->'flow'->'portals') is distinct from 'array' or
  exists(select 1 from jsonb_array_elements_text(c->'flow'->'portals') r where r not in ('forest','bakery')) then return false; end if;
 for s in select value from jsonb_array_elements(c->'scenes') loop
  if jsonb_typeof(s->'flow'->'actions') is distinct from 'array' or jsonb_array_length(s->'flow'->'actions')>100 then return false; end if;
  for a in select value from jsonb_array_elements(s->'flow'->'actions') loop
   if not exists(select 1 from jsonb_array_elements(s->'objectives') o where o->>'id'=a->>'id') or a->>'id'=any(ids) or
    coalesce(length(a->>'label'),0) not between 1 and 300 or coalesce(a->'point'->>'room','') not in ('village','house','library','workshop','inn','forest','bakery') or
    coalesce(length(a->'point'->>'anchor'),0) not between 1 and 100 or (a ? 'dialogue' and not (s->'dialogues' ? (a->>'dialogue'))) then return false; end if;
   ids:=array_append(ids,a->>'id');
   if a ? 'puzzle' then
    p:=a->'puzzle';
    if coalesce(p->>'kind','') not in ('circuit','matching','order','sequence','selection','cooking') or
     jsonb_typeof(p->'items') is distinct from 'array' or jsonb_array_length(p->'items') not between 1 and 36 or
     coalesce(length(p->>'title'),0) not between 1 and 180 or coalesce(length(p->>'prompt'),0) not between 1 and 2000 then return false; end if;
    if exists(select 1 from jsonb_array_elements(p->'items') i where coalesce(i->>'id','') !~ '^[a-z][a-z0-9-]{0,79}$' or coalesce(length(i->>'label'),0) not between 1 and 300) or
     (select count(distinct i->>'id') from jsonb_array_elements(p->'items') i)<>jsonb_array_length(p->'items') then return false;end if;
    if p->>'kind'='circuit' and ((p->'circuit'->>'size')::int not between 2 and 4 or jsonb_array_length(p->'circuit'->'masks')<>(p->'circuit'->>'size')::int^2 or jsonb_array_length(p->'circuit'->'rotations')<>jsonb_array_length(p->'circuit'->'masks')) then return false;end if;
   end if;
  end loop;
  for pair in select * from jsonb_each(s->'dialogues') loop
   idx:=0;
   for b in select value from jsonb_array_elements(pair.value) loop
    if b ? 'nextByOption' then
     if not (b ? 'choiceId') or jsonb_typeof(b->'nextByOption') is distinct from 'object' then return false;end if;
     for jump in select * from jsonb_each(b->'nextByOption') loop
      if not exists(select 1 from jsonb_array_elements(s->'choices') q,jsonb_array_elements(q->'options') o where q->>'id'=b->>'choiceId' and o->>'id'=jump.key) or
       (jump.value<>'null'::jsonb and (jsonb_typeof(jump.value)<>'number' or (jump.value#>>'{}')::int not between idx+1 and jsonb_array_length(pair.value)-1)) then return false;end if;
     end loop;
    end if;idx:=idx+1;
   end loop;
  end loop;
 end loop;
 return true;
exception when others then return false;
end;$$;

create function private.activity_draft_valid(c jsonb,d jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare pair record;v jsonb;q jsonb;field text;
begin
 if jsonb_typeof(d) is distinct from 'object' or not (d ?& array['values','order','rotations','sequence','mix','heat','phase','attempts','solved']) or
  exists(select 1 from jsonb_object_keys(d) k where k not in ('values','order','rotations','sequence','mix','heat','phase','attempts','solved')) or
  jsonb_typeof(d->'values') is distinct from 'object' or (select count(*) from jsonb_object_keys(d->'values'))>36 or
  jsonb_typeof(d->'solved') is distinct from 'boolean' then return false;end if;
 foreach field in array array['mix','heat','phase','attempts'] loop
  if jsonb_typeof(d->field) is distinct from 'number' or (d->>field)::numeric<>trunc((d->>field)::numeric) or (d->>field)::numeric<0 then return false;end if;
 end loop;
 if (d->>'mix')::int>30 or (d->>'heat')::int>100 or (d->>'phase')::int>10 or (d->>'attempts')::int>10000 then return false;end if;
 foreach field in array array['order','rotations','sequence'] loop
  if jsonb_typeof(d->field) is distinct from 'array' or jsonb_array_length(d->field)>36 then return false;end if;
 end loop;
 if jsonb_array_length(d->'order')<>jsonb_array_length(c->'items') or (select count(distinct element.value) from jsonb_array_elements(d->'order') element)<>jsonb_array_length(d->'order') then return false;end if;
 for v in select value from jsonb_array_elements((d->'order')||(d->'sequence')) loop
  if jsonb_typeof(v)<>'string' or not exists(select 1 from jsonb_array_elements(c->'items') i where i->'id'=v) then return false;end if;
 end loop;
 if jsonb_array_length(d->'rotations')<>(case when c->>'kind'='circuit' then jsonb_array_length(c->'circuit'->'masks') else 0 end) or
  exists(select 1 from jsonb_array_elements(d->'rotations') r where jsonb_typeof(r)<>'number' or (r#>>'{}')::numeric<>trunc((r#>>'{}')::numeric) or (r#>>'{}')::numeric not between 0 and 3) then return false;end if;
 for pair in select * from jsonb_each(d->'values') loop
  if not exists(select 1 from jsonb_array_elements(c->'items') i where i->>'id'=pair.key) then return false;end if;
  case c->>'kind'
  when 'selection' then if jsonb_typeof(pair.value)<>'boolean' then return false;end if;
  when 'matching' then if jsonb_typeof(pair.value)<>'string' or not exists(select 1 from jsonb_array_elements(c->'options') i where i->'id'=pair.value) then return false;end if;
  when 'cooking' then q:=c->'quantities'->pair.key;if jsonb_typeof(pair.value)<>'number' or (pair.value#>>'{}')::numeric<>trunc((pair.value#>>'{}')::numeric) or (pair.value#>>'{}')::numeric not between 0 and (q->>'target')::numeric*2 then return false;end if;
  else return false;
  end case;
 end loop;
 return not (d->>'solved')::boolean or private.activity_solved(c,d);
exception when others then return false;
end;$$;
revoke all on function private.activity_draft_valid(jsonb,jsonb) from public,anon,authenticated;

create function private.episode_progress_valid(c jsonb,p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare sanitized jsonb:=p; r jsonb:=p->'runtime'; f jsonb:=r->'flow'; s jsonb; a jsonb; d jsonb; pair record; point jsonb; scope jsonb; goal text; visited jsonb; side text;
begin
 if not (c ? 'flow') then return private.episode_progress_valid_v2(c,p); end if;
 if octet_length(p::text)>65536 or jsonb_typeof(f) is distinct from 'object' or jsonb_typeof(f->'drafts') is distinct from 'object' or
  jsonb_typeof(f->'steps') is distinct from 'object' or jsonb_typeof(f->'seen') is distinct from 'array' or jsonb_typeof(f->'sideChoices') is distinct from 'object' or
  jsonb_array_length(f->'seen')>100 or (select count(*) from jsonb_object_keys(f->'drafts'))>100 or (select count(*) from jsonb_object_keys(f->'steps'))>100 or
  not (f ?& array['side','active','fx']) then return false;end if;
 if jsonb_typeof(r->'visited') is distinct from 'array' or jsonb_array_length(r->'visited')>7 or
  exists(select 1 from jsonb_array_elements_text(r->'visited') v where v not in ('village','house','library','workshop','inn','forest','bakery')) or
  (select count(distinct v) from jsonb_array_elements_text(r->'visited') v)<>jsonb_array_length(r->'visited') then return false;end if;
 select coalesce(jsonb_agg(v),'[]'::jsonb) into visited from jsonb_array_elements(r->'visited') v where v#>>'{}' not in ('forest','bakery');
 sanitized:=jsonb_set(sanitized,'{runtime,visited}',visited);
 if r->'presentation' ? 'location' then
  if coalesce(r->'presentation'->'location'->>'room','') not in ('village','house','library','workshop','inn','forest','bakery') then return false;end if;
  if r->'presentation'->'location'->>'room' in ('forest','bakery') then sanitized:=jsonb_set(sanitized,'{runtime,presentation,location,room}','"village"');end if;
 end if;
 side:=f->>'side';
 if side is not null then
  select value into scope from jsonb_array_elements(c->'scenes') where value->>'id'=side and (value->'flow'->>'optional')::boolean;
  if scope is null then return false;end if;
 end if;
 if r->'dialogue'<>'null'::jsonb and side is not null then
  if jsonb_typeof(scope->'dialogues'->(r->'dialogue'->>'block')) is distinct from 'array' or (r->'dialogue'->>'beat')::int not between 0 and jsonb_array_length(scope->'dialogues'->(r->'dialogue'->>'block'))-1 or
   (r->'dialogue'->'actor'<>'null'::jsonb and coalesce(r->'dialogue'->>'actor','') not in ('mira','noe','emile')) then return false;end if;
  sanitized:=jsonb_set(sanitized,'{runtime,dialogue}','null');
 end if;
 if not private.episode_progress_valid_v2(c,sanitized) then return false;end if;
 for s in select value from jsonb_array_elements(c->'scenes') loop
  for a in select value from jsonb_array_elements(s->'flow'->'actions') loop
   goal:=(s->>'id')||'/'||(a->>'id');d:=f->'drafts'->goal;
   if p->'objectives' ? goal and a ? 'puzzle' and not private.activity_solved(a->'puzzle',d) then return false;end if;
   if d is not null and not private.activity_draft_valid(a->'puzzle',d) then return false;end if;
  end loop;
 end loop;
 for pair in select * from jsonb_each(f->'drafts') loop
  if not exists(select 1 from jsonb_array_elements(c->'scenes') sc,jsonb_array_elements(sc->'flow'->'actions') ac where (sc->>'id')||'/'||(ac->>'id')=pair.key and ac ? 'puzzle') then return false;end if;
 end loop;
 for point in select value from jsonb_array_elements(f->'seen') loop
  if not exists(select 1 from jsonb_array_elements(c->'scenes') sc,jsonb_array_elements(sc->'flow'->'actions') ac where (sc->'flow'->>'optional')::boolean and (sc->>'id')||'/'||(ac->>'id')=point#>>'{}' and coalesce((ac->>'availableAfter')::int,jsonb_array_length(c->'scenes')-1)<=(p->>'sceneIndex')::int) then return false;end if;
 end loop;
 if jsonb_typeof(f->'active') not in ('null','string') or jsonb_typeof(f->'side') not in ('null','string') or
  (f->>'active' is not null and not exists(select 1 from jsonb_array_elements(c->'scenes') sc,jsonb_array_elements(sc->'flow'->'actions') act where act->>'id'=f->>'active' and act ? 'puzzle')) then return false;end if;
 for pair in select * from jsonb_each(f->'sideChoices') loop
  if not exists(select 1 from jsonb_array_elements(c->'scenes') sc,jsonb_array_elements(sc->'choices') q,jsonb_array_elements(q->'options') o where (sc->'flow'->>'optional')::boolean and (sc->>'id')||'/'||(q->>'id')=pair.key and o->'id'=pair.value) then return false;end if;
 end loop;
 for pair in select * from jsonb_each(f->'steps') loop
  if jsonb_typeof(pair.value)<>'number' or (pair.value#>>'{}')::numeric<>1 or not exists(select 1 from jsonb_array_elements(c->'scenes') sc,jsonb_array_elements(sc->'flow'->'actions') act where (sc->>'id')||'/'||(act->>'id')=pair.key and act ? 'gesture') then return false;end if;
 end loop;
 return true;
exception when others then return false;
end;$$;

-- Independent preview is admin-only via assert_day. Live/replay retain all prerequisites.
create or replace function private.episode_load_v1(p_day integer,p_preview boolean default false,p_replay boolean default false,p_restart boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare m text:=case when p_preview then case when p_replay then 'preview-replay' else 'preview' end else case when p_replay then 'replay' else 'live' end end;
 p public.episode_progress;c jsonb;v integer;dependency jsonb;
begin
 perform private.assert_day(p_day,p_preview);
 if p_restart and not p_replay then raise exception 'Ne pas réinitialiser une progression canonique';end if;
 select * into p from public.episode_progress where user_id=auth.uid() and day=p_day and mode=m for update;
 if p.run_id is null or p_restart then
  select content_version into v from public.episode_progress where user_id=auth.uid() and day=p_day and mode=case when p_preview then 'preview' else 'live' end;
  if v is null then select version into v from private.episode_releases where day=p_day;end if;
  if v is null then raise exception 'Épisode non intégré';end if;
  insert into public.episode_progress(user_id,day,mode,content_version) values(auth.uid(),p_day,m,v) on conflict do nothing;
  if p_restart then update public.episode_progress set run_id=gen_random_uuid(),content_version=v,revision=-1,progress=null,restored_at=null,completed_at=null where user_id=auth.uid() and day=p_day and mode=m;end if;
  select * into p from public.episode_progress where user_id=auth.uid() and day=p_day and mode=m for update;
 end if;
 select content into c from private.episode_content where day=p_day and version=p.content_version;
 if not p_preview then
  for dependency in select value from jsonb_array_elements(c->'dependsOn') loop
   if not exists(select 1 from public.episode_progress where user_id=auth.uid() and day=(dependency#>>'{}')::int and mode='live' and completed_at is not null) then raise exception 'Épisode précédent incomplet';end if;
  end loop;
 end if;
 return jsonb_build_object('content',c,'progress',p.progress,'runId',p.run_id,'revision',p.revision,'restored',p.restored_at is not null,'complete',p.completed_at is not null);
end;$$;
revoke all on function private.activity_solved(jsonb,jsonb),private.episode_content_valid(jsonb),private.episode_content_valid_v1(jsonb),private.episode_progress_valid(jsonb,jsonb),private.episode_progress_valid_v2(jsonb,jsonb),private.episode_load_v1(integer,boolean,boolean,boolean) from public,anon,authenticated;

create function private.episode_context(p_day integer,p_preview boolean) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare pages jsonb:='[]';choices jsonb:='{}';facts jsonb:='{}';lights jsonb:='{}';regions jsonb;row record;pair record;extra jsonb;value jsonb;prefix text;config jsonb;style jsonb;point jsonb;
begin
 perform private.assert_day(p_day,p_preview);
 for row in select e.day,e.progress,e.restored_at,c.content from public.episode_progress e
  join private.episode_content c on c.day=e.day and c.version=e.content_version
  where e.user_id=auth.uid() and e.day<p_day and e.mode=case when p_preview then 'preview' else 'live' end
   and (p_preview or private.day_unlocked(e.day)) order by e.day loop
  prefix:='episode-'||lpad(row.day::text,2,'0')||'/';
  for pair in select * from jsonb_each(coalesce(row.progress->'choices','{}')||coalesce(row.progress->'runtime'->'flow'->'sideChoices','{}')) loop
   choices:=choices||jsonb_build_object(prefix||pair.key,pair.value);
  end loop;
  for pair in select * from jsonb_each(coalesce(row.content->'flow'->'facts','{}')) loop
   if pair.value ? 'choice' then value:=row.progress->'choices'->((pair.value->>'scene')||'/'||(pair.value->>'choice'));
   else value:=to_jsonb(coalesce(row.progress->'objectives' ? ((pair.value->>'scene')||'/'||(pair.value->>'objective')),false) or coalesce(row.progress->'runtime'->'flow'->'seen' ? ((pair.value->>'scene')||'/'||(pair.value->>'objective')),false));end if;
   if value is not null then facts:=facts||jsonb_build_object(prefix||pair.key,value);end if;
  end loop;
  config:=row.content->'flow'->'lights';
  if config is not null and row.progress->'objectives' ? (config->>'requires') then
   style:=coalesce(config->'styles'->(row.progress->'choices'->>(config->>'choice')),'{"tint":16761208}'::jsonb);
   for point in select element.value from jsonb_array_elements(config->'points') element loop lights:=lights||jsonb_build_object(point#>>'{}',style||'{"on":true}'::jsonb);end loop;
  end if;
  if row.restored_at is not null then
   pages:=pages||jsonb_build_array(row.content->'book'||jsonb_build_object('day',row.day));
   for extra in select x from jsonb_array_elements(coalesce(row.content->'flow'->'bookExtras','[]')) x loop
    if not (extra ? 'requires') or row.progress->'objectives' ? (extra->>'requires') or row.progress->'runtime'->'flow'->'seen' ? (extra->>'requires') then
     pages:=pages||jsonb_build_array((extra-'requires')||jsonb_build_object('day',row.day));
    end if;
   end loop;
  end if;
 end loop;
 select coalesce(jsonb_agg(distinct gate.key),'[]'::jsonb) into regions from public.episode_progress e
  join private.episode_content c on c.day=e.day and c.version=e.content_version
  cross join lateral jsonb_each(coalesce(c.content->'flow'->'portalAccess','{}')) gate
  where e.user_id=auth.uid() and e.mode=case when p_preview then 'preview' else 'live' end and (p_preview or private.day_unlocked(e.day))
   and gate.key in ('forest','bakery') and (e.progress->>'sceneIndex')::int>=(gate.value->>'after')::int;
 return jsonb_build_object('pages',pages,'choices',choices,'facts',facts,'lights',lights,'regions',regions);
end;$$;
revoke all on function private.episode_context(integer,boolean) from public,anon,authenticated;

create or replace function public.episode_load(p_day integer,p_preview boolean default false,p_replay boolean default false,p_restart boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;finished timestamptz;
begin
 result:=private.episode_load_v1(p_day,p_preview,p_replay,p_restart);
 select completed_at into finished from public.episode_progress where user_id=auth.uid() and day=p_day and run_id=(result->>'runId')::uuid;
 return result||jsonb_build_object('completedAt',finished,'context',private.episode_context(p_day,p_preview));
end;$$;

alter function public.episode_save(integer,boolean,uuid,integer,jsonb) rename to episode_save_v2;
alter function public.episode_save_v2(integer,boolean,uuid,integer,jsonb) set schema private;
revoke all on function private.episode_save_v2(integer,boolean,uuid,integer,jsonb) from public,anon,authenticated;
create function public.episode_save(p_day integer,p_preview boolean,p_run uuid,p_expected integer,p_progress jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare old_flow jsonb;new_flow jsonb:=p_progress->'runtime'->'flow';pair record;c jsonb;
begin
 perform private.assert_day(p_day,p_preview);
 select progress->'runtime'->'flow' into old_flow from public.episode_progress where user_id=auth.uid() and day=p_day and run_id=p_run for update;
 if old_flow is not null then
  if not ((old_flow->'seen') <@ (new_flow->'seen')) or not ((old_flow->'sideChoices') <@ (new_flow->'sideChoices')) then raise exception 'État facultatif historique supprimé';end if;
  for pair in select * from jsonb_each(old_flow->'drafts') loop
   if (pair.value->>'solved')::boolean and pair.value is distinct from new_flow->'drafts'->pair.key then
    select content into c from private.episode_content where (day,version)=(select day,content_version from public.episode_progress where user_id=auth.uid() and day=p_day and run_id=p_run);
    if not exists(select 1 from jsonb_array_elements(c->'scenes') s,jsonb_array_elements(s->'flow'->'actions') a where (s->'flow'->>'optional')::boolean and (a->>'replayable')::boolean and (s->>'id')||'/'||(a->>'id')=pair.key) then raise exception 'Activité résolue supprimée';end if;
   end if;
  end loop;
 end if;
 return private.episode_save_v2(p_day,p_preview,p_run,p_expected,p_progress);
end;$$;
revoke all on function public.episode_save(integer,boolean,uuid,integer,jsonb) from public,anon;
grant execute on function public.episode_save(integer,boolean,uuid,integer,jsonb) to authenticated;
