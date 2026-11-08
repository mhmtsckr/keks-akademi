'use client';

import {useEffect,useMemo,useState} from 'react';

type Account={id:string;name:string;role:'COACH'|'STUDENT';status:string;student?:{studentCode:string}|null};
type Plan={id:string;name:string;audience:'COACH'|'STUDENT';capacity:number|null};
type Subscription={id:string;userId:string;planId:string;startsAt:string|null;endsAt:string|null};
const terms=[
  {value:'MONTHLY',label:'Aylık'},
  {value:'THREE_MONTHS',label:'3 Aylık'},
  {value:'SIX_MONTHS',label:'6 Aylık'},
  {value:'ANNUAL',label:'Yıllık'}
];
export function AdminSubscriptionAssignments(){
  const [users,setUsers]=useState<Account[]>([]);
  const [plans,setPlans]=useState<Plan[]>([]);
  const [subscriptions,setSubscriptions]=useState<Subscription[]>([]);
  const [role,setRole]=useState<'COACH'|'STUDENT'>('STUDENT');
  const [userId,setUserId]=useState('');
  const [planId,setPlanId]=useState('');
  const [term,setTerm]=useState('MONTHLY');
  const [search,setSearch]=useState('');
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  async function load(){
    setLoading(true);
    try{
      const r=await fetch('/api/admin/subscription-assignments',{cache:'no-store'});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Abonelikler yüklenemedi.');
      setUsers(j.users||[]);setPlans(j.plans||[]);setSubscriptions(j.subscriptions||[]);
    }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Bağlantı hatası'))}
    finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[]);
  const availableUsers=useMemo(()=>users.filter(x=>x.role===role&&(x.name+' '+(x.student?.studentCode||'')).toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))),[users,role,search]);
  const availablePlans=plans.filter(x=>x.audience===role);
  const active=subscriptions.find(x=>x.userId===userId);
  async function assign(){
    if(!userId||!planId)return;
    const account=users.find(x=>x.id===userId),plan=plans.find(x=>x.id===planId);
    if(!window.confirm((account?.name||'Hesap')+' için '+(plan?.name||'paket')+' / '+terms.find(x=>x.value===term)?.label+' atanacak. Mevcut aktif abonelik yerine geçecek. Onaylıyor musunuz?'))return;
    setBusy(true);setMessage('');
    try{
      const r=await fetch('/api/admin/subscription-assignments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({userId,planId,term})});
      const j=await r.json();
      if(!r.ok){setMessage('Hata: '+(j.error||'Atama yapılamadı.'));return}
      setMessage('Plan atandı. Bitiş: '+new Date(j.subscription.endsAt).toLocaleDateString('tr-TR'));
      await load();
    }catch{setMessage('Hata: Sunucuya erişilemedi.')}
    finally{setBusy(false)}
  }

  return <section className="card" style={{marginBottom:16}}>
    <div className="moduleHeaderRow">
      <div><div className="moduleEyebrow">ABONELİK VE ERİŞİM</div><h2>Öğrenci ve Partner Koç Planı Ata</h2>
      <p className="muted">Yönetici onaylı hesaplara aylık, 3 aylık, 6 aylık veya yıllık plan tanımlayın. Atanan süre dolunca erişim otomatik sona erer.</p></div>
      <button className="btn" onClick={()=>void load()} disabled={loading}>Yenile</button>
    </div>
    {message&&<div className={'notice '+(message.startsWith('Hata:')?'error':'')}>{message}</div>}
    <div className="form">
      <label>Hesap türü</label>
      <select value={role} onChange={e=>{setRole(e.target.value as 'COACH'|'STUDENT');setUserId('');setPlanId('')}}>
        <option value="STUDENT">Öğrenci</option><option value="COACH">Partner Koç</option>
      </select>
      <label>Hesap ara</label>
      <input value={search} onChange={e=>{setSearch(e.target.value);setUserId('')}} placeholder="Ad veya öğrenci numarası"/>
      <label>Hesap seç</label>
      <select value={userId} onChange={e=>setUserId(e.target.value)}>
        <option value="">Hesap seçiniz</option>
        {availableUsers.map(x=><option key={x.id} value={x.id}>{x.name}{x.student?.studentCode?' ('+x.student.studentCode+')':''} · {x.status}</option>)}
      </select>
      {active&&<div className="notice">Mevcut aktif paket: {plans.find(x=>x.id===active.planId)?.name||active.planId}. Bitiş: {active.endsAt?new Date(active.endsAt).toLocaleDateString('tr-TR'):'Süresiz'}.</div>}
      <label>Plan</label>
      <select value={planId} onChange={e=>setPlanId(e.target.value)}>
        <option value="">Plan seçiniz</option>
        {availablePlans.filter(x=>role!=='COACH'||x.capacity!==null).map(x=><option key={x.id} value={x.id}>{x.name}{x.capacity?' · '+x.capacity+' öğrenci':''}</option>)}
      </select>
      <label>Süre</label>
      <select value={term} onChange={e=>setTerm(e.target.value)}>{terms.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select>
      <button className="btn primary" disabled={busy||loading||!userId||!planId||users.find(x=>x.id===userId)?.status!=='ACTIVE'} onClick={()=>void assign()}>{busy?'Atanıyor…':'Planı Hesaba Ata'}</button>
      <small className="muted">Bu işlem bir ödeme tahsilatı değildir; yönetici tarafından verilen kullanım hakkıdır. Yeni atama mevcut aktif aboneliğin yerine geçer.</small>
    </div>
  </section>;
}
