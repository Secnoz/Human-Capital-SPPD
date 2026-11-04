'use client';
import {useId,useMemo,useRef,useState} from 'react';
import {ChevronDown,Search} from 'lucide-react';
import {searchEmployees,type SearchableEmployee} from '../src/lib/employee-search';

export default function ReportEmployeeFilter({people,value,onChange}:{people:SearchableEmployee[];value:string;onChange:(id:string)=>void}){
 const id=useId(),input=useRef<HTMLInputElement>(null);
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(0),[limit,setLimit]=useState(30);
 const matches=useMemo(()=>searchEmployees(people,query),[people,query]);
 const visible=matches.slice(0,limit),selected=people.find(p=>p.id===value);
 function choose(employeeId:string){onChange(employeeId);setOpen(false);setQuery('');setActive(0);setLimit(30);}
 function move(index:number){setActive(index);document.getElementById(`${id}-option-${index}`)?.scrollIntoView({block:'nearest'});}
 return <div className="report-person-filter" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();input.current?.focus();setOpen(false);}}}>
  <label className="picker-label" htmlFor={id}>Pegawai laporan</label>
  <div className="report-person-controls">
   <div className="report-person-input"><Search size={16} aria-hidden="true"/><input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-results`} aria-activedescendant={open?`${id}-option-${active}`:undefined} autoComplete="off" placeholder="Cari nama, NPP, jabatan, atau unit kerja" value={open?query:selected?`${selected.name} · ${selected.employeeNo}`:'Semua pegawai'} onClick={()=>{if(!open){setOpen(true);setQuery('');setActive(0);setLimit(30);}}} onFocus={()=>{setOpen(true);setQuery('');setActive(0);setLimit(30);}} onChange={event=>{setQuery(event.currentTarget.value);setOpen(true);setActive(0);setLimit(30);}} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(!open){setOpen(true);setQuery('');setActive(0);return;}move(Math.max(0,Math.min(visible.length,active+(event.key==='ArrowDown'?1:-1))));}else if(event.key==='Enter'&&open){event.preventDefault();choose(active===0?'':visible[active-1].id);}}}/><button type="button" className="icon-button" aria-label={open?'Tutup pilihan pegawai':'Buka pilihan pegawai'} onMouseDown={event=>event.preventDefault()} onClick={()=>{if(open)setOpen(false);else{input.current?.focus();setQuery('');setActive(0);setLimit(30);setOpen(true);}}}><ChevronDown size={16} aria-hidden="true"/></button></div>
   <button type="button" className="button secondary report-all-people" aria-pressed={!value} onClick={()=>choose('')}>Semua pegawai</button>
  </div>
  <p className="help">Laporan untuk {selected?`${selected.name} (${selected.employeeNo})`:'semua pegawai'}. Ketik lalu pilih hasil untuk mengganti pegawai.</p>
  {open&&<div className="employee-results report-person-results"><div className="picker-count" role="status">{matches.length} pegawai ditemukan</div><div id={`${id}-results`} role="listbox" aria-label="Hasil pencarian pegawai laporan"><button type="button" id={`${id}-option-0`} role="option" aria-selected={!value} className={`employee-option${active===0?' highlighted':''}`} onClick={()=>choose('')}><strong>Semua pegawai</strong><span>Tampilkan seluruh pegawai sesuai filter laporan.</span></button>{visible.map((person,index)=><button type="button" role="option" id={`${id}-option-${index+1}`} key={person.id} aria-selected={person.id===value} className={`employee-option${active===index+1?' highlighted':''}`} onClick={()=>choose(person.id)}><strong>{person.name}</strong><span>NPP {person.employeeNo||'tidak tersedia'}</span><small>{[person.position,person.unit].filter(Boolean).join(' · ')||'Pegawai arsip'}</small></button>)}</div>{!matches.length&&<p className="picker-empty">Pegawai tidak ditemukan. Coba nama, NPP, atau unit kerja lain.</p>}{matches.length>limit&&<button type="button" className="text-button picker-more" onClick={()=>setLimit(count=>count+30)}>Tampilkan lebih banyak ({matches.length-limit} lainnya)</button>}</div>}
 </div>;
}
