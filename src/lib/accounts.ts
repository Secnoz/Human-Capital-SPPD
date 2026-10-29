import { headers } from 'next/headers';
import { createAuth } from './auth';
import { db,one,text,HttpError,log } from './server';

export async function saveAccount(raw:Record<string,unknown>,actor:{email:string}){
 const email=text(raw.email,150).toLowerCase(),name=text(raw.name,100),role=raw.role==='admin'?'admin':'staff',active=raw.active===0?0:1;
 const password=typeof raw.password==='string'?raw.password:'';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!name)throw new HttpError(400,'Isi nama dan email yang valid.');
 if(email===actor.email&&(role!=='admin'||!active))throw new HttpError(400,'Anda tidak dapat menonaktifkan atau menurunkan peran sendiri.');
 if(password&&(password.length<10||password.length>128))throw new HttpError(400,'Kata sandi harus 10–128 karakter.');
 if(password&&email===actor.email)throw new HttpError(400,'Gunakan menu Ganti kata sandi untuk akun Anda sendiri.');
 let user=await one<{id:string}>('SELECT id FROM auth_user WHERE email=?',email);
 const auth=createAuth();
 if(!user){
  if(!password)throw new HttpError(400,'Isi kata sandi untuk akun baru.');
  const created=await auth.api.createUser({body:{email,name,password,role:role==='admin'?'admin':'user'}});
  user={id:created.user.id};
 }else if(password){
  await auth.api.setUserPassword({headers:await headers(),body:{userId:user.id,newPassword:password}});
 }
 const before=await one<{role:string;active:number}>('SELECT role,active FROM members WHERE email=?',email);
 const statements=[
  db().prepare('INSERT INTO members(email,user_id,name,role,active) VALUES(?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET user_id=excluded.user_id,name=excluded.name,role=excluded.role,active=excluded.active').bind(email,user.id,name,role,active),
  db().prepare('UPDATE auth_user SET name=?,role=?,banned=?,updated_at=? WHERE id=?').bind(name,role==='admin'?'admin':'user',active?0:1,Date.now(),user.id),
 ];
 if(!active||password||before&&before.role!==role)statements.push(db().prepare('DELETE FROM auth_session WHERE user_id=?').bind(user.id));
 await db().batch(statements);
 await log(actor.email,'member.saved',email,{role,active,passwordSet:!!password});
 return{ok:true};
}
