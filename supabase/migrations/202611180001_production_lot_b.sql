-- Additive presentation/region compatibility. No story text or private answer.
alter function private.activity_solved(jsonb,jsonb) rename to activity_solved_lot_a;
create function private.activity_solved(c jsonb,d jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
begin
 if c->>'kind'='dial' then return d->'order'=c->'answer';end if;
 if c->>'kind'='matching' and coalesce((c->>'unique')::boolean,false) and
  (select count(*) from jsonb_each(d->'values'))<>(select count(distinct value) from jsonb_each(d->'values')) then return false;end if;
 return private.activity_solved_lot_a(c,d);
exception when others then return false;end;$$;

alter function private.activity_draft_valid(jsonb,jsonb) rename to activity_draft_valid_lot_a;
create function private.activity_draft_valid(c jsonb,d jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
begin
 if c->>'kind'='dial' then c:=jsonb_set(c,'{kind}','"order"');end if;
 if c->>'kind'='matching' and coalesce((c->>'unique')::boolean,false) and
  (select count(*) from jsonb_each(d->'values'))<>(select count(distinct value) from jsonb_each(d->'values')) then return false;end if;
 return private.activity_draft_valid_lot_a(c,d);
exception when others then return false;end;$$;

create function private.lot_b_content_compat(c jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare i integer;j integer;a jsonb;regions jsonb;
begin
 if not(c ? 'flow') then return c;end if;
 select coalesce(jsonb_agg(case when x#>>'{}' in ('lake','hamlet','clockshop') then '"forest"'::jsonb else x end),'[]') into regions from jsonb_array_elements(c->'flow'->'portals') x;
 c:=jsonb_set(c,'{flow,portals}',regions);
 for i in 0..jsonb_array_length(c->'scenes')-1 loop
  for j in 0..jsonb_array_length(c->'scenes'->i->'flow'->'actions')-1 loop
   a:=c->'scenes'->i->'flow'->'actions'->j;
   if a->'point'->>'room' in ('lake','hamlet','clockshop') then a:=jsonb_set(a,'{point,room}','"forest"');end if;
   if a->'puzzle'->>'kind'='dial' then a:=jsonb_set(a,'{puzzle,kind}','"order"');end if;
   c:=jsonb_set(c,array['scenes',i::text,'flow','actions',j::text],a);
  end loop;
 end loop;
 return c;
end;$$;
alter function private.episode_content_valid(jsonb) rename to episode_content_valid_lot_a;
create function private.episode_content_valid(c jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
begin
 if c ? 'flow' and exists(select 1 from jsonb_array_elements_text(c->'flow'->'portals') r where r not in ('forest','bakery','lake','hamlet','clockshop')) then return false;end if;
 if c->'flow' ? 'media' and (jsonb_typeof(c->'flow'->'media') is distinct from 'array' or jsonb_array_length(c->'flow'->'media')>10 or exists(select 1 from jsonb_array_elements(c->'flow'->'media') m where
  coalesce(m->>'key','') !~ '^private-[a-z0-9-]{1,70}$' or coalesce(m->>'day','') !~ '^[0-9]+$' or (m->>'day')::int not between 1 and (c->>'day')::int or
  coalesce(m->>'path','') !~ ('^'||(m->>'day')||'/[a-zA-Z0-9_-]+\.(png|webp|jpg)$'))) then return false;end if;
 return private.episode_content_valid_lot_a(private.lot_b_content_compat(c));
exception when others then return false;end;$$;

alter function private.episode_progress_valid(jsonb,jsonb) rename to episode_progress_valid_lot_a;
create function private.episode_progress_valid(c jsonb,p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare r jsonb:=p->'runtime';visited jsonb;entry record;f jsonb:=r->'flow'->'followers';room text;
begin
 if not(c ? 'flow') then return private.episode_progress_valid_lot_a(c,p);end if;
 if f is not null then
  if jsonb_typeof(f)<>'object' or (select count(*) from jsonb_object_keys(f))>4 then return false;end if;
  for entry in select * from jsonb_each(f) loop
   if entry.key is distinct from c->'flow'->'follower'->>'actor' or jsonb_typeof(entry.value)<>'object' or
    coalesce(entry.value->>'room','') not in ('village','house','library','workshop','inn','forest','bakery','lake','hamlet','clockshop') or
    jsonb_typeof(entry.value->'x') is distinct from 'number' or jsonb_typeof(entry.value->'y') is distinct from 'number' or
    (entry.value->>'x')::numeric not between 0 and 1920 or (entry.value->>'y')::numeric not between 0 and 1408 then return false;end if;
  end loop;
 end if;
 if jsonb_array_length(r->'visited')>10 or exists(select 1 from jsonb_array_elements_text(r->'visited') x where x not in ('village','house','library','workshop','inn','forest','bakery','lake','hamlet','clockshop')) then return false;end if;
 select coalesce(jsonb_agg(distinct case when x#>>'{}' in ('lake','hamlet','clockshop') then '"forest"'::jsonb else x end),'[]') into visited from jsonb_array_elements(r->'visited') x;
 p:=jsonb_set(p,'{runtime,visited}',visited);
 room:=r->'presentation'->'location'->>'room';
 if room is not null and room not in ('village','house','library','workshop','inn','forest','bakery','lake','hamlet','clockshop') then return false;end if;
 if room in ('lake','hamlet','clockshop') then p:=jsonb_set(p,'{runtime,presentation,location,room}','"forest"');end if;
 if r->'dialogue'->>'actor'='oscar' then p:=jsonb_set(p,'{runtime,dialogue,actor}','null');end if;
 -- A one-shot celebration is a presentation marker, not a second award.
 -- Validate only declared markers here; all other steps retain the legacy checks.
 for entry in select * from jsonb_each(coalesce(r->'flow'->'steps','{}')) loop
  if exists(select 1 from jsonb_array_elements(c->'scenes') sc,jsonb_array_elements(sc->'flow'->'actions') ac
   where (sc->>'id')||'/'||(ac->>'id')=entry.key and ac->'constellation' in ('6'::jsonb,'12'::jsonb)) then
   if entry.value<>'1'::jsonb then return false;end if;
   p:=jsonb_set(p,'{runtime,flow,steps}',(p->'runtime'->'flow'->'steps')-entry.key);
  end if;
 end loop;
 return private.episode_progress_valid_lot_a(private.lot_b_content_compat(c),p);
exception when others then return false;end;$$;

alter function private.episode_context(integer,boolean) rename to episode_context_lot_a;
create function private.episode_context(p_day integer,p_preview boolean) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;regions jsonb;placements jsonb:='[]';row record;item jsonb;choices jsonb;pair record;value jsonb;prefix text;
begin
 result:=private.episode_context_lot_a(p_day,p_preview);
 select coalesce(jsonb_agg(distinct gate.key),'[]') into regions from public.episode_progress e
 join private.episode_content c on c.day=e.day and c.version=e.content_version
 cross join lateral jsonb_each(coalesce(c.content->'flow'->'portalAccess','{}')) gate
 where e.user_id=auth.uid() and e.mode=case when p_preview then 'preview' else 'live' end and (p_preview or private.day_unlocked(e.day))
 and gate.key in ('forest','bakery','lake','hamlet','clockshop') and (e.progress->>'sceneIndex')::int>=(gate.value->>'after')::int;
 for row in select e.day,e.progress,e.restored_at,c.content from public.episode_progress e join private.episode_content c on c.day=e.day and c.version=e.content_version
  where e.user_id=auth.uid() and e.day<p_day and e.mode=case when p_preview then 'preview' else 'live' end and (p_preview or private.day_unlocked(e.day)) order by e.day loop
  choices:=coalesce(row.progress->'choices','{}')||coalesce(row.progress->'runtime'->'flow'->'sideChoices','{}');prefix:='episode-'||lpad(row.day::text,2,'0')||'/';
  for pair in select * from jsonb_each(coalesce(row.content->'flow'->'facts','{}')) loop
   if pair.value ? 'choice' then
    value:=choices->((pair.value->>'scene')||'/'||(pair.value->>'choice'));
    if value is not null then result:=jsonb_set(result,'{facts}',(result->'facts')||jsonb_build_object(prefix||pair.key,value));end if;
   end if;
  end loop;
  if row.restored_at is null then continue;end if;
  for item in select x from jsonb_array_elements(coalesce(row.content->'flow'->'network','[]')) x loop
   if coalesce((item->>'visual')::boolean,false) and (not(item ? 'requires') or row.progress->'objectives' ? (item->>'requires')) then
    placements:=placements||jsonb_build_array(jsonb_build_object('id','network-'||(item->>'point'),'texture','production-lantern-on','point',jsonb_build_object('room','village','anchor','world:'||(item->>'point'),'offset',jsonb_build_object('x',12,'y',0)),'width',24,'persistent',true));
   end if;
  end loop;
  for item in select x from jsonb_array_elements(coalesce(row.content->'flow'->'placements','[]')) x loop
   if coalesce((item->>'persistent')::boolean,false) and (not(item ? 'requires') or row.progress->'objectives' ? (item->>'requires') or row.progress->'runtime'->'flow'->'seen' ? (item->>'requires')) and
    (not(item ? 'choice') or choices->>(item->'choice'->>'key')=item->'choice'->>'option') then placements:=placements||jsonb_build_array(item-'requires'-'choice');end if;
  end loop;
 end loop;
 return result||jsonb_build_object('regions',regions,'placements',placements);
end;$$;
revoke all on function private.activity_solved(jsonb,jsonb),private.activity_solved_lot_a(jsonb,jsonb),private.activity_draft_valid(jsonb,jsonb),private.activity_draft_valid_lot_a(jsonb,jsonb),private.lot_b_content_compat(jsonb),private.episode_content_valid(jsonb),private.episode_content_valid_lot_a(jsonb),private.episode_progress_valid(jsonb,jsonb),private.episode_progress_valid_lot_a(jsonb,jsonb),private.episode_context(integer,boolean),private.episode_context_lot_a(integer,boolean) from public,anon,authenticated;
