import {backgroundMediaType} from './background-media.js'

export const PARTICLE_IMAGE_LIMIT=10*1024*1024
const sizesOK=(w,h)=>w>0&&h>0&&w<=4096&&h<=4096

// Decode once and store a bounded, static PNG. No original-image layer is
// displayed, and no file content or local path enters shared preferences.
export async function inspectParticleImage(file,doc,win){
  if(!file?.size||file.size>PARTICLE_IMAGE_LIMIT)throw Error('请选择不超过 10 MB 的 PNG、JPG 或 WebP 图片')
  const bytes=new Uint8Array(await file.slice(0,32).arrayBuffer()),type=backgroundMediaType(bytes)
  if(!['image/png','image/jpeg','image/webp'].includes(type))throw Error('支持 PNG、JPG 和 WebP 图片；请不要选择 SVG 或改名的文件')
  if(type==='image/png'){
    if(bytes.length<24)throw Error('图片文件不完整')
    const header=new DataView(bytes.buffer)
    if(!sizesOK(header.getUint32(16),header.getUint32(20)))throw Error('请将图片宽高缩小到 4096 像素以内')
  }
  const image=doc.createElement('img'),url=win.URL.createObjectURL(new win.Blob([file],{type}))
  let timer
  try{
    image.src=url
    await Promise.race([image.decode(),new Promise((_,reject)=>{timer=win.setTimeout(()=>reject(Error('读取图片超时，请换一张较小的图片')),8000)})])
    if(!sizesOK(image.naturalWidth,image.naturalHeight))throw Error('请将图片宽高缩小到 4096 像素以内')
    const scale=Math.min(1,768/image.naturalWidth,768/image.naturalHeight),canvas=doc.createElement('canvas')
    canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale))
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height)
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))
    if(!blob)throw Error('无法处理这张图片，请换一张重试')
    return{blob,width:canvas.width,height:canvas.height,name:String(file.name||'自定义图片').slice(0,160),revision:win.crypto?.randomUUID?.()||String(Date.now())}
  }catch(error){throw Error(error.name==='EncodingError'?'图片无法解码，请选择完整的 PNG、JPG 或 WebP 图片':error.message)}
  finally{win.clearTimeout(timer);image.removeAttribute('src');win.URL.revokeObjectURL(url)}
}
