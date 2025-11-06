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

export function RoleSelection() {
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
          <MediEaseLogo size="md" />

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
              Select a demo account to explore the MediEase Clinic management
              system
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Link to={`/auth?role=${role.id}`} key={role.id}>
                  <Card className="group relative overflow-hidden border-2 hover:border-transparent hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full bg-gradient-to-br from-white to-gray-50/50 dark:from-card dark:to-card/50">
                    {/* Gradient Border Effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}
                      style={{ padding: "2px" }}
                    />

                    {/* Decorative Background Elements */}
                    <div
                      className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${role.color} opacity-[0.03] group-hover:opacity-[0.08] rounded-bl-full transition-opacity duration-300`}
                    />

                    <div
                      className={`absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr ${role.color} opacity-[0.03] group-hover:opacity-[0.08] rounded-full transition-opacity duration-300`}
                    />

                    <CardHeader className="space-y-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${role.color} text-white shadow-sm`}
                        >
                          Demo
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
                    <CardContent className="space-y-5">
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

          {/* Info Section */}
          <div className="mt-12 p-6 rounded-xl bg-white dark:bg-card border border-border">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="p-3 rounded-lg bg-[#33A8FF]/10">
                <ShieldIcon className="w-6 h-6 text-[#33A8FF]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Demo Account Information
                </h3>
                <p className="text-sm text-muted-foreground">
                  These are demonstration accounts with pre-populated data. No
                  login credentials required. All changes are temporary and will
                  reset on page refresh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
