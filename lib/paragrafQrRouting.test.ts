import {beforeEach,describe,expect,it,vi} from 'vitest';

const {findUnique}=vi.hoisted(()=>({findUnique:vi.fn()}));
vi.mock('@/lib/db',()=>({db:{paragrafBookSolution:{findUnique}}}));
vi.mock('next/navigation',()=>({notFound:()=>{throw new Error('NOT_FOUND')}}));

import ParagrafSolutionPage from '@/app/paragraf/cozum/[id]/page';

describe('KEKS Paragraf - her karekod yalnız kendi çözümünü açar',()=>{
  beforeEach(()=>{vi.clearAllMocks();});
  it('geçersiz veya toplu sorgu kimliğini reddeder',async()=>{
    await expect(ParagrafSolutionPage({params:Promise.resolve({id:'1;DROP'})})).rejects.toThrow('NOT_FOUND');
    expect(findUnique).not.toHaveBeenCalled();
  });
  it('yayımlanmamış/eksik çözüm kodu için 404 verir',async()=>{
    findUnique.mockResolvedValue(null);
    await expect(ParagrafSolutionPage({params:Promise.resolve({id:'09999'})})).rejects.toThrow('NOT_FOUND');
  });
  it('tek bir id ile yalnız aynı sorunun yanıtını ister ve gösterir',async()=>{
    findUnique.mockResolvedValue({id:'00001',topic:'Ana Düşünce',testNo:1,questionNo:1,
      correctAnswer:'A',explanation:'Bu soru için özel gerekçeli çözüm.'});
    const element=await ParagrafSolutionPage({params:Promise.resolve({id:'00001'})});
    const json=JSON.stringify(element);
    expect(findUnique).toHaveBeenCalledExactlyOnceWith({
      where:{id:'00001'},select:{id:true,topic:true,testNo:true,questionNo:true,correctAnswer:true,explanation:true}
    });
    expect(json).toContain('Bu soru için özel gerekçeli çözüm.');
    expect(json).toContain('00001');
    expect(json).not.toContain('00002');
  });
});
