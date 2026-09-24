export const ADULT_EXAM_GROUPS=[
  'DGS',
  'KPSS',
  'EKPSS',
  'ALES',
  'AGS/YDS',
  'YÖKDİL',
  'AGS/ÖABT',
  'YDS'
] as const;

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

export type AdultExamGroup=typeof ADULT_EXAM_GROUPS[number];
export type AgsOabtField=typeof AGS_OABT_FIELDS[number];

export function isAgsOabtLabel(value?:string|null){
  const raw=(value||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ');
  return /ÖABT|OABT/.test(raw)||(/AGS/.test(raw)&&!/YDS/.test(raw));
}

export function isAgsYdsLabel(value?:string|null){
  const raw=(value||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ');
  return /AGS/.test(raw)&&/YDS/.test(raw);
}

export function getAdultExamGroup(value?:string|null):AdultExamGroup|null{
  const raw=(value||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ');
  if(/AGS/.test(raw)&&/YDS/.test(raw))return 'AGS/YDS';
  if(/ÖABT|OABT/.test(raw)||(/AGS/.test(raw)&&!/YDS/.test(raw)))return 'AGS/ÖABT';
  if(/YÖKDİL|YOKDIL/.test(raw))return 'YÖKDİL';
  if(/EKPSS/.test(raw))return 'EKPSS';
  if(/KPSS/.test(raw))return 'KPSS';
  if(/DGS/.test(raw))return 'DGS';
  if(/ALES/.test(raw))return 'ALES';
  if(/YDS/.test(raw))return 'YDS';
  return null;
}

export function displayExamGroupWithTrack(gradeLevel?:string|null,academicTrack?:string|null){
  const group=getAdultExamGroup(gradeLevel);
  if(group==='AGS/ÖABT'&&academicTrack)return group+'- '+academicTrack;
  return group||gradeLevel||'—';
}


export function isAgsOabtStudentRecord(input:{gradeLevel?:string|null;academicTrack?:string|null;profile?:unknown}){
  if(isAgsOabtLabel(input.gradeLevel))return true;
  if(input.academicTrack&&AGS_OABT_FIELDS.includes(input.academicTrack as any))return true;
  try{
    const legacy=JSON.stringify(input.profile||{}).toLocaleUpperCase('tr-TR');
    if(/ÖABT|OABT/.test(legacy))return true;
  }catch{}
  return false;
}
