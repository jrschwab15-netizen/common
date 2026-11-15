alter table public.place_aliases add column source_comment text;
create function public.import_massgis_aliases(p_rows jsonb,p_manifest jsonb) returns integer language plpgsql security invoker set search_path='' as $$ declare sid uuid; n int; begin
if jsonb_array_length(p_rows)<351 then raise exception 'Alias source unexpectedly small; review required';end if;
if exists(select 1 from jsonb_array_elements(p_rows) r where not exists(select 1 from public.municipalities m where m.official_state_id=r->>'official_state_id' and m.state_code='MA')) then raise exception 'Unmatched parent; review source';end if;
insert into public.data_sources(key,name,url,version,checksum,metadata) values('massgis-aliases','MassGIS Community Names',p_manifest->>'source_url',p_manifest->>'source_version',p_manifest->>'checksum',p_manifest) on conflict(key) do update set version=excluded.version,checksum=excluded.checksum,metadata=excluded.metadata returning id into sid;
insert into public.place_aliases(municipality_id,alias,alias_normalized,alias_type,source_id,review_status,source_comment)
select m.id,r->>'alias',r->>'alias_normalized','alternate',sid,'approved',r->>'source_comment' from jsonb_array_elements(p_rows) r join public.municipalities m on m.official_state_id=r->>'official_state_id' and m.state_code='MA'
on conflict(municipality_id,alias_normalized,source_id) do update set alias=excluded.alias,review_status='approved',source_comment=excluded.source_comment where (place_aliases.alias,place_aliases.review_status,place_aliases.source_comment) is distinct from (excluded.alias,excluded.review_status,excluded.source_comment);
get diagnostics n=row_count;
update public.place_aliases a set review_status='rejected' where source_id=sid and review_status<>'rejected' and not exists(select 1 from jsonb_array_elements(p_rows) r join public.municipalities m on m.official_state_id=r->>'official_state_id' where m.id=a.municipality_id and r->>'alias_normalized'=a.alias_normalized);
return n;end $$;
revoke all on function public.import_massgis_aliases(jsonb,jsonb) from public,anon,authenticated;grant execute on function public.import_massgis_aliases(jsonb,jsonb) to service_role;
