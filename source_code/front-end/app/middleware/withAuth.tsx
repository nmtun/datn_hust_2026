/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

type AuthUser = {
  role?: string | null;
  hierarchy_role?: string | null;
};

const normalizeRole = (value?: string | null) => {
  if (!value) return '';
  return String(value).trim().toLowerCase().replace('-', '_');
};

const pathStartsWith = (pathname: string, prefix: string) => {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
};

const normalizePathname = (pathname: string) => {
  if (!pathname) return '';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

const getDefaultAuthorizedPath = (user: AuthUser | null) => {
  const role = normalizeRole(user?.role);
  const hierarchyRole = normalizeRole(user?.hierarchy_role);

  if (role === 'super_admin') return '/super-admin/manage-tenant';
  if (role === 'manager') return '/dashboard/manager/profile';
  if (role === 'hr') return '/dashboard/hr/profile';
  if (role === 'tenant_admin' || role === 'admin') return '/dashboard/admin/profile';

  if (hierarchyRole === 'department_head') return '/dashboard/department-head/task';
  if (hierarchyRole === 'team_lead') return '/dashboard/team-lead/task';

  return '/dashboard/employee/profile';
};

const getAllowedPrefixes = (user: AuthUser | null) => {
  const role = normalizeRole(user?.role);
  const hierarchyRole = normalizeRole(user?.hierarchy_role);

  if (role === 'super_admin') {
    return ['/super-admin'];
  }

  const allowed = ['/dashboard'];

  if (role === 'manager') {
    allowed.push('/dashboard/manager');
    return allowed;
  }

  if (role === 'hr') {
    allowed.push('/dashboard/hr', '/dashboard/employee/performance');
    if (hierarchyRole === 'department_head') {
      allowed.push('/dashboard/department-head');
    }
    if (hierarchyRole === 'team_lead') {
      allowed.push('/dashboard/team-lead');
    }
    return allowed;
  }

  if (role === 'tenant_admin' || role === 'admin') {
    allowed.push('/dashboard/admin');
    return allowed;
  }

  allowed.push('/dashboard/employee');
  if (hierarchyRole === 'department_head') {
    allowed.push('/dashboard/department-head');
  }
  if (hierarchyRole === 'team_lead') {
    allowed.push('/dashboard/team-lead');
  }

  return allowed;
};

const canAccessPath = (pathname: string, user: AuthUser | null) => {
  const normalizedPathname = normalizePathname(pathname);
  if (!normalizedPathname) return false;

  const role = normalizeRole(user?.role);
  const allowedPrefixes = getAllowedPrefixes(user);

  if (role !== 'super_admin' && pathStartsWith(normalizedPathname, '/super-admin')) {
    return false;
  }

  if (role === 'super_admin') {
    return allowedPrefixes.some((prefix) => pathStartsWith(normalizedPathname, prefix));
  }

  const canAccessDashboardHome =
    allowedPrefixes.includes('/dashboard') && normalizedPathname === '/dashboard';
  if (canAccessDashboardHome) {
    return true;
  }

  return allowedPrefixes
    .filter((prefix) => prefix !== '/dashboard')
    .some((prefix) => pathStartsWith(normalizedPathname, prefix));
};

export function withAuth(Component: React.ComponentType) {
  return function ProtectedRoute(props: any) {
    const { isLoggedIn, loading, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (!loading && !isLoggedIn) {
        router.replace('/auth/login');
        return;
      }

      if (!loading && isLoggedIn && pathname && !canAccessPath(pathname, user)) {
        router.replace(getDefaultAuthorizedPath(user));
      }
    }, [isLoggedIn, loading, pathname, router, user]);

    // Show loading state while checking authentication
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    if (!isLoggedIn) {
      return null;
    }

    if (pathname && !canAccessPath(pathname, user)) {
      return null;
    }

    return <Component {...props} />;
  };
}