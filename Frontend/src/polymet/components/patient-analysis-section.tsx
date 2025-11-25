import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Loader2Icon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { get } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";

type TimeFilter = "day" | "week" | "month" | "year";

interface AppointmentOverviewData {
  total: number;
  completed: number;
  cancelled: number;
  noShows: number;
  noShowRate: number;
  averageConsultationTime: number;
  peakCount: number;
  averageCount: number;
  chartData: {
    dates: string[];
    counts: number[];
  };
  period: string;
  startDate: string;
  endDate: string;
}

export function PatientAnalysisSection() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");
  const [overviewData, setOverviewData] = useState<AppointmentOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      if (!user?._id) return;
      
      try {
        setIsLoading(true);
        const response = await get<{ data: AppointmentOverviewData }>(
          `/api/doctors/appointment-overview?period=${timeFilter}&doctorId=${user._id}`
        );
        
        if (response.success && response.data) {
          setOverviewData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch appointment overview:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, [user?._id, timeFilter]);

  // Format chart data based on period
  const formatChartData = () => {
    if (!overviewData?.chartData) return [];

    const { dates, counts } = overviewData.chartData;
    
    if (timeFilter === "week") {
      // Format dates as day abbreviations (Mon, Tue, etc.)
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return dates.map((dateStr, index) => {
        // Parse date string (YYYY-MM-DD)
        const [year, month, day] = dateStr.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        const dayName = dayNames[date.getDay()];
        return { time: dayName, appointments: counts[index] || 0 };
      });
    } else if (timeFilter === "day") {
      // Format as hours
      return dates.map((dateStr, index) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        const hour = date.getHours();
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return { time: `${displayHour} ${period}`, appointments: counts[index] || 0 };
      });
    } else if (timeFilter === "month") {
      // Format as week numbers
      return dates.map((dateStr, index) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        const weekNum = Math.ceil(date.getDate() / 7);
        return { time: `Week ${weekNum}`, appointments: counts[index] || 0 };
      });
    } else {
      // Format as month abbreviations
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return dates.map((dateStr, index) => {
        const [year, month] = dateStr.split("-").map(Number);
        const monthName = monthNames[month - 1];
        return { time: monthName, appointments: counts[index] || 0 };
      });
    }
  };

  const currentData = formatChartData();
  const totalAppointments = overviewData?.total || 0;
  const averageCount = overviewData?.averageCount || 0;
  const peakCount = overviewData?.peakCount || 0;

  const filterButtons: { label: string; value: TimeFilter }[] = [
    { label: "Day", value: "day" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "Year", value: "year" },
  ];

  return (
    <Card className="border-border shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-2 rounded-lg">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm">Appointments Overview</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Total: {totalAppointments} appointments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            {filterButtons.map((filter) => (
              <Button
                key={filter.value}
                variant={timeFilter === filter.value ? "default" : "ghost"}
                size="sm"
                className={`h-6 px-2 text-[10px] ${
                  timeFilter === filter.value
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600"
                    : "hover:bg-muted"
                }`}
                onClick={() => setTimeFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-[140px]">
            <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : currentData.length === 0 ? (
          <div className="flex items-center justify-center h-[140px] text-muted-foreground text-sm">
            No appointment data available
          </div>
        ) : (
          <div className="space-y-3">
            {/* Line Chart Visualization */}
            <div className="w-full">
              <ChartContainer
                config={{}}
                className="aspect-[none] w-full h-[140px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />

                    <ChartTooltip content={<ChartTooltipContent />} />

                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{
                        fill: "hsl(var(--chart-2))",
                        strokeWidth: 2,
                        r: 3,
                      }}
                      activeDot={{
                        r: 5,
                        fill: "hsl(var(--chart-2))",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  Average
                </p>
                <p className="text-base font-bold text-foreground">
                  {Math.round(averageCount)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                <p className="text-[10px] text-muted-foreground mb-0.5">Peak</p>
                <p className="text-base font-bold text-foreground">
                  {peakCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                <p className="text-[10px] text-muted-foreground mb-0.5">Total</p>
                <p className="text-base font-bold text-foreground">
                  {totalAppointments}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
