# Music Max

A complete redesign of [Vishal Dhiman’s Apple-Music project](https://github.com/vishaldhiman15/Apple-Music), with a working audio library, expressive editorial artwork, and an optional MongoDB account server.

## Run it

Requires Node.js 22.12+ and npm. Install dependencies once from this directory; the backend shares the root dependency lockfile.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. The browser library works immediately: 24 original instrumental demo recordings, 12 albums, six fictional artists, device playlists, favorites, and local audio imports. No account or API key is required.

For the full stack, install MongoDB so `mongod` is on your PATH, then run:

```sh
npm run dev:full
```

This starts an isolated local MongoDB on port 27029, seeds the demo catalog, starts the API on port 5001, and starts Vite on port 3000. Data stays in `.local/mongo`. The development JWT signing secret is generated in memory, so accounts persist but sessions expire when this command restarts. Set a stable, strong `JWT_SECRET` in your environment to retain sessions. Stop the command with Ctrl+C to close its child processes.

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

## Production

### Static / device-only

```sh
npm run build
npm run preview
```

Serve `dist/` over HTTPS with an SPA fallback to `index.html` and correct JavaScript, SVG, and MP3 content types. Production builds use device-only mode unless explicitly configured for an API. `.openai/hosting.json` configures the accompanying private Sites demo, which runs in this mode. Browser imports, playlists, favorites, recommendations, lyrics, and offline demo audio work there; account sync and cloud uploads need a server deployment.

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

Seed the same database once with `npm run seed` from an environment with its `MONGODB_URI`. Seeding only upserts the original demo catalog; it does not delete accounts, uploads, or playlists. The checked-in demo media is served by the frontend deployment. A separate API origin can be configured at build time with `VITE_API_URL`; app/API hosts must be same-site for the current SameSite=Lax cookie design, and the API must allow the exact app origin. A static Sites deployment does not run the Node/MongoDB server.

The server validates input, bounds request bodies, restricts origins, requires a mutation header, rate-limits requests, hashes passwords with bcrypt, and uses HttpOnly sessions. This project does not include password reset/email delivery, token revocation storage, distributed rate limits, billing, or a licensed subscription catalog. Complete deployment-specific monitoring, backups, and account recovery before offering a public account service.

## Verification

```sh
npm test
npm run build
npm audit
```

Tests cover recommendation ranking, catalog references and media files, shuffled queue boundaries, LRC parsing, offline byte ranges, authentication, request protection, playlist ownership/CRUD, concurrent favorites, profile restrictions, and non-destructive seeding. Integration tests launch a disposable MongoDB when `mongod` is available, or use `MONGODB_TEST_URI` with a newly generated test database name. They drop only that generated database. Without either MongoDB option those integration tests explicitly skip. GitHub Actions provides MongoDB and runs the tests and build.

Manual browser checks include actual playback and seeking, playlist persistence after reload, native file import, imported playback after reload, timed lyric seeking, equalizer controls, and responsive layouts. Offline range handling is tested automatically; a full physical-device airplane-mode test is not part of this verification.

## Structure and media

`src/` contains React, Router, Zustand stores, the native player, IndexedDB storage, recommendations, and views. `backend/` contains the Express/Mongoose API. `scripts/` contains local full-stack startup and production service-worker generation. `public/artwork/` and `public/audio/` contain the demo media. All artwork is original SVG and every bundled recording is an original procedurally composed instrumental; names are fictional. `scripts/generate-demo-assets.py` can regenerate these assets with Python/NumPy and FFmpeg, but neither is needed to run or build the app.

Music Max is independent and is not affiliated with Apple. It does not stream Apple Music’s subscription catalog, claim lossless source quality, or use third-party commercial recordings. The original repository did not include a license; retain its attribution and obtain any necessary permission before redistributing its original code commercially.
