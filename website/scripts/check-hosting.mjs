import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {standaloneConfig} from './configure-cloudflare.mjs';
import {privateImportSql} from './build-private-import.mjs';

const options={databaseId:'12345678-1234-4321-8321-123456789abc',calendarId:'calendar@group.calendar.google.com'};
const config=standaloneConfig({main:'index.js',assets:{directory:'../client'},vars:{},d1_databases:[]},options);
assert.equal(config.main,'../dist/server/index.js');
assert.equal(config.assets.directory,'../dist/client');
assert.equal(config.d1_databases[0].database_id,options.databaseId);
assert.equal(config.d1_databases[0].migrations_dir,'../drizzle');
assert.equal(config.vars.EVENTS_CALENDAR_ID,options.calendarId);
assert.throws(()=>standaloneConfig({}, {...options,databaseId:'00000000-0000-4000-8000-000000000000'}));
assert.throws(()=>standaloneConfig({}, {...options,accountId:'invalid'}));
assert.throws(()=>standaloneConfig({}, {...options,calendarId:''}));

const db=new DatabaseSync(':memory:');
for(const file of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort()) db.exec(fs.readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
const message="Apostrophe ' and <script>text</script> 🦐";
const sql=privateImportSql({tables:{
  subscribers:[{email:'site-check@example.invalid'}],
  site_feedback:[{id:'test-feedback',message},{id:'exclude-qa',message:'SITE QA TEST ignore'}],
  event_rsvps:[{id:'test-rsvp',event_date:'2026-10-18',event_title:'Lunch',event_start:'2026-10-18T18:00:00.000Z',name:"O'Brien",name_key:"o'brien",not_on_discord:true}],
}});
db.exec(sql); db.exec(sql);
assert.equal(db.prepare('SELECT count(*) AS n FROM subscribers').get().n,0);
assert.equal(db.prepare('SELECT count(*) AS n FROM site_feedback').get().n,1);
assert.equal(db.prepare('SELECT message FROM site_feedback').get().message,message);
assert.equal(db.prepare('SELECT name, not_on_discord FROM event_rsvps').get().name,"O'Brien");
assert.equal(db.prepare('SELECT not_on_discord FROM event_rsvps').get().not_on_discord,1);
assert.throws(()=>privateImportSql({tables:{site_feedback:[{id:{}}]}}));
db.close();
console.log('PASS: standalone Cloudflare configuration, migration import, Unicode/quotes, test-data exclusion, and replay safety.');
