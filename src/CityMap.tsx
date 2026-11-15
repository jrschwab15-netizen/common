import {useEffect,useRef,useState} from 'react';
import L from 'leaflet';

import {useNavigate} from 'react-router-dom';
import {categoryCounts,publicPoint,reportAreas,type MapIssue} from './map-data';

export default function CityMap({name,boundary,issues}:{name:string;boundary:unknown;issues:MapIssue[]}) {
 const root=useRef<HTMLDivElement>(null), map=useRef<L.Map|null>(null), layer=useRef<L.LayerGroup|null>(null);
 const cityBounds=useRef<L.LatLngBounds|null>(null);
 const [bounds,setBounds]=useState<L.LatLngBounds|null>(null), [density,setDensity]=useState(false), [tilesFailed,setTilesFailed]=useState(false);
 const navigate=useNavigate();
 useEffect(()=>{
  if(!root.current)return;
  const instance=L.map(root.current,{scrollWheelZoom:false,zoomAnimation:false}).setView([42.2,-71.8],8);
  map.current=instance;
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).on('tileerror',()=>setTilesFailed(true)).addTo(instance);
  layer.current=L.layerGroup().addTo(instance);
  const update=()=>setBounds(instance.getBounds());instance.on('moveend',update);
  const observer=new ResizeObserver(()=>instance.invalidateSize());observer.observe(root.current);
  return ()=>{observer.disconnect();instance.remove();map.current=null;layer.current=null;};
 },[]);
 useEffect(()=>{
  const instance=map.current;if(!instance)return;
  let outline:L.GeoJSON|undefined;cityBounds.current=null;
  if(boundary && typeof boundary==='object') {
   try {outline=L.geoJSON(boundary as Parameters<typeof L.geoJSON>[0],{style:{color:'#205bd6',weight:2,fillOpacity:.035},interactive:false}).addTo(instance);
    const extent=outline.getBounds();if(extent.isValid()){cityBounds.current=extent;instance.fitBounds(extent,{padding:[20,20]});}
   }catch{ /* A missing boundary does not hide published issue locations. */ }
  }
  setBounds(instance.getBounds());
  return ()=>{outline?.remove();};
 },[boundary]);
 const mapped=issues.filter(issue=>publicPoint(issue.public_point));
 const visible=mapped.filter(issue=>!bounds||bounds.contains(publicPoint(issue.public_point)!));
 const counts=categoryCounts(visible), areas=reportAreas(visible);
 useEffect(()=>{
  const instance=map.current, group=layer.current;if(!instance||!group)return;group.clearLayers();
  const popup=(items:MapIssue[])=>{
   const container=document.createElement('div');container.className='city-map-popup';
   for(const issue of items){const button=document.createElement('button');button.type='button';button.textContent=issue.title;button.addEventListener('click',()=>navigate(`/issues/${issue.public_id}`));
    const detail=document.createElement('p');detail.textContent=`${issue.category} · ${issue.maintenance_status.replaceAll('_',' ')} · ${issue.public_location}`;container.append(button,detail);}
   return container;
  };
  if(density){for(const area of reportAreas(mapped)){
   L.circle([area.lat,area.lng],{radius:180,color:area.open?'#c35426':'#287961',fillOpacity:Math.min(.65,.16+area.count*.06),weight:2})
    .bindTooltip(`${area.count} published cases · ${area.open} open`).bindPopup(popup(area.issues),{maxWidth:Math.max(140,Math.min(280,(root.current?.clientWidth||320)-70))}).addTo(group);
  }}else{
   // One keyboard-focusable marker per location, with every co-located case in its popup.
   const locations=new Map<string,MapIssue[]>();for(const issue of mapped){const key=publicPoint(issue.public_point)!.join(',');locations.set(key,[...(locations.get(key)||[]),issue]);}
   for(const items of locations.values()){
    const open=items.some(i=>i.maintenance_status!=='verified_fixed');
    const icon=L.divIcon({className:`city-issue-pin common-city-pin ${open?'is-open':'is-fixed'}`,html:`<img src="${import.meta.env.BASE_URL}brand/common-map-pin.png" alt="" /><span class="pin-status" aria-hidden="true"></span>${items.length>1?`<span class="pin-count">${items.length}</span>`:''}`,iconSize:[40,54],iconAnchor:[20,54],popupAnchor:[0,-48]});
    const marker=L.marker(publicPoint(items[0].public_point)!,{icon,title:items.map(i=>i.title).join('; '),alt:`${items.length} published case${items.length===1?'':'s'}: ${items[0].title}`}).bindPopup(popup(items),{maxWidth:Math.max(140,Math.min(280,(root.current?.clientWidth||320)-70))}).addTo(group);
    marker.getElement()?.setAttribute("aria-label",items.map(i=>i.title).join("; "));
   }
  }
 },[issues,density,navigate]);
 const fitReports=()=>{if(mapped.length)map.current?.fitBounds(L.latLngBounds(mapped.map(i=>publicPoint(i.public_point)!)),{padding:[35,35],maxZoom:16});};
 return <section className="city-explorer" aria-labelledby="city-map-title">
  <div className="section-head"><div><div className="eyebrow">EXPLORE REPORTED CONDITIONS</div><h2 id="city-map-title">{name} issue map</h2></div></div>
  <p>Zoom in, tap a marker, or explore areas with more published cases. Category and status filters apply to the map and list.</p>
  <div className="map-toolbar"><button className="secondary" onClick={()=>{if(cityBounds.current)map.current?.fitBounds(cityBounds.current,{padding:[20,20]});}}>Fit city</button><button className="secondary" disabled={!mapped.length} onClick={fitReports}>Fit reports</button><button className="secondary" aria-pressed={density} onClick={()=>setDensity(!density)}>Report concentrations</button></div>
  <div className="city-map-layout"><div><div ref={root} className="city-issue-map" role="region" aria-label={`${name} published issue map`} />
  <p className="map-legend"><span>🟠 Open / reopened</span><span>🟢 Verified fixed</span><span>Blue outline: city boundary</span></p>
  <p className="muted" aria-live="polite">{mapped.length} mapped cases · {issues.length-mapped.length} without a reviewed public location · {visible.length} in this view</p>
  {tilesFailed&&<p role="status">Some map tiles could not load. Markers and the report list remain available.</p>}
  {!mapped.length&&<p className="notice">No published locations match these filters. The city map is ready for reviewed reports.</p>}</div>
  <aside className="map-insights" aria-label="Reports in the map view"><h3>In this map view</h3><p className="muted">Summaries update as you pan and zoom.</p>
   <h4>Most common issues</h4>{counts.length?<ol className="category-counts">{counts.map(([category,count])=><li key={category}><span>{category}</span><strong>{count}</strong><meter min="0" max={visible.length} value={count} aria-label={`${category}: ${count} cases`} /></li>)}</ol>:<p>No mapped cases in this view.</p>}
   <h4>Areas with open cases</h4><p className="muted">Fixed cells about 370 m wide in Massachusetts, ranked by open case count.</p>
   {areas.filter(a=>a.open>0).slice(0,5).map(area=><button key={`${area.lat}:${area.lng}`} className="map-area" onClick={()=>{const instance=map.current;if(!instance)return;root.current?.scrollIntoView({block:'center'});instance.invalidateSize();instance.setView([area.lat,area.lng],16,{animate:false});setBounds(instance.getBounds());}}><strong>{area.open} open · {area.count} total</strong><span>{categoryCounts(area.issues)[0]?.[0]} · Zoom to area ↗</span></button>)}
   {!areas.some(a=>a.open>0)&&<p>No mapped open cases in this view.</p>}
  </aside></div>
  <small>Published cases only; repeat submissions may join one case. Concentrations reflect reporting activity, not neighborhood quality or a complete survey. Locations may be generalized for privacy. Use the report list below as an alternative to the map.</small>
 </section>;
}


