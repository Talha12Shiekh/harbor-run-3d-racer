// Optional: regenerate circuit and placement inputs after changing the legal track.
// node --loader ./tests/three-resolver.mjs assets-src/prepare_preview.mjs
import {readFile,writeFile} from 'node:fs/promises';
import {createTrack} from '../dist/sim.js';
import {wildernessPlacements} from '../dist/wilderness.js';
const track=createTrack(),root=new URL('./',import.meta.url);
await writeFile(new URL('track.json',root),JSON.stringify({width:track.width,length:track.length,samples:track.samples}));
const manifest=JSON.parse(await readFile(new URL('../dist/assets/wilderness/manifest.json',root),'utf8'));
for(const theme of ['forest','alpine'])await writeFile(new URL('wilderness/'+theme+'-placements.json',root),JSON.stringify(wildernessPlacements(track,manifest,theme)));
console.log('Original circuit/placement data exported.');
