// Original collision waveforms. No game recordings or remote audio requests.
export function impactSamples(sampleRate,kind='heavy'){
 const duration=kind==='scrape'?.4:kind==='light'?.32:kind==='masonry'?.9:.78,length=Math.max(1,Math.round(sampleRate*duration)),data=new Float32Array(length);let seed=kind==='light'?743:kind==='scrape'?173:kind==='masonry'?839:971,low=0,peak=0;
 const noise=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/2147483648-1;};
 for(let i=0;i<length;i++){
  const t=i/sampleRate,n=noise();low+=.12*(n-low);let value;
  if(kind==='scrape'){
   const modulation=.65+.2*Math.sin(t*2*Math.PI*37)+.15*Math.sin(t*2*Math.PI*73);value=(n-low)*modulation*.42+Math.sin(t*2*Math.PI*617)*Math.sin(t*2*Math.PI*41)*.07;
   // Crossfade the loop boundary to avoid a hard click.
   value*=Math.min(1,t/.015,(duration-t)/.015);
  }else if(kind==='masonry'){
   const attack=Math.min(1,t/.002),thud=Math.sin(t*2*Math.PI*48)*Math.exp(-t/.065),crunch=(n-low)*Math.exp(-t/.14);let rubble=0;for(const delay of [.07,.12,.19,.31,.43,.55]){const age=t-delay;if(age>=0)rubble+=(n*.7+Math.sin(age*2*Math.PI*(740+delay*1900))*.3)*Math.exp(-age/.025);}value=attack*(thud*.5+crunch*.65+rubble*.25)*Math.min(1,(duration-t)/.025);
  }else{
   const heavy=kind==='heavy',attack=Math.min(1,t/.002),thud=Math.sin(2*Math.PI*(heavy?55:110)*t)*Math.exp(-t/(heavy?.075:.035));
   const crunch=(n*.6+low*.4)*Math.exp(-t/(heavy?.09:.034));
   const ring=(Math.sin(t*2*Math.PI*173)*.20+Math.sin(t*2*Math.PI*431)*.15+Math.sin(t*2*Math.PI*937)*.07)*Math.exp(-t/(heavy?.18:.07));
   let fragments=0;if(heavy)for(const delay of [.055,.092,.17,.25]){const age=t-delay;if(age>=0)fragments+=(n*.35+Math.sin(age*2*Math.PI*(1650+delay*5000))*.2)*Math.exp(-age/.012);}
   value=attack*(thud*.42+crunch*.72+ring+fragments*.18)*Math.min(1,(duration-t)/.025);
  }
  data[i]=value;peak=Math.max(peak,Math.abs(value));
 }
 const scale=.9/Math.max(.9,peak);for(let i=0;i<length;i++)data[i]*=scale;return data;
}
