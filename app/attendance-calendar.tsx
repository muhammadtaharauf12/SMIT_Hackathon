"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (typeof window === "undefined" ? "http://localhost:5000" : `http://${window.location.hostname}:5000`);
type Day = { date: string; status: string };

export function AttendanceCalendar({ token }: { token: string }) {
  const [month, setMonth] = useState("");
  const [days, setDays] = useState<Day[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { void Promise.resolve().then(() => setMonth(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit" }).format(new Date()))); }, []);
  useEffect(() => {
    if (!month) return;
    const controller = new AbortController();
    fetch(`${API_URL}/api/attendance/calendar?month=${month}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async response => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Calendar unavailable"); return payload.data.days as Day[]; })
      .then(setDays)
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Calendar unavailable"); });
    return () => controller.abort();
  }, [month, token]);
  const offset = days.length ? new Date(`${days[0].date}T00:00:00.000Z`).getUTCDay() : 0;
  return <section className="panel"><div className="panel-title"><div><span className="panel-kicker">MY RECORDS</span><h2>Attendance calendar</h2></div></div><label>Month<input type="month" value={month} onChange={event => { setMonth(event.target.value); setError(""); }} /></label>{error && <div className="form-error" role="alert">{error}</div>}<div className="attendance-calendar">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <strong className="attendance-calendar-heading" key={day}>{day}</strong>)}{Array.from({ length: offset }, (_, index) => <span key={`offset-${index}`} />)}{days.map(day => <div key={day.date} className="attendance-calendar-day"><strong>{day.date.slice(-2)}</strong><small>{day.status ? day.status.replaceAll("_", " ") : "—"}</small></div>)}</div></section>;
}
