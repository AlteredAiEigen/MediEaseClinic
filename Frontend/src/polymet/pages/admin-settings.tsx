import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  LockIcon,
  BellIcon,
  ShieldIcon,
  DatabaseIcon,
  PaletteIcon,
  SaveIcon,
} from "lucide-react";
import { post, put } from "@/lib/api-client";
import { useAuth, type User } from "@/context/auth-context";
import { MediEaseLoader } from "@/components/mediease-loader";

export function AdminSettings() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    profileImage: null as string | null,
  });
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveStatus, setProfileSaveStatus] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    systemAlerts: true,
    weeklyReports: true,
  });
  const [resetStatus, setResetStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        role: user.role ?? "",
        profileImage: user.profileImage ?? null,
      });
    }
  }, [user]);

  const initials = useMemo(() => {
    const first = profileData.firstName?.trim().charAt(0) ?? "";
    const last = profileData.lastName?.trim().charAt(0) ?? "";
    const fallback = (first + last).toUpperCase();
    return fallback || "AD";
  }, [profileData.firstName, profileData.lastName]);

  const roleLabel = useMemo(() => {
    switch (profileData.role) {
      case "admin":
        return "Administrator";
      case "doctor":
        return "Doctor";
      case "receptionist":
        return "Receptionist";
      default:
        return profileData.role || "Administrator";
    }
  }, [profileData.role]);

  const handleSaveProfile = async () => {
    if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
      setProfileSaveStatus({
        type: "error",
        message: "First and last name are required.",
      });
      return;
    }

    if (!profileData.email.trim()) {
      setProfileSaveStatus({
        type: "error",
        message: "Email address is required.",
      });
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveStatus(null);

    try {
      const phoneValue = profileData.phone.trim();
      const payload: Record<string, unknown> = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim(),
        profileImage: profileData.profileImage,
      };

      payload.phone = phoneValue ? phoneValue : null;

      const response = await put<{ user: User }>(
        "/api/admin/profile",
        payload
      );

      if (!(response.success && response.data?.user)) {
        throw new Error(response.message ?? "Failed to update profile");
      }

      const updatedUser = response.data.user;
      setProfileData({
        firstName: updatedUser.firstName ?? "",
        lastName: updatedUser.lastName ?? "",
        email: updatedUser.email ?? "",
        phone: updatedUser.phone ?? "",
        role: updatedUser.role ?? profileData.role,
        profileImage: updatedUser.profileImage ?? null,
      });

      await refreshUser();

      setProfileSaveStatus({
        type: "success",
        message: response.message ?? "Profile updated successfully.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.";
      setProfileSaveStatus({
        type: "error",
        message,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendResetLink = async () => {
    if (!profileData.email) {
      setResetStatus({ type: "error", message: "Email is required to send a reset link." });
      return;
    }
    setResetStatus(null);
    setResetLoading(true);
    try {
      await post(
        "/api/auth/password-reset/request",
        { email: profileData.email },
        { auth: false }
      );
      setResetStatus({
        type: "success",
        message: "Password reset link sent to your email.",
      });
    } catch (error: any) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Failed to send reset link. Please try again.";
      setResetStatus({ type: "error", message });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and system preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#00C4B3]" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-[#00C4B3]/20">
                  <AvatarImage
                    src={profileData.profileImage ?? undefined}
                    alt={`${profileData.firstName} ${profileData.lastName}`.trim()}
                  />

                  <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Photo
                  </Button>
                  {profileData.profileImage && (
                    <Button
                      variant="ghost"
                      className="text-sm px-0 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setProfileData((prev) => ({
                          ...prev,
                          profileImage: null,
                        }));
                        setPhotoError(null);
                      }}
                    >
                      Remove Photo
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 2MB
                  </p>
                  {photoError && (
                    <p className="text-xs text-red-500">{photoError}</p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }

                    if (file.size > 2 * 1024 * 1024) {
                      setPhotoError("Image must be smaller than 2MB.");
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => {
                      setProfileData((prev) => ({
                        ...prev,
                        profileImage:
                          typeof reader.result === "string"
                            ? reader.result
                            : prev.profileImage,
                      }));
                      setPhotoError(null);
                    };
                    reader.onerror = () => {
                      setPhotoError("Unable to read the selected file.");
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        firstName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lastName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={roleLabel} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={profileData.email}
                      disabled
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    <Input
                      id="phone"
                      className="pl-10"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
                disabled={isSavingProfile}
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                {isSavingProfile ? "Saving..." : "Save Profile"}
              </Button>
              {profileSaveStatus && (
                <p
                  className={`text-sm ${
                    profileSaveStatus.type === "success"
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {profileSaveStatus.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reset Password */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockIcon className="w-5 h-5 text-[#00C4B3]" />
                Reset Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send a password reset link to your registered email ({profileData.email || "not set"}).
                The link will be emailed to you (Gmail recommended).
              </p>
              {resetStatus && (
                <div
                  className={`text-sm px-3 py-2 rounded-md border ${
                    resetStatus.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {resetStatus.message}
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handleSendResetLink}
                  disabled={resetLoading}
                  className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] text-white"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preferences */}
        <div className="space-y-6">
          {/* Notification Settings */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellIcon className="w-5 h-5 text-[#00C4B3]" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      emailNotifications: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications via SMS
                  </p>
                </div>
                <Switch
                  checked={notifications.smsNotifications}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      smsNotifications: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Appointment Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Get reminders for appointments
                  </p>
                </div>
                <Switch
                  checked={notifications.appointmentReminders}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      appointmentReminders: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Critical system notifications
                  </p>
                </div>
                <Switch
                  checked={notifications.systemAlerts}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      systemAlerts: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive weekly summary reports
                  </p>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      weeklyReports: checked,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
