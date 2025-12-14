import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  AwardIcon,
  ClockIcon,
  UserIcon,
  EditIcon,
  ActivityIcon,
  TrendingUpIcon,
  UsersIcon,
  StarIcon,
  CheckCircleIcon,
  SaveIcon,
  HistoryIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { get, put } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  speciality?: string;
  licenseNumber?: string;
  experience?: string;
  profileImage?: string;
  createdAt?: string;
}

export function AdminUserProfile() {
  const { userId } = useParams();
  const { user: authUser } = useAuth();
  const clinicId = (authUser as any)?.clinicId;
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await get<{ user: User }>(
          `/api/admin/users/${userId}${clinicId ? `?clinicId=${clinicId}` : ""}`
        );
        const payload = (response.data as any)?.user ?? response.data;
        if (response.success && payload) {
          setUser(payload);
          setEditedUser(payload);
        } else {
          setError(response.message ?? "Failed to load user");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load user";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleSave = async () => {
    if (!userId || !editedUser) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await put(`/api/admin/users/${userId}`, {
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
        email: editedUser.email,
        phone: editedUser.phone,
        speciality: editedUser.speciality,
        licenseNumber: editedUser.licenseNumber,
        experience: editedUser.experience,
      });

      if (response.success && response.data) {
        setUser(response.data);
        setEditedUser(response.data);
        setIsEditing(false);
      } else {
        setError(response.message ?? "Failed to update user");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update user";
      setError(message);
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

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {error ? "Error Loading Profile" : "User Not Found"}
          </h2>
          <p className="text-muted-foreground">
            {error || "The requested user profile could not be found."}
          </p>
        </div>
      </div>
    );
  }

  const userName = user.fullName || `${user.firstName} ${user.lastName}`;
  const userType = user.role;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-none shadow-xl overflow-hidden bg-gradient-to-r from-[#00C4B3]/12 via-white to-[#0ea5e9]/12 relative">
        <div className="absolute inset-x-0 -top-10 h-32 bg-gradient-to-r from-[#00C4B3] via-[#10b981] to-[#0ea5e9] opacity-70 blur-2xl" />
        <CardContent className="relative pt-10 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="w-32 h-32 border-4 border-white/90 dark:border-gray-900 shadow-2xl flex-shrink-0">
              <AvatarImage src={user.profileImage} alt={userName} />

              <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white text-3xl">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 md:mb-2 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editedUser?.firstName || ""}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, firstName: e.target.value })
                        }
                        placeholder="First Name"
                        className="text-xl font-bold h-auto py-2"
                      />
                      <Input
                        value={editedUser?.lastName || ""}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, lastName: e.target.value })
                        }
                        placeholder="Last Name"
                        className="text-xl font-bold h-auto py-2"
                      />
                    </div>
                  ) : (
                    <h1 className="text-3xl font-bold text-foreground">
                      {userName}
                    </h1>
                  )}
                  <p className="text-lg text-muted-foreground mt-1">
                    {user.speciality || user.role}
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.isActive
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200 capitalize"
                    >
                      {userType}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedUser(user);
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
                        onClick={handleSave}
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
                            Save Changes
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
                      onClick={() => {
                        setIsEditing(true);
                      }}
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Contact & Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                  <MailIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Email</p>
                  {isEditing ? (
                    <Input
                      value={editedUser?.email || ""}
                      onChange={(e) =>
                        setEditedUser({ ...editedUser, email: e.target.value })
                      }
                      className="text-sm font-medium h-8 mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground break-all">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                  <PhoneIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  {isEditing ? (
                    <Input
                      value={editedUser?.phone || ""}
                      onChange={(e) =>
                        setEditedUser({ ...editedUser, phone: e.target.value })
                      }
                      className="text-sm font-medium h-8 mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">
                      {user.phone}
                    </p>
                  )}
                </div>
              </div>

              {user.role === "doctor" && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
                      <BriefcaseIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">
                        Experience
                      </p>
                      {isEditing ? (
                        <Input
                          value={editedUser?.experience || ""}
                          onChange={(e) =>
                            setEditedUser({ ...editedUser, experience: e.target.value })
                          }
                          placeholder="e.g., 10 years"
                          className="text-sm font-medium h-8 mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground">
                          {user.experience || "Not specified"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                      <AwardIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">
                        Specialization
                      </p>
                      {isEditing ? (
                        <Input
                          value={editedUser?.speciality || ""}
                          onChange={(e) =>
                            setEditedUser({ ...editedUser, speciality: e.target.value })
                          }
                          placeholder="e.g., Cardiology"
                          className="text-sm font-medium h-8 mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground">
                          {user.speciality || "Not specified"}
                        </p>
                      )}
                    </div>
                  </div>

                  {user.licenseNumber && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center flex-shrink-0">
                        <AwardIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">
                          License Number
                        </p>
                        {isEditing ? (
                          <Input
                            value={editedUser?.licenseNumber || ""}
                            onChange={(e) =>
                              setEditedUser({ ...editedUser, licenseNumber: e.target.value })
                            }
                            placeholder="License number"
                            className="text-sm font-medium h-8 mt-1"
                          />
                        ) : (
                          <p className="text-sm font-medium text-foreground">
                            {user.licenseNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User ID</span>
                <span className="text-sm font-medium text-foreground font-mono text-xs">
                  {user._id}
                </span>
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Account Status
                </span>
                <Badge
                  variant="outline"
                  className={
                    user.isActive
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400"
                  }
                >
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-medium text-foreground capitalize">
                  {userType}
                </span>
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Member Since
                </span>
                <span className="text-sm font-medium text-foreground">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                      })
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional Information */}
          {user.role === "doctor" && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BriefcaseIcon className="w-5 h-5 text-[#00C4B3]" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Specialization</span>
                  <span className="text-sm font-medium text-foreground">
                    {user.speciality || "Not specified"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Experience</span>
                  <span className="text-sm font-medium text-foreground">
                    {user.experience || "Not specified"}
                  </span>
                </div>
                {user.licenseNumber && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">License Number</span>
                      <span className="text-sm font-medium text-foreground font-mono text-xs">
                        {user.licenseNumber}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* User Information Summary */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#00C4B3]" />
                User Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Full Name</p>
                  <p className="text-base font-medium text-foreground">{userName}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Email Address</p>
                  <p className="text-base font-medium text-foreground break-all">{user.email}</p>
                </div>
                {user.phone && (
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-2">Phone Number</p>
                    <p className="text-base font-medium text-foreground">{user.phone}</p>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Account Status</p>
                  <Badge
                    variant="outline"
                    className={
                      user.isActive
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400"
                    }
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
