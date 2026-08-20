# Candidate D verification

Verified on 2026-08-20 against the recovered `1920 x 1080` concept board.

## Source fidelity

- Full lockup source: `244 x 60`
- Symbol source: `70 x 60`
- Wordmark source: `166 x 42`
- White-background reconstruction RMSE:
  - Full lockup: `0.000728101`
  - Symbol: `0.00135937`
  - Wordmark: `0`

The runtime transparent PNGs are direct extractions. They are not AI-generated
redraws and do not use the rejected filled-heart SVG.

## Browser verification

- Home at `390 x 844`: natural `244 x 60`, rendered `106 x 26`
- Splash hold at `390 x 844`: natural `244 x 60`, rendered `211 x 52`
- Home at `320 x 640`: no horizontal overflow, no framework error overlay

Screenshots:

- `.codex/browser-checks/brand-d-exact/home-390x844.png`
- `.codex/browser-checks/brand-d-exact/splash-hold-390x844.png`
- `.codex/browser-checks/brand-d-exact/home-320x640.png`

## Code checks

- ESLint on the changed brand and metadata files: pass
- Project tests: `145 / 145` pass
- Full TypeScript check remains blocked by the pre-existing unrelated error at
  `app/(main)/home/page.tsx:96` (`Promise<string>` is not assignable to
  `void | Promise<void>`).
