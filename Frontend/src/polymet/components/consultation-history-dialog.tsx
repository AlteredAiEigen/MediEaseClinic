import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  UserIcon,
  CheckCircleIcon,
  Loader2Icon,
  EyeIcon,
} from "lucide-react";
import { get } from "@/lib/api-client";
import { getPendingConsultationUploadsByDoctor } from "@/polymet/utils/pending-consultation-uploads";

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
}

interface Recording {
  _id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  status: string;
  fileUrl?: string;
  duration?: number;
  transcription?: string;
  aiProcessing?: {
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
  };
  appointment?: AppointmentDetails;
}

interface ConsultationHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId?: string;
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

  useEffect(() => {
    if (open && doctorId) {
      fetchConsultationHistory();
    }
  }, [open, doctorId]);

  const fetchConsultationHistory = async () => {
    if (!doctorId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch recordings for this doctor (all consultations)
      const pageSize = 100;
      const response = await get(`/api/recordings?doctor_id=${doctorId}&limit=${pageSize}`);

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

      let recordingsPayload: Recording[] = extractRecordings(response.data);

      const totalFromPayload = Number(response.data?.total ?? response.pagination?.total ?? NaN);
      const total = Number.isFinite(totalFromPayload) ? totalFromPayload : recordingsPayload.length;
      const limitFromPayload = Number(response.data?.limit ?? response.pagination?.limit ?? pageSize);
      const effectiveLimit = limitFromPayload > 0 ? Math.min(limitFromPayload, pageSize) : pageSize;
      const hasMore = total > recordingsPayload.length;

      if (hasMore) {
        const pages = Math.ceil(total / effectiveLimit);
        const additionalRequests = [] as Promise<any>[];
        for (let page = 2; page <= pages; page += 1) {
          additionalRequests.push(
            get(`/api/recordings?doctor_id=${doctorId}&limit=${effectiveLimit}&page=${page}`)
          );
        }

        const additionalResponses = await Promise.all(additionalRequests);
        for (const additionalResponse of additionalResponses) {
          if (additionalResponse.success) {
            recordingsPayload = recordingsPayload.concat(extractRecordings(additionalResponse.data));
          }
        }
      }

      // Enrich recordings with patient and appointment information
      const enrichedRecordings = await Promise.all(
        recordingsPayload.map(async (recording: Recording) => {
          try {
            // Fetch patient details for each recording
            const patientResponse = await get(`/api/patients/${recording.patientId}`);
            if (patientResponse.success && patientResponse.data?.patient) {
              recording.patient = patientResponse.data.patient;
            }
          } catch (err) {
            console.warn(`Could not fetch patient details for ${recording.patientId}:`, err);
          }

          if (recording.appointmentId) {
            try {
              const appointmentResponse = await get(`/api/appointments/${recording.appointmentId}`);
              const appointmentPayload = appointmentResponse.data?.appointment ?? appointmentResponse.data;
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
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {recordings.map((recording) => {
                    const summaryNotes =
                      recording.aiProcessing?.structuredNotes || recording.appointment?.consultationSummary ||
                      recording.appointment?.structuredNotes;
                    const hasTranscription = Boolean(
                      recording.transcription || recording.appointment?.transcription
                    );
                    const appointmentInfo = recording.appointment;

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
                                      recording.status === "processed"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : recording.status === "error"
                                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    }
                                  >
                                    {recording.status === "processed" ? (
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
                                </div>

                                {summaryNotes && (
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
                                )}

                                {recording.status === "error" && recording.appointment?.followUpNotes && (
                                  <p className="text-xs text-red-600">
                                    {recording.appointment.followUpNotes}
                                  </p>
                                )}
                              </div>
                            </div>

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
                              {recording.patient && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="gap-2"
                                >
                                  <Link to={`/patient-overview/${recording.patient.patientId}`}>
                                    <UserIcon className="w-4 h-4" />
                                    Patient Profile
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
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
                            selectedRecording.status === "processed"
                              ? "bg-green-100 text-green-800"
                              : selectedRecording.status === "error"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {selectedRecording.status === "processed" ? (
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
                    </div>
                  </CardContent>
                </Card>

                {/* AI Processing Results / Structured Notes */}
                {(() => {
                  const structured =
                    selectedRecording.aiProcessing?.structuredNotes ||
                    selectedRecording.appointment?.structuredNotes ||
                    selectedRecording.appointment?.consultationSummary;
                  if (!structured) return null;

                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Clinical Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
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
                        <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                          {selectedRecording.appointment.consultationNotes}
                        </pre>
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

                  if (transcription) {
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Full Transcription</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-96 border rounded-lg p-4 bg-muted/30">
                            <pre className="text-sm whitespace-pre-wrap leading-relaxed">{transcription}</pre>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    );
                  }

                  if (selectedRecording.status === "processed") {
                    return (
                      <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                          <FileTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No transcription available for this consultation.</p>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <Loader2Icon className="w-12 h-12 mx-auto mb-2 opacity-50 animate-spin" />
                        <p>Recording is still being processed...</p>
                        <p className="text-sm mt-1">Status: {selectedRecording.status}</p>
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
