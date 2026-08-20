# TripDito candidate D brand source

Candidate D was approved on 2026-08-20. The concept-board crop is the visual
master until an original vector export is supplied. Do not redraw or reinterpret
the mark from its meaning alone.

## Canonical source

- Original board: `concept-board-original.png` (`1920 x 1080`)
- SHA-256: `924b6cca160f6d1f37c088728d31d24a013e96d52a972eb2654c4e820f5d8319`
- Exact lockup crop: `x=1524, y=474, width=244, height=60`
- Exact symbol crop: `x=1524, y=474, width=70, height=60`
- Exact wordmark crop: `x=1602, y=485, width=166, height=42`
- Symbol-to-wordmark gap: `8 px`

Source crops are stored as:

- `candidate-d-lockup-source.png`
- `candidate-d-symbol-source.png`
- `candidate-d-wordmark-source.png`

## Mark construction

The D symbol is an open, rounded ribbon heart. Its deliberate opening and inner
negative space form the check. It is not a filled heart with a separate white
check drawn on top. Preserve the asymmetric opening, broad negative space,
rounded ribbon ends, and the original crop proportions.

## Palette

- Exact wordmark indigo: `#4949D7`
- Sampled symbol indigo: `#504AD3`
- Sampled symbol violet: `#6F4FBF`
- Sampled symbol plum: `#B15A96`
- Sampled symbol coral: `#FB6567`
- App and page canvas: `#FFFFFF` (fixed)
- Neutral component surfaces: `#F7F6FC` / `#ECECF6`
- Prep component surface: `#EFF0FF`
- Live component surface: `#FFF1EE`
- After component surface: `#FFF0FB`
- Ink: `#1D1A2B`

The mark gradient moves from indigo through violet and plum to coral. Product
controls use indigo as their single primary interaction accent. Coral and plum
remain limited to the mark, affective signals, and intentional state accents.

## Surface rule

Keep `html`, `body`, page shells, app rails, and headers pure white. Travel mode
must never recolor the full page canvas. Apply indigo, coral, plum, and the pale
neutral palette only inside bounded components such as status cards, selected
tabs and chips, fields, badges, progress artwork, and focused controls.

Indigo is the universal selected and primary-action color. Coral and plum are
state or affective accents, not competing primary CTA colors. Keep ordinary
content cards white with a quiet violet-neutral border when no tint is needed.

## Runtime files

- Full lockup: `/public/brand/d/lockup.png`
- Symbol: `/public/brand/d/symbol.png`
- Wordmark: `/public/brand/d/wordmark.png`
- App icon: `/public/brand/d/app-icon.png`
- PWA icons: `/public/brand/d/pwa-192.png`, `/public/brand/d/pwa-512.png`
- Favicons: `/public/brand/d/favicon-16.png`, `favicon-32.png`,
  `favicon-48.png`, `favicon.ico`

The full lockup must be rendered as one image. Do not recombine the symbol and
wordmark in CSS because doing so changes the approved spacing and optical
alignment. The older filled-heart SVG experiments are rejected and must never be
referenced by runtime code.

The concept board is a white-matted raster source. The current transparent PNGs
are approved on the product's white canvas and pale internal surfaces. They are
not a background-agnostic vector master. Before placing the mark on a dark or
strongly colored surface, obtain the original vector export or produce an exact
gradient-aware trace from these canonical crops.

## Minimum sizes

- Full lockup: `20 px` high minimum
- Standalone symbol: `20 px` high minimum; prefer `24 px` or larger
- Wordmark: `16 px` high minimum
- App icons keep the full symbol inside the central safe area
