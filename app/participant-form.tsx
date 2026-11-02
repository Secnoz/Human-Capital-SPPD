'use client';
import {RotateCcw,X} from 'lucide-react';
import RupiahInput from '../components/rupiah-input';
import {money,type Participant,type Employee,type Scenario,type Purpose} from '../src/lib/domain';

function Amount({label,automatic,value,onChange,help}:{label:string;automatic:number;value?:number|null;onChange:(v:number|null)=>void;help:string}){
 return <label className="field amount-field"><span>{label}<em className={value!=null?'override-badge':'auto-badge'}>{value!=null?'Diubah HC':'Otomatis'}</em></span>
  <RupiahInput value={value??automatic} onValueChange={onChange}/><small>{help}</small>
  {value!=null&&<button type="button" className="text-button" onClick={()=>onChange(null)}><RotateCcw size={12}/>Gunakan nilai otomatis {money(automatic)}</button>}
 </label>;
}
export default function ParticipantForm({participant:p,computed:c,employee:e,index,scenario,purpose,paidDays,transportRegion,onChange,onRemove}:{participant:Participant;computed:Participant;employee?:Employee;index:number;scenario:Scenario;purpose:Purpose;paidDays:number;transportRegion?:string;onChange:(p:Partial<Participant>)=>void;onRemove:()=>void}){
 const automatic=c.automatic||{allowance:0,cityTaxi:0,airport:0,intercity:0},special=['65796','65800','65974'].includes(p.code||'');
 const title=e?.position??'';
 return <article className="participant">
  <div className="participant-heading"><span className="participant-number">{index+1}</span><div><b>{e?.name||'Pegawai tidak tersedia'}</b><small>{e?.employeeNo} · {title||'Jabatan belum diisi'} · Kriteria {Number.isFinite(c.employee?.criterion)?c.employee?.criterion:'—'}</small></div><button type="button" className="icon-button danger-text" aria-label={'Hapus peserta '+(e?.name||'')} onClick={onRemove}><X size={16}/></button></div>
  <div className="form-grid participant-fields">
   <label className="field wide"><span>Jabatan</span><input aria-label={'Jabatan peserta '+(index+1)} value={title} readOnly/><small>Jabatan dan kriteria tarif mengikuti master pegawai.</small></label>
   <Amount label="Uang saku (Rp/orang)" value={p.allowanceOverride} automatic={automatic.allowance} onChange={v=>onChange({allowanceOverride:v})} help={`Ketentuan ${money(c.rate?.daily||0)} × ${paidDays} hari dibayar. Total dapat diubah untuk SPPD ini.`}/>
   {scenario==='luar_provinsi'?<>
    <Amount label="Taksi bandara (Rp/orang)" value={p.airportOverride} automatic={automatic.airport} onChange={v=>onChange({airportOverride:v})} help="Total untuk perjalanan ini; dihitung satu kali."/>
    <Amount label="Taksi dalam kota (Rp/orang)" value={p.cityTaxiOverride} automatic={automatic.cityTaxi} onChange={v=>onChange({cityTaxiOverride:v})} help={`Ketentuan ${money(c.rate?.cityTaxi||0)} × ${paidDays} hari dibayar.`}/>
   </>:<>
    <label className="optional-toggle wide"><input type="checkbox" checked={!!p.domesticTaxiEnabled} onChange={event=>onChange({domesticTaxiEnabled:event.currentTarget.checked,cityTaxiOverride:null})}/><span>Gunakan taksi dalam kota <small>Opsional; tidak dicentang berarti Rp0</small></span></label>
    {p.domesticTaxiEnabled&&<Amount label="Taksi dalam kota (Rp/orang)" value={p.cityTaxiOverride} automatic={automatic.cityTaxi} onChange={v=>onChange({cityTaxiOverride:v})} help={`Ketentuan ${money(c.rate?.cityTaxi||0)} × ${paidDays} hari dibayar. Boleh diubah atau diisi 0.`}/>}
    <Amount label="Transport antar kota (Rp/orang)" value={p.intercityOverride} automatic={automatic.intercity||0} onChange={v=>onChange({intercityOverride:v})} help={transportRegion?`Otomatis wilayah ${transportRegion}: ${money(automatic.intercity||0)} sekali per orang, dari jarak rute/unit asal. Bisa disesuaikan HC.`:'Hitung jarak atau tetapkan wilayah agar nominal otomatis terisi. Jika tidak dibayar, isi 0 secara manual.'}/>
   </>}
   <label className="field"><span>Beban / kode pembebanan</span><select value={p.code||(purpose==='umum'?'60266':'60252')} onChange={event=>onChange({code:event.currentTarget.value})}><option value={purpose==='umum'?'60266':'60252'}>{purpose==='umum'?'60266 · Umum':'60252 · Pendidikan'}</option><option value="65796">65796 · Pengemudi</option><option value="65800">65800 · Outsource lain</option><option value="65974">65974 · Magang</option></select></label>
   <label className="field"><span>Dikreditkan kepada</span><input value={p.creditNameOverride??e?.creditName??''} onChange={event=>onChange({creditNameOverride:event.currentTarget.value})}/></label>
   <label className="field"><span>Nomor rekening</span><input inputMode="numeric" value={p.bankAccountOverride??e?.bankAccount??''} onChange={event=>onChange({bankAccountOverride:event.currentTarget.value})}/><small>Disimpan sebagai teks; nol awal dipertahankan.</small></label>
   {(p.creditNameOverride!=null||p.bankAccountOverride!=null)&&<div className="wide"><button type="button" className="text-button" onClick={()=>onChange({creditNameOverride:null,bankAccountOverride:null})}><RotateCcw size={12}/>Gunakan penerima dan rekening master</button></div>}
   <label className="field wide"><span>{special?'Dasar penggunaan kode khusus (wajib)':'Catatan penyesuaian HC (opsional)'}</span><input value={p.adjustmentReason} onChange={event=>onChange({adjustmentReason:event.currentTarget.value})}/></label>
  </div><div className="participant-total">Total peserta <b>{money(c.total||0)}</b></div>
 </article>;
}
