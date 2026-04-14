'use client';

import React from "react"

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Spinner } from '@/components/ui/spinner';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (user) {
        // Strict Role-Based Route Protection
        const isCustomer = user.role === 'customer';
        
        // Paths restricted for customers
        const restrictedForCustomers = [
          '/master',
          '/billing',
          '/admin',
          '/operations',
          '/audit',
          '/eway-bills',
          '/documents'
        ];

        const isTryingRestrictedPath = restrictedForCustomers.some(path => 
          pathname === path || pathname.startsWith(path + '/')
        );

        if (isCustomer && isTryingRestrictedPath) {
          console.warn(`Access Denied: Role ${user.role} restricted from ${pathname}`);
          router.push('/dashboard'); // Redirect to their safe dashboard
        }
      }
    }
  }, [isAuthenticated, loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner className="mx-auto mb-4" />
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <Header title={title} />

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card px-6 py-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 LogisticHub ERP. All rights reserved.</p>
        </footer>
      </div>

      {/* Sidebar is rendered above */}
    </div>
  );
}
