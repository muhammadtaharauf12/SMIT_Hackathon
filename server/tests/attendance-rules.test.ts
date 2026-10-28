import assert from "node:assert/strict";
import test from "node:test";
import { durationMinutes, isLate, statusAfterCheckout } from "../utils/attendance-rules";
import { companyDate, effectiveAttendanceStatus } from "../utils/company-date";

test("keeps the grace boundary on time", () => {
  assert.equal(isLate(new Date("2026-10-25T04:15:00Z"), "09:00", 15), false);
  assert.equal(isLate(new Date("2026-10-25T04:16:00Z"), "09:00", 15), true);
});

test("calculates server duration in whole minutes", () => {
  assert.equal(durationMinutes(new Date("2026-10-25T09:00:00Z"), new Date("2026-10-25T14:05:30Z")), 306);
});

test("marks less than five hours as half day", () => {
  assert.equal(statusAfterCheckout("present", 299), "half_day");
  assert.equal(statusAfterCheckout("present", 300), "present");
});

test("a corrected half day returns to present at five hours", () => {
  assert.equal(statusAfterCheckout("half_day", 300), "present");
});

test("uses the Karachi business date across the UTC boundary", () => {
  assert.equal(companyDate(new Date("2026-10-24T20:00:00Z")), "2026-10-25");
  assert.equal(effectiveAttendanceStatus({ status: "late", checkOut: null, attendanceDate: "2026-10-24" }, "2026-10-25"), "missing_checkout");
  assert.equal(effectiveAttendanceStatus({ status: "late", checkOut: null, attendanceDate: "2026-10-25" }, "2026-10-25"), "late");
});
