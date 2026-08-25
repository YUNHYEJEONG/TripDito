# Trip status v4 · departure packing

## Approved scope

This version retains only the approved `idle` / `prep` illustration: a large,
open suitcase being packed. The visual is flat 2D with rounded indigo linework and
the TripDito D-brand palette. It has no fill mask, liquid plane, glass effect, or
3D shading.

## Canonical asset

- Master: `packing-flat.png`
- Runtime copy: `/public/trip-status/v4/packing-flat.png`
- Canvas: `649×562` RGBA
- SHA-256: `fceb82ba2ca89ce030c71e57581c9d14fea0a2ef6f08cf3be74fc68fa5f3fd93`

## Runtime contract

- Preserve the intrinsic `649 / 562` ratio; never force unrelated width and height.
- Render with `background-size: contain` and `image-rendering: auto`.
- The illustration is static. Budget progress belongs to the separate piggy-bank
  scene and must never paint or clip this suitcase.
- Keep transparent safe padding and anti-aliased partial alpha.

Historical v2/v3 assets and rejected v4 experiments are intentionally not retained.
Any replacement must be approved as a new version before changing this master.
