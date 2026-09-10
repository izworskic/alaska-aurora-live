const test=require("node:test");const assert=require("node:assert/strict");
const A=require("../lib/aurora");const S=require("../config/state");
test("state config is valid",()=>{
  assert.ok(S.name&&S.slug&&S.canonical);assert.ok(S.regions.length>=5);
  assert.equal(new Set(S.regions.map(r=>r.id)).size,S.regions.length);
  assert.ok(S.regions.some(r=>r.id===S.default_region));
  for(const r of S.regions){assert.ok(r.latitude>=-90&&r.latitude<=90);assert.ok(r.longitude>=-180&&r.longitude<=180);assert.ok(r.planning_kp>=0&&r.planning_kp<=9);}
  assert.match(S.canonical,new RegExp(`/national-tools/aurora/${S.slug}/$`));
});
test("missing numbers stay null",()=>assert.equal(A.number(undefined),null));
test("score clamps and respects darkness",()=>{
 const region={planning_kp:4};
 assert.equal(A.viewingScore({region,ovation:20,peakKp:9,cloud:0,hasDarkness:true,moon:0,bz:-10,speed:800}).score,100);
 assert.equal(A.viewingScore({region,ovation:10,peakKp:5,cloud:20,hasDarkness:false,moon:0,bz:-5,speed:500}).score,null);
 assert.equal(A.viewingScore({region,ovation:null,peakKp:null,cloud:0,hasDarkness:true,moon:0,bz:null,speed:null}).score,null);
});
test("Kp parser handles header row",()=>{const now=Date.parse("2026-09-09T00:00:00Z");const p=A.parseKpForecast([["time_tag","kp","observed","noaa_scale"],["2026-09-09 03:00:00","5","predicted","G1"]],now);assert.equal(p.peak_24h,5);});
test("OVATION normalizes west longitude",()=>{const o=A.parseOvation({"Forecast Time":"2026-09-09T01:00:00Z",coordinates:[[260,48,12]]});assert.equal(o.valueAt(48,-100),12);});
test("sky cover parses intervals",()=>{const now=Date.parse("2026-09-09T00:00:00Z");const s=A.parseSkyCover({properties:{skyCover:{values:[{validTime:"2026-09-09T01:00:00+00:00/PT3H",value:25}]}}},now);assert.equal(s.periods[0].percent,25);});
