import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MicIcon,
  MicOffIcon,
  CheckCircleIcon,
  ActivityIcon,
  AlertCircleIcon,
  SparklesIcon,
  BotIcon,
  XIcon,
  Loader2Icon,
  UploadIcon,
  FileAudioIcon,
} from "lucide-react";
import { PatientVisitHistory } from "@/polymet/components/patient-visit-history";
import { ConsultationSidebar } from "@/polymet/components/consultation-sidebar";
import { LabResultsCard } from "@/polymet/components/lab-results-card";
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

interface Recording {
  _id: string;
  patientId: string;
  doctorId: string;
  fileUrl: string;
  duration: number;
  transcription?: string;
  aiNotes?: string;
  recordedAt: string;
}

export function ConsultationSession() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState("00:00");
  const [finalRecordingDuration, setFinalRecordingDuration] = useState("");
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Clinical notes
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [followUp, setFollowUp] = useState("");

  // AI Chat
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Session state
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Transcription state
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>("not_started");
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [structuredNotes, setStructuredNotes] = useState<any>(null);
  const [transcriptionPolling, setTranscriptionPolling] = useState<NodeJS.Timeout | null>(null);
  const [uploadedRecordingId, setUploadedRecordingId] = useState<string | null>(null);

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
        } else {
          setError("Patient not found");
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

  // Cleanup transcription polling on unmount
  useEffect(() => {
    return () => {
      if (transcriptionPolling) {
        clearInterval(transcriptionPolling);
      }
    };
  }, [transcriptionPolling]);

  // Recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(audioBlob);
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordingUrl(audioUrl);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration("00:00");

      let seconds = 0;
      const interval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setRecordingDuration(
          `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        );
      }, 1000);
      setRecordingInterval(interval);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      setFinalRecordingDuration(recordingDuration);
    }
  };

  const uploadRecording = async () => {
    if (!audioBlob || !patientId) return;

    try {
      setIsUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("recording", audioBlob, "consultation-recording.wav");
      formData.append("patientId", patientId);

      const response = await post("/api/recordings/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.success && response.data) {
        console.log("Recording uploaded successfully:", response.data);
        const recordingId = response.data.recording.id;
        setUploadedRecordingId(recordingId);
        setTranscriptionStatus("processing");

        // Start polling for transcription status
        startTranscriptionPolling(recordingId);
      }
    } catch (err) {
      console.error("Error uploading recording:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const generateAiNotes = async (recordingId: string) => {
    try {
      const response = await post("/api/clinical-notes/generate", {
        recordingId,
        patientId,
      });

      if (response.success && response.data) {
        setNotes(response.data.notes || "");
        setDiagnosis(response.data.diagnosis || "");
        setTreatment(response.data.treatment || "");
        setFollowUp(response.data.followUp || "");
      }
    } catch (err) {
      console.error("Error generating AI notes:", err);
    }
  };

  const saveClinicalNotes = async () => {
    if (!patientId) return;

    try {
      const response = await post("/api/clinical-notes", {
        patientId,
        note: notes,
        diagnosis,
        treatment,
        followUp,
      });

      if (response.success) {
        console.log("Clinical notes saved successfully");
        setSessionCompleted(true);
      }
    } catch (err) {
      console.error("Error saving clinical notes:", err);
    }
  };

  const checkTranscriptionStatus = async (recordingId?: string) => {
    if (!recordingId && !uploadedRecordingId) return;

    try {
      const id = recordingId || uploadedRecordingId;
      const response = await get(`/api/recordings/${id}/transcription-status`);

      if (response.success && response.data?.transcription) {
        const status = response.data.transcription.status;

        if (status === "processed") {
          // Get the full recording details to access transcription
          const recordingResponse = await get(`/api/recordings/${id}`);
          if (recordingResponse.success && recordingResponse.data?.recording) {
            const recording = recordingResponse.data.recording;
            setTranscriptionText(recording.transcription || "");
            setStructuredNotes(recording.aiProcessing?.structuredNotes || null);
            setTranscriptionStatus("completed");

            // Auto-fill clinical notes from structured notes
            if (recording.aiProcessing?.structuredNotes) {
              const notes = recording.aiProcessing.structuredNotes;
              if (notes.chiefComplaint && !notes) setNotes(`Chief Complaint: ${notes.chiefComplaint}`);
              if (notes.assessment && !diagnosis) setDiagnosis(notes.assessment);
              if (notes.plan && !treatment) setTreatment(notes.plan);
            }
          }

          // Stop polling
          if (transcriptionPolling) {
            clearInterval(transcriptionPolling);
            setTranscriptionPolling(null);
          }
        } else if (status === "processing") {
          setTranscriptionStatus("processing");
        } else if (status === "error") {
          setTranscriptionStatus("error");
          if (transcriptionPolling) {
            clearInterval(transcriptionPolling);
            setTranscriptionPolling(null);
          }
        }
      }
    } catch (err) {
      console.error("Error checking transcription status:", err);
    }
  };

  const startTranscriptionPolling = (recordingId: string) => {
    // Check immediately
    checkTranscriptionStatus(recordingId);

    // Then poll every 30 seconds
    const interval = setInterval(() => {
      checkTranscriptionStatus(recordingId);
    }, 30000);

    setTranscriptionPolling(interval);
  };

  const askAI = async () => {
    if (!aiQuery.trim()) return;

    try {
      setIsAiLoading(true);
      const response = await post("/api/ai/chat", {
        query: aiQuery,
        patientId,
        context: {
          notes,
          diagnosis,
          treatment,
        },
      });

      if (response.success && response.data) {
        setAiResponse(response.data.response);
      }
    } catch (err) {
      console.error("Error getting AI response:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleEndConsultation = async () => {
    // Save clinical notes first
    await saveClinicalNotes();
    // Set flag to indicate consultation completed
    sessionStorage.setItem("consultationCompleted", "true");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2Icon className="w-16 h-16 text-[#00C4B3] mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Consultation Session</h2>
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
            {error ? "Error Loading Session" : "Patient Not Found"}
          </h2>
          <p className="text-muted-foreground">
            {error || "The requested patient could not be found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header with Patient Info and Controls */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-border">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(patient.fullName)}&background=random&color=ffffff&size=64`} alt={patient.fullName} />

            <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white">
              {patient.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {patient.fullName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-muted-foreground">
                {patient.age} years • {patient.gender} • ID: {patient.patientId}
              </p>
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
              >
                {patient.condition}
              </Badge>
            </div>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopRecording : startRecording}
            className="gap-2"
            disabled={isUploading}
          >
            {isRecording ? (
              <>
                <MicOffIcon className="w-4 h-4" />
                Stop Recording
              </>
            ) : (
              <>
                <MicIcon className="w-4 h-4" />
                Start Recording
              </>
            )}
          </Button>

          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono text-red-700 dark:text-red-400">
                {recordingDuration}
              </span>
            </div>
          )}

          {!isRecording && audioBlob && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Recorded: {finalRecordingDuration}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={uploadRecording}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4" />
                    Upload & Generate Notes
                  </>
                )}
              </Button>
              {recordingUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const audio = new Audio(recordingUrl);
                    audio.play();
                  }}
                  className="gap-2"
                >
                  <FileAudioIcon className="w-4 h-4" />
                  Play
                </Button>
              )}
            </div>
          )}

          {/* Transcription Status */}
          {transcriptionStatus !== "not_started" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              {transcriptionStatus === "processing" && (
                <>
                  <Loader2Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Transcribing & Analyzing...
                  </span>
                </>
              )}
              {transcriptionStatus === "completed" && (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Transcription Complete
                  </span>
                </>
              )}
              {transcriptionStatus === "error" && (
                <>
                  <AlertCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                    Transcription Failed
                  </span>
                </>
              )}
            </div>
          )}

          <Link to="/doctor-workstation">
            <Button
              onClick={handleEndConsultation}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircleIcon className="w-4 h-4" />
              End Consultation
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - AI Analysis & Lab Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Analysis Section - Main Focus */}
          <Card className="border-border shadow-md bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                AI Health Analysis
                <Badge
                  variant="outline"
                  className="ml-2 text-xs bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700"
                >
                  Based on {aiAnalysis.similarCases} similar cases
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Risk Level */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    Risk Assessment
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700"
                  >
                    {aiAnalysis.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Success rate in similar cases: {aiAnalysis.successRate}
                </p>
              </div>

              {/* Key Findings */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Key Findings
                </h4>
                <ul className="space-y-2">
                  {aiAnalysis.keyFindings.map((finding, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                    >
                      <ActivityIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />

                      <span className="text-sm text-foreground">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* AI Recommendations */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  AI Recommendations
                </h4>
                <ul className="space-y-2">
                  {aiAnalysis.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
                    >
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />

                      <span className="text-sm text-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Recent Lab Results */}
          <LabResultsCard />
        </div>

        {/* Right Column - Vitals & Quick Info (Compact) */}
        <ConsultationSidebar
          notes={notes}
          diagnosis={diagnosis}
          treatment={treatment}
          followUp={followUp}
          transcriptionStatus={transcriptionStatus}
          transcriptionText={transcriptionText}
          structuredNotes={structuredNotes}
          onNotesChange={setNotes}
          onDiagnosisChange={setDiagnosis}
          onTreatmentChange={setTreatment}
          onFollowUpChange={setFollowUp}
        />
      </div>

      {/* Patient Visit History Section - Bottom */}
      <div className="mt-8">
        <PatientVisitHistory
          visits={appointmentTimeline.slice(1, 5)}
          patientId={patient.id}
        />
      </div>

      {/* AI Assistant Floating Button */}
      {!aiChatOpen && (
        <Button
          onClick={() => setAiChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white z-50"
        >
          <BotIcon className="w-6 h-6" />
        </Button>
      )}

      {/* AI Assistant Chat Panel */}
      {aiChatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-card border border-border rounded-lg shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-lg">
            <div className="flex items-center gap-2">
              <BotIcon className="w-5 h-5 text-white" />

              <h3 className="font-semibold text-white">AI Medical Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAiChatOpen(false)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <BotIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 p-3 rounded-lg bg-muted">
                  <p className="text-sm text-foreground">
                    Hello! I'm your AI medical assistant. I can help you with:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>• Drug interactions and dosages</li>
                    <li>• Differential diagnosis suggestions</li>
                    <li>• Treatment guidelines</li>
                    <li>• Medical research and studies</li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask me anything..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="min-h-[60px] resize-none"
              />

              <Button className="bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
