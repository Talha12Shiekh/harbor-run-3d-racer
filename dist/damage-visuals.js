import * as THREE from 'three';
import {deformPoint,motion,DESTRUCTION} from './destruction.js';

function pieceName(mesh,x,y,z,nx){
 if(mesh.material.name==='Glass glazing')return 'glass'+(Math.abs(nx)>.65?(x<0?'Left':'Right'):(z>0?'Front':'Rear'));
 if(mesh.userData.hideInCockpit)return 'core';
 if(z>1.70&&y<.85)return 'frontBumper';if(z< -1.75&&y<.90)return 'rearBumper';
 if(z>.55&&z<1.75&&Math.abs(x)<.88&&y>.52)return 'hood';
 if(Math.abs(x)>.78&&Math.abs(z)<.95&&y>.45&&y<1.05)return x<0?'leftPanel':'rightPanel';return 'core';
}
export function splitDamageTemplate(root){
 for(const source of [...root.children]){
  if(!source.isMesh||!/Paint|Glass glazing|Projector|Brakelight|Carbon|Chrome|Headlamp housing|Polished trim|Police white panel/.test(source.material.name))continue;
  const g=source.geometry,p=g.attributes.position,groups=new Map();
  for(let i=0;i<p.count;i+=3){let x=0,y=0,z=0,nx=0;for(let j=0;j<3;j++){x+=p.getX(i+j)/3;y+=p.getY(i+j)/3;z+=p.getZ(i+j)/3;nx+=g.attributes.normal.getX(i+j)/3;}const key=pieceName(source,x,y,z,nx);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i,i+1,i+2);}
  root.remove(source);
  for(const [name,indices] of groups){const geometry=new THREE.BufferGeometry();for(const [key,a] of Object.entries(g.attributes)){const values=new a.array.constructor(indices.length*a.itemSize);for(let i=0;i<indices.length;i++)for(let j=0;j<a.itemSize;j++)values[i*a.itemSize+j]=a.array[indices[i]*a.itemSize+j];geometry.setAttribute(key,new THREE.BufferAttribute(values,a.itemSize,a.normalized));}geometry.computeBoundingBox();geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,source.material);mesh.name='Damage part '+name;mesh.userData={...source.userData,damagePart:name};mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;root.add(mesh);}
  g.dispose();
 }
}
let cracks;
function crackTexture(){
 if(cracks)return cracks;const n=128,values=new Uint8Array(n*n*4);for(let i=0;i<n*n;i++){values[i*4]=values[i*4+1]=values[i*4+2]=32;values[i*4+3]=255;}
 for(let arm=0;arm<19;arm++){const a=arm*Math.PI*2/19;let x=63,y=57;for(let k=0;k<80;k++){x+=Math.cos(a+Math.sin(k*.45+arm)*.18);y+=Math.sin(a+Math.cos(k*.37+arm)*.19);const xx=Math.round(x),yy=Math.round(y);if(xx<0||yy<0||xx>=n||yy>=n)break;const i=(yy*n+xx)*4;values[i]=values[i+1]=values[i+2]=235;if(k%12===0&&xx+1<n){values[i+4]=values[i+5]=values[i+6]=150;}}}
 cracks=new THREE.DataTexture(values,n,n,THREE.RGBAFormat);cracks.colorSpace=THREE.SRGBColorSpace;cracks.needsUpdate=true;return cracks;
}
export function createDamageRig(car){
 const owned=new Set(),parts=[];
 for(const mesh of car.children){if(!mesh.isMesh||!mesh.userData.damagePart)continue;mesh.geometry=mesh.geometry.clone();owned.add(mesh.geometry);if(![...car.userData.paints,...car.userData.brakes,...car.userData.police].includes(mesh.material)){mesh.material=mesh.material.clone();owned.add(mesh.material);}const m=mesh.material;parts.push({mesh,name:mesh.userData.damagePart,original:mesh.geometry.attributes.position.array.slice(),normal:mesh.geometry.attributes.normal.array.slice(),roughness:m.roughness,clearcoat:m.clearcoat,opacity:m.opacity,map:m.map,color:m.color.clone(),detached:false});}
 car.userData.damageRig={parts,owned,state:null,revision:-1};return car.userData.damageRig;
}
export function updateDamageRig(car,state,debris,inside=false){
 const rig=car.userData.damageRig,d=state.damage;if(!rig||!d)return;
 const changed=rig.state!==d||rig.revision!==d.revision;
 for(const part of rig.parts){const {mesh,name}=part,m=mesh.material,glass=name.startsWith('glass'),zone=glass?name.slice(5).toLowerCase():name==='hood'||name==='frontBumper'?'front':name==='rearBumper'?'rear':name==='leftPanel'?'left':name==='rightPanel'?'right':null,level=zone?d[zone]:Math.max(d.front,d.rear,d.left,d.right);
  const removed=glass?level>=.75:!!d.parts[name];
  if(changed){
   const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,delta=.001,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3(),cross=new THREE.Vector3(),original=new THREE.Vector3(),undamaged=d.front+d.rear+d.left+d.right===0;
   for(let i=0;i<p.count;i++){const j=i*3,x=part.original[j],y=part.original[j+1],z=part.original[j+2],v=deformPoint(x,y,z,d);p.setXYZ(i,...v);if(undamaged){n.setXYZ(i,part.normal[j],part.normal[j+1],part.normal[j+2]);continue;}original.fromArray(v);a.fromArray(deformPoint(x+delta,y,z,d)).sub(original).divideScalar(delta);b.fromArray(deformPoint(x,y+delta,z,d)).sub(original).divideScalar(delta);c.fromArray(deformPoint(x,y,z+delta,d)).sub(original).divideScalar(delta);normal.crossVectors(b,c).multiplyScalar(part.normal[j]);normal.add(cross.crossVectors(c,a).multiplyScalar(part.normal[j+1]));normal.add(cross.crossVectors(a,b).multiplyScalar(part.normal[j+2])).normalize();n.setXYZ(i,normal.x,normal.y,normal.z);}
   p.needsUpdate=true;n.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
   if(glass){m.map=level>=.35?crackTexture():part.map;m.color.copy(level>=.35?new THREE.Color('#b8d4df'):part.color);m.opacity=level>=.35?.44:part.opacity;m.roughness=level>=.35?.75:part.roughness;m.needsUpdate=true;}
   else{m.roughness=Math.min(.9,part.roughness+level*.35);if(part.clearcoat!==undefined)m.clearcoat=part.clearcoat*(1-level*.65);if(/Paint/.test(m.name))m.color.set(car.userData.paintColor??state.color).multiplyScalar(1-level*.12);}
   if(removed&&!part.detached){debris?.carPart(mesh,car,state);part.detached=true;}else if(!removed)part.detached=false;
  }
  mesh.visible=!removed&&!(inside&&(mesh.userData.hideInCockpit||glass));
 }
 if(car.userData.damageFrame)car.userData.damageFrame.visible=!!(d.parts.hood||d.parts.frontBumper);
 rig.state=d;rig.revision=d.revision;
}

