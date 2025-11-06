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
  const [signupPhone, setSignupPhone] = useState("");
  const [signupClinicName, setSignupClinicName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

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
      color: "from-[#00C4B3] to-[#10b981]",
      bgColor: "bg-[#00C4B3]/10",
      textColor: "text-[#00C4B3]",
      path: "/doctor-dashboard",
    },
    {
      id: "receptionist",
      title: "Receptionist",
      icon: ClipboardListIcon,
      color: "from-[#22d3ee] to-[#33A8FF]",
      bgColor: "bg-[#22d3ee]/10",
      textColor: "text-[#22d3ee]",
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

    if (signupPassword !== signupConfirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      const [firstName, ...rest] = signupName.trim().split(" ");
      const lastName = rest.length > 0 ? rest.join(" ") : firstName;

      const user = await register({
        email: signupEmail,
        password: signupPassword,
        firstName: firstName || "Admin",
        lastName: lastName || "User",
        phone: signupPhone,
        role: selectedRole as UserRole,
        clinicName: selectedRole === "admin" ? signupClinicName : undefined,
      });

      const redirectTo = rolePaths[user.role] ?? currentRole.path;
      navigate(redirectTo, { replace: true });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5FAFF] via-white to-[#A7F5EB]/10 dark:from-background dark:via-background dark:to-[#00C4B3]/5">
      {/* Header */}
      <header className="border-b border-border bg-white/80 dark:bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={getLogoLink()}>
            <MediEaseLogo size="md" />
          </Link>

          <Link to="/role-selection">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
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
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] bg-clip-text text-transparent">
                    MediEase
                  </span>
                </h1>
                <p className="text-muted-foreground">
                  Sign in to access your healthcare management dashboard
                </p>
              </div>

              {/* Current Role Display */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">Selected Role</CardTitle>
                  <CardDescription>
                    You're signing in as a {currentRole.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`p-4 rounded-lg ${currentRole.bgColor} flex items-center gap-4`}
                  >
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${currentRole.color} flex items-center justify-center shadow-lg`}
                    >
                      <CurrentRoleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {currentRole.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Account Type
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role Switcher */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Switch Role</CardTitle>
                  <CardDescription>
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
                              ? `${role.bgColor} border-transparent shadow-md`
                              : "border-border hover:border-border/60 hover:bg-muted/50"
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
                                : "text-muted-foreground"
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
              <Card className="border-2 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Authentication</CardTitle>
                  <CardDescription>
                    Sign in to your account or create a new one
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    {selectedRole === "admin" && (
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                      </TabsList>
                    )}
                    {(selectedRole === "doctor" ||
                      selectedRole === "receptionist") && (
                      <div className="mb-6 text-center">
                        <h3 className="text-lg font-semibold text-foreground">
                          Login to Your Account
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentRole.title} Login
                        </p>
                      </div>
                    )}

                    {/* Login Form */}
                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                            {error}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <div className="relative">
                            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                            <Input
                              id="login-email"
                              type="email"
                              placeholder="doctor@mediease.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <div className="relative">
                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                            <Input
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="pl-10 pr-10"
                              required
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

                            <span className="text-muted-foreground">
                              Remember me
                            </span>
                          </label>
                          <button
                            type="button"
                            className="text-[#00C4B3] hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>

                        <Button
                          type="submit"
                          className={`w-full bg-gradient-to-r ${currentRole.color} hover:opacity-90 text-white shadow-lg`}
                          disabled={isLoading}
                        >
                          {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Signup Form - Only for Admin */}
                    {selectedRole === "admin" && (
                      <TabsContent value="signup">
                        <form onSubmit={handleSignup} className="space-y-4">
                          {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                              {error}
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="signup-name">Full Name</Label>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                              <Input
                                id="signup-name"
                                type="text"
                                placeholder="Dr. John Smith"
                                value={signupName}
                                onChange={(e) => setSignupName(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <div className="relative">
                              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                              <Input
                                id="signup-email"
                                type="email"
                                placeholder="doctor@mediease.com"
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-phone">Phone Number</Label>
                            <div className="relative">
                              <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                              <Input
                                id="signup-phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                value={signupPhone}
                                onChange={(e) => setSignupPhone(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-clinic">Clinic/Hospital Name</Label>
                            <div className="relative">
                              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <Input
                                id="signup-clinic"
                                type="text"
                                placeholder="MediCare Hospital"
                                value={signupClinicName}
                                onChange={(e) => setSignupClinicName(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <div className="relative">
                              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                              <Input
                                id="signup-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                value={signupPassword}
                                onChange={(e) =>
                                  setSignupPassword(e.target.value)
                                }
                                className="pl-10 pr-10"
                                required
                              />

                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                            <Label htmlFor="signup-confirm-password">
                              Confirm Password
                            </Label>
                            <div className="relative">
                              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                              <Input
                                id="signup-confirm-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                value={signupConfirmPassword}
                                onChange={(e) =>
                                  setSignupConfirmPassword(e.target.value)
                                }
                                className="pl-10"
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

                            <span className="text-muted-foreground">
                              I agree to the{" "}
                              <button
                                type="button"
                                className="text-[#00C4B3] hover:underline"
                              >
                                Terms of Service
                              </button>{" "}
                              and{" "}
                              <button
                                type="button"
                                className="text-[#00C4B3] hover:underline"
                              >
                                Privacy Policy
                              </button>
                            </span>
                          </div>

                          <Button
                            type="submit"
                            className={`w-full bg-gradient-to-r ${currentRole.color} hover:opacity-90 text-white shadow-lg`}
                            disabled={isLoading}
                          >
                            {isLoading
                              ? "Creating account..."
                              : "Create Account"}
                          </Button>
                        </form>
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
