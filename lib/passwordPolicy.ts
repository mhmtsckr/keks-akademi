export const PASSWORD_MIN_LENGTH=12;
export const PASSWORD_RECOMMENDED_LENGTH=16;

const BLOCKED_PATTERNS=[
  '123456','654321','qwerty','asdfgh','zxcvbn','abcdef','fedcba','112233',
  'password','parola','sifre','şifre'
];

function hasSequentialRun(value:string,minRun=4){
  const normalized=value.toLowerCase();
  for(let i=0;i<=normalized.length-minRun;i++){
    const part=normalized.slice(i,i+minRun);
    if(!/^[a-z0-9]+$/.test(part))continue;
    const codes=[...part].map(c=>c.charCodeAt(0));
    const diffs=codes.slice(1).map((code,index)=>code-codes[index]);
    if(diffs.every(x=>x===1)||diffs.every(x=>x===-1))return true;
  }
  return false;
}

export function passwordPolicyErrors(password:string){
  const errors:string[]=[];
  if(password.length<PASSWORD_MIN_LENGTH)errors.push('Şifre en az 12 karakter olmalıdır; 16 veya daha fazla karakter önerilir.');
  if(!/[A-Z]/.test(password))errors.push('En az bir büyük harf (A-Z) içermelidir.');
  if(!/[a-z]/.test(password))errors.push('En az bir küçük harf (a-z) içermelidir.');
  if(!/[0-9]/.test(password))errors.push('En az bir rakam (0-9) içermelidir.');
  if(!/[^A-Za-z0-9\s]/.test(password))errors.push('En az bir özel karakter (!, @, #, $, ?, *, _, - vb.) içermelidir.');
  if(/\s/.test(password))errors.push('Şifre boşluk içermemelidir.');
  const lower=password.toLowerCase();
  if(BLOCKED_PATTERNS.some(pattern=>lower.includes(pattern)))errors.push('123456, qwerty, asdfgh, 112233 gibi tahmin edilebilir dizilimler kullanılamaz.');
  if(hasSequentialRun(password))errors.push('Ardışık harf veya rakam dizilimleri (1234, 4321, abcd vb.) kullanılamaz.');
  if(/(.)\1{3,}/.test(password))errors.push('Aynı karakter art arda dört veya daha fazla kez kullanılamaz.');
  if(/(\d)\1(\d)\2(\d)\3/.test(password))errors.push('112233 benzeri tekrar eden sayı dizilimleri kullanılamaz.');
  return [...new Set(errors)];
}

export function isStrongPassword(password:string){
  return passwordPolicyErrors(password).length===0;
}

export function passwordPolicyMessage(password:string){
  return passwordPolicyErrors(password)[0]||null;
}
