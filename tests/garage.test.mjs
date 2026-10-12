import test from 'node:test';
import assert from 'node:assert/strict';
import {validateProfile} from '../dist/sim.js';
import {VEHICLES,SETTINGS,onboardingScreen,garageAngle} from '../dist/catalog.js';
test('AC-21 all five bodies and all three settings survive reload with paint and records',()=>{
 for(const car of VEHICLES)for(const setting of SETTINGS){const saved={vehicle:car.id,environment:setting.id,paint:'#c59626',onboardingVersion:1,records:{lap:74,race:161}};const profile=validateProfile(JSON.parse(JSON.stringify(saved)));assert.equal(profile.vehicle,car.id);assert.equal(profile.environment,setting.id);assert.equal(profile.paint,saved.paint);assert.deepEqual(profile.records,saved.records);assert.equal(profile.onboardingVersion,1);}
});
test('AC-22 first visit briefing can be skipped and stays completed on reload',()=>{
 const first=validateProfile(null);assert.equal(onboardingScreen(first),'briefing');first.onboardingVersion=1;const returning=validateProfile(JSON.parse(JSON.stringify(first)));assert.equal(onboardingScreen(returning),'menu');assert.equal(onboardingScreen(validateProfile({onboardingVersion:999})),'briefing');
});
test('AC-21 invalid saved choices preserve valid legacy finishes and best times',()=>{
 const profile=validateProfile({vehicle:'downloaded-car',environment:'bad',paint:'#c59626',records:{lap:83,race:185},onboardingVersion:'yes'});assert.equal(profile.vehicle,'hypercar');assert.equal(profile.environment,'forest');assert.equal(profile.paint,'#c59626');assert.deepEqual(profile.records,{lap:83,race:185});assert.equal(profile.onboardingVersion,0);assert.equal(garageAngle('unsafe'),'orbit');
});
