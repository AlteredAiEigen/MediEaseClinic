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

interface Recording {
  _id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  status: "uploaded" | "transcribed" | "processed" | "error";
  fileUrl?: string;
  duration?: number;
  transcription?: string;
  aiProcessing?: {
    structuredNotes?: {
      chiefComplaint?: string;
      assessment?: string;
      plan?: string;
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

      // Fetch recordings for this doctor
      const response = await get(`/api/recordings?doctor_id=${doctorId}&limit=50`);

      if (!response.success) {
        throw new Error(response.message || "Request failed");
      }

      const recordingsPayload: Recording[] = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      // Enrich recordings with patient information
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
          return recording;
        })
      );

      setRecordings(enrichedRecordings);
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-blue-600" />
                Consultation History
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
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
                  {recordings.map((recording) => (
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

                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <ClockIcon className="w-4 h-4" />
                                  <span>
                                    {formatDateTime(recording.createdAt)}
                                  </span>
                                </div>
                                {recording.duration && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <span>Duration: {formatDuration(recording.duration)}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
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
                                  ) : (
                                    <>
                                      <ClockIcon className="w-3 h-3 mr-1" />
                                      {recording.status}
                                    </>
                                  )}
                                </Badge>

                                {recording.transcription && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                    Has Transcription
                                  </Badge>
                                )}
                              </div>

                              {recording.aiProcessing?.structuredNotes && (
                                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                  <h5 className="text-sm font-medium mb-2">AI Summary</h5>
                                  <div className="space-y-1 text-sm">
                                    {recording.aiProcessing.structuredNotes.chiefComplaint && (
                                      <div>
                                        <span className="font-medium">Chief Complaint:</span>{" "}
                                        {recording.aiProcessing.structuredNotes.chiefComplaint}
                                      </div>
                                    )}
                                    {recording.aiProcessing.structuredNotes.assessment && (
                                      <div>
                                        <span className="font-medium">Assessment:</span>{" "}
                                        {recording.aiProcessing.structuredNotes.assessment}
                                      </div>
                                    )}
                                    {recording.aiProcessing.structuredNotes.plan && (
                                      <div>
                                        <span className="font-medium">Plan:</span>{" "}
                                        {recording.aiProcessing.structuredNotes.plan}
                                      </div>
                                    )}
                                  </div>
                                </div>
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
                  ))}
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
                          {selectedRecording.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Patient ID:</span> {selectedRecording.patientId}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Processing Results */}
                {selectedRecording.aiProcessing?.structuredNotes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI-Generated Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedRecording.aiProcessing.structuredNotes.chiefComplaint && (
                        <div>
                          <span className="font-medium">Chief Complaint:</span>
                          <p className="mt-1 text-sm">{selectedRecording.aiProcessing.structuredNotes.chiefComplaint}</p>
                        </div>
                      )}

                      {selectedRecording.aiProcessing.structuredNotes.assessment && (
                        <div>
                          <span className="font-medium">Assessment:</span>
                          <p className="mt-1 text-sm">{selectedRecording.aiProcessing.structuredNotes.assessment}</p>
                        </div>
                      )}

                      {selectedRecording.aiProcessing.structuredNotes.plan && (
                        <div>
                          <span className="font-medium">Plan:</span>
                          <p className="mt-1 text-sm">{selectedRecording.aiProcessing.structuredNotes.plan}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Transcription */}
                {selectedRecording.transcription && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Full Transcription</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96 border rounded-lg p-4 bg-muted/30">
                        <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                          {selectedRecording.transcription}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {!selectedRecording.transcription && selectedRecording.status === "processed" && (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <FileTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No transcription available for this recording</p>
                    </CardContent>
                  </Card>
                )}

                {selectedRecording.status !== "processed" && (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Loader2Icon className="w-12 h-12 mx-auto mb-2 opacity-50 animate-spin" />
                      <p>Recording is still being processed...</p>
                      <p className="text-sm mt-1">Status: {selectedRecording.status}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
