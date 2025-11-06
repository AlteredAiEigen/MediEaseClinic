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
      color: "from-[#00C4B3] to-[#10b981]",
      bgColor: "bg-[#00C4B3]/10",
      borderColor: "border-[#00C4B3]/20",
      textColor: "text-[#00C4B3]",
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
      color: "from-[#22d3ee] to-[#33A8FF]",
      bgColor: "bg-[#22d3ee]/10",
      borderColor: "border-[#22d3ee]/20",
      textColor: "text-[#22d3ee]",
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
    <div className="min-h-screen bg-gradient-to-br from-[#F5FAFF] via-white to-[#A7F5EB]/10 dark:from-background dark:via-background dark:to-[#00C4B3]/5">
      {/* Header */}
      <header className="border-b border-border bg-white/80 dark:bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={getLogoLink()}>
            <MediEaseLogo size="md" />
          </Link>

          <Link to="/">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 lg:py-20">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] bg-clip-text text-transparent">
                Account Type
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select your role to access the MediEase Clinic management system
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Link to={`/auth?role=${role.id}`} key={role.id}>
                  <Card className="group relative overflow-hidden border-2 hover:border-transparent hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full bg-gradient-to-br from-white to-gray-50/50 dark:from-card dark:to-card/50 flex flex-col">
                    {/* Subtle Logo-based Hover Effect */}
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-[#00C4B3]/10 via-[#10b981]/5 to-[#00C4B3]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"
                      style={{ padding: "2px" }}
                    />

                    {/* Subtle Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00C4B3]/5 to-[#10b981]/3 opacity-[0.02] group-hover:opacity-[0.05] rounded-bl-full transition-opacity duration-500" />

                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-tr from-[#10b981]/3 to-[#00C4B3]/5 opacity-[0.02] group-hover:opacity-[0.05] rounded-full transition-opacity duration-500" />

                    <CardHeader className="space-y-4 pb-4 flex-shrink-0">
                      <div className="flex items-center">
                        <div
                          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold mb-2 transition-all duration-300">
                          {role.title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {role.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        {role.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 text-sm text-foreground/80 group-hover:text-foreground transition-colors"
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
                            <span className="font-medium">{feature}</span>
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
