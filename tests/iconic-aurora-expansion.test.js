"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs");
const state=require("../config/state.js"),old=require("../config/seo-locations.js"),added=require("../config/seo-locations-expansion.js");
const generator=fs.readFileSync("scripts/generate-location-pages.mjs","utf8");
const all=[...old,...added];
test("iconic destinations have distinct source-supported intentions, complete local field guidance and a valid region",()=>{
 assert.ok(added.length>=4);
 assert.equal(new Set(all.map(x=>x.slug)).size,all.length,"a slug was duplicated");
 for(const l of added){
  assert.match(l.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(l.name.length>5&&l.context.length>=145&&l.decision_note.length>=140,l.slug+" needs unique content");
  assert.ok(l.field_notes?.sky?.length>=90&&l.field_notes?.decision?.length>=95&&l.field_notes?.access?.length>=90,l.slug+" needs genuine local decision depth");
  assert.ok(l.viewing_sites?.length>=3,l.slug+" needs three researched locations");
  assert.ok(l.sources?.length>=1&&l.sources.every(s=>String(s.url).startsWith("https://")&&s.label.length>8),l.slug+" requires cited real sources");
  assert.ok(state.regions.some(r=>r.id===l.region_id),l.slug+" uses an unsupported model region");
  assert.ok(l.short_card.length>=65&&l.meta_description.length>=85);
 }
});
test("generator keeps all prior pages, their URLs, the shared visual tools, official sources and author identity",()=>{
 assert.match(generator,/locations=\[\.\.\.require\('\.\.\/config\/seo-locations\.js'\),\.\.\.require\('\.\.\/config\/seo-locations-expansion\.js'\)\]/);
 assert.ok(generator.includes("${researchedFieldGuide(l,r)}"));
 assert.ok(generator.includes("forecast coverage:")||generator.includes("Forecast coverage:"));
 assert.ok(generator.includes("conditions at a lake")||generator.includes("Conditions at a lake"));
 assert.ok(generator.includes('https://chrisizworski.com/#person'));
 assert.ok(generator.includes('https://chrisizworski.com/chris-izworski/'));
 assert.ok(generator.includes("${renderLocationVisuals(l,r,state)}"));
 assert.ok(generator.includes("${locationVisualScript(l,r,state,locations)}"));
 assert.ok(generator.includes("aurora-location-live-data"));
 assert.ok(generator.includes("const REGION=${json(r.id)}"));
});
