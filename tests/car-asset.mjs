import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from '../dist/vendor/examples/jsm/loaders/GLTFLoader.js';
import {prepareCar,cloneCar} from '../dist/world.js';
globalThis.self=globalThis;
// Geometry validation uses an image metadata stub. It does not test GPU texture upload.
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const b=await readFile(new URL('../dist/assets/tuner-coupe.glb',import.meta.url));const gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const template=prepareCar(gltf),car=cloneCar(template,'#245f78');car.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(car).getSize(new THREE.Vector3());assert.ok(size.z>4.4&&size.z<4.7);assert.ok(size.x>1.5&&size.x<2.3);assert.ok(size.y>1.2&&size.y<1.5);assert.equal(car.userData.wheelGroups.length,4);assert.ok(car.userData.paints.length>0);assert.ok(car.userData.brakes.length>0);let meshes=0,triangles=0;car.traverse(o=>{if(o.isMesh){meshes++;triangles+=o.geometry.attributes.position.count/3;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}});for(const w of car.userData.wheelGroups){const s=new THREE.Box3().setFromObject(w).getSize(new THREE.Vector3());assert.ok(s.y>.2&&s.z>.2);assert.ok(Math.abs(new THREE.Box3().setFromObject(w).min.y)<.003,'Tires must meet the ground');}
console.log(JSON.stringify({dimensionsMetres:size.toArray().map(x=>+x.toFixed(3)),mergedMeshes:meshes,triangles,wheels:4,finiteGeometry:true,gpuRendering:'not exercised'},null,2));

const second=cloneCar(template,'#b72227');
assert.notEqual(car.userData.paints[0],second.userData.paints[0]);
assert.equal(second.userData.paints[0].color.getHexString(),'b72227');
let glazing=0,glazingOpacity=0,vinyl=0,frontLampZ=-Infinity,rearLampZ=Infinity;
car.traverse(o=>{if(!o.isMesh)return;const m=o.material,b=new THREE.Box3().setFromObject(o);if(m.name==='Glass glazing'){glazing++;glazingOpacity=m.opacity;assert.equal(m.transparent,true);assert.ok(m.opacity>.1&&m.opacity<.7);assert.equal(m.depthWrite,false);}if(m.name==='Vinyl graphic'){vinyl++;assert.ok(m.map);assert.equal(m.color.getHexString(),'ffffff');}if(m.name==='Projector light')frontLampZ=Math.max(frontLampZ,b.max.z);if(m.name==='Brakelight red'){rearLampZ=Math.min(rearLampZ,b.min.z);assert.ok(m.color.r>m.color.g*10);}});
assert.equal(glazing,1);assert.equal(vinyl,1);assert.ok(frontLampZ>1.9);assert.ok(rearLampZ< -1.9);
for(const group of car.userData.wheelGroups){assert.ok((group.name.includes('Front')?group.position.z:-group.position.z)>1.3);group.traverse(o=>{if(o.isMesh)assert.notEqual(o.material.name,'Red caliper','Brake calipers must stay fixed');});const original=new THREE.Box3().setFromObject(group);group.rotation.x=Math.PI/3;car.updateMatrixWorld(true);const spun=new THREE.Box3().setFromObject(group);assert.ok(Math.abs(original.getCenter(new THREE.Vector3()).y-spun.getCenter(new THREE.Vector3()).y)<.015,'Wheel pivot is eccentric');group.rotation.x=0;}
console.log(JSON.stringify({materialIsolation:true,frontAxis:'+Z',glazingOpacity,vinylPresent:true,wheelSpinCentersStable:true}));
