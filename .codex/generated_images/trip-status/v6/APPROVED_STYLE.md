# Trip status v6 · completed scene

## Approved scope

This version approves only the `after` / trip-completed illustration. The prep,
live suitcase, and piggy-bank artwork remain unchanged until they are approved
separately.

## Canonical files

- Production alpha master: `final/complete-stacked.png`
- Runtime copy: `/public/trip-status/v6/complete-stacked.png`

The production file is `904×1100` sRGBA. Its non-transparent subject bounds are
`845×1037+30+31`, leaving a clear 29–32px safe edge on every side.

## Composition contract

- One upright front-facing suitcase, never a horizontal suitcase.
- Four large purchases form one compact, overlapping pyramid above the suitcase.
- Purchases are part of this single completed-scene composite. Do not add a row of
  runtime stickers or purchase sprites on top.
- Render by height and preserve the natural `904 / 1100` ratio. Never force both
  width and height independently.
- Completed state is static: no progress fill, object stacking animation, jump, or
  confetti.

## Production notes

The built-in image generator was used in reference-edit mode. The approved runtime
master is the retained sRGBA alpha export; raw generator output and comparison
candidates are local-only artifacts and are not part of the repository.

Do not crop individual live-state objects out of this composite: several are
occluded by the pile. Generate and approve future live objects as separate alpha
assets, then reuse those exact assets in both states.
