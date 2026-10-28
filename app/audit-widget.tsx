"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (typeof window === "undefined" ? "http://localhost:5000" : `http://${window.location.hostname}:5000`);
type AuditLog = { id: string; action: string; entityType: string; summary: string; createdAt: string; actor?: { name?: string; role?: string } };

export function AuditWidget() {
  const [token, setToken] = useState(""); const [isAdmin, setIsAdmin] = useState(false); const [open, setOpen] = useState(false); const [logs, setLogs] = useState<AuditLog[]>([]); const [error, setError] = useState("");
  const load = useCallback(async () => { if (!token) return; try { const meResponse = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }); const me = await meResponse.json(); if (me.data?.user?.role !== "admin") return; setIsAdmin(true); const response = await fetch(`${API_URL}/api/audit`, { headers: { Authorization: `Bearer ${token}` } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Audit log unavailable"); setLogs(payload.data.logs); } catch (err) { setError(err instanceof Error ? err.message : "Audit log unavailable"); } }, [token]);
  useEffect(() => { void Promise.resolve().then(() => { const saved = sessionStorage.getItem("hcm_token"); if (saved) setToken(saved); }); }, []);
  useEffect(() => { void Promise.resolve().then(load).catch(() => undefined); }, [load]);
  if (!isAdmin) return null;
  return <div className="audit-widget"><button className="audit-launcher" onClick={() => { setOpen(!open); if (!open) void load(); }} aria-expanded={open}><span>≡</span> Audit log</button>{open && <section className="audit-popover"><div className="leave-popover-head"><div><span className="panel-kicker">ADMIN ONLY</span><h2>Audit log</h2></div><button className="close-button" onClick={() => setOpen(false)} aria-label="Close audit log">×</button></div><p className="ai-note">Immutable decision history for this workspace.</p>{error && <div className="form-error">{error}</div>}{logs.length === 0 && !error && <p className="empty-copy">No audit events yet.</p>}<div className="audit-list">{logs.map(log => <article className="audit-item" key={log.id}><div><strong>{log.summary}</strong><small>{log.action} · {log.actor?.name ?? "Admin"}</small></div><time>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.createdAt))}</time></article>)}</div></section>}</div>;
}
