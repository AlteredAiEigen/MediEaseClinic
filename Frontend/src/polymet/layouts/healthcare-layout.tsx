import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";
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
  BellIcon,
  MenuIcon,
  XIcon,
  UserIcon,
  EditIcon,
  MailIcon,
  PhoneIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  ActivityIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    {
      id: 1,
      type: "appointment",
      title: "New Appointment Scheduled",
      message: "Sarah Johnson scheduled for 2:00 PM today",
      time: "5 min ago",
      read: false,
      icon: CalendarIcon,
      color: "text-blue-500",
    },
    {
      id: 2,
      type: "alert",
      title: "Lab Results Available",
      message: "Critical lab results for Michael Chen",
      time: "15 min ago",
      read: false,
      icon: AlertCircleIcon,
      color: "text-red-500",
    },
    {
      id: 3,
      type: "info",
      title: "Patient Check-in",
      message: "Emily Rodriguez has checked in",
      time: "30 min ago",
      read: false,
      icon: InfoIcon,
      color: "text-emerald-500",
    },
    {
      id: 4,
      type: "success",
      title: "Prescription Sent",
      message: "Prescription for James Wilson sent successfully",
      time: "1 hour ago",
      read: true,
      icon: CheckCircleIcon,
      color: "text-emerald-500",
    },
    {
      id: 5,
      type: "appointment",
      title: "Appointment Reminder",
      message: "You have 3 appointments tomorrow",
      time: "2 hours ago",
      read: true,
      icon: ClockIcon,
      color: "text-blue-500",
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

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
        label: "Dashboard",
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

  const navItems = navigationItems[userRole];

  return (
    <div className="min-h-screen bg-[#F5FAFF] dark:bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-border bg-gradient-to-b from-white to-blue-50/30 dark:from-card dark:to-blue-950/10 shadow-lg">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-20 px-6 border-b border-border/50">
            <Link to="/">
              <MediEaseLogo size="md" />
            </Link>
          </div>

          {/* Profile Section */}
          <div className="p-6 border-b border-border/50">
            <div className="relative group">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16 border-4 border-white dark:border-gray-800 shadow-md">
                    <AvatarImage src={userAvatar} alt={userName} />

                    <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-lg font-semibold">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                    <EditIcon className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">
                    {userName}
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userRole}
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
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
            >
              <LogOutIcon className="w-5 h-5" />
              Logout
            </Link>
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
              <MediEaseLogo size="md" />

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
                    <AvatarImage src={userAvatar} alt={userName} />

                    <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-lg font-semibold">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                    <EditIcon className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">
                    {userName}
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userRole}
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
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
              >
                <LogOutIcon className="w-5 h-5" />
                Logout
              </Link>
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
                    Dashboard
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
            <DropdownMenu
              open={notificationsOpen}
              onOpenChange={setNotificationsOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <BellIcon className="w-5 h-5" />

                  {unreadCount > 0 && (
                    <>
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />

                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                        {unreadCount}
                      </Badge>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[380px] p-0">
                <DropdownMenuLabel className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />

                <ScrollArea className="h-[400px]">
                  <div className="p-2">
                    {notifications.map((notification) => {
                      const Icon = notification.icon;
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-3 rounded-lg mb-2 cursor-pointer transition-colors",
                            notification.read
                              ? "hover:bg-muted/50"
                              : "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30"
                          )}
                        >
                          <div className="flex gap-3">
                            <div className={cn("mt-0.5", notification.color)}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-foreground">
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />

                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <DropdownMenuSeparator className="m-0" />

                <div className="p-2">
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  >
                    View All Notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
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
