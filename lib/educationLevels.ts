export const EDUCATION_LEVELS={
  PRIMARY_123:'İlkokul 1-2-3',
  PRIMARY_4:'İlkokul 4 | Proje Ortaokuluna Hazırlık',
  MIDDLE_56:'Ortaokul 5-6 | Maarif Model',
  MIDDLE_7:'Ortaokul 7 | Maarif Model',
  MIDDLE_8:'Ortaokul 8 | Maarif Model',
  HIGH_910:'Lise 9-10 | Maarif Model (1.Aşama)',
  HIGH_11:'Lise 11 | Maarif Model (Alan)',
  HIGH_12:'Lise 12 | YKS',
  GRADUATE_YKS:'Mezun | YKS'
} as const;

export const EDUCATION_LEVEL_OPTIONS=[
  EDUCATION_LEVELS.PRIMARY_123,
  EDUCATION_LEVELS.PRIMARY_4,
  EDUCATION_LEVELS.MIDDLE_56,
  EDUCATION_LEVELS.MIDDLE_7,
  EDUCATION_LEVELS.MIDDLE_8,
  EDUCATION_LEVELS.HIGH_910,
  EDUCATION_LEVELS.HIGH_11,
  EDUCATION_LEVELS.HIGH_12,
  EDUCATION_LEVELS.GRADUATE_YKS
] as const;

export const SCREENING_EDUCATION_LABELS={
  ILKOKUL_1_2:EDUCATION_LEVELS.PRIMARY_123,
  ILKOKUL_3_4:EDUCATION_LEVELS.PRIMARY_4,
  ORTAOKUL_5_6:EDUCATION_LEVELS.MIDDLE_56,
  ORTAOKUL_7_8:`${EDUCATION_LEVELS.MIDDLE_7} / ${EDUCATION_LEVELS.MIDDLE_8}`,
  LISE_9_10:EDUCATION_LEVELS.HIGH_910,
  LISE_11_12:`${EDUCATION_LEVELS.HIGH_11} / ${EDUCATION_LEVELS.HIGH_12}`,
  YETISKIN_MEZUN:EDUCATION_LEVELS.GRADUATE_YKS,
  YETISKIN_SINAV:'Yetişkin Sınav Grubu',
  GENERAL:'Genel'
} as const;

export function normalizeLegacyEducationLevel(value?:string|null){
  const original=(value||'').trim();
  if(!original)return '';
  const raw=original.toLocaleUpperCase('tr-TR').replace(/[–—]/g,'-').replace(/\s+/g,' ');

  if(/MEZUN/.test(raw)&&/YKS/.test(raw))return EDUCATION_LEVELS.GRADUATE_YKS;

  if(/İLKOKUL|ILKOKUL/.test(raw)){
    if(/1\s*-\s*2\s*-\s*3/.test(raw)||/1\s*-\s*2(?:\D|$)/.test(raw))return EDUCATION_LEVELS.PRIMARY_123;
    if(/3\s*-\s*4/.test(raw))return `${EDUCATION_LEVELS.PRIMARY_123} / ${EDUCATION_LEVELS.PRIMARY_4}`;
    if(/(?:^|\D)4(?:\D|$)/.test(raw)||/PROJE ORTAOKULUNA/.test(raw))return EDUCATION_LEVELS.PRIMARY_4;
  }

  if(/ORTAOKUL/.test(raw)){
    if(/5\s*-\s*6/.test(raw))return EDUCATION_LEVELS.MIDDLE_56;
    if(/7\s*-\s*8/.test(raw))return `${EDUCATION_LEVELS.MIDDLE_7} / ${EDUCATION_LEVELS.MIDDLE_8}`;
    if(/(?:^|\D)7(?:\D|$)/.test(raw))return EDUCATION_LEVELS.MIDDLE_7;
    if(/(?:^|\D)8(?:\D|$)/.test(raw)||/LGS/.test(raw))return EDUCATION_LEVELS.MIDDLE_8;
  }

  if(/LİSE|LISE/.test(raw)){
    if(/9\s*-\s*10/.test(raw))return EDUCATION_LEVELS.HIGH_910;
    if(/11\s*-\s*12/.test(raw))return `${EDUCATION_LEVELS.HIGH_11} / ${EDUCATION_LEVELS.HIGH_12}`;
    if(/(?:^|\D)11(?:\D|$)/.test(raw))return EDUCATION_LEVELS.HIGH_11;
    if(/(?:^|\D)12(?:\D|$)/.test(raw)||/YKS/.test(raw))return EDUCATION_LEVELS.HIGH_12;
  }

  if(raw===EDUCATION_LEVELS.PRIMARY_123.toLocaleUpperCase('tr-TR'))return EDUCATION_LEVELS.PRIMARY_123;
  if(raw===EDUCATION_LEVELS.PRIMARY_4.toLocaleUpperCase('tr-TR'))return EDUCATION_LEVELS.PRIMARY_4;
  if(raw===EDUCATION_LEVELS.MIDDLE_56.toLocaleUpperCase('tr-TR'))return EDUCATION_LEVELS.MIDDLE_56;
  if(raw===EDUCATION_LEVELS.MIDDLE_7.toLocaleUpperCase('tr-TR'))return EDUCATION_LEVELS.MIDDLE_7;
  if(raw===EDUCATION_LEVELS.MIDDLE_8.toLocaleUpperCase('tr-TR'))return EDUCATION_LEVELS.MIDDLE_8;
  if(raw===EDUCATION_LEVELS.HIGH_910.toLocaleUpperCase('tr-TR'))return EDUCATION_LEVELS.HIGH_910;
  if(raw===EDUCATION_LEVELS.HIGH_11.toLocaleUpperCase('tr-TR'))return EDUCATION_LEVELS.HIGH_11;
  if(raw===EDUCATION_LEVELS.HIGH_12.toLocaleUpperCase('tr-TR'))return EDUCATION_LEVELS.HIGH_12;
  if(raw===EDUCATION_LEVELS.GRADUATE_YKS.toLocaleUpperCase('tr-TR'))return EDUCATION_LEVELS.GRADUATE_YKS;

  return original;
}
