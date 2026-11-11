import {describe,expect,it} from 'vitest';
import {scheduledRecheckDueAt,dateKeyIstanbul,academicReviewDecisionLabel}
 from './academicReviewDecision';
const now=new Date('2026-11-11T21:30:00+03:00');
describe('Koç akademik inceleme kararı',()=>{
  it('İstanbul takviminde 1–28 gün içinde takip tarihine izin verir',()=>{
    expect(dateKeyIstanbul(now)).toBe('2026-11-11');
    expect(scheduledRecheckDueAt('2026-11-12',now)?.toISOString()).toBe('2026-11-12T20:00:00.000Z');
    expect(scheduledRecheckDueAt('2026-12-09',now)?.toISOString()).toBe('2026-12-09T20:00:00.000Z');
  });
  it('geçmiş, bugün, uzak veya takvimce geçersiz tarihi reddeder',()=>{
    for(const date of ['2026-11-10','2026-11-11','2026-12-10','2026-02-30',
      '2026-13-04','2026-1-2','2026-11-12T00:00:00Z']){
      expect(scheduledRecheckDueAt(date,now)).toBeNull();
    }
  });
  it('koç karar etiketleri başarı veya öğrenme hükmü üretmez',()=>{
    for(const action of ['CLOSE_REVIEW','COLLECT_MORE_EVIDENCE','DISMISS_SIGNAL'] as const){
      const label=academicReviewDecisionLabel(action);
      expect(label).toContain('Koç');
      expect(label).not.toContain('öğrendi');
    }
  });
});
