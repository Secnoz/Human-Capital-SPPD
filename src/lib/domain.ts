import source from '../data/tariffs.json';
export type Scenario='dalam_mobil_dinas'|'dalam_provinsi'|'luar_provinsi';
export type Purpose='umum'|'pendidikan';
export type Status='draft'|'final'|'cancelled';
export interface Employee{id:string;employeeNo:string;name:string;position:string;unit:string;criterion:number;creditName:string;bankAccount:string;active:number}
export interface Office{id:string;name:string;address:string;lat?:string;lng?:string;placeId?:string}
export interface Tariff{id:string;scenario:Scenario;criterion:number;validFrom:string;validUntil:string|null;daily:number;cityTaxi:number;airport:number;note:string}
export interface Participant{employeeId:string;intercity:number;adjustmentReason:string;code?:string;employee?:Employee;rate?:Tariff;allowance?:number;cityTaxi?:number;airport?:number;total?:number;allowanceOverride?:number|null;cityTaxiOverride?:number|null;airportOverride?:number|null;intercityOverride?:number|null;positionOverride?:string|null;positionCriterionOverride?:number|null;criterionOverride?:number|null;domesticTaxiEnabled?:boolean;creditNameOverride?:string|null;bankAccountOverride?:string|null;automatic?:{allowance:number;cityTaxi:number;airport:number;intercity?:number}}
export interface TripData{paidDaysOverride?:number|null;numberOverride?:string|null;costVersion?:number;scenario:Scenario;purpose:Purpose;issueDate:string;issueCity:string;originOfficeId:string;originLat?:number;originLng?:number;origin:string;destination:string;destinationPlaceId?:string;destinationLat?:number;destinationLng?:number;reason:string;departureDate:string;returnDate:string;paidDays:number;nights:number;dayReason:string;transport:string;participants:Participant[];note:string;note1?:string;note2?:string;manualDistanceKm?:number|null;distanceReason?:string;region?:string;company?:string;signerName?:string;signerPosition?:string;commander?:string;templateVersion?:string;templateId?:string}
export interface TripRecord{id:string;number:string|null;status:Status;data:TripData;total:number;departureDate:string;createdAt:string;updatedAt:string;createdBy:string;revision:number;replaces:string|null;cancelReason:string|null}
export interface Settings{company:string;issueCity:string;signerName:string;signerPosition:string;commander:string;numberPattern:string;mapsKey:string;mapTileUrl?:string;mapRouteUrl?:string;mapSearchUrl?:string;validFrom:string;templateVersion:string}
export const SCENARIOS:Record<Scenario,{label:string;short:string;description:string}>={dalam_mobil_dinas:{label:'Dalam provinsi · Mobil dinas',short:'Mobil dinas',description:'Uang saku sesuai hari yang dibayar'},dalam_provinsi:{label:'Dalam provinsi',short:'Dalam provinsi',description:'Uang saku, taksi dalam kota, dan transport antar kota'},luar_provinsi:{label:'Luar provinsi',short:'Luar provinsi',description:'Uang saku, taksi bandara, dan taksi dalam kota'}};
export const ACTIVE_SCENARIOS={dalam_provinsi:SCENARIOS.dalam_provinsi,luar_provinsi:SCENARIOS.luar_provinsi};
export const GROUPS=source.scenarios.dalam_provinsi.tariff_groups.map(x=>({id:x.id,label:x.aliases.join(' / ')}));
export const money=(v:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(v);
export const number=(v:number)=>new Intl.NumberFormat('id-ID').format(v);
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Makassar',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function validDate(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
export function calendarDays(start:string,end:string){return validDate(start)&&validDate(end)?Math.round((Date.parse(end+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000)+1:0;}
export function travelDuration(start:string,end:string){const days=Math.max(0,calendarDays(start,end));return{paidDays:days,nights:nightsFromDays(days)};}
export function paidDuration(data:Pick<TripData,'departureDate'|'returnDate'|'paidDaysOverride'>){const paidDays=data.paidDaysOverride??travelDuration(data.departureDate,data.returnDate).paidDays;return{paidDays,nights:nightsFromDays(paidDays)};}
export function dateLabel(s:string){return validDate(s)?new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T00:00:00Z')):s;}
export function terbilang(n:number):string{if(!Number.isSafeInteger(n)||n<0||n>=1e12)throw new Error('Nominal terbilang di luar batas.');const a=['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas'];const s=(v:number):string=>v<12?a[v]:v<20?s(v-10)+' belas':v<100?s(Math.floor(v/10))+' puluh '+s(v%10):v<200?'seratus '+s(v-100):v<1000?s(Math.floor(v/100))+' ratus '+s(v%100):v<2000?'seribu '+s(v-1000):v<1e6?s(Math.floor(v/1000))+' ribu '+s(v%1000):v<1e9?s(Math.floor(v/1e6))+' juta '+s(v%1e6):s(Math.floor(v/1e9))+' miliar '+s(v%1e9);return(n===0?'nol':s(n)).replace(/\s+/g,' ').trim()+' rupiah';}
export function suggestRegion(m:number){if(!Number.isFinite(m)||m<=0)return null;if(m===100000)return{region:'Perlu penetapan HC',cap:null};if(m<=100000)return{region:'VI',cap:300000};if(m<=150000)return{region:'V',cap:350000};if(m<=250000)return{region:'IV',cap:400000};if(m<=300000)return{region:'III',cap:500000};if(m<=350000)return{region:'II',cap:600000};return{region:'I',cap:700000};}
export const COST_VERSION=4;
export const PRINT_NOTE_LIMIT=300;
export const hasPositionAdjustment=(d:Pick<TripData,'participants'>)=>d.participants.some(p=>p.positionOverride!=null||p.positionCriterionOverride!=null);
export function nightsFromDays(days:number){return Number.isInteger(days)&&days>0?days-1:0;}
export const REGION_AMOUNTS:Record<string,number>={I:700000,II:600000,III:500000,IV:400000,V:350000,VI:300000};
export function intercityReference(d:TripData){
 const byDistance=d.manualDistanceKm!=null?suggestRegion(d.manualDistanceKm*1000):null;
 if(byDistance?.cap!=null)return{region:byDistance.region,amount:byDistance.cap};
 const chosen=d.region||'';
 if(chosen in REGION_AMOUNTS&&(!byDistance||['V','VI'].includes(chosen)))return{region:chosen,amount:REGION_AMOUNTS[chosen]};
 return null;
}
export function patchTrip(d:TripData,p:Partial<TripData>):TripData{
 const next={...d,...p};
 const locationChanged=(['originOfficeId','originLat','originLng','destination','destinationLat','destinationLng'] as const).some(k=>Object.hasOwn(p,k)&&p[k]!==d[k]);
 if(locationChanged){next.manualDistanceKm=null;next.distanceReason='';next.region='';}
 if(Object.hasOwn(p,'manualDistanceKm')&&!locationChanged){const ref=next.manualDistanceKm!=null?suggestRegion(next.manualDistanceKm*1000):null;next.region=ref?.cap!=null?ref.region:p.region||'';}
 next.costVersion=COST_VERSION;Object.assign(next,paidDuration(next));next.dayReason='';return next;
}
export function defaultTrip(scenario:Scenario='dalam_provinsi'):TripData{return{costVersion:COST_VERSION,paidDaysOverride:null,scenario,purpose:'umum',issueDate:today(),issueCity:'Banjarmasin',originOfficeId:'',origin:'',destination:'',reason:'',departureDate:'',returnDate:'',paidDays:0,nights:0,dayReason:'',transport:scenario==='dalam_mobil_dinas'?'Mobil Dinas':scenario==='luar_provinsi'?'Pesawat Terbang dan Taksi':'',participants:[],note:'',note1:'',note2:''};}
export function calculateLegacy(d:TripData,employees:Employee[],tariffs:Tariff[],strict=false){
 const errors:string[]=[],unique=new Set<string>();
 if(!(d.scenario in SCENARIOS))errors.push('Jenis perjalanan tidak valid.');if(!['umum','pendidikan'].includes(d.purpose))errors.push('Pembebanan tidak valid.');if(d.scenario==='dalam_mobil_dinas'&&d.purpose==='pendidikan')errors.push('Template Pendidikan dengan mobil dinas belum ditetapkan.');
 if(!Number.isInteger(d.paidDays)||d.paidDays<1||d.paidDays>366)errors.push('Hari dibayar harus 1–366 hari.');if(!Number.isInteger(d.nights)||d.nights<0||d.nights>366)errors.push('Jumlah malam tidak valid.');
 const days=calendarDays(d.departureDate,d.returnDate);
 if(strict){for(const[label,v]of Object.entries({'Tempat asal':d.origin,'Tujuan':d.destination,'Keperluan':d.reason,'Alat angkutan':d.transport,'Tempat penerbitan':d.issueCity}))if(!v?.trim())errors.push(`${label} wajib diisi.`);if(!validDate(d.issueDate))errors.push('Tanggal surat tidak valid.');if(!days||days<1)errors.push('Tanggal perjalanan tidak valid.');if(days>0&&d.paidDays!==days&&!d.dayReason?.trim())errors.push('Isi alasan perbedaan hari dibayar dengan durasi kalender.');if(d.manualDistanceKm!=null&&(!d.distanceReason?.trim()||!Number.isFinite(d.manualDistanceKm)||d.manualDistanceKm<=0))errors.push('Jarak manual harus positif dan memiliki sumber/alasan.');if(!d.participants.length)errors.push('Pilih sedikitnya satu peserta.');}
 const max=d.scenario==='dalam_mobil_dinas'?8:9;if(d.participants.length>max)errors.push(`Template ini maksimal ${max} peserta.`);
 const participants=d.participants.map(p=>{
  const employee=employees.find(e=>e.id===p.employeeId);if(unique.has(p.employeeId))errors.push('Peserta tidak boleh dipilih dua kali.');unique.add(p.employeeId);
  if(!employee||!employee.active){errors.push('Peserta tidak ditemukan atau nonaktif.');return{...p,total:0};}
  if(!Number.isInteger(employee.criterion)||employee.criterion<1||employee.criterion>10)errors.push(`Kriteria ${employee.name} tidak valid.`);
  if(strict&&(!employee.employeeNo||!employee.name||!employee.position||!employee.unit||!employee.bankAccount||!employee.creditName))errors.push(`Lengkapi identitas dan rekening ${employee.name}.`);
  const rates=tariffs.filter(t=>t.scenario===d.scenario&&t.criterion===employee.criterion&&t.validFrom<=d.departureDate&&(!t.validUntil||t.validUntil>=d.departureDate));
  if(rates.length!==1){errors.push(`Tarif ${employee.name} ${rates.length?'bertumpang tindih':'belum tersedia untuk tanggal berangkat'}.`);return{...p,employee,total:0};}
  const rate=rates[0];if([rate.daily,rate.cityTaxi,rate.airport].some(x=>!Number.isSafeInteger(x)||x<0))errors.push('Tarif harus berupa Rupiah bulat positif.');const intercity=d.scenario==='dalam_provinsi'?p.intercity:0;if(!Number.isSafeInteger(intercity)||intercity<0||intercity>1e10)errors.push(`Transport antar kota ${employee.name} tidak valid.`);
  const allowance=rate.daily*d.paidDays,cityTaxi=d.scenario==='dalam_mobil_dinas'?0:rate.cityTaxi*d.paidDays,airport=d.scenario==='luar_provinsi'?rate.airport:0,code=p.code||(d.purpose==='pendidikan'?'60252':'60266');
  if(!['60252','60266','65796','65800','65974'].includes(code))errors.push('Kode pembebanan tidak valid.');if(['60252','60266'].includes(code)&&code!==(d.purpose==='pendidikan'?'60252':'60266'))errors.push('Kode pembebanan tidak sesuai jenis anggaran.');if(['65796','65800','65974'].includes(code)&&!p.adjustmentReason?.trim())errors.push(`Isi dasar pemakaian kode khusus ${employee.name}.`);
  return{...p,intercity,code,employee:{...employee},rate:{...rate},allowance,cityTaxi,airport,total:allowance+cityTaxi+airport+intercity};
 });
 const total=participants.reduce((a,p)=>a+(p.total||0),0);if(!Number.isSafeInteger(total)||total>=1e12)errors.push('Total di luar batas nominal aplikasi.');return{participants,total,calendarDays:days,errors:[...new Set(errors)]};
}
export function seedTariffs(validFrom:string,includeLegacy=false):Tariff[]{return Object.entries(source.scenarios).filter(([scenario])=>includeLegacy||scenario!=='dalam_mobil_dinas').flatMap(([scenario,s])=>s.tariff_groups.map(g=>({id:crypto.randomUUID(),scenario:scenario as Scenario,criterion:g.id,validFrom,validUntil:null,daily:g.daily_allowance,cityTaxi:g.city_taxi_daily,airport:g.airport_taxi_once||0,note:`Sumber: ${s.source_file}; ${g.source_range}`})));}

export function normalizeDraft(data:TripData):TripData{
 const modern=(data.costVersion||0)>=3,legacy=data.costVersion!==2&&!modern;
 const byDistance=data.manualDistanceKm!=null?suggestRegion(data.manualDistanceKm*1000):null;
 return{...data,costVersion:COST_VERSION,...paidDuration(data),paidDaysOverride:data.paidDaysOverride??null,dayReason:'',region:byDistance?.cap!=null?byDistance.region:data.region,note1:data.note1||'',note2:data.note2||'',scenario:data.scenario==='dalam_mobil_dinas'?'dalam_provinsi':data.scenario,participants:data.participants.map(p=>({employeeId:p.employeeId,intercity:0,intercityOverride:modern?p.intercityOverride:p.intercity||null,code:p.code,adjustmentReason:p.adjustmentReason||'',domesticTaxiEnabled:legacy?false:!!p.domesticTaxiEnabled,allowanceOverride:legacy?null:p.allowanceOverride,cityTaxiOverride:legacy?null:p.cityTaxiOverride,airportOverride:legacy?null:p.airportOverride,criterionOverride:p.criterionOverride??null,creditNameOverride:p.creditNameOverride,bankAccountOverride:p.bankAccountOverride}))};
}

// Version 2 uses editable per-person totals. The legacy calculator is retained
// solely for historical template fixtures, never for newly finalized records.
export function calculateV2(d:TripData,employees:Employee[],tariffs:Tariff[],strict=false){
 const effective=employees.map(e=>{const p=d.participants.find(p=>p.employeeId===e.id);return{...e,creditName:p?.creditNameOverride??e.creditName,bankAccount:p?.bankAccountOverride??e.bankAccount};});
 const base=calculateLegacy(d,effective,tariffs,strict),errors=base.errors.filter(message=>message!=='Total di luar batas nominal aplikasi.');
 if(!Object.hasOwn(ACTIVE_SCENARIOS,d.scenario))errors.push('Pilih jenis perjalanan dalam atau luar provinsi.');
 if(strict&&d.costVersion!==2)errors.push('Draf memakai aturan lama. Buka, periksa biaya, lalu simpan kembali sebelum finalisasi.');
 const participants=base.participants.map(p=>{
  const automatic={allowance:(p.rate?.daily||0)*d.paidDays,cityTaxi:d.scenario==='luar_provinsi'?(p.rate?.cityTaxi||0):p.domesticTaxiEnabled?(p.rate?.cityTaxi||0)*d.paidDays:0,airport:d.scenario==='luar_provinsi'?(p.rate?.airport||0):0};
  const allowance=p.allowanceOverride??automatic.allowance,cityTaxi=d.scenario==='dalam_provinsi'&&!p.domesticTaxiEnabled?0:p.cityTaxiOverride??automatic.cityTaxi,airport=d.scenario==='luar_provinsi'?(p.airportOverride??automatic.airport):0,intercity=d.scenario==='dalam_provinsi'?p.intercity:0;
  for(const [label,value] of Object.entries({['Uang saku']:allowance,['Taksi dalam kota']:cityTaxi,['Taksi bandara']:airport,['Transport antar kota']:intercity}))if(!Number.isSafeInteger(value)||value<0||value>1e10)errors.push(`${label} harus berupa Rupiah bulat 0–10 miliar.`);
  if(p.employee&&p.employee.bankAccount&&!/^\d+$/.test(p.employee.bankAccount))errors.push(`Rekening ${p.employee.name} harus berupa teks angka tanpa pemisah.`);
  return{...p,automatic,allowance,cityTaxi,airport,intercity,total:allowance+cityTaxi+airport+intercity};
 });
 const total=participants.reduce((sum,p)=>sum+p.total,0);if(!Number.isSafeInteger(total)||total<0||total>=1e12)errors.push('Total di luar batas nominal aplikasi.');
 return{participants,total,calendarDays:base.calendarDays,errors:[...new Set(errors)]};
}

export function calculateV3(d:TripData,employees:Employee[],tariffs:Tariff[],strict=false){
 if(d.costVersion!==3)return calculateV2(d,employees,tariffs,strict);
 const errors:string[]=[];
 if(strict&&hasPositionAdjustment(d))errors.push('Penyesuaian jabatan belum digunakan. Buka dan simpan ulang draf untuk mengikuti master pegawai.');
 const effective=employees.map(e=>{const p=d.participants.find(p=>p.employeeId===e.id);if(!p)return{...e};
  if(p.criterionOverride!=null&&(!Number.isInteger(p.criterionOverride)||p.criterionOverride<1||p.criterionOverride>10))errors.push('Kriteria biaya peserta harus angka 1–10.');
  return{...e,criterion:p.criterionOverride??e.criterion,creditName:p.creditNameOverride??e.creditName,bankAccount:p.bankAccountOverride??e.bankAccount};
 });
 const ref=intercityReference(d);
 const prepared={...d,nights:nightsFromDays(d.paidDays),participants:d.participants.map(p=>({...p,intercity:d.scenario==='dalam_provinsi'?(p.intercityOverride??ref?.amount??0):0}))};
 const base=calculateLegacy(prepared,effective,tariffs,strict);errors.push(...base.errors.filter(message=>message!=='Total di luar batas nominal aplikasi.'));
 if(!Object.hasOwn(ACTIVE_SCENARIOS,d.scenario))errors.push('Pilih jenis perjalanan dalam atau luar provinsi.');
 if(strict&&d.nights!==prepared.nights)errors.push('Jumlah malam harus sama dengan hari dibayar dikurangi satu.');
 for(const [label,note] of Object.entries({'Catatan 1':d.note1,'Catatan 2':d.note2}))if(note!=null&&(typeof note!=='string'||note.length>PRINT_NOTE_LIMIT))errors.push(`${label} maksimal ${PRINT_NOTE_LIMIT} karakter.`);
 if(d.region&&!Object.hasOwn(REGION_AMOUNTS,d.region))errors.push('Wilayah transport tidak valid.');
 const byDistance=d.manualDistanceKm!=null?suggestRegion(d.manualDistanceKm*1000):null;
 if(d.scenario==='dalam_provinsi'&&d.region&&byDistance?.cap!=null&&d.region!==byDistance.region)errors.push('Wilayah transport tidak sesuai jarak sekali jalan.');
 if(d.scenario==='dalam_provinsi'&&d.region&&byDistance?.cap===null&&!['V','VI'].includes(d.region))errors.push('Pada batas tepat 100 km, pilih wilayah V atau VI sesuai penetapan HC.');
 if(strict&&d.scenario==='dalam_provinsi'&&ref&&!d.distanceReason?.trim())errors.push('Isi sumber atau alasan penetapan jarak/wilayah transport.');
 const participants=base.participants.map(p=>{
  const automatic={allowance:(p.rate?.daily||0)*d.paidDays,cityTaxi:(d.scenario==='luar_provinsi'||p.domesticTaxiEnabled)?(p.rate?.cityTaxi||0)*d.paidDays:0,airport:d.scenario==='luar_provinsi'?(p.rate?.airport||0):0,intercity:d.scenario==='dalam_provinsi'?(ref?.amount??0):0};
  const allowance=p.allowanceOverride??automatic.allowance,cityTaxi=d.scenario==='dalam_provinsi'&&!p.domesticTaxiEnabled?0:p.cityTaxiOverride??automatic.cityTaxi,airport=d.scenario==='luar_provinsi'?(p.airportOverride??automatic.airport):0,intercity=d.scenario==='dalam_provinsi'?(p.intercityOverride??automatic.intercity):0;
  if(strict&&d.scenario==='dalam_provinsi'&&p.intercityOverride==null&&!ref)errors.push('Lengkapi jarak/wilayah atau isi transport antar kota manual (0 bila tidak dibayar).');
  for(const value of [allowance,cityTaxi,airport,intercity])if(!Number.isSafeInteger(value)||value<0||value>1e10)errors.push('Biaya harus berupa Rupiah bulat 0–10 miliar.');
  if(p.employee&&p.employee.bankAccount&&!/^\d+$/.test(p.employee.bankAccount))errors.push(`Rekening ${p.employee.name} harus berupa teks angka tanpa pemisah.`);
  return{...p,automatic,allowance,cityTaxi,airport,intercity,total:allowance+cityTaxi+airport+intercity};
 });
 const total=participants.reduce((sum,p)=>sum+p.total,0);if(!Number.isSafeInteger(total)||total<0||total>=1e12)errors.push('Total di luar batas nominal aplikasi.');
 return{participants,total,calendarDays:base.calendarDays,errors:[...new Set(errors)]};
}

// Historical calculators retain the paid-day rules stored with older documents.
export function calculate(d:TripData,employees:Employee[],tariffs:Tariff[],strict=false){
 if(d.costVersion!==COST_VERSION)return calculateV3(d,employees,tariffs,strict);
 const duration=paidDuration(d),prepared={...d,...duration,dayReason:'',costVersion:3};
 const result=calculateV3(prepared,employees,tariffs,strict);
 const errors=result.errors.filter(message=>message!=='Isi alasan perbedaan hari dibayar dengan durasi kalender.'&&(strict||d.departureDate&&d.returnDate||message!=='Hari dibayar harus 1–366 hari.'));
 if(strict&&(d.paidDays!==duration.paidDays||d.nights!==duration.nights))errors.push(`Jumlah hari dan malam harus mengikuti ${d.paidDaysOverride!=null?'hari dibayar manual':'tanggal perjalanan'}. Muat ulang dan simpan draf kembali.`);
 return{...result,errors:[...new Set(errors)]};
}
