import {useEffect,useMemo,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {categoryCounts,publicPoint,reportAreas,type MapIssue} from './map-data';
import {loadGoogleMaps,commonMapStyles,type CityBounds,type CityGoogleMap,type CityMapsAPI} from './google-maps';

function boundaryPoints(value:unknown):{lat:number;lng:number}[]{
 const result:{lat:number;lng:number}[]=[];
 const walk=(v:unknown)=>{if(!v||typeof v!=='object')return;if(Array.isArray(v)){if(v.length>=2&&typeof v[0]==='number'&&typeof v[1]==='number')result.push({lng:v[0],lat:v[1]});else v.forEach(walk);}else{const o=v as Record<string,unknown>;if(o.coordinates)walk(o.coordinates);if(o.geometry)walk(o.geometry);if(o.features)walk(o.features);}};walk(value);return result;
}
export default function CityMap({name,boundary,issues}:{name:string;boundary:unknown;issues:MapIssue[]}){
 const root=useRef<HTMLDivElement>(null),map=useRef<CityGoogleMap|null>(null),api=useRef<CityMapsAPI|null>(null),cityBounds=useRef<CityBounds|null>(null);
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[bounds,setBounds]=useState<CityBounds|null>(null),[density,setDensity]=useState(false),[selected,setSelected]=useState<MapIssue[]|null>(null);
 const navigate=useNavigate();
 const mapped=useMemo(()=>issues.filter(i=>publicPoint(i.public_point)),[issues]);
 const visible=mapped.filter(i=>!bounds||bounds.contains({lat:publicPoint(i.public_point)![0],lng:publicPoint(i.public_point)![1]}));
 const counts=categoryCounts(visible),areas=reportAreas(visible);
 useEffect(()=>{
  let cancelled=false;const listeners:{remove:()=>void}[]=[];
  setReady(false);setFailed(false);setSelected(null);
  const failure=()=>{if(!cancelled)setFailed(true);};window.gm_authFailure=failure;
  void(async()=>{try{const loaded=await loadGoogleMaps();await loaded.importLibrary('maps');if(cancelled||!root.current)return;
   const g=loaded as unknown as CityMapsAPI;api.current=g;
   const points=boundaryPoints(boundary),extent=new g.LatLngBounds();points.forEach(p=>extent.extend(p));
   const instance=new g.Map(root.current,{center:points[0]||{lat:42.36,lng:-71.06},zoom:13,styles:commonMapStyles,mapTypeId:'roadmap',mapTypeControl:false,streetViewControl:false,fullscreenControl:true,gestureHandling:'cooperative',clickableIcons:false});map.current=instance;
   if(!extent.isEmpty()){cityBounds.current=extent;instance.fitBounds(extent,32);}else{await loaded.importLibrary('geocoding');const result=await new g.Geocoder().geocode({address:name+', Massachusetts, USA'});if(cancelled)return;const viewport=result.results[0]?.geometry.viewport;if(viewport){cityBounds.current=viewport;instance.fitBounds(viewport,24);}}
   if(boundary){try{instance.data.addGeoJson(boundary);instance.data.setStyle({strokeColor:'#205bd6',strokeWeight:2,fillOpacity:.025,clickable:false});}catch{/* Reports stay visible if the boundary is unavailable. */}}
   listeners.push(instance.addListener('idle',()=>{if(!cancelled)setBounds(instance.getBounds()||null);}));setBounds(instance.getBounds()||null);setReady(true);
  }catch{if(!cancelled)setFailed(true);}})();
  return()=>{cancelled=true;listeners.forEach(l=>l.remove());map.current=null;api.current=null;cityBounds.current=null;if(window.gm_authFailure===failure)delete window.gm_authFailure;};
 },[name,boundary]);
 useEffect(()=>{
  const g=api.current,instance=map.current;if(!ready||!g||!instance)return;setSelected(null);const cleanup:(()=>void)[]=[];
  if(density){for(const area of reportAreas(mapped)){const circle=new g.Circle({map:instance,center:{lat:area.lat,lng:area.lng},radius:180,strokeColor:'#e87951',strokeWeight:2,fillColor:'#e87951',fillOpacity:Math.min(.6,.15+area.count*.06)});cleanup.push(()=>circle.setMap(null));}}
  else{const groups=new Map<string,MapIssue[]>();for(const issue of mapped){const key=publicPoint(issue.public_point)!.join(',');groups.set(key,[...(groups.get(key)||[]),issue]);}
   for(const items of groups.values()){
    const [lat,lng]=publicPoint(items[0].public_point)!;const button=document.createElement('button');button.type='button';button.className='city-issue-pin common-city-pin';button.setAttribute('aria-label',items.map(i=>i.title).join('; '));
    const image=document.createElement('img');image.src=import.meta.env.BASE_URL+'brand/common-map-pin.png';image.alt='';button.append(image);if(items.length>1){const count=document.createElement('span');count.className='pin-count';count.textContent=String(items.length);button.append(count);}button.onclick=()=>setSelected(items);
    const overlay=new g.OverlayView();overlay.onAdd=()=>overlay.getPanes()?.overlayMouseTarget.append(button);overlay.draw=()=>{const p=overlay.getProjection().fromLatLngToDivPixel(new g.LatLng(lat,lng));if(p){button.style.left=p.x+'px';button.style.top=p.y+'px';}};overlay.onRemove=()=>button.remove();overlay.setMap(instance);cleanup.push(()=>overlay.setMap(null));
   }
  }return()=>cleanup.forEach(f=>f());
 },[ready,mapped,density]);
 const zoomTo=(lat:number,lng:number)=>{map.current?.panTo({lat,lng});map.current?.setZoom(16);root.current?.scrollIntoView({block:'center',behavior:'smooth'});};
 return <section className="city-explorer common-city-explorer" aria-labelledby="city-map-title">
  <div className="city-map-intro"><div><div className="eyebrow">YOUR REPORTING AREA</div><h2 id="city-map-title">{name} issue map</h2><p>One place to see reported conditions, follow responses, and find what still needs attention.</p></div><span className="google-map-label">Google Maps</span></div>
  <div className="map-toolbar"><button className="secondary" onClick={()=>{if(cityBounds.current)map.current?.fitBounds(cityBounds.current,32);}}>Fit city</button><button className="secondary" disabled={!mapped.length||!ready} onClick={()=>{const g=api.current;if(!g)return;const extent=new g.LatLngBounds();mapped.forEach(i=>{const p=publicPoint(i.public_point)!;extent.extend({lat:p[0],lng:p[1]});});map.current?.fitBounds(extent,45);}}>Fit reports</button><button className="secondary" aria-pressed={density} onClick={()=>setDensity(!density)}>Report concentrations</button></div>
  <div className="city-map-stage"><div ref={root} className="city-issue-map" role="region" aria-label={`${name} published issue map`} hidden={failed}/>
   {!ready&&!failed&&<p role="status">Loading Google Maps…</p>}
   {failed&&<div className="notice" role="status">Google Maps could not load. Your city summary and public reports remain available below.</div>}
   {selected&&<div className="city-selected-case"><button className="case-close" aria-label="Close map report" onClick={()=>setSelected(null)}>×</button>{selected.map(i=><div key={i.id}><small>{i.category} · {i.maintenance_status.replaceAll('_',' ')}</small><h3>{i.title}</h3><p>{i.public_location}</p><strong>{Math.max(0,Math.floor((Date.now()-Date.parse(i.first_reported_at))/86400000))} days since first report</strong><button className="button small" onClick={()=>navigate('/issues/'+i.public_id)}>View report →</button></div>)}</div>}
  </div>
  <p className="muted" aria-live="polite">{mapped.length} mapped cases · {issues.length-mapped.length} without a reviewed public location · {visible.length} in this view</p>
  {!mapped.length&&<p className="notice">No published locations match these filters. The city map is ready for reviewed reports.</p>}
  <div className="city-map-insights" aria-label="Reports in the map view"><div><h3>Most common issues</h3>{counts.length?<ol className="category-counts">{counts.map(([category,count])=><li key={category}><span>{category}</span><strong>{count}</strong><meter min="0" max={visible.length} value={count} aria-label={`${category}: ${count} cases`}/></li>)}</ol>:<p>No mapped cases in this view.</p>}</div><div><h3>Areas with open cases</h3>{areas.filter(a=>a.open>0).slice(0,5).map(area=><button key={`${area.lat}:${area.lng}`} className="map-area" onClick={()=>zoomTo(area.lat,area.lng)}><strong>{area.open} open · {area.count} total</strong><span>{categoryCounts(area.issues)[0]?.[0]} · Zoom to area ↗</span></button>)}{!areas.some(a=>a.open)&&<p>No mapped open cases in this view.</p>}</div></div>
  <small>Published cases only. Reporting activity is not a neighborhood quality grade or complete survey. Locations may be generalized for privacy. Use the public report list as an alternative.</small>
 </section>;
}
