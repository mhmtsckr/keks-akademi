import {KEKS_CORE_SENTENCE,KEKS_CORE_STEPS} from '@/lib/keksCore';

export function KeksCoreLoop({compact=false}:{compact?:boolean}){
  return <div className={'keksCoreLoop '+(compact?'compact':'')}>
    <div className="keksCoreLoopHeader">
      <div>
        <div className="moduleEyebrow">KEKS ÇEKİRDEK DÖNGÜSÜ</div>
        <h2>Ölç → Planla → Uygulat → Kaydet → Tekrar Ettir → Yeniden Ölç → Koça Aksiyon Öner</h2>
        {!compact&&<p>{KEKS_CORE_SENTENCE}</p>}
      </div>
    </div>
    <div className="keksCoreLoopSteps">
      {KEKS_CORE_STEPS.map((step,index)=><div className="keksCoreLoopStep" key={step.key}>
        <b>{String(index+1).padStart(2,'0')}</b>
        <span>{step.label}</span>
        {!compact&&<small>{step.short}</small>}
      </div>)}
    </div>
  </div>;
}
