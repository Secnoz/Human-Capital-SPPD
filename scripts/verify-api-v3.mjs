// This test writes only to the disposable loopback database.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base='http://127.0.0.1:5173';let checks=0;
const password=(await fs.readFile('../outputs/Akun-Admin-SPPD.txt','utf8')).match(/Kata sandi awal: (.+)/)[1];
const signed=await fetch(base+'/api/auth/sign-in/email',{method:'POST',headers:{'content-type':'application/json',origin:base},body:JSON.stringify({email:'admin@sppd.test',password,rememberMe:false})});assert.equal(signed.status,200);
const cookie=signed.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
async function call(path,method='GET',body,status=200){const response=await fetch(base+'/api/'+path,{method,headers:{cookie,origin:base,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const json=await response.json();assert.equal(response.status,status,JSON.stringify(json));checks++;return json;}
const employee=await call('employees','POST',{employeeNo:'V3-'+Date.now(),name:'Pegawai Uji Revisi',position:'Pegawai Clerical (Pegawai/Capeg)',unit:'Unit Uji V3',criterion:8,creditName:'Pegawai Uji Revisi',bankAccount:'000000000123',active:1});
const trip=(scenario='dalam_provinsi')=>({costVersion:4,scenario,purpose:'umum',issueDate:'2026-11-02',issueCity:'Banjarmasin',originOfficeId:'unit-uji',origin:'Unit Uji V3',destination:'Banjarbaru',reason:'Uji revisi perhitungan',departureDate:'2026-11-02',returnDate:'2026-11-04',paidDays:3,nights:999,dayReason:'',transport:'Mobil',manualDistanceKm:200,region:'IV',distanceReason:'Sumber jarak pengujian sekali jalan',note:'CATATAN INTERNAL TIDAK DICETAK',note1:'Catatan operasional pada kedua lembar.',note2:'Biaya dibebankan ke unit asal.',participants:[{employeeId:employee.id,intercity:0,domesticTaxiEnabled:true,adjustmentReason:''}]});
await call('trips','POST',{data:{...trip(),costVersion:2}},409);
await call('trips','POST',{data:{...trip(),note1:'A'.repeat(301)}},400);
for(const adjustment of [{positionOverride:'Plt. Kepala Divisi',positionCriterionOverride:3},{positionOverride:'Pgs. Kepala Cabang'},{positionCriterionOverride:1}])await call('trips','POST',{data:{...trip(),participants:[{...trip().participants[0],...adjustment}]}},409);
const dp=await call('trips','POST',{data:trip()});assert.equal(dp.data.nights,2);assert.equal(dp.total,1600000);checks+=2;
const final=await call('trips/'+dp.id+'/finalize','POST',{revision:dp.revision});
const p=final.data.participants[0];assert.equal(p.cityTaxi,300000);assert.equal(p.intercity,400000);assert.equal(p.employee.position,employee.position);assert.equal(p.employee.criterion,8);assert.equal(p.employee.bankAccount,'000000000123');assert.equal(p.rate.criterion,8);assert.equal(final.data.note1,trip().note1);assert.equal(final.data.note2,trip().note2);assert.equal(final.data.templateVersion,'2026-11-04-v4');checks+=9;
const boot=await call('bootstrap');assert.equal(boot.employees.find(e=>e.id===employee.id).position,employee.position);assert.equal(boot.employees.find(e=>e.id===employee.id).criterion,8);checks+=2;
const lp=await call('trips','POST',{data:trip('luar_provinsi')});assert.equal(lp.total,2625000);checks++;
const longer=await call('trips/'+lp.id,'PATCH',{revision:lp.revision,data:{...trip('luar_provinsi'),returnDate:'2026-11-06'}});assert.equal(longer.data.nights,4);assert.equal(longer.total,3975000);checks+=2;
const wrongRegion=await call('trips','POST',{data:{...trip(),region:'I'}});await call('trips/'+wrongRegion.id+'/finalize','POST',{revision:wrongRegion.revision},400);
await call('trips/'+lp.id,'PATCH',{revision:longer.revision,data:{...trip('luar_provinsi'),participants:[{...trip().participants[0],positionOverride:'Plt. Kepala Divisi'}]}},409);
const unknown=await call('trips','POST',{data:{...trip(),manualDistanceKm:null,region:'',distanceReason:''}});await call('trips/'+unknown.id+'/finalize','POST',{revision:unknown.revision},400);
const explicitZero=await call('trips','POST',{data:{...trip(),manualDistanceKm:null,region:'',distanceReason:'',participants:[{...trip().participants[0],intercityOverride:0}]}});assert.equal(explicitZero.total,1200000);checks++;
const noTransport=await call('trips/'+explicitZero.id+'/finalize','POST',{revision:explicitZero.revision});assert.equal(noTransport.data.participants[0].intercity,0);checks++;
await call('employees/'+employee.id,'PATCH',{...employee,position:'Jabatan Master Baru',criterion:10});
const frozen=await call('trips/'+dp.id);assert.equal(frozen.total,1600000);assert.equal(frozen.data.participants[0].employee.position,employee.position);checks+=2;
const historic=boot.trips.find(t=>t.status==='final'&&t.data.participants.some(p=>p.positionOverride!=null));
if(historic){const unchanged=await call('trips/'+historic.id+'/finalize','POST',{revision:historic.revision});assert.equal(unchanged.total,historic.total);assert.deepEqual(unchanged.data,historic.data);checks+=2;}
await fs.writeFile('.sites-runtime/v3-preview-trip.json',JSON.stringify({id:dp.id,number:final.number}));
console.log(checks+' pemeriksaan API revisi v3 lulus: otomatis server, malam, transport, jabatan, catatan, validasi versi, dan snapshot final.');
