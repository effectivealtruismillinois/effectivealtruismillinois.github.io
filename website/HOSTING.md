# Hosting EA Illinois from this repository

This is a full-stack React/Vinext app, already using Cloudflare Workers and D1. **GitHub stores the editable source. GitHub Pages alone cannot run the server/database required by the forms.** Use a Cloudflare Worker with D1, or port the backend before choosing another runtime.

The code supports email signup, private feedback, country/browser/device donation click records, event RSVPs, and a public Google Calendar feed. Database records and credentials do not belong in this repository.

## First deployment to your own Cloudflare account

1. Install Node.js 24 LTS, clone the repository, and run `npm ci`.
2. Sign in to the intended team Cloudflare account with `npx wrangler login`. Review its normal authorization prompt yourself.
3. Create the private database: `npx wrangler d1 create eaillinois-community`. Save the **actual database UUID** from the response. If the team already has this database, reuse its actual UUID instead of creating another one.
4. Run `npm run test:data`, then `npm run build`.
5. Configure the standalone Worker using the actual UUID:

   ```sh
   node scripts/configure-cloudflare.mjs --database-id YOUR_ACTUAL_DATABASE_UUID --calendar-id e33031389c42cbf0bb71ec46a0eadfda793beb8aaa6613fd584712bdc4652161@group.calendar.google.com
   ```

   With multiple Cloudflare accounts, also pass `--account-id YOUR_ACTUAL_ACCOUNT_ID`. Optional flags: `--worker-name` and `--database-name`.

6. Apply schema migrations to the new remote database:

   ```sh
   npx wrangler d1 migrations apply DB --remote --config .cloudflare/deploy.json
   ```

7. Import existing records privately, if transferring them (see below), then deploy:

   ```sh
   npx wrangler deploy --config .cloudflare/deploy.json
   ```

8. Use the **actual workers.dev URL printed by Wrangler** to check email signup, feedback, RSVP dates/checkbox, and donation-click saving against the intended D1 database. Never announce the cutover until these work. The donation link counts outbound clicks, not completed donations.

The generated `.cloudflare/deploy.json` is ignored and can be regenerated after rebuilding. It points to `dist/server/index.js`, serves `dist/client`, binds the real D1 database as `DB`, and sets the public calendar ID. It does not deploy through OpenAI. No OpenAI account, API key, Sites access token, or Sign in with ChatGPT is required for these public features. No mail-sending service is configured yet; signup records addresses only.

## Move eaillinois.org after testing

Cloudflare Workers custom domains require an active Cloudflare DNS zone. If the domain still uses Porkbun DNS, add the domain to the intended team Cloudflare account, **copy and check all existing DNS/email records**, then have the Porkbun owner set the exact nameservers Cloudflare provides. Keep domain registration at Porkbun; preserve MX, TXT, DKIM, and unrelated subdomains.

After the zone is active, attach `eaillinois.org` and `www.eaillinois.org` to this Worker under Workers & Pages → the Worker → Settings → Domains & Routes. Resolve only conflicting web-routing/forwarding records. Do not guess IP addresses, verification tokens, nameservers, or CNAME targets. Verify both HTTPS addresses and form saving after routing the domain.

The old OpenAI-hosted domain attachment blocks reassignment **inside OpenAI Sites**, but is not a reason to keep using OpenAI hosting. Do not delete the old site/database during cutover. Keep it available until new records have been reconciled and visitors are using the new host.

## Preserve existing signups, feedback, click records and RSVPs

Keep a private JSON export in `.private/community-private-data.json` with this shape:

```json
{"tables":{"subscribers":[],"donation_clicks":[],"site_feedback":[],"event_rsvps":[]}}
```

Arrays contain the original database rows with their column names. **Do not commit this file, the generated SQL, a live database, or any raw submitted names/emails/messages.** The JSON export is a private migration artifact, separate from the source ZIP/repository.

Run:

```sh
node scripts/build-private-import.mjs .private/community-private-data.json
npx wrangler d1 execute DB --remote --config .cloudflare/deploy.json --file .private/import.private.sql
```

The import is additive and deduplicates primary/unique keys. Known example.invalid signup test addresses and entries starting “SITE QA TEST” are excluded. Existing data stays intact. Review counts in Cloudflare → Workers & Pages → D1 → the team database → Explore.

Export once for rehearsal, then take a final export at cutover and re-import it. Keep the old database available long enough to catch submissions from already-open tabs, and reconcile again. Do not assume a source-code push transfers database records.

## Editing together

Give teammates repository access through GitHub's normal collaborator controls; no passwords or tokens in commits. They can edit branches and use pull requests. A GitHub push does not automatically update the Worker until you connect Cloudflare's Git integration or run the deployment commands above. Keep deployment credentials in the host's settings/secrets, never in source.

Current Sites data is accessible to its authorized managers through:
https://chatgpt.com/sites/appgprj_6ad07a3511c081919cadb766260a13c0/database

On Cloudflare, use the private D1 console to view `subscribers`, `donation_clicks`, `site_feedback`, and `event_rsvps`. RSVP records retain Illinois `event_date` as their stable key, with the event title/start captured at submission; repeated names on the same date are rejected, and a repeated network request does not create another RSVP.

References: [GitHub Pages limitations](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [Cloudflare D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/), [Workers custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
