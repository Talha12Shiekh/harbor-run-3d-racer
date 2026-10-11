import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from '../dist/vendor/examples/jsm/loaders/GLTFLoader.js';
import {prepareCar,cloneCar} from '../dist/world.js';
globalThis.self=globalThis;
// Geometry validation uses an image metadata stub. It does not test GPU texture upload.
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const b=await readFile(new URL('../dist/assets/car.glb',import.meta.url));const gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const template=prepareCar(gltf),car=cloneCar(template,'#245f78');car.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(car).getSize(new THREE.Vector3());assert.ok(size.z>4.4&&size.z<4.7);assert.ok(size.x>1.5&&size.x<2.8);assert.ok(size.y>.7&&size.y<2.4);assert.equal(car.userData.wheelGroups.length,4);assert.ok(car.userData.paints.length>0);assert.ok(car.userData.brakes.length>0);let meshes=0,triangles=0;car.traverse(o=>{if(o.isMesh){meshes++;triangles+=o.geometry.attributes.position.count/3;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}});for(const w of car.userData.wheelGroups){const s=new THREE.Box3().setFromObject(w).getSize(new THREE.Vector3());assert.ok(s.y>.2&&s.z>.2);assert.ok(Math.abs(new THREE.Box3().setFromObject(w).min.y)<.003,'Tires must meet the ground');}
console.log(JSON.stringify({dimensionsMetres:size.toArray().map(x=>+x.toFixed(3)),mergedMeshes:meshes,triangles,wheels:4,finiteGeometry:true,gpuRendering:'not exercised'},null,2));
