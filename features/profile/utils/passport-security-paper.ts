export const PASSPORT_SECURITY_MOTIFS = [
  "ridge-memory",
  "coast-memory",
  "travel-tag",
  "route-waypoint",
] as const;

export type PassportSecurityMotif =
  (typeof PASSPORT_SECURITY_MOTIFS)[number];

export type PassportSecurityPageDesign = {
  motif: PassportSecurityMotif;
  paper: string;
  mint: string;
  sky: string;
  apricot: string;
  sand: string;
  ink: string;
  wavePhase: number;
  rosetteX: number;
  rosetteY: number;
  motifRotation: number;
};

const pageTemplates = [
  {
    motif: "ridge-memory",
    paper: "#f7f8ee",
    mint: "#83c8bb",
    sky: "#82b9d0",
    apricot: "#e8b18d",
    sand: "#d8c895",
    ink: "#4b8490",
    rosetteX: 116,
    rosetteY: 166,
    motifRotation: -5,
  },
  {
    motif: "coast-memory",
    paper: "#f5f8ef",
    mint: "#79c2b7",
    sky: "#91c2d4",
    apricot: "#ecb99b",
    sand: "#d9ca9e",
    ink: "#4f7f91",
    rosetteX: 142,
    rosetteY: 160,
    motifRotation: 4,
  },
  {
    motif: "travel-tag",
    paper: "#f8f6ee",
    mint: "#8bc8b8",
    sky: "#7eb6cf",
    apricot: "#e5aa87",
    sand: "#ddca95",
    ink: "#527d8d",
    rosetteX: 124,
    rosetteY: 176,
    motifRotation: -3,
  },
  {
    motif: "route-waypoint",
    paper: "#f6f8f1",
    mint: "#7fc5b4",
    sky: "#8abed3",
    apricot: "#ebb393",
    sand: "#d5c79a",
    ink: "#4b8290",
    rosetteX: 138,
    rosetteY: 172,
    motifRotation: 5,
  },
] as const satisfies readonly Omit<
  PassportSecurityPageDesign,
  "wavePhase"
>[];

function normalizePageNumber(pageNumber: number) {
  return Math.max(1, Math.trunc(Number.isFinite(pageNumber) ? pageNumber : 1));
}

/**
 * Produces a stable DITO-only security-paper composition. These motifs are
 * generic travel memories, never government emblems, cultural properties, or
 * machine-readable passport identifiers.
 */
export function getPassportSecurityPageDesign(
  pageNumber: number,
): PassportSecurityPageDesign {
  const normalizedPage = normalizePageNumber(pageNumber);
  const template = pageTemplates[(normalizedPage - 1) % pageTemplates.length];
  const cycle = Math.floor((normalizedPage - 1) / pageTemplates.length);

  return {
    ...template,
    wavePhase: (normalizedPage * 13) % 56,
    rosetteX: template.rosetteX + ((cycle % 3) - 1) * 4,
    rosetteY: template.rosetteY + ((cycle % 2) * 2 - 1) * 3,
    motifRotation: template.motifRotation + ((cycle % 3) - 1) * 1.5,
  };
}

function safeSvgToken(value: string) {
  const token = value.replaceAll(/[^a-zA-Z0-9_-]/g, "-");
  return token || "paper";
}

export function getPassportSecuritySvgIds(
  pageNumber: number,
  instanceId: string,
) {
  const page = normalizePageNumber(pageNumber);
  const prefix = `dito-security-${page}-${safeSvgToken(instanceId)}`;

  return {
    microPattern: `${prefix}-micro`,
    paperWash: `${prefix}-wash`,
    rosetteWash: `${prefix}-rosette`,
  } as const;
}
