"use client";

import { FormEvent, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (typeof window === "undefined" ? "http://localhost:5000" : `http://${window.location.hostname}:5000`);
type Employee = { id: string; name: string; phone?: string; address?: string; department?: string; designation: string; basicSalary: number; status: string; exitDate?: string | null };

export function EmployeeEditor({ token, role, employee, onClose, onSaved }: { token: string; role: "hr" | "employee"; employee: Employee; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ phone: employee.phone ?? "", address: employee.address ?? "", department: employee.department ?? "", designation: employee.designation, basicSalary: String(employee.basicSalary), status: employee.status, exitDate: employee.exitDate?.slice(0, 10) ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const body = role === "hr" ? { ...form, basicSalary: Number(form.basicSalary), exitDate: form.exitDate || null } : { phone: form.phone, address: form.address };
      const response = await fetch(`${API_URL}/api/employees/${employee.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Employee update failed");
      onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Employee update failed"); }
    finally { setBusy(false); }
  };
  return <section className="panel"><div className="panel-title"><div><span className="panel-kicker">EMPLOYEE 360</span><h2>Edit {employee.name}</h2></div><button className="close-button" type="button" onClick={onClose} aria-label="Close editor">×</button></div>{error && <div className="form-error" role="alert">{error}</div>}<form className="form-stack compact" onSubmit={save}><label>Phone<input value={form.phone} maxLength={30} onChange={event => setForm({ ...form, phone: event.target.value })} /></label><label>Address<input value={form.address} maxLength={240} onChange={event => setForm({ ...form, address: event.target.value })} /></label>{role === "hr" && <><label>Department<input value={form.department} onChange={event => setForm({ ...form, department: event.target.value })} /></label><label>Designation<input required value={form.designation} onChange={event => setForm({ ...form, designation: event.target.value })} /></label><label>Basic salary<input type="number" required min="1" value={form.basicSalary} onChange={event => setForm({ ...form, basicSalary: event.target.value })} /></label><label>Status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><label>Exit date<input type="date" value={form.exitDate} onChange={event => setForm({ ...form, exitDate: event.target.value })} /></label></>}<button className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Save employee"}</button></form></section>;
}
