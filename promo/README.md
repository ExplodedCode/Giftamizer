# Giftamizer promo video: how to remake it

Written for an AI agent. Read all of it before starting.

| File | What it is |
| --- | --- |
| `giftamizer-promo-vertical-9x16.mp4` | 1080x1920, 60 fps, 56 s. The main cut: the phone UI is largest here |
| `giftamizer-promo-landscape-16x9.mp4` | 1920x1080, same timing and sound |
| `source/` | Everything needed to record, score and render both again |

The job is nearly always: **record the app again, keep everything else.** The owner approved the script, the tempo and the sounds. Don't rewrite captions, retime scenes or change the music to make it "better". Change them only where the app has changed or the owner asks.

## Rules from the owner

1. 30 to 60 seconds. It is 56 s now.
2. Focus on the **mobile** UI.
3. Show all the basic features and some advanced ones.
4. **Light mode** in every demo.
5. No dev user switch and no dev watermark (the "SWITCH USER" button and the "Dev" chip by the logo). `assertClean` in `app.mjs` stops a take if either is visible or the page is dark.
6. Use the seed data and the local instance at http://localhost:3001.
7. Before starting, review the code, the READMEs and the landing page in this repo and in `../Giftamizer-Supabase`.

Also: don't edit the app's source for the video, don't commit unless asked, and run the app only to record it. The owner does their own testing of app changes.

## Approved script

One line per scene. `at` is the start in seconds. `*stars*` mark the accent color, `|` is a line break. All of it lives in the `SC` list in `source/web/comp.js`.

| At | Scene | Eyebrow | Headline | Sub-line | On screen |
| --- | --- | --- | --- | --- | --- |
| 0 | intro | | Giftamizer | Giving just got a whole lot better. | Gift box drops, lid pops, confetti |
| 3 | `landing` | Your personal gift registry | An easier way to \| \*organize your gifts.\* | | Landing page, signed out |
| 5 | `items` | Items | Your wishlist, \| \*in your pocket.\* | | Scroll Carla's items |
| 7 | `add` | Easily add gifts | Paste a link. \*Done.\* | Name, photos and price fill in for you. | Paste a store link, pick a list, create |
| 13 | `gallery` | Every detail | Exactly the \*right one.\* | Photos, sizes, colors and store links. | Photo viewer |
| 16 | `lists` | Lists | A list for everyone. \| \*Even the kids.\* | | Lists, then Lily's list |
| 20 | `groups` | Groups | Share with the \| \*people you love.\* | | Group and its members |
| 23 | `invite` | Invites | Invite by name, \| \*email or link.\* | | Group settings |
| 25 | `claim` | Planning | Claim it. \| \*No duplicate gifts.\* | | Available, Planned, Purchased |
| 29 | `privacy` | No spoilers | The surprise \| \*stays safe.\* | | Two phones: "Alice sees it's taken", "Ben sees nothing" |
| 33 | `shopping` | Shopping list | Your shopping list \| \*builds itself.\* | | Claimed items, show purchased |
| 36 | `santa` | Secret Santa | Secret Santa, \*sorted.\* then at 42: Kids join in, \*too.\* | Pick a date, set exclusions, draw names. | Full draw, result, confetti |
| 44 | `feed` | Feed | Never miss \*a change.\* | Filter it to what matters to you. | Feed and its filters |
| 47 | `settings` | Settings | Make it \*yours.\* | Archive, trash can, even snowfall. | Feature switches, snow starts |
| 50 | outro | | Giftamizer | Wish. Share. Give. No duplicates. | Three phones, "Get started at giftamizer.com" |

Carla is the person using the app throughout. She has kids' lists and co-owns the group where names get drawn. Alice and Ben appear only in `privacy`.

Every claim in the script must stay true. "Ben sees nothing" relies on the `can_view_item_status` function in `Giftamizer-Supabase/volumes/db/giftamizer`: check it still keeps claims from the item's owner.

Look: Inter, the app's own lucide icons and colors (emerald for items and claims, amber for details and shopping, sky for lists and feed, rose for groups and Secret Santa), pale tinted backgrounds, emerald intro and outro.

## Approved tempo and sound

`source/soundtrack.flac` is the approved master. `source/audio.mjs` synthesizes it from code, with no samples, and produces exactly the same audio each run.

