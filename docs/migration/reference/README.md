# Live page references

Run `pnpm ref:capture` from the repository root to replace the baseline with
the 50 live sitemap pages and the three policy pages. The capture stops if
the route count changes or a page returns a failed HTTP response. Inspect
the change before updating that expected count.
Use `pnpm ref:capture --resume` to continue a stopped batch. The command
keeps each completed image and its original capture date.
Use `pnpm ref:capture --resume --path /summer-camp` to refresh one page.

The screenshot names preserve the page path. For example,
`summer-camp/activities-390.png` captures `/summer-camp/activities`.
The home page uses `home-1440.png` and `home-390.png`.

`manifest.json` records each capture's UTC date, URL, page title, viewport,
document dimensions and failed images. A complete batch has 106 entries.
Images marked `visible: false` are hidden by the live responsive layout.
Other unavailable images can belong to offscreen carousel slides. The
manifest preserves these warnings. Horizontal overflow is recorded, while
the screenshot keeps the requested viewport width.
The viewports are 1440 × 1000 and 390 × 844, with device scale 1.
Chromium takes full-page screenshots after loading fonts, scrolling through
the page to trigger lazy images and animations, and returning to the top.
The script pauses videos and disables CSS animations for capture. It does
not hide the header, force content opacity or change the page layout.

A full-page image cannot show every state of a sticky scroll section or
slider. These images record the loaded slider and scroll-zero states.
Use the animation descriptions in `../inventory.md` to check the functional
scroll states separately. A missing live image is recorded as source
evidence, not silently replaced. These captures do not approve the new site.

`states/` contains extra viewport images of the home video zoom, image/text
scroll panels, bus map and year-round image. It also records the School Year
zoom and My Hot Lunchbox step counter at several scroll positions.
Its manifest records the actual scroll offset for each image. Run
`pnpm ref:states` to refresh them. These images show the real scroll states
that the full-page images cannot show together.
The live bus map loads correctly in these viewport images. Chromium can
leave this remote iframe blank when it is outside the viewport during a
full-page capture. Use the bus state images for its visual target.

## Compare a page

Start the local Website server, then run:

```sh
pnpm ref:compare /
pnpm ref:compare /summer-camp/activities
```

The command reads the Website port from `.worktree-ports.json`, or uses
port 3000. To choose a server explicitly:

```sh
REF_BASE_URL=http://127.0.0.1:3001 pnpm ref:compare /
```

Open the printed HTML file. It puts the saved reference and current page
next to each other at each width. It records dates and capture warnings
in an adjacent manifest. The output stays in ignored
`.reference-comparisons/`; the command does not change the baseline.
An absent reference or failed page response stops the comparison.
