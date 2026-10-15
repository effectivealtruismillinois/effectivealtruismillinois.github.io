# Community data

Open the site's **Database** tab at:
https://chatgpt.com/sites/appgprj_6ad07a3511c081919cadb766260a13c0/database

- `subscribers`: voluntarily submitted email addresses and signup times. Email delivery is not automated yet.
- `site_feedback`: voluntarily submitted feedback text and submission times. The footer's “Give the site maker feedback” button opens the form; success appears only after the hosted database saves the message. No name or email is requested. A random submission key prevents duplicate records on retries.
- `donation_clicks`: activations of **Donate to Shrimp Welfare Project** in the fed shrimp's popup. These are outbound clicks, not completed donations or unique people.
- `event_rsvps`: privately submitted names, Illinois event dates, event titles/start times, and confirmation that the person has not already RSVPd on Discord. The calendar description's RSVP “here” opens the form. It does not post to Discord or check Discord attendance automatically.

RSVPs use the event's `America/Chicago` calendar date (`YYYY-MM-DD`) as their stable association, so changing a calendar entry's ID/title/time within the day does not create another attendance list. A name is normalized for duplicate detection on that date; different dates can accept the same name. A retried submission is saved once. The server verifies the date against the public upcoming calendar and saves the current event title/start. Both a name and the Discord checkbox are required. Names are never displayed publicly.

For independent hosting, follow [HOSTING.md](HOSTING.md). The same four tables run in a private Cloudflare D1 database. GitHub stores source only; private exports and generated import SQL are ignored and must be transferred separately. View records in the Cloudflare D1 console after migration.

Donation records contain a random **event** ID (not a visitor ID), UTC time rounded to the hour, country when supplied by the hosting edge, browser family, and desktop/mobile/tablet/other category. Missing metadata is recorded as Unknown/Other. Browser and location classifications are approximate and may be affected by proxies, VPNs or browser reporting.

No IP address, raw user-agent, referrer, email, cookie, or persistent visitor identifier is saved in the donation table. Click records are never joined to subscriber or feedback entries. There is no tracking on the **evaluation of SWP** link or the other outbound links. This feature does not add page-view tracking.

Accidental repeated activations within three seconds are suppressed using page memory only. Refreshing or using a different tab starts fresh; this does **not** deduplicate people across visits. Server-side event ID uniqueness prevents a replayed request from adding a second row. Global Privacy Control (`Sec-GPC: 1`), Do Not Track (`DNT: 1`), and recognizable crawlers are excluded. Tracking failure never blocks opening the donation link.

Donation records older than 90 days are pruned when a new eligible donation click is recorded. Feedback and subscriber entries are separate and are not affected by this pruning. The privacy note in the footer describes this behavior; no analytics consent banner or tracking cookies are introduced. Hosting infrastructure has its own operational request processing.

Run `node --disable-warning=ExperimentalWarning scripts/check-community-data.cjs` to verify database migrations, persistence, deduplication, data minimization, privacy signals, feedback validation, and the untracked evaluation link using an isolated in-memory database.

Known test data in the hosted subscriber list: `site-signup-check@example.invalid`. Exclude it from future mail sends. Any feedback explicitly marked “SITE QA TEST” is a deployment check, not visitor feedback.
