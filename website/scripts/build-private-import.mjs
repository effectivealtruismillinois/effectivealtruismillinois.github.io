import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const columns = {
  subscribers:["email","created_at"],
  donation_clicks:["id","created_at","country","browser","device"],
  site_feedback:["id","message","created_at"],
  event_rsvps:["id","event_date","event_title","event_start","name","name_key","not_on_discord","created_at"],
};
const literal = value => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value !== "string") throw new Error("Unexpected value in exported records.");
  return `CAST(X'${Buffer.from(value,"utf8").toString("hex")}' AS TEXT)`;
};
export function privateImportSql(source, {includeTestData=false}={}) {
  if (!source?.tables || typeof source.tables !== "object") throw new Error("Expected a private export with a tables object.");
  const statements=["-- PRIVATE COMMUNITY DATA: do not commit or upload to GitHub."];
  for (const [table, names] of Object.entries(columns)) {
    const rows=source.tables[table] ?? [];
    if (!Array.isArray(rows)) throw new Error(`Invalid ${table} export.`);
    for (const row of rows) {
      if (!row || typeof row!=="object") throw new Error(`Invalid ${table} row.`);
      if (!includeTestData && (String(row.email??"").endsWith("@example.invalid") || String(row.message??"").startsWith("SITE QA TEST") || String(row.name??"").startsWith("SITE QA TEST"))) continue;
      const present=names.filter(name=>row[name]!==undefined);
      if (!present.length) throw new Error(`Empty ${table} row.`);
      statements.push(`INSERT INTO "${table}" (${present.map(n=>`"${n}"`).join(", ")}) VALUES (${present.map(n=>literal(row[n])).join(", ")}) ON CONFLICT DO NOTHING;`);
    }
  }
  return statements.join("\n")+"\n";
}
if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const input=process.argv[2]; if (!input) throw new Error("Usage: node scripts/build-private-import.mjs <private-export.json>");
    const source=JSON.parse(fs.readFileSync(input,"utf8"));
    const sql=privateImportSql(source);
    fs.mkdirSync(".private",{recursive:true});
    fs.writeFileSync(".private/import.private.sql",sql);
    console.log("Prepared .private/import.private.sql. Review/import privately; no data was uploaded or printed.");
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
