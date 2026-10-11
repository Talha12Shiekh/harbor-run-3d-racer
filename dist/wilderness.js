import * as THREE from 'three';
import {GLTFLoader} from './vendor/examples/jsm/loaders/GLTFLoader.js';

export function assetParts(scene){
 scene.updateMatrixWorld(true);const parts=[];
 scene.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld),material=o.material;if(Array.isArray(material))throw new Error('Unexpected scenery primitive');geometry.computeBoundingBox();geometry.computeBoundingSphere();
  if(material.name.includes('Leaf')){material.alphaTest=.42;material.transparent=false;material.side=THREE.DoubleSide;material.depthWrite=true;material.roughness=.95;}
  if(material.name.includes('asphalt')){const alpine=material.name.startsWith('Alpine');material.color.set(alpine?'#7e878c':'#717e82');material.roughness=alpine?.7:.48;material.clearcoat=alpine?.35:.68;material.clearcoatRoughness=.14;material.normalScale.set(.26,.26);}
  if(material.name.includes('gravel')){material.color.set(material.name.startsWith('Alpine')?'#dbe4e7':'#67634f');material.roughness=.96;material.normalScale.set(.3,.3);}
  if(material.name.startsWith('Road paint')){material.color.set(material.name.endsWith('yellow')?'#e8bc4d':'#dedbc7');material.alphaTest=.45;material.transparent=false;material.depthWrite=true;material.roughness=.9;}
  if(material.transparent)material.depthWrite=false;
  parts.push({geometry,material});
 });return parts;
}
export async function loadWilderness(onProgress=()=>{}){
 const response=await fetch('./assets/wilderness/manifest.json');if(!response.ok)throw new Error('Scenery manifest failed to load');const manifest=await response.json(),kit=new Map(),loader=new GLTFLoader();let count=0;
 await Promise.all(manifest.assets.map(async a=>{const gltf=await loader.loadAsync('./assets/wilderness/'+a.file);kit.set(a.name,{...a,parts:assetParts(gltf.scene)});onProgress(++count/manifest.assets.length);}));return {manifest,kit};
}
export function groundHeight(manifest,x,z){
 const h=manifest.heightmap,n=h.size,u=THREE.MathUtils.clamp((x-h.origin[0])/h.extent*(n-1),0,n-1),v=THREE.MathUtils.clamp((z-h.origin[1])/h.extent*(n-1),0,n-1),i=Math.min(n-2,Math.floor(u)),j=Math.min(n-2,Math.floor(v)),a=u-i,b=v-j;
 return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h.heights[j*n+i],h.heights[j*n+i+1],a),THREE.MathUtils.lerp(h.heights[(j+1)*n+i],h.heights[(j+1)*n+i+1],a),b);
}
export function footprintClear(track,asset,p,margin=.5){
 const b=asset.bounds,c=Math.cos(p.heading),s=Math.sin(p.heading),sx=p.scaleX??p.scale,sz=p.scaleZ??p.scale;
 // Corners, edge midpoints and center catch long assets near the hairpin.
 for(const x of [b.min[0],(b.min[0]+b.max[0])/2,b.max[0]])for(const z of [b.min[2],(b.min[2]+b.max[2])/2,b.max[2]]){
  const dx=x*sx,dz=z*sz;if(track.project(p.x+c*dx+s*dz,p.z-s*dx+c*dz).dist<(track.width/2+margin)**2)return false;
 }return true;
}
export function wildernessPlacements(track,manifest,theme='forest'){
 const placements=[],assets=new Map(manifest.assets.map(a=>[a.name,a]));let seed=41736;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const pose=(s,offset,heading,scale=1)=>{const q=track.at(s),x=q.x+q.tz*offset,z=q.z-q.tx*offset;const d=Math.abs(offset),y=d<21?(d<14?q.y+.015:THREE.MathUtils.lerp(q.y+.015,-.8,(d-14)/7)):groundHeight(manifest,x,z);return {x,y,z,heading:heading??q.heading,scale};};
 const add=(name,s,side,offset,scale=1,heading)=>{for(let attempt=0;attempt<8;attempt++){const p={name,...pose(s,side*(offset+attempt*4),heading,scale)};if(footprintClear(track,assets.get(name),p)){placements.push(p);return p;}}return null;};
 for(let s=0;s<track.length;s+=6)for(const side of [-1,1])add('guardrail',s,side,11.4);
 for(let s=5;s<track.length;s+=15)for(const side of [-1,1]){const name=theme==='alpine'?'spruce-snow':random()>.36?'redwood':'spruce';add(name,s,side,21+random()*15,.72+random()*.40,random()*Math.PI*2);}
 for(let s=12;s<track.length;s+=29)for(const side of [-1,1])add(theme==='alpine'?'spruce-snow':random()>.45?'redwood':'spruce',s,side,58+random()*70,.9+random()*.5,random()*Math.PI*2);
 for(let s=18;s<track.length;s+=42){const side=random()>.5?1:-1;add(random()>.5?'rock-face':'boulder',s,side,23+random()*10,.7+random()*.5,random()*Math.PI*2);}
 const poles=[];for(let s=0;s<track.length;s+=72){const p=add('power-pole',s,-1,16,1);if(p)poles.push(p);}
 for(let i=0;i<poles.length;i++){const a=poles[i],b=poles[(i+1)%poles.length],length=Math.hypot(b.x-a.x,b.z-a.z),p={name:'power-line',...a,heading:Math.atan2(b.x-a.x,b.z-a.z),scaleX:1,scaleY:1,scaleZ:length/72};p.name='power-line';if(footprintClear(track,assets.get(p.name),p))placements.push(p);}
 if(theme==='forest')add('waterfall',track.length*.23,-1,72,1.4,track.at(track.length*.23).heading+Math.PI*.4);
 return placements;
}
export function installWilderness(parent,track,manifest,kit,theme='forest'){
 const placements=wildernessPlacements(track,manifest,theme),groups=new Map();let draws=0,triangles=0;
 for(const p of placements){if(!groups.has(p.name))groups.set(p.name,[]);groups.get(p.name).push(p);}
 for(const [name,list] of groups){for(const part of kit.get(name).parts){const mesh=new THREE.InstancedMesh(part.geometry,part.material,list.length),q=new THREE.Quaternion(),m=new THREE.Matrix4();list.forEach((p,i)=>{q.setFromAxisAngle(new THREE.Vector3(0,1,0),p.heading);m.compose(new THREE.Vector3(p.x,p.y,p.z),q,new THREE.Vector3(p.scaleX??p.scale,p.scaleY??p.scale,p.scaleZ??p.scale));mesh.setMatrixAt(i,m);});mesh.name='Original Blender '+name;mesh.userData.sharedAsset=true;mesh.castShadow=name!=='power-line';mesh.receiveShadow=true;if(part.material.alphaTest)mesh.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:part.material.map,alphaTest:.42,side:THREE.DoubleSide});mesh.computeBoundingSphere();parent.add(mesh);draws++;triangles+=(part.geometry.index?.count??part.geometry.attributes.position.count)/3*list.length;}}
 for(const name of ['terrain-'+theme,'road-'+theme])for(const part of kit.get(name).parts){const m=new THREE.Mesh(part.geometry,part.material);m.name='Original Blender '+name;m.userData.sharedAsset=true;m.receiveShadow=true;parent.add(m);draws++;triangles+=(part.geometry.index?.count??part.geometry.attributes.position.count)/3;}
 return {placements,draws,triangles,theme};
}
export function releaseEnvironment(root){
 const owned=new Set(),textures=new Set();root.traverse(o=>{if(!o.isMesh)return;if(o.isInstancedMesh)o.dispose();if(o.customDepthMaterial)owned.add(o.customDepthMaterial);if(o.userData.sharedAsset)return;owned.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){owned.add(m);for(const t of Object.values(m))if(t?.isTexture&&t.userData.environmentOwned)textures.add(t);}});for(const r of [...owned,...textures])r.dispose();root.removeFromParent();root.clear();
}
