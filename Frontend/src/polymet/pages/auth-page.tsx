import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldIcon,
  StethoscopeIcon,
  ClipboardListIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  PhoneIcon,
  BuildingIcon,
  MapPinIcon,
  GlobeIcon,
  FileTextIcon,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

const rolePaths = {
  admin: "/admin-dashboard",
  doctor: "/doctor-dashboard",
  receptionist: "/receptionist-dashboard",
} as const;

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRole = searchParams.get("role") || "doctor";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register, user } = useAuth();

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

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupClinicName, setSignupClinicName] = useState("");
  const [signupClinicPhone, setSignupClinicPhone] = useState("");
  const [signupClinicEmail, setSignupClinicEmail] = useState("");
  const [signupClinicAddress, setSignupClinicAddress] = useState("");
  const [signupClinicCity, setSignupClinicCity] = useState("");
  const [signupClinicState, setSignupClinicState] = useState("");
  const [signupClinicPincode, setSignupClinicPincode] = useState("");
  const [signupClinicCountry, setSignupClinicCountry] = useState("India");
  const [signupClinicWebsite, setSignupClinicWebsite] = useState("");
  const [signupClinicRegistrationNumber, setSignupClinicRegistrationNumber] = useState("");
  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Jammu and Kashmir",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
  ];
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupSuccessEmail, setSignupSuccessEmail] = useState<string | null>(null);

  const roles = [
    {
      id: "admin",
      title: "Admin",
      icon: ShieldIcon,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-500",
      path: "/admin-dashboard",
    },
    {
      id: "doctor",
      title: "Doctor",
      icon: StethoscopeIcon,
      color: "from-cyan-500 to-teal-500",
      bgColor: "bg-cyan-500/10",
      textColor: "text-cyan-400",
      path: "/doctor-dashboard",
    },
    {
      id: "receptionist",
      title: "Receptionist",
      icon: ClipboardListIcon,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-400",
      path: "/receptionist-dashboard",
    },
  ];

  const currentRole = roles.find((r) => r.id === selectedRole) || roles[1];
  const CurrentRoleIcon = currentRole.icon;

  useEffect(() => {
    setError(null);
  }, [selectedRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await login({
        email: loginEmail,
        password: loginPassword,
      });

      const locationState = location.state as
        | {
            from?: {
              pathname?: string;
            };
          }
        | null;
      const redirectTo =
        locationState?.from?.pathname ||
        rolePaths[user.role] ||
        currentRole.path;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to login. Try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = signupEmail.trim().toLowerCase();

    // Enforce Gmail-only signup for admins on the frontend as well
    if (!email.endsWith("@gmail.com")) {
      setError("Please use a Gmail address (ending in @gmail.com) to sign up as an admin.");
      return;
    }

    // Basic required clinic fields validation for admin
    if (selectedRole === "admin") {
      const missing: string[] = [];
      if (!signupClinicName.trim()) missing.push("Clinic/Hospital Name");
      if (!signupClinicPhone.trim()) missing.push("Clinic Phone Number");
      if (!signupClinicAddress.trim()) missing.push("Street Address");
      if (!signupClinicCity.trim()) missing.push("City");
      if (!signupClinicState.trim()) missing.push("State");
      if (!signupClinicPincode.trim()) missing.push("Pincode");
      if (!signupClinicCountry.trim()) missing.push("Country");
      if (missing.length) {
        setError(`Please fill: ${missing.join(", ")}`);
        return;
      }
    }

    if (signupPassword !== signupConfirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      const [firstName, ...rest] = signupName.trim().split(" ");
      const lastName = rest.length > 0 ? rest.join(" ") : firstName;

      await register({
        email,
        password: signupPassword,
        firstName: firstName || "Admin",
        lastName: lastName || "User",
        role: selectedRole as UserRole,
        clinicName: selectedRole === "admin" ? signupClinicName : undefined,
        clinicPhone: selectedRole === "admin" ? signupClinicPhone : undefined,
        clinicEmail:
          selectedRole === "admin" && signupClinicEmail.trim()
            ? signupClinicEmail.trim()
            : undefined,
        clinicAddress: selectedRole === "admin" ? signupClinicAddress : undefined,
        clinicCity: selectedRole === "admin" ? signupClinicCity : undefined,
        clinicState: selectedRole === "admin" ? signupClinicState : undefined,
        clinicPincode: selectedRole === "admin" ? signupClinicPincode : undefined,
        clinicCountry: selectedRole === "admin" ? signupClinicCountry : undefined,
        clinicWebsite: selectedRole === "admin" ? signupClinicWebsite : undefined,
        clinicRegistrationNumber:
          selectedRole === "admin" && signupClinicRegistrationNumber.trim()
            ? signupClinicRegistrationNumber.trim()
            : undefined,
      });

      // Show confirmation UI instead of logging the user in immediately
      setSignupSuccessEmail(email);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create account.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (roleId: string) => {
    navigate(`/auth?role=${roleId}`);
  };

  // Special full-page experience after admin registers:
  // looks like they're in the app but with a blurred/locked overlay.
  if (selectedRole === "admin" && signupSuccessEmail) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
        {/* Blurred dashboard-like background */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#22c55e33,_transparent_60%),_radial-gradient(circle_at_bottom,_#0ea5e933,_transparent_60%)]" />
          <div className="absolute inset-0 backdrop-blur-2xl" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header resembling in-app top bar */}
          <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
              <Link to="/admin-dashboard" className="flex items-center gap-3">
                <MediEaseLogo size="md" variant="dark" />
                <span className="text-sm text-white/60 hidden sm:inline">
                  Admin Workspace
                </span>
              </Link>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/60">
                <span className="hidden sm:inline">You’re almost in</span>
                <span className="inline-flex h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
              </div>
            </div>
          </header>

          {/* Centered activation panel */}
          <main className="flex-1 flex items-center justify-center px-4 py-10">
            <div className="mx-auto max-w-xl w-full">
              <div className="relative rounded-2xl border border-white/10 bg-black/70 shadow-2xl overflow-hidden">
                {/* Subtle blurred "dashboard" hint behind */}
                <div className="pointer-events-none absolute inset-0 opacity-40">
                  <div className="absolute top-6 left-6 right-24 h-8 rounded-xl bg-white/5" />
                  <div className="absolute top-20 left-6 right-10 h-32 rounded-2xl bg-emerald-500/10" />
                  <div className="absolute bottom-10 left-6 right-16 h-24 rounded-2xl bg-cyan-500/10" />
                </div>

                <div className="relative p-8 space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 px-3 py-1 text-xs font-medium">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Admin account created</span>
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-semibold">
                      Verify your Gmail to enter the dashboard
                    </h1>
                    <p className="text-sm sm:text-base text-white/70">
                      We’ve sent a verification link to{" "}
                      <span className="font-semibold text-white">
                        {signupSuccessEmail}
                      </span>
                      . Please click that link to activate your admin account.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2 text-sm text-white/70">
                    <p>
                      Once your email is verified, you’ll be able to sign in and
                      access your full admin dashboard, manage doctors, view
                      appointments, and configure your clinic.
                    </p>
                    <p className="text-xs text-white/50">
                      Didn’t get the email? Check your spam folder or try
                      signing up again with the same Gmail address.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <Button
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                      onClick={() => navigate("/auth?role=admin")}
                    >
                      Go to admin login
                    </Button>
                    <button
                      type="button"
                      className="text-xs text-white/60 hover:text-white underline-offset-4 hover:underline"
                      onClick={() => window.location.reload()}
                    >
                      I’ve verified my email – refresh access
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f2847 25%, #1e3a5f 50%, #2563eb 100%)" }}>
      {/* Header */}
      <header className="border-b border-white/20 bg-gradient-to-r from-purple-400/30 via-blue-400/30 to-cyan-400/30 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={getLogoLink()}>
            <MediEaseLogo size="md" variant="dark" />
          </Link>

          <Link to="/role-selection">
            <Button
              variant="ghost"
              className="text-blue-50/90 hover:text-white hover:bg-blue-900/50"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Role Selection
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 lg:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Side - Role Selection */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-white">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                    MediEase
                  </span>
                </h1>
                <p className="text-white/90">
                  Sign in to access your healthcare management dashboard
                </p>
              </div>

              {/* Current Role Display */}
              <Card className="border-2 border-white/20 bg-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Selected Role</CardTitle>
                  <CardDescription className="text-white/90">
                    You're signing in as a {currentRole.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`p-4 rounded-lg ${currentRole.bgColor} flex items-center gap-4 border border-white/10`}
                  >
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${currentRole.color} flex items-center justify-center shadow-lg`}
                    >
                      <CurrentRoleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        {currentRole.title}
                      </h3>
                      <p className="text-sm text-white/90">
                        Account Type
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role Switcher */}
              <Card className="border-2 border-white/20 bg-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Switch Role</CardTitle>
                  <CardDescription className="text-white/90">
                    Select a different account type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((role) => {
                      const Icon = role.icon;
                      const isSelected = role.id === selectedRole;
                      return (
                        <button
                          key={role.id}
                          onClick={() => handleRoleChange(role.id)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            isSelected
                              ? `${role.bgColor} border-cyan-400/50 shadow-md`
                              : "border-white/20 hover:border-white/40 hover:bg-white/5"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center ${
                              isSelected ? "shadow-lg scale-110" : "shadow"
                            } transition-all duration-200`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <p
                            className={`text-xs font-medium text-center ${
                              isSelected
                                ? role.textColor
                                : "text-white/90"
                            }`}
                          >
                            {role.title}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Side - Auth Forms */}
            <div>
              <Card className="border-2 border-white/20 bg-white/10 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Authentication</CardTitle>
                  <CardDescription className="text-white/90">
                    Sign in to your account or create a new one
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    {selectedRole === "admin" && (
                      <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 border border-white/20">
                        <TabsTrigger value="login" className="text-white data-[state=active]:bg-cyan-500 data-[state=active]:text-white">Login</TabsTrigger>
                        <TabsTrigger value="signup" className="text-white data-[state=active]:bg-cyan-500 data-[state=active]:text-white">Sign Up</TabsTrigger>
                      </TabsList>
                    )}
                    {(selectedRole === "doctor" ||
                      selectedRole === "receptionist") && (
                      <div className="mb-6 text-center">
                        <h3 className="text-lg font-semibold text-white">
                          Login to Your Account
                        </h3>
                        <p className="text-sm text-white/90 mt-1">
                          {currentRole.title} Login
                        </p>
                      </div>
                    )}

                    {/* Login Form */}
                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                          <div className="rounded-lg border border-red-400/50 bg-red-500/20 px-3 py-2 text-sm text-red-200">
                            {error}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-white">Email</Label>
                          <div className="relative">
                            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/70" />

                            <Input
                              id="login-email"
                              type="email"
                              placeholder="doctor@mediease.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-white">Password</Label>
                          <div className="relative">
                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/70" />

                            <Input
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                              required
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200/70 hover:text-white"
                            >
                              {showPassword ? (
                                <EyeOffIcon className="w-4 h-4" />
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded" />

<span className="text-white/90">
                                Remember me
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              alert("Please contact your administrator to reset your password.");
                            }}
                            className="text-cyan-400 hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg"
                          disabled={isLoading}
                        >
                          {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Signup Flow - Only for Admin */}
                    {selectedRole === "admin" && (
                      <TabsContent value="signup">
                        {signupSuccessEmail ? (
                          <div className="space-y-4 text-center">
                            <h3 className="text-xl font-semibold text-white">
                              Check your Gmail to activate your account
                            </h3>
                            <p className="text-sm text-white/90">
                              We&apos;ve sent an activation link to{" "}
                              <span className="font-medium">
                                {signupSuccessEmail}
                              </span>
                              . Click the link in that email to verify your
                              account. Once verified, you can sign in here as an
                              admin.
                            </p>
                            <p className="text-xs text-cyan-200">
                              Didn&apos;t get the email? Please check your spam
                              folder or try signing up again with the same
                              Gmail address.
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleSignup} className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {error && (
                              <div className="rounded-lg border border-red-400/50 bg-red-500/20 px-3 py-2 text-sm text-red-200">
                                {error}
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="signup-name" className="text-white">Full Name</Label>
                              <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/80" />

                                <Input
                                  id="signup-name"
                                  type="text"
                                  placeholder="Dr. John Smith"
                                  value={signupName}
                                  onChange={(e) => setSignupName(e.target.value)}
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-email" className="text-white">
                                Gmail address <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/70" />

                                <Input
                                  id="signup-email"
                                  type="email"
                                  placeholder="yourname@gmail.com"
                                  value={signupEmail}
                                  onChange={(e) => setSignupEmail(e.target.value)}
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                                  required
                                />
                              </div>
                              <p className="text-xs text-cyan-200">
                                Admin sign up currently supports only Gmail
                                accounts (addresses ending in @gmail.com).
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-clinic" className="text-white">
                                Clinic/Hospital Name <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/80" />
                                <Input
                                  id="signup-clinic"
                                  type="text"
                                  placeholder="MediCare Hospital"
                                  value={signupClinicName}
                                  onChange={(e) =>
                                    setSignupClinicName(e.target.value)
                                  }
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-clinic-phone" className="text-white">
                                Clinic Phone Number <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/80" />
                                <Input
                                  id="signup-clinic-phone"
                                  type="tel"
                                  placeholder="+91-9876543210"
                                  value={signupClinicPhone}
                                  onChange={(e) =>
                                    setSignupClinicPhone(e.target.value)
                                  }
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-clinic-email" className="text-white">
                                Clinic Email (optional)
                              </Label>
                              <div className="relative">
                                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/80" />
                                <Input
                                  id="signup-clinic-email"
                                  type="email"
                                  placeholder="clinic@example.com"
                                  value={signupClinicEmail}
                                  onChange={(e) =>
                                    setSignupClinicEmail(e.target.value)
                                  }
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-clinic-address" className="text-white">
                                Street Address <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/80" />
                                <Input
                                  id="signup-clinic-address"
                                  type="text"
                                  placeholder="123 Main Street"
                                  value={signupClinicAddress}
                                  onChange={(e) =>
                                    setSignupClinicAddress(e.target.value)
                                  }
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="signup-clinic-city" className="text-white">
                                  City <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="signup-clinic-city"
                                  type="text"
                                  placeholder="Mumbai"
                                  value={signupClinicCity}
                                  onChange={(e) =>
                                    setSignupClinicCity(e.target.value)
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="signup-clinic-state" className="text-white">
                                  State <span className="text-red-500">*</span>
                                </Label>
                                <select
                                  id="signup-clinic-state"
                                  value={signupClinicState}
                                  onChange={(e) => setSignupClinicState(e.target.value)}
                                  className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
                                  required
                                >
                                  <option value="">Select State</option>
                                  {indianStates.map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="signup-clinic-pincode" className="text-white">
                                  Pincode <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="signup-clinic-pincode"
                                  type="text"
                                  placeholder="400001"
                                  value={signupClinicPincode}
                                  onChange={(e) =>
                                    setSignupClinicPincode(e.target.value)
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="signup-clinic-country" className="text-white">
                                  Country <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="signup-clinic-country"
                                  type="text"
                                  placeholder="India"
                                  value={signupClinicCountry}
                                  onChange={(e) =>
                                    setSignupClinicCountry(e.target.value)
                                  }
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-clinic-website" className="text-white">Website</Label>
                              <div className="relative">
                                <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/80" />
                                <Input
                                  id="signup-clinic-website"
                                  type="url"
                                  placeholder="https://www.example.com"
                                  value={signupClinicWebsite}
                                  onChange={(e) =>
                                    setSignupClinicWebsite(e.target.value)
                                  }
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
<Label htmlFor="signup-clinic-registration" className="text-white">
                                Registration/License Number (optional)
                                </Label>
                              <div className="relative">
                                <FileTextIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/80" />
                                <Input
                                  id="signup-clinic-registration"
                                  type="text"
                                  placeholder="MED/2024/12345"
                                  value={signupClinicRegistrationNumber}
                                  onChange={(e) =>
                                    setSignupClinicRegistrationNumber(e.target.value)
                                  }
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                                />
                              </div>
                              <p className="text-xs text-cyan-200">
                                Medical registration or license number (if applicable)
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-password" className="text-white">Password</Label>
                              <div className="relative">
                                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/80" />

                                <Input
                                  id="signup-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a password"
                                  value={signupPassword}
                                  onChange={(e) =>
                                    setSignupPassword(e.target.value)
                                  }
                                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                                  required
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200/80 hover:text-white"
                                >
                                  {showPassword ? (
                                    <EyeOffIcon className="w-4 h-4" />
                                  ) : (
                                    <EyeIcon className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="signup-confirm-password" className="text-white">
                                Confirm Password
                              </Label>
                              <div className="relative">
                                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/80" />

                                <Input
                                  id="signup-confirm-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Confirm your password"
                                  value={signupConfirmPassword}
                                  onChange={(e) =>
                                    setSignupConfirmPassword(e.target.value)
                                  }
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-cyan-200/90"
                                  required
                                />
                              </div>
                            </div>

                            <div className="flex items-start gap-2 text-sm">
                              <input
                                type="checkbox"
                                className="rounded mt-1"
                                required
                              />

                              <span className="text-white/90">
                                I agree to the{" "}
                                <Link
                                  to="/terms-of-service"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:underline"
                                >
                                  Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link
                                  to="/privacy-policy"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:underline"
                                >
                                  Privacy Policy
                                </Link>
                              </span>
                            </div>

                            <Button
                              type="submit"
                              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg"
                              disabled={isLoading}
                            >
                              {isLoading
                                ? "Creating account..."
                                : "Create Account"}
                            </Button>
                          </form>
                        )}
                      </TabsContent>
                    )}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
