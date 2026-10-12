// Export the actual runtime meshes for optional CPU Blender visual checks.
// node --loader ./tests/three-resolver.mjs assets-src/prepare_destruction_preview.mjs /tmp/harbor-damage
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import * as THREE from 'three';
import {GLTFLoader} from '../dist/vendor/examples/jsm/loaders/GLTFLoader.js';
import {prepareCar,cloneCar} from '../dist/world.js';
import {freshDamage} from '../dist/destruction.js';
import {updateDamageRig,StructuralDebris} from '../dist/damage-visuals.js';
import {assetParts} from '../dist/wilderness.js';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const out=resolve(process.argv[2]??'/tmp/harbor-damage');await mkdir(out,{recursive:true});
async function glb(path){const b=await readFile(path);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
const meta=JSON.parse(await readFile('dist/assets/vehicles/manifest.json','utf8')).vehicles.find(v=>v.id==='hypercar'),template=prepareCar(await glb('dist/assets/vehicles/hypercar.glb'),meta),kit=new Map();
for(const name of ['crash-frame','masonry-barrier','masonry-chunk'])kit.set(name,{parts:assetParts((await glb('dist/assets/wilderness/'+name+'.glb')).scene)});
const packed=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
for(const [name,zone,amount] of [['intact','front',0],['front-dent','front',.55],['front-wreck','front',1],['side-wreck','left',1]]){
 const scene=new THREE.Scene(),car=cloneCar(template,'#3446c7');scene.add(car);const frame=new THREE.Group();for(const p of kit.get('crash-frame').parts)frame.add(new THREE.Mesh(p.geometry,p.material));car.add(frame);car.userData.damageFrame=frame;
 const d=freshDamage();d[zone]=amount;d.hits[zone]={x:zone==='left'?-1:0,z:zone==='front'?2:0};d.revision=1;if(amount===1){d.wrecked=true;if(zone==='front')d.parts={hood:true,frontBumper:true};else d.parts={leftPanel:true};}
 const state={damage:d,x:0,y:0,z:0,heading:0,slip:0,speed:0,color:'#3446c7'},pool=new StructuralDebris(scene,()=>0);updateDamageRig(car,state,pool);
 if(amount===1){pool.barrier({broken:true,surface:'masonry',section:{x:2.5,y:0,z:0,heading:0},vx:8,vz:4,nx:-1,nz:0},kit);for(let i=0;i<90;i++)pool.update(1/120);}else for(const p of kit.get('masonry-barrier').parts){const m=new THREE.Mesh(p.geometry,p.material);m.position.x=2.5;scene.add(m);}
 scene.updateMatrixWorld(true);const meshes=[];scene.traverse(o=>{if(!o.isMesh)return;for(let p=o;p;p=p.parent)if(!p.visible)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,m=o.material,t=m.map?.image;meshes.push({name:o.name,position:packed(g.attributes.position.array),normal:packed(g.attributes.normal.array),uv:g.attributes.uv?packed(g.attributes.uv.array):null,matrix:o.matrixWorld.toArray(),material:{name:m.name,color:m.color.toArray(),roughness:m.roughness,metalness:m.metalness,clearcoat:m.clearcoat??0,opacity:m.opacity,emissive:m.emissive?.toArray()??[0,0,0],emissiveIntensity:m.emissiveIntensity??0,cracks:t?.data?{width:t.width,height:t.height,data:packed(t.data)}:null}});});await writeFile(resolve(out,name+'.json'),JSON.stringify({stage:name,meshes}));pool.clear();
}
console.log('Runtime damage snapshots:',out);
