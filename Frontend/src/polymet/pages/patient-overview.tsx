import { useState, useEffect } from "react";
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
  Loader2Icon,
} from "lucide-react";
import { LabReportViewerDialog } from "@/polymet/components/lab-report-viewer-dialog";
import { get, post } from "@/lib/api-client";

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  bloodGroup?: string;
  age?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  presentInClinic?: boolean;
  chiefComplaint?: string;
}

interface PatientVitals {
  _id: string;
  patientId: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  recordedAt: string;
  recordedBy?: string;
}

interface Prescription {
  _id: string;
  patientId: string;
  doctorId: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    instructions?: string;
  }>;
  diagnosis?: string;
  notes?: string;
  prescribedAt: string;
  doctorName?: string;
}

interface LabReport {
  _id: string;
  patientId: string;
  reportType: string;
  testName: string;
  result: string;
  unit?: string;
  referenceRange?: string;
  status: string;
  orderedAt: string;
  completedAt?: string;
  doctorName?: string;
}

interface ClinicalNote {
  _id: string;
  patientId: string;
  doctorId: string;
  note: string;
  diagnosis?: string;
  treatment?: string;
  followUp?: string;
  createdAt: string;
  doctorName?: string;
}

interface Appointment {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type?: string;
  reason?: string;
  status: string;
  doctorName?: string;
}

