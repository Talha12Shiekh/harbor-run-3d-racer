import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from '../dist/vendor/examples/jsm/loaders/GLTFLoader.js';
import {HDRLoader} from '../dist/vendor/examples/jsm/loaders/HDRLoader.js';
import {assetParts,cityPlacements,installCity} from '../dist/city.js';
import {createTrack} from '../dist/sim.js';
// Stub image metadata only. Pillow separately decodes the embedded images.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const manifest=JSON.parse(await readFile(new URL('../dist/assets/city/manifest.json',import.meta.url))),kit=new Map(),reports=[];
for(const a of manifest.assets){
 const b=await readFile(new URL('../dist/assets/city/'+a.file,import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const parts=assetParts(gltf.scene),bounds=new THREE.Box3();let triangles=0;
 assert.equal(parts.length,a.meshes);
 for(const p of parts){for(const key of ['position','normal','uv']){assert.ok(p.geometry.attributes[key],a.name+' missing '+key);for(const value of p.geometry.attributes[key].array)assert.ok(Number.isFinite(value));}bounds.union(p.geometry.boundingBox);triangles+=(p.geometry.index?.count??p.geometry.attributes.position.count)/3;if(p.material.name.includes('Leaf')){assert.equal(p.material.alphaTest,.5);assert.equal(p.material.transparent,false);assert.ok(p.material.map);}}
 assert.ok(bounds.min.y>=-.06,a.name+' underground geometry');assert.ok(bounds.max.y<a.height+1,a.name+' unexpected height');
 if(a.kind==='building'){assert.ok(Math.abs(bounds.min.x)<a.width/2+2);assert.ok(bounds.max.x<a.width/2+2);assert.ok(Math.abs(bounds.min.z)<a.depth/2+2.5);assert.ok(bounds.max.z<a.depth/2+2.5);}
 for(let axis=0;axis<3;axis++){assert.ok(Math.abs(bounds.min.getComponent(axis)-a.bounds.min[axis])<.002);assert.ok(Math.abs(bounds.max.getComponent(axis)-a.bounds.max[axis])<.002);}
 assert.equal(triangles,a.triangles);kit.set(a.name,{...a,parts});reports.push({name:a.name,parts:parts.length,triangles,bounds:[bounds.min.toArray(),bounds.max.toArray()].map(v=>v.map(x=>+x.toFixed(2)))});
}
const track=createTrack(),placements=cityPlacements(track,manifest);assert.deepEqual(placements,cityPlacements(track,manifest));assert.ok(placements.length>200);
let clearance=Infinity;
for(const p of placements){for(const key of ['x','y','z','heading','scale'])assert.ok(Number.isFinite(p[key]));const a=manifest.assets.find(a=>a.name===p.name);if(a.kind==='building'&&!p.distant){const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),p.heading);for(const x of [a.bounds.min[0],a.bounds.max[0]])for(const z of [a.bounds.min[2],a.bounds.max[2]]){const v=new THREE.Vector3(x,0,z).applyQuaternion(q);const distance=Math.sqrt(track.project(v.x+p.x,v.z+p.z).dist);clearance=Math.min(clearance,distance);assert.ok(distance>=13.59,'Building overlaps street');}}}
const scene=new THREE.Scene(),installed=installCity(scene,track,manifest,kit);assert.ok(installed.draws<90);
scene.traverse(o=>{if(o.isInstancedMesh){assert.ok(Number.isFinite(o.boundingSphere.radius));for(const n of o.instanceMatrix.array)assert.ok(Number.isFinite(n));if(o.material.alphaTest)assert.ok(o.customDepthMaterial);}});
const hdrBytes=await readFile(new URL('../dist/assets/daylight.hdr',import.meta.url));const hdr=new HDRLoader().parse(hdrBytes.buffer.slice(hdrBytes.byteOffset,hdrBytes.byteOffset+hdrBytes.byteLength));assert.equal(hdr.width,2048);assert.equal(hdr.height,1024);
console.log(JSON.stringify({assets:reports,placements:placements.length,instanceDraws:installed.draws,instancedTriangles:installed.triangles,minimumBuildingCornerRoadDistance:+clearance.toFixed(2),daylightDimensions:[hdr.width,hdr.height],deterministic:true,gpuRendering:'not exercised'},null,2));
