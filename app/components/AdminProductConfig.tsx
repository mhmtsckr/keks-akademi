'use client';

import {FormEvent,useEffect,useState} from 'react';

function toTl(kurus:number){return (kurus/100).toLocaleString('tr-TR',{minimumFractionDigits:0,maximumFractionDigits:2})}

export function AdminProductConfig(){
  const [product,setProduct]=useState<any>(null);
  const [listPrice,setListPrice]=useState('');
  const [price,setPrice]=useState('');
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  async function load(){
    const r=await fetch('/api/admin/product-config',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Fiyat bilgisi yüklenemedi.'));
    setProduct(j.product);
    setListPrice(toTl(j.pricing.listPriceKurus));
    setPrice(toTl(j.pricing.priceKurus));
  }
  useEffect(()=>{void load()},[]);

  function parseTl(value:string){
    const normalized=value.trim().replace(/\./g,'').replace(',','.');
    const n=Number(normalized);
    return Number.isFinite(n)?Math.round(n*100):NaN;
  }

  async function save(e:FormEvent){
    e.preventDefault();setBusy(true);setMsg('');
    try{
      const listPriceKurus=parseTl(listPrice);
      const priceKurus=parseTl(price);
      if(!Number.isInteger(listPriceKurus)||!Number.isInteger(priceKurus)||listPriceKurus<=0||priceKurus<=0){
        return setMsg('Hata: Geçerli liste ve satış fiyatı girin.');
      }
      const r=await fetch('/api/admin/product-config',{
        method:'PATCH',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({listPriceKurus,priceKurus})
      });
      const j=await r.json();
      if(!r.ok)return setMsg('Hata: '+(j.error||'Fiyat güncellenemedi.'));
      setProduct(j.product);
      setListPrice(toTl(j.pricing.listPriceKurus));
      setPrice(toTl(j.pricing.priceKurus));
      setMsg(j.message||'Merkezi fiyat güncellendi.');
    }finally{setBusy(false)}
  }

  return <div className="card" style={{marginBottom:16}}>
    <div className="moduleEyebrow">MERKEZİ ÜRÜN & FİYAT YÖNETİMİ</div>
    <h3>KEKS Aylık Test Ürünü</h3>
    <p className="muted">Buradaki fiyat tek kaynaktır. Öğrenci ürün vitrini, PayTR ödeme tutarı, test erişimi ve yönetici ekranları aynı yapılandırmayı kullanır.</p>
    {product&&<div className="notice"><strong>Aktif satış:</strong> {product.priceLabel} · Liste: {product.listPriceLabel} · %{product.discountPercent} indirim</div>}
    <form className="row" onSubmit={save} style={{alignItems:'end',marginTop:12,flexWrap:'wrap'}}>
      <div className="field" style={{minWidth:180}}><label>Liste fiyatı (TL)</label><input inputMode="decimal" value={listPrice} onChange={e=>setListPrice(e.target.value)} required/></div>
      <div className="field" style={{minWidth:180}}><label>Satış fiyatı (TL)</label><input inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} required/></div>
      <button className="btn primary" disabled={busy}>{busy?'Kaydediliyor…':'Merkezi Fiyatı Güncelle'}</button>
    </form>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginTop:10}}>{msg}</div>}
  </div>;
}
