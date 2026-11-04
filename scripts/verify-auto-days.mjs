import {build} from 'esbuild';
import assert from 'node:assert/strict';
await build({entryPoints:['src/lib/domain.ts','src/lib/print.ts'],bundle:true,platform:'node',format:'esm',outdir:'.sites-runtime/auto-days'});
const {COST_VERSION,defaultTrip,patchTrip,normalizeDraft,calculate,travelDuration,seedTariffs}=await import('../.sites-runtime/auto-days/domain.js');
const {printValues}=await import('../.sites-runtime/auto-days/print.js');
let checks=0;const eq=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
for(const [start,end,days]of [['2026-11-04','2026-11-08',5],['2026-11-04','2026-11-04',1],['2026-12-31','2027-01-02',3],['2028-02-28','2028-03-01',3],['2026-02-28','2026-03-01',2],['2026-01-01','2027-01-01',366],['2026-11-04','2026-11-03',0],['2026-11-04','2026-11-02',0],['','2026-11-04',0],['2026-11-04','',0],['2026-02-30','2026-03-02',0]])eq(travelDuration(start,end),{paidDays:days,nights:Math.max(0,days-1)});
eq(defaultTrip().paidDays,0);eq(defaultTrip().nights,0);eq(calculate(defaultTrip(),[],[]).errors,[]);
const employee={id:'e1',employeeNo:'00001',name:'Pegawai Uji',position:'Staf',unit:'Unit Uji',criterion:8,creditName:'Pegawai Uji',bankAccount:'000001',active:1},tariffs=seedTariffs('2026-01-01');
const base={...defaultTrip('luar_provinsi'),origin:'Asal',destination:'Tujuan',reason:'Uji hari otomatis',issueDate:'2026-11-04',departureDate:'2026-11-04',returnDate:'2026-11-08',transport:'Pesawat',participants:[{employeeId:'e1',intercity:0,adjustmentReason:''}]};
let data=patchTrip(base,{});eq(data.paidDays,5);eq(data.nights,4);eq(data.dayReason,'');eq(calculate(data,[employee],tariffs,true).errors,[]);eq(calculate(data,[employee],tariffs).total,3975000);
const short=patchTrip(data,{returnDate:'2026-11-04'});eq(short.paidDays,1);eq(short.nights,0);eq(calculate(short,[employee],tariffs).total,1275000);
const cleared=patchTrip(data,{returnDate:''});eq(cleared.paidDays,0);eq(cleared.nights,0);eq(calculate(cleared,[employee],tariffs,true).errors.some(error=>error.includes('Tanggal perjalanan')),true);
const reversed=patchTrip(data,{returnDate:'2026-11-03'});eq(reversed.paidDays,0);eq(calculate(reversed,[employee],tariffs,true).errors.length>0,true);
const tooLong=patchTrip(data,{departureDate:'2026-01-01',returnDate:'2027-01-02'});eq(calculate(tooLong,[employee],tariffs,true).errors.some(error=>error.includes('1–366')),true);
eq(patchTrip(data,{paidDays:1,nights:99}).paidDays,5);eq(patchTrip(data,{paidDays:1,nights:99}).nights,4);
const forged={...data,paidDays:1,nights:0};eq(calculate(forged,[employee],tariffs).total,3975000);eq(calculate(forged,[employee],tariffs,true).errors.some(error=>error.includes('harus mengikuti tanggal')),true);
for(const scenario of ['dalam_provinsi','luar_provinsi'])for(let criterion=1;criterion<=10;criterion++){
 const input=patchTrip({...base,scenario,participants:[{...base.participants[0],domesticTaxiEnabled:true,intercityOverride:0}]},{}),result=calculate(input,[{...employee,criterion}],tariffs,true),rate=tariffs.find(rate=>rate.scenario===scenario&&rate.criterion===criterion);
 eq(result.errors,[]);eq(result.participants[0].allowance,rate.daily*5);eq(result.participants[0].cityTaxi,rate.cityTaxi*5);eq(result.participants[0].airport,scenario==='luar_provinsi'?rate.airport:0);
}
const overridden=patchTrip({...data,participants:[{...data.participants[0],allowanceOverride:123456,cityTaxiOverride:0,airportOverride:111}]},{returnDate:'2026-11-06'});eq(calculate(overridden,[employee],tariffs).total,123567);
const historic={...data,costVersion:3,paidDays:1,nights:0,dayReason:'Penetapan HC'};eq(calculate(historic,[employee],tariffs,true).total,1275000);eq(calculate(historic,[employee],tariffs,true).errors,[]);
const old={...historic,participants:[{...historic.participants[0],intercityOverride:0,domesticTaxiEnabled:true,allowanceOverride:123456,cityTaxiOverride:0,criterionOverride:7,bankAccountOverride:'000099'}]},original=structuredClone(old),opened=normalizeDraft(old);
eq(opened.costVersion,COST_VERSION);eq(opened.paidDays,5);eq(opened.nights,4);eq(opened.participants[0].allowanceOverride,123456);eq(opened.participants[0].cityTaxiOverride,0);eq(opened.participants[0].intercityOverride,0);eq(opened.participants[0].domesticTaxiEnabled,true);eq(opened.participants[0].criterionOverride,7);eq(opened.participants[0].bankAccountOverride,'000099');eq(old,original);
for(const version of [3,COST_VERSION]){const trip={number:'CONTOH',data:{...short,costVersion:version},total:0};eq(printValues(trip,{},{}).document.nightsDisplay,'0');}
const printTrip={number:'CONTOH',data, total:3975000};eq(printValues(printTrip,{},{}).document.paidDays,5);eq(printValues(printTrip,{},{}).document.nightsDisplay,'4');eq(printValues(printTrip,{},{}).document.itineraryText.includes('5 Hari / 4 Malam'),true);
console.log(`${checks} pemeriksaan hari otomatis lulus: kalender inklusif, biaya, validasi, migrasi draf, arsip, dan nilai cetak.`);
