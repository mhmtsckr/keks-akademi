'use client';

const REASONS=[
 ['BILGI_EKSIKLIGI','Konuyu bilmiyordum'],
 ['SURE','Sürem yetmedi'],
 ['SORU_KOKU','Soru kökünü anlayamadım'],
 ['KARARSIZLIK','Kararsız kaldım'],
 ['YONTEM_BILMEME','Çözüm yöntemini bilemedim'],
 ['UNUTMA','Unuttum'],
 ['BELIRLENEMEDI','Henüz belirleyemedim']
] as const;

export function BlankReasonPicker({questionId,value,onChange}:{
 questionId:string;value:string;onChange:(reason:string)=>void
}){
 return <label className="field" style={{marginTop:10}}>
  <span>Bu soruyu boş bırakma nedenin (isteğe bağlı)</span>
  <select aria-label="Boş bırakma nedeni" value={value} onChange={e=>onChange(e.target.value)}>
   <option value="">Neden belirtmeden boş bırak</option>
   {REASONS.map(([key,label])=><option value={key} key={key}>{label}</option>)}
  </select>
  <small className="muted">Bu seçim kendi gözlemin; bir tanı veya doğru cevap olarak değerlendirilmez.</small>
 </label>;
}
