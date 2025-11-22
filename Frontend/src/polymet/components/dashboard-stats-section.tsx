import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarIcon,
  UsersIcon,
  FileTextIcon,
  ClockIcon,
  MessageSquareIcon,
  UsersRoundIcon,
} from "lucide-react";

interface DashboardStatsSectionProps {
  totalPatients: number;
  todayAppointments: number;
  inQueue: number;
  completedToday: number;
  onNewAppointment: () => void;
  onAddPatient: () => void;
  onWritePrescription: () => void;
  onViewReports: () => void;
  onMessages: () => void;
}

export function DashboardStatsSection({
  totalPatients,
  todayAppointments,
  inQueue,
  completedToday,
  onNewAppointment,
  onAddPatient,
  onWritePrescription,
  onViewReports,
  onMessages,
}: DashboardStatsSectionProps) {
  return (
    <>
      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Card
          onClick={onNewAppointment}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
        >
          <CardContent className="p-3 flex flex-col items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />

            <p className="text-xs font-semibold text-center text-foreground">
              New Appointment
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={onAddPatient}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
        >
          <CardContent className="p-3 flex flex-col items-center justify-center">
            <UsersIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />

            <p className="text-xs font-semibold text-center text-foreground">
              Add Patient
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={onWritePrescription}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
        >
          <CardContent className="p-3 flex flex-col items-center justify-center">
            <FileTextIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2" />

            <p className="text-xs font-semibold text-center text-foreground">
              Write Prescription
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={onViewReports}
          className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
        >
          <CardContent className="p-3 flex flex-col items-center justify-center">
            <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-2" />

            <p className="text-xs font-semibold text-center text-foreground">
              View Reports
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={onMessages}
          className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/20 border-cyan-200 dark:border-cyan-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
        >
          <CardContent className="p-3 flex flex-col items-center justify-center">
            <MessageSquareIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mb-2" />

            <p className="text-xs font-semibold text-center text-foreground">
              Messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-md bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <UsersRoundIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Patients</p>
                <p className="text-xl font-bold text-foreground">
                  {totalPatients}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-md bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Today's Appointments
                </p>
                <p className="text-xl font-bold text-foreground">
                  {todayAppointments}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-md bg-gradient-to-br from-teal-50/50 to-teal-100/30 dark:from-teal-950/20 dark:to-teal-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                <ClockIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Queue</p>
                <p className="text-xl font-bold text-foreground">{inQueue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-md bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <svg
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed Today</p>
                <p className="text-xl font-bold text-foreground">
                  {completedToday}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
