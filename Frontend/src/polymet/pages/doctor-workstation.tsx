import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRightIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  ActivityIcon,
  FileTextIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XIcon,
  GripVerticalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react";
import { patients } from "@/polymet/data/healthcare-data";

export function DoctorWorkstation() {
  const navigate = useNavigate();

  const [queuePatients, setQueuePatients] = useState([
    {
      ...patients[0],
      appointmentTime: "09:00 AM",
      reason: "Regular Checkup",
      priority: "normal" as const,
      waitTime: "15 min",
    },
    {
      ...patients[1],
      appointmentTime: "09:30 AM",
      reason: "Hypertension Follow-up",
      priority: "high" as const,
      waitTime: "5 min",
    },
    {
      ...patients[2],
      appointmentTime: "10:00 AM",
      reason: "Flu Symptoms",
      priority: "normal" as const,
      waitTime: "Just now",
    },
    {
      ...patients[3],
      appointmentTime: "10:30 AM",
      reason: "Diabetes Management",
      priority: "low" as const,
      waitTime: "Scheduled",
    },
    {
      ...patients[4],
      appointmentTime: "11:00 AM",
      reason: "Routine Checkup",
      priority: "normal" as const,
      waitTime: "Scheduled",
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance to next patient when returning from consultation
  useEffect(() => {
    const consultationCompleted = sessionStorage.getItem(
      "consultationCompleted"
    );
    if (consultationCompleted === "true") {
      // Clear the flag immediately
      sessionStorage.removeItem("consultationCompleted");
      // Move to next patient automatically
      setCurrentIndex((prevIndex) => {
        if (prevIndex < queuePatients.length - 1) {
          return prevIndex + 1;
        }
        return prevIndex;
      });
    }
  }, []); // Run only once on mount

  const handleNext = () => {
    if (currentIndex < queuePatients.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleComplete = () => {
    // Remove current patient and automatically move to next
    setQueuePatients((prev) => {
      const newQueue = prev.filter((_, index) => index !== currentIndex);
      // If there are more patients, current index stays the same (next patient moves up)
      // If this was the last patient, index will be reduced automatically
      return newQueue;
    });

    // Don't change currentIndex - the next patient will automatically become current
    // Only adjust if we're beyond the new array length
    if (currentIndex >= queuePatients.length - 1 && currentIndex > 0) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const currentPatient = queuePatients[currentIndex];

  if (!currentPatient) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="border-border shadow-lg max-w-md">
          <CardContent className="p-12 text-center">
            <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />

            <h3 className="text-2xl font-bold text-foreground mb-2">
              All Done!
            </h3>
            <p className="text-muted-foreground">
              No patients in queue. Great work today!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "normal":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "low":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Patient Queue
          </h2>
          <p className="text-muted-foreground">
            {queuePatients.length} patients waiting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <ClockIcon className="w-4 h-4 mr-2" />

            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Badge>
        </div>
      </div>

      {/* Current Patient Card - Prominent Display */}
      <div className="relative flex items-center justify-center">
        {/* Current Patient Card */}
        <div className="w-full max-w-4xl">
          {currentPatient && (
            <div
              key={currentPatient.id}
              className="w-full transition-all duration-500 ease-out"
            >
              <Card className="border-2 shadow-2xl border-blue-500 dark:border-blue-400">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                        <AvatarImage
                          src={currentPatient.avatar}
                          alt={currentPatient.name}
                        />

                        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-xl font-bold">
                          {currentPatient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-2xl">
                          {currentPatient.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentPatient.id} • {currentPatient.appointmentTime}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            className={getPriorityColor(
                              currentPatient.priority
                            )}
                          >
                            {currentPatient.priority} priority
                          </Badge>
                          <Badge variant="outline">
                            <ClockIcon className="w-3 h-3 mr-1" />

                            {currentPatient.waitTime}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-lg px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                    >
                      Current Patient
                    </Badge>
                  </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-blue-500" />
                        Patient Information
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4 text-muted-foreground" />

                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">
                            {currentPatient.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MailIcon className="w-4 h-4 text-muted-foreground" />

                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">
                            {currentPatient.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ActivityIcon className="w-4 h-4 text-muted-foreground" />

                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="outline">
                            {currentPatient.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <FileTextIcon className="w-5 h-5 text-emerald-500" />
                        Appointment Details
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-muted-foreground block mb-1">
                            Reason for Visit:
                          </span>
                          <p className="font-medium">{currentPatient.reason}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">
                            Last Visit:
                          </span>
                          <p className="font-medium">
                            {currentPatient.lastVisit || "First Visit"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        asChild
                      >
                        <Link to={`/patient-details/${currentPatient.id}`}>
                          <FileTextIcon className="w-4 h-4 mr-2" />
                          View History
                        </Link>
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg text-base px-6 py-6"
                        asChild
                      >
                        <Link to={`/consultation/${currentPatient.id}`}>
                          <ActivityIcon className="w-5 h-5 mr-2" />
                          Start Consultation
                        </Link>
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={handleComplete}
                        className="hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Complete
                      </Button>
                      {currentIndex < queuePatients.length - 1 && (
                        <Button
                          onClick={handleNext}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
                        >
                          Next Patient
                          <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Patients Queue - Reorderable */}
      <Card className="border-border shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Upcoming Patients</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {queuePatients.length - currentIndex - 1} patients in queue •
                Drag to reorder priority
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queuePatients.slice(currentIndex + 1).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming patients in queue</p>
              </div>
            ) : (
              queuePatients.slice(currentIndex + 1).map((patient, idx) => {
                const actualIndex = currentIndex + 1 + idx;
                return (
                  <div
                    key={patient.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "patientIndex",
                        actualIndex.toString()
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedIndex = parseInt(
                        e.dataTransfer.getData("patientIndex")
                      );
                      if (draggedIndex !== actualIndex) {
                        const newQueue = [...queuePatients];
                        const [draggedPatient] = newQueue.splice(
                          draggedIndex,
                          1
                        );
                        newQueue.splice(actualIndex, 0, draggedPatient);
                        setQueuePatients(newQueue);
                      }
                    }}
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-card hover:bg-accent/50 transition-all cursor-move group"
                  >
                    <div className="flex items-center gap-2">
                      <GripVerticalIcon className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          onClick={() => {
                            if (actualIndex > currentIndex + 1) {
                              const newQueue = [...queuePatients];
                              [
                                newQueue[actualIndex],
                                newQueue[actualIndex - 1],
                              ] = [
                                newQueue[actualIndex - 1],
                                newQueue[actualIndex],
                              ];

                              setQueuePatients(newQueue);
                            }
                          }}
                          disabled={actualIndex === currentIndex + 1}
                        >
                          <ArrowUpIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          onClick={() => {
                            if (actualIndex < queuePatients.length - 1) {
                              const newQueue = [...queuePatients];
                              [
                                newQueue[actualIndex],
                                newQueue[actualIndex + 1],
                              ] = [
                                newQueue[actualIndex + 1],
                                newQueue[actualIndex],
                              ];

                              setQueuePatients(newQueue);
                            }
                          }}
                          disabled={actualIndex === queuePatients.length - 1}
                        >
                          <ArrowDownIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={patient.avatar} alt={patient.name} />

                      <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white">
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {patient.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {patient.appointmentTime} • {patient.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(patient.priority)}>
                        {patient.priority}
                      </Badge>
                      <Badge variant="outline">
                        <ClockIcon className="w-3 h-3 mr-1" />

                        {patient.waitTime}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        asChild
                      >
                        <Link to={`/patient-details/${patient.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
