# Der Aufzug

A German-language adventure game with illustrated destinations, puzzles, creative activities and collectible customisations.

**Comic spread · 1.4**

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
node tests/interactive-items.cjs
```

Set `TEST_BROWSER_EXECUTABLE` to use an installed Chromium browser. The layout suite checks phone and tablet widths, all 72 activities, keyboard selection, saved drafts, mobile ride entry and offline reloading. The parent suite covers PIN setup, wrong-PIN rejection, reset, recovery and legacy PIN changes.

The reward upgrade suite uses a representative older save and checks field-by-field preservation, free assignment of prior purchases, separate room ownership, drawing data, PIN validity and access to later activities on day one. Set `UPGRADE_BASELINE_HTML` to a previous release HTML file to test loading that release before upgrading. The default uses the current runtime to load the same older-format fixture.

## Version 1.2 — clear ownership and visual parent overview

The parent overview uses separate charts for completion, optional feedback, offered-door choices and first submitted answers with checkable solutions. Each chart explains its counts. Full completion is explicitly described as completing the content. Recent completions and a saved-inventory audit are included. The previous experimental indices remain available in a collapsed detail view.

Child screens hide the footer, storage notice and test-mode label. Technical information and the version are shown in the parent area.

The dashboard regression test reproduces two earlier purchases placed in the penguin room, verifies independent stock in the other rooms, checks empty and completed report states, and confirms that rendering reports does not mutate the save.

## Version 1.3 — character-specific shops

Each character has six distinct shop items.

- Penguin — scarf, feeding bowl, station clock, ticket rack, conductor cap and ticket stamp.
- Mouse — toolbox, gear model, workbench lamp, parts box, ruler and protective goggles.
- Rabbit — storybooks, reading cushion, book lamp, bookmark, coloured pencils and story box.
- Pony — star map, telescope, hay basket, grooming brush, saddle blanket and compass.

New purchases and free placement of earlier accessories are restricted to suitable characters. Earlier generic plants and lamps can still be placed as room furnishings. Every recorded purchase is preserved and displayed, including items previously bought from a character's older catalogue. Rendering a room does not migrate, exchange or grant items.

## Version 1.4 — usable room items

Owned items have contextual actions in German. The room scene shows clothing on each character, placed furnishings, moving clock hands, filled ticket racks, stamped tickets, opening containers, turning gears, switched lamps, measured model objects, books, a bookmark, a drawing canvas, stories, telescope views, a star map, feeding, grooming and a moving compass needle.

Ownership remains in the existing ownership list. Optional `roomUses[character][item]` records retain placement, equipped state, open/on state, counters, pages and drawing strokes inside the existing child save. The optional `roomUseFocus` map restores the selected item for each character, including an open drawing or reading tool. New purchases do not automatically equip or place an item. Putting an item away keeps ownership and saved drawings. Previously purchased items immediately expose their actions; older unassigned purchases retain explicit free room assignment.

Transparent character cutouts and a seated Rabbit pose preserve the original character designs while allowing equipment to appear and disappear. They are embedded in the HTML for offline use.

The interactive-item suite verifies purchase, contextual action, visible world state and reload for all 24 current shop items. It also checks duplicate purchase protection, equipment removal, 44-pixel touch targets, per-character and child-save isolation, backup round trips, and painted drawing restoration during offline loading. Existing save-upgrade, layout, parent-dashboard and parent-security suites passed.
