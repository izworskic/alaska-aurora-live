const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");
const state=require("../config/state.js");
const locations=require("../config/seo-locations.js");
const generator=fs.readFileSync("scripts/generate-location-pages.mjs","utf8");
test("every currently published aurora location gets one visual experience from the generator",async()=>{
 const {locationVisualCSS,locationVisualHead,renderLocationVisuals,locationVisualScript}=await import("../scripts/aurora-location-visuals.mjs");
 assert.ok(locations.length>=3);
 assert.ok(generator.includes("${renderLocationVisuals(l,r,state)}"),"visuals must be emitted for every location");
 assert.ok(generator.includes("${locationVisualScript(l,r,state,locations)}"),"each location must get live chart/map renderer");
 assert.ok(generator.includes("aurora-location-live-data"),"reuse current region API response");
 assert.ok(generator.includes("aurora-location-live-error"),"preserve truth if API fails");
 assert.ok(generator.includes("${locationVisualCSS}"),"generated page must include styles");
 assert.ok(generator.includes("${locationVisualHead}"));
 assert.ok(!locationVisualCSS.includes("basemaps.cartocdn.com"));
 assert.ok(locationVisualHead.includes("maplibre-gl@5.6.1"));
 for(const l of locations){
  const r=state.regions.find(x=>x.id===l.region_id);
  assert.ok(r,"unknown forecast region for "+l.slug);
  const section=renderLocationVisuals(l,r,state);
  const scripts=locationVisualScript(l,r,state,locations);
  assert.ok(section.includes(l.name));
  for(const key of ["id=\"loc-aurora-map\"","id=\"loc-noaa-oval\"","id=\"loc-kp-chart\"","services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg","Maptoolkit"]){assert.ok(section.includes(key),"missing "+key+" for "+l.slug)}
  assert.ok(section.includes("Kp "+r.planning_kp),"Kp must come from local engine");
  assert.ok(scripts.includes("styles.maptoolkit.org/dark.json"));
  assert.ok(scripts.includes("tile.openstreetmap.org"));
  assert.ok(scripts.includes('"selected":"'+l.region_id+'"'));
  assert.ok(!scripts.includes("basemaps.cartocdn.com"));
  assert.ok(scripts.includes("forecast_kp_periods"),"data must come from original NOAA API periods");
  const inline=[...scripts.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean);
  assert.equal(inline.length,1);
  assert.doesNotThrow(()=>new vm.Script(inline[0],{filename:l.slug+".js"}));
 }
});
