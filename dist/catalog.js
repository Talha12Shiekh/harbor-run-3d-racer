// Descriptions are body styles, not simulated performance ratings.
export const VEHICLES=Object.freeze([
 {id:'hypercar',name:'Apex H1',type:'Mid engine hypercar',detail:'A low canopy, sculpted flanks and an elevated aero wing. Built to own the next turn.',paint:'#3446c7',number:'01',layout:'MID ENGINE',roof:'CLOSED COCKPIT'},
 {id:'spyder',name:'Strada S2',type:'Open road spyder',detail:'Open cockpit, twin roll hoops and sweeping rear fairings. Take the scenic line.',paint:'#b72227',number:'02',layout:'MID ENGINE',roof:'OPEN COCKPIT'},
 {id:'interceptor',name:'Sentinel I3',type:'Road interceptor',detail:'Rounded bodywork, a horseshoe grille and a police lightbar. A different side of the highway.',paint:'#28343d',number:'03',layout:'MID ENGINE',roof:'LIGHTBAR'},
 {id:'rally',name:'Kestrel R4',type:'Four door rally sedan',detail:'Angular projectors, red five spoke wheels, four doors and a tall rear wing. Rally bred street presence.',paint:'#c59626',number:'04',layout:'FRONT ENGINE',roof:'FOUR DOORS'},
 {id:'muscle',name:'Vanguard M5',type:'Muscle coupe',detail:'A long hood, twin round lamps and broad shoulders. Classic muscle with a modern stance.',paint:'#1c6274',number:'05',layout:'FRONT ENGINE',roof:'TWO DOOR COUPE'}
]);
export const SETTINGS=Object.freeze([
 {id:'forest',name:'Redwood Ridge',tag:'WET FOREST',description:'Damp asphalt. Tall conifers. Cool daylight.',image:'forest'},
 {id:'alpine',name:'Summit Pass',tag:'SNOW COUNTRY',description:'Snow dusted pines. Granite peaks. Open skies.',image:'alpine'},
 {id:'night',name:'Midnight Run',tag:'AFTER DARK',description:'Moonlight. Warm road lamps. Headlights ahead.',image:'night'}
]);
export const vehicleInfo=id=>VEHICLES.find(v=>v.id===id)??VEHICLES[0];
export const settingInfo=id=>SETTINGS.find(s=>s.id===id)??SETTINGS[0];
export const hasVehicle=id=>VEHICLES.some(v=>v.id===id);
export const hasSetting=id=>SETTINGS.some(s=>s.id===id);
export const garageAngle=value=>['orbit','front','rear','left','right','angle'].includes(value)?value:'orbit';
export const onboardingScreen=profile=>profile.onboardingVersion>=1?'menu':'briefing';
