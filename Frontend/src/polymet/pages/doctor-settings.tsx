import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  UserIcon,
  BellIcon,
  ClockIcon,
  SaveIcon,
  PlusIcon,
  XIcon,
  ActivityIcon,
  Loader2Icon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { get, put } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { MediEaseLoader } from "@/polymet/components/mediease-loader";

interface DoctorProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  speciality?: string;
  licenseNumber?: string;
  experience?: number;
  profileImage?: string;
}

export function DoctorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<DoctorProfile>({
    _id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    speciality: "",
    licenseNumber: "",
    experience: 0,
    profileImage: "",
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    smsAlerts: true,
    appointmentReminders: true,
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
        const response = await get<{ availability: Record<string, { startTime: string; endTime: string; enabled: boolean }> }>("/api/doctors/me/availability");
        if (response.success && response.data?.availability) {
          const avail = response.data.availability;
          const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          const slots = days.map(day => {
            const dayData = avail[day];
            if (dayData) {
              return {
                day,
                startTime: dayData.startTime || "09:00",
                endTime: dayData.endTime || "17:00",
                enabled: dayData.enabled !== false,
              };
            }
            return {
              day,
              startTime: "09:00",
              endTime: "17:00",
              enabled: false,
            };
          });
          setAvailabilitySlots(slots);
        }
      } catch (err) {
        console.error("Failed to load availability:", err);
      }
    };

    fetchAvailability();
  }, []);

  // Fetch doctor profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await get<{ doctor: DoctorProfile & { notificationPreferences?: { emailNotifications?: boolean; smsAlerts?: boolean; appointmentReminders?: boolean } } }>("/api/doctors/me");
        if (response.success && response.data?.doctor) {
          setProfile(response.data.doctor);
          if (response.data.doctor.notificationPreferences) {
            setNotificationPreferences({
              emailNotifications: response.data.doctor.notificationPreferences.emailNotifications ?? true,
              smsAlerts: response.data.doctor.notificationPreferences.smsAlerts ?? true,
              appointmentReminders: response.data.doctor.notificationPreferences.appointmentReminders ?? true,
            });
          }
        } else {
          setError(response.message ?? "Failed to load profile");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load profile";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

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

      // Extract first and last name from full name if needed
      const nameParts = profile.firstName?.split(" ") || [];
      const firstName = nameParts[0] || profile.firstName || "";
      const lastName = nameParts.slice(1).join(" ") || profile.lastName || "";

      const updateData: Partial<DoctorProfile> = {
        firstName: firstName.trim(),
        lastName: lastName.trim() || firstName.trim(), // Fallback to firstName if empty
        phone: profile.phone || undefined,
        speciality: profile.speciality || undefined,
        licenseNumber: profile.licenseNumber || undefined,
        experience: profile.experience || undefined,
        profileImage: profile.profileImage || undefined,
      };

      const response = await put<{ doctor: DoctorProfile }>(
        "/api/doctors/me/profile",
        updateData
      );

      if (response.success && response.data?.doctor) {
        setProfile(response.data.doctor);
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
        "/api/doctors/me/availability",
        { availability }
      );

      if (response.success) {
        toast({
          title: "Availability updated",
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

  if (isLoading) {
    return (
      <MediEaseLoader>
        {/* Render the settings page skeleton/layout while loading */}
        <div className="space-y-6">
          {/* Profile Section Skeleton */}
          <div className="border-border shadow-md rounded-lg bg-card">
            <div className="border-b p-6">
              <div className="animate-pulse">
                <div className="w-32 h-6 bg-muted rounded mb-2" />
                <div className="w-48 h-4 bg-muted rounded" />
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="animate-pulse flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full" />
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-muted rounded" />
                  <div className="w-24 h-3 bg-muted rounded" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="w-20 h-3 bg-muted rounded" />
                    <div className="w-full h-10 bg-muted rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Availability Section Skeleton */}
          <div className="border-border shadow-md rounded-lg bg-card">
            <div className="border-b p-6">
              <div className="animate-pulse">
                <div className="w-32 h-6 bg-muted rounded mb-2" />
                <div className="w-48 h-4 bg-muted rounded" />
              </div>
            </div>
            <div className="p-6">
              <div className="animate-pulse space-y-3">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="w-6 h-6 bg-muted rounded" />
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div className="w-16 h-4 bg-muted rounded" />
                      <div className="w-full h-8 bg-muted rounded" />
                      <div className="w-full h-8 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications Section Skeleton */}
          <div className="border-border shadow-md rounded-lg bg-card">
            <div className="border-b p-6">
              <div className="animate-pulse">
                <div className="w-32 h-6 bg-muted rounded mb-2" />
                <div className="w-48 h-4 bg-muted rounded" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between">
                  <div className="w-32 h-4 bg-muted rounded" />
                  <div className="w-12 h-6 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </MediEaseLoader>
    );
  }

  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Dr. User";
  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() || "DU";

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                <AvatarImage src={profile.profileImage || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" disabled>
                  Change Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Profile image upload coming soon
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={profile.firstName || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                  placeholder="First Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={profile.lastName || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                  placeholder="Last Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profile.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="Phone Number"
                />
              </div>
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Input
                  value={profile.speciality || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, speciality: e.target.value })
                  }
                  placeholder="e.g., MD, General Physician"
                />
              </div>
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input
                  value={profile.licenseNumber || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, licenseNumber: e.target.value })
                  }
                  placeholder="License Number"
                />
              </div>
              <div className="space-y-2">
                <Label>Experience (Years)</Label>
                <Input
                  type="number"
                  min="0"
                  value={profile.experience || 0}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      experience: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Years of experience"
                />
              </div>
            </div>

            <Separator />

            {/* Availability Time Section */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Availability Schedule
                </h4>
                <p className="text-xs text-muted-foreground">
                  Set your weekly availability for appointments
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
            </div>

            <div className="flex gap-3">
              <Button
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveAvailability}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Save Availability
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellIcon className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Email Notifications</Label>
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
                <Label>SMS Alerts</Label>
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
              <div className="flex items-center justify-between">
                <Label>Appointment Reminders</Label>
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
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={async () => {
                  try {
                    setIsSaving(true);
                    const response = await put(
                      "/api/doctors/me/notifications",
                      { notificationPreferences }
                    );
                    if (response.success) {
                      toast({
                        title: "Notifications updated",
                        description: "Your notification preferences have been saved.",
                      });
                    }
                  } catch (err) {
                    toast({
                      title: "Error",
                      description: "Failed to update notification preferences",
                      variant: "destructive",
                    });
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
