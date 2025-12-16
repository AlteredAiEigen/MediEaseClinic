import ReactMarkdown from "react-markdown";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  FileTextIcon,
  PillIcon,
  HeartPulseIcon,
  AlertCircleIcon,
  StethoscopeIcon,
  ClipboardListIcon,
  ActivityIcon,
  CheckCircleIcon,
  SparklesIcon,
  ExternalLinkIcon,
  DownloadIcon,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { get } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

interface StructuredNotes {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  reviewOfSystems?: string;
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
  medications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
  allergies?: string[];
  followUpInstructions?: string;
  differentialDiagnosis?: string[];
  clinicalImpression?: string;
}

interface PatientUpdate {
  field: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
}

interface PatientProfileUpdates {
  fieldsUpdated?: string[];
  medicationsAdded?: Array<{name: string; dosage?: string; duration?: string}>;
  allergiesAdded?: string[];
  chiefComplaintAdded?: string;
  assessmentAdded?: string;
  planAdded?: string;
  followUpAdded?: string;
  historyOfPresentIllnessAdded?: string;
  lastVisitUpdated?: string;
  timestamp?: string;
}

interface AppointmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    _id?: string;
    appointmentId?: string;
    date?: string;
    time?: string;
    status?: string;
    reason?: string;
    doctorName?: string;
    patientName?: string;
    diagnosis?: string;
    treatmentPlan?: string;
    followUpInstructions?: string;
    prescriptionFileUrl?: string;
    prescriptionFileName?: string;
    structuredNotes?: StructuredNotes;
    consultationNotes?: string;
    transcription?: string;
    consultationSummary?: {
      chiefComplaint?: string;
      assessment?: string;
      plan?: string;
    };
    patientProfileUpdates?: PatientProfileUpdates;
  } | null;
}

