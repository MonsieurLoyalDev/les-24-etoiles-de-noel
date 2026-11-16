-- Additive bridge. Preserve every historical village/advent row; no story content.
alter function public.episode_load(integer,boolean,boolean,boolean) rename to episode_load_v1;
alter function public.episode_load_v1(integer,boolean,boolean,boolean) set schema private;
revoke all on function private.episode_load_v1(integer,boolean,boolean,boolean) from public,anon,authenticated;
create function public.episode_load(p_day integer,p_preview boolean default false,p_replay boolean default false,p_restart boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; finished timestamptz;
begin
 result:=private.episode_load_v1(p_day,p_preview,p_replay,p_restart);
 select completed_at into finished from public.episode_progress where user_id=auth.uid() and day=p_day and run_id=(result->>'runId')::uuid;
 return result||jsonb_build_object('completedAt',finished);
end;$$;
revoke all on function public.episode_load(integer,boolean,boolean,boolean) from public,anon;
grant execute on function public.episode_load(integer,boolean,boolean,boolean) to authenticated;
alter function private.episode_progress_valid(jsonb,jsonb) rename to episode_progress_valid_v1;
create function private.episode_progress_valid(c jsonb,p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare x jsonb:=p->'runtime'->'presentation'; loc jsonb; point jsonb;
begin
 if not private.episode_progress_valid_v1(c,p) then return false; end if;
 if c->>'day'='1' and (p->>'complete')::boolean and not coalesce((p->'runtime'->>'bookOpened')::boolean,false) then return false; end if;
 if x is null then return true; end if;
 if jsonb_typeof(x) is distinct from 'object' or jsonb_typeof(x->'introSeen') is distinct from 'boolean' or
  jsonb_typeof(x->'introRemaining') is distinct from 'number' or (x->>'introRemaining')::numeric not between 0 and 4000 or
  not (x ? 'moment') or (x->'moment'<>'null'::jsonb and x->>'moment' not in ('tree','invitation')) or
  jsonb_typeof(x->'hintSpoken') is distinct from 'number' or (x->>'hintSpoken')::int not between 0 and 3 or
  jsonb_typeof(x->'optional') is distinct from 'array' or jsonb_array_length(x->'optional')>100 or
  exists(select 1 from jsonb_array_elements(x->'optional') v where jsonb_typeof(v)<>'string' or length(v#>>'{}')>80) or
  not (x ? 'completedAt') or (x->'completedAt'<>'null'::jsonb and jsonb_typeof(x->'completedAt')<>'string') then return false; end if;
 if x->'completedAt'<>'null'::jsonb then perform (x->>'completedAt')::timestamptz; end if;
 if x ? 'location' then
  loc:=x->'location';
  if jsonb_typeof(loc) is distinct from 'object' or not (loc ?& array['room','position','loyal','flocon']) or
   coalesce(loc->>'room','') not in ('village','house','library','workshop','inn') then return false; end if;
  for point in select value from jsonb_array_elements(jsonb_build_array(loc->'position',loc->'loyal')||case when loc->'flocon'='null'::jsonb then '[]'::jsonb else jsonb_build_array(loc->'flocon') end) loop
   if jsonb_typeof(point) is distinct from 'object' or jsonb_typeof(point->'x') is distinct from 'number' or jsonb_typeof(point->'y') is distinct from 'number' or
     (point->>'x')::numeric not between 0 and 1920 or (point->>'y')::numeric not between 0 and 1408 then return false; end if;
  end loop;
 end if;
 return true;
exception when others then return false;
end;$$;
revoke all on function private.episode_progress_valid(jsonb,jsonb) from public,anon,authenticated;
alter function public.episode_save(integer,boolean,uuid,integer,jsonb) rename to episode_save_v1;
alter function public.episode_save_v1(integer,boolean,uuid,integer,jsonb) set schema private;
revoke all on function private.episode_save_v1(integer,boolean,uuid,integer,jsonb) from public,anon,authenticated;

create function public.episode_save(p_day integer,p_preview boolean,p_run uuid,p_expected integer,p_progress jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; p public.episode_progress; c jsonb; s jsonb; o jsonb; had_complete boolean; restored boolean:=false;
begin
 select completed_at is not null into had_complete from public.episode_progress where user_id=auth.uid() and day=p_day and run_id=p_run;
 result:=private.episode_save_v1(p_day,p_preview,p_run,p_expected,p_progress);
 select * into p from public.episode_progress where user_id=auth.uid() and day=p_day and run_id=p_run;
 select content into c from private.episode_content where day=p_day and version=p.content_version;
 for s in select value from jsonb_array_elements(c->'scenes') loop
  if s->>'kind'='restore' then
   for o in select value from jsonb_array_elements(s->'objectives') loop
    if o->'event'->>'kind'='interact' and o->'event'->>'target'='restored-star' and
       p.progress->'objectives' ? ((s->>'id')||'/'||(o->>'id')) and (p.progress->'runtime'->>'restored')::boolean then restored:=true; end if;
   end loop;
  end if;
 end loop;
 update public.episode_progress set
  restored_at=case when restored then coalesce(restored_at,private.server_now()) else restored_at end,
  completed_at=case when not coalesce(had_complete,false) and completed_at is not null then private.server_now() else completed_at end
 where user_id=p.user_id and day=p.day and mode=p.mode returning * into p;
 return result||jsonb_build_object('restored',p.restored_at is not null,'completedAt',p.completed_at);
end;$$;
revoke all on function public.episode_save(integer,boolean,uuid,integer,jsonb) from public,anon;
grant execute on function public.episode_save(integer,boolean,uuid,integer,jsonb) to authenticated;

create or replace function public.advent_status(p_preview boolean default false) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_member() or (p_preview and not private.is_admin()) then raise exception 'Accès privé requis' using errcode='42501'; end if;
 select jsonb_agg(jsonb_build_object('day',d.day,
  'source',case when e.day is not null then 'narrative' else 'activity' end,
  'unlocked',(p_preview or private.day_unlocked(d.day)) and (e.day is not null or a.day is not null),
  'complete',case when e.day is not null then n.completed_at is not null else p.completed_at is not null end,
  'restored',case when e.day is not null then n.restored_at is not null else p.completed_at is not null end,
  'completedAt',case when e.day is not null then n.completed_at else p.completed_at end,
  'run',case when e.day is null and p.day is not null and (p_preview or private.day_unlocked(d.day)) then private.run_json(p) else null end) order by d.day) into result
 from generate_series(1,24) d(day)
 left join public.advent_days a on a.day=d.day
 left join private.episode_releases e on e.day=d.day
 left join public.advent_progress p on p.day=d.day and p.user_id=auth.uid() and p.mode=case when p_preview then 'preview' else 'live' end
 left join public.episode_progress n on n.day=d.day and n.user_id=auth.uid() and n.mode=case when p_preview then 'preview' else 'live' end;
 return result;
end;$$;
