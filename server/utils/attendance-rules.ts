export const timeToMinutes = (value: string) => { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; };

import { companyMinutes } from "./company-date";

export const isLate = (checkIn: Date, officeStart: string, graceMinutes: number) => companyMinutes(checkIn) > timeToMinutes(officeStart) + graceMinutes;

export const durationMinutes = (checkIn: Date, checkOut: Date) => Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));

export const statusAfterCheckout = (currentStatus: string, duration: number) => duration < 300 ? "half_day" : currentStatus === "half_day" ? "present" : currentStatus;
