"use client";

import { FormEvent, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (typeof window === "undefined" ? "http://localhost:5000" : `http://${window.location.hostname}:5000`);
type Announcement = { id: string; title: string; body: string; createdAt: string };

export function Announcements({ token, role }: { token: string; role: "admin" | "hr" | "employee" }) {
  const [records, setRecords] = useState<Announcement[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/announcements`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async response => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Announcements unavailable"); return payload.data.announcements as Announcement[]; })
      .then(setRecords)
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Announcements unavailable"); });
    return () => controller.abort();
  }, [token]);
  const post = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/announcements`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Announcement could not be posted");
      setRecords(current => [payload.data.announcement, ...current].slice(0, 20));
      setForm({ title: "", body: "" });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Announcement could not be posted"); }
    finally { setBusy(false); }
  };
  return <section className="panel"><div className="panel-title"><div><span className="panel-kicker">COMMUNICATIONS</span><h2>Announcements</h2></div></div>{error && <div className="form-error" role="alert">{error}</div>}{records.length ? <div className="module-list">{records.map(record => <article className="module-row" key={record.id}><div><strong>{record.title}</strong><p>{record.body}</p></div><small>{new Date(record.createdAt).toLocaleDateString()}</small></article>)}</div> : <p className="empty-copy">No announcements yet.</p>}{role !== "employee" && <form className="form-stack compact" onSubmit={post}><label>Title<input required maxLength={120} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label><label>Message<textarea required maxLength={1000} value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} /></label><button className="button button-primary" disabled={busy}>{busy ? "Posting…" : "Post announcement"}</button></form>}</section>;
}
