"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (typeof window === "undefined" ? "http://localhost:5000" : `http://${window.location.hostname}:5000`);
type Account = { id: string; name: string; email: string; role: string; active: boolean };

export function AccountAdmin({ token, ownId }: { token: string; ownId: string }) {
  const [users, setUsers] = useState<Account[]>([]);
  const [selected, setSelected] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { const response = await fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Accounts unavailable"); setUsers(payload.data.users); } catch (reason) { setError(reason instanceof Error ? reason.message : "Accounts unavailable"); } }, [token]);
  useEffect(() => { void Promise.resolve().then(load); window.addEventListener("nexora-hr-created", load); return () => window.removeEventListener("nexora-hr-created", load); }, [load]);
  const change = async (path: string, method: string, body?: Record<string, unknown>) => { setBusy(true); setError(""); setMessage(""); try { const response = await fetch(`${API_URL}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, ...(body ? { body: JSON.stringify(body) } : {}) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Account update failed"); setMessage("Account updated."); setTemporaryPassword(""); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Account update failed"); } finally { setBusy(false); } };
  const reset = (event: FormEvent) => { event.preventDefault(); if (selected) void change(`/api/users/${selected}/reset-password`, "POST", { temporaryPassword }); };
  return <section className="panel"><div className="panel-title"><div><span className="panel-kicker">ADMIN ONLY</span><h2>Account access</h2></div></div>{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="success-message" role="status">{message}</div>}<div className="module-list">{users.map(user => <div className="module-row" key={user.id}><div><strong>{user.name}</strong><small>{user.email} · {user.role} · {user.active ? "Active" : "Inactive"}</small></div>{user.id !== ownId && user.active && <button type="button" disabled={busy} onClick={() => void change(`/api/users/${user.id}/deactivate`, "PATCH")}>Deactivate</button>}</div>)}</div><form className="form-stack compact" onSubmit={reset}><label>Issue temporary password<select required value={selected} onChange={event => setSelected(event.target.value)}><option value="">Choose account</option>{users.filter(user => user.id !== ownId).map(user => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}</select></label><label>New temporary password<input required type="password" minLength={8} value={temporaryPassword} onChange={event => setTemporaryPassword(event.target.value)} /></label><button className="button button-dark" disabled={busy}>{busy ? "Updating…" : "Reset password"}</button></form></section>;
}
