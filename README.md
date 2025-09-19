rooklz.net — retro personal site

Stack: Next.js 15 (App Router) + TypeScript + Tailwind v4

Local development
```bash
npm run dev
# http://localhost:3000
```

Scripts
- dev: Next dev server (Turbopack)
- build: Production build
- start: Run built app
- lint: ESLint

Project structure
- `src/app/*`: App Router pages and layout
- `src/app/globals.css`: Theme tokens and retro UI styles
- `src/config/links.ts`: Public profile links
- `public/*`: Static assets

Deploy (Vercel + GitHub)
1) Push to `main` or open a PR. Vercel creates a Deployment automatically.
2) Set Project → Git to this repo; Framework preset: Next.js.
3) Default build command and output are auto-detected.

Env & integrations (later)
- Last.fm recent tracks → Home panel
- Are.na channel embeds → Links/Projects

Environment
Create `.env.local` with:
```
LASTFM_API_KEY=your_key
LASTFM_USERNAME=ingvaredhelbor
ARENA_CHANNEL_SLUG=rooklz
NOWPLAYING_SECRET=replace_with_random_secret
```
Direct now playing (optional)
- POST /api/now-playing with Authorization: Bearer $NOWPLAYING_SECRET
  Body JSON:
  `{ "title": "...", "artist": "...", "album": "...", "url": "...", "durationMs": 180000, "positionMs": 42000, "isPlaying": true, "startedAtMs": 1710000000000 }`
- SSE stream: connect to /api/now-playing with EventSource for live updates.

WACUP HTTP(S) POST setup
- WACUP can POST on playback events using ATF fields. Use either form POST or query params.
- URL (form): `https://your-site/api/now-playing?token=YOUR_SECRET`
- Start (form body): `title=%title%&artist=%artist%&album=%album%&durationMs=$mul(%length_seconds%,1000)&isPlaying=true`
- Pause (form body): `title=%title%&artist=%artist%&album=%album%&isPlaying=false`
- Unpause (form body): `title=%title%&artist=%artist%&album=%album%&isPlaying=true`
- Stop (form body): `isPlaying=false`

Notes
- The server also accepts query-string style, e.g. `.../api/now-playing?token=...&title=%title%&artist=%artist%&durationMs=$mul(%length_seconds%,1000)&isPlaying=true`
- ATF reference: [WACUP ATF Reference](https://getwacup.com/atf_help.html)
On Vercel, add the same variables in Project Settings → Environment Variables.

License
Personal project by Rooklz.
