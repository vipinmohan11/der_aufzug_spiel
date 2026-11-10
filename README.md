# Der Aufzug

An illustrated German-language adventure for children.

[Play the game](https://vipinmohan11.github.io/der_aufzug_spiel/)

Progress is stored on the device. The parent area includes an overview and backup controls.

## Chapters (1.7)

The presentation follows the number of completed discoveries among the existing 72 activities. At 46 and 48 discoveries the home screen hints at the garden. At 50 the rooftop pond opens, at 58 the greenhouse opens, and at 64 the observatory opens. Each arrival has an illustrated celebration. Repeating an activity retains the existing reward rules.

Navigation retains its routes, order and controls. Garden labels are Dachgarten, Gartenbuch and Gartenhaus. Space labels are Sternwarte, Sternenbuch and Raumstation. The four original uploaded illustrations are in `art/`. The space journey and celebration use the rabbit/mouse star dome, while the destination uses the unicorn/penguin observatory.

Schema 2 and the existing storage keys are retained. `chapterScene` is optional on new offers and new activity records. Existing records and pending offers retain their destinations and contents. The chapter changes the presentation of new discoveries. Existing saves above a threshold open the corresponding navigation without replaying an arrival celebration. Celebrations happen when a newly submitted activity crosses a milestone. A reload retains the completed activity and its reward.

### Local review

Run `python tools/preview.py`, then open the generated `preview.html` for a portable, playable sample. The links select sample progress before and after the milestones. Sample storage has its own prefix for each selected starting point. To trigger the garden celebration, select “Vor dem Garten”, complete a new discovery, and submit it.

For the regular local app, run `python -m http.server 8000 --bind 127.0.0.1` in this folder and open `http://127.0.0.1:8000/`. Offline support requires serving the app through HTTP on localhost or HTTPS.

### Development and verification

Edit the presentation source in `src/chapters.js`, then run `python tools/build.py`. This embeds the source in the existing single-script application and updates its CSP hash. Run `python tools/preview.py` to rebuild the portable sample.

Install dependencies with `npm install`, then install a Playwright browser with `npx playwright install chromium`. Run `node tests/chapters.cjs` and the existing tests in `tests/`. A system Chromium browser can be selected with the `TEST_BROWSER_EXECUTABLE` environment variable. The two existing offline test servers now serve the chapter illustrations.

### Recovery limits

This is a local reconstruction from baseline commit `8291cae997820f5ab146e4f3ced5e6e119a34e40`. The lost temporary source files were unavailable. The screenshots confirm thresholds 46, 48, 50, 58 and 64, but cut off their full definitions. The threshold meanings above were chosen during reconstruction. Progress uses completed discoveries rather than elevator destination numbers, whose existing calculation is retained.

Four original full-size illustrations were recovered and included byte for byte. The local review download includes the recovered development screenshots and an asset hash inventory.

Testing uses synthetic legacy saves and the original baseline application. The user's personal saved game and the unavailable lost implementation could not be compared directly. The initial implementation and review were completed locally before approval to publish the update.
