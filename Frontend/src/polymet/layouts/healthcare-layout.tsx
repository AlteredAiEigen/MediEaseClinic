import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";
import { NotificationDropdown } from "@/polymet/components/notification-dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboardIcon,
  UsersIcon,
  CalendarIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  UserIcon,
  EditIcon,
  MailIcon,
  PhoneIcon,
  ActivityIcon,
  DollarSignIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

interface HealthcareLayoutProps {
  children: ReactNode;
  userRole?: "admin" | "doctor" | "receptionist";
  userName?: string;
  userAvatar?: string;
}

export function HealthcareLayout({
  children,
  userRole = "doctor",
  userName = "Dr. Robert Smith",
  userAvatar = "https://github.com/yusufhilmi.png",
}: HealthcareLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Determine dashboard path based on user role
  const getDashboardPath = () => {
    if (!user) return "/";
    switch (user.role) {
      case "admin":
        return "/admin-dashboard";
      case "doctor":
        return "/doctor-dashboard";
      case "receptionist":
        return "/receptionist-dashboard";
      default:
        return "/";
    }
  };

  const effectiveRole = user?.role ?? userRole;
  const effectiveName = useMemo(() => {
    if (user) {
      return user.firstName || userName;
    }
    return userName;
  }, [user, userName]);

  const clinicDisplay = useMemo(() => {
    if (user?.clinicId) {
      return `(${user.clinicId})`;
    }
    return '';
  }, [user]);

  const effectiveAvatar = user?.profileImage ?? userAvatar;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = {
    admin: [
      {
        icon: LayoutDashboardIcon,
        label: "Dashboard",
        path: "/admin-dashboard",
      },
      { icon: UsersIcon, label: "Patients", path: "/admin-patients" },
      {
        icon: CalendarIcon,
        label: "Appointments",
        path: "/admin-appointments",
      },
      {
        icon: DollarSignIcon,
        label: "Billing & Pricing",
        path: "/admin-billing",
      },
      {
        icon: UserIcon,
        label: "Manage Credentials",
        path: "/admin-credentials",
      },
      { icon: SettingsIcon, label: "Settings", path: "/admin-settings" },
    ],

    doctor: [
      {
        icon: LayoutDashboardIcon,
        label: "Dashboard",
        path: "/doctor-dashboard",
      },
      {
        icon: ActivityIcon,
        label: "Work Station",
        path: "/doctor-workstation",
      },
      { icon: UsersIcon, label: "Patients", path: "/doctor-patients" },
      {
        icon: CalendarIcon,
        label: "Appointments",
        path: "/doctor-appointments",
      },
      { icon: SettingsIcon, label: "Settings", path: "/doctor-settings" },
    ],

    receptionist: [
      {
        icon: LayoutDashboardIcon,
        label: "Work Station",
        path: "/receptionist-dashboard",
      },
      { icon: UsersIcon, label: "Patients", path: "/receptionist-patients" },
      {
        icon: CalendarIcon,
        label: "Appointments",
        path: "/receptionist-appointments",
      },
      { icon: SettingsIcon, label: "Settings", path: "/receptionist-settings" },
    ],
  };

  const navItems = navigationItems[effectiveRole] ?? navigationItems.doctor;

  const handleLogout = () => {
    logout();
    const redirectRole = user?.role ?? "doctor";
    navigate(`/auth?role=${redirectRole}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F5FAFF] dark:bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-border bg-gradient-to-b from-white to-blue-50/30 dark:from-card dark:to-blue-950/10 shadow-lg">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-20 px-6 border-b border-border/50">
            <Link to={getDashboardPath()}>
              <MediEaseLogo size="md" />
            </Link>
          </div>

          {/* Profile Section */}
          <div className="p-6 border-b border-border/50">
            <div className="relative group">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16 border-4 border-white dark:border-gray-800 shadow-md">
                    <AvatarImage src={effectiveAvatar} alt={effectiveName} />

                    <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-lg font-semibold">
                      {(effectiveName || 'U')
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                    <EditIcon className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">
                    {effectiveName}
                  </h3>
                  {clinicDisplay && (
                    <p className="text-xs text-muted-foreground">
                      {user?.clinicId}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground capitalize">
                    {effectiveRole}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />

                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20"
                      : "text-muted-foreground hover:bg-white/60 dark:hover:bg-gray-800/60 hover:text-foreground hover:shadow-sm"
                  )}
                >
                  <Icon className="w-5 h-5" />

                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-border/50">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
            >
              <LogOutIcon className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-white to-blue-50/30 dark:from-card dark:to-blue-950/10 border-r border-border flex flex-col shadow-2xl">
            <div className="flex items-center justify-between h-20 px-6 border-b border-border/50">
              <Link to={getDashboardPath()} onClick={() => setSidebarOpen(false)}>
                <MediEaseLogo size="md" />
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <XIcon className="w-5 h-5" />
              </Button>
            </div>

            {/* Profile Section - Mobile */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16 border-4 border-white dark:border-gray-800 shadow-md">
                    <AvatarImage src={effectiveAvatar} alt={effectiveName} />

                    <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-lg font-semibold">
                      {(effectiveName || 'U')
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                    <EditIcon className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">
                    {effectiveName}
                  </h3>
                  {clinicDisplay && (
                    <p className="text-xs text-muted-foreground">
                      {user?.clinicId}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground capitalize">
                    {effectiveRole}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />

                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20"
                        : "text-muted-foreground hover:bg-white/60 dark:hover:bg-gray-800/60 hover:text-foreground hover:shadow-sm"
                    )}
                  >
                    <Icon className="w-5 h-5" />

                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Logout Button - Mobile */}
            <div className="p-4 border-t border-border/50">
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
              >
                <LogOutIcon className="w-5 h-5" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-8 bg-white/80 dark:bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-blue-50 dark:hover:bg-blue-950/20"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="w-5 h-5" />
            </Button>

            <div className="flex-1 lg:flex-none">
              {location.pathname.includes("-dashboard") && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {location.pathname === "/receptionist-dashboard"
                      ? "Work Station"
                      : "Dashboard"}
                  </h1>
                </div>
              )}
              {location.pathname === "/doctor-workstation" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Work Station
                  </h1>
                </div>
              )}
              {location.pathname === "/doctor-appointments" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Appointments
                  </h1>
                </div>
              )}
              {location.pathname === "/doctor-patients" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Patients
                  </h1>
                </div>
              )}
              {location.pathname === "/doctor-settings" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Settings
                  </h1>
                </div>
              )}
              {location.pathname === "/receptionist-workstation" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Work Station
                  </h1>
                </div>
              )}
              {location.pathname === "/receptionist-patients" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Patients
                  </h1>
                </div>
              )}
              {location.pathname === "/receptionist-appointments" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Appointments
                  </h1>
                </div>
              )}
              {location.pathname === "/receptionist-settings" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Settings
                  </h1>
                </div>
              )}
              {location.pathname === "/register-patient" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Register Patient
                  </h1>
                </div>
              )}
              {location.pathname === "/admin-patients" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Patients
                  </h1>
                </div>
              )}
              {location.pathname === "/admin-appointments" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Appointments
                  </h1>
                </div>
              )}
              {location.pathname === "/admin-credentials" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Manage Credentials
                  </h1>
                </div>
              )}
              {location.pathname === "/admin-settings" && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Settings
                  </h1>
                </div>
              )}
              {location.pathname.startsWith("/admin/user-profile/") && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    User Profile
                  </h1>
                </div>
              )}
              {location.pathname.startsWith(
                "/receptionist/patient-details/"
              ) && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Patient Details
                  </h1>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <NotificationDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 bg-gradient-to-br from-blue-50/50 via-white to-teal-50/50 dark:from-blue-950/20 dark:via-background dark:to-teal-950/20 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
