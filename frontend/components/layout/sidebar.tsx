'use client';

import React from "react"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Boxes,
  ChevronDown,
  FileText,
  LogOut,
  MapPin,
  Menu,
  Package,
  Settings,
  Truck,
  Users,
  X,
  LayoutDashboard,
  Search,
  ReceiptText,
  CheckSquare,
  Upload,
  Building2,
  UserCog,
  Globe,
  Cog,
  Warehouse,
  ClipboardList,
  CalendarCheck,
  Calculator,
  Plane,
  ArrowDown,
  CheckCircle,
  Bell,
  DollarSign,
  Hash,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[]; // Optional role restriction
  children?: SidebarItem[];
}

const menuItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    // Visible to all
  },
  {
    label: 'Master',
    href: '/master',
    icon: <Cog className="w-5 h-5" />,
    roles: ['admin'],
    children: [
      { label: 'Clients', href: '/master/clients', icon: <Users className="w-4 h-4" /> },
      { label: 'Branches', href: '/master/branches', icon: <Building2 className="w-4 h-4" /> },
      { label: 'Employees', href: '/master/employees', icon: <UserCog className="w-4 h-4" /> },
      { label: 'Service Types', href: '/master/service-types', icon: <Globe className="w-4 h-4" /> },
      { label: 'Organization', href: '/master/organization', icon: <Warehouse className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Billing',
    href: '/billing',
    icon: <ReceiptText className="w-5 h-5" />,
    roles: ['admin', 'finance', 'operations'],
    children: [
      { label: 'HAWB Booking', href: '/billing/hawb-booking', icon: <ClipboardList className="w-4 h-4" /> },
      { label: 'HAWB Audit', href: '/billing/hawb-audit', icon: <Search className="w-4 h-4" /> },
      { label: 'Invoice Generation', href: '/billing/invoice-generation', icon: <ReceiptText className="w-4 h-4" /> },
      { label: 'Duty Bill Generation', href: '/billing/duty-generation', icon: <DollarSign className="w-4 h-4" /> },
      { label: 'Invoices', href: '/billing/invoices', icon: <FileText className="w-4 h-4" /> },
      { label: 'Rate Cards', href: '/billing/rates', icon: <Calculator className="w-4 h-4" /> },
      { label: 'Rate Calculator', href: '/billing/rate-calculator', icon: <Calculator className="w-4 h-4" /> },
      { label: 'Zone Tariff', href: '/billing/zone-tariff', icon: <Globe className="w-4 h-4" /> },
      { label: 'FSC Charge', href: '/billing/fsc-charge', icon: <DollarSign className="w-4 h-4" /> },
      { label: 'AWB Management', href: '/billing/awb', icon: <Plane className="w-4 h-4" /> },
      { label: 'Billing Reports', href: '/billing/reports', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'E-Way Bills', href: '/eway-bills', icon: <FileText className="w-4 h-4" /> },
      { label: 'Documents', href: '/documents', icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Operations',
    href: '/operations',
    icon: <Truck className="w-5 h-5" />,
    roles: ['admin', 'operations', 'driver'],
    children: [
      { label: 'Shipments', href: '/shipments/list', icon: <Package className="w-4 h-4" /> },
      { label: 'Create Booking', href: '/shipments/booking/manual', icon: <ClipboardList className="w-4 h-4" /> },
      { label: 'Status Update', href: '/operations/status-update', icon: <CheckSquare className="w-4 h-4" /> },
      { label: 'Proof of Delivery', href: '/operations/pod', icon: <CalendarCheck className="w-4 h-4" /> },
      { label: 'Upload Documents', href: '/operations/pod-upload', icon: <Upload className="w-4 h-4" /> },
      { label: 'Consolidate Report', href: '/operations/consolidate-report', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'POD List', href: '/pods/list', icon: <ReceiptText className="w-4 h-4" /> },
      { label: 'Pickup Requests', href: '/operations/pickups', icon: <Truck className="w-4 h-4" /> },
      { label: 'Floor Stock', href: '/operations/stock', icon: <Package className="w-4 h-4" /> },
      { label: 'Manifests', href: '/operations/manifests', icon: <FileText className="w-4 h-4" /> },
      { label: 'Receiving', href: '/operations/receiving', icon: <ArrowDown className="w-4 h-4" /> },
      { label: 'Delivery Run Sheets', href: '/operations/drs', icon: <Truck className="w-4 h-4" /> },
    ],
  },
  {
    label: 'My Shipments',
    href: '/shipments/list',
    icon: <Package className="w-5 h-5" />,
    roles: ['customer'],
  },
  {
    label: 'Tracking',
    href: '/tracking',
    icon: <Warehouse className="w-5 h-5" />,
    children: [
      { label: 'Booking', href: '/shipments/booking/manual', icon: <Package className="w-4 h-4" />, roles: ['admin', 'operations'] },
      { label: 'Tracking', href: '/tracking', icon: <Search className="w-4 h-4" /> },
      { label: 'Public Tracking', href: '/tracking/quick', icon: <Globe className="w-4 h-4" /> },
      { label: 'Customer Portal', href: '/tracking/customer', icon: <MapPin className="w-4 h-4" />, roles: ['admin', 'customer'] },
    ],
  },
  {
    label: 'Admin',
    href: '/admin',
    icon: <ShieldCheck className="w-5 h-5" />,
    roles: ['admin'],
    children: [
      { label: 'HAWB Allocation', href: '/admin/hawb-allocation', icon: <Hash className="w-4 h-4" /> },
      { label: 'Notifications', href: '/admin/notifications', icon: <Bell className="w-4 h-4" /> },
      { label: 'Order Enquiry', href: '/admin/order-enquiry', icon: <Search className="w-4 h-4" /> },
      { label: 'User Management', href: '/admin/users', icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Audit Log',
    href: '/audit',
    icon: <CheckSquare className="w-5 h-5" />,
    roles: ['admin', 'operations'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };
  
  const filteredMenuItems = menuItems.filter(item => {
    // Top-level role check
    if (item.roles && user?.role && !item.roles.includes(user.role)) {
      return false;
    }
    return true;
  }).map(item => {
    // Children role check
    if (item.children) {
      return {
        ...item,
        children: item.children.filter(child => {
          if (child.roles && user?.role && !child.roles.includes(user.role)) {
            return false;
          }
          return true;
        })
      };
    }
    return item;
  });

  return (
    <>
      {/* Mobile Menu Button - shown only on small screens */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-sidebar text-sidebar-foreground"
        onClick={onClose}
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-30',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Boxes className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">SRI CAARGO</h1>
              <p className="text-xs text-sidebar-foreground/60">ERP Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredMenuItems.map((item) => (
            <div key={item.label}>
              <div className="flex items-center">
                {item.children ? (
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={cn(
                      'flex-1 flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-left',
                      expandedItems[item.label] || isActive(item.href)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 font-medium text-sm">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform',
                        expandedItems[item.label] ? 'rotate-180' : ''
                      )}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex-1 flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                      isActive(item.href)
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                    onClick={onClose}
                  >
                    {item.icon}
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                )}
              </div>

              {/* Submenu */}
              {item.children && expandedItems[item.label] && (
                <div className="ml-4 mt-1 space-y-0.5 pl-4 border-l border-sidebar-border/30">
                  {item.children.map((subitem) => (
                    <Link
                      key={subitem.label}
                      href={subitem.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                        isActive(subitem.href)
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )}
                      onClick={onClose}
                    >
                      {subitem.icon}
                      <span>{subitem.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-sidebar-border p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
