// Measures real animation-frame intervals. Renderer counters are added by World.
export class FrameStats{
 constructor(){this.fps=0;this.frames=0;this.milliseconds=0;this.slowWindows=0;this.fastWindows=0;}
 reset(){this.frames=0;this.milliseconds=0;this.slowWindows=0;this.fastWindows=0;}
 observe(ms,active,auto,ratio,maxRatio){
  if(!active||!Number.isFinite(ms)||ms<=0||ms>500){this.reset();return null;}
  this.frames++;this.milliseconds+=ms;if(this.milliseconds<1000)return null;
  this.fps=this.frames*1000/this.milliseconds;this.frames=0;this.milliseconds=0;
  this.slowWindows=this.fps<45?this.slowWindows+1:0;this.fastWindows=this.fps>58?this.fastWindows+1:0;
  if(!auto)return null;
  if(this.slowWindows>=3&&ratio>.65){this.slowWindows=0;this.fastWindows=0;return Math.max(.65,+(ratio-.15).toFixed(2));}
  if(this.fastWindows>=8&&ratio<maxRatio){this.fastWindows=0;this.slowWindows=0;return Math.min(maxRatio,+(ratio+.10).toFixed(2));}
  return null;
 }
}
