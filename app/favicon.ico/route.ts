/** Redirect old cached favicon requests to the user-supplied KEKS Akademi emblem. */
export async function GET(req:Request){
  return Response.redirect(new URL('/keks-brand-navy-icon.webp',req.url),307);
}
