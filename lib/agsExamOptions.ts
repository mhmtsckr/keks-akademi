export const AGS_EXAM_GROUPS=['AGS/ÖABT','AGS/YDS'] as const;

export const AGS_OABT_FIELDS=[
  'Türkçe',
  'İlköğretim Matematik',
  'Fen Bilimleri/Fen ve Teknoloji',
  'Sosyal Bilgiler',
  'Türk Dili ve Edebiyatı',
  'Tarih',
  'Coğrafya',
  'Lise Matematik',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Din Kültürü ve Ahlak Bilgisi',
  'Rehber Öğretmen',
  'Sınıf Öğretmenliği',
  'Okul Öncesi Öğretmenliği',
  'İmam Hatip Lisesi Meslek Dersleri Öğretmenliği',
  'Beden Eğitimi Öğretmenliği'
] as const;

export type AgsOabtField=typeof AGS_OABT_FIELDS[number];

export function isAgsOabtLabel(value?:string|null){
  const raw=(value||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ');
  return /ÖABT|OABT/.test(raw)||(/AGS/.test(raw)&&!/YDS/.test(raw));
}

export function isAgsYdsLabel(value?:string|null){
  const raw=(value||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ');
  return /AGS/.test(raw)&&/YDS/.test(raw);
}
