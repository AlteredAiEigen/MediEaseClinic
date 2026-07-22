import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  XIcon,
  ClockIcon,
  FileTextIcon,
  CheckCircleIcon,
  Loader2Icon,
  EyeIcon,
  SparklesIcon,
} from "lucide-react";
import { get } from "@/lib/api-client";
import { formatSmartRelativeTime } from "@/lib/date";
import { getPendingConsultationUploadsByDoctor } from "@/polymet/utils/pending-consultation-uploads";
import { ConsultationRecordingPlayer } from "@/polymet/components/consultation-recording-player";

interface AppointmentDetails {
  _id?: string;
  appointmentId?: string;
  date?: string;
  time?: string;
  type?: string;
  status?: string;
  consultationNotes?: string;
  consultationSummary?: {
    chiefComplaint?: string;
    assessment?: string;
    plan?: string;
    followUpInstructions?: string;
    differentialDiagnosis?: string;
    clinicalImpression?: string;
  };
  structuredNotes?: {
    chiefComplaint?: string;
    assessment?: string;
    plan?: string;
    followUpInstructions?: string;
    differentialDiagnosis?: string;
    clinicalImpression?: string;
  };
  followUpNotes?: string;
  transcription?: string;
  reason?: string;
  aiRecommendations?: string;
  /** When visit-level AI recommendations were last saved (same as record update if no dedicated field). */
  updatedAt?: string;
  completedAt?: string;
}

