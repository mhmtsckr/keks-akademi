import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('central product pricing wiring',()=>{
  it('uses the runtime monthly product in every price-sensitive surface',()=>{
    const required:Record<string,string[]>={
      'app/api/paytr/start/route.ts':['getKeksMonthlyProduct','product.priceKurus'],
      'app/api/admin/product-config/route.ts':['getKeksMonthlyProduct','getProductPricing'],
      'app/api/student/test/access/route.ts':['getKeksMonthlyProduct'],
      'app/ogrenci/page.tsx':['getKeksMonthlyProduct','currentProduct.priceLabel'],
      'app/page.tsx':['getKeksMonthlyProduct','product.priceLabel','product.listPriceLabel'],
      'app/components/StudentActions.tsx':['product?.priceLabel','product?.listPriceLabel']
    };

    const missing:string[]=[];
    for(const [file,needles] of Object.entries(required)){
      const source=read(file);
      for(const needle of needles){
        if(!source.includes(needle))missing.push(file+': '+needle);
      }
    }
    expect(missing,'Payment, admin, test access and campaigns must all consume the central runtime product.').toEqual([]);
  });

  it('keeps default product identity and price literals in one catalog',()=>{
    const catalog=read('lib/productCatalog.ts');
    const system=read('lib/systemConfig.ts');
    const product=read('lib/monthlyProduct.ts');

    expect(catalog).toContain("key:'KEKS_MONTHLY_TEST'");
    expect(catalog).toContain('listPriceKurus:80000');
    expect(catalog).toContain('priceKurus:40000');
    expect(system).toContain('KEKS_MONTHLY_PRODUCT.defaultPricing');
    expect(product).toContain('KEKS_MONTHLY_PRODUCT.baseName');
  });
});
