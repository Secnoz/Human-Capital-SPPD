import {emptyApprovalPreparation,validateApprovalPreparation} from './approval';
import {db,one,rows,HttpError,log} from './server';

const KEY='approval_preparation_v1';
export async function approvalPreparation(){
 const row=await one<{value:string}>('SELECT value FROM settings WHERE key=?',KEY);
 return{...emptyApprovalPreparation(),...(row?JSON.parse(row.value):{}),enabled:false as const,mode:'preparation' as const};
}
export async function saveApprovalPreparation(raw:Record<string,unknown>,actorEmail:string){
 const active=await rows<{email:string}>('SELECT email FROM members WHERE active=1');
 const draft=validateApprovalPreparation(raw,active.map(member=>member.email.toLowerCase()));
 if(draft.errors.length)throw new HttpError(400,draft.errors.join('\n'));
 const previous=await approvalPreparation();
 if(previous.revision!==raw.revision)throw new HttpError(409,'Rancangan telah diubah petugas lain. Muat ulang pengaturan.');
 const next={...emptyApprovalPreparation(),checkerEmail:draft.checkerEmail,approverEmail:draft.approverEmail,notes:draft.notes,revision:previous.revision+1,updatedAt:new Date().toISOString(),updatedBy:actorEmail};
 const changed=await db().prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(json_extract(settings.value,'$.revision') AS INTEGER)=?").bind(KEY,JSON.stringify(next),previous.revision).run();
 if(!changed.meta.changes)throw new HttpError(409,'Rancangan telah diubah petugas lain. Muat ulang pengaturan.');
 await log(actorEmail,'approval.preparation.saved',KEY,{revision:next.revision,checkerEmail:next.checkerEmail,approverEmail:next.approverEmail,enabled:false});
 return next;
}
