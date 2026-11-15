begin;
do $$ begin
if (select count(*) from public.municipalities where state_code='MA')<>351 then raise exception 'Expected 351 municipalities';end if;
if exists(select state_code,official_state_id from public.municipalities group by 1,2 having count(*)<>1) then raise exception 'Duplicate municipality IDs';end if;
if exists(select 1 from public.municipalities where boundary is null or not extensions.ST_IsValid(boundary) or extensions.ST_GeometryType(boundary)<>'ST_MultiPolygon') then raise exception 'Invalid boundary';end if;
if exists(select 1 from public.issues where publication_status='published' and (geo_status<>'eligible_verified' or not media_approved)) then raise exception 'Unsafe publication';end if;
if has_table_privilege('anon','public.submissions','select') then raise exception 'Anon can read intake';end if;
if has_column_privilege('authenticated','public.submissions','claim_hash','select') then raise exception 'Claim hash exposed';end if;
if has_column_privilege('authenticated','public.submissions','note','select') then raise exception 'Private note exposed';end if;
if has_function_privilege('anon','public.import_massgis(jsonb,jsonb)','execute') then raise exception 'Public import executable';end if;
if has_function_privilege('authenticated','public.claim_submission(uuid,text,uuid)','execute') then raise exception 'Claim bypass executable';end if;
if exists(select 1 from storage.buckets where id in ('originals','approved') and public) then raise exception 'Private media bucket public';end if;
end $$;
set local role anon;
select id,name from public.search_places('Cambridge');
do $$ begin begin perform id from public.submissions;raise exception 'Private read unexpectedly succeeded';exception when insufficient_privilege then null;end;end $$;
rollback;
