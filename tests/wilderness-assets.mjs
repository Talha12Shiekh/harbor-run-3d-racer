import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from '../dist/vendor/examples/jsm/loaders/GLTFLoader.js';
import {assetParts,wildernessPlacements,installWilderness,footprintClear,groundHeight,releaseEnvironment} from '../dist/wilderness.js';
import {createTrack,validateProfile} from '../dist/sim.js';
import {World} from '../dist/world.js';
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const manifest=JSON.parse(await readFile(new URL('../dist/assets/wilderness/manifest.json',import.meta.url))),kit=new Map(),reports=[];
assert.equal(manifest.originalGeometry,true);assert.equal(manifest.assets.length,14);
for(const a of manifest.assets){
 assert.equal(a.originalGeometry,true);const bytes=await readFile(new URL('../dist/assets/wilderness/'+a.file,import.meta.url));const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const parts=assetParts(gltf.scene),bounds=new THREE.Box3();let triangles=0;
 for(const p of parts){for(const key of ['position','normal'])for(const v of p.geometry.attributes[key].array)assert.ok(Number.isFinite(v));bounds.union(p.geometry.boundingBox);triangles+=(p.geometry.index?.count??p.geometry.attributes.position.count)/3;if(p.material.name.includes('Leaf')){assert.equal(p.material.alphaTest,.42);assert.equal(p.material.transparent,false);assert.ok(p.material.map);assert.equal(p.material.side,THREE.DoubleSide);}}
 for(let axis=0;axis<3;axis++){assert.ok(Math.abs(bounds.min.getComponent(axis)-a.bounds.min[axis])<.003,a.name+' min bounds');assert.ok(Math.abs(bounds.max.getComponent(axis)-a.bounds.max[axis])<.003,a.name+' max bounds');}
 assert.equal(triangles,a.triangles);kit.set(a.name,{...a,parts});reports.push({name:a.name,parts:parts.length,triangles});
}
const track=createTrack(),themes=[];
for(const theme of ['forest','alpine','night']){
 const placements=wildernessPlacements(track,manifest,theme);assert.deepEqual(placements,wildernessPlacements(track,manifest,theme));assert.ok(placements.length>700);
 for(const p of placements){for(const key of ['x','y','z','heading','scale'])assert.ok(Number.isFinite(p[key]));assert.ok(footprintClear(track,kit.get(p.name),p),'Road obstructed by '+p.name);}
 assert.ok(placements.some(p=>p.name===(theme==='alpine'?'spruce-snow':'redwood')));assert.equal(placements.some(p=>p.name==='street-lamp'),theme==='night');assert.equal(placements.some(p=>p.name==='waterfall'),theme!=='alpine');
 for(const p of track.samples)assert.ok(groundHeight(manifest,p.x,p.z)<p.y-.1,'Terrain enters drivable road');
 const root=new THREE.Group(),installed=installWilderness(root,track,manifest,kit,theme);assert.ok(installed.draws<35);
 root.traverse(o=>{if(!o.isInstancedMesh)return;assert.ok(Number.isFinite(o.boundingSphere.radius));for(const v of o.instanceMatrix.array)assert.ok(Number.isFinite(v));if(o.material.alphaTest)assert.ok(o.customDepthMaterial);});
 let disposals=0;const shared=new Set([...kit.values()].flatMap(a=>a.parts.flatMap(p=>[p.geometry,p.material])));const listener=()=>disposals++;for(const r of shared)r.addEventListener('dispose',listener);releaseEnvironment(root);assert.equal(disposals,0,'Theme switch releases shared assets');for(const r of shared)r.removeEventListener('dispose',listener);assert.equal(root.children.length,0);
 themes.push({theme,placements:placements.length,draws:installed.draws,triangles:installed.triangles});
}
assert.deepEqual(validateProfile(null).vehicle,'hypercar');assert.deepEqual(validateProfile(null).environment,'forest');
const legacy=validateProfile({paint:'#c59626',quality:'low',volume:.3,records:{lap:91,race:199},vehicle:'unknown',environment:'city'});assert.equal(legacy.paint,'#c59626');assert.deepEqual(legacy.records,{lap:91,race:199});assert.equal(legacy.vehicle,'hypercar');assert.equal(legacy.environment,'forest');
assert.equal(validateProfile({vehicle:'spyder',environment:'alpine'}).vehicle,'spyder');assert.equal(validateProfile({vehicle:'interceptor',environment:'alpine'}).environment,'alpine');
// Exercise the actual switching path without a GPU or real text rasterization.
globalThis.document={createElement(){return {width:512,height:128,getContext(){return {fillRect(){},strokeRect(){},fillText(){}};}};}};
const world=Object.assign(Object.create(World.prototype),{track,manifest,kit,scene:new THREE.Scene(),textures:Array.from({length:8},()=>new THREE.Texture()),sun:new THREE.DirectionalLight(),hemi:new THREE.HemisphereLight(),daySky:new THREE.Texture(),nightSky:new THREE.Texture(),envTarget:{texture:new THREE.Texture()},nightTarget:{texture:new THREE.Texture()}});world.scene.fog=new THREE.FogExp2();
for(const theme of ['forest','night','alpine','night','forest']){const old=world.environmentRoot;world.setEnvironment(theme);assert.equal(world.worldInfo.theme,theme);assert.equal(world.scene.background,theme==='night'?world.nightSky:world.daySky);assert.equal(world.scene.environment,theme==='night'?world.nightTarget.texture:world.envTarget.texture);assert.equal(world.sun.intensity,theme==='night'?.9:theme==='alpine'?2.5:2.1);assert.equal(world.roadLights.length,4);for(const l of world.roadLights)assert.equal(l.visible,theme==='night');if(theme==='night')assert.ok(world.lampLocations.length>25);assert.equal(world.scene.children.length,9);if(old){assert.equal(old.parent,null);assert.equal(old.children.length,0);}}
world.setEnvironment('invalid');assert.equal(world.environment,'forest');releaseEnvironment(world.environmentRoot);
console.log(JSON.stringify({assets:reports,themes,clearDrivingCorridor:true,deterministic:true,profileMigration:true,actualThemeSwitches:5,gpuRendering:'not exercised'},null,2));