export class StructuralDebris{
 constructor(scene,ground=()=>0){this.root=new THREE.Group();this.root.name='Detached car parts and broken barriers';scene.add(this.root);this.ground=ground;this.parts=[];this.serial=0;}
 add(mesh,kind,velocity,owned=true){
  const cap=kind==='car'?DESTRUCTION.carParts:DESTRUCTION.barrierParts,matching=this.parts.filter(p=>p.kind===kind);if(matching.length>=cap)this.remove(matching[0]);
  mesh.geometry.computeBoundingBox();const half=mesh.geometry.boundingBox.getSize(new THREE.Vector3()).multiplyScalar(.5).multiply(mesh.scale),seed=++this.serial,spin=new THREE.Vector3(Math.sin(seed*3)*3,Math.cos(seed*7)*3,Math.sin(seed*11)*3);this.root.add(mesh);this.parts.push({mesh,kind,owned,velocity:new THREE.Vector3(velocity.x,velocity.y,velocity.z),spin,age:0,half,bounces:0,hint:null});
 }
 remove(part){part.mesh.removeFromParent();if(part.owned){part.mesh.geometry.dispose();part.mesh.material.dispose();}const i=this.parts.indexOf(part);if(i>=0)this.parts.splice(i,1);}
 clear(){for(const p of [...this.parts])this.remove(p);}
 carPart(source,car,state){
  car.updateMatrixWorld(true);const geometries=[];
  if(source.material.name==='Glass glazing'){
   const g=source.geometry,p=g.attributes.position,b=g.boundingBox,axis=/Left|Right/.test(source.userData.damagePart)?'Z':'X',low=b.min[axis.toLowerCase()],span=Math.max(.001,b.max[axis.toLowerCase()]-low),height=Math.max(.001,b.max.y-b.min.y),cells=new Map();
   for(let i=0;i<p.count;i+=3){let across=0,y=0;for(let j=0;j<3;j++){across+=p['get'+axis](i+j)/3;y+=p.getY(i+j)/3;}const key=Math.min(2,Math.floor((across-low)/span*3))+':'+Math.min(2,Math.floor((y-b.min.y)/height*3));if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i,i+1,i+2);}
   for(const indices of cells.values()){const shard=new THREE.BufferGeometry();for(const [name,a] of Object.entries(g.attributes)){const values=new a.array.constructor(indices.length*a.itemSize);for(let i=0;i<indices.length;i++)for(let j=0;j<a.itemSize;j++)values[i*a.itemSize+j]=a.array[indices[i]*a.itemSize+j];shard.setAttribute(name,new THREE.BufferAttribute(values,a.itemSize,a.normalized));}geometries.push(shard);}
  }else geometries.push(source.geometry.clone());
  for(const geometry of geometries){geometry.computeBoundingBox();const centre=geometry.boundingBox.getCenter(new THREE.Vector3());geometry.translate(-centre.x,-centre.y,-centre.z);const mesh=new THREE.Mesh(geometry,source.material.clone());mesh.position.copy(centre).applyMatrix4(car.matrixWorld);mesh.quaternion.copy(car.quaternion);mesh.castShadow=true;mesh.receiveShadow=true;const v=motion(state),s=Math.max(state.damage.front,state.damage.rear,state.damage.left,state.damage.right);this.add(mesh,'car',{x:v.x*.7+Math.sin(this.serial*5)*3,y:2+s*3,z:v.z*.7+Math.cos(this.serial*7)*3});}
 }
 barrier(event,kit){
  if(!event.broken||!event.section||!kit)return;const masonry=event.surface==='masonry',source=kit.get(masonry?'masonry-chunk':'guardrail');if(!source)return;const count=masonry?12:2,section=event.section,sin=Math.sin(section.heading),cos=Math.cos(section.heading);
  for(let i=0;i<count;i++){const part=source.parts[i%source.parts.length],geometry=part.geometry.clone();geometry.computeBoundingBox();const centre=geometry.boundingBox.getCenter(new THREE.Vector3());geometry.translate(-centre.x,-centre.y,-centre.z);const mesh=new THREE.Mesh(geometry,part.material.clone()),along=masonry?(i%6-2.5):i?1.5:-1.5;mesh.position.set(section.x+sin*along,section.y+(masonry?.2+Math.floor(i/6)*.3:.65),section.z+cos*along);mesh.rotation.y=section.heading;mesh.scale.set(masonry?.9:1,masonry?1:.8,masonry?1:.45);mesh.castShadow=true;mesh.receiveShadow=true;this.add(mesh,'barrier',{x:event.vx*.18-event.nx*(3+i%3),y:2+i%3,z:event.vz*.18-event.nz*(3+i%3)});}
 }
 update(dt){
  if(!(dt>0))return;
  for(const p of [...this.parts]){p.age+=dt;if(p.age>DESTRUCTION.partLife){this.remove(p);continue;}const m=p.mesh,v=p.velocity;v.y-=DESTRUCTION.gravity*dt;m.position.addScaledVector(v,dt);m.rotation.x+=p.spin.x*dt;m.rotation.y+=p.spin.y*dt;m.rotation.z+=p.spin.z*dt;const rotation=new THREE.Matrix4().makeRotationFromQuaternion(m.quaternion).elements,support=Math.abs(rotation[1])*p.half.x+Math.abs(rotation[5])*p.half.y+Math.abs(rotation[9])*p.half.z,floor=this.ground(m.position.x,m.position.z)+support;if(m.position.y<floor){m.position.y=floor;v.y=p.bounces<2?Math.abs(v.y)*.23:0;p.bounces++;v.x*=.72;v.z*=.72;p.spin.multiplyScalar(.6);}const drag=Math.exp(-dt*.65);v.x*=drag;v.z*=drag;if(Math.abs(v.y)<.2&&Math.hypot(v.x,v.z)<.3)p.spin.multiplyScalar(Math.exp(-dt*6));if(p.age>DESTRUCTION.partLife-.4)m.scale.multiplyScalar(Math.exp(-dt*5));}
 }
}

export function updateBarrierInstances(info,field){
 if(!info?.barriers||info.damageRevision===field.revision)return;
 const object=new THREE.Object3D(),color=new THREE.Color();
 for(const [id,binding] of info.barriers){const state=field.states.get(id);if(!state)continue;const p=binding.placement;object.position.set(p.x,p.y,p.z);object.rotation.set(0,p.heading,-p.side*state.damage*.08);object.scale.set(state.broken?0:p.scale,state.broken?0:p.scale*(1-state.damage*.14),state.broken?0:p.scale);object.updateMatrix();color.setScalar(1-state.damage*.2);for(const {mesh,index} of binding.instances){mesh.setMatrixAt(index,object.matrix);mesh.instanceMatrix.needsUpdate=true;mesh.setColorAt(index,color);mesh.instanceColor.needsUpdate=true;}}
 info.damageRevision=field.revision;
}
