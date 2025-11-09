import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
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
import { put } from "@/lib/api-client";
import { useAuth, type User } from "@/context/auth-context";

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

  const [systemSettings, setSystemSettings] = useState({
    theme: "light",
    language: "en",
    timezone: "UTC-5",
    dateFormat: "MM/DD/YYYY",
  });

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

  const handleSaveNotifications = () => {
    // Save notifications logic
    console.log("Notifications saved:", notifications);
  };

  const handleSaveSystemSettings = () => {
    // Save system settings logic
    console.log("System settings saved:", systemSettings);
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

          {/* Security Settings */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockIcon className="w-5 h-5 text-[#00C4B3]" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button
                variant="outline"
                className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
              >
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="w-5 h-5 text-[#00C4B3]" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={systemSettings.theme}
                    onValueChange={(value) =>
                      setSystemSettings({ ...systemSettings, theme: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={systemSettings.language}
                    onValueChange={(value) =>
                      setSystemSettings({ ...systemSettings, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={systemSettings.timezone}
                    onValueChange={(value) =>
                      setSystemSettings({ ...systemSettings, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-5">EST (UTC-5)</SelectItem>
                      <SelectItem value="UTC-6">CST (UTC-6)</SelectItem>
                      <SelectItem value="UTC-7">MST (UTC-7)</SelectItem>
                      <SelectItem value="UTC-8">PST (UTC-8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={systemSettings.dateFormat}
                    onValueChange={(value) =>
                      setSystemSettings({
                        ...systemSettings,
                        dateFormat: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleSaveSystemSettings}
                className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Save System Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Notifications */}
        <div className="space-y-6">
          {/* Notification Settings */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellIcon className="w-5 h-5 text-[#00C4B3]" />
                Notifications
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

              <Button
                onClick={handleSaveNotifications}
                className="w-full bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldIcon className="w-5 h-5 text-[#00C4B3]" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
              >
                <DatabaseIcon className="w-4 h-4 mr-2" />
                Backup Database
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
              >
                <PaletteIcon className="w-4 h-4 mr-2" />
                Customize Branding
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                <ShieldIcon className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
