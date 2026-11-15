import {test,expect} from '@playwright/test';
test('walkthrough shows the complete report and shared navigation searches a city',async({page},info)=>{
 await page.goto('/');await expect(page.locator('.animated-phone')).toBeVisible();
 const section=page.locator('#quick');const impact=page.locator('#impact');expect((await section.boundingBox())!.y).toBeLessThan((await impact.boundingBox())!.y);
 await section.getByRole('button',{name:'Pause walkthrough'}).click();
 for(const name of ['Open Common','Quick Report','1. Location','2. Photo','3. Note','Review','Submitted']){await section.locator('.animation-chapters').getByRole('button',{name,exact:true}).click();await expect(section.locator('.animation-caption')).toHaveText(name);}
 await section.locator('.animation-chapters').getByRole('button',{name:'1. Location',exact:true}).click();
 await section.screenshot({path:info.outputPath('animated-walkthrough.png')});
 await expect(section).toContainText('Your reporting area');
 await page.getByRole('link',{name:'My Reports',exact:true}).click();await expect(page).toHaveURL(/auth/);await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Search your city'})).toBeVisible();
 await page.getByRole('link',{name:'Public reports',exact:true}).click();await expect(page.locator('#issues')).toBeVisible();
 await expect(page.locator('.common-approved-page')).toContainText('openbeta.net');
});
