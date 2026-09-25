// Vérifie les traductions : mêmes clés en français et en anglais, et toutes les clés t("…") du code définies.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const load = (lang) => import(path.join(root, "i18n", `${lang}.js`)).then((m) => m.default);
const [fr, en] = await Promise.all([load("fr"), load("en")]);
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
const F = new Set(flat(fr));
const E = new Set(flat(en));
const errors = [];
for (const k of F) if (!E.has(k)) errors.push(`missing in en: ${k}`);
for (const k of E) if (!F.has(k)) errors.push(`missing in fr: ${k}`);
const has = (k) => F.has(k) || F.has(`${k}_one`);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.jsx?$/.test(e.name) ? [path.join(d, e.name)] : []));
for (const f of walk(root)) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(/\bt\("([a-zA-Z0-9_.]+)"/g)) if (!has(m[1])) errors.push(`undefined key ${m[1]} (${path.relative(root, f)})`);
}
if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
}
console.log(`i18n OK: ${F.size} keys`);
