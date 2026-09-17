export type Answer = { questionId: string; value: number };
export type Question = { id: string; dimension: string; reverse: boolean };

export function scoreAssessment(questions: Question[], answers: Answer[]) {
  const answerMap = new Map(answers.map(a => [a.questionId, a.value]));
  const buckets = new Map<string, number[]>();
  for (const q of questions) {
    const raw = answerMap.get(q.id);
    if (raw == null) continue;
    const value = q.reverse ? 6 - raw : raw;
    const arr = buckets.get(q.dimension) ?? [];
    arr.push(value);
    buckets.set(q.dimension, arr);
  }
  return Object.fromEntries([...buckets.entries()].map(([dimension, values]) => [dimension, Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(2))]));
}

export function buildReport(scores: Record<string, number>) {
  const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
  return {
    title: 'KEKS – Eğitsel Çalışma ve Öz-Düzenleme Eğilimleri Taraması',
    disclaimer: 'Bu uygulama psikolojik tanı koymaz ve kesin kişilik tipi belirlemez. Sonuçlar görüşme, gözlem ve akademik performans verileriyle birlikte değerlendirilmelidir.',
    scores,
    leadingDimensions: sorted.slice(0,3).map(([name, score]) => ({ name, score })),
    generatedAt: new Date().toISOString()
  };
}