interface Recording {
  _id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  status: string;
  transcriptionStatus?: string;
  errorMessage?: string | null;
  fileUrl?: string;
  duration?: number;
  transcription?: string;
  aiProcessing?: {
    notesExtractionStatus?: "pending" | "success" | "failed";
    notesExtractionError?: string | null;
    structuredNotes?: {
      chiefComplaint?: string;
      assessment?: string;
      plan?: string;
      followUpInstructions?: string;
      differentialDiagnosis?: string;
      clinicalImpression?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  patient?: {
    _id: string;
    fullName: string;
    patientId: string;
    age?: string;
    gender?: string;
    phone?: string;
    email?: string;
    insights?: { lastUpdatedAt?: string };
    insightsMeta?: { lastGeneratedAt?: string; status?: string };
  };
  /** Present when API embeds appointment (list endpoint batch-loads to avoid N+1). */
  appointment?: AppointmentDetails;
}

interface ConsultationHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId?: string;
}

function getPatientAiInsightsGeneratedAt(patient?: Recording["patient"]): string | undefined {
  if (!patient) return undefined;
  const raw = patient.insights?.lastUpdatedAt || patient.insightsMeta?.lastGeneratedAt;
  return raw && String(raw).trim() ? String(raw) : undefined;
}

function getRecordingAiExtractionGeneratedAt(recording: Recording): string | undefined {
  const extractionOk =
    recording.aiProcessing?.notesExtractionStatus === "success" ||
    Boolean(recording.aiProcessing?.structuredNotes);
  if (!extractionOk) return undefined;
  return recording.updatedAt;
}

function getVisitAiRecommendationsGeneratedAt(
  appointment?: AppointmentDetails
): string | undefined {
  const text = appointment?.aiRecommendations?.trim();
  if (!text) return undefined;
  return appointment.updatedAt || appointment.completedAt;
}

export function ConsultationHistoryDialog({
  open,
  onOpenChange,
  doctorId,
}: ConsultationHistoryDialogProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  /** Bumps periodically so relative AI timestamps stay fresh while the dialog is open. */
  const [relativeTimeTick, setRelativeTimeTick] = useState(0);

  useEffect(() => {
    if (!open && !selectedRecording) return;
    const id = window.setInterval(() => {
      setRelativeTimeTick((t) => t + 1);
    }, 30000);
    return () => window.clearInterval(id);
  }, [open, selectedRecording]);

  useEffect(() => {
    if (open && doctorId) {
      setPage(1);
      fetchConsultationHistory(1);
    }
  }, [open, doctorId]);

  const fetchConsultationHistory = async (targetPage: number = page) => {
    if (!doctorId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch recordings for this doctor (paged)
      const response = await get(
        `/api/recordings?doctor_id=${doctorId}&limit=${pageSize}&page=${targetPage}`
      );

      if (!response.success) {
        throw new Error(response.message || "Request failed");
      }

      const extractRecordings = (payload: any): Recording[] => {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload as Recording[];
        if (Array.isArray(payload?.data)) return payload.data as Recording[];
        if (Array.isArray(payload?.items)) return payload.items as Recording[];
        if (Array.isArray(payload?.results)) return payload.results as Recording[];
        if (Array.isArray(payload?.recordings)) return payload.recordings as Recording[];
        return [];
      };

      const recordingsPayload: Recording[] = extractRecordings(response.data);
      const totalFromPayload = Number(response.data?.total ?? response.pagination?.total ?? NaN);
      const totalRecords = Number.isFinite(totalFromPayload)
        ? totalFromPayload
        : recordingsPayload.length;
      setTotal(totalRecords);
      setPage(targetPage);

      // Enrich only when API did not embed patient/appointment (legacy). List API batch-loads both.
      const enrichedRecordings = await Promise.all(
        recordingsPayload.map(async (recording: Recording) => {
          if (!recording.patient && (recording as any).patient) {
            recording.patient = (recording as any).patient;
          }

          if (!recording.patient && recording.patientId) {
            try {
              const isObjectId = /^[0-9a-fA-F]{24}$/.test(recording.patientId);
              let patientFetched = false;

              if (isObjectId) {
                try {
                  const patientResponse = await get(`/api/patients/${recording.patientId}`);
                  if (patientResponse.success && patientResponse.data?.patient) {
                    recording.patient = patientResponse.data.patient;
                    patientFetched = true;
                  }
                } catch (err) {
                  console.warn(
                    `Could not fetch patient by ObjectId ${recording.patientId}, trying patient-id:`,
                    err
                  );
                }
              }

              if (!patientFetched) {
                try {
                  const patientByIdResponse = await get(`/api/patients/patient-id/${recording.patientId}`);
                  if (patientByIdResponse.success && patientByIdResponse.data?.patient) {
                    recording.patient = patientByIdResponse.data.patient;
                    patientFetched = true;
                  }
                } catch (err) {
                  console.warn(`Could not fetch patient by patientId ${recording.patientId}:`, err);
                }
              }

              if (!patientFetched && isObjectId) {
                try {
                  const patientByIdResponse = await get(`/api/patients/patient-id/${recording.patientId}`);
                  if (patientByIdResponse.success && patientByIdResponse.data?.patient) {
                    recording.patient = patientByIdResponse.data.patient;
                  }
                } catch (err) {
                  console.warn(
                    `Could not fetch patient by patientId (fallback) ${recording.patientId}:`,
                    err
                  );
                }
              }
            } catch (err) {
              console.warn(`Error fetching patient details for ${recording.patientId}:`, err);
            }
          }

          if (!recording.patient && (recording as any).patientName) {
            recording.patient = {
              _id: recording.patientId,
              patientId: recording.patientId,
              fullName: (recording as any).patientName,
            };
          }

          if (recording.appointmentId && !recording.appointment) {
            try {
              const appointmentResponse = await get(`/api/appointments/${recording.appointmentId}`);
              const appointmentPayload =
                appointmentResponse.data?.appointment ?? appointmentResponse.data;
              if (appointmentResponse.success && appointmentPayload) {
                recording.appointment = appointmentPayload as AppointmentDetails;
              }
            } catch (err) {
              console.warn(`Could not fetch appointment ${recording.appointmentId}:`, err);
            }
          }

          return recording;
        })
      );

      const sortedRecordings = enrichedRecordings.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const pendingUploads = doctorId
        ? getPendingConsultationUploadsByDoctor(doctorId)
        : [];

      const pendingRecordings: Recording[] = pendingUploads.map((pending) => {
        const status = pending.status === "error" ? "error" : "uploading";
        return {
          _id: pending.id,
          patientId: pending.patientId,
          doctorId: pending.doctorId,
          appointmentId: pending.appointmentId,
          status,
          createdAt: pending.createdAt,
          updatedAt: pending.updatedAt,
          patient: {
            _id: pending.patientId,
            fullName: pending.patientName || "Patient",
            patientId: pending.patientFriendlyId || pending.patientId,
          },
          appointment:
            pending.appointmentId || pending.appointmentType || pending.appointmentDate || pending.appointmentTime
              ? {
                  appointmentId: pending.appointmentId,
                  type: pending.appointmentType,
                  date: pending.appointmentDate,
                  time: pending.appointmentTime,
                  status: status === "error" ? "Upload Failed" : "Uploading Recording",
                  followUpNotes: pending.errorMessage,
                }
              : undefined,
        };
      });

      const combinedRecordings = [...pendingRecordings, ...sortedRecordings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRecordings(combinedRecordings);
    } catch (err) {
      console.error("Error fetching consultation history:", err);
      setError("Failed to load consultation history");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeOnly = (timeString?: string) => {
    if (!timeString) return "N/A";
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <span className="hidden" aria-hidden>
        {relativeTimeTick}
      </span>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5 text-blue-600" />
              Consultation History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2Icon className="w-6 h-6 animate-spin mr-2" />
                <span>Loading consultation history...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p>{error}</p>
              </div>
            ) : recordings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No consultation recordings found</p>
              </div>
            ) : (
              <div className="space-y-3">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {recordings.map((recording) => {
                    const summaryNotes =
                      recording.aiProcessing?.structuredNotes ||
                      recording.appointment?.consultationSummary ||
                      recording.appointment?.structuredNotes;
                    const hasTranscription = Boolean(
                      recording.transcription || recording.appointment?.transcription
                    );
                    const appointmentInfo = recording.appointment;
                    const extractionStatus =
                      recording.aiProcessing?.notesExtractionStatus ||
                      (recording.aiProcessing?.structuredNotes ? "success" : undefined);
                    const isTerminalNoContent =
                      recording.transcriptionStatus === "empty" || recording.status === "error";
                    const extractionLabel =
                      extractionStatus === "success"
                        ? "AI Extraction Success"
                        : extractionStatus === "failed"
                        ? "AI Extraction Failed"
                        : !isTerminalNoContent &&
                          (hasTranscription || recording.status === "processed")
                        ? "AI Extraction Pending"
                        : null;
                    const extractionBadgeClass =
                      extractionStatus === "success"
                        ? "text-xs bg-green-50 text-green-700"
                        : extractionStatus === "failed"
                        ? "text-xs bg-red-50 text-red-700"
                        : "text-xs bg-amber-50 text-amber-700";

                    return (
                      <Card key={recording._id} className="border-border shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <Avatar className="w-12 h-12 border-2 border-background">
                                <AvatarImage
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    recording.patient?.fullName || "Unknown Patient"
                                  )}&background=random&color=ffffff&size=48`}
                                  alt={recording.patient?.fullName || "Unknown Patient"}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                                  {(recording.patient?.fullName || "Unknown Patient")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="space-y-2">
                                <div>
                                  <h4 className="font-semibold text-foreground">
                                    {recording.patient?.fullName || "Unknown Patient"}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    ID: {recording.patient?.patientId || recording.patientId} •{" "}
                                    {recording.patient?.age && `${recording.patient.age} years • `}
                                    {recording.patient?.gender}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>{formatDateTime(recording.createdAt)}</span>
                                  </div>
                                  {recording.duration && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <span>Duration: {formatDuration(recording.duration)}</span>
                                    </div>
                                  )}
                                  {appointmentInfo?.date && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <span>
                                        Consultation: {formatDateOnly(appointmentInfo.date)} •{" "}
                                        {formatTimeOnly(appointmentInfo.time)}
                                      </span>
                                    </div>
                                  )}
                                  {appointmentInfo?.type && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <span>{appointmentInfo.type}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant={recording.status === "processed" ? "default" : "secondary"}
                                    className={
                                      recording.transcriptionStatus === "empty"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                        : recording.status === "processed"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : recording.status === "error"
                                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    }
                                  >
                                    {recording.transcriptionStatus === "empty" ? (
                                      <>
                                        <ClockIcon className="w-3 h-3 mr-1" />
                                        Nothing to transcribe
                                      </>
                                    ) : recording.status === "processed" ? (
                                      <>
                                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                                        Completed
                                      </>
                                    ) : recording.status === "error" ? (
                                      <>
                                        <XIcon className="w-3 h-3 mr-1" />
                                        Failed
                                      </>
                                    ) : recording.status === "uploading" ? (
                                      <>
                                        <Loader2Icon className="w-3 h-3 mr-1 animate-spin" />
                                        Uploading…
                                      </>
                                    ) : (
                                      <>
                                        <ClockIcon className="w-3 h-3 mr-1" />
                                        {recording.status}
                                      </>
                                    )}
                                  </Badge>

                                  {appointmentInfo?.status && (
                                    <Badge variant="outline" className="text-xs">
                                      {appointmentInfo.status}
                                    </Badge>
                                  )}

                                  {hasTranscription && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                      Has Transcription
                                    </Badge>
                                  )}
                                  {extractionLabel && (
                                    <Badge variant="outline" className={extractionBadgeClass}>
                                      {extractionLabel}
                                    </Badge>
                                  )}
                                </div>

                                {(() => {
                                  const insightsAt = getPatientAiInsightsGeneratedAt(
                                    recording.patient
                                  );
                                  const extractionAt = getRecordingAiExtractionGeneratedAt(recording);
                                  const recAt = getVisitAiRecommendationsGeneratedAt(appointmentInfo);
                                  if (!insightsAt && !extractionAt && !recAt) return null;
                                  return (
                                    <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground border-l-2 border-primary/25 pl-3 py-1">
                                      {insightsAt && (
                                        <div className="flex items-start gap-1.5">
                                          <SparklesIcon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-violet-500" />
                                          <span>
                                            <span className="font-medium text-foreground/85">
                                              Patient AI insights
                                            </span>
                                            {" · "}
                                            {formatSmartRelativeTime(insightsAt)}
                                          </span>
                                        </div>
                                      )}
                                      {extractionAt && (
                                        <div className="flex items-start gap-1.5">
                                          <SparklesIcon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                                          <span>
                                            <span className="font-medium text-foreground/85">
                                              AI clinical summary (extraction)
                                            </span>
                                            {" · "}
                                            {formatSmartRelativeTime(extractionAt)}
                                          </span>
                                        </div>
                                      )}
                                      {recAt && (
                                        <div className="flex items-start gap-1.5">
                                          <SparklesIcon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-600" />
                                          <span>
                                            <span className="font-medium text-foreground/85">
                                              Visit AI recommendations
                                            </span>
                                            {" · "}
                                            {formatSmartRelativeTime(recAt)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                {summaryNotes ? (
                                  <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                                    <h5 className="text-sm font-medium mb-1">Consultation Summary</h5>
                                    {typeof summaryNotes === "object" ? (
                                      <div className="space-y-1">
                                        {summaryNotes.chiefComplaint && (
                                          <div>
                                            <span className="font-medium">Chief Complaint:</span>{" "}
                                            {summaryNotes.chiefComplaint}
                                          </div>
                                        )}
                                        {summaryNotes.assessment && (
                                          <div>
                                            <span className="font-medium">Assessment:</span>{" "}
                                            {summaryNotes.assessment}
                                          </div>
                                        )}
                                        {summaryNotes.plan && (
                                          <div>
                                            <span className="font-medium">Plan:</span>{" "}
                                            {summaryNotes.plan}
                                          </div>
                                        )}
                                        {summaryNotes.followUpInstructions && (
                                          <div>
                                            <span className="font-medium">Follow-up:</span>{" "}
                                            {summaryNotes.followUpInstructions}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="whitespace-pre-wrap leading-relaxed">{String(summaryNotes)}</p>
                                    )}
                                  </div>
                                ) : extractionLabel ? (
                                  <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                    <span>{extractionLabel}</span>
                                  </div>
                                ) : null}
                                {isTerminalNoContent && !summaryNotes && !extractionLabel && (
                                  <p className="mt-3 text-sm text-muted-foreground">
                                    {recording.transcriptionStatus === "empty"
                                      ? "No speech detected — nothing to transcribe."
                                      : "Transcription or extraction failed."}
                                  </p>
                                )}

                                {recording.transcriptionStatus === "empty" && (recording.errorMessage || recording.appointment?.followUpNotes) && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400">
                                    {recording.errorMessage || recording.appointment?.followUpNotes}
                                  </p>
                                )}
                                {recording.status === "error" && recording.appointment?.followUpNotes && (
                                  <p className="text-xs text-red-600">
                                    {recording.appointment.followUpNotes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <ConsultationRecordingPlayer
                              recordingMongoId={recording._id}
                              expectedDuration={recording.duration}
                              compact
                            />

                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRecording(recording)}
                                className="gap-2"
                              >
                                <EyeIcon className="w-4 h-4" />
                                View Details
                              </Button>
                              {/* HIPAA: Patient profile link removed; details are visible only during active consultation */}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                </ScrollArea>
                <div className="flex items-center justify-between pt-3">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {Math.max(1, Math.ceil(total / pageSize))} • {total} total
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || isLoading}
                      onClick={() => fetchConsultationHistory(Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= Math.ceil(total / pageSize) || isLoading}
                      onClick={() => fetchConsultationHistory(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detailed Recording View Dialog */}
      {selectedRecording && (
        <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-blue-600" />
                Recording Details - {selectedRecording.patient?.fullName || "Unknown Patient"}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="h-[600px]">
              <div className="space-y-6">
                {/* Patient Info */}
                {selectedRecording.patient && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Patient Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Name:</span> {selectedRecording.patient.fullName}
                        </div>
                        <div>
                          <span className="font-medium">Patient ID:</span> {selectedRecording.patient.patientId}
                        </div>
                        <div>
                          <span className="font-medium">Age:</span> {selectedRecording.patient.age || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Gender:</span> {selectedRecording.patient.gender || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {selectedRecording.patient.phone || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {selectedRecording.patient.email || "N/A"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedRecording.appointment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Appointment Snapshot</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Date &amp; Time:</span>
                          <p className="mt-1">
                            {formatDateOnly(selectedRecording.appointment.date)} •{" "}
                            {formatTimeOnly(selectedRecording.appointment.time)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>
                          <p className="mt-1">{selectedRecording.appointment.type || "N/A"}</p>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <div className="mt-1">
                            <Badge variant="outline" className="uppercase tracking-wide text-xs">
                              {selectedRecording.appointment.status || "Unknown"}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Reason:</span>
                          <p className="mt-1">{selectedRecording.appointment.reason || "—"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(() => {
                  const insightsAt = getPatientAiInsightsGeneratedAt(selectedRecording.patient);
                  const extractionAt = getRecordingAiExtractionGeneratedAt(selectedRecording);
                  const recAt = getVisitAiRecommendationsGeneratedAt(selectedRecording.appointment);
                  if (!insightsAt && !extractionAt && !recAt) return null;
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-violet-500" />
                          AI generation times
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {insightsAt && (
                          <div>
                            <span className="font-medium">Patient AI insights</span>
                            <p className="text-muted-foreground mt-0.5">
                              {formatSmartRelativeTime(insightsAt)}
                            </p>
                          </div>
                        )}
                        {extractionAt && (
                          <div>
                            <span className="font-medium">AI clinical summary (extraction)</span>
                            <p className="text-muted-foreground mt-0.5">
                              {formatSmartRelativeTime(extractionAt)}
                            </p>
                          </div>
                        )}
                        {recAt && (
                          <div>
                            <span className="font-medium">Visit AI recommendations</span>
                            <p className="text-muted-foreground mt-0.5">
                              {formatSmartRelativeTime(recAt)}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Recording Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recording Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Created:</span> {formatDateTime(selectedRecording.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {formatDuration(selectedRecording.duration)}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        <Badge
                          variant={selectedRecording.status === "processed" ? "default" : "secondary"}
                          className={
                            selectedRecording.transcriptionStatus === "empty"
                              ? "bg-amber-100 text-amber-800"
                              : selectedRecording.status === "processed"
                              ? "bg-green-100 text-green-800"
                              : selectedRecording.status === "error"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {selectedRecording.transcriptionStatus === "empty" ? (
                            <>
                              <ClockIcon className="w-3 h-3 mr-1" />
                              Nothing to transcribe
                            </>
                          ) : selectedRecording.status === "processed" ? (
                            <>
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Completed
                            </>
                          ) : selectedRecording.status === "error" ? (
                            <>
                              <XIcon className="w-3 h-3 mr-1" />
                              Failed
                            </>
                          ) : selectedRecording.status === "uploading" ? (
                            <>
                              <Loader2Icon className="w-3 h-3 mr-1 animate-spin" />
                              Uploading…
                            </>
                          ) : (
                            <>
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {selectedRecording.status}
                            </>
                          )}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Patient ID:</span> {selectedRecording.patientId}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">AI Extraction:</span>
                        {(() => {
                          const extractionStatus =
                            selectedRecording.aiProcessing?.notesExtractionStatus ||
                            (selectedRecording.aiProcessing?.structuredNotes ? "success" : undefined);
                          const isTerminalNoContent =
                            selectedRecording.transcriptionStatus === "empty" ||
                            selectedRecording.status === "error";
                          const extractionLabel =
                            extractionStatus === "success"
                              ? "AI Extraction Success"
                              : extractionStatus === "failed"
                              ? "AI Extraction Failed"
                              : isTerminalNoContent
                              ? null
                              : selectedRecording.transcription || selectedRecording.appointment?.transcription
                              ? "AI Extraction Pending"
                              : null;
                          const className =
                            extractionStatus === "success"
                              ? "text-xs bg-green-50 text-green-700"
                              : extractionStatus === "failed"
                              ? "text-xs bg-red-50 text-red-700"
                              : "text-xs bg-amber-50 text-amber-700";

                          if (!extractionLabel) {
                            return (
                              <span className="text-sm text-muted-foreground">
                                {isTerminalNoContent
                                  ? selectedRecording.transcriptionStatus === "empty"
                                    ? "Nothing to transcribe"
                                    : "Failed"
                                  : "Not started"}
                              </span>
                            );
                          }

                          return (
                            <Badge variant="outline" className={className}>
                              {extractionLabel}
                            </Badge>
                          );
                        })()}
                      </div>
                      {selectedRecording.aiProcessing?.notesExtractionStatus === "failed" &&
                        selectedRecording.aiProcessing?.notesExtractionError && (
                          <div className="col-span-2 text-xs text-red-600">
                            {selectedRecording.aiProcessing.notesExtractionError}
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Original recording</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ConsultationRecordingPlayer
                      recordingMongoId={selectedRecording._id}
                      recordingLabel="Play, pause, and skip through the consultation audio"
                      expectedDuration={selectedRecording.duration}
                      lazy={false}
                    />
                  </CardContent>
                </Card>

                {/* AI Processing Results / Structured Notes */}
                {(() => {
                  const structured =
                    selectedRecording.aiProcessing?.structuredNotes ||
                    selectedRecording.appointment?.structuredNotes ||
                    selectedRecording.appointment?.consultationSummary;
                  const extractionStatus =
                    selectedRecording.aiProcessing?.notesExtractionStatus ||
                    (selectedRecording.aiProcessing?.structuredNotes ? "success" : undefined);
                  const extractionError = selectedRecording.aiProcessing?.notesExtractionError;
                  const isTerminalNoContent =
                    selectedRecording.transcriptionStatus === "empty" ||
                    selectedRecording.status === "error";
                  const extractionLabel =
                    extractionStatus === "success"
                      ? "AI extraction complete"
                      : extractionStatus === "failed"
                      ? "AI extraction failed"
                      : isTerminalNoContent
                      ? selectedRecording.transcriptionStatus === "empty"
                        ? "No speech detected — nothing to transcribe."
                        : "Transcription or extraction failed."
                      : "AI extraction pending";

                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Clinical Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        {structured ? (
                          <>
                            {structured.chiefComplaint && (
                              <div>
                                <span className="font-medium">Chief Complaint:</span>
                                <p className="mt-1">{structured.chiefComplaint}</p>
                              </div>
                            )}
                            {structured.assessment && (
                              <div>
                                <span className="font-medium">Assessment:</span>
                                <p className="mt-1">{structured.assessment}</p>
                              </div>
                            )}
                            {structured.plan && (
                              <div>
                                <span className="font-medium">Plan:</span>
                                <p className="mt-1">{structured.plan}</p>
                              </div>
                            )}
                            {structured.followUpInstructions && (
                              <div>
                                <span className="font-medium">Follow-up Instructions:</span>
                                <p className="mt-1">{structured.followUpInstructions}</p>
                              </div>
                            )}
                            {structured.differentialDiagnosis && (
                              <div>
                                <span className="font-medium">Differential Diagnosis:</span>
                                <p className="mt-1">{structured.differentialDiagnosis}</p>
                              </div>
                            )}
                            {structured.clinicalImpression && (
                              <div>
                                <span className="font-medium">Clinical Impression:</span>
                                <p className="mt-1">{structured.clinicalImpression}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {extractionStatus === "failed" || isTerminalNoContent ? (
                              <XIcon className="w-4 h-4 text-red-500 shrink-0" />
                            ) : (
                              <Loader2Icon className="w-4 h-4 animate-spin shrink-0" />
                            )}
                            <span>{extractionLabel}</span>
                          </div>
                        )}

                        {extractionStatus === "failed" && extractionError && (
                          <div className="text-xs text-red-600">{extractionError}</div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {selectedRecording.appointment?.consultationNotes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Consultation Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 border rounded-lg p-4 bg-muted/30">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>
                            {selectedRecording.appointment.consultationNotes}
                          </ReactMarkdown>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {selectedRecording.appointment?.followUpNotes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Follow-up Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedRecording.appointment.followUpNotes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Transcription */}
                {(() => {
                  const transcription =
                    selectedRecording.transcription || selectedRecording.appointment?.transcription;
                  const isEmpty = selectedRecording.transcriptionStatus === "empty";
                  const isFailed = selectedRecording.status === "error";
                  const statusLabel =
                    isEmpty
                      ? "Nothing to transcribe"
                      : isFailed
                      ? "Transcription failed"
                      : selectedRecording.status === "processed"
                      ? "Transcription pending"
                      : "Recording is still being processed...";

                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Full Transcription</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {transcription ? (
                          <ScrollArea className="h-96 border rounded-lg p-4 bg-muted/30">
                            <pre className="text-sm whitespace-pre-wrap leading-relaxed">{transcription}</pre>
                          </ScrollArea>
                        ) : (
                          <div className="p-6 text-center text-muted-foreground space-y-2">
                            {isFailed ? (
                              <XIcon className="w-10 h-10 mx-auto text-red-500" />
                            ) : isEmpty ? (
                              <FileTextIcon className="w-10 h-10 mx-auto opacity-50" />
                            ) : (
                              <Loader2Icon className="w-12 h-12 mx-auto opacity-50 animate-spin" />
                            )}
                            <p>{statusLabel}</p>
                            {isEmpty && selectedRecording.errorMessage && (
                              <p className="text-sm">{selectedRecording.errorMessage}</p>
                            )}
                            {selectedRecording.status && !isEmpty && (
                              <p className="text-sm">Status: {selectedRecording.status}</p>
                            )}
                            {selectedRecording.aiProcessing?.notesExtractionError && isFailed && (
                              <p className="text-xs text-red-600">
                                {selectedRecording.aiProcessing.notesExtractionError}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
