# Effective Altruism at Illinois

The complete EA Illinois website: interactive shrimp mascot, ideas, reading carousel, one-on-one links, live calendar, email signup, private feedback, donation-click records, and event RSVP forms.

- **Deploy independently:** [HOSTING.md](HOSTING.md) contains the Cloudflare Workers + D1 setup and domain cutover instructions.
- **Find/manage submissions:** [COMMUNITY-DATA.md](COMMUNITY-DATA.md) explains the four private tables and privacy behavior.
- **Edit:** main site components live in `app/`; public images in `public/`; database changes in `drizzle/`.

Use Node.js 24 LTS. Run `npm ci`, `npm run test:data`, and `npm run dev` for development. Run `node --disable-warning=ExperimentalWarning scripts/check-hosting.mjs` to check the standalone migration helpers. Production requires a Worker and a real D1 binding; GitHub Pages alone cannot save form submissions. Signup records addresses; email delivery is not automated yet.

Never commit credentials, database files, or visitor names/emails/messages. Source backups do not contain live database records. Keep private migration exports separately in the ignored `.private/` directory.

Original framework notes are retained in [docs/starter-reference.md](docs/starter-reference.md).
