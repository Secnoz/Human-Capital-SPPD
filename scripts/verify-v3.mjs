import {build} from 'esbuild';
import assert from 'node:assert/strict';
await build({entryPoints:['src/lib/domain.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/v3-domain.mjs'});
await build({entryPoints:['src/lib/print.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/v3-print.mjs'});
const{calculate,defaultTrip,seedTariffs,nightsFromDays,patchTrip,intercityReference,normalizeDraft,positionCriterion,POSITION_CHOICES}=await import('../.sites-runtime/v3-domain.mjs?'+Date.now());
const{printedNotes,printNotesArea}=await import('../.sites-runtime/v3-print.mjs?'+Date.now());
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const employee={id:'e1',employeeNo:'DM001',name:'Pegawai Uji',position:'Pegawai Clerical (Pegawai/Capeg)',unit:'Unit Uji',criterion:8,creditName:'Pegawai Uji',bankAccount:'000000000001',active:1},tariffs=seedTariffs('2026-01-01');
const trip=(scenario='dalam_provinsi',days=3)=>({...defaultTrip(scenario),departureDate:'2026-11-02',returnDate:'2026-11-04',originOfficeId:'unit',origin:'Unit Uji',destination:'Tujuan Uji',reason:'Uji perhitungan',transport:'Mobil',paidDays:days,nights:nightsFromDays(days),dayReason:'Penetapan HC',manualDistanceKm:200,region:'IV',distanceReason:'Jarak uji sekali jalan',participants:[{employeeId:employee.id,intercity:0,adjustmentReason:''}]});
for(const scenario of ['dalam_provinsi','luar_provinsi'])for(let criterion=1;criterion<=10;criterion++)for(const days of [1,3,10]){
 const d=trip(scenario,days);d.participants[0].domesticTaxiEnabled=true;const result=calculate(d,[{...employee,criterion}],tariffs,true),rate=tariffs.find(t=>t.scenario===scenario&&t.criterion===criterion);
 eq(result.errors,[]);eq(result.participants[0].cityTaxi,rate.cityTaxi*days);eq(result.participants[0].airport,scenario==='luar_provinsi'?rate.airport:0);eq(result.participants[0].intercity,scenario==='dalam_provinsi'?400000:0);eq(result.total,rate.daily*days+rate.cityTaxi*days+(scenario==='luar_provinsi'?rate.airport:400000));
}
for(const [days,nights]of [[0,0],[1,0],[2,1],[3,2],[366,365]])eq(nightsFromDays(days),nights);
let d=trip('luar_provinsi');let r=calculate({...d,participants:[{...d.participants[0],positionOverride:'Plt. Kepala Divisi'}]},[employee],tariffs,true);eq(r.errors,[]);eq(r.total,4075000);eq(r.participants[0].employee.position,'Plt. Kepala Divisi');eq(r.participants[0].employee.criterion,3);eq(employee.criterion,8);
for(const position of POSITION_CHOICES.filter(p=>p.title!=='Jabatan Setara Lainnya'))for(const prefix of ['','Plt. ','Pgs. '])eq(positionCriterion(prefix+position.title),position.criterion);
eq(positionCriterion('Plt. Kepala Cabang Utama'),4);eq(positionCriterion('Pgs. Kepala Cabang Pembantu'),7);eq(positionCriterion('Plt. Kepala Divisi Human Capital'),3);eq(positionCriterion('Jabatan Setara Lainnya'),null);
let p={...d.participants[0],positionOverride:'Plt. Kepala Divisi',positionCriterionOverride:1};eq(calculate({...d,participants:[p]},[employee],tariffs,true).errors.some(e=>e.includes('tidak sesuai')),true);
p={...p,positionOverride:'Pgs. Jabatan Khusus Uji',positionCriterionOverride:null};eq(calculate({...d,participants:[p]},[employee],tariffs,true).errors.some(e=>e.includes('Kriteria')),true);
p.positionCriterionOverride=5;r=calculate({...d,participants:[p]},[employee],tariffs,true);eq(r.errors,[]);eq(r.participants[0].rate.daily,700000);
for(const[km,region,amount]of [[99.9999,'VI',300000],[100.0001,'V',350000],[150,'V',350000],[150.0001,'IV',400000],[250,'IV',400000],[250.0001,'III',500000],[300,'III',500000],[300.0001,'II',600000],[350,'II',600000],[350.0001,'I',700000]]){const next=patchTrip(trip(),{manualDistanceKm:km});eq(intercityReference(next),{region,amount});eq(calculate(next,[employee],tariffs,true).participants[0].intercity,amount);}
for(const[region,amount]of [['V',350000],['VI',300000]])eq(intercityReference({...trip(),manualDistanceKm:100,region}),{region,amount});
eq(intercityReference({...trip(),manualDistanceKm:100,region:''}),null);eq(calculate({...trip(),manualDistanceKm:100,region:''},[employee],tariffs,true).errors.some(e=>e.includes('jarak/wilayah')),true);
eq(calculate({...trip(),region:'I'},[employee],tariffs,true).errors.some(e=>e.includes('tidak sesuai jarak')),true);
d=trip();d.participants[0].intercityOverride=0;eq(calculate(d,[employee],tariffs,true).participants[0].intercity,0);d.participants[0].intercityOverride=null;eq(calculate(d,[employee],tariffs,true).participants[0].intercity,400000);
for(const patch of [{destination:'Tujuan baru'},{originOfficeId:'unit-baru'},{destinationLat:-3.4},{originLng:115}]){const changed=patchTrip(trip(),patch);eq(changed.manualDistanceKm,null);eq(changed.region,'');eq(changed.distanceReason,'');}
eq(patchTrip(trip(),{paidDays:5}).nights,4);eq(patchTrip(trip(),{note1:'Uji catatan'}).manualDistanceKm,200);
eq(printedNotes({note1:'Rapat koordinasi.',note2:'Biaya dibebankan pada unit asal.'}),[{label:'Catatan 1',text:'Rapat koordinasi.'},{label:'Catatan 2',text:'Biaya dibebankan pada unit asal.'}]);eq(printedNotes({note1:'',note2:'',note:'RAHASIA INTERNAL'}),[]);
for(const id of ['sppd-dp','sppd-lp','payment-dp-general','payment-dp-education','payment-lp-general','payment-lp-education']){const area=printNotesArea(id);eq(area.height>70,true);eq(area.width>300,true);}
const old={...trip(),costVersion:2,nights:0,note1:'Tetap tersimpan',participants:[{...trip().participants[0],intercity:500000,allowanceOverride:123456}]},converted=normalizeDraft(old);eq(converted.costVersion,3);eq(converted.nights,2);eq(converted.note1,'Tetap tersimpan');eq(converted.participants[0].intercityOverride,500000);eq(converted.participants[0].allowanceOverride,123456);
eq(normalizeDraft({...old,region:'I'}).region,'IV');eq(normalizeDraft({...old,manualDistanceKm:100,region:'VI'}).region,'VI');
console.log(checks+' pemeriksaan revisi v3 lulus: taksi harian, malam otomatis, wilayah/jarak, Plt/Pgs, override, catatan, dan migrasi draf.');
