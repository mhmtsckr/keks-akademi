'use client';

import { FormEvent, useEffect, useState } from 'react';

export function StudentWeeklyReflection() {
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch('/api/student/weekly-reflection');
    const j = await r.json();
    if (r.ok) setData(j);
  }

  useEffect(() => { load(); }, []);

  if (!data) {
    return <div className="card"><p className="muted">Haftalık öz değerlendirme yükleniyor…</p></div>;
  }

  if (!data.isSunday && !data.existing) return null;

  const existing = data.existing;
  const snapshot = data.snapshot;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      bestThing: String(fd.get('bestThing') || ''),
      biggestChallenge: String(fd.get('biggestChallenge') || ''),
      planRealistic: Number(fd.get('planRealistic')),
      selfRating: Number(fd.get('selfRating')),
      nextWeekChange: String(fd.get('nextWeekChange') || '')
    };

    const r = await fetch('/api/student/weekly-reflection', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg('Hata: ' + (j.error || 'Öz değerlendirme kaydedilemedi.'));
    setMsg('Haftalık öz değerlendirmen kaydedildi. Koçun bunu gerçek performans verilerinle birlikte görecek.');
    await load();
  }

  return <div className="card weeklyReflectionCard">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">PAZAR · HAFTALIK ÖZ DEĞERLENDİRME</div>
        <h2>Bu haftayı 2 dakikada değerlendir</h2>
        <p className="muted">Amaç kendini yargılamak değil; kendi algınla gerçek çalışma verilerini karşılaştırmak.</p>
      </div>
      <span className="pill">{existing ? 'KAYDEDİLDİ' : '5 KISA SORU'}</span>
    </div>

    <div className="grid" style={{gridTemplateColumns:'repeat(3,1fr)', marginBottom:14}}>
      <div className="card"><strong>{snapshot.activeDays}/7</strong><div className="muted">Aktif gün</div></div>
      <div className="card"><strong>%{snapshot.taskCompletionRate}</strong><div className="muted">Görev tamamlama</div></div>
      <div className="card"><strong>{snapshot.focusMinutes} dk</strong><div className="muted">Kayıtlı odak</div></div>
    </div>

    {msg && <div className={'notice ' + (msg.startsWith('Hata:') ? 'error' : '')}>{msg}</div>}

    {data.isSunday ? <form className="stack" onSubmit={submit}>
      <label>
        1. Bu hafta ne iyi gitti?
        <textarea name="bestThing" rows={3} defaultValue={existing?.bestThing || ''} required />
      </label>

      <label>
        2. En çok ne zorladı?
        <textarea name="biggestChallenge" rows={3} defaultValue={existing?.biggestChallenge || ''} required />
      </label>

      <label>
        3. Plan gerçekçi miydi?
        <select name="planRealistic" defaultValue={existing?.planRealistic || 3} required>
          <option value="1">1 · Hiç gerçekçi değildi</option>
          <option value="2">2 · Çoğunlukla gerçekçi değildi</option>
          <option value="3">3 · Kısmen gerçekçiydi</option>
          <option value="4">4 · Büyük ölçüde gerçekçiydi</option>
          <option value="5">5 · Tamamen gerçekçiydi</option>
        </select>
      </label>

      <label>
        4. Kendine kaç puan verirsin?
        <select name="selfRating" defaultValue={existing?.selfRating || 3} required>
          <option value="1">1 / 5</option>
          <option value="2">2 / 5</option>
          <option value="3">3 / 5</option>
          <option value="4">4 / 5</option>
          <option value="5">5 / 5</option>
        </select>
      </label>

      <label>
        5. Gelecek hafta neyi değiştirmek istersin?
        <textarea name="nextWeekChange" rows={3} defaultValue={existing?.nextWeekChange || ''} required />
      </label>

      <button className="btn primary" disabled={busy}>
        {busy ? 'Kaydediliyor…' : existing ? 'Öz Değerlendirmeyi Güncelle' : 'Öz Değerlendirmeyi Kaydet'}
      </button>
    </form> : <p className="muted">Bu haftanın öz değerlendirmesi kaydedildi. Yeni form gelecek pazar açılacak.</p>}
  </div>;
}
