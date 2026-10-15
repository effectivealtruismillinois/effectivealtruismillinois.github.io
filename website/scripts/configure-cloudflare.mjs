import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function standaloneConfig(built, {databaseId, accountId, calendarId, workerName="eaillinois-site", databaseName="eaillinois-community"}) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(databaseId ?? "") || databaseId === "00000000-0000-4000-8000-000000000000") throw new Error("Pass the real database UUID returned by wrangler d1 create using --database-id.");
  if (accountId && !/^[0-9a-f]{32}$/i.test(accountId)) throw new Error("Invalid Cloudflare account ID.");
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(workerName)) throw new Error("Invalid Worker name.");
  if (!/^[\w.@#-]{1,299}$/.test(calendarId ?? "")) throw new Error("Pass --calendar-id or set EVENTS_CALENDAR_ID.");
  return {
    ...built,
    name: workerName,
    ...(accountId ? {account_id:accountId} : {}),
    main: "../dist/server/index.js",
    assets: {...built.assets, directory:"../dist/client"},
    d1_databases: [{binding:"DB",database_name:databaseName,database_id:databaseId,migrations_dir:"../drizzle"}],
    vars: {...built.vars, EVENTS_CALENDAR_ID:calendarId},
    observability: {enabled:false},
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2), options = {};
    for (let i=0;i<args.length;i+=2) {
      if (!args[i]?.startsWith("--") || !args[i+1] || args[i+1].startsWith("--")) throw new Error("Expected named options such as --database-id <UUID>.");
      options[args[i].slice(2)] = args[i+1];
    }
    const built = JSON.parse(fs.readFileSync("dist/server/wrangler.json", "utf8"));
    const config = standaloneConfig(built, {
      databaseId:options["database-id"], accountId:options["account-id"], workerName:options["worker-name"], databaseName:options["database-name"],
      calendarId:options["calendar-id"] ?? process.env.EVENTS_CALENDAR_ID,
    });
    fs.mkdirSync(".cloudflare", {recursive:true});
    fs.writeFileSync(".cloudflare/deploy.json", JSON.stringify(config,null,2)+"\n");
    console.log(`Prepared .cloudflare/deploy.json for ${config.name}. No deployment or DNS change was made.`);
  } catch (error) { console.error(error.message); process.exitCode=1; }
}
