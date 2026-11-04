import {planApprovalTransition,type ApprovalEvent,type ApprovalReview} from './approval';
import {calculate,patchTrip,type Employee,type Tariff,type TripData,type TripRecord} from './domain';

export interface ApprovalChange{field:string;before:unknown;after:unknown}
export interface ApprovalRevisionEvent extends ApprovalEvent{changes?:ApprovalChange[]}
export interface ApprovalSubmission{sequence:number;tripRevision:number;submittedBy:string;submittedAt:string;comment:string;data:TripData;total:number}
export interface RevisionPreparation{document:TripRecord;review:ApprovalReview;submissions:ApprovalSubmission[];events:ApprovalRevisionEvent[]}

export function createRevisionPreparation(document:TripRecord,accounts:Pick<ApprovalReview,'makerEmail'|'checkerEmail'|'approverEmail'>):RevisionPreparation{
 if(document.status!=='draft')throw new Error('Persiapan revisi hanya untuk dokumen draf.');
 return{document:structuredClone(document),review:{...accounts,state:'draft',submittedRevision:null,checkedRevision:null,approvedRevision:null,returnedRevision:null,returnReason:''},submissions:[],events:[]};
}

const tripFields=['scenario','purpose','issueDate','issueCity','numberOverride','originOfficeId','originLat','originLng','origin','destination','destinationPlaceId','destinationLat','destinationLng','reason','departureDate','returnDate','paidDays','paidDaysOverride','nights','nightsOverride','dayReason','transport','note','note1','note2','manualDistanceKm','distanceReason','region'] as const;
const participantFields=['employeeId','code','adjustmentReason','criterionOverride','allowanceOverride','cityTaxiOverride','airportOverride','intercityOverride','domesticTaxiEnabled','creditNameOverride','bankAccountOverride'] as const;
export function approvalChanges(before:TripData,after:TripData){
 const changes:ApprovalChange[]=[];
 const add=(field:string,a:unknown,b:unknown)=>{if(JSON.stringify(a??null)!==JSON.stringify(b??null))changes.push({field,before:a??null,after:b??null});};
 for(const key of tripFields)add(key,before[key],after[key]);
 for(let index=0;index<Math.max(before.participants.length,after.participants.length);index++)for(const key of participantFields)add(`participants.${index}.${key}`,before.participants[index]?.[key],after.participants[index]?.[key]);
 return changes;
}

export function prepareSubmission(workflow:RevisionPreparation,action:'submit'|'resubmit',actor:string,comment:string,employees:Employee[],tariffs:Tariff[],at=new Date().toISOString()):RevisionPreparation{
 const next=structuredClone(workflow),trip=next.document;
 if(trip.status!=='draft')throw new Error('Dokumen yang sudah final tidak dapat diajukan ulang.');
 if(action==='resubmit'){
  const previous=next.submissions.at(-1);
  if(!previous||!approvalChanges(previous.data,trip.data).length)throw new Error('Belum ada perubahan isian sejak pengembalian. Simpan perbaikan terlebih dahulu.');
 }
 const result=calculate(trip.data,employees,tariffs,true);
 if(result.errors.length)throw new Error(result.errors.join('\n'));
 const planned=planApprovalTransition(next.review,action,actor,trip.revision,comment,at);
 trip.data={...trip.data,participants:result.participants};trip.total=result.total;trip.updatedAt=at;
 next.review=planned.review;next.events.push(planned.event);
 next.submissions.push({sequence:next.submissions.length+1,tripRevision:trip.revision,submittedBy:planned.event.actorEmail,submittedAt:at,comment:planned.event.comment,data:structuredClone(trip.data),total:trip.total});
 return next;
}

export function prepareRevision(workflow:RevisionPreparation,actor:string,patch:Partial<TripData>,employees:Employee[],tariffs:Tariff[],at=new Date().toISOString()):RevisionPreparation{
 const next=structuredClone(workflow),trip=next.document;
 if(trip.status!=='draft'||!['returned','revising'].includes(next.review.state))throw new Error('Perbaikan dibuka setelah dokumen dikembalikan ke pembuat.');
 const data=patchTrip(trip.data,structuredClone(patch)),changes=approvalChanges(trip.data,data);
 if(!changes.length)throw new Error('Belum ada perubahan isian untuk disimpan.');
 const revision=trip.revision+1,planned=planApprovalTransition(next.review,'revise',actor,revision,'Perbaikan draf disimpan.',at),result=calculate(data,employees,tariffs);
 next.document={...trip,data:{...data,participants:result.participants},total:result.total,revision,updatedAt:at};
 next.review=planned.review;next.events.push({...planned.event,changes});
 return next;
}

export function prepareReviewDecision(workflow:RevisionPreparation,action:'check'|'approve'|'return'|'reject',actor:string,comment='',at=new Date().toISOString()):RevisionPreparation{
 const next=structuredClone(workflow),submission=next.submissions.at(-1),trip=next.document;
 if(!submission||trip.status!=='draft'||submission.tripRevision!==trip.revision||JSON.stringify(submission.data)!==JSON.stringify(trip.data)||submission.total!==trip.total)throw new Error('Isian dokumen berbeda dari versi pengajuan. Periksa revisi yang diajukan.');
 const planned=planApprovalTransition(next.review,action,actor,trip.revision,comment,at);
 next.review=planned.review;next.events.push(planned.event);return next;
}
