'use client';
import {useMemo,useState,type ReactNode} from 'react';
import {Search,X} from 'lucide-react';
import type {Employee} from '../src/lib/domain';
import {searchEmployees} from '../src/lib/employee-search';

export default function EmployeeDirectory({employees,admin,onEdit,actions}:{employees:Employee[];admin:boolean;onEdit:(employee:Employee)=>void;actions:ReactNode}){
 const [query,setQuery]=useState(''),[page,setPage]=useState(0);
 const results=useMemo(()=>searchEmployees(employees,query),[employees,query]),pageCount=Math.max(1,Math.ceil(results.length/50)),current=Math.min(page,pageCount-1),start=current*50;
 return <section className="panel">
  <div className="toolbar employee-toolbar"><div className="search employee-search"><Search size={18} aria-hidden="true"/><input aria-label="Cari pegawai" placeholder="Nama, NPP, jabatan, atau unit kerja…" value={query} onChange={event=>{setQuery(event.currentTarget.value);setPage(0);}}/>{query&&<button type="button" className="icon-button" aria-label="Hapus pencarian pegawai" onClick={()=>{setQuery('');setPage(0);}}><X size={17}/></button>}</div>{actions}</div>
  <div className="directory-pagination"><p role="status">{results.length?`${start+1}–${Math.min(start+50,results.length)} dari ${results.length} pegawai`:'Tidak ada pegawai yang sesuai pencarian'}{query&&` · Total ${employees.length} pegawai`}</p><span>Cari beberapa kata sekaligus, misalnya nama dan unit.</span></div>
  {results.length?<div className="table-scroll"><table><thead><tr><th>Pegawai / NPP</th><th>Jabatan / unit</th><th>Kriteria</th><th>Rekening penerima</th><th>Status</th>{admin&&<th/>}</tr></thead><tbody>{results.slice(start,start+50).map(employee=><tr key={employee.id}><td><b>{employee.name}</b><small className="cell-sub">{employee.employeeNo}</small></td><td>{employee.position}<small className="cell-sub">{employee.unit}</small></td><td><span className="small-tag">{employee.criterion}</span></td><td className="mono">{employee.bankAccount}<small className="cell-sub">{employee.creditName}</small></td><td><span className={'status '+(employee.active?'final':'cancelled')}><i/>{employee.active?'Aktif':'Nonaktif'}</span></td>{admin&&<td><button className="text-button" onClick={()=>onEdit({...employee})}>Ubah</button></td>}</tr>)}</tbody></table></div>:<div className="picker-empty"><p>{employees.length?'Coba sebagian nama atau NPP, atau hapus beberapa kata pencarian.':'Tambahkan atau impor data pegawai terlebih dahulu.'}</p></div>}
  {pageCount>1&&<div className="directory-pagination"><p>Halaman {current+1} dari {pageCount}</p><div className="button-row"><button className="button secondary small" disabled={current===0} onClick={()=>setPage(current-1)}>Sebelumnya</button><button className="button secondary small" disabled={current===pageCount-1} onClick={()=>setPage(current+1)}>Berikutnya</button></div></div>}
 </section>;
}
