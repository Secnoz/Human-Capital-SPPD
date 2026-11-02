'use client';
import {useLayoutEffect,useRef,useState,type InputHTMLAttributes} from 'react';

type Props=Omit<InputHTMLAttributes<HTMLInputElement>,'value'|'onChange'|'type'|'inputMode'|'onFocus'|'onBlur'>&{value:number;onValueChange:(value:number)=>void};
const format=(value:number)=>new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(value);

function parse(text:string){
 const cleaned=text.trim().replace(/^Rp\.?\s*/i,'');
 if(!cleaned)return null;
 if(!/^[\d.\s]+(?:,0{1,2})?$/.test(cleaned))return undefined;
 const digits=cleaned.replace(/,0{1,2}$/,'').replace(/[.\s]/g,'');
 if(!digits)return undefined;
 const value=Number(digits);
 return Number.isSafeInteger(value)?value:undefined;
}

function caretPosition(text:string,digits:number){
 if(!digits)return 0;
 let seen=0;
 for(let i=0;i<text.length;i++)if(/\d/.test(text[i])&&++seen===digits)return i+1;
 return text.length;
}

export default function RupiahInput({value,onValueChange,...props}:Props){
 const input=useRef<HTMLInputElement>(null),[draft,setDraft]=useState<{text:string;caret?:number}|null>(null);
 useLayoutEffect(()=>{if(draft?.caret!=null)input.current?.setSelectionRange(draft.caret,draft.caret);},[draft]);
 function update(text:string,caret:number){
  const parsed=parse(text);
  if(parsed===undefined)return;
  const beforeCaret=text.slice(0,caret).replace(/,0{1,2}$/,'');
  const formatted=parsed==null?'':format(parsed);
  setDraft({text:formatted,caret:caretPosition(formatted,(beforeCaret.match(/\d/g)||[]).length)});
  onValueChange(parsed??0);
 }
 return <span className="rupiah-input"><span className="rupiah-prefix" aria-hidden="true">Rp</span><input {...props} ref={input} type="text" inputMode="numeric" maxLength={25} value={draft?.text??format(value)} onFocus={()=>setDraft({text:format(value)})} onChange={event=>update(event.currentTarget.value,event.currentTarget.selectionStart??event.currentTarget.value.length)} onKeyDown={event=>{
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  const {value:text,selectionStart:start,selectionEnd:end}=event.currentTarget;
  if(start==null||start!==end)return;
  if(event.key==='Backspace'&&text[start-1]==='.'){
   event.preventDefault();update(text.slice(0,start-2)+text.slice(start),start-2);
  }else if(event.key==='Delete'&&text[start]==='.'){
   event.preventDefault();update(text.slice(0,start)+text.slice(start+2),start);
  }
 }} onBlur={()=>setDraft(null)}/></span>;
}
