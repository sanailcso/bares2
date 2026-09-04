import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const html = read("index.html");
const js = read("assets/app.js");
const sw = read("sw.js");
const migration = read("supabase/migrations/20260904100000_operational_pilot.sql");

assert.match(html, /assets\/app\.css/);
assert.match(html, /assets\/app\.js/);
assert.doesNotMatch(html, /<style(?:\s|>)/i);
assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)/i);
assert.match(sw, /assets\/app\.css/);
assert.match(sw, /assets\/app\.js/);
assert.doesNotMatch(js, /\.pass\s*=\s*(?:n|np|pass)\b/);
assert.doesNotMatch(js, /pass\s*:\s*pass\b/);
assert.match(js, /configWithoutSecrets/);
assert.match(js, /state\.points = prev \+ Math\.max\(1,/);
assert.doesNotMatch(js, /state\.points = prev - stake/);
assert.match(migration, /v_after:=v_player\.points\+v_gain/);
assert.match(migration, /source in \('manual','external'\)/);
assert.match(migration, /notify_redemption_push/);
assert.match(migration, /tikitaka-daily-push/);

for (const path of ["assetlinks.json", "twa/assetlinks.json", "twa-manifest.json", "twa/twa-manifest.json"]) JSON.parse(read(path));
console.log("Comprobaciones de calidad superadas");
