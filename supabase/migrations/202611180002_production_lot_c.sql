-- Additive compatibility only. No original narrative, puzzle answer or personal media.
create function private.lot_c_content_compat(c jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare regions jsonb;i integer;j integer;a jsonb;
begin
 if not(c ? 'flow') then return c;end if;
 select coalesce(jsonb_agg(distinct case when x#>>'{}' in ('reserve','glade','keeper') then '"forest"'::jsonb else x end),'[]')
 into regions from jsonb_array_elements(c->'flow'->'portals') x;
 c:=jsonb_set(c,'{flow,portals}',regions);
 for i in 0..jsonb_array_length(c->'scenes')-1 loop
  for j in 0..jsonb_array_length(c->'scenes'->i->'flow'->'actions')-1 loop
   a:=c->'scenes'->i->'flow'->'actions'->j;
   if a->'point'->>'room' in ('reserve','glade','keeper') then a:=jsonb_set(a,'{point,room}','"forest"');end if;
   c:=jsonb_set(c,array['scenes',i::text,'flow','actions',j::text],a);
  end loop;
 end loop;
 return c;
end;$$;

alter function private.episode_content_valid(jsonb) rename to episode_content_valid_lot_b;
create function private.episode_content_valid(c jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare a jsonb;item jsonb;p jsonb;
begin
 if c ? 'flow' then
  if exists(select 1 from jsonb_array_elements_text(c->'flow'->'portals') r where r not in ('forest','bakery','lake','hamlet','clockshop','reserve','glade','keeper')) then return false;end if;
  if c->'flow' ? 'period' and (jsonb_typeof(c->'flow'->'period') is distinct from 'number' or c->'flow'->>'period' not in ('0','1','2','3')) then return false;end if;
  if c->'flow' ? 'confidences' then
   if jsonb_typeof(c->'flow'->'confidences') is distinct from 'array' or jsonb_array_length(c->'flow'->'confidences')>20 then return false;end if;
   for item in select * from jsonb_array_elements(c->'flow'->'confidences') loop
    if coalesce(item->>'id','') !~ '^[a-z][a-z0-9-]{0,79}$' or coalesce(item->>'author','')='' or length(item->>'author')>80 or
      coalesce(item->>'requires','') !~ '^[a-z][a-z0-9-]{0,79}/[a-z][a-z0-9-]{0,79}$' or
      coalesce(item->>'status','') not in ('shared','private','draft') or
      (item->>'status'<>'shared' and item ? 'text') or
      (item->>'status'='shared' and (jsonb_typeof(item->'text') is distinct from 'string' or length(item->>'text') not between 1 and 4000)) then return false;end if;
   end loop;
  end if;
  for item in select * from jsonb_array_elements(coalesce(c->'flow'->'bookExtras','[]')) loop
   if item ? 'mapNote' and (jsonb_typeof(item->'mapNote') is distinct from 'object' or item->'mapNote'->'locked' is distinct from 'true'::jsonb or
    jsonb_typeof(item->'mapNote'->'from') is distinct from 'string' or length(item->'mapNote'->>'from') not between 1 and 100 or
    jsonb_typeof(item->'mapNote'->'to') is distinct from 'string' or length(item->'mapNote'->>'to') not between 1 and 100) then return false;end if;
  end loop;
  for a in select ac from jsonb_array_elements(c->'scenes') sc,jsonb_array_elements(sc->'flow'->'actions') ac loop
   p:=a->'performance';
   if p is not null and (jsonb_typeof(p) is distinct from 'object' or coalesce(p->>'kind','') not in ('theatre','fireflies','concert') or
    coalesce(p->>'duration','') !~ '^[0-9]+$' or (p->>'duration')::int not between 1000 and 120000 or
    (p ? 'shape' and p->>'shape' not in ('trail','flower-tree-star'))) then return false;end if;
   if p ? 'subtitles' and (jsonb_typeof(p->'subtitles') is distinct from 'array' or jsonb_array_length(p->'subtitles')>24 or
    exists(select 1 from jsonb_array_elements(p->'subtitles') v where jsonb_typeof(v) is distinct from 'string' or length(v#>>'{}') not between 1 and 300)) then return false;end if;
  end loop;
 end if;
 return private.episode_content_valid_lot_b(private.lot_c_content_compat(c));
exception when others then return false;end;$$;

alter function private.episode_progress_valid(jsonb,jsonb) rename to episode_progress_valid_lot_b;
create function private.episode_progress_valid(c jsonb,p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare r jsonb:=p->'runtime';v jsonb;entry record;a jsonb;show jsonb:=r->'flow'->'performance';room text;
begin
 if not(c ? 'flow') then return private.episode_progress_valid_lot_b(c,p);end if;
 if jsonb_array_length(r->'visited')>13 or exists(select 1 from jsonb_array_elements_text(r->'visited') x where x not in ('village','house','library','workshop','inn','forest','bakery','lake','hamlet','clockshop','reserve','glade','keeper')) then return false;end if;
 select coalesce(jsonb_agg(distinct case when x#>>'{}' in ('reserve','glade','keeper') then '"forest"'::jsonb else x end),'[]') into v from jsonb_array_elements(r->'visited') x;
 p:=jsonb_set(p,'{runtime,visited}',v);
 room:=r->'presentation'->'location'->>'room';
 if room in ('reserve','glade','keeper') then p:=jsonb_set(p,'{runtime,presentation,location,room}','"forest"');end if;
 if show is not null and show<>'null'::jsonb then
  select ac into a from jsonb_array_elements(c->'scenes') sc,jsonb_array_elements(sc->'flow'->'actions') ac where ac->>'id'=show->>'action' and ac ? 'performance';
  if a is null or jsonb_typeof(show->'elapsed') is distinct from 'number' or (show->>'elapsed')::numeric not between 0 and (a->'performance'->>'duration')::numeric then return false;end if;
 end if;
 if r->'flow' ? 'previousClock' and (jsonb_typeof(r->'flow'->'previousClock') is distinct from 'number' or (r->'flow'->>'previousClock')::numeric<0 or (r->'flow'->>'previousClock')::numeric>=180000) then return false;end if;
 for entry in select * from jsonb_each(coalesce(r->'flow'->'steps','{}')) loop
  if exists(select 1 from jsonb_array_elements(c->'scenes') sc,jsonb_array_elements(sc->'flow'->'actions') ac where (sc->>'id')||'/'||(ac->>'id')=entry.key and ac ? 'performance') then
   if entry.value<>'1'::jsonb then return false;end if;
   p:=jsonb_set(p,'{runtime,flow,steps}',(p->'runtime'->'flow'->'steps')-entry.key);
  end if;
 end loop;
 p:=jsonb_set(p,'{runtime,flow}',(p->'runtime'->'flow')-'performance'-'previousClock');
 return private.episode_progress_valid_lot_b(private.lot_c_content_compat(c),p);
exception when others then return false;end;$$;

revoke all on function private.lot_c_content_compat(jsonb) from public;
revoke all on function private.episode_content_valid_lot_b(jsonb) from public;
revoke all on function private.episode_progress_valid_lot_b(jsonb,jsonb) from public;

alter function private.episode_context(integer,boolean) rename to episode_context_lot_b;
create function private.episode_context(p_day integer,p_preview boolean) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;regions jsonb;row record;definition jsonb;choices jsonb;style jsonb;creation jsonb;shared jsonb;
begin
 -- Keep the existing authenticated/date/preview boundary before reading any history.
 result:=private.episode_context_lot_b(p_day,p_preview);
 select coalesce(jsonb_agg(distinct gate.key),'[]') into regions from public.episode_progress e
 join private.episode_content c on c.day=e.day and c.version=e.content_version
 cross join lateral jsonb_each(coalesce(c.content->'flow'->'portalAccess','{}')) gate
 where e.user_id=auth.uid() and e.mode=case when p_preview then 'preview' else 'live' end
 and (p_preview or private.day_unlocked(e.day)) and
 gate.key in ('forest','bakery','lake','hamlet','clockshop','reserve','glade','keeper')
 and (e.progress->>'sceneIndex')::int>=(gate.value->>'after')::int;
 for row in select e.progress,c.content from public.episode_progress e
 join private.episode_content c on c.day=e.day and c.version=e.content_version
 where e.user_id=auth.uid() and e.day<p_day and e.restored_at is not null
 and e.mode=case when p_preview then 'preview' else 'live' end
 and (p_preview or private.day_unlocked(e.day)) and c.content->'flow' ? 'theatre' order by e.day loop
  definition:=row.content->'flow'->'theatre';
  if definition ? 'requires' and not(row.progress->'objectives' ? (definition->>'requires')) then continue;end if;
  choices:=coalesce(row.progress->'choices','{}')||coalesce(row.progress->'runtime'->'flow'->'sideChoices','{}');
  style:=case when definition ? 'inherited' then result->'facts'->(definition->>'inherited') else choices->(definition->>'style') end;
  if style is not null and style#>>'{}' not in ('option-1','option-2','option-3') then raise exception 'Choix visuel incompatible';end if;
  creation:=jsonb_build_object('point',coalesce(definition->'persistentPoint',definition->'point'),'style',coalesce(style,'null'::jsonb),'built',true);
 end loop;
 for row in select e.day,e.progress,c.content from public.episode_progress e
 join private.episode_content c on c.day=e.day and c.version=e.content_version
 where e.user_id=auth.uid() and e.day<p_day and e.restored_at is not null
 and e.mode=case when p_preview then 'preview' else 'live' end
 and (p_preview or private.day_unlocked(e.day)) and c.content->'flow' ? 'confidences' order by e.day loop
  for shared in select * from jsonb_array_elements(row.content->'flow'->'confidences') loop
   if shared->>'status'='shared' and row.progress->'objectives' ? (shared->>'requires') then
    result:=jsonb_set(result,'{pages}',(result->'pages')||jsonb_build_array(jsonb_build_object('day',row.day,'title',shared->>'author','text',shared->>'text')));
   end if;
  end loop;
 end loop;
 result:=result||jsonb_build_object('regions',regions);
 if creation is not null then result:=result||jsonb_build_object('theatre',creation);end if;
 return result;
end;$$;
revoke all on function private.episode_context(integer,boolean),private.episode_context_lot_b(integer,boolean) from public,anon,authenticated;
revoke all on function private.episode_content_valid(jsonb),private.episode_progress_valid(jsonb,jsonb),private.lot_c_content_compat(jsonb) from public,anon,authenticated;
