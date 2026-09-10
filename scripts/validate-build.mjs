import fs from "node:fs";import path from "node:path";
const root=process.cwd();const html=fs.readFileSync(path.join(root,"public","index.html"),"utf8");
const config=await import(path.join(root,"config","state.js"));
const state=config.default||config;
const failures=[];
if(!html.includes(state.canonical))failures.push("canonical missing");
if(!html.includes(`Northern Lights ${state.name} Tonight`))failures.push("state title missing");
if(!html.includes("Viewing score"))failures.push("viewing score label missing");
if(!fs.existsSync(path.join(root,"api","aurora.js")))failures.push("api missing");
if(failures.length){console.error(failures.join("\n"));process.exit(1);}
console.log(`Validated ${state.name} Aurora build: ${html.length} bytes`);
