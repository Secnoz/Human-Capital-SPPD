// Run only against the disposable local development database. Never a hosted URL.
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173/api/';let checks=0;
async function call(p,m='GET',body,expected=200,auth=true){const r=await fetch(base+p,{method:m,headers:{...(auth?{cookie:'__sites_local_auth=1'}:{}),...(m==='GET'?{}:{'content-type':'application/json',origin:'http://127.0.0.1:5173'})},body:body===undefined?undefined:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,expected,JSON.stringify(d));checks++;return d;}
await call('bootstrap','GET',undefined,401,false);const b=await call('bootstrap');assert.ok(b.settings,'Complete the local setup form first.');
const tag=Date.now().toString();const e=await call('employees','POST',{employeeNo:'U'+tag.slice(-4),name:'Pegawai Uji',position:'Jabatan Uji',unit:'Unit Uji',criterion:3,creditName:'Pegawai Uji',bankAccount:'00123456789',active:1});
const o=await call('offices','POST',{name:'Unit Uji',address:'Banjarmasin, Kalimantan Selatan'});
const trip=scenario=>({scenario,purpose:'umum',issueDate:'2026-10-23',issueCity:'Banjarmasin',originOfficeId:o.id,origin:'Unit Uji',destination:'Banjarbaru',reason:'Pengujian sistem',departureDate:'2026-10-24',returnDate:'2026-10-26',paidDays:3,nights:2,dayReason:'',transport:'Mobil',participants:[{employeeId:e.id,intercity:500000,adjustmentReason:''}],note:'DATA UJI LOKAL'});
const created=[];for(const scenario of ['dalam_mobil_dinas','dalam_provinsi','luar_provinsi'])created.push(await call('trips','POST',{data:trip(scenario)}));
assert.deepEqual(created.map(t=>t.total),[1500000,2300000,4075000]);checks++;
const d=created[0];const finals=await Promise.all([call(`trips/${d.id}/finalize`,'POST',{revision:d.revision}),call(`trips/${d.id}/finalize`,'POST',{revision:d.revision})]);assert.equal(finals[0].number,finals[1].number);checks++;assert.equal(finals[0].status,'final');checks++;
await call('trips/'+d.id,'PATCH',{data:trip('dalam_mobil_dinas'),revision:d.revision},409);
await call('employees/'+e.id,'PATCH',{...e,name:'Pegawai Uji Diubah',bankAccount:'00999999'});const locked=await call('trips/'+d.id);assert.equal(locked.data.participants[0].employee.bankAccount,'00123456789');checks++;
await call(`trips/${d.id}/cancel`,'POST',{reason:'Pengujian pembatalan lokal'});await call('trips/'+d.id,'DELETE',undefined,409);
const next=await call(`trips/${created[1].id}/finalize`,'POST',{revision:created[1].revision});assert.equal(Number(next.number.split('/')[0]),Number(finals[0].number.split('/')[0])+1);checks++;
await call('trips/'+created[2].id,'PATCH',{data:trip('luar_provinsi'),revision:0},409);
const after=await call('bootstrap');assert.ok(after.trips.some(t=>t.id===d.id&&t.status==='cancelled'));checks++;
console.log(`${checks} pemeriksaan API lulus: autentikasi, penyimpanan tiga jenis, finalisasi bersamaan idempoten, nomor urut, penguncian, pembatalan, konflik revisi.`);
