const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#071b31"/>
  <path d="M14 46V17h8v12l12-12h11L31 31l15 15H35L22 33v13z" fill="#ffffff"/>
  <path d="M42 14h8v8" fill="none" stroke="#e5b94d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M49 15L37 27" fill="none" stroke="#e5b94d" stroke-width="4" stroke-linecap="round"/>
</svg>`;

export async function GET(){
  return new Response(svg,{
    status:200,
    headers:{
      'Content-Type':'image/svg+xml; charset=utf-8',
      'Cache-Control':'public, max-age=86400'
    }
  });
}
