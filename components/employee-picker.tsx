'use client';
import {useId,useMemo,useRef,useState} from 'react';
import {Search,X} from 'lucide-react';
import type {Employee} from '../src/lib/domain';
import {searchEmployees} from '../src/lib/employee-search';

export default function EmployeePicker({employees,selectedIds,limit=9,onSelect}:{employees:Employee[];selectedIds:string[];limit?:number;onSelect:(id:string)=>void}){
 const id=useId(),container=useRef<HTMLDivElement>(null),input=useRef<HTMLInputElement>(null);
 const [query,setQuery]=useState(''),[open,setOpen]=useState(false),[active,setActive]=useState(0),[shown,setShown]=useState(20);
 const available=useMemo(()=>employees.filter(e=>e.active&&!selectedIds.includes(e.id)),[employees,selectedIds]);
 const results=useMemo(()=>searchEmployees(available,query),[available,query]),visible=results.slice(0,shown),full=selectedIds.length>=limit;
 function choose(employee:Employee){onSelect(employee.id);setQuery('');setOpen(false);setActive(0);setShown(20);input.current?.focus();}
 return <div className="employee-picker" ref={container} onBlur={event=>{if(!container.current?.contains(event.relatedTarget as Node))setOpen(false);}}>
  <label className="picker-label" htmlFor={id}>Cari dan tambah peserta</label>
  <div className="search employee-search"><Search size={18} aria-hidden="true"/><input id={id} ref={input} role="combobox" autoComplete="off" aria-autocomplete="list" aria-expanded={open&&!full} aria-controls={id+'-results'} aria-activedescendant={open&&visible[active]?id+'-option-'+active:undefined} placeholder="Ketik nama, NPP, jabatan, atau unit kerja…" disabled={full} value={query} onFocus={()=>setOpen(true)} onClick={()=>setOpen(true)} onChange={event=>{setQuery(event.currentTarget.value);setOpen(true);setActive(0);setShown(20);}} onKeyDown={event=>{
   if(event.key==='Escape'){setOpen(false);return;}
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setOpen(true);setActive(index=>Math.max(0,Math.min(visible.length-1,index+(event.key==='ArrowDown'?1:-1))));}
   if(event.key==='Enter'&&open){event.preventDefault();if(visible[active])choose(visible[active]);}
  }}/>{query&&<button type="button" className="icon-button" aria-label="Hapus pencarian peserta" onClick={()=>{setQuery('');setActive(0);setShown(20);input.current?.focus();}}><X size={17}/></button>}</div>
  <p className="help">{full?`${limit} peserta sudah dipilih. Hapus peserta untuk menggantinya.`:'Cari dengan beberapa kata, misalnya nama dan unit kerja. Klik hasil atau gunakan tombol panah dan Enter.'}</p>
  {open&&!full&&<div className="employee-results">
   <p className="picker-count" role="status">{results.length} pegawai tersedia{query?' sesuai pencarian':''}</p>
   <div id={id+'-results'} role="listbox" aria-label="Hasil pencarian peserta">
    {visible.map((employee,index)=><button type="button" id={id+'-option-'+index} role="option" aria-selected={active===index} tabIndex={-1} className={'employee-option '+(active===index?'highlighted':'')} key={employee.id} onMouseDown={event=>event.preventDefault()} onMouseEnter={()=>setActive(index)} onClick={()=>choose(employee)} ref={element=>{if(element&&index===active&&open)element.scrollIntoView({block:'nearest'});}}>
     <strong>{employee.name}</strong><span>NPP {employee.employeeNo} · {employee.position}</span><small>{employee.unit} · Kriteria {employee.criterion}</small>
    </button>)}
   </div>
   {!results.length&&<p className="picker-empty">Pegawai tidak ditemukan. Coba sebagian nama, NPP, atau unit kerja. Peserta yang sudah dipilih tidak muncul lagi.</p>}
   {results.length>shown&&<button type="button" className="picker-more text-button" onClick={()=>setShown(count=>count+20)}>Tampilkan 20 hasil berikutnya ({visible.length} dari {results.length})</button>}
  </div>}
 </div>;
}
