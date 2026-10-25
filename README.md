# Music Max

A complete redesign of [Vishal Dhiman’s Apple-Music project](https://github.com/vishaldhiman15/Apple-Music), with a working audio library, expressive editorial artwork, Cloudinary uploads, free online music through Audius, and both hosted and local account storage.

## Run it

Requires Node.js 22.12+ and npm. Install dependencies once from this directory; the backend shares the root dependency lockfile.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. The browser library works immediately: 24 original instrumental demo recordings, 12 albums, six fictional artists, device playlists, favorites, and local audio imports. No account or API key is required.

For the full stack with a local MongoDB service on port 27017, run:

```sh
npm run setup:local
npm run dev:full
```

`setup:local` creates a git-ignored, owner-readable `backend/.env` with a persistent signing secret and `mongodb://127.0.0.1:27017/music-max`. It preserves existing values. The frontend calls `/api` through the Vite proxy, so accounts, favorites, and cloud playlists use this MongoDB database. Without a configured MongoDB URI, `dev:full` instead starts an isolated local MongoDB on port 27029, seeds the demo catalog, starts the API on port 5001, and starts Vite on port 3000. Data stays in `.local/mongo`. When no signing secret is configured, the development launcher generates one in memory, so sessions expire when that command restarts. The local setup command supplies a persistent secret. Stop the command with Ctrl+C to close its child processes.

To use an existing database, export `MONGODB_URI` before running `dev:full`. For a separately managed server, copy `backend/.env.example` to `backend/.env`, set its values, then run `npm run seed` and `npm run server`. Start the frontend with `npm run dev` in another terminal. Never commit `.env` files.

## What works

- Responsive desktop, tablet, and phone layouts; dark and light themes; keyboard navigation, dialogs with focus containment, reduced-motion support, and a skip link.
- Native audio playback with seeking, volume, mute, previous/next, shuffle without immediate repeats, repeat one/all, sleep timer, and media-session controls.
- Editable Up Next queue, play-next actions, immersive Now Playing, timed LRC lyrics with click-to-seek, an actual audio spectrum, and four Web Audio equalizer profiles.
- Album and artist pages, track and album search, genre filters, recent listening, favorites, playlist creation, editing, track ordering, and deletion.
- Explainable recommendations based on genre/artist affinity from favorites and listening history. Genre radio continuously rotates tracks already in the library. These are local rules, not a trained collaborative model or live radio broadcasts.
- Audio imports stored in IndexedDB, with optional artwork and lyrics. Imported files survive reloads and remain on this browser/device. File format support depends on the browser’s audio decoder.
- An installable app shell and explicit offline saving of demo audio in production builds. Cached audio supports byte-range requests for seeking. Local imports are already stored on the device. HTTPS or localhost is required for service workers, and browser storage may be evicted by the browser or user.
- Real account registration/login, cookie sessions, private MongoDB playlists and favorites, profile editing, and optional signed Cloudinary uploads. Invalid credentials never fall back to a fake account.

Guest and signed-in device libraries are stored in separate account scopes. Guest data is not automatically transferred to an account. Device playlists and imported favorites remain local even when signed in; cloud playlists accept server recordings. Cloud uploads become part of the shared catalog for all users of that deployment. Only the uploader can delete their cloud track through the API. Deleting a track removes its database references; Cloudinary asset cleanup is a separate provider lifecycle task.

## Stereo and spatial listening

Open **Now Playing → Sound**, or use **Settings → Listening mode**. Stereo preserves the recording’s left/right mix. Spatial stereo renders those channels through fixed HRTF virtual speakers and adds adjustable, damped rear reflections for stereo headphones. Soundstage changes speaker positions; Room changes reflection gain. Tone presets, smooth mode transitions, output volume/mute, and a safety limiter share the same Web Audio graph. Preferences persist after reload and apply when you next press play.

This is binaural processing of the available stereo recording. It does not decode Dolby Atmos, add head tracking, create discrete 5.1/7.1 source channels, or improve the source recording’s bitrate. For headphones already applying spatial processing in the operating system, use only one spatial processor at a time.

`npm run test:audio` serves a developer-only browser test page at `http://127.0.0.1:4190`. Run its seven native OfflineAudioContext checks for stereo separation, binaural output, soundstage, reflections, mono upmix, returning to stereo, and EQ. The check page is outside the production bundle. These checks passed in the local Chromium browser; headphone perception and device-specific output quality still need listening checks on your hardware.

## Connect Cloudinary locally

Add your Cloudinary account values to `backend/.env` (never `VITE_*`):

```dotenv
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Alternatively, set `CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME` in the same file. Get these values from the Cloudinary Console’s API Keys settings. Restart `dev:full` after changing them, then run:

```sh
npm run services:check
```

This verifies MongoDB with a database ping and Cloudinary with an authenticated provider ping, without printing credentials or creating uploads. Sign in to the local app and choose **Import music → Cloud library** to upload audio and optional artwork. The backend signs requests, keeps the secret server-side, checks ownership, verifies the provider’s uploaded resource, and saves its HTTPS URLs in MongoDB. Missing credentials leave device imports usable and cloud upload controls disabled.

## Online music and hosted app

The private hosted app is at https://music-max-tourist.smokyharp11.chatgpt.site. It runs a Worker API, authenticates through ChatGPT, stores profiles, favorites, playlists, and upload records in the Site's D1 database, and uses Cloudinary for uploaded audio and cover images. Each account's hosted library records are isolated. Cloudinary delivery URLs are public to anyone who has the link. The hosted app does not connect to your computer's MongoDB; the Node server still uses MongoDB locally or on Vercel.

**Online music** searches and plays the Audius catalog through its [official public API](https://docs.audius.co/api/). Read-only catalog search, trending, and streaming work without an API key. Availability and free service limits depend on Audius. Gated, unlisted, deleted, and unavailable tracks are excluded. The app displays the source and links back to Audius. This is an independent music catalog, not Apple Music's or Spotify's subscription library.

Streams pass through a same-origin API endpoint with byte-range forwarding for playback and seeking. The app does not copy Audius audio into Cloudinary or offline storage. Original bundled demo recordings are delivered from Cloudinary in the hosted build. Browser imports and offline demo saving remain available; online provider tracks require a connection. Stereo, spatial stereo, and EQ process the audio that the browser receives.

### Build and preview the hosted Worker

```sh
npm run build
npm run preview
```

Open `http://127.0.0.1:4173`. The preview uses a local SQLite adapter for D1 and an explicitly simulated local preview identity; this identity injection is only in the loopback preview server. Production trusts the identity headers supplied by Sites. `backend/.env` supplies local preview Cloudinary values; production requires the same three values as secret hosting environment variables. No Cloudinary secret is included in client JavaScript.

`.openai/hosting.json` retains the existing Site ID and declares the `DB` D1 binding. `db/schema.ts` and the generated `drizzle/` migration journal define hosted storage. `npm run db:generate` generates future migrations; retain already published migrations. The build embeds the app shell and static text assets in `dist/server/index.js`, with the hosting manifest at `dist/.openai/hosting.json`. The Sites packaging helper includes the generated migrations.

`npm run media:publish` uploads the original demo recordings to Cloudinary using content-hashed IDs and writes only public delivery URLs and hashes to `worker/media.json`. Existing unchanged recordings are skipped. Run it only when the original demo media changes.

`GET /api/health?check=1` verifies an actual database query and authenticated Cloudinary ping without returning credentials. A normal health request reports configured services without those external calls.

### Static / device library

```sh
npm run build:device
```

Serve `dist/` over HTTPS with an SPA fallback to `index.html` and the correct asset content types. The device build needs a reachable API for online Audius music and cloud accounts. The local Vite proxy and the included Node API provide those endpoints when running `npm run dev:full`.

### Full stack on Vercel

The included `vercel.json` serves the Vite build and routes `/api/*` to `backend/handler.js`, which reuses a MongoDB connection across warm invocations. Configure:

| Variable                                                               | Purpose                                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `VITE_BACKEND_MODE=enabled`                                            | Enable account sync in the production frontend build.                    |
| `MONGODB_URI`                                                          | Your provisioned MongoDB connection URI.                                 |
| `JWT_SECRET`                                                           | At least 32 random characters; generate a secret outside source control. |
| `APP_ORIGINS`                                                          | Comma-separated exact HTTPS app origins, including the deployed origin.  |
| `COOKIE_SECURE=true`                                                   | Secure session cookies under HTTPS.                                      |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Optional; enable verified direct media uploads.                          |

Seed the same database once with `npm run seed` from an environment with its `MONGODB_URI`. Seeding only upserts the original demo catalog; it does not delete accounts, uploads, or playlists. The checked-in demo media is served by the frontend deployment. A separate API origin can be configured at build time with `VITE_API_URL`; app/API hosts must be same-site for the current SameSite=Lax cookie design, and the API must allow the exact app origin. The hosted Sites Worker uses D1, while this separate Vercel deployment uses MongoDB.

The server validates input, bounds request bodies, restricts origins, requires a mutation header, rate-limits requests, hashes passwords with bcrypt, and uses HttpOnly sessions. This project does not include password reset/email delivery, token revocation storage, distributed rate limits, billing, or a licensed subscription catalog. Complete deployment-specific monitoring, backups, and account recovery before offering a public account service.

## Verification

```sh
npm test
npm run build
npm audit
```

Tests cover recommendation ranking, catalog references and media files, shuffled queue boundaries, LRC parsing, offline byte ranges, authentication, request protection, playlist ownership/CRUD, concurrent favorites, profile restrictions, non-destructive seeding, hosted D1 ownership and persistence, provider filtering, Cloudinary signature verification, and streamed range forwarding. Integration tests launch a disposable MongoDB when `mongod` is available, or use `MONGODB_TEST_URI` with a newly generated test database name. They drop only that generated database. Without either MongoDB option those integration tests explicitly skip. GitHub Actions provides MongoDB and runs the tests and build.

Manual browser checks include actual playback and seeking, playlist persistence after reload, native file import, imported playback after reload, timed lyric seeking, equalizer controls, and responsive layouts. Offline range handling is tested automatically; a full physical-device airplane-mode test is not part of this verification.

## Structure and media

`src/` contains React, Router, Zustand stores, the native player, IndexedDB storage, recommendations, and views. `backend/` contains the Express/Mongoose API; `worker/` contains the hosted API and Audius integration; `db/` and `drizzle/` define hosted storage. `scripts/` contains local full-stack startup and production service-worker generation. `public/artwork/` and `public/audio/` contain the demo media. All artwork is original SVG and every bundled recording is an original procedurally composed instrumental; names are fictional. `scripts/generate-demo-assets.py` can regenerate these assets with Python/NumPy and FFmpeg, but neither is needed to run or build the app.

Music Max is independent and is not affiliated with Apple. It does not stream Apple Music’s subscription catalog, claim lossless source quality, or imply access to an Apple Music subscription. Online recordings are supplied by Audius, with attribution and source links. The original repository did not include a license; retain its attribution and obtain any necessary permission before redistributing its original code commercially.
