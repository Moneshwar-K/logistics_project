'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Search, Edit2, Trash2, X, UserCog, Filter } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface Employee { _id: string; employee_code: string; name: string; email: string; phone: string; designation: string; department: string; branch_id: any; date_of_joining: string; address?: string; city?: string; state?: string; pincode?: string; aadhaar_number?: string; pan_number?: string; bank_details?: { bank_name: string; account_number: string; ifsc_code: string }; salary?: number; status: string; }

const emptyEmployee: Partial<Employee> = { employee_code: '', name: '', email: '', phone: '', designation: '', department: '', branch_id: '', date_of_joining: new Date().toISOString().split('T')[0], address: '', city: '', state: '', pincode: '', aadhaar_number: '', pan_number: '', bank_details: { bank_name: '', account_number: '', ifsc_code: '' }, salary: 0 };

const InputField = ({ label, value, onChange, required, mono, type }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; mono?: boolean; type?: string }) => (
    <div><label className="text-xs font-medium text-muted-foreground mb-1 block">{label}{required && ' *'}</label>
        <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} className={`w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${mono ? 'font-mono uppercase' : ''}`} /></div>
);

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Partial<Employee> | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const getHeaders = () => { const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }; };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams(); if (search) params.set('search', search); if (filterDept) params.set('department', filterDept);
            const [empRes, brRes] = await Promise.all([fetch(`${API_BASE}/employees?${params}`, { headers: getHeaders() }), fetch(`${API_BASE}/branches`, { headers: getHeaders() })]);
            const [empJson, brJson] = await Promise.all([empRes.json(), brRes.json()]);
            setEmployees(empJson.data || []);
            // branches API returns { data: { data: [...], total, ... } } — unwrap nested structure
            const branchData = brJson.data;
            setBranches(Array.isArray(branchData) ? branchData : (branchData?.data || []));
        } catch { setError('Failed to load data'); } finally { setLoading(false); }
    }, [search, filterDept]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async () => {
        if (!editing?.name || !editing?.employee_code || !editing?.email) { setError('Name, Code and Email required'); return; }
        setSaving(true); setError('');
        try { const isEdit = !!(editing as Employee)?._id; const url = isEdit ? `${API_BASE}/employees/${(editing as Employee)._id}` : `${API_BASE}/employees`; const res = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: getHeaders(), body: JSON.stringify(editing) }); if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Failed'); } setShowModal(false); setEditing(null); fetchData(); } catch (e: any) { setError(e.message); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => { if (!confirm('Deactivate?')) return; try { await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE', headers: getHeaders() }); fetchData(); } catch { setError('Failed'); } };

    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
    const getBranchName = (bid: any) => typeof bid === 'object' ? bid?.name : branches.find(b => b._id === bid)?.name || '—';

    return (
        <MainLayout title="Employee Management">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div><h1 className="text-2xl font-bold text-foreground">Employee Management</h1><p className="text-sm text-muted-foreground mt-1">Manage employees across branches</p></div>
                    <button onClick={() => { setEditing({ ...emptyEmployee }); setShowModal(true); setError(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"><Plus className="w-4 h-4" /> Add Employee</button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    {departments.length > 0 && <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="pl-10 pr-8 py-2.5 bg-card border border-border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"><option value="">All Departments</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[{ label: 'Total Employees', value: employees.length, c: 'text-blue-400' }, { label: 'Active', value: employees.filter(e => e.status === 'active').length, c: 'text-green-400' }, { label: 'Departments', value: departments.length, c: 'text-purple-400' }].map((s, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4"><div className="flex items-center gap-3"><UserCog className={`w-5 h-5 ${s.c}`} /><div><p className="text-2xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></div></div>
                    ))}
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {loading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : employees.length === 0 ? <div className="p-12 text-center"><UserCog className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No employees found</p></div> : (
                        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border bg-muted/30">
                            {['Code', 'Name', 'Department', 'Designation', 'Branch', 'Phone', 'Joining', 'Actions'].map(h => <th key={h} className={`${h === 'Actions' ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-medium text-muted-foreground uppercase`}>{h}</th>)}
                        </tr></thead><tbody className="divide-y divide-border">
                                {employees.map(emp => (
                                    <tr key={emp._id} className="hover:bg-muted/20">
                                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{emp.employee_code}</td>
                                        <td className="px-4 py-3 font-medium text-sm">{emp.name}<div className="text-xs text-muted-foreground">{emp.email}</div></td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{emp.department}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{emp.designation}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{getBranchName(emp.branch_id)}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{emp.phone}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => { setEditing({ ...emp, branch_id: typeof emp.branch_id === 'object' ? emp.branch_id?._id : emp.branch_id }); setShowModal(true); setError(''); }} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(emp._id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive ml-1"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody></table></div>
                    )}
                </div>
            </div>

            {showModal && editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-border"><h2 className="text-lg font-bold">{(editing as Employee)?._id ? 'Edit Employee' : 'Add Employee'}</h2><button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-md"><X className="w-5 h-5" /></button></div>
                        <div className="p-6 space-y-4">
                            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Employee Code" value={editing.employee_code || ''} onChange={v => setEditing({ ...editing, employee_code: v })} required mono />
                                <InputField label="Name" value={editing.name || ''} onChange={v => setEditing({ ...editing, name: v })} required />
                                <InputField label="Email" value={editing.email || ''} onChange={v => setEditing({ ...editing, email: v })} required type="email" />
                                <InputField label="Phone" value={editing.phone || ''} onChange={v => setEditing({ ...editing, phone: v })} required />
                                <InputField label="Designation" value={editing.designation || ''} onChange={v => setEditing({ ...editing, designation: v })} />
                                <InputField label="Department" value={editing.department || ''} onChange={v => setEditing({ ...editing, department: v })} />
                                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Branch</label><select value={typeof editing.branch_id === 'object' ? editing.branch_id?._id : editing.branch_id || ''} onChange={e => setEditing({ ...editing, branch_id: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"><option value="">Select Branch</option>{branches.map(b => <option key={b._id} value={b._id}>{b.name} ({b.code})</option>)}</select></div>
                                <InputField label="Date of Joining" value={(editing.date_of_joining || '').split('T')[0]} onChange={v => setEditing({ ...editing, date_of_joining: v })} type="date" />
                            </div>
                            <InputField label="Address" value={editing.address || ''} onChange={v => setEditing({ ...editing, address: v })} />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <InputField label="City" value={editing.city || ''} onChange={v => setEditing({ ...editing, city: v })} />
                                <InputField label="State" value={editing.state || ''} onChange={v => setEditing({ ...editing, state: v })} />
                                <InputField label="Pincode" value={editing.pincode || ''} onChange={v => setEditing({ ...editing, pincode: v })} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <InputField label="Aadhaar" value={editing.aadhaar_number || ''} onChange={v => setEditing({ ...editing, aadhaar_number: v })} mono />
                                <InputField label="PAN" value={editing.pan_number || ''} onChange={v => setEditing({ ...editing, pan_number: v })} mono />
                                <InputField label="Salary" value={String(editing.salary || '')} onChange={v => setEditing({ ...editing, salary: Number(v) })} type="number" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground pt-2">Bank Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <InputField label="Bank Name" value={editing.bank_details?.bank_name || ''} onChange={v => setEditing({ ...editing, bank_details: { ...editing.bank_details!, bank_name: v } })} />
                                <InputField label="Account No." value={editing.bank_details?.account_number || ''} onChange={v => setEditing({ ...editing, bank_details: { ...editing.bank_details!, account_number: v } })} mono />
                                <InputField label="IFSC" value={editing.bank_details?.ifsc_code || ''} onChange={v => setEditing({ ...editing, bank_details: { ...editing.bank_details!, ifsc_code: v } })} mono />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save Employee'}</button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
