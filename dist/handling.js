// Original arcade balance. These are game values, not real vehicle specifications.
const setup=(values)=>Object.freeze(values);
export const HANDLING=Object.freeze({
 hypercar:setup({character:'Precise at speed. Strong brakes. Modest drift.',acceleration:17.8,topSpeed:67,boostSpeed:83,brakes:30,steerLow:.46,steerHigh:.14,steerRate:9,grip:8,drift:.23,mass:1250,coast:.7,drag:.0026,wheelbase:2.7,powerSlip:.025,boostAcceleration:23}),
 spyder:setup({character:'Quick steering. Playful rear grip. Easy to rotate.',acceleration:16.3,topSpeed:62,boostSpeed:78,brakes:28,steerLow:.52,steerHigh:.17,steerRate:11,grip:6.6,drift:.34,mass:1370,coast:.78,drag:.0028,wheelbase:2.58,powerSlip:.05,boostAcceleration:22}),
 interceptor:setup({character:'Stable and planted. Heavy impact. Strong braking.',acceleration:15.6,topSpeed:65,boostSpeed:81,brakes:31,steerLow:.45,steerHigh:.135,steerRate:8,grip:8.5,drift:.22,mass:1550,coast:.82,drag:.0025,wheelbase:2.8,powerSlip:.02,boostAcceleration:22}),
 rally:setup({character:'Fast response. High grip. Lower straight line speed.',acceleration:18.2,topSpeed:55,boostSpeed:70,brakes:29,steerLow:.57,steerHigh:.19,steerRate:13,grip:11,drift:.18,mass:1400,coast:.85,drag:.0034,wheelbase:2.6,powerSlip:.015,boostAcceleration:20}),
 muscle:setup({character:'Hard launch. Slower steering. Loose, powerful rear.',acceleration:19.4,topSpeed:63,boostSpeed:80,brakes:24,steerLow:.43,steerHigh:.12,steerRate:7,grip:4.5,drift:.40,mass:1670,coast:.9,drag:.0031,wheelbase:2.82,powerSlip:.09,boostAcceleration:24})
});
export const getHandling=id=>HANDLING[id]??HANDLING.hypercar;
export function wheelSteering(car){const h=getHandling(car.vehicle),ratio=Math.min(Math.abs(car.speed)/h.topSpeed,1);return (h.steerLow+(h.steerHigh-h.steerLow)*ratio)*car.steer*(car.breakingTime?1.2:1);}
