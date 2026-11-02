'use client';
import {useEffect,useState,type InputHTMLAttributes} from 'react';
type Props=Omit<InputHTMLAttributes<HTMLInputElement>,'value'|'onChange'|'type'|'onFocus'|'onBlur'>&{value:number|null|undefined;onValueChange:(value:number|null)=>void;emptyValue?:number|null};
export default function NumberInput({value,onValueChange,emptyValue=0,...props}:Props){
 const[editing,setEditing]=useState(false),[raw,setRaw]=useState(value==null?'':String(value));
 useEffect(()=>{if(!editing)setRaw(value==null?'':String(value));},[value,editing]);
 return <input {...props} type="number" value={editing?raw:value??''} onFocus={()=>{setRaw(value==null?'':String(value));setEditing(true);}} onChange={e=>{const text=e.currentTarget.value;setRaw(text);if(text==='')onValueChange(emptyValue);else if(Number.isFinite(Number(text)))onValueChange(Number(text));}} onBlur={()=>setEditing(false)}/>;
}
