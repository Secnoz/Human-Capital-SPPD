import type {Employee} from './domain';

export function normalizeSearch(value:string){
 return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('id-ID').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
export function searchEmployees(employees:Employee[],query:string){
 const normalized=normalizeSearch(query),terms=normalized.split(' ').filter(Boolean);
 if(!terms.length)return employees;
 return employees.map(employee=>{
  const name=normalizeSearch(employee.name),npp=normalizeSearch(employee.employeeNo);
  const text=normalizeSearch([employee.name,employee.employeeNo,employee.position,employee.unit].join(' '));
  const score=npp===normalized?0:name===normalized?1:name.startsWith(normalized)?2:npp.startsWith(normalized)?3:4;
  return{employee,match:terms.every(term=>text.includes(term)),score};
 }).filter(result=>result.match).sort((a,b)=>a.score-b.score||a.employee.name.localeCompare(b.employee.name,'id')||a.employee.employeeNo.localeCompare(b.employee.employeeNo)).map(result=>result.employee);
}
