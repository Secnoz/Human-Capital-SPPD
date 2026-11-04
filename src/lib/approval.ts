export const APPROVAL_ENABLED=false;
export const APPROVAL_POSITIONS={checker:'Kepala Bagian Kompensasi dan Manfaat',approver:'Kepala Divisi Human Capital'} as const;
export const APPROVAL_STEPS=[
 {id:'draft',label:'Draf',actor:'Pembuat',description:'Menyiapkan perjalanan, peserta, biaya, dan dua lembar cetak.'},
 {id:'pending_check',label:'Pemeriksaan',actor:'Checker',description:`${APPROVAL_POSITIONS.checker} memeriksa identitas, rekening, tarif, pembebanan, dan rincian perjalanan.`},
 {id:'pending_approval',label:'Persetujuan',actor:'Approver',description:`${APPROVAL_POSITIONS.approver} meninjau hasil pemeriksaan untuk menyetujui atau mengembalikan dokumen.`},
 {id:'approved',label:'Siap finalisasi',actor:'Pembuat',description:'Menerbitkan dokumen sesuai revisi yang telah disetujui.'},
] as const;
export type ApprovalState='draft'|'pending_check'|'pending_approval'|'approved'|'returned'|'revising'|'rejected'|'final';
export type ApprovalAction='submit'|'resubmit'|'check'|'approve'|'return'|'reject'|'revise'|'finalize';
export const APPROVAL_STATE_LABELS:Record<ApprovalState,string>={draft:'Draf',pending_check:'Menunggu checker',pending_approval:'Menunggu approver',approved:'Disetujui',returned:'Perlu revisi',revising:'Sedang diperbaiki',rejected:'Ditolak',final:'Final'};
export const REVISION_STEPS=['Menunggu checker','Perlu revisi','Diperbaiki pembuat','Diajukan ulang','Menunggu checker'] as const;
export interface ApprovalPreparation{enabled:false;mode:'preparation';revision:number;checkerPosition:string;approverPosition:string;checkerEmail:string;approverEmail:string;notes:string;updatedAt:string|null;updatedBy:string|null}
export const emptyApprovalPreparation=():ApprovalPreparation=>({enabled:false,mode:'preparation',revision:0,checkerPosition:APPROVAL_POSITIONS.checker,approverPosition:APPROVAL_POSITIONS.approver,checkerEmail:'',approverEmail:'',notes:'',updatedAt:null,updatedBy:null});

export function validateApprovalPreparation(raw:Record<string,unknown>,activeEmails:string[]){
 const errors:string[]=[];
 if(raw.enabled!=null&&raw.enabled!==false||raw.mode!=null&&raw.mode!=='preparation')errors.push('Checker dan approval masih tahap persiapan; aktivasi belum tersedia.');
 if(raw.checkerPosition!=null&&raw.checkerPosition!==APPROVAL_POSITIONS.checker||raw.approverPosition!=null&&raw.approverPosition!==APPROVAL_POSITIONS.approver)errors.push('Jabatan checker dan approver mengikuti rancangan yang telah ditetapkan.');
 const email=(key:string)=>{if(raw[key]!=null&&typeof raw[key]!=='string'){errors.push('Pilih akun HC yang valid.');return'';}return String(raw[key]||'').trim().toLowerCase();};
 const checkerEmail=email('checkerEmail'),approverEmail=email('approverEmail');
 for(const address of [checkerEmail,approverEmail])if(address&&!activeEmails.includes(address))errors.push('Calon checker dan approver harus merupakan akun HC aktif.');
 if(checkerEmail&&checkerEmail===approverEmail)errors.push('Calon checker dan approver harus berbeda.');
 const notes=typeof raw.notes==='string'?raw.notes.trim():'';
 if(raw.notes!=null&&typeof raw.notes!=='string'||notes.length>1000)errors.push('Catatan rancangan maksimal 1.000 karakter.');
 if(!Number.isSafeInteger(raw.revision)||Number(raw.revision)<0)errors.push('Versi rancangan tidak valid. Muat ulang pengaturan.');
 return{checkerEmail,approverEmail,notes,errors:[...new Set(errors)]};
}

export interface ApprovalReview{state:ApprovalState;makerEmail:string;checkerEmail:string;approverEmail:string;submittedRevision:number|null;checkedRevision:number|null;approvedRevision:number|null;returnedRevision?:number|null;returnReason?:string}
export interface ApprovalEvent{action:ApprovalAction;actorEmail:string;from:ApprovalState;to:ApprovalState;tripRevision:number;comment:string;at:string}

