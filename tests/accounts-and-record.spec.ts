import {test,expect} from '@playwright/test';
test('public record uses real photos and clearly separates example response stages',async({page},info)=>{
 await page.goto('/');
 const cards=page.locator('#cards .issue');await expect(cards).toHaveCount(3);
 await expect(cards.first()).toContainText('18 days');await expect(cards.first()).toContainText('since first report');
 await expect(cards.first()).toContainText('7');await expect(cards.first()).toContainText('reports since first report');
 await expect(cards.first()).toContainText('No response yet');
 await expect(cards.nth(1)).toContainText('Cleanup planned');await expect(cards.nth(2)).toContainText('Crew assigned');
 for(const card of await cards.all()){await expect(card.locator('.scene img')).toHaveAttribute('src',/photos\/.*-bin.webp/);await expect(card).toContainText('response · Example');}
 await page.locator('#issues').screenshot({path:info.outputPath('public-record.png')});
});
test('My Reports sends guests to account choices and town access stays frontend only',async({page},info)=>{
 await page.setViewportSize({width:320,height:700});
 await page.goto('/');await page.getByRole('button',{name:'My Reports',exact:true}).click();
 await expect(page).toHaveURL(/#\/auth$/);
 await expect(page.getByRole('heading',{name:'Community member',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('account-choices.png'),fullPage:true});
 await page.getByRole('button',{name:'Continue as a town or agency'}).click();
 await page.getByRole('textbox',{name:'Town or agency name'}).fill('Example town');await page.getByRole('textbox',{name:'Work email'}).fill('staff@example.org');
 let sent=false;page.on('request',r=>{if(r.method()==='POST')sent=true;});
 await page.getByRole('button',{name:'Continue with town or agency'}).click();await expect(page.getByRole('status')).toContainText('not been sent or saved');expect(sent).toBe(false);
 await page.getByRole('button',{name:'Choose a different account'}).click();await page.getByRole('link',{name:'Continue as a community member'}).click();
 await expect(page).toHaveURL(/#\/auth\/member$/);await expect(page.getByRole('textbox',{name:'Email address',exact:true})).toBeVisible();
 await page.goto('/');await expect(page.getByRole('link',{name:'Log in',exact:true})).toBeVisible();await page.getByRole('link',{name:'Log in',exact:true}).click();await expect(page).toHaveURL(/#\/auth$/);
});
