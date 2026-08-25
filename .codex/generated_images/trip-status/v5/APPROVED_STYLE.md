# Trip status v5 · connected cutaway scene

## Approved scope

The status card communicates `저금 → 여행 중 구매` as one flat illustration.
The piggy bank and suitcase share a baseline and are connected by a short static
route. Both use rounded indigo linework and the TripDito D-brand palette; there is
no liquid fill, HP bar, glass surface, gradient gauge, or 3D perspective.

## Canonical assets

| Asset | Runtime path | Canvas | Purpose |
| --- | --- | ---: | --- |
| `piggy-cutaway.png` | `/trip-status/v5/piggy-cutaway.png` | 1287×917 | Transparent-belly budget bank |
| `transit-cutaway.png` | `/trip-status/v5/transit-cutaway.png` | 1111×1416 | Transparent-window live suitcase |
| `purchase-objects.png` | `/trip-status/v5/purchase-objects.png` | 1774×887 | 4×2 purchase-object sprite sheet |

The runtime copies must remain byte-for-byte identical to these masters. Raw
generator outputs and comparison candidates are local-only artifacts.

## Brand and geometry contract

- Core indigo `#4949D7`, violet `#8052B5`, plum `#A157A0`, magenta
  `#B25A95`, rose `#D25F81`, coral `#F7656A`, cream and pale lavender.
- Pig belly cutaway: `left 13.4% · top 16.1% · width 68.8% · height 67.3%`.
- Suitcase inner window: `left 6.8% · top 24.6% · width 69.9% · height 62.2%`.
- The cutaways are real transparent regions. Do not paint a replacement panel over
  them; doing so creates a doubled border that no longer matches the artwork.
- Preserve intrinsic ratios and use `background-size: contain` with
  `image-rendering: auto`.

## Progress behavior

### Budget pig

- Five familiar gold coins from the v7 asset represent 20% milestones.
- Every visible coin stays inside the belly and piles from the bottom upward.
- A partial milestone may animate only opacity, scale, and a short vertical offset.
- The pig frame and body color never fill or change.

### Live suitcase

- One checked product reveals one large sprite inside the transparent suitcase.
- The measured window holds six readable objects in a 2×3 stack. Further purchases
  fold into the sixth slot's `+N` badge.
- Existing objects remain still when a new object enters. Entry uses only opacity,
  translate, and scale; reduced-motion mode shows the final state immediately.
- The airplane and route already belong to the suitcase artwork. Do not overlay a
  second route, fill plane, mask, clip path, or pseudo-liquid layer.

### Completed trip

Completed trips use the static v6/v7 composites, not this live object layer. The
full-purchase composite and one-missing composite are chosen from counts, have no
stacking animation, and keep static checked/unchecked settlement markers.

## Stable QA hooks

- `[data-budget-gauge]` and `[data-budget-gauge-fill]`
- `[data-trip-suitcase-gauge]` and `[data-trip-suitcase-fill]`
- `[data-purchase-object]` and `[data-purchase-status]`

Artwork is decorative and `aria-hidden`; semantic progress remains on the parent
status components.
