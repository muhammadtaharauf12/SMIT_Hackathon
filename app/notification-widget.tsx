"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (typeof window === "undefined" ? "http://localhost:5000" : `http://${window.location.hostname}:5000`);
type Notification = { id: string; title: string; message: string; readAt?: string | null; createdAt: string };

export function NotificationWidget() {
  const [token, setToken] = useState(""); const [open, setOpen] = useState(false); const [items, setItems] = useState<Notification[]>([]); const [unread, setUnread] = useState(0); const [error, setError] = useState("");
  const load = useCallback(async () => { if (!token) return; try { const response = await fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Notifications unavailable"); setItems(payload.data.notifications); setUnread(payload.data.unreadCount); } catch (err) { setError(err instanceof Error ? err.message : "Notifications unavailable"); } }, [token]);
  useEffect(() => { void Promise.resolve().then(() => { const saved = sessionStorage.getItem("hcm_token"); if (saved) setToken(saved); }); }, []);
  useEffect(() => { void Promise.resolve().then(load).catch(() => undefined); }, [load]);
  const markRead = async (id: string) => { const response = await fetch(`${API_URL}/api/notifications/${id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }); if (response.ok) { setItems(items.map(item => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)); setUnread(Math.max(0, unread - 1)); } };
  const markAllRead = async () => { const response = await fetch(`${API_URL}/api/notifications/read-all`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); if (response.ok) { setItems(items.map(item => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }))); setUnread(0); } };
  if (!token) return null;
  return <div className="notification-widget"><button className="notification-launcher" onClick={() => { setOpen(!open); if (!open) void load(); }} aria-expanded={open} aria-label="Open notifications"><span>♧</span>{unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}</button>{open && <section className="notification-popover"><div className="leave-popover-head"><div><span className="panel-kicker">NEXORA</span><h2>Notifications</h2></div><div className="notification-head-actions"><button onClick={() => void markAllRead()} disabled={!unread}>Read all</button><button className="close-button" onClick={() => setOpen(false)} aria-label="Close notifications">×</button></div></div>{error && <div className="form-error">{error}</div>}{items.length === 0 && !error && <p className="empty-copy">You are all caught up.</p>}<div className="notification-list">{items.map(item => <button className={`notification-item ${item.readAt ? "read" : "unread"}`} key={item.id} onClick={() => !item.readAt && void markRead(item.id)}><span className="notification-dot" /><span><strong>{item.title}</strong><small>{item.message}</small><time>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time></span></button>)}</div></section>}</div>;
}
