import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {imageSize} from 'npm:image-size@2.0.2';
const url=Deno.env.get('SUPABASE_URL')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
const allowed=new Set(['https://ourcommon.co','https://www.ourcommon.co','http://127.0.0.1:5173','http://localhost:5173','http://127.0.0.1:4173']);
const categories=['Litter / public bins','Illegal dumping','Pothole / road damage','Sidewalk obstruction','Public graffiti','Park / trail maintenance','Signs / drains / lighting','Roadkill','Stinging insects / nests','Other non-emergency safety hazard','Other public infrastructure'];
const uuid=(s:unknown):s is string=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const tokenValid=(s:unknown):s is string=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('');
const hash=async(s:string)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
async function receiptToken(idempotency:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(service),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`common-receipt-v1:${idempotency}`)));}
function fail(message:string,status=400):never{throw Object.assign(new Error(message),{status});}
async function limited(bucket:string,max:number,seconds:number){const{data,error}=await db.rpc('consume_rate_limit',{p_bucket:bucket,p_limit:max,p_seconds:seconds});if(error||!data)fail('Too many requests. Please wait before trying again.',429);}
const safeReport='id,created_at,category,status,place_label,issue_id';
async function lookupReceipt(id:unknown,token:unknown){if(!uuid(id)||!tokenValid(token))fail('Receipt unavailable.',404);const{data,error}=await db.from('submissions').select('*').eq('id',id).eq('claim_hash',await hash(token)).is('claim_revoked_at',null).gt('expires_at',new Date().toISOString()).maybeSingle();if(error||!data)fail('Receipt unavailable or revoked.',404);return data;}
Deno.serve(async req=>{
 const origin=req.headers.get('origin');const cors={'Access-Control-Allow-Origin':origin&&allowed.has(origin)?origin:'https://ourcommon.co','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
 const send=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
 if(origin&&!allowed.has(origin))return send({error:'Origin not allowed.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});if(req.method!=='POST')return send({error:'POST required.'},405);
 try{
 if(Number(req.headers.get('content-length')||0)>20000)fail('Request too large.',413);
 const raw=await req.text();if(raw.length>20000)fail('Request too large.',413);const b=JSON.parse(raw);if(!b||typeof b.action!=='string')fail('Invalid action.');
 const network=await hash(`${service}:${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'}`);await limited(`network:${network}:${Math.floor(Date.now()/3600000)}`,120,3600);
 let userId:string|null=null;const bearer=req.headers.get('authorization');if(bearer){const{data,error}=await db.auth.getUser(bearer.replace(/^Bearer /i,''));if(error||!data.user)fail('Please sign in again.',401);userId=data.user.id;}
 const requireUser=()=>{if(!userId)fail('Sign in is required.',401);return userId!;};
 if(b.action==='intake'){
 await limited(`intake:${network}:${Math.floor(Date.now()/3600000)}`,10,3600);
 if(!uuid(b.idempotency_key)||typeof b.lat!=='number'||typeof b.lng!=='number'||!Number.isFinite(b.lat)||!Number.isFinite(b.lng)||b.lat< -90||b.lat>90||b.lng< -180||b.lng>180)fail('Confirm a valid issue location.');
 if(typeof b.note!=='string'||b.note.length>500||typeof b.place_label!=='string'||b.place_label.trim().length<2||b.place_label.length>200||!categories.includes(b.category))fail('Invalid report details.');
 if(b.confirmed!==true)fail('Confirm the issue pin.');if(/downed.{0,15}(line|wire)|live.{0,10}wire|\bfire\b|\binjur(y|ies|ed)\b|immediate.{0,15}danger|anaphyla(?:xis|ctic)|severe.{0,15}allergic.{0,10}reaction|(?:trouble|difficulty).{0,10}breathing/i.test(b.note))fail('This may be an emergency. Move to safety and contact emergency services; Common does not dispatch help.');
 if(!['image/jpeg','image/png','image/webp'].includes(b.mime)||!Number.isInteger(b.bytes)||b.bytes<1||b.bytes>10485760)fail('Invalid photo type or size.');
 const token=await receiptToken(b.idempotency_key);let{data:record,error}=await db.from('submissions').select('*').eq('idempotency_key',b.idempotency_key).maybeSingle();if(error)fail('Could not check submission. Please retry.',503);
 if(record&&(record.claim_revoked_at||record.user_id!==userId))fail('This report belongs to a different session.',403);
 if(!record){const id=crypto.randomUUID();const path=`${id}/original`;const{data,error}=await db.from('submissions').insert({id,idempotency_key:b.idempotency_key,user_id:userId,point:`SRID=4326;POINT(${b.lng} ${b.lat})`,place_label:b.place_label.trim(),category:b.category,note:b.note,photo_path:path,photo_mime:b.mime,photo_bytes:b.bytes,claim_hash:await hash(token)}).select('*').single();if(error){if(error.code==='23505')fail('A matching request is being saved. Retry to retrieve it.',409);fail('Report could not be saved. Please retry.',503);}record=data;}
 if(record.status!=='awaiting_upload')return send({id:record.id,token,status:record.status});
 const{data,error:uploadError}=await db.storage.from('originals').createSignedUploadUrl(record.photo_path,{upsert:false});if(uploadError||!data)fail('Could not prepare private upload. Retry safely.',503);return send({id:record.id,token,status:record.status,path:record.photo_path,upload_token:data.token});
 }
 if(b.action==='finalize'){
 const record=await lookupReceipt(b.id,b.token);if(record.status!=='awaiting_upload')return send({id:record.id,status:record.status});
 const{data:blob,error}=await db.storage.from('originals').download(record.photo_path);if(error||!blob)fail('Photo upload is not complete. Retry the upload.');
 if(blob.size!==record.photo_bytes||blob.size>10485760)fail('Uploaded photo size does not match.');
 const bytes=new Uint8Array(await blob.arrayBuffer());let dimensions;try{dimensions=imageSize(bytes);}catch{fail('Photo could not be decoded.');}
 const mime=dimensions!.type==='jpg'?'image/jpeg':`image/${dimensions!.type}`;if(mime!==record.photo_mime||dimensions!.width<200||dimensions!.height<200||dimensions!.width>12000||dimensions!.height>12000)fail('Photo dimensions or actual file type are invalid.');
 // Atomic finalization creates the media row and geographic hold in a database transaction.
 const{error:finalError}=await db.rpc('finalize_submission',{p_id:record.id});if(finalError)fail('Could not finalize the report. Retry safely.',503);return send({id:record.id,status:'under_review'});
 }
 if(b.action==='track'){
 await limited(`track:${network}:${Math.floor(Date.now()/3600000)}`,40,3600);const r=await lookupReceipt(b.id,b.token);return send(Object.fromEntries(safeReport.split(',').map(k=>[k,r[k]])));
 }
 if(b.action==='claim'){
 const uid=requireUser();if(!uuid(b.id)||!tokenValid(b.token))fail('Invalid receipt.',404);await limited(`claim:${uid}:${Math.floor(Date.now()/3600000)}`,10,3600);const{error}=await db.rpc('claim_submission',{p_id:b.id,p_hash:await hash(b.token),p_user:uid});if(error)fail('Receipt unavailable or already claimed.',409);return send({claimed:true});
 }
 if(b.action==='my-reports'||b.action==='owner-receipt'){
 const uid=requireUser();let query=db.from('submissions').select(safeReport).eq('user_id',uid).order('created_at',{ascending:false}).limit(200);if(b.action==='owner-receipt'){if(!uuid(b.id))fail('Receipt unavailable.',404);query=query.eq('id',b.id);}const{data,error}=await query;if(error)fail('Could not load reports.',503);if(b.action==='owner-receipt'&&!data?.length)fail('Receipt unavailable.',404);return send(b.action==='owner-receipt'?data![0]:data);
 }
 if(b.action==='coverage-request'){
 if(!uuid(b.municipality_id))fail('Invalid municipality.');await limited(`coverage:${network}`,5,86400);const{error}=await db.from('coverage_requests').insert({municipality_id:b.municipality_id});if(error)fail('Could not record coverage request.',503);return send({recorded:true});
 }
 if(b.action==='geocode'){
 if(typeof b.q!=='string'||b.q.trim().length<3||b.q.length>200)fail('Enter a street and city.');await limited('geocoder-global-second',1,1);await limited(`geocode:${network}`,25,3600);
 const provider=Deno.env.get('GEOCODER_BASE_URL');if(!provider||!provider.startsWith('https://'))fail('Address search is not configured yet. Use coordinates or move the map pin.',503);const q=encodeURIComponent(b.q);const r=await fetch(`${provider}?format=jsonv2&countrycodes=us&viewbox=-73.6,42.95,-69.85,41.2&bounded=1&limit=5&q=${q}`,{headers:{'User-Agent':'Common/0.1 (https://ourcommon.co)','Accept-Language':'en'}});if(!r.ok)fail('Address search is unavailable. Enter coordinates or move the map pin.',503);const list=await r.json();return send(list.map((p:{display_name:string;lat:string;lon:string})=>({label:p.display_name,lat:Number(p.lat),lng:Number(p.lon)})));
 }
 if(b.action==='issue'){
 if(!uuid(b.public_id))fail('Issue not found.',404);const{data:issue}=await db.from('issues').select('id,public_id,title,category,public_location,first_reported_at,verified_fixed_at,maintenance_status,agency_status,verification_status,routing_delivery_status,reopened_at').eq('public_id',b.public_id).eq('publication_status','published').eq('geo_status','eligible_verified').eq('media_approved',true).maybeSingle();if(!issue)fail('Issue not found or not public.',404);
 const{data:events}=await db.from('issue_events').select('id,created_at,public_summary,evidence_type').eq('issue_id',issue.id).eq('public_visible',true).order('created_at');const{data:media}=await db.from('media').select('derivative_path').eq('issue_id',issue.id).eq('privacy_status','approved').not('derivative_path','is',null);const photos:string[]=[];for(const m of media||[]){const{data}=await db.storage.from('approved').createSignedUrl(m.derivative_path,300);if(data)photos.push(data.signedUrl);}return send({issue,events:events||[],photos});
 }
 if(b.action==='community-check'){
 const uid=requireUser();if(!uuid(b.public_id)||typeof b.answer!=='boolean')fail('Invalid check.');await limited(`checks:${uid}`,5,86400);const{data:issue}=await db.from('issues').select('id').eq('public_id',b.public_id).eq('publication_status','published').maybeSingle();if(!issue)fail('Issue not found.',404);const{error}=await db.from('community_checks').insert({issue_id:issue.id,user_id:uid,answer:b.answer});if(error)fail(error.code==='23505'?'You have already submitted a check for this case.':'Could not save this check.',409);return send({pending_review:true});
 }
 fail('Action not available.',404);
 }catch(e){const error=e as Error&{status?:number};return send({error:error.status?error.message:'The request could not be completed. Please retry.'},error.status||500);}
});
