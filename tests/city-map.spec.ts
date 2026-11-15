import {test,expect} from '@playwright/test';
test('city map shows published locations, synchronized filters, and concentrations',async({page},info)=>{
 const point=(lng:number,lat:number)=>({type:'Point',coordinates:[lng,lat]});
 const rows=[
 {id:'1',public_id:'case-1',title:'Broken sidewalk',category:'Sidewalk obstruction',public_point:point(-71.11,42.37),maintenance_status:'open'},
 {id:'2',public_id:'case-2',title:'Public bin overflowing',category:'Litter / public bins',public_point:point(-71.11001,42.37001),maintenance_status:'open'},
 {id:'3',public_id:'case-3',title:'Road repaired',category:'Pothole / road damage',public_point:point(-71.12,42.38),maintenance_status:'verified_fixed'},
 {id:'4',public_id:'case-4',title:'Location withheld',category:'Sidewalk obstruction',public_point:null,maintenance_status:'open'}
 ].map(i=>({...i,public_location:'Reviewed public location',first_reported_at:'2026-11-01T00:00:00Z',verified_fixed_at:null,agency_status:'none'}));
 await page.route('**/rest/v1/municipalities?*',route=>route.fulfill({json:{id:'city',name:'Cambridge',slug:'cambridge-test',county:'Middlesex',source_version:'2026-11-01',imported_at:'2026-11-01',coverage:{},boundary:{type:'Polygon',coordinates:[[[-71.15,42.35],[-71.08,42.35],[-71.08,42.4],[-71.15,42.4],[-71.15,42.35]]]}}}));
 await page.route('**/rest/v1/issues?*',route=>route.fulfill({json:rows}));
 await page.goto('/#/places/cambridge-test');
 await expect(page.getByRole('heading',{name:'Cambridge issue map'})).toBeVisible();
 await expect(page.locator('.city-issue-pin')).toHaveCount(3);
 await expect(page.getByText('3 mapped cases · 1 without a reviewed public location · 3 in this view')).toBeVisible();
 await expect(page.locator('.map-area').first()).toContainText('2 open');
 await page.locator('.map-area').first().click();
 await expect(page.getByText('3 mapped cases · 1 without a reviewed public location · 2 in this view')).toBeVisible();
 await page.getByRole('button',{name:'Fit city',exact:true}).click();
 await page.getByRole('button',{name:'Fit reports',exact:true}).click();
 await page.getByRole('button',{name:'Report concentrations',exact:true}).click();
 await expect(page.getByRole('button',{name:'Report concentrations'})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.city-issue-pin')).toHaveCount(0);
 await page.getByRole('button',{name:'Report concentrations',exact:true}).click();
 await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('Sidewalk obstruction');
 await expect(page.locator('.city-issue-pin')).toHaveCount(1);
 await expect(page.locator('.category-counts')).toContainText('Sidewalk obstruction');
 await expect(page.locator('.category-counts')).not.toContainText('Litter');
 await page.locator('.city-issue-pin').click();
 await expect(page.locator('.leaflet-popup-content')).toContainText('Broken sidewalk');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('city-map.png'),fullPage:true});
 await page.locator('.leaflet-popup-content').getByRole('button',{name:'Broken sidewalk'}).click();
 await expect(page).toHaveURL(/issues\/case-1/);
});

