"use client";

import { useEffect, useState } from "react";
import { Announcements } from "./announcements";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (typeof window === "undefined" ? "http://localhost:5000" : `http://${window.location.hostname}:5000`);
type Summary = { role: "admin" | "hr" | "employee"; date: string; headcount?: number; attendance?: { present: number; late: number; halfDay: number; missingCheckout: number; absent: number; onLeave: number }; approvals?: { leave: number; corrections: number }; payroll?: { month: string; status: string; net: number } | null; attendanceToday?: { status: string; checkIn: string } | null; pendingLeave?: number; payslip?: { month: string; netPay: number } | null };

export function LiveDashboard({ token, role, onNavigate }: { token: string; role: Summary["role"]; onNavigate: (page: string) => void }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/analytics/summary`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async response => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Dashboard unavailable"); return payload.data as Summary; })
      .then(data => { setSummary(data); setLoading(false); })
      .catch(reason => { if (!controller.signal.aborted) { setError(reason instanceof Error ? reason.message : "Dashboard unavailable"); setLoading(false); } });
    return () => controller.abort();
  }, [token]);
  if (loading) return <section className="panel module-panel"><span className="loader" /><h2>Loading dashboard…</h2></section>;
  if (error || !summary) return <section className="panel module-panel"><div className="form-error" role="alert">{error || "Dashboard unavailable"}</div></section>;
  if (role === "employee") return <><div className="stat-grid"><div className="stat-card"><span className="stat-mark teal">◉</span><div><strong>{summary.attendanceToday?.status ?? "No check-in"}</strong><small>Attendance today</small></div></div><div className="stat-card"><span className="stat-mark aqua">◇</span><div><strong>{summary.pendingLeave ?? 0}</strong><small>Pending leave requests</small></div></div><div className="stat-card"><span className="stat-mark violet">▤</span><div><strong>{summary.payslip ? summary.payslip.netPay.toLocaleString() : "No payslip"}</strong><small>Latest finalized payslip</small></div></div></div><section className="panel hero-panel"><div className="panel-kicker">MY WORKSPACE</div><h2>Your people records</h2><p>Review attendance today, leave, and published payslips.</p><button className="button button-dark" onClick={() => onNavigate("Attendance")}>Open attendance →</button></section><Announcements token={token} role={role} /></>;
  const attendance = summary.attendance;
  const approvals = (summary.approvals?.leave ?? 0) + (summary.approvals?.corrections ?? 0);
  return <><div className="stat-grid"><div className="stat-card"><span className="stat-mark teal">◉</span><div><strong>{summary.headcount ?? 0}</strong><small>Active employees</small></div></div><div className="stat-card"><span className="stat-mark aqua">◌</span><div><strong>{(attendance?.present ?? 0) + (attendance?.late ?? 0)}</strong><small>Present or late today</small></div></div><div className="stat-card"><span className="stat-mark violet">◇</span><div><strong>{approvals}</strong><small>Pending people requests</small></div></div></div><div className="grid-main"><section className="panel hero-panel"><div className="panel-kicker">TODAY · {summary.date}</div><h2>People operations at a glance</h2><p>{attendance?.late ?? 0} late · {attendance?.halfDay ?? 0} half day · {attendance?.missingCheckout ?? 0} missing checkout - {attendance?.absent ?? 0} absent - {attendance?.onLeave ?? 0} on leave</p><button className="button button-dark" onClick={() => onNavigate("Attendance")}>Review attendance →</button></section><section className="panel checklist"><div className="panel-title"><h2>Needs review</h2><span className="status-pill">Live data</span></div><div className="check-row"><span>Leave requests</span><strong>{summary.approvals?.leave ?? 0}</strong></div><div className="check-row"><span>Attendance corrections</span><strong>{summary.approvals?.corrections ?? 0}</strong></div><div className="check-row"><span>Payroll</span><strong>{summary.payroll ? `${summary.payroll.month} · ${summary.payroll.status}` : "No run this month"}</strong></div><button className="button button-dark" onClick={() => onNavigate("Leave")}>Open leave inbox →</button></section></div><Announcements token={token} role={role} /></>;
}
