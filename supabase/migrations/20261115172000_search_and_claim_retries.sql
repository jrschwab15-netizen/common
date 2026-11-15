create or replace function public.search_places(q text) returns table(id uuid,name text,slug text,county text,municipality_type text,matched_alias text) language sql stable security invoker set search_path='' as $$
with query as(select lower(extensions.unaccent(trim(left(q,100)))) term)
select m.id,m.name,m.slug,m.county,m.municipality_type,case when lower(extensions.unaccent(m.name))=query.term then null else a.alias end
from public.municipalities m cross join query
left join lateral(select pa.alias,pa.alias_normalized from public.place_aliases pa where pa.municipality_id=m.id and pa.review_status='approved' and (pa.alias_normalized like '%'||query.term||'%' or extensions.similarity(pa.alias_normalized,query.term)>0.3) order by (pa.alias_normalized=query.term) desc,extensions.similarity(pa.alias_normalized,query.term) desc,pa.alias limit 1) a on true
where length(query.term)>=2 and (lower(extensions.unaccent(m.name)) like '%'||query.term||'%' or extensions.similarity(lower(extensions.unaccent(m.name)),query.term)>0.25 or a.alias is not null)
order by (lower(extensions.unaccent(m.name))=query.term) desc,(a.alias_normalized=query.term) desc nulls last,greatest(extensions.similarity(lower(extensions.unaccent(m.name)),query.term),coalesce(extensions.similarity(a.alias_normalized,query.term),0)) desc,m.name limit 12;
$$;
create or replace function public.claim_submission(p_id uuid,p_hash text,p_user uuid) returns uuid language plpgsql security invoker set search_path='' as $$ declare result uuid;begin
 update public.submissions set user_id=p_user,claimed_at=now(),claim_revoked_at=now() where id=p_id and claim_hash=p_hash and claim_revoked_at is null and user_id is null and status<>'awaiting_upload' and expires_at>now() returning id into result;
 if result is null then select id into result from public.submissions where id=p_id and claim_hash=p_hash and user_id=p_user and claimed_at is not null;end if;
 if result is null then raise exception 'Receipt unavailable or already claimed';end if; return result;end $$;
