import {useEffect,useRef,useState} from 'react';
import {loadGoogleMaps,type GoogleMap,type GooglePin} from './google-maps';
export default function GoogleReportMap({point,onChange}:{point:[number,number];onChange:(point:[number,number])=>void}) {
 const root=useRef<HTMLDivElement>(null),map=useRef<GoogleMap|null>(null),pin=useRef<GooglePin|null>(null);
 const change=useRef(onChange),latest=useRef(point);change.current=onChange;latest.current=point;
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{
  let cancelled=false;const listeners:{remove:()=>void}[]=[];
  const authFailure=()=>{if(!cancelled)setStatus('error');};window.gm_authFailure=authFailure;
  void (async()=>{try{
   const api=await loadGoogleMaps();await Promise.all([api.importLibrary('maps'),api.importLibrary('marker')]);
   if(cancelled||!root.current)return;
   const center={lat:latest.current[0],lng:latest.current[1]};
   const instance=new api.Map(root.current,{center,zoom:17,mapId:import.meta.env.VITE_GOOGLE_MAPS_MAP_ID||'DEMO_MAP_ID',mapTypeId:'roadmap',mapTypeControl:true,streetViewControl:false,fullscreenControl:true,gestureHandling:'cooperative',clickableIcons:false});map.current=instance;
   const marker=new api.marker.AdvancedMarkerElement({map:instance,position:center,gmpDraggable:true,title:'Issue location. Drag to adjust.'});pin.current=marker;
   listeners.push(marker.addListener('dragend',()=>{const position=marker.position;if(!position)return;change.current([typeof position.lat==='function'?position.lat():position.lat,typeof position.lng==='function'?position.lng():position.lng]);}));
   listeners.push(instance.addListener('click',event=>{if(event.latLng)change.current([event.latLng.lat(),event.latLng.lng()]);}));
   setStatus('ready');
  }catch{if(!cancelled)setStatus('error');}})();
  return ()=>{cancelled=true;listeners.forEach(listener=>listener.remove());if(pin.current)pin.current.map=null;pin.current=null;map.current=null;if(window.gm_authFailure===authFailure)delete window.gm_authFailure;};
 },[]);
 useEffect(()=>{const position={lat:point[0],lng:point[1]};if(pin.current)pin.current.position=position;map.current?.panTo(position);},[point[0],point[1]]);
 return <div className="report-map-card"><div className="report-map-heading"><strong>Pinpoint the issue</strong><span>Google Maps</span></div>
  <div ref={root} className="google-report-map" role="region" aria-label="Google Maps issue location" hidden={status==='error'} />
  {status==='loading'&&<p role="status">Loading Google Maps…</p>}
  {status==='error'&&<p className="notice" role="status">The map is unavailable right now. You can still use your device location or enter coordinates below.</p>}
  <p className="report-map-help">Drag the pin or tap the map to mark the issue. Your location is a starting point; confirm where the problem actually is.</p>
 </div>;
}
