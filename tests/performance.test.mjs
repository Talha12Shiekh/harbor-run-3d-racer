import test from 'node:test';
import assert from 'node:assert/strict';
import {FrameStats} from '../dist/performance.js';
const feed=(stats,ms,count,ratio=1.5,auto=true,max=1.5)=>{const changes=[];for(let i=0;i<count;i++){const next=stats.observe(ms,true,auto,ratio,max);if(next!==null){changes.push(next);ratio=next;}}return {ratio,changes};};
test('AC-28 Auto waits for sustained low FPS and keeps its resolution bounds',()=>{
 const s=new FrameStats();assert.deepEqual(feed(s,40,50).changes,[]);const down=feed(s,40,25);assert.equal(down.ratio,1.35);assert.equal(s.fps,25);const lower=feed(s,40,900,1.35);assert.equal(lower.ratio,.65);assert.ok(lower.changes.every(v=>v>=.65&&v<=1.5));
});
test('AC-28 Auto restores quality slowly and respects the device cap',()=>{
 const s=new FrameStats();const result=feed(s,16,63*8,.8,true,1);assert.deepEqual(result.changes,[.9]);const next=feed(s,16,63*24,.9,true,1);assert.equal(next.ratio,1);assert.ok(next.changes.every(v=>v<=1));
});
test('AC-28 Fixed modes and inactive or hidden frames cannot tune quality',()=>{
 const s=new FrameStats();assert.deepEqual(feed(s,40,500,1.5,false).changes,[]);s.observe(20,false,true,1.5,1.5);assert.equal(s.slowWindows,0);feed(s,40,50);s.observe(1000,true,true,1.5,1.5);assert.equal(s.slowWindows,0);assert.deepEqual(feed(s,40,25).changes,[]);for(const invalid of [0,-1,NaN,Infinity])assert.equal(s.observe(invalid,true,true,1.5,1.5),null);
});
