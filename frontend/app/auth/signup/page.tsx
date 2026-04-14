'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { apiService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Boxes } from 'lucide-react';
import type { Branch } from '@/types/logistics';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'operations'>('customer');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await apiService.getBranches();
        setBranches(data);
        if (data.length > 0) {
          setBranchId(data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters with at least one uppercase and one number');
      return;
    }

    setLoading(true);

    try {
      // The signup method in the context doesn't currently take role, so we need to hit API directly or update context.
      // Wait, let's update the context's signup function to take role as well.
      await apiService.signup(email, password, name, role === 'operations' ? branchId : '', role);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Boxes className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-foreground mb-2">Create Account</h1>
          <p className="text-center text-muted-foreground mb-8">Join LogisticHub ERP Portal</p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-foreground font-medium mb-2 block">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-foreground font-medium mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Role Selection */}
            <div>
              <Label htmlFor="role" className="text-foreground font-medium mb-2 block">
                I am a
              </Label>
              <Select value={role} onValueChange={(val: 'customer'|'operations') => setRole(val)}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="customer" className="text-foreground">Customer</SelectItem>
                  <SelectItem value="operations" className="text-foreground">Staff Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch Selection (Only for Staff) */}
            {role === 'operations' && (
              <div>
                <Label htmlFor="branch" className="text-foreground font-medium mb-2 block">
                  Branch <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Select value={branchId} onValueChange={setBranchId} disabled={branchesLoading}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none" className="text-foreground text-muted-foreground italic">No branch / General Staff</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id} className="text-foreground">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-foreground font-medium mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-foreground font-medium mb-2 block">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || branchesLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link href="/auth/login">
            <Button
              type="button"
              variant="outline"
              className="w-full border-border text-foreground hover:bg-secondary/20 bg-transparent"
            >
              Sign In Instead
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
