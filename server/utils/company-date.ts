const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export const companyParts = (date: Date) => Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
export const companyDate = (date: Date = new Date()) => { const parts = companyParts(date); return `${parts.year}-${parts.month}-${parts.day}`; };
export const companyMinutes = (date: Date) => { const parts = companyParts(date); return Number(parts.hour) * 60 + Number(parts.minute); };
export const validIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
export const effectiveAttendanceStatus = (record: { status: string; checkOut?: Date | null; attendanceDate: string }, today = companyDate()) => !record.checkOut && record.attendanceDate < today ? "missing_checkout" : record.status;
