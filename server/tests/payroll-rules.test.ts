import assert from "node:assert/strict";
import test from "node:test";
import { monthlyPayroll } from "../utils/payroll-rules";

test("creates a monthly payslip snapshot from basic salary", () => {
  assert.deepEqual(monthlyPayroll(125000), { hra: 50000, medical: 12500, grossPay: 187500, deductions: 15625, tax: 15625, prorationFactor: 1, netPay: 171875 });
});

test("prevents negative payroll values", () => {
  assert.deepEqual(monthlyPayroll(-10), { hra: 0, medical: 0, grossPay: 0, deductions: 0, tax: 0, prorationFactor: 1, netPay: 0 });
});

test("prorates a joiner from the join date through the month", () => {
  assert.equal(monthlyPayroll(31000, "2026-04", new Date("2026-04-16T00:00:00.000Z")).prorationFactor, 0.5);
});

test("prorates an employee leaving during the month", () => {
  assert.equal(monthlyPayroll(31000, "2026-04", null, new Date("2026-04-15T00:00:00.000Z")).prorationFactor, 0.5);
});

test("does not pay outside employment dates", () => {
  assert.equal(monthlyPayroll(31000, "2026-04", new Date("2026-05-01T00:00:00.000Z")).grossPay, 0);
  assert.equal(monthlyPayroll(31000, "2026-04", null, new Date("2026-03-31T00:00:00.000Z")).grossPay, 0);
});

test("uses working days for joiner payroll when a ledger is supplied", () => {
  const slip = monthlyPayroll(100000, "2026-04", new Date("2026-04-16T00:00:00.000Z"), null, { workingDays: 22, eligibleWorkingDays: 11, absentDays: 1 });
  assert.equal(slip.prorationFactor, 0.5);
  assert.equal(slip.grossPay, 75000);
  assert.ok("attendanceDeduction" in slip);
  assert.equal(slip.attendanceDeduction, 6818);
});

test("deducts absence, unpaid leave, and half-day units from net pay", () => {
  assert.deepEqual(monthlyPayroll(100000, "2026-04", null, null, { workingDays: 22, absentDays: 1, unpaidLeaveDays: 2, halfDayUnits: 1 }), {
    hra: 40000, medical: 10000, grossPay: 150000, tax: 10000, workingDays: 22, absentDays: 1, unpaidLeaveDays: 2, halfDayUnits: 1, deductionUnits: 3.5, attendanceDeduction: 23864, deductions: 33864, prorationFactor: 1, netPay: 116136,
  });
});
