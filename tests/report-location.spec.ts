import {test,expect} from '@playwright/test';
test('location permission starts after safety confirmation and uses accurate device coordinates',async({page,context})=>{
 await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:42.365,longitude:-71.105,accuracy:12});
 await page.goto('/#/report');await page.getByRole('button',{name:'Continue as guest'}).click();
 await expect(page.getByRole('textbox',{name:'Latitude',exact:true})).toHaveValue('');
 await page.getByRole('button',{name:'No immediate emergency'}).click();
 await expect(page.getByRole('textbox',{name:'Latitude',exact:true})).toHaveValue('42.365');
 await expect(page.getByRole('textbox',{name:'Longitude',exact:true})).toHaveValue('-71.105');
 await expect(page.getByText(/estimated accuracy within 12 meters/)).toBeVisible();
 await page.getByRole('textbox',{name:'Latitude',exact:true}).fill('42.366');
 await expect(page.getByText(/estimated accuracy within/)).toHaveCount(0);
});
test('denied device location leaves manual location usable',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:(_success:unknown,error:(e:{code:number})=>void)=>error({code:1})}});});
 await page.goto('/#/report');await page.getByRole('button',{name:'Continue as guest'}).click();await page.getByRole('button',{name:'No immediate emergency'}).click();
 await expect(page.getByRole('alert')).toContainText('Location access is blocked');
 await page.getByRole('textbox',{name:'Latitude',exact:true}).fill('42.36');
 await page.getByRole('textbox',{name:'Longitude',exact:true}).fill('-71.06');
 await expect(page.getByRole('button',{name:/Use my location/})).toBeEnabled();
});
test('Google map selections update the report coordinates',async({page})=>{
 await page.addInitScript(()=>{
  const listeners=new Map<string,(event:unknown)=>void>();
  class MapMock {constructor(element:HTMLElement){const choose=document.createElement('button');choose.textContent='Test map location';choose.onclick=()=>listeners.get('click')?.({latLng:{lat:()=>42.38,lng:()=>-71.12}});element.append(choose);}panTo(){}addListener(name:string,callback:(event:unknown)=>void){listeners.set(name,callback);return {remove(){listeners.delete(name);}};}}
  class PinMock {position:unknown;map:unknown;constructor(options:{position:unknown;map:unknown}){this.position=options.position;this.map=options.map;}addListener(){return {remove(){}};}}
  Object.assign(window,{google:{maps:{Map:MapMock,marker:{AdvancedMarkerElement:PinMock},importLibrary:async()=>({})}}});
 });
 await page.goto('/#/report');await page.getByRole('button',{name:'Continue as guest'}).click();
 await page.getByRole('button',{name:'Test map location'}).click();
 await expect(page.getByRole('textbox',{name:'Latitude',exact:true})).toHaveValue('42.380000');
 await expect(page.getByRole('textbox',{name:'Longitude',exact:true})).toHaveValue('-71.120000');
 await expect(page.getByRole('region',{name:'Google Maps issue location'})).toBeVisible();
});
