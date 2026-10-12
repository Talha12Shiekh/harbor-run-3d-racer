import test from 'node:test';
import assert from 'node:assert/strict';
import {Sound} from '../dist/audio.js';
class Parameter{constructor(){this.value=0;}setTargetAtTime(value){assert.ok(Number.isFinite(value));this.value=value;}}
class Node{constructor(){this.gain=new Parameter();this.frequency=new Parameter();this.starts=0;}connect(){}start(){this.starts++;}}
class Context{constructor(){this.currentTime=0;this.sampleRate=128;this.destination={};this.nodes=[];this.resumes=0;}node(){const n=new Node();this.nodes.push(n);return n;}createGain(){return this.node();}createOscillator(){return this.node();}createBiquadFilter(){return this.node();}createBufferSource(){return this.node();}createBuffer(n,size){const data=new Float32Array(size);return {getChannelData:()=>data};}async resume(){this.resumes++;}}
test('AC-26 synthesized siren follows real pursuit distance and is muted outside active pursuit',async()=>{
 globalThis.window={AudioContext:Context};const sound=new Sound();await sound.resume();const car={speed:30,slip:0,impact:0,boosting:false};sound.update(car,true,{nearestDistance:20});const near=sound.sirenGain.gain.value;assert.ok(near>0);sound.context.currentTime=.2;sound.update(car,true,{nearestDistance:120});assert.ok(sound.sirenGain.gain.value<near);assert.ok(sound.siren.frequency.value>=450&&sound.siren.frequency.value<=1250);sound.update(car,true,{nearestDistance:200});assert.equal(sound.sirenGain.gain.value,0);sound.update(car,true);assert.equal(sound.sirenGain.gain.value,0);sound.update(car,false,{nearestDistance:5});assert.equal(sound.sirenGain.gain.value,0);assert.equal(sound.master.gain.value,0);
 const count=sound.context.nodes.length;await sound.resume();assert.equal(sound.context.nodes.length,count,'Restart must not create duplicate sound nodes');
});
test('AC-51 wreck cuts engine audio while preserving collision and pursuit sound',async()=>{
 globalThis.window={AudioContext:Context};const s=new Sound();await s.resume();s.update({speed:30,slip:0,boosting:false,damage:{wrecked:true}},true,{nearestDistance:10});assert.equal(s.engineGain.gain.value,0);assert.equal(s.active,true);assert.ok(s.sirenGain.gain.value>0);assert.ok(s.impactBuffers.masonry);s.update({speed:0,slip:0,boosting:false,damage:{wrecked:false}},true);assert.ok(s.engineGain.gain.value>0);
});
