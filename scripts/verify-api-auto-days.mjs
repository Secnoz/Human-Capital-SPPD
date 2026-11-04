// Uses existing local employees and writes only synthetic SPPDs to the loopback database.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base='http://127.0.0.1:5173';let checks=0;
const password=(await fs.readFile('../outputs/Akun-Admin-SPPD.txt','utf8')).match(/Kata sandi awal: (.+)/)[1].trim();
const signed=await fetch(base+'/api/auth/sign-in/email',{method:'POST',headers:{'content-type':'application/json',origin:base},body:JSON.stringify({email:'admin@sppd.test',password,rememberMe:false})});assert.equal(signed.status,200);
const cookie=signed.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
async function call(path,method='GET',body,status=200){const response=await fetch(base+'/api/'+path,{method,headers:{cookie,origin:base,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const json=await response.json();assert.equal(response.status,status,JSON.stringify(json));checks++;return json;}
const eq=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
const before=await call('bootstrap'),employee=before.employees.find(employee=>employee.active&&employee.criterion===8)||before.employees.find(employee=>employee.active);assert.ok(employee);
const trip=(scenario='luar_provinsi')=>({costVersion:4,scenario,purpose:'umum',issueDate:'2026-11-04',issueCity:'Banjarmasin',originOfficeId:'unit-uji',origin:'Unit Uji',destination:'Tujuan Uji',reason:'Uji hari otomatis dari tanggal',departureDate:'2026-11-04',returnDate:'2026-11-08',paidDays:1,nights:99,dayReason:'Nilai manual harus diabaikan',transport:'Kendaraan Uji',participants:[{employeeId:employee.id,intercity:0,intercityOverride:0,domesticTaxiEnabled:true,adjustmentReason:''}]});
await call('trips','POST',{data:{...trip(),costVersion:3}},409);
for(const scenario of ['dalam_provinsi','luar_provinsi']){
 const rate=before.tariffs.find(rate=>rate.scenario===scenario&&rate.criterion===employee.criterion&&rate.validFrom<='2026-11-04'&&(!rate.validUntil||rate.validUntil>='2026-11-04'));assert.ok(rate);
 const draft=await call('trips','POST',{data:trip(scenario)});eq(draft.data.paidDays,5);eq(draft.data.nights,4);eq(draft.data.dayReason,'');eq(draft.total,rate.daily*5+rate.cityTaxi*5+(scenario==='luar_provinsi'?rate.airport:0));
 const changed=await call('trips/'+draft.id,'PATCH',{revision:draft.revision,data:{...trip(scenario),returnDate:'2026-11-04',paidDays:999}});eq(changed.data.paidDays,1);eq(changed.data.nights,0);eq(changed.total,rate.daily+rate.cityTaxi+(scenario==='luar_provinsi'?rate.airport:0));
 const restored=await call('trips/'+draft.id,'PATCH',{revision:changed.revision,data:trip(scenario)});const final=await call('trips/'+draft.id+'/finalize','POST',{revision:restored.revision});eq(final.data.paidDays,5);eq(final.data.nights,4);eq(final.data.costVersion,4);eq(final.total,restored.total);
 const repeat=await call('trips/'+draft.id+'/finalize','POST',{revision:restored.revision});eq(repeat.number,final.number);await call('trips/'+draft.id,'PATCH',{revision:final.revision,data:trip(scenario)},409);
}
for(const returnDate of ['', '2026-11-03','2027-11-08']){const draft=await call('trips','POST',{data:{...trip(),returnDate}});if(!returnDate||returnDate<'2026-11-04')eq(draft.data.paidDays,0);await call('trips/'+draft.id+'/finalize','POST',{revision:draft.revision},400);}
const manual=await call('trips','POST',{data:{...trip(),participants:[{...trip().participants[0],allowanceOverride:123456,cityTaxiOverride:0,airportOverride:111}]}});eq(manual.total,123567);eq(manual.data.paidDays,5);
const after=await call('bootstrap');eq(after.members,before.members);eq(after.employees,before.employees);
for(const historic of before.trips.filter(trip=>trip.status==='final')){const unchanged=after.trips.find(trip=>trip.id===historic.id);eq(unchanged,historic);}
eq((await call('approval/preparation')).enabled,false);
console.log(`${checks} pemeriksaan API hari otomatis lulus: server, biaya, cetakan tersimpan, validasi, arsip, dan akun tetap.`);
