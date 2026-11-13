import { Outlet, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Database,
  Upload,
  GitBranch,
  FileText,
  Shield,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Image,
  ServerCog
} from 'lucide-react';
import { getCurrentUser, logout } from '../services/dataService';
import { Button } from './ui/button';

export function MainLayout() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    navigate('/login');
  };

  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const dateStr = date.toLocaleDateString('en-US', options);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    const timeStr = `${h}:${m}:${s}`;
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = formatDateTime(currentDateTime);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Database, label: 'Datasets', path: '/dashboard/datasets' },
    { icon: Upload, label: 'Upload', path: '/dashboard/upload' },
    { icon: GitBranch, label: 'Lineage', path: '/dashboard/lineage' },
    { icon: FileText, label: 'Audit Logs', path: '/dashboard/logs' },
    { icon: Image, label: 'Audit Image', path: '/dashboard/audit-image' },
    { icon: ServerCog, label: 'Audit Database', path: '/dashboard/db-audit' },
    ...(currentUser?.role === 'admin' ? [{ icon: Shield, label: 'Admin Panel', path: '/dashboard/admin' }] : []),
  ];

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Top Navigation Bar */}
      <nav className="bg-card dark:bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Date and Time */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold">{dateStr}</div>
                <div className="text-xs text-muted-foreground">{timeStr}</div>
              </div>
            </div>

            {/* Center: Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Data Provenance
              </h1>
            </div>

            {/* Right: User Info & Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium">{currentUser.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{currentUser.role}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-card dark:bg-card border-r border-border
            transform transition-transform duration-300 ease-in-out z-40
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background dark:bg-background">
          <Outlet />
        </main>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}