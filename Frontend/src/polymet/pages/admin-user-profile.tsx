import { useParams, Link } from "react-router-dom";
import { useState } from "react";
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
} from "lucide-react";
import { doctors, staff } from "@/polymet/data/healthcare-data";

export function AdminUserProfile() {
  const { userId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<any>(null);

  // Find user in doctors or staff
  const doctor = doctors.find((d) => d.id === userId);
  const staffMember = staff.find((s) => s.id === userId);
  const user = doctor || staffMember;
  const userType = doctor ? "doctor" : "receptionist";

  // Initialize edited user when user is found
  if (user && !editedUser && !isEditing) {
    setEditedUser(user);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <UserIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />

          <h2 className="text-2xl font-bold text-foreground mb-2">
            User Not Found
          </h2>
          <p className="text-muted-foreground">
            The requested user profile could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#00C4B3] to-[#10b981]" />

        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start -mt-16">
            <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-900 shadow-xl flex-shrink-0">
              <AvatarImage src={user.avatar} alt={user.name} />

              <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white text-3xl">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 md:mb-4 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  {isEditing ? (
                    <Input
                      value={editedUser?.name || ""}
                      onChange={(e) =>
                        setEditedUser({ ...editedUser, name: e.target.value })
                      }
                      className="text-3xl font-bold h-auto py-2 mb-2"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-foreground">
                      {user.name}
                    </h1>
                  )}
                  <p className="text-lg text-muted-foreground mt-1">
                    {doctor ? doctor.specialization : staffMember?.role}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className={
                        user.status === "active"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400"
                      }
                    >
                      {user.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 capitalize"
                    >
                      {userType}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <Button
                      className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
                      onClick={() => {
                        // Save changes
                        setIsEditing(false);
                        // Here you would typically save to backend
                      }}
                    >
                      <SaveIcon className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
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

              {doctor && (
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
                      <p className="text-sm font-medium text-foreground">
                        {doctor.experience}
                      </p>
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
                      <p className="text-sm font-medium text-foreground">
                        {doctor.specialization}
                      </p>
                    </div>
                  </div>
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
                <span className="text-sm font-medium text-foreground">
                  {user.id}
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
                    user.status === "active"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400"
                  }
                >
                  {user.status}
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
                  Last Login
                </span>
                <span className="text-sm font-medium text-foreground">
                  2 hours ago
                </span>
              </div>
              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Member Since
                </span>
                <span className="text-sm font-medium text-foreground">
                  Jan 2023
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {doctor && (
            <>
              {/* Performance Stats */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-border shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Patients
                        </p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">
                          {doctor.patients}
                        </h3>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <UsersIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Consultations
                        </p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">
                          342
                        </h3>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <ActivityIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Rating</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1 flex items-center gap-1">
                          4.8
                          <StarIcon className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        </h3>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <TrendingUpIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Schedule & Availability */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-[#00C4B3]" />
                    Schedule & Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        day: "Monday",
                        time: "9:00 AM - 5:00 PM",
                        status: "Available",
                      },
                      {
                        day: "Tuesday",
                        time: "9:00 AM - 5:00 PM",
                        status: "Available",
                      },
                      {
                        day: "Wednesday",
                        time: "9:00 AM - 5:00 PM",
                        status: "Available",
                      },
                      {
                        day: "Thursday",
                        time: "9:00 AM - 5:00 PM",
                        status: "Available",
                      },
                      {
                        day: "Friday",
                        time: "9:00 AM - 3:00 PM",
                        status: "Available",
                      },
                      { day: "Saturday", time: "Closed", status: "Off" },
                      { day: "Sunday", time: "Closed", status: "Off" },
                    ].map((schedule) => (
                      <div
                        key={schedule.day}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#00C4B3]" />

                          <span className="font-medium text-foreground">
                            {schedule.day}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {schedule.time}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              schedule.status === "Available"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400"
                            }
                          >
                            {schedule.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Recent Activity */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-[#00C4B3]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    action: "Completed consultation",
                    details: "Patient: Sarah Johnson",
                    time: "2 hours ago",
                    icon: CheckCircleIcon,
                    color: "text-emerald-500",
                  },
                  {
                    action: "Updated patient records",
                    details: "Patient: Michael Chen",
                    time: "5 hours ago",
                    icon: EditIcon,
                    color: "text-blue-500",
                  },
                  {
                    action: "Scheduled appointment",
                    details: "Patient: Emily Rodriguez",
                    time: "1 day ago",
                    icon: CalendarIcon,
                    color: "text-purple-500",
                  },
                ].map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 ${activity.color}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.details}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
