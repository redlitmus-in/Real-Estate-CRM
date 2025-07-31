import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  UserCheck, 
  Home, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Shield,
  Database
} from 'lucide-react';
import { useAuth } from '../../store/authStore';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isAdmin, currentCompany } = useAuth();

  const adminNavItems = [
    { icon: Database, label: 'System Overview', path: '/admin/dashboard' },
    { icon: Building2, label: 'Companies', path: '/admin/companies' },
    { icon: Users, label: 'All Users', path: '/admin/users' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Shield, label: 'Security', path: '/admin/security' },
    { icon: Settings, label: 'System Settings', path: '/admin/settings' },
  ];

  const companyNavItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Team', path: '/users' },
    { icon: UserCheck, label: 'Customers', path: '/customers' },
    { icon: UserCheck, label: 'Leads', path: '/leads' },
    { icon: Building2, label: 'Properties', path: '/properties' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const navItems = isAdmin ? adminNavItems : companyNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">PropConnect</span>
            </div>
          </div>

          {/* Company Info (for company users) */}
          {!isAdmin && currentCompany && (
            <div className="px-4 py-3 bg-gray-50 border-b">
              <div className="text-sm font-medium text-gray-900 truncate">
                {currentCompany.name}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {currentCompany.subscription_plan} Plan
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
                onClick={() => {
                  // Close mobile sidebar when navigating
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              PropConnect CRM v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
};