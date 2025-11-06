import { Link } from "react-router-dom";
import { StatCard } from "@/polymet/components/stat-card";
import { DoctorCard } from "@/polymet/components/doctor-card";
import { PatientSearchWidget } from "@/polymet/components/patient-search-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UsersIcon,
  CalendarIcon,
  ActivityIcon,
  TrendingUpIcon,
  DollarSignIcon,
  UserPlusIcon,
  ArrowRightIcon,
  ClockIcon,
} from "lucide-react";
import {
  patients,
  appointments,
  doctors,
  staff,
} from "@/polymet/data/healthcare-data";
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function AdminDashboard() {
  const totalPatients = patients.length;
  const totalDoctors = doctors.length;
  const totalStaff = staff.length;
  const todayAppointments = appointments.filter(
    (apt) => apt.date === "2024-01-20"
  ).length;
  const activeStaff = staff.filter((s) => s.status === "active").length;

  const revenueData = [
    { month: "Jan", revenue: 45000 },
    { month: "Feb", revenue: 52000 },
    { month: "Mar", revenue: 48000 },
    { month: "Apr", revenue: 61000 },
    { month: "May", revenue: 55000 },
    { month: "Jun", revenue: 67000 },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "New patient registered",
      user: "Priya Menon",
      time: "5 min ago",
      avatar: "https://github.com/kdrnp.png",
    },
    {
      id: 2,
      action: "Appointment completed",
      user: "Dr. Amit Patel",
      time: "12 min ago",
      avatar: "https://github.com/yusufhilmi.png",
    },
    {
      id: 3,
      action: "Staff member added",
      user: "Meera Krishnan",
      time: "1 hour ago",
      avatar: "https://github.com/yahyabedirhan.png",
    },
    {
      id: 4,
      action: "Report generated",
      user: "Ravi Shankar",
      time: "2 hours ago",
      avatar: "https://github.com/polymet-ai.png",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Patients"
          value={totalPatients}
          icon={UsersIcon}
          color="teal"
          trend={{ value: "12% increase", isPositive: true }}
        />

        <StatCard
          title="Active Doctors"
          value={totalDoctors}
          icon={ActivityIcon}
          color="emerald"
        />

        <StatCard
          title="Staff Members"
          value={totalStaff}
          icon={UserPlusIcon}
          color="blue"
        />

        <StatCard
          title="Today's Appointments"
          value={todayAppointments}
          icon={CalendarIcon}
          color="purple"
        />

        <StatCard
          title="Monthly Revenue"
          value="$67K"
          icon={DollarSignIcon}
          color="orange"
          trend={{ value: "8% increase", isPositive: true }}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-[#00C4B3]" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />

                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                    />

                    <ChartTooltip content={<ChartTooltipContent />} />

                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                      radius={[8, 8, 0, 0]}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Doctor Management */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Medical Staff</CardTitle>
              <Link to="/admin-credentials">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
                >
                  <UserPlusIcon className="w-4 h-4 mr-2" />
                  Add Doctor
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {doctors.slice(0, 4).map((doctor) => (
                  <Link
                    key={doctor.id}
                    to={`/admin/user-profile/${doctor.id}`}
                    className="block"
                  >
                    <DoctorCard
                      name={doctor.name}
                      specialization={doctor.specialization}
                      email={doctor.email}
                      phone={doctor.phone}
                      patients={doctor.patients}
                      experience={doctor.experience}
                      avatar={doctor.avatar}
                      status={doctor.status}
                      onViewProfile={() => {}}
                    />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Staff Management */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Administrative Staff</CardTitle>
              <Link to="/admin-credentials">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
                >
                  Manage Staff
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-[#00C4B3]/20">
                        <AvatarImage src={member.avatar} alt={member.name} />

                        <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {member.name}
                        </h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={
                          member.status === "active"
                            ? "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {member.status}
                      </Badge>
                      <Link to={`/admin/user-profile/${member.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#00C4B3] hover:bg-[#00C4B3]/10"
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Patient Search Widget */}
          <PatientSearchWidget
            userRole="admin"
            className="border-border shadow-sm"
          />

          {/* Quick Stats */}
          <Card className="border-border shadow-sm bg-gradient-to-br from-[#00C4B3]/5 to-[#10b981]/5">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Active Staff
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {activeStaff}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Departments
                </span>
                <span className="text-2xl font-bold text-foreground">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Bed Capacity
                </span>
                <span className="text-2xl font-bold text-foreground">150</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Occupancy</span>
                <span className="text-2xl font-bold text-[#00C4B3]">87%</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-[#00C4B3]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 border border-border">
                    <AvatarImage src={activity.avatar} alt={activity.user} />

                    <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white text-xs">
                      {activity.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Server Status
                </span>
                <Badge className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20">
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <Badge className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20">
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Backup</span>
                <Badge className="bg-[#33A8FF]/10 text-[#33A8FF] border-[#33A8FF]/20">
                  Scheduled
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
