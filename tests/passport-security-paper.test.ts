import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PASSPORT_SECURITY_MOTIFS,
  getPassportSecurityPageDesign,
  getPassportSecuritySvgIds,
} from "../features/profile/utils/passport-security-paper";

describe("passport security paper", () => {
  it("cycles distinct DITO travel-memory motifs deterministically", () => {
    const firstPass = Array.from({ length: 12 }, (_, index) =>
      getPassportSecurityPageDesign(index + 1),
    );
    const secondPass = Array.from({ length: 12 }, (_, index) =>
      getPassportSecurityPageDesign(index + 1),
    );

    assert.deepEqual(secondPass, firstPass);
    assert.deepEqual(
      new Set(firstPass.slice(0, 4).map(({ motif }) => motif)),
      new Set(PASSPORT_SECURITY_MOTIFS),
    );
    assert.ok(new Set(firstPass.map(({ wavePhase }) => wavePhase)).size >= 8);

    for (const design of firstPass.slice(0, 4)) {
      const pastelLayers = [
        design.mint,
        design.sky,
        design.apricot,
        design.sand,
      ];
      assert.equal(new Set(pastelLayers).size, pastelLayers.length);
      pastelLayers.forEach((color) => assert.match(color, /^#[0-9a-f]{6}$/i));
    }
  });

  it("normalizes invalid pages without introducing render-time randomness", () => {
    assert.deepEqual(
      getPassportSecurityPageDesign(Number.NaN),
      getPassportSecurityPageDesign(1),
    );
    assert.deepEqual(
      getPassportSecurityPageDesign(-12),
      getPassportSecurityPageDesign(1),
    );
    assert.deepEqual(
      getPassportSecurityPageDesign(2.9),
      getPassportSecurityPageDesign(2),
    );
  });

  it("builds valid, instance-scoped SVG definition IDs", () => {
    const first = getPassportSecuritySvgIds(2, ":r3:");
    const same = getPassportSecuritySvgIds(2, ":r3:");
    const nextPage = getPassportSecuritySvgIds(3, ":r3:");
    const nextInstance = getPassportSecuritySvgIds(2, ":r4:");

    assert.deepEqual(same, first);
    assert.notDeepEqual(nextPage, first);
    assert.notDeepEqual(nextInstance, first);

    for (const id of Object.values(first)) {
      assert.match(id, /^[a-zA-Z][a-zA-Z0-9_-]*$/);
    }
  });
});
