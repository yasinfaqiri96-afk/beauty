import type { ComponentType } from 'react';
import {
  Squares2X2Icon,
  DocumentChartBarIcon,
  ArchiveBoxIcon,
  CubeIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  TruckIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
} from '@heroicons/react/24/solid';

export interface MenuItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  to: string;
}

export const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'داشبورد', icon: Squares2X2Icon, to: '/dashboard' },
  { id: 'reports', label: 'گزارشات', icon: DocumentChartBarIcon, to: '/reports' },
  { id: 'warehouse', label: 'مدیریت انبار', icon: ArchiveBoxIcon, to: '/warehouse' },
  { id: 'products', label: 'مدیریت محصولات', icon: CubeIcon, to: '/products' },
  { id: 'sales', label: 'مدیریت فروش', icon: ShoppingCartIcon, to: '/sales' },
  { id: 'purchase', label: 'مدیریت خرید', icon: ShoppingBagIcon, to: '/purchase' },
  { id: 'customers', label: 'مدیریت مشتریان', icon: UserGroupIcon, to: '/customers' },
  { id: 'suppliers', label: 'تامینکنندگان', icon: TruckIcon, to: '/suppliers' },
  { id: 'branches', label: 'مدیریت شعبات', icon: BuildingOffice2Icon, to: '/branches' },
  { id: 'settings', label: 'تنظیمات', icon: Cog6ToothIcon, to: '/settings' },
];
