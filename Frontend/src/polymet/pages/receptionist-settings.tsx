import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  UserIcon,
  BellIcon,
  LockIcon,
  PaletteIcon,
  ClockIcon,
  SaveIcon,
  Loader2Icon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { get, put } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

interface ReceptionistProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
}

export function ReceptionistSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<{ profile?: boolean; availability?: boolean; notifications?: boolean }>({});
  
  const [profile, setProfile] = useState<ReceptionistProfile>({
    _id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profileImage: "",
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    smsAlerts: true,
    appointmentReminders: true,
    newAppointments: true,
    patientCheckIns: true,
  });

  const [availabilitySlots, setAvailabilitySlots] = useState<Array<{
    day: string;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>>([
    { day: "Monday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Tuesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Wednesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Thursday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Friday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Saturday", startTime: "10:00", endTime: "14:00", enabled: false },
    { day: "Sunday", startTime: "10:00", endTime: "14:00", enabled: false },
  ]);

  // Fetch availability on component mount
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        // Temporarily use default availability since API endpoint has issues
        // const response = await get<{ availability: Record<string, { startTime: string; endTime: string; enabled: boolean }> }>("/api/receptionists/me/availability");
        // if (response.success && response.data?.availability) {
        //   const avail = response.data.availability;
        //   const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        //   const slots = days.map(day => {
        //     const dayData = avail[day];
        //     if (dayData) {
        //       return {
        //         day,
        //         startTime: dayData.startTime || "09:00",
        //         endTime: dayData.endTime || "17:00",
        //         enabled: dayData.enabled !== false,
        //       };
        //     }
        //     return {
        //       day,
        //       startTime: "09:00",
        //       endTime: "17:00",
        //       enabled: false,
        //     };
        //   });
        //   setAvailabilitySlots(slots);
        // }
        // For now, use the default availability slots already defined
        console.log("Using default availability settings");
      } catch (err) {
        console.error("Failed to load availability:", err);
      }
    };

    fetchAvailability();
  }, []);

  // Fetch receptionist profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try API call first
        try {
          const response = await get<{ user: ReceptionistProfile & { notificationPreferences?: Record<string, boolean> } }>("/api/auth/me");
          if (response.success && response.data?.user) {
            setProfile(response.data.user);
            if (response.data.user.notificationPreferences) {
              setNotificationPreferences({
                emailNotifications: response.data.user.notificationPreferences.emailNotifications ?? true,
                smsAlerts: response.data.user.notificationPreferences.smsAlerts ?? true,
                appointmentReminders: response.data.user.notificationPreferences.appointmentReminders ?? true,
                newAppointments: response.data.user.notificationPreferences.newAppointments ?? true,
                patientCheckIns: response.data.user.notificationPreferences.patientCheckIns ?? true,
              });
            }
            return; // Success, exit early
          }
        } catch (apiErr) {
          console.warn("API call failed, using auth context user:", apiErr);
        }
        
        // Fallback to auth context user if API fails
        if (user) {
          setProfile({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || "",
            profileImage: user.profileImage || "",
          });
        } else {
          setError("Failed to load profile. Please try logging in again.");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load profile";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const toggleDay = (index: number) => {
    setAvailabilitySlots((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
  };

  const updateTime = (
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setAvailabilitySlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const updateData: Partial<ReceptionistProfile> = {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phone: profile.phone || undefined,
      };

      const response = await put<{ receptionist: ReceptionistProfile }>(
        "/api/receptionists/me/profile",
        updateData
      );

      if (response.success && response.data?.receptionist) {
        setProfile(response.data.receptionist);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        throw new Error(response.message ?? "Failed to update profile");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Convert availability slots to the format expected by the API
      const availability: Record<string, { startTime: string; endTime: string; enabled: boolean }> = {};
      availabilitySlots.forEach(slot => {
        availability[slot.day] = {
          startTime: slot.startTime,
          endTime: slot.endTime,
          enabled: slot.enabled,
        };
      });

      const response = await put<{ availability: typeof availability }>(
        "/api/receptionists/me/availability",
        { availability }
      );

      if (response.success) {
        setSaveSuccess({ ...saveSuccess, availability: true });
        setTimeout(() => setSaveSuccess(prev => ({ ...prev, availability: false })), 3000);
        toast({
          title: "✓ Availability updated",
          description: "Your availability schedule has been updated successfully.",
        });
      } else {
        throw new Error(response.message ?? "Failed to update availability");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update availability";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotificationPreferences = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await put<{ notificationPreferences: typeof notificationPreferences }>(
        "/api/receptionists/me/notifications",
        { notificationPreferences }
      );

      if (response.success) {
        setSaveSuccess({ ...saveSuccess, notifications: true });
        setTimeout(() => setSaveSuccess(prev => ({ ...prev, notifications: false })), 3000);
        toast({
          title: "✓ Preferences updated",
          description: "Your notification preferences have been updated successfully.",
        });
      } else {
        throw new Error(response.message ?? "Failed to update preferences");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update preferences";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2Icon className="w-16 h-16 text-[#00C4B3] mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Profile</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error && !profile._id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Profile</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl">
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Settings */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.profileImage} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" disabled>
                Change Photo
              </Button>
              <p className="text-xs text-muted-foreground">
                Photo upload coming soon
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className={`${saveSuccess.profile ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} text-white`}
            >
              {isSaving ? (
                <>
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess.profile ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Availability Settings */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Availability Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Set your weekly availability for work hours
            </p>
          </div>

          <div className="space-y-3">
            {availabilitySlots.map((slot, index) => (
              <div
                key={slot.day}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <Switch
                  checked={slot.enabled}
                  onCheckedChange={() => toggleDay(index)}
                />

                <div className="flex-1 grid grid-cols-3 gap-3 items-center">
                  <Label
                    className={
                      slot.enabled
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {slot.day}
                  </Label>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) =>
                      updateTime(index, "startTime", e.target.value)
                    }
                    disabled={!slot.enabled}
                    className="text-sm"
                  />

                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) =>
                      updateTime(index, "endTime", e.target.value)
                    }
                    disabled={!slot.enabled}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleSaveAvailability}
              disabled={isSaving}
              className={`${saveSuccess.availability ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'} text-white`}
            >
              {isSaving ? (
                <>
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess.availability ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Save Availability
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Appointments</p>
              <p className="text-sm text-muted-foreground">
                Get notified when new appointments are scheduled
              </p>
            </div>
            <Switch
              checked={notificationPreferences.newAppointments}
              onCheckedChange={(checked) =>
                setNotificationPreferences({
                  ...notificationPreferences,
                  newAppointments: checked,
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Patient Check-ins</p>
              <p className="text-sm text-muted-foreground">
                Receive alerts when patients check in
              </p>
            </div>
            <Switch
              checked={notificationPreferences.patientCheckIns}
              onCheckedChange={(checked) =>
                setNotificationPreferences({
                  ...notificationPreferences,
                  patientCheckIns: checked,
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Appointment Reminders</p>
              <p className="text-sm text-muted-foreground">
                Reminders for upcoming appointments
              </p>
            </div>
            <Switch
              checked={notificationPreferences.appointmentReminders}
              onCheckedChange={(checked) =>
                setNotificationPreferences({
                  ...notificationPreferences,
                  appointmentReminders: checked,
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive email updates
              </p>
            </div>
            <Switch
              checked={notificationPreferences.emailNotifications}
              onCheckedChange={(checked) =>
                setNotificationPreferences({
                  ...notificationPreferences,
                  emailNotifications: checked,
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS Alerts</p>
              <p className="text-sm text-muted-foreground">
                Receive SMS notifications
              </p>
            </div>
            <Switch
              checked={notificationPreferences.smsAlerts}
              onCheckedChange={(checked) =>
                setNotificationPreferences({
                  ...notificationPreferences,
                  smsAlerts: checked,
                })
              }
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveNotificationPreferences}
              disabled={isSaving}
              className={`${saveSuccess.notifications ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} text-white`}
            >
              {isSaving ? (
                <>
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess.notifications ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockIcon className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaletteIcon className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">
                Toggle dark mode theme
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
