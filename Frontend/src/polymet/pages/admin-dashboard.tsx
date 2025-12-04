import { useEffect, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "@/polymet/components/stat-card";
import { DoctorCard } from "@/polymet/components/doctor-card";
import { ReceptionistCard } from "@/polymet/components/receptionist-card";
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
  FlaskConicalIcon,
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
  newPatientsThisWeek?: number;
  patientMessagesThisWeek?: number;
  pendingFollowUps?: number;
  appointmentTypeStats?: {
    consultation: number;
    followUp: number;
    emergency: number;
    checkup: number;
  };
  labTestCount?: number;
  recentActivity: Array<{
    type: string;
    description: string;
    patientName?: string;
    date: string;
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

interface Receptionist {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive?: boolean;
}

type RevenuePeriod = "day" | "week" | "month" | "year";

interface RevenueOverview {
  period: RevenuePeriod;
  startDate: string;
  endDate: string;
  totalAppointmentsRevenue: number;
  totalLabTestsRevenue: number;
  totalRevenue: number;
  chartData: {
    dates: string[];
    appointments: number[];
    tests: number[];
    total: number[];
    appointmentCounts?: number[]; // Optional: counts per hour for day view
  };
}

interface AdminStatCardProps {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  accent?: "teal" | "emerald" | "blue" | "purple";
}

function AdminStatCard({
  label,
  value,
  icon: Icon,
  accent = "teal",
}: AdminStatCardProps) {
  const accents: Record<NonNullable<AdminStatCardProps["accent"]>, string> = {
    teal: "from-[#E0F7F4] to-[#F2FFFD] border-[#99F2E4]/60",
    emerald: "from-[#E3F9F0] to-[#F4FFFA] border-[#A5F3CF]/60",
    blue: "from-[#E0F2FF] to-[#F5FAFF] border-[#93C5FD]/60",
    purple: "from-[#F3E8FF] to-[#FAF5FF] border-[#D8B4FE]/60",
  };

  const accentClasses = accents[accent];

  return (
    <div
      className={`flex items-center justify-between rounded-xl border bg-gradient-to-br px-4 py-3 shadow-sm ${accentClasses}`}
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground leading-none">{value}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/70 shadow-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [revenueOverview, setRevenueOverview] = useState<RevenueOverview | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("month");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper: get current ISO week number (1–53)
  const getCurrentWeekNumber = () => {
    const now = new Date();
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = date.getUTCDay() || 7; // Monday=1 ... Sunday=7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return weekNo;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [statsResponse, doctorsResponse, receptionistsResponse, revenueResponse] = await Promise.all([
          get<DashboardStats>("/api/admin/dashboard"),
          get<Doctor[]>("/api/doctors?limit=12"),
          get<Receptionist[]>("/api/admin/users?role=receptionist&isActive=true&limit=12"),
          get<RevenueOverview>(`/api/admin/metrics/revenue?period=${revenuePeriod}`),
        ]);

        if (statsResponse.success && statsResponse.data) {
          setDashboardStats(statsResponse.data);
        } else {
          throw new Error(statsResponse.message || "Unable to load dashboard stats");
        }

        if (doctorsResponse.success && Array.isArray(doctorsResponse.data)) {
          setDoctors(doctorsResponse.data);
        } else {
          setDoctors([]);
        }

        if (receptionistsResponse.success) {
          // Extract users array from paginated response (API returns { data: [...] } with pagination metadata)
          const responseData = receptionistsResponse.data as any;
          // Paginated response structure: { data: [...], metadata: {...} }
          const usersData = Array.isArray(responseData?.data) 
            ? responseData.data 
            : Array.isArray(responseData) 
            ? responseData 
            : [];
          const activeReceptionists = usersData.filter((r: any) => 
            r.role === "receptionist" && r.isActive !== false
          );
          setReceptionists(activeReceptionists);
        } else {
          setReceptionists([]);
        }

        if (revenueResponse.success && revenueResponse.data) {
          setRevenueOverview(revenueResponse.data);
        } else {
          setRevenueOverview(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [revenuePeriod]);

  // Format recent activities for display
  const recentActivities = dashboardStats?.recentActivity?.slice(0, 4).map((activity, index) => {
    const patientName = activity.patientName || "Unknown";
    const actionText = activity.description === "Appointment" 
      ? "Appointment" 
      : activity.description === "New patient register"
      ? "New patient register"
      : activity.description;
    
    return {
      id: index + 1,
      action: actionText,
      patientName: patientName,
      time: new Date(activity.date).toLocaleString(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=random&color=ffffff`,
    };
  }) || [];

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

  const buildRevenueSeries = (kind: "appointments" | "tests") => {
    if (!revenueOverview) return [];

    const dates = revenueOverview.chartData.dates;
    const source =
      kind === "appointments"
        ? revenueOverview.chartData.appointments
        : revenueOverview.chartData.tests;

    // Aggregate daily values into buckets for month/year views
    const buckets = new Map<string, number>();

    const formatLabel = (dateOrHour: Date | string, index?: number): string => {
      // For day view, dates array contains hour strings like "00:00", "01:00", etc.
      if (revenuePeriod === "day") {
        if (typeof dateOrHour === "string") {
          // Use 24-hour format on the X-axis (no AM/PM)
          const hour = parseInt(dateOrHour.split(":")[0] || "0", 10);
          const baseLabel = `${hour.toString().padStart(2, "0")}:00`;
          // Keep labels clean – appointment counts are shown in the tooltip
          return baseLabel;
        }
        // Fallback (shouldn't normally hit): show time portion in 24h format
        const hours = dateOrHour.getHours();
        const baseLabel = `${hours.toString().padStart(2, "0")}:00`;
        return baseLabel;
      }

      if (revenuePeriod === "week") {
        const date = typeof dateOrHour === "string" ? new Date(dateOrHour) : dateOrHour;
        // Show weekday (e.g., Mon, Tue)
        return date.toLocaleDateString(undefined, { weekday: "short" });
      }

      if (revenuePeriod === "month") {
        const date = typeof dateOrHour === "string" ? new Date(dateOrHour) : dateOrHour;
        // Week label within month
        const weekNum = Math.ceil(date.getDate() / 7);
        return `W${weekNum}`;
      }

      // year view: month abbreviation
      const date = typeof dateOrHour === "string" ? new Date(dateOrHour) : dateOrHour;
      return date.toLocaleDateString(undefined, { month: "short" });
    };

    dates.forEach((dateOrHourStr, index) => {
      // For day view, dateOrHourStr is already an hour string like "00:00"
      if (revenuePeriod === "day") {
        // Filter to only show hours 8 AM to 8 PM (08:00 to 20:00)
        const hour = parseInt(dateOrHourStr.split(":")[0] || "0", 10);
        if (hour >= 8 && hour <= 20) {
          // Use hour string directly as bucket key
          buckets.set(dateOrHourStr, source[index] || 0);
        }
        return;
      }

      // For other periods, parse as date
      const [year, month, day] = dateOrHourStr.split("-").map(Number);
      if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
        return;
      }
      const date = new Date(year, month - 1, day);

      let bucketKey: string;
      if (revenuePeriod === "month") {
        const weekNum = Math.ceil(date.getDate() / 7);
        bucketKey = `${year}-${month}-W${weekNum}`;
      } else if (revenuePeriod === "year") {
        bucketKey = `${year}-${month}`;
      } else {
        bucketKey = dateOrHourStr;
      }

      const current = buckets.get(bucketKey) ?? 0;
      buckets.set(bucketKey, current + (source[index] || 0));
    });

    // For day view, ensure hours 8-20 are present (even with zero revenue),
    // but only show ALTERNATE hours (08, 10, 12, ..., 20) to avoid clutter.
    if (revenuePeriod === "day") {
      const dayViewHours: string[] = [];
      // Start from 08:00 and step by 2 hours: 08, 10, 12, ..., 20
      for (let hour = 8; hour <= 20; hour += 2) {
        dayViewHours.push(`${hour.toString().padStart(2, "0")}:00`);
      }
      
      return dayViewHours.map((hourStr) => {
        const hour = parseInt(hourStr.split(":")[0] || "0", 10);
        let count: number | undefined = undefined;
        if (revenueOverview?.chartData.appointmentCounts) {
          count = revenueOverview.chartData.appointmentCounts[hour] ?? 0;
        }
        return {
          label: formatLabel(hourStr, hour),
          value: buckets.get(hourStr) ?? 0,
          count: count,
        };
      });
    }

    // For month view, ensure all 4 weeks are present (even with zero revenue)
    if (revenuePeriod === "month") {
      // Use startDate from revenueOverview to determine which month we're viewing
      const startDate = revenueOverview.startDate 
        ? new Date(revenueOverview.startDate) 
        : new Date();
      const viewYear = startDate.getFullYear();
      const viewMonth = startDate.getMonth() + 1; // 1-12
      const monthViewWeeks: string[] = [];
      // Generate all 4 weeks for the viewed month
      for (let week = 1; week <= 4; week++) {
        monthViewWeeks.push(`${viewYear}-${viewMonth}-W${week}`);
      }
      
      return monthViewWeeks.map((weekKey) => {
        const [yStr, mStr] = weekKey.split("-W")[0].split("-");
        const year = Number(yStr);
        const month = Number(mStr);
        const weekNum = Number(weekKey.split("-W")[1]);
        const day = (weekNum - 1) * 7 + 1;
        const dateForLabel = new Date(year, month - 1, day);
        return {
          label: formatLabel(dateForLabel),
          value: buckets.get(weekKey) ?? 0,
        };
      });
    }

    // For year view, ensure all 12 months are present (even with zero revenue)
    if (revenuePeriod === "year") {
      // Use startDate from revenueOverview to determine which year we're viewing
      const startDate = revenueOverview.startDate 
        ? new Date(revenueOverview.startDate) 
        : new Date();
      const viewYear = startDate.getFullYear();
      const yearViewMonths: string[] = [];
      // Generate all 12 months for the viewed year
      for (let month = 1; month <= 12; month++) {
        yearViewMonths.push(`${viewYear}-${month}`);
      }
      
      return yearViewMonths.map((yearMonthKey) => {
        const [year, month] = yearMonthKey.split("-").map(Number);
        const dateForLabel = new Date(year, month - 1, 1);
        return {
          label: formatLabel(dateForLabel),
          value: buckets.get(yearMonthKey) ?? 0,
        };
      });
    }

    // For week view, sort by date (already in YYYY-MM-DD format, so string sort works)
    const sortedKeys = Array.from(buckets.keys()).sort();

    return sortedKeys.map((key) => {
      // Parse date for label
      const [year, month, day] = key.split("-").map(Number);
      const dateForLabel = new Date(year, month - 1, day);

      return {
        label: formatLabel(dateForLabel),
        value: buckets.get(key) ?? 0,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Patients"
          value={dashboardStats?.totalPatients ?? 0}
          icon={UsersIcon}
          accent="teal"
        />

        <AdminStatCard
          label="Active Doctors"
          value={dashboardStats?.totalDoctors ?? 0}
          icon={ActivityIcon}
          accent="emerald"
        />

        <AdminStatCard
          label="Receptionists"
          value={dashboardStats?.totalReceptionists ?? 0}
          icon={UserPlusIcon}
          accent="blue"
        />

        <AdminStatCard
          label="Today's Appointments"
          value={dashboardStats?.appointmentsToday ?? 0}
          icon={CalendarIcon}
          accent="purple"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Charts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-[#00C4B3]" />
                <CardTitle className="flex items-center gap-2">
                  Revenue Overview
                </CardTitle>
              </div>
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                {(["day", "week", "month", "year"] as RevenuePeriod[]).map((period) => (
                  <Button
                    key={period}
                    variant={revenuePeriod === period ? "default" : "ghost"}
                    size="sm"
                    className={`h-7 px-2 text-[11px] ${
                      revenuePeriod === period
                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setRevenuePeriod(period)}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Appointment Revenue */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-2 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Appointment Revenue</CardTitle>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Total:{" "}
                          {revenueOverview
                            ? revenueOverview.totalAppointmentsRevenue.toFixed(2)
                            : "0.00"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  <ChartContainer config={{}} className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={buildRevenueSeries("appointments")}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          interval={revenuePeriod === "day" ? 0 : "preserveStartEnd"}
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const data = payload[0].payload;
                            const appointmentCount = data.count;
                            
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs text-muted-foreground">Revenue</span>
                                    <span className="font-medium">
                                      ₹{data.value?.toFixed(2) ?? "0.00"}
                                    </span>
                                  </div>
                                  {appointmentCount !== undefined && appointmentCount > 0 && (
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-xs text-muted-foreground">
                                        Appointments
                                      </span>
                                      <span className="font-medium">{appointmentCount}</span>
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground border-t pt-1">
                                    {data.label}
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--chart-2))", r: 3 }}
                          activeDot={{ r: 5, fill: "hsl(var(--chart-2))", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Lab Test Revenue */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-2 rounded-lg">
                        <TrendingUpIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Lab Test Revenue</CardTitle>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Total:{" "}
                          {revenueOverview
                            ? revenueOverview.totalLabTestsRevenue.toFixed(2)
                            : "0.00"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  <ChartContainer config={{}} className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={buildRevenueSeries("tests")}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          interval={revenuePeriod === "day" ? 0 : "preserveStartEnd"}
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const data = payload[0].payload;
                            const appointmentCount = data.count;
                            
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs text-muted-foreground">Revenue</span>
                                    <span className="font-medium">
                                      ₹{data.value?.toFixed(2) ?? "0.00"}
                                    </span>
                                  </div>
                                  {appointmentCount !== undefined && appointmentCount > 0 && (
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-xs text-muted-foreground">
                                        Appointments
                                      </span>
                                      <span className="font-medium">{appointmentCount}</span>
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground border-t pt-1">
                                    {data.label}
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--chart-1))", r: 3 }}
                          activeDot={{ r: 5, fill: "hsl(var(--chart-1))", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Doctors */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Doctors</CardTitle>
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
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                {doctors.map((doctor) => (
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

          {/* Receptionists */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Receptionists</CardTitle>
              <Link to="/admin-credentials">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                >
                  <UserPlusIcon className="w-4 h-4 mr-2" />
                  Add Receptionist
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                {receptionists.map((receptionist) => (
                  <Link
                    key={receptionist._id}
                    to={`/admin/user-profile/${receptionist._id}`}
                    className="block"
                  >
                    <ReceptionistCard
                      name={`${receptionist.firstName} ${receptionist.lastName}`}
                      email={receptionist.email}
                      phone={receptionist.phone || "N/A"}
                      avatar={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${receptionist.firstName} ${receptionist.lastName}`)}&background=random&color=ffffff`}
                      status="available"
                      onViewProfile={() => {}}
                    />
                  </Link>
                ))}
              </div>
              {receptionists.length === 0 && (
                <div className="text-center py-8">
                  <UserPlusIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active receptionists found</p>
                </div>
              )}
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

        {/* Quick Stats (Appointment Types for current week) */}
        <Card className="border-border shadow-sm bg-gradient-to-br from-[#FFF7E0]/60 to-[#FFF9EC]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Week {getCurrentWeekNumber()}
                </p>
              </div>
              <div className="rounded-lg p-2 bg-white text-muted-foreground shadow-sm">
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(() => {
              const types = dashboardStats?.appointmentTypeStats;
              const consultation = types?.consultation ?? 0;
              const followUp = types?.followUp ?? 0;
              const emergency = types?.emergency ?? 0;
              const checkup = types?.checkup ?? 0;

              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Consultation</span>
                    <span className="font-semibold text-foreground">
                      {consultation}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Follow-ups</span>
                    <span className="font-semibold text-foreground">
                      {followUp}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Emergency</span>
                    <span className="font-semibold text-foreground">
                      {emergency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Checkup</span>
                    <span className="font-semibold text-foreground">
                      {checkup}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-3">
                    <div className="flex items-center gap-2">
                      <FlaskConicalIcon className="w-4 h-4 text-[#00C4B3]" />
                      <span className="text-muted-foreground">Lab Test</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {dashboardStats?.labTestCount ?? 0}
                    </span>
                  </div>
                </>
              );
            })()}
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
                    <AvatarImage src={activity.avatar} alt={activity.patientName} />

                    <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white text-xs">
                      {activity.patientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium">
                      {activity.action}
                    </p>
                    <p className="text-xs text-foreground">
                      {activity.patientName}
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
