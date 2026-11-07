# Der Aufzug

A German-language adventure game with illustrated destinations, puzzles, creative activities and collectible customisations.

**Early playable build · 0.6**

48 activities across four calendar weeks, including writing, drawing, an assisted portrait, planning, choices and logic challenges. Progress is saved on the device. No accounts, analytics or cloud synchronisation.

## Play on an Android tablet

Open the GitHub Pages address in Chrome while online. Wait for the first load, then choose **Add to Home screen / Install app**. Open it once while online, then check that it starts in airplane mode.

`index.html` contains the app, illustrations, font, styles and scripts. Keep `sw.js`, `manifest.webmanifest`, `icon.svg` and `OFL.txt` alongside it. A separate service-worker file is required by browsers for offline operation.

## Parent controls and backups

Open **Eltern**, create a PIN of 6–12 digits and safely record the recovery code. The PIN prevents casual access; it does not encrypt local browser data. Export a backup before real play and regularly thereafter. Exported backups contain private answers and creations. Never upload them to this repository.

The parent overview describes game choices and feedback. It is exploratory, not a validated diagnostic test.

## Updates

Export a backup first. Publish replacement app files at the same address, close all game tabs, then reopen. The new offline worker activates after older tabs close. Do not clear browser storage. A different hosting origin requires backup export and import.

## Test mode

Append `?admin=1` to the game address. This uses separate localStorage and IndexedDB data, with its own parent PIN. Test settings can unlock all weeks. Do not use real player backups as test fixtures.

## Release status

Core logic checks and selected browser checks passed. Full automated Chromium, backup/restore UI, real Android installation and offline/update checks are still pending. Review these before relying on the parent reports.

## Privacy

Answers and creations remain on the device. The app requests persistent storage, keeps rolling snapshots, and provides file backups. Hosting providers receive ordinary app-file requests. As this repository and hosted app are public, the source logic is inspectable.

## Version 0.8 — tablet pages

The app uses viewport pages with Back/Next controls instead of vertical scrolling. Illustrations use their full image bounds without CSS enlargement or cropping. Navigation and touch targets are larger; colour selectors are fixed circles.

New parent PINs use exactly four digits. Existing longer PINs continue to work; change them in Eltern → Einstellungen. Reset is available only in the authenticated parent settings and requires the current PIN again. It preserves the parent PIN/recovery code and saves the previous game state before resetting. The pre-reset state can be restored there. Reset affects only the currently selected child, admin, or parent-playthrough save.

Chromium checks covered all 48 activities (intro, working and submitted states), the main screens and parent tabs at 1024×600, 1280×800 and 1366×768 CSS pixels. No viewport overflow was detected. Security checks cover wrong reset PINs, child-route guards, reset/restore and legacy PIN changes. Real tablet verification remains necessary.

To repeat the checks: install Playwright and its Chromium browser, then run `node tests/tablet-layout.cjs` and `node tests/parent-security.cjs`. Set `TEST_BROWSER_EXECUTABLE` if using an existing Chromium binary.
