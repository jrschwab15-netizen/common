// Narrow interfaces for the Google Maps APIs used by the report pin.
type LatLng = { lat: () => number; lng: () => number };
type Listener = { remove: () => void };
export type GoogleMap = {
 panTo: (point: {lat:number;lng:number}) => void;
 addListener: (event:string, callback:(event:{latLng?:LatLng})=>void) => Listener;
};
export type GooglePin = {
 position: {lat:number;lng:number} | LatLng | null;
 map: GoogleMap | null;
 addListener: (event:string, callback:()=>void) => Listener;
};
type MapsAPI = {
 importLibrary: (name:string)=>Promise<unknown>;
 Map: new (element:HTMLElement,options:Record<string,unknown>)=>GoogleMap;
 marker: {AdvancedMarkerElement:new(options:Record<string,unknown>)=>GooglePin};
};
declare global { interface Window { google?: {maps:MapsAPI}; commonGoogleMapsReady?:()=>void; gm_authFailure?:()=>void; } }
let loading:Promise<MapsAPI>|undefined;
export function loadGoogleMaps():Promise<MapsAPI> {
 if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps);
 if(loading)return loading;
 const key=import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
 if(!key)return Promise.reject(new Error('Google Maps is not configured.'));
 loading=new Promise<MapsAPI>((resolve,reject)=>{
  const script=document.createElement('script');
  const timeout=window.setTimeout(()=>fail(),20000);
  const cleanup=()=>{clearTimeout(timeout);delete window.commonGoogleMapsReady;};
  const fail=()=>{cleanup();script.remove();loading=undefined;reject(new Error('Google Maps could not load.'));};
  window.commonGoogleMapsReady=()=>{cleanup();if(window.google?.maps)resolve(window.google.maps);else fail();};
  script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&v=quarterly&auth_referrer_policy=origin&callback=commonGoogleMapsReady`;
  script.async=true;script.referrerPolicy='strict-origin-when-cross-origin';script.onerror=fail;
  document.head.append(script);
 });
 return loading;
}
// Additional city-map surfaces; the shared loader also serves Quick Report.
export type CityBounds = { contains:(point:{lat:number;lng:number})=>boolean; extend:(point:{lat:number;lng:number})=>CityBounds; isEmpty:()=>boolean };
export type CityGoogleMap = GoogleMap & { fitBounds:(bounds:CityBounds,padding?:number)=>void; getBounds:()=>CityBounds|undefined; setZoom:(zoom:number)=>void; data:{addGeoJson:(value:unknown)=>unknown;setStyle:(value:Record<string,unknown>)=>void} };
export type CityOverlay = {onAdd:()=>void;draw:()=>void;onRemove:()=>void;setMap:(map:CityGoogleMap|null)=>void;getPanes:()=>{overlayMouseTarget:HTMLElement}|null;getProjection:()=>{fromLatLngToDivPixel:(point:unknown)=>{x:number;y:number}|null}};
export type CityMapsAPI = {
 Map:new(element:HTMLElement,options:Record<string,unknown>)=>CityGoogleMap;
 LatLngBounds:new()=>CityBounds;
 LatLng:new(lat:number,lng:number)=>unknown;
 OverlayView:new()=>CityOverlay;
 Circle:new(options:Record<string,unknown>)=>{setMap:(map:CityGoogleMap|null)=>void};
 Geocoder:new()=>{geocode:(request:{address:string})=>Promise<{results:{geometry:{viewport:CityBounds;location:{lat:()=>number;lng:()=>number}}}[]}>};
};
export const commonMapStyles = [
 {featureType:'poi',elementType:'labels',stylers:[{visibility:'off'}]},
 {featureType:'transit',elementType:'labels',stylers:[{visibility:'off'}]},
 {featureType:'water',elementType:'geometry',stylers:[{color:'#a9dce7'}]},
 {featureType:'landscape',elementType:'geometry',stylers:[{color:'#f0f2eb'}]},
 {featureType:'poi.park',elementType:'geometry',stylers:[{color:'#dce8d3'}]},
 {featureType:'road',elementType:'geometry',stylers:[{color:'#ffffff'}]},
];
