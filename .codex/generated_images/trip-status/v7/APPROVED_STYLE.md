# Trip status artwork v7

## Scope

- Piggy-bank milestones use a familiar gold coin instead of the airplane token.
- A completed trip with exactly one pending item uses a static composition with the top rolled gift removed.
- The fully completed v6 composition remains unchanged.

## Canonical assets

- Gold coin: `.codex/generated_images/trip-status/v7/final/budget-coin-gold.png`
- One missing: `.codex/generated_images/trip-status/v7/final/complete-stacked-one-missing.png`
- Runtime copies: `/public/trip-status/v7/`

## Runtime rules

- Keep the five existing piggy-bank milestone positions and transitions; replace only their sprite.
- Render `complete-stacked-one-missing.png` only when `totalCount - purchasedCount === 1`.
- Completed-trip artwork remains static: no fill layer, object layer, or stacking animation.
- Both completed assets use a `904 / 1100` canvas ratio so the surrounding UI never stretches them.

## Generation notes

- Built-in image generation was used.
- The coin was generated as an independent asset from the v5 palette/style references.
- The one-missing variant was edited from the approved v6 complete composition by removing only the top rolled mat.
- Generated checker backgrounds were converted to real alpha before runtime use.
