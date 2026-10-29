import { env } from 'cloudflare:workers';
import { getAppUser } from './auth';
import { calculate, seedTariffs, today, validDate, SCENARIOS, type TripData, type Employee, type Tariff, type Settings, type TripRecord } from './domain';

export class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
export const db=()=>{if(!env.DB)throw new HttpError(503,'Penyimpanan belum tersedia.');return env.DB;};
export async function rows<T=Record<string,unknown>>(sql:string,...args:unknown[]):Promise<T[]>{return(await db().prepare(sql).bind(...args).all<T>()).results;}
export async function one<T=Record<string,unknown>>(sql:string,...args:unknown[]){return db().prepare(sql).bind(...args).first<T>();}
export const EMPLOYEE_SQL='SELECT id,employee_no AS employeeNo,name,position,unit,criterion,credit_name AS creditName,bank_account AS bankAccount,active FROM employees';
export const TARIFF_SQL='SELECT id,scenario,criterion,valid_from AS validFrom,valid_until AS validUntil,daily,city_taxi AS cityTaxi,airport,note FROM tariffs';
export const TRIP_SQL='SELECT id,number,status,data,total,departure_date AS departureDate,created_at AS createdAt,updated_at AS updatedAt,created_by AS createdBy,revision,replaces,cancel_reason AS cancelReason FROM trips';
export const parseTrip=(r:Record<string,unknown>)=>({...r,data:JSON.parse(r.data as string)}) as unknown as TripRecord;
export async function settings(){const row=await one<{value:string}>('SELECT value FROM settings WHERE key=?','app');return row?JSON.parse(row.value) as Settings:null;}
export async function context(){
 const user=await getAppUser();if(!user)throw new HttpError(401,'Silakan masuk menggunakan email dan kata sandi.');
 const email=user.email.toLowerCase();
 const member=await one<{email:string;user_id:string|null;name:string;role:'admin'|'staff';active:number}>('SELECT * FROM members WHERE email=?',email);
 if(!member||!member.active)throw new HttpError(403,'Akun ini belum mendapat akses Human Capital. Hubungi Admin HC.');
 if(member.user_id&&member.user_id!==user.userId)throw new HttpError(403,'Identitas akun tidak cocok.');
 if(!member.user_id)await db().prepare('UPDATE members SET user_id=? WHERE email=? AND user_id IS NULL').bind(user.userId,email).run();
 return{...user,email,role:member.role};
}
export function admin(c:{role:string}){if(c.role!=='admin')throw new HttpError(403,'Tindakan ini hanya tersedia untuk Admin HC.');}
export async function log(actor:string,action:string,target:string,details:unknown={}){await db().prepare('INSERT INTO audit(id,actor,action,target,at,details) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),actor,action,target,new Date().toISOString(),JSON.stringify(details)).run();}
export function text(value:unknown,max=300){return typeof value==='string'?value.trim().slice(0,max):'';}
export function cleanData(raw:unknown):TripData{
 if(!raw||typeof raw!=='object')throw new HttpError(400,'Data perjalanan tidak valid.');const r=raw as Record<string,unknown>;
 if(!Array.isArray(r.participants)||r.participants.length>20)throw new HttpError(400,'Daftar peserta tidak valid.');
 const d:TripData={costVersion:2,scenario:text(r.scenario) as TripData['scenario'],purpose:text(r.purpose) as TripData['purpose'],issueDate:text(r.issueDate,10),issueCity:text(r.issueCity,80),originOfficeId:text(r.originOfficeId,80),origin:text(r.origin,200),destination:text(r.destination,300),destinationPlaceId:text(r.destinationPlaceId,300),reason:text(r.reason,600),departureDate:text(r.departureDate,10),returnDate:text(r.returnDate,10),paidDays:Number(r.paidDays),nights:Number(r.nights),dayReason:text(r.dayReason,500),transport:text(r.transport,100),note:text(r.note,1000),manualDistanceKm:r.manualDistanceKm==null||r.manualDistanceKm===''?null:Number(r.manualDistanceKm),distanceReason:text(r.distanceReason,500),region:text(r.region,50),participants:r.participants.map((p:Record<string,unknown>)=>({employeeId:text(p.employeeId,80),intercity:p.intercity==null||p.intercity===''?0:Number(p.intercity),adjustmentReason:text(p.adjustmentReason,500),code:text(p.code,10),domesticTaxiEnabled:p.domesticTaxiEnabled===true,allowanceOverride:p.allowanceOverride==null?null:Number(p.allowanceOverride),cityTaxiOverride:p.cityTaxiOverride==null?null:Number(p.cityTaxiOverride),airportOverride:p.airportOverride==null?null:Number(p.airportOverride),creditNameOverride:p.creditNameOverride==null?null:text(p.creditNameOverride,120),bankAccountOverride:p.bankAccountOverride==null?null:text(p.bankAccountOverride,60)}))};
 if(!['dalam_provinsi','luar_provinsi'].includes(d.scenario)||!['umum','pendidikan'].includes(d.purpose))throw new HttpError(400,'Jenis perjalanan/pembebanan tidak valid.');
 for(const key of ['destinationLat','destinationLng','originLat','originLng'] as const){if(r[key]!=null){const coordinate=Number(r[key]);if(!Number.isFinite(coordinate)||Math.abs(coordinate)>(key.endsWith('Lat')?90:180))throw new HttpError(400,'Koordinat tujuan tidak valid.');d[key]=coordinate;}}
 for(const p of d.participants)for(const value of [p.allowanceOverride,p.cityTaxiOverride,p.airportOverride,p.intercity])if(value!=null&&(!Number.isSafeInteger(value)||value<0||value>1e10))throw new HttpError(400,'Biaya per orang harus berupa Rupiah bulat 0–10 miliar.');
 return d;
}
export function validEmployee(raw:Record<string,unknown>){
 const e={id:text(raw.id,80)||crypto.randomUUID(),employeeNo:text(raw.employeeNo,40),name:text(raw.name,120),position:text(raw.position,150),unit:text(raw.unit,150),criterion:Number(raw.criterion),creditName:text(raw.creditName,120),bankAccount:text(raw.bankAccount,60),active:raw.active===0?0:1};
 if(!e.employeeNo||!e.name||!e.position||!e.unit||!e.creditName||!e.bankAccount)throw new HttpError(400,'Lengkapi nomor pegawai, nama, jabatan, unit, penerima, dan rekening.');
 if(!Number.isInteger(e.criterion)||e.criterion<1||e.criterion>10)throw new HttpError(400,'Kriteria harus angka 1–10.');if(!/^[0-9]+$/.test(e.bankAccount))throw new HttpError(400,'Nomor rekening harus teks angka tanpa spasi/pemisah.');return e;
}
export function employeeStatement(e:Employee){return db().prepare('INSERT INTO employees(id,employee_no,name,position,unit,criterion,credit_name,bank_account,active) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET employee_no=excluded.employee_no,name=excluded.name,position=excluded.position,unit=excluded.unit,criterion=excluded.criterion,credit_name=excluded.credit_name,bank_account=excluded.bank_account,active=excluded.active').bind(e.id,e.employeeNo,e.name,e.position,e.unit,e.criterion,e.creditName,e.bankAccount,e.active);}
export async function tripById(id:string){const r=await one<Record<string,unknown>>(TRIP_SQL+' WHERE id=?',id);if(!r)throw new HttpError(404,'SPPD tidak ditemukan.');return parseTrip(r);}
export async function backup(actor:string){
 if(!env.BUCKET)throw new HttpError(503,'Penyimpanan cadangan belum tersedia.');
 const tables=['members','settings','employees','offices','tariffs','trips','counters','audit','files','auth_user','auth_account'];const content:Record<string,unknown>={version:2,site:'SPPD-HC',createdAt:new Date().toISOString()};for(const table of tables)content[table]=await rows(`SELECT * FROM ${table}`);
 const key=`backups/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.json`;await env.BUCKET.put(key,JSON.stringify(content),{httpMetadata:{contentType:'application/json'}});await log(actor,'backup.created',key);return{key,createdAt:content.createdAt};
}
export async function autoBackup(actor:string){if(!env.BUCKET)return;const day=today();const result=await db().prepare("INSERT INTO settings(key,value) VALUES('__backup_day',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE settings.value<>excluded.value").bind(day).run();if(result.meta.changes){try{await backup(actor);}catch{await db().prepare("DELETE FROM settings WHERE key='__backup_day' AND value=?").bind(day).run();}}}
export async function finalize(id:string,revision:number,actor:string){
 const trip=await tripById(id);if(trip.status==='final')return trip;if(trip.status!=='draft')throw new HttpError(409,'SPPD ini sudah dibatalkan.');if(trip.revision!==revision)throw new HttpError(409,'Draf telah diubah petugas lain. Muat ulang sebelum melanjutkan.');
 const s=await settings();if(!s||!s.signerName||!s.signerPosition||!s.commander)throw new HttpError(400,'Lengkapi penandatangan di Pengaturan.');
 const result=calculate(trip.data,await rows<Employee>(EMPLOYEE_SQL),await rows<Tariff>(TARIFF_SQL),true);if(result.errors.length)throw new HttpError(400,result.errors.join('\n'));
 const d={...trip.data,participants:result.participants,company:s.company,signerName:s.signerName,signerPosition:s.signerPosition,commander:s.commander,templateVersion:'2026-10-29-v2',templateId:trip.data.scenario==='dalam_mobil_dinas'?'payment-md-general':`payment-${trip.data.scenario==='dalam_provinsi'?'dp':'lp'}-${trip.data.purpose==='umum'?'general':'education'}`};
 const year=d.issueDate.slice(0,4),pattern=s.numberPattern.replaceAll('{year}',year);const parts=pattern.split('{sequence}');if(parts.length!==2)throw new HttpError(400,'Format nomor harus memuat satu {sequence}.');const now=new Date().toISOString();
 const batch=await db().batch([
 db().prepare('INSERT OR IGNORE INTO counters(year,value) VALUES(?,0)').bind(year),
 db().prepare("UPDATE counters SET value=value+1 WHERE year=? AND EXISTS(SELECT 1 FROM trips WHERE id=? AND status='draft' AND revision=?)").bind(year,id,revision),
 db().prepare("UPDATE trips SET number=? || CAST((SELECT value FROM counters WHERE year=?) AS TEXT) || ?, status='final',data=?,total=?,departure_date=?,updated_at=?,revision=revision+1 WHERE id=? AND status='draft' AND revision=?").bind(parts[0],year,parts[1],JSON.stringify(d),result.total,d.departureDate,now,id,revision),
 ]);
 if(batch[2].meta.changes)await log(actor,'trip.finalized',id,{total:result.total,revision});else{const updated=await tripById(id);if(updated.status!=='final')throw new HttpError(409,'Draf telah berubah. Muat ulang.');}
 return tripById(id);
}
export async function setup(raw:Record<string,unknown>,actor:string){
 if(await settings())throw new HttpError(409,'Ruang kerja sudah disiapkan.');const validFrom=text(raw.validFrom,10);if(!validDate(validFrom))throw new HttpError(400,'Tanggal mulai berlaku tarif wajib valid.');
 const s:Settings={company:text(raw.company,80)||'BANK KALSEL',issueCity:text(raw.issueCity,80)||'Banjarmasin',signerName:text(raw.signerName,100),signerPosition:text(raw.signerPosition,80)||'Kepala',commander:text(raw.commander,120)||'Kepala Divisi Human Capital',numberPattern:'{sequence}/SPPD/Km-DHC/KP/{year}',mapsKey:'',validFrom,templateVersion:'2026-10-23-v1'};
 if(!s.signerName)throw new HttpError(400,'Isi nama penandatangan.');const last=Number(raw.lastNumber)||0;if(!Number.isInteger(last)||last<0||last>1e8)throw new HttpError(400,'Nomor terakhir tidak valid.');
 await db().batch([db().prepare('INSERT INTO settings(key,value) VALUES(?,?)').bind('app',JSON.stringify(s)),...seedTariffs(validFrom).map(t=>db().prepare('INSERT INTO tariffs(id,scenario,criterion,valid_from,valid_until,daily,city_taxi,airport,note) VALUES(?,?,?,?,?,?,?,?,?)').bind(t.id,t.scenario,t.criterion,t.validFrom,t.validUntil,t.daily,t.cityTaxi,t.airport,t.note)),db().prepare('INSERT OR IGNORE INTO counters(year,value) VALUES(?,?)').bind(today().slice(0,4),last)]);
 await log(actor,'workspace.setup','app',{validFrom,lastNumber:last});return s;
}
