import {describe,it,expect} from 'vitest';
import {publicPoint,categoryCounts,reportAreas,type MapIssue} from './map-data';
const issue=(id:string,lat:number,lng:number,status='open'):MapIssue=>({id,public_id:id,title:id,category:'Pothole / road damage',public_location:'Public road',public_point:{type:'Point',coordinates:[lng,lat]},maintenance_status:status,first_reported_at:'2026-11-01'});
describe('public map summaries',()=>{
 it('validates GeoJSON coordinates without coercion or coordinate reversal',()=>{
 expect(publicPoint({type:'Point',coordinates:[-71.1,42.4]})).toEqual([42.4,-71.1]);
 for(const value of [null,{type:'Point',coordinates:[200,42]},{type:'Point',coordinates:['-71',42]},{type:'Polygon',coordinates:[-71,42]}])expect(publicPoint(value)).toBeNull();
 });
 it('counts categories and ranks geographic cells by open cases',()=>{
 const rows=[issue('a',42.37,-71.11),issue('b',42.37001,-71.11001),issue('c',42.4,-71.15,'verified_fixed')];
 expect(categoryCounts(rows)).toEqual([['Pothole / road damage',3]]);
 const areas=reportAreas(rows);expect(areas).toHaveLength(2);expect(areas[0].open).toBe(2);expect(areas[0].count).toBe(2);expect(areas[1].open).toBe(0);
 });
});
