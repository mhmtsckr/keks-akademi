import {db} from '@/lib/db';

export async function HomeVerifiedTestimonials(){
  const rows=await db.userTestimonial.findMany({
    where:{
      status:'PUBLISHED',
      publishConsent:true,
      rating:{not:null},
      sanitizedComment:{not:null}
    },
    select:{id:true,rating:true,sanitizedComment:true,contextLabel:true},
    orderBy:[{publishedAt:'desc'},{createdAt:'desc'}],
    take:6
  });

  if(!rows.length){
    return <div className="homeReviewPlaceholder">
      <div aria-hidden="true">★★★★★</div>
      <h3>Doğrulanmış kullanıcı yorumları burada yayınlanacak.</h3>
      <p>30 gününü tamamlayan öğrenci, veli ve KEKS Partner Koçlardan yalnız açık yayın izni alınmış gerçek yorumlar burada anonim olarak görünecek.</p>
    </div>;
  }

  return <div className="homeVerifiedReviewGrid">
    {rows.map(row=><article className="homeVerifiedReviewCard" key={row.id}>
      <div className="homeVerifiedStars" aria-label={(row.rating||0)+' yıldız'}>{'★'.repeat(row.rating||0)}<span>{'★'.repeat(Math.max(0,5-(row.rating||0)))}</span></div>
      <blockquote>“{row.sanitizedComment}”</blockquote>
      <footer><strong>Doğrulanmış KEKS kullanıcısı</strong><span>{row.contextLabel}</span></footer>
    </article>)}
  </div>;
}