// This policy model is for preparation tests. Live mutations remain disabled.
export function planApprovalTransition(review:ApprovalReview,action:ApprovalAction,actorEmail:string,tripRevision:number,comment='',at=new Date().toISOString()):{review:ApprovalReview;event:ApprovalEvent}{
 const actor=actorEmail.trim().toLowerCase(),note=comment.trim();
 if(!review.makerEmail||!review.checkerEmail||!review.approverEmail||new Set([review.makerEmail,review.checkerEmail,review.approverEmail].map(email=>email.toLowerCase())).size!==3)throw new Error('Pembuat, checker, dan approver harus akun yang berbeda.');
 if(!Number.isSafeInteger(tripRevision)||tripRevision<1)throw new Error('Revisi dokumen tidak valid.');
 if(note.length>1000)throw new Error('Catatan tindakan maksimal 1.000 karakter.');
 const next={...review};
 const is=(email:string)=>actor===email.toLowerCase();
 const current=()=>{if(review.submittedRevision!==tripRevision)throw new Error('Dokumen berubah setelah diajukan. Ajukan ulang revisi terbaru.');};
 switch(action){
  case 'submit':
   if(!is(review.makerEmail)||review.state!=='draft')throw new Error('Hanya pembuat dapat mengajukan draf awal. Gunakan pengajuan ulang untuk perbaikan.');
   next.state='pending_check';next.submittedRevision=tripRevision;next.checkedRevision=null;next.approvedRevision=null;break;
  case 'resubmit':
   if(!is(review.makerEmail)||!['returned','revising'].includes(review.state))throw new Error('Hanya pembuat dapat mengajukan ulang dokumen yang dikembalikan.');
   if(review.returnedRevision==null||tripRevision<=review.returnedRevision)throw new Error('Simpan perbaikan pada revisi baru sebelum mengajukan ulang.');
   if(!note)throw new Error('Isi catatan perbaikan sebelum mengajukan ulang.');
   next.state='pending_check';next.submittedRevision=tripRevision;next.checkedRevision=null;next.approvedRevision=null;next.returnedRevision=null;next.returnReason='';break;
  case 'check':
   if(!is(review.checkerEmail)||review.state!=='pending_check')throw new Error('Dokumen belum menunggu pemeriksaan oleh checker ini.');
   current();next.state='pending_approval';next.checkedRevision=tripRevision;break;
  case 'approve':
   if(!is(review.approverEmail)||review.state!=='pending_approval')throw new Error('Dokumen belum menunggu persetujuan oleh approver ini.');
   current();if(review.checkedRevision!==tripRevision)throw new Error('Revisi ini belum diperiksa.');next.state='approved';next.approvedRevision=tripRevision;break;
  case 'return':case 'reject':
   if(!(review.state==='pending_check'&&is(review.checkerEmail)||review.state==='pending_approval'&&is(review.approverEmail)))throw new Error('Tindakan hanya tersedia bagi pemeriksa pada tahap ini.');
   current();if(!note)throw new Error('Isi alasan pengembalian atau penolakan.');next.state=action==='return'?'returned':'rejected';next.checkedRevision=null;next.approvedRevision=null;if(action==='return'){next.returnedRevision=tripRevision;next.returnReason=note;}break;
  case 'revise':
   if(!is(review.makerEmail)||!['draft','returned','revising','approved'].includes(review.state))throw new Error('Kembalikan dokumen ke pembuat sebelum mengubah isian.');
   if(review.returnedRevision!=null&&tripRevision<=review.returnedRevision)throw new Error('Perbaikan harus menggunakan revisi dokumen yang baru.');
   next.state=['returned','revising'].includes(review.state)?'revising':'draft';next.submittedRevision=null;next.checkedRevision=null;next.approvedRevision=null;break;
  case 'finalize':
   if(!is(review.makerEmail)||review.state!=='approved')throw new Error('Finalisasi memerlukan persetujuan atas revisi ini.');
   current();if(review.checkedRevision!==tripRevision||review.approvedRevision!==tripRevision)throw new Error('Persetujuan tidak berlaku untuk revisi ini.');next.state='final';break;
  default:throw new Error('Tindakan persetujuan tidak dikenal.');
 }
 return{review:next,event:{action,actorEmail:actor,from:review.state,to:next.state,tripRevision,comment:note,at}};
}