export function AppointmentDetailsDialog({
  open,
  onOpenChange,
  appointment,
}: AppointmentDetailsDialogProps) {
  const { toast } = useToast();
  const [isLoadingPresignedUrl, setIsLoadingPresignedUrl] = useState(false);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);

  if (!appointment) return null;

  const handleViewFile = async () => {
    if (!appointment._id || !appointment.appointmentId) {
      toast({
        title: "Error",
        description: "Appointment ID is missing",
        variant: "destructive",
      });
      return;
    }

    // If we already have a presigned URL, use it
    if (presignedUrl) {
      window.open(presignedUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setIsLoadingPresignedUrl(true);
    try {
      const appointmentId = appointment._id || appointment.appointmentId;
      const response = await get(
        `/api/appointments/${appointmentId}/prescription/presigned-url`
      );

      if (response.success && response.data?.presignedUrl) {
        const url = response.data.presignedUrl;
        setPresignedUrl(url);
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to generate file access URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error getting presigned URL:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to access file",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPresignedUrl(false);
    }
  };

  const structuredNotes = appointment.structuredNotes;
  const consultationSummary = appointment.consultationSummary;
  const profileUpdates = appointment.patientProfileUpdates;

  // Determine what was updated in patient profile from this appointment
  // Prefer stored patientProfileUpdates (from MongoDB) over deriving from structuredNotes
  const patientUpdates: PatientUpdate[] = [];

  // Use stored patientProfileUpdates if available (accurate tracking from backend)
  if (profileUpdates && profileUpdates.fieldsUpdated && profileUpdates.fieldsUpdated.length > 0) {
    // Medications added (from stored tracking)
    if (profileUpdates.medicationsAdded && profileUpdates.medicationsAdded.length > 0) {
      profileUpdates.medicationsAdded.forEach((med) => {
        patientUpdates.push({
          field: "medication",
          label: "Medication Added",
          value: `${med.name}${med.dosage ? ` - ${med.dosage}` : ""}${med.duration ? ` (${med.duration})` : ""}`,
          icon: <PillIcon className="w-3.5 h-3.5" />,
          colorClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700",
        });
      });
    }

    // Allergies added (from stored tracking)
    if (profileUpdates.allergiesAdded && profileUpdates.allergiesAdded.length > 0) {
      profileUpdates.allergiesAdded.forEach((allergy) => {
        patientUpdates.push({
          field: "allergy",
          label: "Allergy Added",
          value: allergy,
          icon: <AlertCircleIcon className="w-3.5 h-3.5" />,
          colorClass: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700",
        });
      });
    }

    // Chief complaint (from stored tracking)
    if (profileUpdates.chiefComplaintAdded) {
      patientUpdates.push({
        field: "chiefComplaint",
        label: "Chief Complaint Updated",
        value: profileUpdates.chiefComplaintAdded,
        icon: <StethoscopeIcon className="w-3.5 h-3.5" />,
        colorClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
      });
    }

    // Assessment/Condition (from stored tracking)
    if (profileUpdates.assessmentAdded) {
      patientUpdates.push({
        field: "condition",
        label: "Condition Updated",
        value: profileUpdates.assessmentAdded,
        icon: <FileTextIcon className="w-3.5 h-3.5" />,
        colorClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
      });
    }

    // Care Plan (from stored tracking)
    if (profileUpdates.planAdded) {
      patientUpdates.push({
        field: "carePlanSummary",
        label: "Care Plan Updated",
        value: profileUpdates.planAdded,
        icon: <ClipboardListIcon className="w-3.5 h-3.5" />,
        colorClass: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700",
      });
    }

    // Follow-up instructions (from stored tracking)
    if (profileUpdates.followUpAdded) {
      patientUpdates.push({
        field: "followUpPlan",
        label: "Follow-up Plan Updated",
        value: profileUpdates.followUpAdded,
        icon: <CalendarIcon className="w-3.5 h-3.5" />,
        colorClass: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700",
      });
    }

    // History of present illness / current symptoms (from stored tracking)
    if (profileUpdates.historyOfPresentIllnessAdded) {
      patientUpdates.push({
        field: "currentSymptoms",
        label: "Current Symptoms Updated",
        value: profileUpdates.historyOfPresentIllnessAdded,
        icon: <HeartPulseIcon className="w-3.5 h-3.5" />,
        colorClass: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700",
      });
    }
  } else {
    // Fallback: derive from structuredNotes if patientProfileUpdates not available
    // Check for medications added
    if (structuredNotes?.medications && structuredNotes.medications.length > 0) {
      structuredNotes.medications.forEach((med) => {
        patientUpdates.push({
          field: "medication",
          label: "Medication Added",
          value: `${med.name}${med.dosage ? ` - ${med.dosage}` : ""}${med.frequency ? ` (${med.frequency})` : ""}`,
          icon: <PillIcon className="w-3.5 h-3.5" />,
          colorClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700",
        });
      });
    }

    // Check for allergies
    if (structuredNotes?.allergies && structuredNotes.allergies.length > 0) {
      structuredNotes.allergies.forEach((allergy) => {
        patientUpdates.push({
          field: "allergy",
          label: "Allergy Recorded",
          value: allergy,
          icon: <AlertCircleIcon className="w-3.5 h-3.5" />,
          colorClass: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700",
        });
      });
    }

    // Chief complaint update
    if (structuredNotes?.chiefComplaint || consultationSummary?.chiefComplaint) {
      patientUpdates.push({
        field: "chiefComplaint",
        label: "Chief Complaint",
        value: structuredNotes?.chiefComplaint || consultationSummary?.chiefComplaint || "",
        icon: <StethoscopeIcon className="w-3.5 h-3.5" />,
        colorClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
      });
    }

    // Diagnosis
    if (appointment.diagnosis || structuredNotes?.assessment) {
      patientUpdates.push({
        field: "diagnosis",
        label: "Diagnosis/Assessment",
        value: appointment.diagnosis || structuredNotes?.assessment || "",
        icon: <FileTextIcon className="w-3.5 h-3.5" />,
        colorClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
      });
    }

    // Treatment plan
    if (appointment.treatmentPlan || structuredNotes?.plan) {
      patientUpdates.push({
        field: "treatmentPlan",
        label: "Treatment Plan",
        value: appointment.treatmentPlan || structuredNotes?.plan || "",
        icon: <ClipboardListIcon className="w-3.5 h-3.5" />,
        colorClass: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700",
      });
    }

    // Follow-up instructions (fallback path)
    if (appointment.followUpInstructions || structuredNotes?.followUpInstructions) {
      patientUpdates.push({
        field: "followUp",
        label: "Follow-up Instructions",
        value: appointment.followUpInstructions || structuredNotes?.followUpInstructions || "",
        icon: <CalendarIcon className="w-3.5 h-3.5" />,
        colorClass: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700",
      });
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not specified";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
      case "scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700";
      case "in-progress":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="w-5 h-5 text-[#00C4B3]" />
              Appointment Details
            </DialogTitle>
            <Badge className={`${getStatusColor(appointment.status)} border`}>
              {appointment.status || "Unknown"}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto px-6">
          <div className="space-y-6 py-4 pb-6">
            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">Date</span>
                  </div>
                  <p className="text-sm font-semibold">{formatDate(appointment.date)}</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">Time</span>
                  </div>
                  <p className="text-sm font-semibold">{appointment.time || "Not specified"}</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">Doctor</span>
                  </div>
                  <p className="text-sm font-semibold">{appointment.doctorName || "Not assigned"}</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <StethoscopeIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">Reason</span>
                  </div>
                  <p className="text-sm font-semibold line-clamp-2">
                    {appointment.reason || "General Consultation"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Prescription File Section */}
            {appointment.prescriptionFileUrl && (
              <Card className="border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PillIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                      Prescription File
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-foreground flex-1 truncate">
                      {appointment.prescriptionFileName || "Prescription File"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewFile}
                      disabled={isLoadingPresignedUrl}
                      className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                    >
                      {isLoadingPresignedUrl ? (
                        <>
                          <Loader2Icon className="w-3.5 h-3.5 animate-spin mr-1" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ExternalLinkIcon className="w-3.5 h-3.5 mr-1" />
                          View File
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chief Complaint */}
            {(structuredNotes?.chiefComplaint || consultationSummary?.chiefComplaint) && (
              <Card className="border-[#00C4B3]/30 bg-[#00C4B3]/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HeartPulseIcon className="w-4 h-4 text-[#00C4B3]" />
                    <span className="text-sm font-semibold text-[#00C4B3]">Chief Complaint</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {structuredNotes?.chiefComplaint || consultationSummary?.chiefComplaint}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Clinical Summary */}
            {structuredNotes?.historyOfPresentIllness && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileTextIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold">History of Present Illness</span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    <ReactMarkdown>
                      {structuredNotes.historyOfPresentIllness}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assessment & Plan */}
            {(structuredNotes?.assessment || structuredNotes?.plan) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {structuredNotes?.assessment && (
                  <Card className="border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ActivityIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Assessment</span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-amber-900 dark:text-amber-100">
                        <ReactMarkdown>
                          {structuredNotes.assessment}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {structuredNotes?.plan && (
                  <Card className="border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardListIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-300">Plan</span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-green-900 dark:text-green-100">
                        <ReactMarkdown>
                          {structuredNotes.plan}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Patient Profile Updates Section */}
            {patientUpdates.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-4">
                  <SparklesIcon className="w-5 h-5 text-[#00C4B3]" />
                  <h3 className="text-sm font-semibold">
                    Patient Profile Updates from this Appointment
                  </h3>
                  <Badge variant="outline" className="text-xs bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/30">
                    {patientUpdates.length} updates
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {patientUpdates.map((update, index) => (
                    <div
                      key={`${update.field}-${index}`}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${update.colorClass} transition-all hover:shadow-sm`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {update.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {update.label}
                          </span>
                          <CheckCircleIcon className="w-3 h-3 opacity-60" />
                        </div>
                        <p className="text-xs leading-relaxed line-clamp-2">
                          {update.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No updates message */}
            {patientUpdates.length === 0 && !structuredNotes && (
              <Card className="border-dashed border-2 border-muted">
                <CardContent className="p-6 text-center">
                  <FileTextIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No clinical notes or patient updates recorded for this appointment.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Bottom spacing to ensure scrollability */}
            <div className="h-4" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