- **120 BPM.** A beat is 0.5 s and the chord changes every second, so **every scene starts on a whole second**. Keep that.
- **Key and harmony:** C major, eight one-second chords: Cmaj7, G, Am, F, C, Em, F, G.
- **Instruments:** soft pad, marimba arpeggio, bell melody, plucked bass, kick, clap, hats, sleigh bells.
- **0 to 3:** pad and rising bells, a pop as the lid opens, a riser into 3.
- **3 on:** the groove. Claps join at 5 and get fuller at 13. The bell melody plays at 11, 19, 37 and 45.
- **29 to 33:** drums drop out for sneaky pizzicato under "The surprise stays safe".
- **36 to 44, and from 47:** sleigh bells.
- **54 to 56:** final chord and fade.
- **UI sounds:** a tick on every tap, a whoosh into every cut, a pop for each callout, two rising notes on each claim, a shuffle flutter before the Secret Santa reveal, and a sparkle on link fill, reveal and outro.
- **Level:** about -13.5 LUFS, peaks near -2 dBFS before AAC.

`node build.mjs audio` compares the new tap and cut times with `approved-cues.json`. If nothing moved more than 0.04 s it uses the approved master untouched. Otherwise it re-synthesizes with the same arrangement and only the ticks and whooshes move. Taps and cuts are read from the video, but these times are **typed into `audio.mjs`** and must be edited by hand if a scene moves: `inBreak`, the melody starts, the sleigh-bell ranges, the crash, riser and clap-fill times, and the per-scene offsets under "UI sounds".

## What you need

- The backend running and freshly seeded: `./run.sh dev up`, then `node dev/seed-test-data.js` in `Giftamizer-Supabase` (see its README; a reseed needs a reset first, which wipes local data, so ask the owner).
- The app on http://localhost:3001 (`npm start` here).
- Node 22 or newer, ffmpeg on the PATH, Docker, Microsoft Edge. Nothing extra to install: `npm install` for the app is enough.
- Overrides if needed: `PROMO_SUPABASE`, `PROMO_WORK`, `PROMO_BROWSER`, `PROMO_FFMPEG`.

Frames and other working files go to `giftamizer-promo` in the system temp folder (about 500 MB). Keep them out of the repo: the dev server watches it and would reload the app in the middle of a take. For the same reason don't edit files in the repo while recording.

## Steps

Run from `promo/source`.

**1. Find what changed.** Read the git log since the mp4s were made, the landing page, and any new page or setting. Decide which scenes are affected and whether a new feature deserves one. Tell the owner before changing the script.

**2. Borrow the data.** Recording claims gifts, creates an item, draws names and flips settings in the local dev database. Tell the owner first: anything they change in the local app between `snapshot` and `restore` is undone.

```powershell
node db.mjs snapshot
```

```powershell
node db.mjs selftest
```

`selftest` must print `after restore: 0 tables differ`. It runs inside a transaction that is rolled back.

```powershell
node db.mjs prep
```

**3. Record.** About four minutes. The order in `ORDER` (`record.mjs`) matters and is explained there.

```powershell
node record.mjs all
```

To redo some clips, run `node db.mjs prep` again and then, for example, `node record.mjs invite santa`. `prep` also removes what earlier takes did, so `alice`, `ben` and `shopping` need `claim` recorded again before them, and `snow` needs `settings`.

Look at every clip before going on:

```powershell
node build.mjs sheet santa 10
```

**4. Put the data back.** Do this as soon as the clips are good, and **always** if you stop early or something fails.

```powershell
node db.mjs restore
```

It must report the tables and the stored files as identical. Then rename `db-snapshot.json` in the working folder so the next remake can take a new one.

**5. Check stills** in both layouts (`v` and `h`), a few per scene. They land in `stills` in the working folder.

```powershell
node render.mjs v still 4 9.9 14.5 18.6 21.5 26.9 31.5 34.9 39.2 42.6 46.6 48.6 53
```

**6. Sound, then both videos.** About two minutes per layout. The old mp4 is copied to `previous` in the working folder first.

```powershell
node build.mjs audio
```

```powershell
node build.mjs video v
```

```powershell
node build.mjs video h
```

**7. Check the result.**

```powershell
node build.mjs qa v
```

Look at the contact sheet, then confirm:

