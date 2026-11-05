interface Box{x:number;y:number;width:number;height:number}
interface Artwork{src:string;box:Box}
export interface SppdLetterhead{header:Artwork;footer:Artwork}

// Crops from the supplied blank letterhead, rendered at 2290 px paper width.
export function sppdLetterhead(id:string,page:{widthPt:number;heightPt:number}):SppdLetterhead|null{
 if(!id.startsWith('sppd'))return null;
 const scale=page.widthPt/2290,footerHeight=230*scale;
 return{
  header:{src:'/print/bank-kalsel-letterhead-20261105-header.jpg',box:{x:0,y:0,width:page.widthPt,height:500*scale}},
  footer:{src:'/print/bank-kalsel-letterhead-20261105-footer.jpg',box:{x:0,y:page.heightPt-footerHeight,width:page.widthPt,height:footerHeight}},
 };
}

const images=new Map<string,Promise<HTMLImageElement>>();
function loadArtwork(src:string){
 let image=images.get(src);
 if(!image){
  image=new Promise<HTMLImageElement>((resolve,reject)=>{
   const artwork=new Image();
   artwork.onload=()=>resolve(artwork);
   artwork.onerror=()=>{images.delete(src);reject(new Error('Kop surat SPPD belum dapat dimuat. Coba buka kembali pratinjau sebelum mencetak.'));};
   artwork.src=src;
  });
  images.set(src,image);
 }
 return image;
}
export async function drawSppdLetterhead(ctx:CanvasRenderingContext2D,letterhead:SppdLetterhead){
 const artwork=[letterhead.header,letterhead.footer];
 const loaded=await Promise.all(artwork.map(part=>loadArtwork(part.src)));
 artwork.forEach(({box},index)=>ctx.drawImage(loaded[index],box.x,box.y,box.width,box.height));
}
