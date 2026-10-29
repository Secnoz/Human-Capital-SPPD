import { createAuth } from '../../../../src/lib/auth';
const allowed=new Set(['/sign-in/email','/sign-out','/get-session','/change-password']);
async function handle(request:Request){
 const path=new URL(request.url).pathname.replace(/^\/api\/auth/,'');
 if(!allowed.has(path))return Response.json({error:'Pendaftaran dilakukan oleh Admin HC.'},{status:404});
 const response=await createAuth().handler(request);response.headers.set('cache-control','no-store');return response;
}
export const GET=handle,POST=handle;
