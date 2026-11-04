'use client';
import {useEffect,useId,useState} from 'react';
import {APPROVAL_STEPS,emptyApprovalPreparation,type ApprovalPreparation} from '../src/lib/approval';

export default function ApprovalPreparationPanel({members}:{members:{email:string;name:string;active:number}[]}){
 const id=useId(),[draft,setDraft]=useState<ApprovalPreparation>(emptyApprovalPreparation),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const candidates=members.filter(member=>member.active);
 async function load(){setLoading(true);setError('');try{const response=await fetch('/api/approval/preparation');const result=await response.json() as ApprovalPreparation&{error?:string};if(!response.ok)throw new Error(result.error||'Rancangan belum dapat dimuat.');setDraft(result);}catch(error){setError((error as Error).message);}finally{setLoading(false);}}
 useEffect(()=>{void load();},[]);
 function change(patch:Partial<ApprovalPreparation>){setDraft(current=>({...current,...patch}));setNotice('');setError('');}
 return <section className="panel form-panel approval-preparation" aria-labelledby={id+'-title'}>
  <div className="section-heading"><div><h2 id={id+'-title'}>Checker & persetujuan</h2><p>Rancangan alur pemeriksaan sebelum SPPD difinalkan.</p></div><span className="small-tag">Belum aktif</span></div>
  <div className="notice info"><span>Mode persiapan. Penyimpanan rancangan hanya mencatat calon petugas dan catatan alur. Proses SPPD saat ini tetap menggunakan finalisasi langsung.</span></div>
  <ol className="approval-flow">{APPROVAL_STEPS.map(step=><li key={step.id}><strong>{step.actor}</strong><span>{step.label}</span><p>{step.description}</p></li>)}</ol>
  {loading?<p role="status">Memuat rancangan…</p>:<form onSubmit={async event=>{event.preventDefault();setSaving(true);setError('');setNotice('');try{const response=await fetch('/api/approval/preparation',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(draft)});const result=await response.json() as ApprovalPreparation&{error?:string};if(!response.ok)throw new Error(result.error||'Rancangan belum dapat disimpan.');setDraft(result);setNotice('Rancangan tersimpan. Checker dan approval tetap belum aktif.');}catch(error){setError((error as Error).message);}finally{setSaving(false);}}}>
   <div className="form-grid">
    {(['checkerEmail','approverEmail'] as const).map(key=><label key={key} className="field"><span>{key==='checkerEmail'?'Calon checker':'Calon approver'}</span><select value={draft[key]} disabled={saving} onChange={event=>change({[key]:event.currentTarget.value})}><option value="">Belum ditentukan</option>{draft[key]&&!candidates.some(member=>member.email===draft[key])&&<option value={draft[key]} disabled>{draft[key]} · akun tidak aktif</option>}{candidates.map(member=><option key={member.email} value={member.email}>{member.name} · {member.email}</option>)}</select><small>Pilihan ini belum memberikan kewenangan persetujuan.</small></label>)}
    <label className="field wide"><span>Catatan rancangan alur</span><textarea rows={3} maxLength={1000} value={draft.notes} disabled={saving} placeholder="Contoh: siapa yang memeriksa, siapa yang menyetujui, dan ketentuan pengembalian untuk revisi." onChange={event=>change({notes:event.currentTarget.value})}/><small>Catatan pengaturan ini terpisah dari catatan pada kedua lembar cetak.</small></label>
   </div>
   <div className="approval-rules"><p><strong>Aturan awal yang disiapkan</strong></p><ul><li>Pembuat, checker, dan approver menggunakan akun berbeda.</li><li>Pengembalian dan penolakan menyertakan alasan.</li><li>Perubahan setelah diperiksa atau disetujui memerlukan pemeriksaan ulang.</li><li>Riwayat mencatat pelaku, waktu, tindakan, catatan, dan revisi dokumen.</li></ul></div>
   <div className="button-row"><button type="submit" className="button primary" disabled={saving||!!error}>{saving?'Menyimpan…':'Simpan rancangan'}</button>{error&&<button type="button" className="button secondary" onClick={()=>void load()}>Muat ulang rancangan</button>}</div>
   {draft.updatedAt&&<p className="help">Rancangan versi {draft.revision} · diperbarui {new Date(draft.updatedAt).toLocaleString('id-ID',{timeZone:'Asia/Makassar'})} oleh {draft.updatedBy}.</p>}
  </form>}
  {error&&<p className="notice error" role="alert">{error}</p>}{notice&&<p className="notice info" role="status">{notice}</p>}
 </section>;
}
