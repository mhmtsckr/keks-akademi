// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {RecoveryActions} from './RecoveryActions';

const issue={
 number:1,topic:'Ana düşünce',status:'BOŞ',marked:'X',correct:'A',
 lesson:'Ana düşüncede tüm paragrafı kapsayan sonuç aranır.',
 misconception:null,rightEvidence:'Metnin tamamı A seçeneğini destekliyor.',
 firstAction:'Süresiz oku.',secondAction:'Çeldiricileri karşılaştır.',
 thirdAction:'Farklı bir soruda bağımsız dene.',
 questionStem:'Parçanın ana düşüncesi hangisidir?',
 passage:'Metin bir düşünceyi açıklar ve örneklendirir.',
 choices:{A:'Ana sav tüm paragrafı kapsar',B:'Dar bir örnek',C:'Yeni varsayım',D:'Konuyla ilgisiz',E:'Kesinlik'},
 readingGuide:{skill:'Ana düşünce',focus:'Metnin tamamını kapsayan görüşü seç.',
  hints:['İlk ve son cümleyi oku.','Ortak kavramı bul.','Yanlış seçeneği ele.'],
  selfCheck:'Bütününü kapsıyor mu?'}
};
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
describe('Paragraf result guided learning',()=>{
 it('does not reveal answer before student voluntarily checks a second attempt',()=>{
  render(<RecoveryActions testNo={1} encoded={'X'.repeat(30)} missed={[issue]} priorities={[{
   topic:'Ana düşünce',wrong:0,blank:1,priority:1,questionNos:[1]
  }]}/>);
  expect(screen.queryByText('Doğru cevap:')).toBeNull();
  fireEvent.click(screen.getByText(/1\. soru · Ana düşünce/));
  expect(screen.queryByText('İkinci denemede doğru.')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:/^A\)/}));
  fireEvent.click(screen.getByRole('button',{name:'İkinci Yanıtımı Kontrol Et'}));
  expect(screen.getByText('İkinci denemede doğru.')).toBeTruthy();
  expect(screen.getByText(/kalıcı kazanım kanıtı değildir/i)).toBeTruthy();
 });
 it('saves a blank reason and only checked guided retry without claiming mastery',async()=>{
  const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({
   ok:true,reviewLinked:1,alreadySaved:false
  })});
  vi.stubGlobal('fetch',fetch);
  render(<RecoveryActions testNo={1} encoded={'X'.repeat(30)} missed={[issue]} priorities={[]}/>);
  fireEvent.click(screen.getByText(/1\. soru · Ana düşünce/));
  fireEvent.change(screen.getByLabelText('Soruyu neden boş bıraktın?'),{target:{value:'SURE'}});
  fireEvent.click(screen.getByRole('button',{name:/^A\)/}));
  fireEvent.click(screen.getByRole('button',{name:'İkinci Yanıtımı Kontrol Et'}));
  fireEvent.click(screen.getByRole('button',{name:'Yanlış ve Boş Sorularımı Tekrar Listeme Ekle'}));
  await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
  const [,options]=fetch.mock.calls[0] as [string,RequestInit];
  const json=JSON.parse(String(options.body));
  expect(json).toMatchObject({testNo:1,reasons:{'1':'SURE'},rechecks:{'1':'A'}});
  expect(screen.getByText(/1 yanlış\/boş soru kişisel tekrar listene eklendi/)).toBeTruthy();
 });
});
