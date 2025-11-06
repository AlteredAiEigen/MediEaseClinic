import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  ActivityIcon,
  FileTextIcon,
  ClipboardListIcon,
  HeartPulseIcon,
  PillIcon,
  AlertCircleIcon,
  FlaskConicalIcon,
} from "lucide-react";
import { patients, appointments } from "@/polymet/data/healthcare-data";
import { LabReportViewerDialog } from "@/polymet/components/lab-report-viewer-dialog";
import { getLabReportsForPatient } from "@/polymet/data/lab-reports-data";

export function PatientOverview() {
  const { patientId = "P001" } = useParams();
  const patient = patients.find((p) => p.id === patientId) || patients[0];
  const patientAppointments = appointments.filter(
    (apt) => apt.patientId === patient.id
  );

  // Lab report viewer state
  const [labReportViewerOpen, setLabReportViewerOpen] = useState(false);
  const [selectedLabReport, setSelectedLabReport] = useState<any>(null);

  // Get lab reports for this patient
  const patientLabReports = getLabReportsForPatient(patient.id);

  const handleViewLabReport = (reportIndex: number) => {
    if (patientLabReports[reportIndex]) {
      setSelectedLabReport(patientLabReports[reportIndex]);
      setLabReportViewerOpen(true);
    }
  };

  const medicalHistory = [
    {
      date: "2024-01-15",
      condition: "Annual Physical Exam",
      doctor: "Dr. Robert Smith",
      status: "Completed",
    },
    {
      date: "2023-12-10",
      condition: "Flu Vaccination",
      doctor: "Dr. Emily Davis",
      status: "Completed",
    },
    {
      date: "2023-11-05",
      condition: "Blood Test",
      doctor: "Dr. Robert Smith",
      status: "Completed",
    },
  ];

  const medications = [
    {
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      prescribedBy: "Dr. Robert Smith",
    },
    {
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      prescribedBy: "Dr. Emily Davis",
    },
  ];

  const vitalSigns = [
    { label: "Blood Pressure", value: "120/80 mmHg", status: "normal" },
    { label: "Heart Rate", value: "72 bpm", status: "normal" },
    { label: "Temperature", value: "98.6°F", status: "normal" },
    { label: "Weight", value: "165 lbs", status: "normal" },
    { label: "Height", value: "5'8\"", status: "normal" },
  ];

  const allergies = ["Penicillin", "Peanuts"];

  return (
    <div className="space-y-6">
      {/* Lab Report Viewer Dialog */}
      <LabReportViewerDialog
        open={labReportViewerOpen}
        onOpenChange={setLabReportViewerOpen}
        reportData={selectedLabReport}
      />

      {/* Patient Header */}
      <Card className="border-border shadow-sm bg-gradient-to-br from-[#00C4B3]/5 to-[#10b981]/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-[#00C4B3]/20">
              <AvatarImage src={patient.avatar} alt={patient.name} />

              <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white text-2xl">
                {patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {patient.name}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    patient.status === "in-consultation"
                      ? "bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20"
                      : patient.status === "waiting"
                        ? "bg-[#F7B731]/10 text-[#F7B731] border-[#F7B731]/20"
                        : "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                  }
                >
                  {patient.status.replace("-", " ")}
                </Badge>
                {patient.isNew && (
                  <Badge
                    variant="outline"
                    className="bg-[#33A8FF]/10 text-[#33A8FF] border-[#33A8FF]/20"
                  >
                    New Patient
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="w-4 h-4" />

                  <span>ID: {patient.id}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />

                  <span>
                    {patient.age} years • {patient.gender}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ActivityIcon className="w-4 h-4" />

                  <span>Blood Type: {patient.bloodType}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PhoneIcon className="w-4 h-4" />

                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MailIcon className="w-4 h-4" />

                  <span>{patient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />

                  <span>Last Visit: {patient.lastVisit}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Schedule Appointment
              </Button>
              <Button
                variant="outline"
                className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
              >
                <FileTextIcon className="w-4 h-4 mr-2" />
                View Records
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="lab-results">Lab Results</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Vital Signs */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartPulseIcon className="w-5 h-5 text-[#00C4B3]" />
                  Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vitalSigns.map((vital, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {vital.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {vital.value}
                      </span>
                      <Badge className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20">
                        {vital.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Allergies & Conditions */}
            <div className="space-y-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircleIcon className="w-5 h-5 text-[#FF4F6E]" />
                    Allergies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-[#FF4F6E]/10 text-[#FF4F6E] border-[#FF4F6E]/20"
                      >
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardListIcon className="w-5 h-5 text-[#00C4B3]" />
                    Current Condition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">
                    {patient.condition || "No current conditions"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medicalHistory.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-foreground">
                        {record.condition}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {record.doctor}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.date}
                      </p>
                    </div>
                    <Badge className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20">
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PillIcon className="w-5 h-5 text-[#00C4B3]" />
                Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medications.map((med, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground">
                        {med.name}
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20"
                      >
                        Active
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Dosage: </span>
                        <span className="text-foreground font-medium">
                          {med.dosage}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Frequency:{" "}
                        </span>
                        <span className="text-foreground font-medium">
                          {med.frequency}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Prescribed by: {med.prescribedBy}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab-results" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConicalIcon className="w-5 h-5 text-[#00C4B3]" />
                Lab Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patientLabReports.length === 0 ? (
                <div className="text-center py-8">
                  <FlaskConicalIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />

                  <p className="text-sm text-muted-foreground">
                    No lab results available for this patient
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientLabReports.map((report, index) => (
                    <div
                      key={report.reportId}
                      className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {report.reportType}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {report.category}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {report.reportedDate}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
                          onClick={() => handleViewLabReport(index)}
                        >
                          <FileTextIcon className="w-4 h-4 mr-2" />
                          View Report
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                        <span>{report.reportId}</span>
                        <span>•</span>
                        <span>{report.labName}</span>
                        <span>•</span>
                        <span>{report.tests.length} tests</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Appointment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patientAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {appointment.reason}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {appointment.doctorName}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          appointment.status === "completed"
                            ? "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                            : appointment.status === "in-progress"
                              ? "bg-[#F7B731]/10 text-[#F7B731] border-[#F7B731]/20"
                              : "bg-[#33A8FF]/10 text-[#33A8FF] border-[#33A8FF]/20"
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{appointment.date}</span>
                      <span>•</span>
                      <span>{appointment.time}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {appointment.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
