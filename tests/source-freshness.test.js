const test=require('node:test');
const assert=require('node:assert/strict');
const {sourceTimeFresh,ovationFresh}=require('../api/aurora')._test;
const now=Date.parse('2026-10-11T00:00:00Z');
test('NOAA source freshness enforces real observation time instead of fetch time',()=>{
 assert.equal(sourceTimeFresh(new Date(now-2*3600000).toISOString(),6*3600000,now),true);
 assert.equal(sourceTimeFresh(new Date(now-7*3600000).toISOString(),6*3600000,now),false);
 assert.equal(sourceTimeFresh(new Date(now+20*60000).toISOString(),6*3600000,now),false);
 assert.equal(sourceTimeFresh(null,6*3600000,now),false);
});
test('OVATION requires recent observation and valid forward forecast',()=>{
 assert.equal(ovationFresh({observation_time:now-15*60000,forecast_time:now+25*60000},now),true);
 assert.equal(ovationFresh({observation_time:now-3*3600000,forecast_time:now+25*60000},now),false);
 assert.equal(ovationFresh({observation_time:now,forecast_time:now+3*3600000},now),false);
});
