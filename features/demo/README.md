# Demo data boundary

This folder is the complete replaceable demo-data layer for the backend-less
preview. Production repositories do not import it.

## Automatic bootstrap

`DemoDataBootstrap` is mounted once in `providers/app-providers.tsx`. It runs
after hydration because `localStorage` is browser-only. Set
`NEXT_PUBLIC_ENABLE_DEMO_DATA=false` to disable automatic installation without
changing application code.

The bootstrap writes only when every protected entity is empty and no reset
tombstone exists. A browser with any trip, item, shot, scrap, profile, auth,
account, coupon, or active-trip value is left untouched. The versioned marker
is `trip-shopping:demo-bootstrap`; a second mount is a no-op.

## Manual replace and reset

- `replaceWithDemoData` replaces preview content and is used only behind the
  existing confirmation UI in My Trips and Data Management. Existing auth and
  account records are preserved; an identity-free browser receives the local
  preview account so interactive states still work.
- An explicit data reset must call `suppressAutomaticDemoData` after removing
  entity keys. This leaves a `suppressed` marker, so reload does not recreate
  data the user intentionally deleted.
- `clearDemoBootstrapMarker` is an explicit developer opt-in to make that
  browser eligible for cold-start bootstrap again.

Fixture IDs are stable and prefixed with `demo-v1-`. Dates are anchored to the
first installation day. The fixture keeps ordinary, preparation, live, and
settlement examples together. The default selected trip is the distant Osaka
trip, so cold start opens on the ordinary home. Users can switch directly to
the Fukuoka, Tokyo, or Taipei trip from the same Home trip switcher to see the
preparation, live, or settlement experience. Home mode is always derived from
the selected trip's dates; the demo layer never overrides product state.

`assertValidDemoDataFixture` protects cross-entity relationships before writes.

The local preview account can be restored after logout with:

- email: `preview@tripdito.local`
- password: `tripdito-demo`

These credentials are fixture-only and must not be used for a deployed auth
system.

## Removal

When a backend supplies real data, disable the environment flag first. The
automatic integration is the `DemoDataBootstrap` line in
`providers/app-providers.tsx`; the manual data replacement action and image
migration import the public API from this folder. Removing those explicit
imports and this folder leaves the repository layer and date-based home state
rules unchanged.
