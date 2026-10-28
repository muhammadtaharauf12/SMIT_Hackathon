const utcDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

export const workingDays = (start: string, end: string, holidays: Set<string> = new Set(), weekendDays: number[] = [0, 6]) => {
  let count = 0;
  for (let cursor = utcDate(start); cursor <= utcDate(end); cursor = new Date(cursor.getTime() + 86400000)) {
    const date = cursor.toISOString().slice(0, 10);
    const weekday = cursor.getUTCDay();
    if (!weekendDays.includes(weekday) && !holidays.has(date)) count += 1;
  }
  return count;
};

export const overlaps = (start: string, end: string, otherStart: string, otherEnd: string) => start <= otherEnd && end >= otherStart;
