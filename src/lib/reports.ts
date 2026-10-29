import {type TripRecord,type Participant} from './domain';
export type ReportFilter={employeeId:string;from:string;until:string;scenario:string;purpose:string;unit:string};
export function personReport(trips:TripRecord[],f:ReportFilter){
 const rows:{trip:TripRecord;p:Participant}[]=[];
 if(f.from&&f.until&&f.from>f.until)return{rows,summary:[],total:0,days:0,tripCount:0};
 for(const trip of trips){const d=trip.data;if(trip.status!=='final'||f.from&&d.departureDate<f.from||f.until&&d.departureDate>f.until||f.scenario!=='all'&&(f.scenario==='dalam_provinsi'?d.scenario==='luar_provinsi':d.scenario!==f.scenario)||f.purpose!=='all'&&d.purpose!==f.purpose)continue;for(const p of d.participants)if((!f.employeeId||p.employeeId===f.employeeId)&&(!f.unit||(p.employee?.unit||'').toLowerCase().includes(f.unit.toLowerCase())))rows.push({trip,p});}
 rows.sort((a,b)=>b.trip.data.departureDate.localeCompare(a.trip.data.departureDate)||(a.trip.number||'').localeCompare(b.trip.number||''));
 const people=new Map<string,{employeeId:string;name:string;employeeNo:string;tripIds:Set<string>;count:number;days:number;allowance:number;cityTaxi:number;airport:number;intercity:number;total:number}>();
 for(const {trip,p} of rows){let item=people.get(p.employeeId);if(!item){item={employeeId:p.employeeId,name:p.employee?.name||'Pegawai',employeeNo:p.employee?.employeeNo||'',tripIds:new Set(),count:0,days:0,allowance:0,cityTaxi:0,airport:0,intercity:0,total:0};people.set(p.employeeId,item);}if(!item.tripIds.has(trip.id)){item.tripIds.add(trip.id);item.count++;item.days+=trip.data.paidDays;}item.allowance+=p.allowance||0;item.cityTaxi+=p.cityTaxi||0;item.airport+=p.airport||0;item.intercity+=p.intercity||0;item.total+=p.total||0;}
 const summary=[...people.values()].sort((a,b)=>a.name.localeCompare(b.name));return{rows,summary,total:rows.reduce((sum,r)=>sum+(r.p.total||0),0),days:summary.reduce((sum,p)=>sum+p.days,0),tripCount:new Set(rows.map(r=>r.trip.id)).size};
}
