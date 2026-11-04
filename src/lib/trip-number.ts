export function formatTripNumber(pattern:string,year:string,sequence:number){return pattern.replaceAll('{year}',year).replace('{sequence}',String(sequence));}
export function numberSequence(number:string,pattern:string,year:string){
 const parts=pattern.replaceAll('{year}',year).split('{sequence}');
 if(parts.length!==2||!number.startsWith(parts[0])||!number.endsWith(parts[1]))return null;
 const digits=number.slice(parts[0].length,parts[1]?number.length-parts[1].length:undefined);
 if(!/^\d+$/.test(digits))return null;
 const sequence=Number(digits);return Number.isSafeInteger(sequence)&&sequence>0?sequence:null;
}
export function validTripNumber(value:unknown){return value==null||typeof value==='string'&&value.trim().length<=120&&!/[\u0000-\u001f\u007f]/.test(value);}
