import {test,expect} from '@playwright/test';
test('photo examples teach category selection and start a public park report',async({page},info)=>{
 await page.goto('/');
 const cards=page.locator('.report-photo-example');await expect(cards).toHaveCount(3);
 const boston=cards.filter({hasText:'Boston, MA'});
 await boston.getByRole('button',{name:'Insect nest',exact:true}).click();
 await expect(boston.getByRole('button',{name:'Insect nest',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(boston.locator('.report-example-selection')).toHaveText('Selected: Insect nest');
 await page.locator('.report-photo-grid').screenshot({path:info.outputPath('photo-examples.png')});
 await boston.getByRole('button',{name:'Report something like this'}).click();
 await expect(page).toHaveURL(/category=Stinging/);
 await page.getByRole('button',{name:'Continue as guest'}).click();
 await page.getByRole('button',{name:'No immediate emergency'}).click();
 await page.getByText('Manual location & place details',{exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Public place type',exact:true})).toHaveValue('Park / trail / playground');
 await expect(page.getByRole('combobox',{name:'Public place type',exact:true}).getByRole('option',{name:'Airport / public terminal'})).toHaveCount(1);
 await expect(page.getByRole('combobox',{name:'Public place type',exact:true}).getByRole('option',{name:'Train / subway / bus station'})).toHaveCount(1);
 await expect(page.getByText(/agency delivery is not yet enabled/)).toBeVisible();
});
