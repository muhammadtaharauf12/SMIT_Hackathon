const daysInMonth = (month: string) => { const [year, value] = month.split("-").map(Number); return new Date(Date.UTC(year, value, 0)).getUTCDate(); };
export const monthBounds = (month: string) => { const value = Number(month.slice(5)); return { start: `${month}-01`, end: `${month}-${String(new Date(Date.UTC(Number(month.slice(0, 4)), value, 0)).getUTCDate()).padStart(2, "0")}` }; };

export const workingDates = (start: string, end: string, weekendDays: number[] = [0, 6], holidays: Set<string> = new Set()) => {
  const dates: string[] = [];
  for (let cursor = new Date(`${start}T00:00:00.000Z`); cursor <= new Date(`${end}T00:00:00.000Z`); cursor = new Date(cursor.getTime() + 86400000)) {
    const date = cursor.toISOString().slice(0, 10);
    if (!weekendDays.includes(cursor.getUTCDay()) && !holidays.has(date)) dates.push(date);
  }
  return dates;
};

export type PayrollLedger = { workingDays: number; eligibleWorkingDays?: number; absentDays?: number; unpaidLeaveDays?: number; halfDayUnits?: number };

export const payrollLedger = (ledger: PayrollLedger) => {
  const absentDays = Math.max(0, ledger.absentDays ?? 0);
  const unpaidLeaveDays = Math.max(0, ledger.unpaidLeaveDays ?? 0);
  const halfDayUnits = Math.max(0, ledger.halfDayUnits ?? 0);
  const workingDays = Math.max(1, Math.round(ledger.workingDays));
  return { workingDays, absentDays, unpaidLeaveDays, halfDayUnits, deductionUnits: absentDays + unpaidLeaveDays + halfDayUnits * 0.5 };
};

export const annualTax = (annualGross: number) => {
  if (annualGross <= 600000) return 0;
  if (annualGross <= 1200000) return Math.round((annualGross - 600000) * 0.05);
  if (annualGross <= 2400000) return Math.round(30000 + (annualGross - 1200000) * 0.15);
  if (annualGross <= 3600000) return Math.round(210000 + (annualGross - 2400000) * 0.25);
  return Math.round(510000 + (annualGross - 3600000) * 0.35);
};

export const prorationFactor = (month: string, joinDate?: Date | null, exitDate?: Date | null) => {
  const { start: monthStart, end: monthEnd } = monthBounds(month); const first = joinDate ? joinDate.toISOString().slice(0, 10) : monthStart; const last = exitDate ? exitDate.toISOString().slice(0, 10) : monthEnd; const start = first > monthStart ? first : monthStart; const end = last < monthEnd ? last : monthEnd; if (start > end) return 0; return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`) + 86400000) / (daysInMonth(month) * 86400000);
};

export const monthlyPayroll = (basicSalary: number, month = "2000-01", joinDate?: Date | null, exitDate?: Date | null, ledger?: PayrollLedger) => {
  const safeBasic = Math.max(0, Math.round(basicSalary)); const hra = Math.round(safeBasic * 0.4); const medical = Math.round(safeBasic * 0.1); const monthlyGross = Math.round(safeBasic * 1.5); const factor = ledger?.eligibleWorkingDays !== undefined ? Math.max(0, Math.min(1, ledger.eligibleWorkingDays / Math.max(1, ledger.workingDays))) : prorationFactor(month, joinDate, exitDate); const grossPay = Math.round(monthlyGross * factor); const tax = Math.round(annualTax(monthlyGross * 12) / 12 * factor); const base = { hra: Math.round(hra * factor), medical: Math.round(medical * factor), grossPay, tax, prorationFactor: factor };
  if (!ledger) return { ...base, deductions: tax, netPay: Math.max(0, grossPay - tax) };
  const normalized = payrollLedger(ledger); const attendanceDeduction = Math.round((monthlyGross / normalized.workingDays) * normalized.deductionUnits); const deductions = tax + attendanceDeduction;
  return { ...base, ...normalized, attendanceDeduction, deductions, netPay: Math.max(0, grossPay - deductions) };
};
