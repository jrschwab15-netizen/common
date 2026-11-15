import {test,expect} from '@playwright/test';
test('walkthrough shows the complete report and shared navigation searches a city',async({page},info)=>{
 await page.goto('/');await expect(page.locator('.animated-phone')).toBeVisible();
 const section=page.locator('#quick');const impact=page.locator('#impact');expect((await section.boundingBox())!.y).toBeLessThan((await impact.boundingBox())!.y);
 await expect(section.locator('.animation-controls,.animation-chapters')).toHaveCount(0);
 await expect(section.locator('.animation-caption')).toHaveText('1. Location',{timeout:7000});
 const phone=await page.locator('.animated-phone').boundingBox();expect(phone!.width).toBeLessThanOrEqual(300);
 const search=page.getByRole('combobox',{name:'Search your city'});await expect(search).toHaveAttribute('placeholder','Search for city or town');
 await expect(page.locator('.header-city-search button')).toHaveCount(0);
 await expect(page.locator('.header-quick-report')).toHaveText('+Quick Report');
 await section.screenshot({path:info.outputPath('animated-walkthrough.png')});
 await expect(section).toContainText('Your reporting area');
 await page.getByRole('link',{name:'My Reports',exact:true}).click();await expect(page).toHaveURL(/auth/);await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Search your city'})).toBeVisible();
 await page.getByRole('link',{name:'Public reports',exact:true}).click();await expect(page.locator('#issues')).toBeVisible();
 await expect(page.locator('.common-approved-page')).toContainText('openbeta.net');
});
