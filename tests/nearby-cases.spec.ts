import {test,expect} from '@playwright/test';
test('step two suggests matching nearby open cases and preserves the draft',async({page,context})=>{
 await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:42.365,longitude:-71.105});
 const issue=(id:string,lat:number,category='Litter / public bins',status='open')=>({id,public_id:id,title:id,category,public_point:{type:'Point',coordinates:[-71.105,lat]},maintenance_status:status,public_location:'Public sidewalk',first_reported_at:'2026-11-01'});
 await page.route('**/rest/v1/issues?*',r=>r.fulfill({json:[issue('Nearby bin',42.3654),issue('Far away',42.4),issue('Fixed bin',42.365,'Litter / public bins','verified_fixed'),issue('Different category',42.365,'Public graffiti')]}));
 await page.goto('/#/report');await page.getByRole('button',{name:'Continue as guest'}).click();await page.getByRole('button',{name:'No immediate emergency'}).click();
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Continue to photo'}).click();
 const matches=page.getByRole('complementary',{name:'Nearby existing cases'});await expect(matches).toContainText('Nearby bin');await expect(matches).not.toContainText('Far away');await expect(matches).not.toContainText('Fixed bin');await expect(matches).not.toContainText('Different category');
 await matches.getByRole('link',{name:'Check existing case'}).click();await expect(page).toHaveURL(/issues\/Nearby/);
});
test('search sits before login and city coverage is at the bottom',async({page})=>{
 await page.goto('/');const nav=page.getByRole('navigation',{name:'Main navigation'});
 expect(await nav.evaluate(n=>Array.from(n.children).map(c=>c.tagName==='FORM'?'search':c.textContent?.trim()))).toEqual(['How it works','Public reports','My Reports','search','Log in']);
 const search=page.getByRole('combobox',{name:'Search your city'});await search.fill('Boston');await page.getByRole('listbox').getByRole('option').first().click();
 await expect(page.getByText('Public spaces. A shared history.',{exact:false})).toHaveCount(0);
 await expect(page.getByRole('option',{name:'Other',exact:true})).toHaveAttribute('value','Other public infrastructure');
 expect(await page.locator('.city-coverage-details').evaluate(n=>!!(document.querySelector('.city-explorer')!.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
});
