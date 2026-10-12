import {impactSamples} from './impact-audio.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Sound{
 constructor(){this.context=null;this.volume=.55;this.voices=new Set();this.active=false;this.scrape={level:0,pan:0,until:0};}
 async resume(){
  if(!this.context){
   const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.context=new C();const c=this.context;
   this.master=c.createGain();this.master.gain.value=0;
   if(c.createDynamicsCompressor){this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-8;this.limiter.knee.value=12;this.limiter.ratio.value=6;this.limiter.attack.value=.003;this.limiter.release.value=.12;this.master.connect(this.limiter);this.limiter.connect(c.destination);}else this.master.connect(c.destination);
   this.engine=c.createOscillator();this.engine.type='sawtooth';this.engine2=c.createOscillator();this.engine2.type='triangle';const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;this.engineGain=c.createGain();this.engineGain.gain.value=.03;this.engine.connect(filter);this.engine2.connect(filter);filter.connect(this.engineGain);this.engineGain.connect(this.master);this.engine.start();this.engine2.start();
   this.siren=c.createOscillator();this.siren.type='sine';this.sirenGain=c.createGain();this.sirenGain.gain.value=0;this.siren.connect(this.sirenGain);this.sirenGain.connect(this.master);this.siren.start();
   const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;this.noise=c.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;this.noiseGain=c.createGain();this.noiseGain.gain.value=0;const nf=c.createBiquadFilter();nf.type='lowpass';nf.frequency.value=1300;this.noise.connect(nf);nf.connect(this.noiseGain);this.noiseGain.connect(this.master);this.noise.start();
   this.impactBuffers={};for(const kind of ['light','heavy','masonry','scrape']){const samples=impactSamples(c.sampleRate,kind),b=c.createBuffer(1,samples.length,c.sampleRate);b.getChannelData(0).set(samples);this.impactBuffers[kind]=b;}
   this.scrapeSource=c.createBufferSource();this.scrapeSource.buffer=this.impactBuffers.scrape;this.scrapeSource.loop=true;this.scrapeGain=c.createGain();this.scrapeGain.gain.value=0;this.scrapeSource.connect(this.scrapeGain);if(c.createStereoPanner){this.scrapePanner=c.createStereoPanner();this.scrapeGain.connect(this.scrapePanner);this.scrapePanner.connect(this.master);}else this.scrapeGain.connect(this.master);this.scrapeSource.start();
  }
  await this.context.resume();
 }
 contacts(events,player,listener=null){
  const c=this.context;if(!c||!this.active||this.volume<=0||(c.state&&c.state!=='running'))return;
  const ear=listener??{x:player.x,z:player.z,rightX:-Math.cos(player.heading),rightZ:Math.sin(player.heading)},t=c.currentTime;
  const ordered=[...events].sort((a,b)=>Number(a.actors.includes(0))-Number(b.actors.includes(0)));for(const event of ordered){
   const dx=event.x-ear.x,dz=event.z-ear.z,distance=Math.hypot(dx,dz),near=event.actors.includes(0)?1:Math.max(0,1-distance/65)**2;if(near<=.001)continue;
   const pan=clamp((dx*ear.rightX+dz*ear.rightZ)/10,-1,1),level=(.12+event.severity*.25)*near;
   if(event.kind==='scrape'){const gain=(.025+event.severity*.085)*near;if(t>=this.scrape.until||gain>=this.scrape.level)this.scrape={level:gain,pan,until:t+.14};else this.scrape.until=t+.14;continue;}
   if(this.voices.size>=10)this.releaseVoice(this.voices.values().next().value,true);
   const source=c.createBufferSource(),gain=c.createGain(),panner=c.createStereoPanner?.();source.buffer=this.impactBuffers[event.broken&&event.surface==='masonry'?'masonry':event.severity>.38?'heavy':'light'];source.playbackRate.value=.93+(event.id%13)*.011;gain.gain.value=level;source.connect(gain);if(panner){panner.pan.value=pan;gain.connect(panner);panner.connect(this.master);}else gain.connect(this.master);
   const voice={source,gain,panner};this.voices.add(voice);source.onended=()=>this.releaseVoice(voice);source.start(t);
  }
 }
 releaseVoice(voice,stop=false){if(!voice||!this.voices.delete(voice))return;if(stop)try{voice.source.stop();}catch{}voice.source.disconnect?.();voice.gain.disconnect?.();voice.panner?.disconnect?.();}
 clearContacts(){for(const voice of [...this.voices])this.releaseVoice(voice,true);this.scrape={level:0,pan:0,until:0};if(this.scrapeGain)this.scrapeGain.gain.setTargetAtTime(0,this.context.currentTime,.012);}
 update(car,active,pursuit=null){
  this.active=active;if(!this.context)return;const t=this.context.currentTime;this.master.gain.setTargetAtTime(active?this.volume:0,t,.08);if(!active)this.clearContacts();
  const rpm=1100+(Math.abs(car.speed)%12)/12*4700;this.engine.frequency.setTargetAtTime(rpm/60*2,t,.06);this.engine2.frequency.setTargetAtTime(rpm/60*1.5,t,.06);this.engineGain.gain.setTargetAtTime(car.damage?.wrecked?0:.022+Math.abs(car.speed)/1600,t,.08);this.noiseGain.gain.setTargetAtTime(Math.abs(car.slip)*.3+(car.boosting?.025:0)+Math.abs(car.speed)*.00012,t,.04);this.siren.frequency.setTargetAtTime(850+Math.sin(t*5)*400,t,.03);this.sirenGain.gain.setTargetAtTime(active&&pursuit?Math.max(0,1-pursuit.nearestDistance/160)*.016:0,t,.1);
  this.scrapeGain.gain.setTargetAtTime(active&&t<this.scrape.until?this.scrape.level:0,t,.025);this.scrapePanner?.pan.setTargetAtTime(this.scrape.pan,t,.035);
 }
}
