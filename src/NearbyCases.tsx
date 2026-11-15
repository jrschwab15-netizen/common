import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from './lib';
import {publicPoint,type MapIssue} from './map-data';
export function nearbyMatches(rows:MapIssue[],lat:number,lng:number,category:string){
 const rad=(n:number)=>n*Math.PI/180;
 return rows.flatMap(issue=>{const p=publicPoint(issue.public_point);if(!p||issue.category!==category||issue.maintenance_status==='verified_fixed')return[];const a=Math.sin(rad(p[0]-lat)/2)**2+Math.cos(rad(lat))*Math.cos(rad(p[0]))*Math.sin(rad(p[1]-lng)/2)**2;const distance=6371000*2*Math.asin(Math.sqrt(Math.min(1,a)));return distance<=150?[{...issue,distance}]:[];}).sort((a,b)=>a.distance-b.distance);
}
export default function NearbyCases({lat,lng,category}:{lat:number;lng:number;category:string}){
 const [rows,setRows]=useState<MapIssue[]>([]),[state,setState]=useState<'loading'|'ready'|'error'>('loading'),[partial,setPartial]=useState(false);
 useEffect(()=>{const controller=new AbortController();setState('loading');setRows([]);setPartial(false);void(async()=>{try{const collected:MapIssue[]=[];for(let offset=0;offset<5000;offset+=500){const{data,error}=await supabase.from('issues').select('id,public_id,title,category,public_location,public_point,maintenance_status,first_reported_at').eq('publication_status','published').eq('category',category).neq('maintenance_status','verified_fixed').not('public_point','is',null).order('id').range(offset,offset+499).abortSignal(controller.signal);if(controller.signal.aborted)return;if(error)throw error;collected.push(...(data||[]));if((data||[]).length<500)break;if(offset===4500)setPartial(true);}if(!controller.signal.aborted){setRows(collected);setState('ready');}}catch{if(!controller.signal.aborted)setState('error');}})();return()=>controller.abort();},[category,lat,lng]);
 const matches=nearbyMatches(rows,lat,lng,category);
 if(state==='ready'&&!matches.length&&!partial)return null;
 return <aside className="nearby-cases" aria-label="Nearby existing cases"><h2>Already reported nearby?</h2>
 {state==='loading'?<p role="status">Checking nearby cases…</p>:state==='error'?<p role="status">Nearby cases could not be checked. You can continue; reviewers still check for duplicates.</p>:<><p>Open cases in the same category, within 150 m of your pin. Check whether one is the same issue before starting another report.</p>{matches.slice(0,5).map(issue=><article key={issue.id}><div><strong>{issue.title}</strong><small>{Math.round(issue.distance)} m away · {issue.public_location}</small></div><Link to={'/issues/'+issue.public_id}>Check existing case →</Link></article>)}{matches.length>5&&<p>{matches.length-5} more nearby matches. The closest five are shown.</p>}{partial&&<p>Some cases may not be shown. Reviewers will also check for duplicates.</p>}<small>These are possible matches, not automatic merges. Your draft stays saved if you open a case.</small></>}
 </aside>;
}
