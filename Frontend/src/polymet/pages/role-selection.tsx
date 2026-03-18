import { Link } from "react-router-dom";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ShieldIcon,
  StethoscopeIcon,
  ClipboardListIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function RoleSelection() {
  const { user } = useAuth();

  // Determine where logo should link based on auth status
  const getLogoLink = () => {
    if (!user) return "/"; // Go to landing page if not logged in
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

  const roles = [
    {
      id: "admin",
      title: "Admin",
      description: "Full system access with management capabilities",
      icon: ShieldIcon,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      textColor: "text-purple-500",
      path: "/admin-dashboard",
      features: [
        "Manage doctors & staff",
        "View all patient records",
        "Generate reports",
        "System settings",
      ],
    },
    {
      id: "doctor",
      title: "Doctor",
      description: "Patient management and medical records access",
      icon: StethoscopeIcon,
      color: "from-cyan-500 to-teal-500",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
      textColor: "text-cyan-400",
      path: "/doctor-dashboard",
      features: [
        "View patient records",
        "Manage appointments",
        "Patient reviews",
        "Medical history",
      ],
    },
    {
      id: "receptionist",
      title: "Receptionist",
      description: "Patient check-in and appointment scheduling",
      icon: ClipboardListIcon,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      textColor: "text-blue-400",
      path: "/receptionist-dashboard",
      features: [
        "Patient check-in/out",
        "Queue management",
        "Schedule appointments",
        "Patient registration",
      ],
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f2847 25%, #1e3a5f 50%, #2563eb 100%)" }}>
      {/* Header */}
      <header className="border-b border-white/20 bg-gradient-to-r from-purple-400/30 via-blue-400/30 to-cyan-400/30 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={getLogoLink()}>
            <MediEaseLogo size="lg" variant="dark" />
          </Link>

          <Link to="/">
            <Button
              variant="ghost"
              className="text-blue-50/90 hover:text-white hover:bg-blue-900/50"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 lg:py-20">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-white">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Account Type
              </span>
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Select your role to access the MediEase Clinic management system
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Link to={`/auth?role=${role.id}`} key={role.id}>
                  <Card className="group relative overflow-hidden border-2 border-white/20 hover:border-cyan-400/50 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full bg-white/10 backdrop-blur-sm flex flex-col">
                    {/* Subtle Logo-based Hover Effect */}
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"
                      style={{ padding: "2px" }}
                    />

                    {/* Subtle Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-blue-500/5 opacity-30 group-hover:opacity-50 rounded-bl-full transition-opacity duration-500" />

                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-tr from-blue-500/5 to-cyan-500/10 opacity-30 group-hover:opacity-50 rounded-full transition-opacity duration-500" />

                    <CardHeader className="space-y-4 pb-4 flex-shrink-0">
                      <div className="flex items-center">
                        <div
                          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold mb-2 transition-all duration-300 text-white">
                          {role.title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed text-white/90">
                          {role.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        {role.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 text-sm text-white/90 group-hover:text-white transition-colors"
                          >
                            <div
                              className={`w-5 h-5 rounded-md bg-gradient-to-br ${role.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
                            >
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <span className="font-medium text-white">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2">
                        <div
                          className={`w-full py-3 px-4 rounded-lg bg-gradient-to-r ${role.color} hover:shadow-lg text-white font-semibold text-center transition-all duration-300 group-hover:scale-[1.02]`}
                        >
                          Access Dashboard →
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
