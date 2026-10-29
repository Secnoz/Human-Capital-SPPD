import { randomBytes,scrypt,timingSafeEqual } from 'node:crypto';
const derive=(password:string,salt:string)=>new Promise<Buffer>((resolve,reject)=>{
 scrypt(password.normalize('NFKC'),salt,64,{N:16384,r:16,p:1,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key));
});
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return `${salt}:${(await derive(password,salt)).toString('hex')}`;}
export async function verifyPassword({hash,password}:{hash:string;password:string}){const[salt,key]=hash.split(':');if(!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{128}$/.test(key))return false;return timingSafeEqual(await derive(password,salt),Buffer.from(key,'hex'));}
