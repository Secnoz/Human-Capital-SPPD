// Checks loopback guards without creating accounts, assigning reviewers, or writing SPPDs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base='http://127.0.0.1:5173';let checks=0;
const password=(await fs.readFile('../outputs/Akun-Admin-SPPD.txt','utf8')).match(/Kata sandi awal: (.+)/)[1].trim();
const signed=await fetch(base+'/api/auth/sign-in/email',{method:'POST',headers:{'content-type':'application/json',origin:base},body:JSON.stringify({email:'admin@sppd.test',password,rememberMe:false})});assert.equal(signed.status,200);
const cookie=signed.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
async function call(path,method='GET',body,status=200){const response=await fetch(base+'/api/'+path,{method,headers:{cookie,origin:base,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const json=await response.json();assert.equal(response.status,status,JSON.stringify(json));checks++;return json;}
const before=await call('bootstrap'),configuration=await call('approval/preparation');assert.equal(configuration.enabled,false);checks++;
for(const action of ['submit','resubmit','check','approve','return','reject','revise'])for(const method of ['POST','PATCH','DELETE','GET'])await call('trips/simulasi-tertutup/'+action,method,method==='GET'?undefined:{},409);
await call('approval/preparation','PATCH',{...configuration,enabled:true},400);
const after=await call('bootstrap');assert.deepEqual(after.members,before.members);assert.deepEqual(after.trips,before.trips);assert.deepEqual(after.numberCounters,before.numberCounters);assert.deepEqual(await call('approval/preparation'),configuration);checks+=4;
console.log(`${checks} pemeriksaan API nonaktif lulus; akun, dokumen, nomor, dan penugasan tidak berubah.`);
