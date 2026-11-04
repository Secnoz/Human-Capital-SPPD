import {build} from 'esbuild';
import assert from 'node:assert/strict';
await build({entryPoints:['src/lib/employee-search.ts','src/lib/trip-number.ts','src/lib/domain.ts'],bundle:true,platform:'node',format:'esm',outdir:'.sites-runtime/creation'});
const {searchEmployees}=await import('../.sites-runtime/creation/employee-search.js');
const {formatTripNumber,numberSequence,validTripNumber}=await import('../.sites-runtime/creation/trip-number.js');
const {calculate,defaultTrip,seedTariffs,normalizeDraft}=await import('../.sites-runtime/creation/domain.js');
let checks=0;const eq=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
const base={id:'a',employeeNo:'00123',name:'M. Hasan Wijaya',position:'Analis Kredit',unit:'Cabang Banjarmasin',criterion:7,creditName:'M. Hasan Wijaya',bankAccount:'000123',active:1};
const employees=[base,{...base,id:'b',name:'Hasan Akbar',employeeNo:'10123',position:'Staf Operasional',unit:'Cabang Banjarbaru'},{...base,id:'c',name:'Hasan Unit 00123',employeeNo:'99123',position:'Staf',unit:'Cabang Banjarbaru'}];
for(const query of ['  HASAN   banjarmasin ','kredit wijaya','00123 wijaya','M.Hasan','cabang analis'])eq(searchEmployees(employees,query).map(e=>e.id),['a']);
eq(searchEmployees(employees,'00123')[0].id,'a');eq(searchEmployees(employees,'hasan').length,3);eq(searchEmployees(employees,'xyz'),[]);eq(searchEmployees(employees,'  '),employees);
const pattern='{sequence}/SPPD/Km-DHC/KP/{year}';
eq(formatTripNumber(pattern,'2026',25),'25/SPPD/Km-DHC/KP/2026');
for(const number of ['25/SPPD/Km-DHC/KP/2026','00025/SPPD/Km-DHC/KP/2026'])eq(numberSequence(number,pattern,'2026'),25);
for(const number of ['HC/25/2026','25/SPPD/Km-DHC/KP/2025','0/SPPD/Km-DHC/KP/2026'])eq(numberSequence(number,pattern,'2026'),null);
eq(numberSequence('HC-23','HC-{sequence}','2026'),23);
for(const number of [null,'',' HC-25/2026 '])eq(validTripNumber(number),true);
for(const number of ['NOMOR\nBARU','A'.repeat(121),123])eq(validTripNumber(number),false);
const tariffs=seedTariffs('2026-01-01');
for(const scenario of ['dalam_provinsi','luar_provinsi'])for(let criterion=1;criterion<=10;criterion++){
 const data={...defaultTrip(scenario),numberOverride:'TEST/2026',departureDate:'2026-11-02',returnDate:'2026-11-04',issueDate:'2026-11-02',origin:'Asal',destination:'Tujuan',reason:'Uji',transport:'Mobil',paidDays:3,nights:2,participants:[{employeeId:base.id,criterionOverride:criterion,intercity:0,intercityOverride:0,adjustmentReason:'',domesticTaxiEnabled:true}]};
 const result=calculate(data,employees,tariffs,true),rate=tariffs.find(t=>t.scenario===scenario&&t.criterion===criterion);
 eq(result.errors,[]);eq(result.participants[0].rate.criterion,criterion);eq(result.participants[0].employee.position,base.position);eq(result.participants[0].allowance,rate.daily*3);eq(result.participants[0].cityTaxi,rate.cityTaxi*3);eq(result.participants[0].airport,scenario==='luar_provinsi'?rate.airport:0);eq(base.criterion,7);
 eq(normalizeDraft(data).participants[0].criterionOverride,criterion);eq(normalizeDraft(data).numberOverride,'TEST/2026');
 const reset=calculate({...data,participants:[{...data.participants[0],criterionOverride:null}]},employees,tariffs,true);eq(reset.participants[0].rate.criterion,7);
}
for(const criterionOverride of [0,11,1.5,NaN]){
 const data={...defaultTrip('luar_provinsi'),participants:[{employeeId:base.id,intercity:0,adjustmentReason:'',criterionOverride}]};
 eq(calculate(data,employees,tariffs).errors.some(e=>e.includes('Kriteria biaya')),true);
}
console.log(`${checks} pemeriksaan pencarian, nomor SPPD, dan penggantian kriteria lulus.`);
