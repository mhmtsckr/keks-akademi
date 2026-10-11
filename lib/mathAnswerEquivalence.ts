/**
 * Compare short, learner-entered answers without evaluating arbitrary expressions.
 * Numerical answers may be expressed as a decimal, a fraction or a percentage.
 * Multiple-choice answers remain the responsibility of the normal option-key checker.
 */
function parseNumber(value:string):number|null{
  const normalized=value.trim().replace(/\u2212/g,'-').replace(/\s+/g,'');
  if(!/^[+-]?\d+(?:[.,]\d+)?$/.test(normalized))return null;
  const parsed=Number(normalized.replace(',','.'));
  return Number.isFinite(parsed)?parsed:null;
}

export function parseShortMathAnswer(value:string):number|null{
  let text=value.trim().toLocaleLowerCase('tr-TR');
  // Only explicit currency units; never remove arbitrary words.
  text=text.replace(/\s*(?:tl|₺)\s*$/i,'').trim();
  const percent=text.startsWith('%')||text.endsWith('%');
  if(percent)text=text.replace(/^%\s*/,'').replace(/\s*%$/,'').trim();
  const slash=text.split('/');
  if(slash.length===2){
    const numerator=parseNumber(slash[0]);
    const denominator=parseNumber(slash[1]);
    if(numerator===null||denominator===null||denominator===0)return null;
    const quotient=numerator/denominator;
    return Number.isFinite(quotient)?quotient/(percent?100:1):null;
  }
  if(slash.length>2)return null;
  const valueNumber=parseNumber(text);
  return valueNumber===null?null:valueNumber/(percent?100:1);
}

export function areEquivalentShortAnswers(submitted:string,expected:string):boolean{
  const a=parseShortMathAnswer(submitted);
  const b=parseShortMathAnswer(expected);
  if(a!==null&&b!==null)return Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b));
  return submitted.trim().toLocaleLowerCase('tr-TR')===expected.trim().toLocaleLowerCase('tr-TR');
}
