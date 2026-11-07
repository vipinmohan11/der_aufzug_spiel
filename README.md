# Der Aufzug

A German-language adventure game with illustrated destinations, puzzles, creative activities and collectible customisations.

**Comic spread · 0.9**

48 activities across four calendar weeks, including writing, drawing, an assisted portrait, planning, choices and logic challenges. Progress is saved on the device. No accounts, analytics or cloud synchronisation.

## Play on an Android tablet

Open the GitHub Pages address in Chrome while online. Wait for the first load, then choose **Add to Home screen / Install app**. Open it once while online, then check that it starts in airplane mode.

`index.html` contains the app, illustrations, font, styles and scripts. Keep `sw.js`, `manifest.webmanifest`, `icon.svg` and the font licenses alongside it. A separate service-worker file is required by browsers for offline operation.

## Parent controls and backups

Open **Eltern**, create a four-digit PIN and safely record the recovery code. The PIN prevents casual access; it does not encrypt local browser data. Export a backup before real play and regularly thereafter. Exported backups contain private answers and creations. Never upload them to this repository.

The parent overview describes game choices and feedback. It is exploratory, not a validated diagnostic test.

## Updates

Export a backup first. Publish replacement app files at the same address, close all game tabs, then reopen. The new offline worker activates after older tabs close. Do not clear browser storage. A different hosting origin requires backup export and import.

## Test mode

Append `?admin=1` to the game address. This uses separate localStorage and IndexedDB data, with its own parent PIN. Test settings can unlock all weeks. Do not use real player backups as test fixtures.

## Version 0.9 — responsive comic spread

The lobby shows each available door beside a shared illustrated preview. Choose a card to preview its destination, then use **Tür öffnen** to take the ride. Only starting a ride records an offer choice. On phones the cards and ride button sit below the preview.

Activity instructions, answer controls and feedback share a scrolling view. Writing activities show all three building blocks together. Existing saves, PINs, drawings and backups use the same storage format as version 0.8.

## Browser checks

Install Playwright and Chromium, then run:

```sh
node tests/tablet-layout.cjs
node tests/parent-security.cjs
```

Set `TEST_BROWSER_EXECUTABLE` to use an installed Chromium browser. The layout suite checks phone and tablet widths, all 48 activities, keyboard selection, saved drafts, mobile ride entry and offline reloading. The parent suite covers PIN setup, wrong-PIN rejection, reset, recovery and legacy PIN changes.
