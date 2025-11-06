import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  FileTextIcon,
  PillIcon,
  XIcon,
  ActivityIcon,
  CheckCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentTimelineItem {
  id: string;
  date: string;
  time: string;
  type: "current" | "past";
  title: string;
  description: string;
  doctor: string;
  prescription?: string[];
  clinicalNotes?: string;
  status: "active" | "completed";
  relativeTime?: string;
}

interface AppointmentTimelineHorizontalProps {
  appointments: AppointmentTimelineItem[];
  className?: string;
}

export function AppointmentTimelineHorizontal({
  appointments,
  className,
}: AppointmentTimelineHorizontalProps) {
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentTimelineItem | null>(null);

  return (
    <>
      <div className={cn("relative", className)}>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {appointments.map((appointment, index) => (
              <Card
                key={appointment.id}
                onClick={() => setSelectedAppointment(appointment)}
                className={cn(
                  "flex-shrink-0 w-[280px] cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
                  appointment.status === "active"
                    ? "border-2 border-emerald-500 dark:border-emerald-400 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20"
                    : "border border-border hover:border-blue-300 dark:hover:border-blue-700"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          appointment.status === "active"
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                            : "bg-gradient-to-br from-blue-500 to-indigo-500"
                        )}
                      >
                        {appointment.status === "active" ? (
                          <ActivityIcon className="w-5 h-5 text-white" />
                        ) : (
                          <CheckCircleIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {appointment.date}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.time}
                        </p>
                      </div>
                    </div>
                    {appointment.status === "active" && (
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        Active
                      </Badge>
                    )}
                    {appointment.relativeTime && (
                      <Badge variant="outline" className="text-[10px] bg-muted">
                        {appointment.relativeTime}
                      </Badge>
                    )}
                  </div>

                  <h4 className="font-semibold text-sm text-foreground mb-2">
                    {appointment.title}
                  </h4>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {appointment.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <UserIcon className="w-3 h-3 text-muted-foreground" />

                      <span className="text-muted-foreground">
                        {appointment.doctor}
                      </span>
                    </div>

                    {appointment.prescription && (
                      <div className="flex items-center gap-2 text-xs">
                        <PillIcon className="w-3 h-3 text-muted-foreground" />

                        <span className="text-muted-foreground">
                          {appointment.prescription.length} medication(s)
                        </span>
                      </div>
                    )}

                    {appointment.clinicalNotes && (
                      <div className="flex items-center gap-2 text-xs">
                        <FileTextIcon className="w-3 h-3 text-muted-foreground" />

                        <span className="text-muted-foreground">
                          Clinical notes available
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Appointment Details Popup */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    selectedAppointment.status === "active"
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                      : "bg-gradient-to-br from-blue-500 to-indigo-500"
                  )}
                >
                  {selectedAppointment.status === "active" ? (
                    <ActivityIcon className="w-6 h-6 text-white" />
                  ) : (
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Appointment Details
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.date} at {selectedAppointment.time}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAppointment(null)}
                className="hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <XIcon className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="max-h-[calc(90vh-120px)]">
              <div className="p-6 space-y-6">
                {/* Appointment Info */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />

                    <h4 className="font-semibold text-foreground">
                      Appointment Information
                    </h4>
                  </div>
                  <div className="space-y-3 pl-7">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedAppointment.title}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Description
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedAppointment.description}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Doctor</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedAppointment.doctor}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Date & Time
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedAppointment.date} at {selectedAppointment.time}
                      </p>
                    </div>
                    {selectedAppointment.relativeTime && (
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {selectedAppointment.relativeTime}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Prescription */}
                {selectedAppointment.prescription &&
                  selectedAppointment.prescription.length > 0 && (
                    <>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <PillIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />

                          <h4 className="font-semibold text-foreground">
                            Prescription
                          </h4>
                        </div>
                        <div className="space-y-2 pl-7">
                          {selectedAppointment.prescription.map(
                            (med, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800"
                              >
                                <p className="text-sm font-medium text-foreground">
                                  {med}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                {/* Clinical Notes */}
                {selectedAppointment.clinicalNotes && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileTextIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />

                      <h4 className="font-semibold text-foreground">
                        Clinical Notes
                      </h4>
                    </div>
                    <div className="pl-7">
                      <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {selectedAppointment.clinicalNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-muted/30">
              <Button
                onClick={() => setSelectedAppointment(null)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
