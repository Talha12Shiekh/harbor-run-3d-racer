import * as THREE from 'three';
import {mergeGeometries} from './vendor/examples/jsm/utils/BufferGeometryUtils.js';
import {wheelSteering} from './handling.js';
import {SEATS} from './cameras.js';
const animated=new Set(['CockpitSteering','SpeedNeedle','RpmNeedle','CockpitFrame','CockpitHeader']);
export function prepareCockpit(gltf){
 gltf.scene.updateMatrixWorld(true);const buckets=new Map([['body',{pivot:new THREE.Vector3(),parts:new Map()}]]);
 gltf.scene.traverse(o=>{if(!o.isMesh)return;let a=o,group='body';while(a){if(animated.has(a.name)){group=a.name;if(!buckets.has(group))buckets.set(group,{pivot:new THREE.Vector3().setFromMatrixPosition(a.matrixWorld),parts:new Map()});break;}a=a.parent;}
  const bucket=buckets.get(group),g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.translate(-bucket.pivot.x,-bucket.pivot.y,-bucket.pivot.z);let geometry=g.index?g.toNonIndexed():g;if(geometry!==g)g.dispose();for(const key of Object.keys(geometry.attributes))if(!['position','normal'].includes(key))geometry.deleteAttribute(key);if(!geometry.attributes.normal)geometry.computeVertexNormals();if(!bucket.parts.has(o.material))bucket.parts.set(o.material,[]);bucket.parts.get(o.material).push(geometry);
 });
 const root=new THREE.Group();root.name='Original Blender cockpit';
 for(const [name,bucket] of buckets){const parent=name==='body'?root:new THREE.Group();if(parent!==root){parent.name=name;parent.position.copy(bucket.pivot);root.add(parent);}for(const [mat,parts] of bucket.parts){const geometry=mergeGeometries(parts,false);if(!geometry)throw Error('Cockpit geometry failed to merge');parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(geometry,mat);mesh.receiveShadow=true;mesh.castShadow=false;parent.add(mesh);}}
 return root;
}
export function createCockpit(template,vehicle){const rig=template.clone(true),seat=SEATS[vehicle]??SEATS.hypercar;rig.position.y=seat.lift;rig.visible=false;rig.userData.steering=rig.getObjectByName('CockpitSteering');rig.userData.speed=rig.getObjectByName('SpeedNeedle');rig.userData.rpm=rig.getObjectByName('RpmNeedle');for(const name of ['CockpitFrame','CockpitHeader']){const frame=rig.getObjectByName(name);frame.position.y+=seat.eye[1]-SEATS.hypercar.eye[1]-seat.lift;frame.position.z+=seat.eye[2]-SEATS.hypercar.eye[2];if(name==='CockpitHeader')frame.visible=vehicle!=='spyder';}return rig;}
export function updateCockpit(rig,car,visible){
 rig.visible=visible;if(!visible)return;
 rig.userData.steering.rotation.z=-wheelSteering(car)*3.2;
 const speed=Math.abs(car.speed),rpm=speed<1?1100:1100+(speed%12)/12*4700;
 rig.userData.speed.rotation.z=-2.3+Math.min(speed*3.6/300,1)*4.6;
 rig.userData.rpm.rotation.z=-2.3+Math.min(rpm/7000,1)*4.6;
}
