import { useEffect, useState } from "react";
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
  AlertCircleIcon,
} from "lucide-react";
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
import { get } from "@/lib/api-client";

interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  totalDoctors: number;
  totalReceptionists: number;
  totalClinicalNotes: number;
  totalRecordings: number;
  appointmentsToday: number;
  patientsThisMonth: number;
  recentActivity: Array<{
    type: string;
    description: string;
    date: string;
    user: string;
  }>;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  speciality?: string;
  phone?: string;
}

interface RevenueData {
  month: string;
  revenue: number;
}

export function AdminDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch dashboard stats
        const statsResponse = await get<{ dashboard: DashboardStats }>("/api/admin/dashboard");
        if (statsResponse.success && statsResponse.data?.dashboard) {
          setDashboardStats(statsResponse.data.dashboard);
        }

        // Fetch doctors list
        const doctorsResponse = await get<{ doctors: Doctor[] }>("/api/doctors?limit=4");
        if (doctorsResponse.success && doctorsResponse.data?.doctors) {
          setDoctors(doctorsResponse.data.doctors);
        }

        // Fetch revenue data
        const revenueResponse = await get<{ series: RevenueData[] }>("/api/admin/metrics/revenue");
        if (revenueResponse.success && revenueResponse.data?.series) {
          setRevenueData(revenueResponse.data.series);
        }

      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format recent activities for display
  const recentActivities = dashboardStats?.recentActivity?.slice(0, 4).map((activity, index) => ({
    id: index + 1,
    action: activity.description,
    user: activity.user,
    time: new Date(activity.date).toLocaleString(),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user)}&background=random&color=ffffff`,
  })) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-border shadow-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="w-12 h-12 bg-muted rounded-xl" />
                  <div className="space-y-2">
                    <div className="w-20 h-4 bg-muted rounded" />
                    <div className="w-16 h-6 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/20">
          <CardContent className="p-6 text-center">
            <AlertCircleIcon className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Failed to load dashboard</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Patients"
          value={dashboardStats?.totalPatients || 0}
          icon={UsersIcon}
          color="teal"
        />

        <StatCard
          title="Active Doctors"
          value={dashboardStats?.totalDoctors || 0}
          icon={ActivityIcon}
          color="emerald"
        />

        <StatCard
          title="Receptionists"
          value={dashboardStats?.totalReceptionists || 0}
          icon={UserPlusIcon}
          color="blue"
        />

        <StatCard
          title="Today's Appointments"
          value={dashboardStats?.appointmentsToday || 0}
          icon={CalendarIcon}
          color="purple"
        />

        <StatCard
          title="Total Appointments"
          value={dashboardStats?.totalAppointments || 0}
          icon={CalendarIcon}
          color="orange"
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
                    key={doctor._id}
                    to={`/admin/user-profile/${doctor._id}`}
                    className="block"
                  >
                    <DoctorCard
                      name={`${doctor.firstName} ${doctor.lastName}`}
                      specialization={doctor.speciality || "General Medicine"}
                      email={doctor.email}
                      phone={doctor.phone || ""}
                      patients={0} // TODO: Add patient count API
                      experience="5+ years" // TODO: Add experience field
                      avatar={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${doctor.firstName} ${doctor.lastName}`)}&background=random&color=ffffff`}
                      status="available" // TODO: Add status field
                      onViewProfile={() => {}}
                    />
                  </Link>
                ))}
              </div>
              {doctors.length === 0 && (
                <div className="text-center py-8">
                  <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No doctors found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clinical Notes & Recordings */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Clinical Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Clinical Notes</span>
                <span className="text-2xl font-bold text-foreground">
                  {dashboardStats?.totalClinicalNotes || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recordings</span>
                <span className="text-2xl font-bold text-foreground">
                  {dashboardStats?.totalRecordings || 0}
                </span>
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
                  New Patients This Month
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {dashboardStats?.patientsThisMonth || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Appointments Today
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {dashboardStats?.appointmentsToday || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Active Doctors
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {dashboardStats?.totalDoctors || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Patients</span>
                <span className="text-2xl font-bold text-[#00C4B3]">
                  {dashboardStats?.totalPatients || 0}
                </span>
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
