import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
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

type TimeFilter = "day" | "week" | "month" | "year";

export function PatientAnalysisSection() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");

  // Data for different time periods
  const appointmentData = {
    day: [
      { time: "8 AM", appointments: 2 },
      { time: "9 AM", appointments: 5 },
      { time: "10 AM", appointments: 8 },
      { time: "11 AM", appointments: 6 },
      { time: "12 PM", appointments: 3 },
      { time: "1 PM", appointments: 4 },
      { time: "2 PM", appointments: 7 },
      { time: "3 PM", appointments: 9 },
      { time: "4 PM", appointments: 5 },
      { time: "5 PM", appointments: 3 },
    ],

    week: [
      { time: "Mon", appointments: 24 },
      { time: "Tue", appointments: 32 },
      { time: "Wed", appointments: 28 },
      { time: "Thu", appointments: 35 },
      { time: "Fri", appointments: 30 },
      { time: "Sat", appointments: 18 },
      { time: "Sun", appointments: 12 },
    ],

    month: [
      { time: "Week 1", appointments: 98 },
      { time: "Week 2", appointments: 112 },
      { time: "Week 3", appointments: 105 },
      { time: "Week 4", appointments: 125 },
    ],

    year: [
      { time: "Jan", appointments: 420 },
      { time: "Feb", appointments: 380 },
      { time: "Mar", appointments: 450 },
      { time: "Apr", appointments: 410 },
      { time: "May", appointments: 480 },
      { time: "Jun", appointments: 440 },
      { time: "Jul", appointments: 390 },
      { time: "Aug", appointments: 460 },
      { time: "Sep", appointments: 470 },
      { time: "Oct", appointments: 490 },
      { time: "Nov", appointments: 510 },
      { time: "Dec", appointments: 430 },
    ],
  };

  const currentData = appointmentData[timeFilter];
  const totalAppointments = currentData.reduce(
    (sum, item) => sum + item.appointments,
    0
  );

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
                {Math.round(totalAppointments / currentData.length)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
              <p className="text-[10px] text-muted-foreground mb-0.5">Peak</p>
              <p className="text-base font-bold text-foreground">
                {Math.max(...currentData.map((d) => d.appointments))}
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
      </CardContent>
    </Card>
  );
}
