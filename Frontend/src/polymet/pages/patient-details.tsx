import { useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { LabReportViewerDialog } from "@/polymet/components/lab-report-viewer-dialog";
import {
  getLabReportsForPatient,
  type LabReportData,
} from "@/polymet/data/lab-reports-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CalendarIcon,
  ActivityIcon,
  ThermometerIcon,
  HeartIcon,
  DropletIcon,
  ClipboardListIcon,
  PillIcon,
  FileTextIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  VideoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  AlertCircleIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PatientDetailsProps {
  className?: string;
}

export function PatientDetails({ className }: PatientDetailsProps) {
  const { patientId } = useParams();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedReport, setSelectedReport] = useState<LabReportData | null>(
    null
  );
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Check if user is a doctor based on the route
  const isDoctor =
    location.pathname.startsWith("/patient-details/") ||
    location.pathname.startsWith("/doctor/");

  // Mock patient data - in real app, fetch based on patientId
  const patient = {
    id: patientId || "P-2024-001",
    name: "Sarah Mitchell",
    avatar: "https://github.com/kdrnp.png",
    age: 42,
    gender: "Female",
    bloodType: "A+",
    phone: "+1 (415) 342-2738",
    email: "sarah.mitchell@email.com",
    address: "2847 Oak Street, San Francisco, CA 94102",
    primaryCondition: "Type 2 Diabetes",
    lastUpdated: "2024-01-20 09:49 AM",
  };

  const currentVitals = [
    {
      label: "Blood Pressure",
      value: "128/82",
      unit: "mmHg",
      status: "normal",
      icon: ActivityIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      timestamp: "2024-01-19 09:00 AM",
    },
    {
      label: "Heart Rate",
      value: "72",
      unit: "bpm",
      status: "normal",
      icon: HeartIcon,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      timestamp: "2024-01-19 09:00 AM",
    },
    {
      label: "Temperature",
      value: "98.6",
      unit: "°F",
      status: "normal",
      icon: ThermometerIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      timestamp: "2024-01-20 09:28 AM",
    },
  ];

  const additionalVitals = [
    {
      label: "Blood Glucose",
      value: "142",
      unit: "mg/dL",
      status: "warning",
      icon: DropletIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Oxygen Saturation",
      value: "98",
      unit: "%",
      status: "normal",
      icon: ActivityIcon,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      label: "Respiratory Rate",
      value: "16",
      unit: "breaths/min",
      status: "normal",
      icon: ActivityIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  const medications = [
    {
      name: "Atorvastatin",
      dosage: "20mg",
      frequency: "Once daily at bedtime",
      prescribedBy: "Dr. James Wilson",
      refills: "4 refills remaining",
      status: "active",
      notes: "Take at bedtime for optimal effectiveness",
    },
    {
      name: "Aspirin",
      dosage: "81mg",
      frequency: "Once daily",
      prescribedBy: "Dr. James Wilson",
      refills: "6 refills remaining",
      status: "active",
      notes: "Take with food to minimize GI irritation",
    },
  ];

  const medicalHistory = [
    {
      date: "2024-01-15 10:30 AM",
      doctor: "Dr. James Wilson",
      type: "Annual Physical",
      notes:
        "Patient reports improved energy levels since adjusting medication dosage. Blood glucose readings show positive trend. Continue current medication regimen.",
      diagnosis: "Routine annual examination",
      followUp: "Scheduled for 6 months",
    },
    {
      date: "2023-12-20",
      doctor: "Dr. James Wilson",
      type: "Follow-up",
      notes:
        "Discussed dietary modifications and exercise routine. Patient committed to 30-minute walks 5x weekly. Scheduled follow-up in 2 weeks.",
      diagnosis: "Discussed dietary modifications",
      followUp: "Completed",
    },
    {
      date: "2023-11-20 09:00 AM",
      doctor: "Dr. James Wilson",
      type: "Annual Physical",
      notes:
        "Annual physical examination completed. All vitals within acceptable range. Increased medications for diabetes management.",
      diagnosis: "Routine annual examination",
      followUp: "Completed",
    },
  ];

  // Get lab reports for the current patient
  const patientLabReports = getLabReportsForPatient(patientId || "P001");

  const handleViewReport = (report: LabReportData) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  const labResults = [
    {
      id: "1",
      name: "HbA1c",
      category: "Diabetes Management",
      result: "6.5%",
      normalRange: "< 5.7%",
      status: "warning",
      date: "2024-01-15",
      orderedBy: "Dr. James Wilson",
      notes:
        "Slightly elevated. Continue monitoring. Nutritional counseling recommended.",
    },
    {
      id: "2",
      name: "Lipid Panel",
      category: "Cardiovascular",
      result: "Total: 185 mg/dL, LDL: 110 mg/dL, HDL: 52 mg/dL",
      normalRange: "Total: < 200, LDL: < 100, HDL: > 40",
      status: "normal",
      date: "2024-01-15",
      orderedBy: "Dr. James Wilson",
      notes: "Within acceptable range. Continue current statin therapy.",
    },
  ];

  const recentVisits = [
    {
      date: "2024-01-15",
      time: "10:30 AM",
      doctor: "Dr. James Wilson",
      type: "Annual Physical",
      reason: "Routine annual examination",
      outcome:
        "Discussed lab work and medication. Scheduled follow-up for 6 months.",
    },
    {
      date: "2023-12-20",
      time: "11:15 AM",
      doctor: "Dr. James Wilson",
      type: "Follow-up",
      reason: "Diabetes management follow-up",
      outcome:
        "Discussed dietary modifications and exercise routine. Patient committed to lifestyle changes.",
    },
    {
      date: "2023-11-05",
      time: "02:30 PM",
      doctor: "Dr. James Wilson",
      type: "Lab Review",
      reason: "Review lab results",
      outcome: "Results reviewed with patient.",
    },
  ];

  const quickStats = [
    { label: "Active Medications", value: "4" },
    { label: "Known Allergies", value: "3" },
    { label: "Recent Lab Tests", value: "6" },
  ];

  const sections = [
    { id: "overview", label: "Overview", icon: ClipboardListIcon },
    { id: "vitals", label: "Vitals", icon: ActivityIcon },
    { id: "medications", label: "Medications", icon: PillIcon },
    { id: "history", label: "History", icon: FileTextIcon },
    { id: "labs", label: "Lab Results", icon: FileTextIcon },
    { id: "visits", label: "Visits", icon: CalendarIcon },
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    // Use setTimeout to ensure the DOM is ready
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Patient Overview
            </h1>
            <p className="text-sm text-muted-foreground">
              Comprehensive patient information for diagnosis and treatment
            </p>
          </div>
          {isDoctor && (
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              asChild
            >
              <Link to={`/consultation/${patientId}`}>
                <VideoIcon className="w-4 h-4 mr-2" />
                Start Consultation
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Navigation Menu */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ClipboardListIcon className="w-4 h-4" />
              Quick Navigation
              <ChevronDownIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {sections.map((section) => (
              <DropdownMenuItem
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="gap-2"
              >
                <section.icon className="w-4 h-4" />

                {section.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "default" : "outline"}
            size="sm"
            onClick={() => scrollToSection(section.id)}
            className="gap-2"
          >
            <section.icon className="w-4 h-4" />

            {section.label}
          </Button>
        ))}
      </div>

      <ScrollArea className="h-[calc(100vh-240px)]">
        <div className="space-y-6 pr-4">
          {/* Patient Info Card */}
          <Card id="overview">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="w-24 h-24 border-4 border-teal-100">
                  <AvatarImage src={patient.avatar} alt={patient.name} />

                  <AvatarFallback>SM</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-foreground">
                          {patient.name}
                        </h2>
                        <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">
                          {patient.id}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {patient.age} years
                        </span>
                        <span className="flex items-center gap-1">
                          <ActivityIcon className="w-4 h-4" />

                          {patient.gender}
                        </span>
                        <span className="flex items-center gap-1">
                          <DropletIcon className="w-4 h-4" />

                          {patient.bloodType}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
                        Primary Condition: {patient.primaryCondition}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <PhoneIcon className="w-4 h-4 text-muted-foreground" />

                      <span className="text-foreground">{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MailIcon className="w-4 h-4 text-muted-foreground" />

                      <span className="text-teal-600">{patient.email}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm md:col-span-2">
                      <MapPinIcon className="w-4 h-4 text-muted-foreground mt-0.5" />

                      <span className="text-foreground">{patient.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Vitals */}
          <div id="vitals">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Current Vitals
              </h3>
              <span className="text-xs text-muted-foreground">
                Last updated: {patient.lastUpdated}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {currentVitals.map((vital, index) => (
                <Card key={index} className="border-l-4 border-l-teal-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`p-2 rounded-lg ${vital.bgColor} ${vital.color}`}
                      >
                        <vital.icon className="w-5 h-5" />
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {vital.status}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {vital.label}
                    </h4>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold text-foreground">
                        {vital.value}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {vital.unit}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                      <div className="bg-teal-500 h-1.5 rounded-full w-3/4"></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {vital.timestamp}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Vitals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Vitals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {additionalVitals.map((vital, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <div
                        className={`p-2 rounded-lg ${vital.bgColor} ${vital.color}`}
                      >
                        <vital.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          {vital.label}
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-foreground">
                            {vital.value}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {vital.unit}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          vital.status === "normal"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                        }
                      >
                        {vital.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Medications */}
          <div id="medications">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Current Medications
              </h3>
              <Button variant="link" className="text-teal-600">
                View All →
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medications.map((med, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <PillIcon className="w-4 h-4 text-blue-600" />

                          <h4 className="font-semibold text-foreground">
                            {med.name}
                          </h4>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {med.dosage}
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        {med.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <ClipboardListIcon className="w-4 h-4 text-muted-foreground mt-0.5" />

                        <span className="text-foreground">{med.frequency}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Prescribed by: {med.prescribedBy}
                      </div>
                      <div className="text-muted-foreground">{med.refills}</div>
                      {med.notes && (
                        <div className="pt-2 text-xs text-muted-foreground italic border-t border-border">
                          Note: {med.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Medical Notes & History */}
          <div id="history">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Medical Notes & History
              </h3>
              <Button variant="link" className="text-teal-600">
                View All →
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {medicalHistory.map((entry, index) => (
                    <div key={index}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-teal-500"></div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <FileTextIcon className="w-4 h-4 text-muted-foreground" />

                                <span className="font-semibold text-foreground">
                                  {entry.doctor}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {entry.date}
                              </p>
                            </div>
                            <Badge variant="outline">{entry.type}</Badge>
                          </div>

                          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                            <p className="text-sm text-foreground">
                              <span className="font-medium">Diagnosis:</span>{" "}
                              {entry.diagnosis}
                            </p>
                            <p className="text-sm text-foreground leading-relaxed">
                              {entry.notes}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Follow-up:</span>{" "}
                              {entry.followUp}
                            </p>
                          </div>
                        </div>
                      </div>
                      {index < medicalHistory.length - 1 && (
                        <Separator className="my-6" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Latest Lab Results */}
          <div id="labs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Latest Lab Results
              </h3>
              <Button variant="link" className="text-teal-600">
                View All →
              </Button>
            </div>

            <div className="space-y-4">
              {patientLabReports.map((lab) => (
                <Card key={lab.reportId}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-teal-50 rounded-lg">
                          <FileTextIcon className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">
                            {lab.reportType}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {lab.category}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-teal-50 text-teal-700 border-teal-200"
                      >
                        {lab.tests.length} Tests
                      </Badge>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Report ID
                          </p>
                          <p className="font-medium">{lab.reportId}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Lab Name</p>
                          <p className="font-medium">{lab.labName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        <span className="font-medium">Date:</span>{" "}
                        {lab.reportedDate} •{" "}
                        <span className="font-medium">Ordered by:</span>{" "}
                        {lab.orderedBy}
                      </div>
                      <div className="flex items-center gap-2">
                        {isDoctor && (
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-2 bg-teal-600 hover:bg-teal-700"
                            onClick={() => handleViewReport(lab)}
                          >
                            <FileTextIcon className="w-4 h-4" />
                            View
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="gap-2">
                          <DownloadIcon className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>

                    {lab.clinicalNotes && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                          {lab.clinicalNotes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Visits */}
          <div id="visits">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Recent Visits
              </h3>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentVisits.map((visit, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <CalendarIcon className="w-5 h-5 text-teal-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground mb-1">
                              {visit.type}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {visit.date} • {visit.time}
                            </p>
                          </div>
                          <Badge variant="outline">{visit.doctor}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-foreground">
                            <span className="font-medium">Reason:</span>{" "}
                            {visit.reason}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">Outcome:</span>{" "}
                            {visit.outcome}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {quickStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className="text-3xl font-bold text-teal-600">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Lab Report Viewer Dialog */}
      <LabReportViewerDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        reportData={selectedReport}
      />
    </div>
  );
}
