create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create table public.data_sources(id uuid primary key default gen_random_uuid(),key text unique not null,name text not null,url text not null,version text not null,checksum text not null,metadata jsonb not null,created_at timestamptz not null default now());
create table public.municipalities(id uuid primary key default gen_random_uuid(),state_code text not null check(state_code='MA'),official_state_id text not null,name text not null,slug text unique not null,municipality_type text not null check(municipality_type in ('C','T','TC')),county text,boundary extensions.geometry(MultiPolygon,4326) not null check(extensions.ST_IsValid(boundary)),data_source_id uuid references public.data_sources not null,source_version text not null,imported_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(state_code,official_state_id));
create index municipalities_boundary on public.municipalities using gist(boundary);
create index municipalities_name on public.municipalities using gin(name extensions.gin_trgm_ops);
create table public.place_aliases(id uuid primary key default gen_random_uuid(),municipality_id uuid not null references public.municipalities,alias text not null,alias_normalized text not null,alias_type text not null check(alias_type in ('neighborhood','village','alternate','historic')),source_id uuid not null references public.data_sources,review_status text not null default 'pending' check(review_status in ('pending','approved','rejected')),unique(municipality_id,alias_normalized,source_id));
create index aliases_search on public.place_aliases using gin(alias_normalized extensions.gin_trgm_ops);
create table public.coverage(municipality_id uuid primary key references public.municipalities,directory_loaded boolean not null default false,public_reporting_enabled boolean not null default false,gis_responsibility_ready boolean not null default false,agency_routing_ready boolean not null default false,metrics_sufficient boolean not null default false,last_verified_at timestamptz);
create table public.issues(id uuid primary key default gen_random_uuid(),public_id uuid unique not null default gen_random_uuid(),municipality_id uuid references public.municipalities not null,title text not null,category text not null,public_location text not null,public_point extensions.geometry(Point,4326),publication_status text not null default 'private' check(publication_status in ('private','published','rejected')),maintenance_status text not null default 'open' check(maintenance_status in ('open','verified_fixed','reopened')),agency_status text not null default 'none' check(agency_status in ('none','notified','acknowledged','closed')),verification_status text not null default 'unverified' check(verification_status in ('unverified','pending','verified')),routing_delivery_status text not null default 'unavailable' check(routing_delivery_status in ('unavailable','queued','failed','delivered')),first_reported_at timestamptz not null,verified_fixed_at timestamptz,reopened_at timestamptz,geo_status text not null default 'uncertain_review' check(geo_status in ('eligible_verified','uncertain_review','ineligible_private','emergency_redirect')),media_approved boolean not null default false,check(publication_status<>'published' or (geo_status='eligible_verified' and media_approved)),check(verified_fixed_at is null or verified_fixed_at>=first_reported_at));
create index issues_place_status_age on public.issues(municipality_id,publication_status,category,maintenance_status,first_reported_at);
create table public.submissions(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users on delete set null,issue_id uuid references public.issues,municipality_id uuid references public.municipalities,created_at timestamptz not null default now(),point extensions.geometry(Point,4326) not null,place_label text not null,category text not null,note text not null default '' check(length(note)<=500),status text not null default 'awaiting_upload' check(status in ('awaiting_upload','under_review','accepted','rejected')),idempotency_key uuid unique not null,claim_hash text unique not null,claim_revoked_at timestamptz,claimed_at timestamptz,photo_path text not null,photo_mime text not null,photo_bytes integer not null check(photo_bytes>0 and photo_bytes<=10485760),expires_at timestamptz not null default now()+interval '90 days');
create index submissions_owner_date on public.submissions(user_id,created_at desc);
create index submissions_point on public.submissions using gist(point);
create table public.issue_events(id uuid primary key default gen_random_uuid(),issue_id uuid references public.issues not null,event_type text not null,created_at timestamptz not null default now(),public_summary text not null,evidence_type text not null,public_visible boolean not null default false,private_detail jsonb not null default '{}');
create table public.media(id uuid primary key default gen_random_uuid(),submission_id uuid references public.submissions not null,issue_id uuid references public.issues,original_path text not null,derivative_path text,privacy_status text not null default 'pending' check(privacy_status in ('pending','approved','rejected')),model_version text,review_reason text,created_at timestamptz not null default now());
create table public.community_checks(id uuid primary key default gen_random_uuid(),issue_id uuid references public.issues not null,user_id uuid references auth.users not null,answer boolean not null,note text not null default '' check(length(note)<=500),review_status text not null default 'pending',created_at timestamptz not null default now(),unique(issue_id,user_id));
create table public.geo_decisions(id uuid primary key default gen_random_uuid(),submission_id uuid references public.submissions not null,status text not null default 'uncertain_review',data_source_id uuid references public.data_sources,feature_id text,rule text not null,confidence numeric,reviewer_id uuid references auth.users,override_reason text,created_at timestamptz not null default now());
create table public.routing_attempts(id uuid primary key default gen_random_uuid(),issue_id uuid references public.issues not null,destination text not null,method text not null,payload_hash text not null,status text not null default 'queued',agency_service_id text,attempted_at timestamptz,acknowledged_at timestamptz,created_at timestamptz not null default now());
create table public.admin_audit_log(id uuid primary key default gen_random_uuid(),actor uuid references auth.users,action text not null,object_id uuid,reason text not null,detail jsonb not null default '{}',created_at timestamptz not null default now());
create table public.rate_limits(bucket text primary key,hits integer not null default 1,expires_at timestamptz not null);
create table public.coverage_requests(id uuid primary key default gen_random_uuid(),municipality_id uuid references public.municipalities not null,created_at timestamptz not null default now());

