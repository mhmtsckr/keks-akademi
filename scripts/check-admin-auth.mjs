import {PrismaClient} from '@prisma/client';

if(process.env.VERCEL_ENV!=='production'){
  console.log('Admin auth diagnostic skipped outside Vercel production.');
  process.exit(0);
}

const email=(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
if(!email||!process.env.DATABASE_URL){
  console.log('Admin auth diagnostic: configuration incomplete.');
  process.exit(0);
}

const db=new PrismaClient();
try{
  const user=await db.user.findUnique({
    where:{email},
    select:{role:true,status:true,passwordHash:true}
  });
  console.log(
    'Admin auth diagnostic:',
    JSON.stringify({
      accountExists:Boolean(user),
      role:user?.role||null,
      status:user?.status||null,
      passwordConfigured:Boolean(user?.passwordHash)
    })
  );
}finally{
  await db.$disconnect();
}