- 60 s or less, both layouts, 60 fps, with sound.
- Light mode throughout; no Dev chip, no SWITCH USER, no `localhost` address, no tour popups, no stray tooltips.
- No single-frame jump at a scene start. Jumps inside `gallery`, `lists`, `groups` and `claim` are the app changing page and are fine.
- The card outlines in `privacy` sit on the pizza oven in both phones.
- Headlines don't touch the phone. Two-line headlines have no sub-line in vertical.
- Spelling on screen. It is zoomed in, so typos in the app show: report them to the owner rather than editing the app.
- `git status` shows nothing new outside `promo/`.

You can't listen to the audio. Say so, and report the levels.

## When the app has changed

- **A tap fails** with `not found`: the markup or label moved. Fix that selector in `record.mjs`. `tap` takes a CSS selector or `{ sel, text, has, aria, nth }`.
- **`assertClean` fails:** update the hide rules at the top of `inject.js`.
- **A tour popup appears:** `prep` marks every step in the `TourSteps` type as done. Check that type still exists under that name.
- **A flow got longer or shorter:** adjust that scene's `map` in `comp.js`, pairs of `[second in scene, clip frame]`. Clips run at 60 frames a second and `sheet` prints the marked frames. Keep the scene's length and let the map speed the clip up or slow it down; around 1x to 2x reads well. Pause on the moment that matters.
- **Something moved on screen:** adjust that scene's `cam`, a list of `[second, zoom, x, y]` in phone coordinates (390 wide), and any callout `tag(...)` near the end of `comp.js`. Keep zoom under about 1.3.
- **A new scene:** take its whole seconds from another one, stay under 60 s, add a clip to `record.mjs` and to `loadClips`, then update the typed times in `audio.mjs`, plus `DUR` and `OUTRO` if the length changes.
- **Seed data changed:** names are used in `record.mjs`, `config.mjs` and the `prep` part of `db.mjs`: Carla, Alice, Ben, Lily, both groups, Ooni Koda, MAGNA-TILES, Rumpl, Gravity and Victrola.
- **The pasted product link died:** change `LINK` in `record.mjs` and the `t1` callout text in `comp.js`. The local link-import service must return a title, images and a price.
- **Not November to January:** the app only offers Snow Fall then. The take skips it by itself, so change the `settings` sub-line and ask the owner about the snow drawn behind the last two scenes (`drawSnow`).

Once the owner approves a new version with changed sound, make it the new reference: convert the working `master.wav` to `source/soundtrack.flac` and copy `cues.json` over `source/approved-cues.json`. Update the tables above.

## How it works, and traps already hit

- `inject.js` replaces the page's clock, so each frame is captured at an exact time and the footage is a true 60 fps however slow the capture is. Network and image loading happen while that clock is stopped.
- The browser is headless Edge with every host except localhost blocked, so nothing reaches analytics. The `invite` function is answered locally so **no emails are sent** when names are drawn. Keep both.
- The invite link is shown as `giftamizer.com` in place of the local address. The link-import answer is real but cached, so every take matches.
- A tap shows desktop tooltips and focus outlines under automation. `inject.js` removes them; real phones never show them.
- The status bar and home area of the phone copy one pixel of the page's edge color. Copying a whole row smears text.
- If a run is killed, its headless Edge can stay open (debug port 9333 for recording, 9401 and 9402 for rendering). Close that one process, never every Edge window, before retrying.
- Group and user ids change with every reseed, so always look them up with `ids()`.
- Item order can change after a claim, so find the pizza oven by name, never by position.
- The settings clip is framed to keep the email row and the Danger Zone out.
- Tailwind scans text files in this repo, so a stray class-like word here can add a rule to the app's CSS. Compare a build before and after if you add files.

## Tell the owner

- **Product photos:** `Giftamizer-Supabase/dev/seed-images/README.md` says the seed photos are for local development only and not for marketing. The owner asked for seed data anyway. Remind them before anything is published.
- Test addresses ending in `@giftamizer.test` are readable in `invite`.
- Anything on screen that was altered for the video, such as the invite link.
- What you did not check.

## Status of this kit

Checked when it was saved (November 24, 2026): the soundtrack regenerates identical to the approved master; stills from these scripts match the approved video; `snapshot`, `prep` and `restore` were run in a rolled-back transaction with no differences; the `landing` clip was recorded.

Not yet run from here: the signed-in clips and a real `restore`. They come from the scripts that made the approved video, with ids, paths and dates now looked up instead of typed in. Expect a small fix or two on the first run.
