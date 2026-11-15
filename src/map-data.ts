import { validPoint } from './lib';
export type MapIssue = {
 id: string; public_id: string; title: string; category: string; public_location: string;
 public_point?: unknown; maintenance_status: string; first_reported_at: string;
};
export function publicPoint(value: unknown): [number, number] | null {
 if (!value || typeof value !== 'object') return null;
 const geometry = value as {type?: string; coordinates?: unknown};
 if (geometry.type !== 'Point' || !Array.isArray(geometry.coordinates)) return null;
 const [lng, lat] = geometry.coordinates;
 return typeof lat === 'number' && typeof lng === 'number' && validPoint(lat,lng) ? [lat,lng] : null;
}
export function categoryCounts(issues: MapIssue[]) {
 const counts = new Map<string,number>();
 for(const issue of issues) counts.set(issue.category,(counts.get(issue.category)||0)+1);
 return [...counts].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
}
// Fixed 500 m Web Mercator cells: about 370 m on the ground in Massachusetts.
export function reportAreas(issues: MapIssue[]) {
 const groups = new Map<string,{lat:number;lng:number;count:number;open:number;issues:MapIssue[]}>();
 for(const issue of issues) {
  const point = publicPoint(issue.public_point); if(!point) continue;
  const [lat,lng]=point;
  const x=6378137*lng*Math.PI/180, y=6378137*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
  const col=Math.floor(x/500), row=Math.floor(y/500), key=`${col}:${row}`;
  let group=groups.get(key);
  if(!group){group={lat:(2*Math.atan(Math.exp((row+.5)*500/6378137))-Math.PI/2)*180/Math.PI,lng:(col+.5)*500/6378137*180/Math.PI,count:0,open:0,issues:[]};groups.set(key,group);}
  group.count++; group.open+=Number(issue.maintenance_status!=='verified_fixed');group.issues.push(issue);
 }
 return [...groups.values()].sort((a,b)=>b.open-a.open || b.count-a.count || a.lat-b.lat || a.lng-b.lng);
}
