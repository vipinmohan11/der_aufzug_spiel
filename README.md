# Der Aufzug

A German-language adventure game with illustrated destinations, puzzles, creative activities and collectible customisations.

**Comic spread · 1.2**

72 activities available immediately, including writing, drawing, an assisted portrait, planning, choices and logic challenges. Progress is saved on the device. No accounts, analytics or cloud synchronisation.

## Play on an Android tablet

Open the GitHub Pages address in Chrome while online. Wait for the first load, then choose **Add to Home screen / Install app**. Open it once while online, then check that it starts in airplane mode.

`index.html` contains the app, illustrations, font, styles and scripts. Keep `sw.js`, `manifest.webmanifest`, `icon.svg` and the font licenses alongside it. A separate service-worker file is required by browsers for offline operation.

## Parent controls and backups

Open **Eltern**, create a four-digit PIN and safely record the recovery code. The PIN prevents casual access; it does not encrypt local browser data. Export a backup before real play and regularly thereafter. Exported backups contain private answers and creations. Never upload them to this repository.

The parent overview describes game choices and feedback. It is exploratory, not a validated diagnostic test.

## Updates

Export a backup first. Publish replacement app files at the same address, close all game tabs, then reopen. The new offline worker activates after older tabs close. Do not clear browser storage. A different hosting origin requires backup export and import.

## Test mode

Append `?admin=1` to the game address. This uses separate localStorage and IndexedDB data, with its own parent PIN. Do not use real player backups as test fixtures.

## Version 1.0 — more destinations and visible purchases

All 72 activities are available from the first day. There is no weekly wait. The 24 new activities add drawing, invention, stories, fair experiments, collaboration and planning. The original 48 activity IDs and prompts remain unchanged.

## Version 1.1 — four character homes

The penguin, mouse, rabbit and pony each have a separate home, using the same illustrations as the activities. Each room has its own purchases, including two items specific to that character. Rooms begin with no purchased furnishings.

Earlier purchases have an enabled **Hier verwenden · schon bezahlt** action directly in the selected room shop. After placement, that item belongs to that room. Other rooms keep their independent shop options. Earlier items can be moved through **Frühere Käufe verwalten** without another charge.

The original ownership list and all earlier save fields are retained. New purchases use room-specific ownership IDs. Optional `roomView` and `roomAssignments` fields record the selected home and explicit placement of earlier purchases. Merely visiting a room grants no items.

The save keys, schema and parent security format remain unchanged. The update retains completed activities, drafts, drawings, coins, stars, ownership, PINs and reports. Install the update at the same hosting address and in the same browser profile. Close older game tabs and reopen to activate the offline update. The parent settings also include **App aktualisieren**.

## Comic spread

Door choices remain visible beside the illustrated preview. Selecting a door previews it; starting a ride records the choice. On phones the choices and ride button sit below the preview. Writing activities show all three building blocks together.

## Browser checks

Install Playwright and Chromium, then run:

```sh
node tests/tablet-layout.cjs
node tests/parent-security.cjs
node tests/rewards-upgrade.cjs
node tests/parent-dashboard.cjs
```

Set `TEST_BROWSER_EXECUTABLE` to use an installed Chromium browser. The layout suite checks phone and tablet widths, all 72 activities, keyboard selection, saved drafts, mobile ride entry and offline reloading. The parent suite covers PIN setup, wrong-PIN rejection, reset, recovery and legacy PIN changes.

The reward upgrade suite uses a representative older save and checks field-by-field preservation, free assignment of prior purchases, separate room ownership, drawing data, PIN validity and access to later activities on day one. Set `UPGRADE_BASELINE_HTML` to a previous release HTML file to test loading that release before upgrading. The default uses the current runtime to load the same older-format fixture.

## Version 1.2 — clear ownership and visual parent overview

The parent overview uses separate charts for completion, optional feedback, offered-door choices and first submitted answers with checkable solutions. Each chart explains its counts. Full completion is explicitly described as completing the content. Recent completions and a saved-inventory audit are included. The previous experimental indices remain available in a collapsed detail view.

Child screens hide the footer, storage notice and test-mode label. Technical information and the version are shown in the parent area.

The dashboard regression test reproduces two earlier purchases placed in the penguin room, verifies independent stock in the other rooms, checks empty and completed report states, and confirms that rendering reports does not mutate the save.
