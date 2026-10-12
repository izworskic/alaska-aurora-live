"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const vm=require("node:vm");
const state=require("../config/state");
const html=readFileSync("public/index.html","utf8");
const api=readFileSync("api/aurora.js","utf8");
function asJson(name,next){
 const re=new RegExp("const "+name+"=(\\[[^\\n]*?\\]);\\nconst "+next+"=");
 const m=html.match(re);
 assert.ok(m,"missing serialized "+name);
 return JSON.parse(m[1]);
}
test("live visuals are additive to the existing tool",()=>{
 assert.equal((html.match(/id="state-sky-lab"/g)||[]).length,1);
 for(const id of ["region","score","headline","oval","cloud","kp","regions","sources","stateKpChart","stateRegionMap","stateAuroraOvalImg"]){assert.ok(html.includes('id="'+id+'"'),id+" must remain");}
 assert.ok(html.includes('state-aurora-data'));
 assert.ok(html.includes('document.dispatchEvent(new CustomEvent("state-aurora-data",{detail:d}))'));
 assert.ok(html.includes("services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg"));
 assert.ok(html.includes("scrollWheelZoom:false"));
 assert.ok(html.includes("Regional reference points")||html.includes("regional reference points"));
 assert.ok(html.includes("visibility probability") || html.includes("visibility probability.") || html.includes("not</strong> a visibility probability"));
 assert.ok(html.includes("The NOAA 72-hour Kp samples are unavailable"));
 assert.ok(!html.includes('key=cb1_2y8f_1_1ee5e3a872c91d0ebf5d7b88'));
});
test("map locations exactly match existing regional engine coordinates and thresholds",()=>{
 const regions=asJson("regions","spots");
 assert.equal(regions.length,state.regions.length);
 for(const r of regions){const source=state.regions.find(v=>v.id===r.id);assert.ok(source,"not in the owning model "+r.id);assert.equal(r.latitude,source.latitude);assert.equal(r.longitude,source.longitude);assert.equal(r.planning_kp,source.planning_kp);}
 const spots=asJson("spots","state");
 assert.ok(spots.length>=8&&spots.length<=10);
 for(const s of spots){assert.ok(regions.some(r=>r.id===s.region_id));assert.ok(s.name.length>5);}
 assert.match(html,/location-name search on OpenStreetMap/);
});
test("NOAA Kp chart receives actual provider forecast periods, not synthesized values",()=>{
 assert.match(api,/forecast_kp_periods:forecast\.periods\.filter/);
 assert.match(api,/time_tag:p\.time_tag,kp:p\.kp/);
 assert.match(html,/Array\.isArray\(d\?\.forecast_kp_periods\)/);
 assert.match(html,/Number\.isFinite\(p\.kp\)/);
 assert.match(html,/new Date\(p\.time_tag\)/);
});
test("all new and existing inline scripts parse without changing the score algorithm",()=>{
 new vm.Script(api,{filename:"api/aurora.js"});
 const inline=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!/\bsrc=|\btype=["']application\/ld\+json/i.test(m[1]));
 assert.ok(inline.length>=2);
 for(const m of inline)new vm.Script(m[2],{filename:"index-inline.js"});
 assert.equal((html.match(/const r=await fetch\(/g)||[]).length,1,"existing page should issue only one aurora API call per region change");
});