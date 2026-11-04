// This script writes preparation fixtures only to the disposable loopback database.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base='http://127.0.0.1:5173';let checks=0;
const password=(await fs.readFile('../outputs/Akun-Admin-SPPD.txt','utf8')).match(/Kata sandi awal: (.+)/)[1].trim();
async function login(email,password){const response=await fetch(base+'/api/auth/sign-in/email',{method:'POST',headers:{'content-type':'application/json',origin:base},body:JSON.stringify({email,password,rememberMe:false})});assert.equal(response.status,200);return response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');}
let cookie=await login('admin@sppd.test',password);
async function call(path,method='GET',body,status=200,session=cookie){const response=await fetch(base+'/api/'+path,{method,headers:{cookie:session,origin:base,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const json=await response.json();assert.equal(response.status,status,JSON.stringify(json));checks++;return json;}
const eq=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
await call('approval/preparation','GET',undefined,401,'');
const original=await call('approval/preparation');eq(original.enabled,false);eq(original.mode,'preparation');
for(const patch of [{enabled:true},{enabled:'true'},{mode:'active'},{checkerEmail:'unknown@sppd.test'},{checkerEmail:'admin@sppd.test',approverEmail:'admin@sppd.test'},{notes:'A'.repeat(1001)}])await call('approval/preparation','PATCH',{...original,...patch},400);
const staffEmail='approval-test-'+Date.now()+'@sppd.test',staffPassword=crypto.randomUUID()+'-Testing';
await call('members','POST',{email:staffEmail,name:'Penguji Persiapan Approval',role:'staff',active:1,password:staffPassword});
const staffCookie=await login(staffEmail,staffPassword);
await call('approval/preparation','GET',undefined,403,staffCookie);
await call('approval/preparation','PATCH',original,403,staffCookie);
const saved=await call('approval/preparation','PATCH',{...original,checkerEmail:'admin@sppd.test',approverEmail:staffEmail,notes:'Rancangan lokal untuk pemeriksaan.'});
eq(saved.enabled,false);eq(saved.revision,original.revision+1);eq(saved.checkerEmail,'admin@sppd.test');eq(saved.approverEmail,staffEmail);
await call('approval/preparation','PATCH',original,409);
const races=await Promise.all(['A','B'].map(notes=>fetch(base+'/api/approval/preparation',{method:'PATCH',headers:{cookie,origin:base,'content-type':'application/json'},body:JSON.stringify({...saved,notes})}).then(response=>response.status)));
eq(races.sort(),[200,409]);
for(const action of ['submit','check','approve','return','reject','revise'])for(const method of ['POST','PATCH','DELETE','GET'])await call('trips/test/'+action,method,method==='GET'?undefined:{},409);
await call('approval/activate','PATCH',{enabled:true},404);
const current=await call('approval/preparation');await call('approval/preparation','PATCH',{...original,revision:current.revision});
const restored=await call('approval/preparation');eq(restored.enabled,false);eq(restored.checkerEmail,original.checkerEmail);eq(restored.approverEmail,original.approverEmail);
const boot=await call('bootstrap');eq(boot.members.find(member=>member.email===staffEmail).role,'staff');eq(boot.audit.some(event=>event.action==='approval.preparation.saved'),true);
console.log(`${checks} pemeriksaan API persiapan approval lulus: admin, validasi, konflik versi, penyimpanan, audit, dan aktivasi tetap nonaktif.`);
