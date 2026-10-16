/** KEKS Paragraf A3 edition: 50 tests x 30 questions; 8 printed pages per test. */
export const PARAGRAF_TEST_COUNT = 50;
export const PARAGRAF_PAGE_COUNT = PARAGRAF_TEST_COUNT * 8;
export const PARAGRAF_REVIEW_DAYS = [0, 1, 3, 7, 14, 28] as const;
export type ParagrafChoice = 'A'|'B'|'C'|'D'|'E'|null;

export function parseParagrafPageNo(raw: string) {
  if (!/^\d{3}$/.test(raw)) return null;
  const pageNo = Number(raw);
  if (pageNo < 1 || pageNo > PARAGRAF_PAGE_COUNT) return null;
  const testNo = Math.floor((pageNo - 1) / 8) + 1;
  const pageInTest = ((pageNo - 1) % 8) + 1;
  const first = (pageInTest - 1) * 4 + 1;
  const questionNos = Array.from({length: Math.min(4, 31 - first)}, (_,i) => first + i);
  return {pageNo,code:raw,testNo,pageInTest,questionNos};
}

export function paragrafPageLegacyId(studentId:string,code:string) {
  return 'PARAGRAF_PAGE_V1:' + studentId + ':' + code;
}

export type ParagrafSolutionRow = {
  id:string; testNo:number; questionNo:number; topic:string; correctAnswer:string;
};

export function gradeParagrafPage(
  expectedQuestionNos: readonly number[],
  questions: readonly ParagrafSolutionRow[],
  answers: Record<string,ParagrafChoice>
) {
  const expected = expectedQuestionNos.map(String);
  if (questions.length !== expected.length ||
      new Set(questions.map(q=>q.questionNo)).size !== expected.length ||
      questions.some(q=>!expected.includes(String(q.questionNo)))) {
    throw new Error('Bu sayfanın onaylı cevap anahtarı eksik.');
  }
  if (Object.keys(answers).length !== expected.length ||
      Object.keys(answers).some(k=>!expected.includes(k)) ||
      expected.some(k=>!Object.prototype.hasOwnProperty.call(answers,k))) {
    throw new Error('Yalnız sayfadaki soruların cevapları gönderilebilir.');
  }
  const items = [...questions].sort((a,b)=>a.questionNo-b.questionNo).map(q=>{
    const choice=answers[String(q.questionNo)];
    if (choice!==null && !(['A','B','C','D','E'] as unknown[]).includes(choice)) {
      throw new Error('Cevap A–E veya boş olmalıdır.');
    }
    if (!(['A','B','C','D','E'] as string[]).includes(q.correctAnswer)) {
      throw new Error('Cevap anahtarı geçersiz.');
    }
    const status=choice===null?'BLANK':choice===q.correctAnswer?'CORRECT':'WRONG';
    return {id:q.id,questionNo:q.questionNo,topic:q.topic,answer:choice,
      correctAnswer:q.correctAnswer,status};
  });
  const correct=items.filter(x=>x.status==='CORRECT').length;
  const wrong=items.filter(x=>x.status==='WRONG').length;
  const blank=items.filter(x=>x.status==='BLANK').length;
  const net=Math.round((correct-wrong/4)*100)/100;
  const wrongTopics=[...new Set(items.filter(x=>x.status==='WRONG').map(x=>x.topic))];
  return {correct,wrong,blank,net,items,wrongTopics,
    reviewRecommendation:wrong?{days:[...PARAGRAF_REVIEW_DAYS],
      note:'Yanlış sorular için 0–1–3–7–14–28 gün tekrar önerisi; tekrar kuyruğuna henüz otomatik eklenmez.'}:null};
}
