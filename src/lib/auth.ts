import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { getDb } from '../../db';
import { authUser,authSession,authAccount,authVerification,authRateLimit } from '../../db/auth-schema';
import { hashPassword,verifyPassword } from './password';
export function createAuth(){
 if(!env.BETTER_AUTH_SECRET)throw new Error('Pengaturan login belum tersedia.');
 const origin=import.meta.env.DEV?'http://127.0.0.1:5173':'https://sppd-human-capital-kalsel.sunsetape16.chatgpt.site';
 return betterAuth({
  appName:'SPPD Human Capital',baseURL:origin,secret:env.BETTER_AUTH_SECRET,
  database:drizzleAdapter(getDb(),{provider:'sqlite',schema:{user:authUser,session:authSession,account:authAccount,verification:authVerification,rateLimit:authRateLimit}}),
  emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:10,maxPasswordLength:128,password:{hash:hashPassword,verify:verifyPassword}},
  session:{expiresIn:60*60*8,updateAge:60*60,cookieCache:{enabled:false}},
  rateLimit:{enabled:true,storage:'database',window:60,max:100,customRules:{'/sign-in/email':{window:60,max:10}}},
  advanced:{ipAddress:{ipAddressHeaders:['cf-connecting-ip']}},plugins:[admin()],
 });
}
export async function getAppUser(){const session=await createAuth().api.getSession({headers:await headers()});if(!session)return null;return{userId:session.user.id,email:session.user.email,displayName:session.user.name};}