do $$ declare t text; begin foreach t in array array['data_sources','municipalities','place_aliases','coverage','issues','submissions','issue_events','media','community_checks','geo_decisions','routing_attempts','admin_audit_log','rate_limits','coverage_requests'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on public.%I from anon,authenticated',t); end loop; end $$;
grant select on public.data_sources,public.municipalities,public.coverage,public.place_aliases to anon,authenticated;
create policy directory_read on public.municipalities for select to anon,authenticated using(true);
create policy source_read on public.data_sources for select to anon,authenticated using(true);
create policy coverage_read on public.coverage for select to anon,authenticated using(true);
create policy alias_read on public.place_aliases for select to anon,authenticated using(review_status='approved');
grant select on public.issues to anon,authenticated;
create policy published_issues on public.issues for select to anon,authenticated using(publication_status='published' and geo_status='eligible_verified' and media_approved);
grant select(id,user_id,issue_id,created_at,category,status,place_label) on public.submissions to authenticated;
create policy own_submissions on public.submissions for select to authenticated using((select auth.uid())=user_id);
grant select(id,issue_id,event_type,created_at,public_summary,evidence_type,public_visible) on public.issue_events to anon,authenticated;
create policy public_events on public.issue_events for select to anon,authenticated using(public_visible and exists(select 1 from public.issues i where i.id=issue_id and i.publication_status='published'));
grant select(id,issue_id,derivative_path,privacy_status) on public.media to anon,authenticated;
create policy approved_derivatives on public.media for select to anon,authenticated using(privacy_status='approved' and derivative_path is not null and exists(select 1 from public.issues i where i.id=issue_id and i.publication_status='published'));

create function public.search_places(q text) returns table(id uuid,name text,slug text,county text,municipality_type text,matched_alias text) language sql stable security invoker set search_path='' as $$
 select distinct on (score,m.id) m.id,m.name,m.slug,m.county,m.municipality_type,a.alias from public.municipalities m
 left join public.place_aliases a on a.municipality_id=m.id and a.review_status='approved'
 cross join lateral (select greatest(extensions.similarity(lower(m.name),lower(extensions.unaccent(left(q,100)))),coalesce(extensions.similarity(a.alias_normalized,lower(extensions.unaccent(left(q,100)))),0)) score) s
 where length(trim(q))>=2 and (lower(m.name) like '%'||lower(extensions.unaccent(left(q,100)))||'%' or a.alias_normalized like '%'||lower(extensions.unaccent(left(q,100)))||'%' or s.score>0.25)
 order by score desc,m.id limit 12;
$$;
revoke all on function public.search_places(text) from public;grant execute on function public.search_places(text) to anon,authenticated;

create function public.consume_rate_limit(p_bucket text,p_limit int,p_seconds int) returns boolean language plpgsql security invoker set search_path='' as $$ declare n int; begin
 insert into public.rate_limits(bucket,hits,expires_at) values(p_bucket,1,now()+make_interval(secs=>p_seconds)) on conflict(bucket) do update set hits=case when rate_limits.expires_at<now() then 1 else rate_limits.hits+1 end,expires_at=case when rate_limits.expires_at<now() then now()+make_interval(secs=>p_seconds) else rate_limits.expires_at end returning hits into n;return n<=p_limit;end $$;
revoke all on function public.consume_rate_limit(text,int,int) from public,anon,authenticated;grant execute on function public.consume_rate_limit(text,int,int) to service_role;

create function public.claim_submission(p_id uuid,p_hash text,p_user uuid) returns uuid language plpgsql security invoker set search_path='' as $$ declare result uuid;begin
 update public.submissions set user_id=p_user,claimed_at=now(),claim_revoked_at=now() where id=p_id and claim_hash=p_hash and claim_revoked_at is null and user_id is null and status<>'awaiting_upload' and expires_at>now() returning id into result;
 if result is null then raise exception 'Receipt unavailable or already claimed';end if; return result;end $$;
revoke all on function public.claim_submission(uuid,text,uuid) from public,anon,authenticated;grant execute on function public.claim_submission(uuid,text,uuid) to service_role;
create function public.prevent_history_mutation() returns trigger language plpgsql set search_path='' as $$ begin raise exception 'History is append-only';end $$;
create trigger immutable_events before update or delete on public.issue_events for each row execute function public.prevent_history_mutation();
create trigger immutable_audit before update or delete on public.admin_audit_log for each row execute function public.prevent_history_mutation();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('originals','originals',false,10485760,array['image/jpeg','image/png','image/webp']),('approved','approved',false,10485760,array['image/jpeg','image/png','image/webp']);
-- No client Storage policies. Edge Functions issue signed uploads; originals never get public URLs.

create function public.import_massgis(p_features jsonb,p_manifest jsonb) returns integer language plpgsql security invoker set search_path='' as $$ declare sid uuid; n int; begin
if jsonb_array_length(p_features)<>351 or (select count(distinct f->'properties'->>'TOWN_ID') from jsonb_array_elements(p_features) f)<>351 then raise exception 'Expected 351 unique IDs'; end if;
insert into public.data_sources(key,name,url,version,checksum,metadata) values('massgis-municipalities','MassGIS Municipalities',p_manifest->>'source_url',p_manifest->>'source_version',p_manifest->>'checksum',p_manifest) on conflict(key) do update set version=excluded.version,checksum=excluded.checksum,metadata=excluded.metadata returning id into sid;
insert into public.municipalities(state_code,official_state_id,name,slug,municipality_type,county,boundary,data_source_id,source_version)
select 'MA',f->'properties'->>'TOWN_ID',initcap(lower(f->'properties'->>'TOWN')),trim(both '-' from regexp_replace(lower(f->'properties'->>'TOWN'),'[^a-z0-9]+','-','g'))||'-ma-'||(f->'properties'->>'TOWN_ID'),f->'properties'->>'TYPE',f->'properties'->>'COUNTY',extensions.ST_Multi(extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON((f->'geometry')::text),4326)),sid,p_manifest->>'source_version'
from jsonb_array_elements(p_features) f
on conflict(state_code,official_state_id) do update set name=excluded.name,municipality_type=excluded.municipality_type,county=excluded.county,boundary=excluded.boundary,source_version=excluded.source_version where (municipalities.name,municipalities.source_version) is distinct from (excluded.name,excluded.source_version);
get diagnostics n=row_count;
insert into public.coverage(municipality_id,directory_loaded) select id,true from public.municipalities on conflict(municipality_id) do update set directory_loaded=true;
if (select count(*) from public.municipalities where state_code='MA')<>351 then raise exception 'Final count incorrect';end if;
return n;end $$;
revoke all on function public.import_massgis(jsonb,jsonb) from public,anon,authenticated;grant execute on function public.import_massgis(jsonb,jsonb) to service_role;
