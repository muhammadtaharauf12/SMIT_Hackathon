import assert from "node:assert/strict";
import test from "node:test";
import { overlaps, workingDays } from "../utils/leave-rules";

test("uses organization weekend days", () => {
  assert.equal(workingDays("2026-10-23", "2026-10-25", new Set(), [5, 6]), 1);
});

test("counts weekdays inclusively", () => {
  assert.equal(workingDays("2026-10-26", "2026-10-30"), 5);
});

test("excludes Saturday and Sunday", () => {
  assert.equal(workingDays("2026-10-24", "2026-10-26"), 1);
});

test("excludes configured holidays from working days", () => {
  assert.equal(workingDays("2026-10-26", "2026-10-30", new Set(["2026-10-27", "2026-10-29"])), 3);
});

test("rejects a range containing only weekends or holidays", () => {
  assert.equal(workingDays("2026-10-24", "2026-10-25"), 0);
  assert.equal(workingDays("2026-10-26", "2026-10-26", new Set(["2026-10-26"])), 0);
});

test("detects inclusive date overlap", () => {
  assert.equal(overlaps("2026-10-26", "2026-10-28", "2026-10-28", "2026-10-30"), true);
  assert.equal(overlaps("2026-10-26", "2026-10-28", "2026-10-29", "2026-10-30"), false);
});
