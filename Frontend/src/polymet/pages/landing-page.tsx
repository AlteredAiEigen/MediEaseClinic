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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  HeartPulseIcon,
  ShieldCheckIcon,
  ActivityIcon,
  UsersIcon,
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5FAFF] via-white to-[#A7F5EB]/10 dark:from-background dark:via-background dark:to-[#00C4B3]/5">
      {/* Header */}
      <header className="border-b border-border bg-white/80 dark:bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <MediEaseLogo size="lg" />

          <div className="flex items-center gap-4">
            <Link to="/role-selection">
              <Button
                variant="ghost"
                className="text-[#00C4B3] hover:text-[#009C8F] hover:bg-[#00C4B3]/10"
              >
                Demo Accounts
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00C4B3]/10 to-[#10b981]/10 border border-[#00C4B3]/20">
                <HeartPulseIcon className="w-4 h-4 text-[#00C4B3]" />

                <span className="text-sm font-medium text-[#00C4B3]">
                  Healthcare Management System
                </span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] bg-clip-text text-transparent">
                  MediEase Clinic
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Streamline your healthcare operations with our comprehensive
                clinic management platform. Designed for doctors,
                administrators, and receptionists.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-card border border-border">
                <div className="p-2 rounded-lg bg-[#00C4B3]/10">
                  <ShieldCheckIcon className="w-5 h-5 text-[#00C4B3]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Secure
                  </p>
                  <p className="text-xs text-muted-foreground">
                    HIPAA Compliant
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-card border border-border">
                <div className="p-2 rounded-lg bg-[#10b981]/10">
                  <ActivityIcon className="w-5 h-5 text-[#10b981]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Real-time
                  </p>
                  <p className="text-xs text-muted-foreground">Live Updates</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-card border border-border">
                <div className="p-2 rounded-lg bg-[#22d3ee]/10">
                  <UsersIcon className="w-5 h-5 text-[#22d3ee]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Multi-role
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Role-based Access
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md border-border shadow-xl">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@mediease.com"
                    className="border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="border-border"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded border-border" />

                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <Button
                    variant="link"
                    className="text-[#00C4B3] hover:text-[#009C8F] p-0 h-auto"
                  >
                    Forgot password?
                  </Button>
                </div>
                <Button className="w-full bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white">
                  Sign In
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or try demo
                    </span>
                  </div>
                </div>
                <Link to="/role-selection">
                  <Button
                    variant="outline"
                    className="w-full border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
                  >
                    Access Demo Accounts
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-t border-border bg-white/50 dark:bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#00C4B3] to-[#10b981] bg-clip-text text-transparent">
                1,200+
              </p>
              <p className="text-sm text-muted-foreground">Active Patients</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#00C4B3] to-[#10b981] bg-clip-text text-transparent">
                50+
              </p>
              <p className="text-sm text-muted-foreground">Medical Staff</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#00C4B3] to-[#10b981] bg-clip-text text-transparent">
                98%
              </p>
              <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#00C4B3] to-[#10b981] bg-clip-text text-transparent">
                24/7
              </p>
              <p className="text-sm text-muted-foreground">Support Available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
