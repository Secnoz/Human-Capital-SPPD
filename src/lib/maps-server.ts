import {env} from 'cloudflare:workers';
import {db,settings,HttpError} from './server';
export const MAP_DEFAULTS={mapTileUrl:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',mapRouteUrl:'https://router.project-osrm.org',mapSearchUrl:'https://photon.komoot.io'};
export function providerUrl(input:unknown,fallback:string){
 const raw=typeof input==='string'&&input.trim()?input.trim():fallback;
 let url:URL;try{url=new URL(raw);}catch{throw new HttpError(400,'URL layanan peta tidak valid.');}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.port||!url.hostname.includes('.')||/^[\d.]+$/.test(url.hostname)||url.hostname.includes(':')||/(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(url.hostname))throw new HttpError(400,'Layanan peta harus memakai alamat HTTPS publik tanpa kredensial atau query.');
 return raw.replace(/\/$/,'');
}
export function coordinatePair(value:string|null):[number,number]{const parts=(value||'').split(',').map(Number);if(parts.length!==2||parts.some(x=>!Number.isFinite(x))||Math.abs(parts[0])>180||Math.abs(parts[1])>90||!value?.includes(',')||value.split(',').some(v=>!v.trim()))throw new HttpError(400,'Koordinat peta tidak valid.');return parts as[number,number];}
async function cached(key:string,fetcher:()=>Promise<unknown>){
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)))).map(v=>v.toString(16).padStart(2,'0')).join(''),r2Key='maps/'+hash+'.json';
 if(env.BUCKET){const hit=await env.BUCKET.get(r2Key);if(hit){const item=await hit.json<{expires:number;data:unknown}>();if(item.expires>Date.now())return item.data;}}
 const now=Date.now(),slot=await db().prepare("INSERT INTO settings(key,value) VALUES('__map_request_after',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(settings.value AS INTEGER)<=?").bind(String(now+1100),now).run();if(!slot.meta.changes)throw new HttpError(429,'Tunggu sesaat sebelum meminta lokasi/rute berikutnya.');
 const data=await fetcher();if(env.BUCKET)await env.BUCKET.put(r2Key,JSON.stringify({expires:Date.now()+6*3600000,data}),{httpMetadata:{contentType:'application/json'}});return data;
}
async function remoteJson(url:URL){let res:Response;try{res=await fetch(url,{headers:{'User-Agent':'SPPD-HC/2.0 (+https://sppd-human-capital-kalsel.sunsetape16.chatgpt.site)'},signal:AbortSignal.timeout(12000),redirect:'manual'});}catch(error){console.warn('Map provider request failed',url.hostname,(error as Error).message);throw new HttpError(502,'Layanan peta tidak merespons. Coba lagi atau pilih titik/isi jarak manual.');}if(!res.ok)throw new HttpError(502,'Layanan peta sedang tidak tersedia. Coba lagi atau gunakan cara manual.');return await res.json() as any;}
export async function mapRequest(action:string,url:URL){const s=await settings();
 if(action==='search'){
  const q=(url.searchParams.get('q')||'').trim();if(q.length<3||q.length>160)throw new HttpError(400,'Ketik nama/alamat tempat 3–160 karakter.');
  const endpoint=new URL(providerUrl(s?.mapSearchUrl,MAP_DEFAULTS.mapSearchUrl)+'/api/');endpoint.searchParams.set('q',q);endpoint.searchParams.set('limit','6');endpoint.searchParams.set('bbox','95,-11,141,6');
  return cached(endpoint.href,async()=>{const body=await remoteJson(endpoint);return{places:(Array.isArray(body.features)?body.features:[]).slice(0,6).flatMap((f:any)=>{const c=f.geometry?.coordinates,p=f.properties||{};if(!Array.isArray(c)||c.length<2||!Number.isFinite(c[0])||!Number.isFinite(c[1])||Math.abs(c[0])>180||Math.abs(c[1])>90)return[];return[{name:[...new Set([p.name,p.street,p.district,p.city,p.state,p.country].filter(v=>typeof v==='string'&&v))].join(', ').slice(0,300),lng:c[0],lat:c[1]}];}),source:'Photon / © OpenStreetMap contributors'};});
 }
 if(action==='route'){
  const from=coordinatePair(url.searchParams.get('from')),to=coordinatePair(url.searchParams.get('to'));const path=[from,to].map(c=>c.map(v=>v.toFixed(6)).join(',')).join(';'),endpoint=new URL(providerUrl(s?.mapRouteUrl,MAP_DEFAULTS.mapRouteUrl)+'/route/v1/driving/'+path);endpoint.searchParams.set('overview','simplified');endpoint.searchParams.set('geometries','geojson');endpoint.searchParams.set('steps','false');
  return cached(endpoint.href,async()=>{const body=await remoteJson(endpoint),r=body.routes?.[0];if(body.code!=='Ok'||!r||!Number.isFinite(r.distance)||r.distance<=0||!Number.isFinite(r.duration)||r.geometry?.type!=='LineString'||!Array.isArray(r.geometry.coordinates)||r.geometry.coordinates.length>20000||r.geometry.coordinates.some((c:any)=>!Array.isArray(c)||!Number.isFinite(c[0])||!Number.isFinite(c[1])))throw new HttpError(422,'Rute jalan tidak ditemukan. Periksa kedua titik atau tetapkan jarak manual.');return{meters:r.distance,seconds:r.duration,path:r.geometry.coordinates,source:'OSRM / © OpenStreetMap contributors'};});
 }
 throw new HttpError(404,'Layanan peta tidak ditemukan.');
}
