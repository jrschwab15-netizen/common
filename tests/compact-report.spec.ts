import {test,expect} from '@playwright/test';
for(const [width,height]of [[390,844],[320,700]])test(`main report action fits ${width}x${height}`,async({page,context},info)=>{
 await page.setViewportSize({width,height});await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:42.365,longitude:-71.105,accuracy:12});
 await page.addInitScript(()=>{class MapMock{panTo(){}addListener(){return{remove(){}}}}class PinMock{position:unknown;map:unknown;constructor(options:{position:unknown;map:unknown}){this.position=options.position;this.map=options.map;}addListener(){return{remove(){}}}}Object.assign(window,{google:{maps:{Map:MapMock,marker:{AdvancedMarkerElement:PinMock},importLibrary:async()=>({})}}});});
 await page.goto('/#/report');await page.getByRole('button',{name:'Continue as guest'}).click();await page.getByRole('button',{name:'No immediate emergency'}).click();
 await expect(page.getByText(/estimated accuracy within 12 meters/)).toBeVisible();
 const next=page.getByRole('button',{name:'Continue to photo'});await expect(next).toBeVisible();
 const box=await next.boundingBox();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(height);
 await expect(page.locator('footer')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('compact-location.png')});
 await page.getByRole('textbox',{name:'Public location description'}).fill('Public sidewalk beside the library');await page.getByRole('checkbox').check();await next.click();
 await expect(page.getByRole('heading',{name:'Show what you see.'})).toBeVisible();
 await page.locator('input[type=file]').first().setInputFiles('public/brand/common-mark.png');
 await page.getByRole('button',{name:'Continue →',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Anything to add?'})).toBeVisible();
 const review=await page.getByRole('button',{name:'Review report'}).boundingBox();expect(review!.y+review!.height).toBeLessThanOrEqual(height);
});
