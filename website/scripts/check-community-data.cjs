const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const db = new DatabaseSync(':memory:');
for (const file of fs.readdirSync(path.join(root, 'drizzle')).filter(f => f.endsWith('.sql')).sort()) db.exec(fs.readFileSync(path.join(root, 'drizzle', file), 'utf8'));
const DB = {
  prepare(sql) {
    let values = [];
    return { bind(...args) { values = args; return this; }, run() { const result=db.prepare(sql).run(...values); return {...result,meta:{changes:Number(result.changes)}}; }, first() { return db.prepare(sql).get(...values)??null; } };
  },
  batch(statements) {
    db.exec('BEGIN');
    try { const results = statements.map(s => s.run()); db.exec('COMMIT'); return results; }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  },
};
const env = { DB };
const loaded = new Map();
function load(file, globals = {}) {
  file = file.replace(/\\/g, '/');
  if (loaded.has(file) && !Object.keys(globals).length) return loaded.get(file);
  const full = path.resolve(root, file), exports = {};
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports, Request, Response, URL, console, ...globals, require(name) {
    if (name === 'cloudflare:workers') return { env };
    return load(path.relative(root, path.resolve(path.dirname(full), name)) + '.ts');
  } };
  vm.runInNewContext(code, context, { filename: full });
  if (!Object.keys(globals).length) loaded.set(file, exports);
  return exports;
}
const analytics = load('lib/donation-analytics.ts');
const donation = load('app/api/donation-click/route.ts');
const feedback = load('app/api/feedback/route.ts');
const calendarLinks = load('app/calendar-links.ts');
let calendarFails = false;
const testEvents = [
  {id:'old-calendar-id/1',title:'Community lunch',start:'2026-10-18T18:00:00.000Z',end:'2026-10-18T20:00:00.000Z',allDay:false,location:'SCD',description:''},
  {id:'old-calendar-id/2',title:'Next community lunch',start:'2026-10-25T18:00:00.000Z',end:'2026-10-25T20:00:00.000Z',allDay:false,location:'SCD',description:''},
];
loaded.set('lib/public-calendar.ts', { publicCalendar:async()=>{if(calendarFails)throw new Error('Offline');return {calendarId:'public-calendar',events:testEvents};} });
const rsvp = load('app/api/rsvp/route.ts');
const origin = 'https://community.example';
function request(route, data, headers = {}) {
  return new Request(origin + route, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: typeof data === 'string' ? data : JSON.stringify(data) });
}
async function main() {
  const id = randomUUID();
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36';
  const click = () => request('/api/donation-click', { id, email: 'must-not-be-saved@example.invalid' }, { 'user-agent': ua, 'cf-ipcountry': 'US', 'cf-connecting-ip': '192.0.2.1', cookie: 'visitor=do-not-save' });
  assert.equal((await donation.POST(click())).status, 204);
  assert.equal((await donation.POST(click())).status, 204);
  let rows = db.prepare('SELECT * FROM donation_clicks').all();
  assert.equal(rows.length, 1, 'Replay of a click must not increment the count');
  assert.deepEqual(Object.keys(rows[0]).sort(), ['browser', 'country', 'created_at', 'device', 'id']);
  assert.equal(rows[0].country, 'US'); assert.equal(rows[0].browser, 'Chrome'); assert.equal(rows[0].device, 'Desktop');
  assert.match(rows[0].created_at, /^\d{4}-\d{2}-\d{2} \d{2}:00:00$/, 'Click timestamps must be rounded to the hour');
  assert(!JSON.stringify(rows).includes('192.0.2.1') && !JSON.stringify(rows).includes('visitor=') && !JSON.stringify(rows).includes('must-not-be-saved'));
  for (const headers of [{ dnt: '1' }, { 'sec-gpc': '1' }, { 'user-agent': 'ExampleCrawler/1.0' }]) {
    const result = await donation.POST(request('/api/donation-click', { id: randomUUID() }, headers));
    assert.equal(result.status, 204); assert.equal(result.headers.get('set-cookie'), null);
  }
  assert.equal(db.prepare('SELECT count(*) AS n FROM donation_clicks').get().n, 1);
  assert.equal((await donation.POST(request('/api/donation-click', { id: randomUUID() }, { origin: 'https://elsewhere.example' }))).status, 403);
  assert.equal((await donation.POST(request('/api/donation-click', { id: 'not-an-event' }))).status, 400);
  assert.equal((await donation.POST(request('/api/donation-click', '{'))).status, 400);
  db.exec("INSERT INTO donation_clicks (id, created_at) VALUES ('old-test', datetime('now', '-91 days'))");
  await donation.POST(request('/api/donation-click', { id: randomUUID() }));
  assert.equal(db.prepare("SELECT count(*) AS n FROM donation_clicks WHERE id='old-test'").get().n, 0);
  const safari = analytics.donationMetadata(request('/x', {}, { 'user-agent': 'Mozilla/5.0 (iPhone) Version/18.0 Mobile/15E Safari/604.1', 'cf-ipcountry': 'XX' }));
  assert.equal(safari.browser, 'Safari'); assert.equal(safari.device, 'Mobile'); assert.equal(safari.country, 'Unknown');
  const edge = analytics.donationMetadata(request('/x', {}, { 'user-agent': ua + ' Edg/130.0' }));
  assert.equal(edge.browser, 'Edge');

  const feedbackId = randomUUID(), text = '  Local test: multiline feedback\nwith <literal text> and shrimp 🦐.  ';
  for (let n = 0; n < 2; n++) assert.equal((await feedback.POST(request('/api/feedback', { id: feedbackId, message: text }))).status, 201);
  const saved = db.prepare('SELECT * FROM site_feedback').all();
  assert.equal(saved.length, 1, 'Retry must not duplicate submitted feedback'); assert.equal(saved[0].message, text.trim());
  for (const message of ['', '   ', 'x'.repeat(2001)]) assert.equal((await feedback.POST(request('/api/feedback', { id: randomUUID(), message }))).status, 400);
  assert.equal((await feedback.POST(request('/api/feedback', { id: randomUUID(), message: 'x' }, { origin: 'https://elsewhere.example' }))).status, 403);
  assert.equal((await feedback.POST(request('/api/feedback', '{'))).status, 400);
  assert.equal((await feedback.POST(request('/api/feedback', { website: 'spam', message: 'spam' }))).status, 200);
  assert.equal(db.prepare('SELECT count(*) AS n FROM site_feedback').get().n, 1);
  env.DB = undefined;
  assert.equal((await feedback.POST(request('/api/feedback', { id: randomUUID(), message: 'failure test' }))).status, 503);
  env.DB = DB;

  let now = 0, calls = [];
  const tracker = load('app/donation-tracking.ts', { performance: { now: () => now }, crypto: { randomUUID }, fetch: (...args) => { calls.push(args); return Promise.resolve(); } });
  tracker.trackDonationClick(); now = 100; tracker.trackDonationClick();
  assert.equal(calls.length, 1, 'Rapid double tap must record just once');
  now = 3001; tracker.trackDonationClick(); assert.equal(calls.length, 2);
  assert.notEqual(JSON.parse(calls[0][1].body).id, JSON.parse(calls[1][1].body).id, 'IDs identify click events, never visitors');
  assert.equal(calls[0][1].credentials, 'omit'); assert.equal(calls[0][1].referrerPolicy, 'no-referrer');
  const failedTracker = load('app/donation-tracking.ts', { performance: { now: () => 0 }, crypto: { randomUUID() { throw new Error('Unavailable'); } } });
  assert.doesNotThrow(() => failedTracker.trackDonationClick(), 'Tracking failures must not block the link');
  const companion = fs.readFileSync(path.join(root, 'app/companion.tsx'), 'utf8');
  const evaluationTag = companion.match(/<a\b[^>]*className="shrimp-evaluation"[^>]*>/)[0];
  assert(!/onClick|donation-click|trackDonation/.test(evaluationTag), 'The evaluation link must not be tracked');
  assert.match(companion, /onClick=\{trackDonationClick\}/);

  const rsvpId=randomUUID(), registration={id:rsvpId,eventDate:'2026-10-18',eventStart:testEvents[0].start,name:'  Alex   Example  ',notOnDiscord:true};
  assert.equal((await rsvp.POST(request('/api/rsvp', registration))).status,201);
  assert.equal((await rsvp.POST(request('/api/rsvp', registration))).status,201);
  assert.equal(db.prepare('SELECT count(*) AS n FROM event_rsvps').get().n,1,'A retried RSVP must not duplicate attendance');
  const firstRsvp=db.prepare('SELECT * FROM event_rsvps').get();
  assert.equal(firstRsvp.name,'Alex Example');assert.equal(firstRsvp.event_date,'2026-10-18');assert.equal(firstRsvp.not_on_discord,1);
  assert.equal((await rsvp.POST(request('/api/rsvp',{...registration,id:randomUUID(),name:'alex example'}))).status,409);
  assert.equal((await rsvp.POST(request('/api/rsvp',{...registration,eventDate:'2026-10-25',eventStart:testEvents[1].start}))).status,409,'The same request ID cannot silently register a different date');
  assert.equal((await rsvp.POST(request('/api/rsvp',{...registration,id:randomUUID(),eventDate:'2026-10-25',eventStart:testEvents[1].start}))).status,201,'The same person can attend different dates');
  testEvents[0].id='completely-new-calendar-id'; testEvents[0].title='Renamed community lunch'; testEvents[0].start='2026-10-18T19:00:00.000Z';
  assert.equal((await rsvp.POST(request('/api/rsvp',{...registration,id:randomUUID(),name:'Another Guest'}))).status,201,'Renaming/recreating/rescheduling within the day must preserve the date key');
  const changed=db.prepare("SELECT * FROM event_rsvps WHERE name='Another Guest'").get();
  assert.equal(changed.event_date,'2026-10-18');assert.equal(changed.event_title,'Renamed community lunch');assert.equal(changed.event_start,testEvents[0].start);
  for(const value of [false,null,'true',undefined]) assert.equal((await rsvp.POST(request('/api/rsvp',{...registration,id:randomUUID(),notOnDiscord:value}))).status,400);
  for(const name of ['', '  ', 'x'.repeat(101), 'hidden\u200bname']) assert.equal((await rsvp.POST(request('/api/rsvp',{...registration,id:randomUUID(),name}))).status,400);
  assert.equal((await rsvp.POST(request('/api/rsvp',{...registration,id:randomUUID(),eventDate:'2026-10-19'}))).status,409,'Unlisted dates must be rejected');
  assert.equal((await rsvp.POST(request('/api/rsvp',registration,{origin:'https://elsewhere.example'}))).status,403);
  calendarFails=true; assert.equal((await rsvp.POST(request('/api/rsvp',{...registration,id:randomUUID(),name:'Offline Test'}))).status,503);calendarFails=false;
  assert.equal(db.prepare('SELECT count(*) AS n FROM event_rsvps').get().n,3,'Invalid/failed requests must not create RSVPs');
  assert.equal(calendarLinks.eventDateKey({start:'2026-10-19T01:00:00Z',allDay:false}),'2026-10-18','Date keys use Illinois local time, not UTC');
  assert.equal(calendarLinks.eventDateKey({start:'2026-11-02T05:30:00Z',allDay:false}),'2026-11-01','Date keys handle standard time');
  assert.equal(calendarLinks.eventDateKey({start:'2026-10-18',allDay:true}),'2026-10-18');
  const parts=calendarLinks.descriptionParts('Only if you haven’t on discord already, RSVP [here](https://discord.com/events/1/2) so we have enough for everyone!');
  assert.equal(parts.filter((p,i)=>calendarLinks.isRsvpDescriptionPart(p,parts[i-1]?.text)).length,1);
  assert(!calendarLinks.isRsvpDescriptionPart({text:'Google Maps',url:'https://google.com/maps'}));
  console.log('PASS: donations, privacy controls, feedback, and event RSVPs: persistence, per-date duplicates, calendar changes, required Discord confirmation, Illinois timezone, input validation and failure handling.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.close());
