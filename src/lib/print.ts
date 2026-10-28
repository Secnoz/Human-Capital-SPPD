import assets from '../data/print-templates.json';
import { dateLabel,terbilang,type TripRecord,type Settings } from './domain';

const templates=assets.templates as unknown as Record<string,Template>;
const styles=assets.styles as unknown as Record<string,Style>;
interface Box{x:number;y:number;width:number;height:number}
interface Style{font:{family:string;sizePt:number;bold:boolean;italic:boolean;underline:string|null;color:string};alignment:{horizontal:string;vertical:string;wrapText:boolean;indent:number};numberFormat:string}
interface Cell{address:string;style:string;pageBoxPt:Box;textBoxPt?:Box;mergeAnchor?:string;text?:string;binding?:string;format?:string;referenceBaselinesPt?:number[];referenceStaticLines?:{text:string;xPt:number;baselinePt:number;fontSizePt:number;words?:{text:string;xPt:number;baselinePt:number;fontSizePt:number}[]}[]}
interface Template{id:string;page:{widthPt:number;heightPt:number};fontPrintSizesPt:Record<string,number>;fontScaleFallback:number;representativeSuffix?:string;participantSequenceSuffix?:string;cells:Cell[];borderRectsPt:(Box&{color:string})[]}
export function templateIds(trip:TripRecord){const scenario=trip.data.scenario;return[scenario==='dalam_provinsi'?'sppd-dp':scenario==='luar_provinsi'?'sppd-lp':'sppd',scenario==='dalam_mobil_dinas'?'payment-md-general':`payment-${scenario==='dalam_provinsi'?'dp':'lp'}-${trip.data.purpose==='umum'?'general':'education'}`];}
export function printValues(trip:TripRecord,settings:Settings,t:Template){
 const d=trip.data,n=d.nights?String(d.nights):'-',nomor='Nomor: '+(trip.number||'— DRAF');
 return{document:{number:nomor,authorizingRole:d.commander||settings.commander,originName:d.origin,destinationName:d.destination,purpose:d.reason,paidDays:d.paidDays,nightsDisplay:n,departureDateText:dateLabel(d.departureDate),returnDateText:dateLabel(d.returnDate),transportLabel:d.transport,paymentRepresentative:(d.participants[0]?.employee?.name||'')+(t.representativeSuffix||''),paymentReference:nomor+', '+dateLabel(d.issueDate),itineraryText:`${d.destination} ${d.paidDays} Hari / ${n} Malam,${t.id==='payment-md-general'?' ':''}${dateLabel(d.departureDate)} - ${dateLabel(d.returnDate)}`,issuePlaceDateText:`${d.issueCity}, ${dateLabel(d.issueDate)}`,signatureName:d.signerName||settings.signerName,signatureRole:d.signerPosition||settings.signerPosition,total:trip.total,totalInWords:terbilang(trip.total)},participants:d.participants.map((p,i)=>({name:p.employee?.name||'',employeeNumber:p.employee?.employeeNo||'',accountNumber:p.employee?.bankAccount||'',creditName:p.employee?.creditName||'',position:p.employee?.position||'',unit:p.employee?.unit||'',sequence:String(i+1)+(t.participantSequenceSuffix||''),separator:'/',pocket:p.allowance||0,dailyTaxiTotal:p.cityTaxi||0,airportTaxiTotal:p.airport||0,intercityTotal:p.intercity||0,budgetCode:p.code||'',total:p.total||0}))};
}
function resolve(root:unknown,path:string):unknown{return path.split('.').reduce((p,k)=>p!=null?(p as Record<string,unknown>)[k]:undefined,root);}
const moneyNumber=(n:number,format:string)=>n===0&&format.includes('*')?'-':new Intl.NumberFormat('id-ID',{minimumFractionDigits:format.includes('0.00')||format.includes('0,00')?2:0,maximumFractionDigits:format.includes('0.00')||format.includes('0,00')?2:0}).format(n);
export async function renderDocument(trip:TripRecord,settings:Settings,id:string,scale=2.8){
 const template=templates[id];if(!template)throw new Error('Versi template dokumen tidak tersedia.');
 await document.fonts.ready;const canvas=document.createElement('canvas');canvas.width=Math.round(template.page.widthPt*scale);canvas.height=Math.round(template.page.heightPt*scale);const ctx=canvas.getContext('2d')!;ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,template.page.widthPt,template.page.heightPt);const values=printValues(trip,settings,template),issues:string[]=[];
 for(const r of template.borderRectsPt){ctx.fillStyle=r.color||'#000';ctx.fillRect(r.x,r.y,r.width,r.height);}
 for(const cell of template.cells){
  if(!cell.binding&&cell.text==null)continue;
  if(cell.mergeAnchor&&cell.mergeAnchor!==cell.address)continue;
  const s=styles[cell.style],fontSize=template.fontPrintSizesPt[String(s.font.sizePt)]||s.font.sizePt*template.fontScaleFallback;
  let value=cell.binding?resolve(values,cell.binding):cell.text;
  if(value==null||value==='')continue;if(!cell.binding&&value==='BANK KALSEL')value=trip.data.company||settings.company;
  const numeric=typeof value==='number',text=numeric&&cell.format==='money'?moneyNumber(value as number,s.numberFormat):String(value);
  ctx.fillStyle=s.font.color||'#000';ctx.font=`${s.font.italic?'italic ':''}${s.font.bold?'bold ':''}${fontSize}px "${s.font.family}", Arial, sans-serif`;ctx.textBaseline='alphabetic';ctx.textAlign='left';
  // Original PDF baselines/line positions retain Excel's static wrapping and justification.
  if(!cell.binding&&cell.referenceStaticLines?.length&&String(value)===cell.text){for(const line of cell.referenceStaticLines){for(const word of line.words?.length?line.words:[line]){ctx.fillText(word.text,word.xPt,word.baselinePt);if(s.font.underline){const width=ctx.measureText(word.text).width;ctx.fillRect(word.xPt,word.baselinePt+fontSize*.13,width,Math.max(.4,fontSize*.05));}}}continue;}
  // Legacy C25:E25 clips the itinerary even for ordinary dates. Continue into
  // the empty cells on the same line; keep all printed anchors and rules fixed.
  const original=cell.textBoxPt||cell.pageBoxPt;
  const box=cell.binding==='document.itineraryText'&&id!=='payment-md-general'?{...original,width:template.page.widthPt-50.8-original.x}:original,padding=1.5,width=box.width-2*padding,align=numeric&&s.numberFormat.includes('*')?'right':s.alignment.horizontal==='general'?(numeric?'right':'left'):s.alignment.horizontal;
  const words=text.split(/\s+/),lines:string[]=[];let current='';if(s.alignment.wrapText){for(const word of words){const next=current?current+' '+word:word;if(current&&ctx.measureText(next).width>width){lines.push(current);current=word;}else current=next;}if(current)lines.push(current);}else lines.push(text);
  const lineHeight=fontSize*1.2;const tooWide=lines.some(line=>ctx.measureText(line).width>width+.8),tooTall=lines.length*lineHeight>box.height+fontSize*.25;
  if(cell.binding&&(tooWide||tooTall))issues.push(`${cell.binding} tidak muat pada ${id} (${cell.address}).`);
  let baseline=cell.referenceBaselinesPt?.[0]??box.y+box.height-(box.height-fontSize)*.5-fontSize*.18;if(lines.length>1)baseline=s.alignment.vertical==='top'?box.y+fontSize:box.y+(box.height-lines.length*lineHeight)/2+fontSize;
  // Clip only preview; finalization rejects any overflowing dynamic text.
  ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.width,box.height);ctx.clip();
  lines.forEach((line,i)=>{const measured=ctx.measureText(line).width,x=align==='right'?box.x+box.width-padding-measured:align==='center'?box.x+(box.width-measured)/2:box.x+padding,y=baseline+i*lineHeight;ctx.fillText(line,x,y);if(s.font.underline)ctx.fillRect(x,y+fontSize*.13,measured,Math.max(.4,fontSize*.05));});ctx.restore();
 }
 if(trip.status!=='final'){ctx.save();ctx.translate(template.page.widthPt/2,template.page.heightPt/2);ctx.rotate(-Math.PI/7);ctx.font='bold 64px Arial';ctx.fillStyle=trip.status==='cancelled'?'rgba(180,35,35,.18)':'rgba(65,85,120,.13)';ctx.textAlign='center';ctx.fillText(trip.status==='cancelled'?'BATAL':'DRAF',0,0);ctx.restore();}
 return{canvas,widthPt:template.page.widthPt,heightPt:template.page.heightPt,issues};
}
function concat(parts:Uint8Array[]){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;}
// A4 PDF with high-resolution JPEG pages. Browser uses locally installed Office fonts.
export async function makePdf(pages:{canvas:HTMLCanvasElement;widthPt:number;heightPt:number}[]){
 const en=new TextEncoder(),parts:Uint8Array[]=[en.encode('%PDF-1.4\n%HC-SPPD\n')],offsets:number[]=[0];let position=parts[0].length;
 const obj=(id:number,content:Uint8Array|string)=>{offsets[id]=position;const data=typeof content==='string'?en.encode(content):content,p=concat([en.encode(`${id} 0 obj\n`),data,en.encode('\nendobj\n')]);parts.push(p);position+=p.length;};
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] /Count ${pages.length} >>`);
 for(let i=0;i<pages.length;i++){const p=pages[i],id=3+i*3,data=await new Promise<Blob>(r=>p.canvas.toBlob(b=>r(b!),'image/jpeg',.98)),jpg=new Uint8Array(await data.arrayBuffer()),commands=`q ${p.widthPt} 0 0 ${p.heightPt} 0 0 cm /Im0 Do Q`;
  obj(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.widthPt} ${p.heightPt}] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
  obj(id+1,concat([en.encode(`<< /Type /XObject /Subtype /Image /Width ${p.canvas.width} /Height ${p.canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`),jpg,en.encode('\nendstream')]));obj(id+2,`<< /Length ${en.encode(commands).length} >>\nstream\n${commands}\nendstream`);
 }
 const xref=position,n=3+pages.length*3;parts.push(en.encode(`xref\n0 ${n}\n0000000000 65535 f \n${offsets.slice(1).map(v=>String(v).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${n} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));return new Blob(parts as BlobPart[],{type:'application/pdf'});
}
