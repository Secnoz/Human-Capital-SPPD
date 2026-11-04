import {env} from 'cloudflare:workers';
import {db,rows,log,HttpError,EMPLOYEE_SQL,TRIP_SQL,parseTrip} from './server';
import type {Employee} from './domain';

export async function cleanupDummyEmployees(ids:unknown,actor:string,dryRun=false){
 if(!Array.isArray(ids)||ids.length<1||ids.length>100||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!/^dummy-employee-(?:00[1-9]|0[1-9]\d|100)$/.test(id)))throw new HttpError(400,'Daftar hanya boleh berisi ID pegawai dummy 001–100 yang unik.');
 const matches=await rows<Employee>(EMPLOYEE_SQL+' WHERE id IN (SELECT value FROM json_each(?))',JSON.stringify(ids));
 if(matches.some(e=>e.employeeNo!=='DM'+e.id.slice(-3)||!e.name.startsWith('Dummy ')))throw new HttpError(409,'Identitas pegawai telah berubah; penghapusan dibatalkan.');
 const chosen=new Set(matches.map(e=>e.id));
 const trips=(await rows(TRIP_SQL)).map(parseTrip);
 if(trips.some(t=>t.data.participants.some(p=>chosen.has(p.employeeId)&&(t.status==='draft'||!p.employee))))throw new HttpError(409,'Pegawai masih dipakai draf atau arsip tanpa salinan identitas. Periksa dokumen sebelum menghapus.');
 if(dryRun||!matches.length)return{count:matches.length,dryRun};
 if(!env.BUCKET)throw new HttpError(503,'Cadangan belum tersedia.');
 const backupKey='backups/dummy-employees/'+crypto.randomUUID()+'.json';
 await env.BUCKET.put(backupKey,JSON.stringify({createdAt:new Date().toISOString(),employees:matches}),{httpMetadata:{contentType:'application/json'}});
 const result=await db().prepare(`
  WITH targets AS (SELECT value AS id FROM json_each(?)), eligible AS (
   SELECT e.id FROM employees e JOIN targets t ON t.id=e.id
   WHERE e.employee_no GLOB 'DM[0-9][0-9][0-9]' AND e.id='dummy-employee-'||substr(e.employee_no,3) AND e.name LIKE 'Dummy %'
  )
  DELETE FROM employees WHERE id IN (SELECT id FROM eligible)
  AND (SELECT COUNT(*) FROM eligible)=(SELECT COUNT(*) FROM targets)
  AND NOT EXISTS (
   SELECT 1 FROM trips t,json_each(t.data,'$.participants') p JOIN targets x ON x.id=json_extract(p.value,'$.employeeId')
   WHERE t.status='draft' OR json_type(p.value,'$.employee') IS NOT 'object'
  )
 `).bind(JSON.stringify([...chosen])).run();
 if(result.meta.changes!==matches.length)throw new HttpError(409,'Data atau dokumen berubah. Penghapusan dibatalkan; muat ulang dan periksa kembali.');
 await log(actor,'employees.dummy_removed','employees',{count:result.meta.changes,backupKey});
 return{count:result.meta.changes,backupKey};
}
