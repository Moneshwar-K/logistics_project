'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Users,
  Lock,
  Filter,
} from 'lucide-react';
import type { User, Branch } from '@/types/logistics';
import { apiService } from '@/lib/api';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: User['role'];
  branch_id?: string;
  status?: string;
  password?: string;
  last_login?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | User['role']>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'operations' as User['role'],
    branch_id: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await apiService.getBranches();
      setBranches(data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.listUsers({ limit: 100 });
      if (res && res.data) {
        setUsers(res.data.map(u => ({
          ...u,
          is_active: u.status === 'active' || (u as any).is_active !== false,
          id: u.id || (u as any)._id,
        })) as AppUser[]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: User['role']) => {
    const colors: Record<User['role'], string> = {
      admin: 'bg-red-100 text-red-800',
      operations: 'bg-blue-100 text-blue-800',
      customer: 'bg-purple-100 text-purple-800',
      driver: 'bg-orange-100 text-orange-800',
      finance: 'bg-green-100 text-green-800',
    };
    return colors[role];
  };

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <Lock className="w-4 h-4" />;
      case 'operations':
        return <Users className="w-4 h-4" />;
      case 'customer':
        return <Users className="w-4 h-4" />;
      case 'driver':
        return <Users className="w-4 h-4" />;
      case 'finance':
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleDescription = (role: User['role']) => {
    const descriptions: Record<User['role'], string> = {
      admin: 'Full system access, user management, and configuration',
      operations: 'Shipment management, tracking, and operations',
      customer: 'View own shipments and documents',
      driver: 'View assigned shipments and update status',
      finance: 'Access billing, invoices, and payment records',
    };
    return descriptions[role];
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'operations',
      branch_id: '',
    });
    setShowForm(true);
  };

  const handleSaveUser = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Clean up empty branch_id
      const payload = { ...formData };
      if (!payload.branch_id) {
        delete payload.branch_id;
      }

      if (editingUser) {
        const updated = await apiService.updateUser(editingUser.id, payload);
        setUsers(users.map(u => u.id === editingUser.id ? {
          ...u,
          ...updated,
          is_active: updated.status === 'active' || (updated as any).is_active !== false,
        } : u));
      } else {
        const created = await apiService.createUser({ ...payload, password: 'DefaultPassword@123' });
        const newUser: AppUser = {
          ...created,
          id: created.id || (created as any)._id,
          is_active: created.status === 'active' || (created as any).is_active !== false,
          created_at: created.created_at || new Date().toISOString(),
        } as AppUser;
        setUsers([...users, newUser]);
      }
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user. They may already exist.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this user? (Hard delete is disabled)')) {
      try {
        await apiService.updateUser(id, { status: 'inactive' } as any);
        setUsers(users.map(u => u.id === id ? { ...u, is_active: false } : u));
      } catch (error) {
        console.error('Failed to deactivate user:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) return;

      const newStatus = user.is_active ? 'inactive' : 'active';
      await apiService.updateUser(id, { status: newStatus } as any);
      setUsers(users.map(u => u.id === id ? { ...u, is_active: !user.is_active } : u));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const roleStats = [
    { label: 'Admin', count: users.filter(u => u.role === 'admin').length, color: 'bg-red-50' },
    { label: 'Operations', count: users.filter(u => u.role === 'operations').length, color: 'bg-blue-50' },
    { label: 'Finance', count: users.filter(u => u.role === 'finance').length, color: 'bg-green-50' },
    { label: 'Drivers', count: users.filter(u => u.role === 'driver').length, color: 'bg-orange-50' },
    { label: 'Customers', count: users.filter(u => u.role === 'customer').length, color: 'bg-purple-50' },
  ];

  return (
    <MainLayout title="Users">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage roles, permissions, and user accounts</p>
          </div>
          <Button
            onClick={handleAddUser}
            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add User
          </Button>
        </div>

        {/* Role Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {roleStats.map((stat) => (
            <Card key={stat.label} className={`p-4 ${stat.color} border-blue-200`}>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.count}</p>
            </Card>
          ))}
        </div>

        {/* Add/Edit User Form */}
        {showForm && (
          <Card className="p-8 mb-8 bg-white border-blue-200">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="block text-sm font-semibold text-foreground mb-2">Name *</Label>
                <Input
                  type="text"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-blue-200 text-foreground"
                />
              </div>
              <div>
                <Label className="block text-sm font-semibold text-foreground mb-2">Email *</Label>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-blue-200 text-foreground"
                />
              </div>
              <div>
                <Label className="block text-sm font-semibold text-foreground mb-2">Phone</Label>
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-blue-200 text-foreground"
                />
              </div>
              <div>
                <Label className="block text-sm font-semibold text-foreground mb-2">Role *</Label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                  className="w-full px-4 py-2 rounded-lg border border-blue-200 bg-white text-foreground"
                >
                  <option value="admin">Admin</option>
                  <option value="operations">Operations</option>
                  <option value="finance">Finance</option>
                  <option value="driver">Driver</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              <div>
                <Label className="block text-sm font-semibold text-foreground mb-2">Branch</Label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-blue-200 bg-white text-foreground"
                >
                  <option value="">Select Branch (Optional)</option>
                  {branches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-foreground mb-2">Role Permissions</p>
              <p className="text-sm text-muted-foreground">{getRoleDescription(formData.role)}</p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveUser}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6 bg-white border-blue-200">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 text-foreground"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | User['role'])}
              className="px-4 py-2 rounded-lg border border-blue-200 bg-white text-foreground text-sm"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="operations">Operations</option>
              <option value="finance">Finance</option>
              <option value="driver">Driver</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden bg-white border-blue-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-blue-100 hover:bg-blue-50">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {user.is_active ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(user);
                            setFormData({
                              name: user.name,
                              email: user.email,
                              phone: user.phone,
                              role: user.role,
                              branch_id: user.branch_id || '',
                            });
                            setShowForm(true);
                          }}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(user.id)}
                          className={`border-yellow-200 ${user.is_active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                        >
                          {user.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