export function PatientOverview() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<PatientVitals[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lab report viewer state
  const [labReportViewerOpen, setLabReportViewerOpen] = useState(false);
  const [selectedLabReport, setSelectedLabReport] = useState<any>(null);

  // Fetch patient data on component mount
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch patient details
        const patientResponse = await get<Patient>(`/api/patients/${patientId}`);
        if (patientResponse.success && patientResponse.data) {
          setPatient(patientResponse.data);
        }

        // Fetch patient vitals
        const vitalsResponse = await get<{ vitals: PatientVitals[] }>(`/api/patient-vitals/patient/${patientId}`);
        if (vitalsResponse.success && vitalsResponse.data?.vitals) {
          setVitals(vitalsResponse.data.vitals);
        }

        // Fetch prescriptions
        const prescriptionsResponse = await get<{ prescriptions: Prescription[] }>(`/api/prescriptions?patient_id=${patientId}`);
        if (prescriptionsResponse.success && prescriptionsResponse.data?.prescriptions) {
          setPrescriptions(prescriptionsResponse.data.prescriptions);
        }

        // Fetch lab reports
        const labReportsResponse = await get<{ reports: LabReport[] }>(`/api/lab-reports?patient_id=${patientId}`);
        if (labReportsResponse.success && labReportsResponse.data?.reports) {
          setLabReports(labReportsResponse.data.reports);
        }

        // Fetch clinical notes
        const notesResponse = await get<{ notes: ClinicalNote[] }>(`/api/clinical-notes?patient_id=${patientId}`);
        if (notesResponse.success && notesResponse.data?.notes) {
          setClinicalNotes(notesResponse.data.notes);
        }

        // Fetch appointment history
        const appointmentsResponse = await get<{ data: Appointment[] }>(`/api/appointments?patientId=${patientId}`);
        if (appointmentsResponse.success && appointmentsResponse.data?.data) {
          setAppointments(appointmentsResponse.data.data);
        }

      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load patient data";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  const handleViewLabReport = (reportIndex: number) => {
    if (labReports[reportIndex]) {
      setSelectedLabReport(labReports[reportIndex]);
      setLabReportViewerOpen(true);
    }
  };

  const handleAddVitals = async (vitalsData: Partial<PatientVitals>) => {
    if (!patientId) return;

    try {
      const response = await post("/api/patient-vitals", {
        patientId: patientId,
        ...vitalsData,
      });

      if (response.success) {
        // Refresh vitals data
        const vitalsResponse = await get<{ vitals: PatientVitals[] }>(`/api/patient-vitals/patient/${patientId}`);
        if (vitalsResponse.success && vitalsResponse.data?.vitals) {
          setVitals(vitalsResponse.data.vitals);
        }
      }
    } catch (err) {
      console.error("Failed to add vitals:", err);
    }
  };

  // Get latest vitals for display
  const latestVitals = vitals.length > 0 ? vitals[0] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2Icon className="w-16 h-16 text-[#00C4B3] mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Patient Data</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {error ? "Error Loading Patient" : "Patient Not Found"}
          </h2>
          <p className="text-muted-foreground">
            {error || "The requested patient could not be found."}
          </p>
        </div>
      </div>
    );
  }

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
              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(patient.fullName)}&background=random&color=ffffff&size=96`} alt={patient.fullName} />

              <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white text-2xl">
                {patient.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {patient.fullName}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    patient.presentInClinic
                      ? "bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20"
                      : "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                  }
                >
                  {patient.presentInClinic ? "In Clinic" : "Remote"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="w-4 h-4" />

                  <span>ID: {patient.patientId}</span>
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="lab-results">Lab Results</TabsTrigger>
          <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
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
                {latestVitals ? (
                  <>
                    {latestVitals.bloodPressure && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium text-foreground">Blood Pressure</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {latestVitals.bloodPressure}
                          </span>
                          <Badge className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20">
                            Normal
                          </Badge>
                        </div>
                      </div>
                    )}
                    {latestVitals.heartRate && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium text-foreground">Heart Rate</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {latestVitals.heartRate} bpm
                          </span>
                          <Badge className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20">
                            Normal
                          </Badge>
                        </div>
                      </div>
                    )}
                    {latestVitals.temperature && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium text-foreground">Temperature</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {latestVitals.temperature}°F
                          </span>
                          <Badge className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20">
                            Normal
                          </Badge>
                        </div>
                      </div>
                    )}
                    {latestVitals.weight && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium text-foreground">Weight</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {latestVitals.weight} lbs
                          </span>
                          <Badge className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20">
                            Normal
                          </Badge>
                        </div>
                      </div>
                    )}
                    {latestVitals.height && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium text-foreground">Height</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {latestVitals.height}"
                          </span>
                          <Badge className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20">
                            Normal
                          </Badge>
                        </div>
                      </div>
                    )}
                    {latestVitals.oxygenSaturation && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium text-foreground">Oxygen Saturation</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {latestVitals.oxygenSaturation}%
                          </span>
                          <Badge className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20">
                            Normal
                          </Badge>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <HeartPulseIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No vital signs recorded yet</p>
                  </div>
                )}
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
                  {patient.allergies && patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-[#FF4F6E]/10 text-[#FF4F6E] border-[#FF4F6E]/20"
                        >
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <AlertCircleIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No known allergies</p>
                    </div>
                  )}
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
              {prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions.map((prescription, index) => (
                    <div
                      key={prescription._id}
                      className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {prescription.diagnosis || "Prescription"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(prescription.prescribedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20"
                        >
                          Active
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {prescription.medications.map((med, medIndex) => (
                          <div key={medIndex} className="border-l-2 border-[#00C4B3]/30 pl-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-foreground">{med.name}</p>
                                <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                                  <div>
                                    <span className="text-muted-foreground">Dosage: </span>
                                    <span className="text-foreground font-medium">
                                      {med.dosage}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Frequency: </span>
                                    <span className="text-foreground font-medium">
                                      {med.frequency}
                                    </span>
                                  </div>
                                </div>
                                {med.instructions && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {med.instructions}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Prescribed by: {prescription.doctorName || "Doctor"}
                        </p>
                        {prescription.notes && (
                          <p className="text-xs text-muted-foreground">
                            {prescription.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <PillIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No prescriptions found</p>
                </div>
              )}
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
              {labReports.length === 0 ? (
                <div className="text-center py-8">
                  <FlaskConicalIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />

                  <p className="text-sm text-muted-foreground">
                    No lab results available for this patient
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {labReports.map((report, index) => (
                    <div
                      key={report._id}
                      className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {report.testName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {report.reportType}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ordered: {new Date(report.orderedAt).toLocaleDateString()}
                            {report.completedAt && (
                              <> • Completed: {new Date(report.completedAt).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              report.status === "completed"
                                ? "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                                : report.status === "pending"
                                ? "bg-[#F7B731]/10 text-[#F7B731] border-[#F7B731]/20"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }
                          >
                            {report.status}
                          </Badge>
                          {report.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#00C4B3]/20 text-[#00C4B3] hover:bg-[#00C4B3]/10"
                              onClick={() => handleViewLabReport(index)}
                            >
                              <FileTextIcon className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                      {report.status === "completed" && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Result: {report.result} {report.unit}
                              </p>
                              {report.referenceRange && (
                                <p className="text-xs text-muted-foreground">
                                  Reference: {report.referenceRange}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                            >
                              Normal
                            </Badge>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                        <span>Ordered by: {report.doctorName || "Doctor"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4 mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-[#00C4B3]" />
                Clinical Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clinicalNotes.length > 0 ? (
                <div className="space-y-4">
                  {clinicalNotes.map((note) => (
                    <div
                      key={note._id}
                      className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {note.diagnosis || "Clinical Note"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(note.createdAt).toLocaleDateString()} • {note.doctorName || "Doctor"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20"
                        >
                          Clinical Note
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {note.note}
                          </p>
                        </div>
                        {note.treatment && (
                          <div className="border-l-2 border-[#00C4B3]/30 pl-3">
                            <p className="text-sm font-medium text-foreground mb-1">Treatment Plan:</p>
                            <p className="text-sm text-muted-foreground">{note.treatment}</p>
                          </div>
                        )}
                        {note.followUp && (
                          <div className="border-l-2 border-[#F7B731]/30 pl-3">
                            <p className="text-sm font-medium text-foreground mb-1">Follow-up:</p>
                            <p className="text-sm text-muted-foreground">{note.followUp}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No clinical notes found</p>
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
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {appointment.type || "Consultation"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {appointment.doctorName || "Doctor"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            appointment.status === "completed"
                              ? "bg-[#24B173]/10 text-[#24B173] border-[#24B173]/20"
                              : appointment.status === "scheduled"
                              ? "bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20"
                              : appointment.status === "in-progress"
                              ? "bg-[#F7B731]/10 text-[#F7B731] border-[#F7B731]/20"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                      {appointment.reason && (
                        <p className="text-sm text-muted-foreground">
                          {appointment.reason}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                        <span>Appointment ID: {appointment.appointmentId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No appointments found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
