import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  EyeIcon,
} from "lucide-react";
import { PatientVisitHistory } from "@/polymet/components/patient-visit-history";
import { ConsultationSidebar } from "@/polymet/components/consultation-sidebar";
import { LabResultsCard } from "@/polymet/components/lab-results-card";
import { get, post, put } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [resolvedPatientObjectId, setResolvedPatientObjectId] = useState<string | null>(null);
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
  const [isPlaying, setIsPlaying] = useState(false);
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
  const [showTranscriptionView, setShowTranscriptionView] = useState<boolean>(false);
  const [uploadedRecordingId, setUploadedRecordingId] = useState<string | null>(null);
  const [autoRecordingIntent, setAutoRecordingIntent] = useState<{
    patientId: string;
    queueId?: string;
    createdAt?: number;
  } | null>(null);
  const [autoRecordingActive, setAutoRecordingActive] = useState(false);

const defaultAiAnalysis = {
  similarCases: 120,
  riskLevel: "Medium",
  successRate: "94%",
  keyFindings: [
    "Patient shows stable vitals with mild hypertension indicators.",
    "Recent lab results indicate improved glycemic control.",
    "No acute distress signals present during initial assessment.",
  ],
  recommendations: [
    "Maintain current medication plan with minor dosage adjustments.",
    "Schedule follow-up lab work in 2 weeks to monitor progress.",
    "Encourage daily 20-minute moderate exercise with hydration tracking.",
  ],
};

const aiAnalysis = defaultAiAnalysis;

const defaultAppointmentTimeline = [
  {
    title: "Initial Consultation",
    date: "2024-11-04",
    notes: "Baseline assessment completed with stable vitals.",
  },
  {
    title: "Follow-up Visit",
    date: "2024-12-02",
    notes: "Medications adjusted based on lab improvements.",
  },
  {
    title: "Specialist Referral",
    date: "2025-01-15",
    notes: "Cardiology referral arranged for extended evaluation.",
  },
  {
    title: "Therapy Session",
    date: "2025-02-10",
    notes: "Lifestyle coaching session completed.",
  },
  {
    title: "Lab Review",
    date: "2025-03-05",
    notes: "Latest labs show favorable trends across key indicators.",
  },
];

const appointmentTimeline = defaultAppointmentTimeline;
  const consultationIdentifiers = useMemo(
    () => ({
      mongoId: resolvedPatientObjectId || patient?._id || null,
      friendlyId: patient?.patientId || null,
      queueId: queueEntryId,
    }),
    [resolvedPatientObjectId, patient?._id, patient?.patientId, queueEntryId]
  );

  // Fetch patient data and queue entry on component mount
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId && !queueIdParam) return;

      setIsLoading(true);
      setError(null);

      const fetchPatientByMongoId = async (id?: string | null) => {
        if (!id) return null;
        try {
          const response = await get<{ patient: Patient }>(`/api/patients/${id}`);
          if (response.success && response.data?.patient) {
            return response.data.patient;
          }
        } catch (err) {
          console.warn(`Failed to fetch patient by ID ${id}:`, err);
        }
        return null;
      };

      const fetchPatientByFriendlyId = async (id?: string | null) => {
        if (!id) return null;
        try {
          const response = await get<{ patient: Patient }>(`/api/patients/patient-id/${id}`);
          if (response.success && response.data?.patient) {
            return response.data.patient;
          }
        } catch (err) {
          console.warn(`Failed to fetch patient by patientId ${id}:`, err);
        }
        return null;
      };

      const fetchQueueEntry = async (id?: string | null) => {
        if (!id) return null;
        try {
          const response = await get<any>(`/api/queue/${id}`);
          if (response.success && response.data) {
            const queueEntry = response.data;
            const queuePatientField = queueEntry?.patient;
            const fallbackPatientId =
              typeof queuePatientField === "string"
                ? queuePatientField
                : queuePatientField?._id ?? queuePatientField?.id ?? null;
            const patientSnapshot =
              typeof queuePatientField === "object" ? queuePatientField : null;
            const queueAppointment = queueEntry?.appointment;
            const appointmentId =
              typeof queueAppointment === "string"
                ? queueAppointment
                : queueAppointment?._id ?? null;

            return {
              entry: queueEntry,
              queueId: queueEntry?._id ?? id,
              patientId: fallbackPatientId,
              patientSnapshot,
              appointmentId,
            };
          }
        } catch (err) {
          console.warn(`Failed to load queue entry ${id}:`, err);
        }
        return null;
      };

      try {
        let resolvedPatientId: string | null = patientId ?? null;
        let localQueueEntryId: string | null = queueIdParam ?? null;
        let localAppointmentId: string | null = null;
        let patientData: Patient | null = null;
        let queueInfo: Awaited<ReturnType<typeof fetchQueueEntry>> | null = null;

        if (localQueueEntryId) {
          queueInfo = await fetchQueueEntry(localQueueEntryId);
        }

        if (!queueInfo && patientId) {
          queueInfo = await fetchQueueEntry(patientId);
        }

        if (queueInfo) {
          localQueueEntryId = queueInfo.queueId ?? localQueueEntryId;
          if (queueInfo.patientId) {
            resolvedPatientId = queueInfo.patientId;
          }
          if (queueInfo.appointmentId) {
            localAppointmentId = queueInfo.appointmentId;
          }
          if (queueInfo.patientSnapshot) {
            patientData = queueInfo.patientSnapshot as Patient;
          }
        }

        if (!patientData && resolvedPatientId) {
          patientData = await fetchPatientByMongoId(resolvedPatientId);
          if (patientData) {
            resolvedPatientId = patientData._id;
          }
        }

        if (!patientData && queueInfo?.patientSnapshot?.patientId) {
          patientData = await fetchPatientByFriendlyId(queueInfo.patientSnapshot.patientId);
          if (patientData) {
            resolvedPatientId = patientData._id;
          }
        }

        if (!patientData && patientId) {
          patientData = await fetchPatientByFriendlyId(patientId);
          if (patientData) {
            resolvedPatientId = patientData._id;
          }
        }

        if (!patientData || !resolvedPatientId) {
          setError("Patient not found");
          return;
        }

        setPatient(patientData);
        setResolvedPatientObjectId(resolvedPatientId);
        if (localAppointmentId) {
          setAppointmentId(localAppointmentId);
        }
        if (localQueueEntryId) {
          setQueueEntryId(localQueueEntryId);
        }

        let hasAccess = false;

        const queueDoctorField = queueInfo?.entry?.doctor;
        const queueDoctorId =
          typeof queueDoctorField === "string"
            ? queueDoctorField
            : queueDoctorField?._id ?? queueDoctorField?.id ?? null;
        if (user?._id && queueDoctorId && queueDoctorId === user._id) {
          hasAccess = true;
        }

        if (!hasAccess && user?._id) {
          try {
            const queueResponse = await get<{ queue: any[] }>(`/api/queue/doctor/${user._id}`);
            if (queueResponse.success && queueResponse.data?.queue) {
              const activeEntry = queueResponse.data.queue.find((entry: any) => {
                const entryPatient =
                  typeof entry.patient === "string"
                    ? entry.patient
                    : entry.patient?._id ?? entry.patient?.id ?? null;
                return (
                  entryPatient === resolvedPatientId &&
                  (entry.status === "in-consultation" || entry.status === "waiting")
                );
              });

              if (activeEntry) {
                hasAccess = true;

                if (!localQueueEntryId && activeEntry?._id) {
                  setQueueEntryId(activeEntry._id);
                }

                const entryAppointment = activeEntry?.appointment;
                if (entryAppointment && !localAppointmentId) {
                  const derivedAppointmentId =
                    typeof entryAppointment === "string"
                      ? entryAppointment
                      : entryAppointment?._id ?? null;
                  if (derivedAppointmentId) {
                    setAppointmentId(derivedAppointmentId);
                  }
                }
              }
            }
          } catch (err) {
            console.warn("Could not fetch queue entry:", err);
          }
        }

        if (!hasAccess) {
          setError("You don't have access to consult this patient. The patient may not be assigned to you.");
          return;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load patient data";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, queueIdParam, user?._id]);

  useEffect(() => {
    if (!patient || autoRecordingIntent) return;
    try {
      const stored = sessionStorage.getItem("autoConsultationRecording");
      if (!stored) return;
      const parsed = JSON.parse(stored);

      const matchesPatient =
        parsed?.patientId &&
        [consultationIdentifiers.mongoId, consultationIdentifiers.friendlyId]
          .filter(Boolean)
          .includes(parsed.patientId);
      const matchesQueue =
        parsed?.queueId &&
        consultationIdentifiers.queueId &&
        parsed.queueId === consultationIdentifiers.queueId;

      if (matchesPatient || matchesQueue) {
        setAutoRecordingIntent(parsed);
        sessionStorage.removeItem("autoConsultationRecording");
      }
    } catch (err) {
      console.warn("Failed to read auto consultation recording flag", err);
      sessionStorage.removeItem("autoConsultationRecording");
    }
  }, [patient, consultationIdentifiers, autoRecordingIntent]);

  useEffect(() => {
    if (!autoRecordingIntent || autoRecordingActive || isRecording || isLoading) return;

    let cancelled = false;
    const startAutoRecording = async () => {
      try {
        await startRecording();
        if (!cancelled) {
          setAutoRecordingActive(true);
          setAutoRecordingIntent(null);
        }
      } catch (err) {
        console.warn("Auto recording failed to start:", err);
        if (!cancelled) {
          setAutoRecordingIntent(null);
        }
      }
    };

    startAutoRecording();
    return () => {
      cancelled = true;
    };
  }, [autoRecordingIntent, autoRecordingActive, isRecording, isLoading]);

  useEffect(() => {
    if (!autoRecordingActive) return;
    if (isRecording) return;
    if (!audioBlob || isUploading) return;

    let cancelled = false;
    const finalizeRecording = async () => {
      try {
        await uploadRecording();
      } finally {
        if (!cancelled) {
          setAutoRecordingActive(false);
        }
      }
    };

    finalizeRecording();
    return () => {
      cancelled = true;
    };
  }, [autoRecordingActive, isRecording, audioBlob, isUploading]);

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

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      setFinalRecordingDuration(recordingDuration);

      // Automatically start upload and transcription process
      setTimeout(() => {
        uploadRecording();
      }, 100); // Small delay to ensure audioBlob is ready
    }
  };

  const uploadRecording = async () => {
    const targetPatientId =
      resolvedPatientObjectId ||
      patient?._id ||
      patient?.id ||
      patient?.patientId ||
      consultationIdentifiers.mongoId ||
      consultationIdentifiers.friendlyId ||
      autoRecordingIntent?.patientId ||
      patientId ||
      "";

    const doctorId = user?._id || user?.id || user?.doctorId || "";

    if (!audioBlob) {
      console.warn("Attempted to upload recording without audio blob");
      return;
    }

    if (!targetPatientId || !doctorId) {
      console.error("Missing required information for recording upload", {
        targetPatientId,
        doctorId,
      });
      return;
    }

    // Calculate duration in seconds
    const duration = finalRecordingDuration
      ? finalRecordingDuration.split(":").reduce((acc, val, idx) => {
          if (idx === 0) return acc + parseInt(val) * 60;
          return acc + parseInt(val);
        }, 0)
      : 0;

    try {
      setTranscriptionStatus("uploading");
      setIsUploading(true);

      // Create FormData for file upload – must match backend's expected field names
      const formData = new FormData();
      formData.append("file", audioBlob, "consultation-recording.wav");
      formData.append("patient_id", targetPatientId);
      formData.append("doctor_id", doctorId);
      formData.append("duration", duration.toString());
      
      // Add appointmentId if available
      if (appointmentId) {
        formData.append("appointment_id", appointmentId);
      } else {
        // Try to find appointment from today's appointments
        try {
          const today = new Date().toISOString().split("T")[0];
          const appointmentsResponse = await get(
            `/api/appointments?patientId=${targetPatientId}&date=${today}&status=checked-in`
          );
          if (appointmentsResponse.success && appointmentsResponse.data?.data) {
            const appointments = Array.isArray(appointmentsResponse.data.data) 
              ? appointmentsResponse.data.data 
              : appointmentsResponse.data.data?.data || [];
            const activeAppointment = appointments.find((apt: any) => 
              apt.status === "checked-in" || apt.status === "in-progress"
            );
            if (activeAppointment?._id) {
              formData.append("appointment_id", activeAppointment._id);
            }
          }
        } catch (err) {
          console.warn("Could not fetch appointment:", err);
        }
      }

      const response = await post("/api/recordings/", formData);

      if (response.success && response.data) {
        console.log("Recording uploaded and transcribed successfully:", response.data);
        const recording = response.data.recording;
        const recordingId = recording.recordingId || recording.id;
        setUploadedRecordingId(recordingId);
        setAudioBlob(null);
        if (recording.presignedUrl || recording.fileUrl) {
          setRecordingUrl(recording.presignedUrl || recording.fileUrl);
        }

        // Handle different processing statuses
        if (recording.status === "uploaded") {
          setTranscriptionStatus("transcribing");
        } else if (recording.status === "transcribed") {
          setTranscriptionStatus("extracting_info");
        } else if (recording.status === "processed" && recording.transcription) {
          setTranscriptionText(recording.transcription);
          setStructuredNotes(recording.aiProcessing?.structuredNotes || null);
          setTranscriptionStatus("completed");
          setFinalRecordingDuration("");

          // Auto-fill clinical notes from structured notes
          if (recording.aiProcessing?.structuredNotes) {
            const notes = recording.aiProcessing.structuredNotes;
            if (notes.chiefComplaint && !notes) setNotes(`Chief Complaint: ${notes.chiefComplaint}`);
            if (notes.assessment && !diagnosis) setDiagnosis(notes.assessment);
            if (notes.plan && !treatment) setTreatment(notes.plan);
          }
        } else if (recording.status === "error") {
          setTranscriptionStatus("error");
          console.error("Transcription failed:", recording.errorMessage);
        }
      }
    } catch (err) {
      console.error("Error uploading recording:", err);
      alert(err instanceof Error ? err.message : "Failed to upload recording");
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

  // Transcription is now synchronous, so no polling needed
  const checkTranscriptionStatus = async (recordingId?: string) => {
    // Since transcription happens synchronously during upload,
    // we only need this for manual status checks if needed
    if (!recordingId && !uploadedRecordingId) return;

    try {
      const id = recordingId || uploadedRecordingId;
      const response = await get(`/api/recordings/${id}/transcription-status`);

      if (response.success && response.data?.transcription) {
        const status = response.data.transcription.status;
        setTranscriptionStatus(status);

        if (status === "processed") {
          // Get the full recording details to access transcription
          const recordingResponse = await get(`/api/recordings/${id}`);
          if (recordingResponse.success && recordingResponse.data?.recording) {
            const recording = recordingResponse.data.recording;
            setTranscriptionText(recording.transcription || "");
            setStructuredNotes(recording.aiProcessing?.structuredNotes || null);
          }
        }
      }
    } catch (err) {
      console.error("Error checking transcription status:", err);
    }
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

    // If we have a queue entry, mark it as completed so it disappears from the queue
    const targetQueueId = queueEntryId || queueIdParam;
    if (targetQueueId) {
      try {
        await put(`/api/queue/${targetQueueId}/status`, {
          status: "completed",
        });
      } catch (err) {
        console.error("Failed to update queue status:", err);
      }
    }

    // Update appointment status to checkout so receptionist can proceed
    if (appointmentId) {
      try {
        await put(`/api/appointments/${appointmentId}`, {
          status: "checkout",
        });
      } catch (err) {
        console.error("Failed to update appointment status:", err);
      }
    }

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

  const displayPatient = {
    fullName:
      patient.fullName?.trim() ||
      [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
      "Patient",
    patientId: patient.patientId || patient._id || consultationIdentifiers.friendlyId || consultationIdentifiers.mongoId || "Unknown",
    age: patient.age || "",
    gender: patient.gender || "",
    bloodGroup: patient.insights?.bloodGroup || patient.bloodGroup || "",
    phone: patient.phone || "",
    email: patient.email || "",
    condition: patient.condition || patient.insights?.riskAssessment || "Under Observation",
    lastVisit: patient.lastVisit || patient.insights?.lastUpdatedAt || "",
    carePlanSummary: patient.carePlanSummary || patient.insights?.recommendations?.join("; ") || "",
    followUpPlan: patient.followUpPlan || patient.insights?.followUpInstructions || "",
    allergies:
      Array.isArray(patient.allergies)
        ? patient.allergies
        : typeof patient.allergies === "string" && patient.allergies.trim()
        ? patient.allergies.split(",").map((entry) => entry.trim())
        : [],
    medications:
      Array.isArray(patient.currentMedication)
        ? patient.currentMedication
        : (patient.currentMedication || "").split(",").map((entry) => entry.trim()).filter(Boolean)
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header with Patient Info and Controls */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-border">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayPatient.fullName)}&background=random&color=ffffff&size=64`} alt={displayPatient.fullName} />

            <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white">
              {displayPatient.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
                {displayPatient.fullName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-muted-foreground">
                  {displayPatient.age ? `${displayPatient.age} years` : ""}{" "}
                  {displayPatient.gender ? `• ${displayPatient.gender}` : ""}{" "}
                  • ID: {displayPatient.patientId}
              </p>
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
              >
                  {displayPatient.condition}
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

          {!isRecording && audioBlob && !isUploading && transcriptionStatus === "not_started" && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Recorded: {finalRecordingDuration} - Processing will start automatically...
                </span>
              </div>
              {recordingUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPlaying}
                  onClick={() => {
                    const audio = new Audio(recordingUrl);
                    setIsPlaying(true);
                    audio.play();
                    audio.onended = () => setIsPlaying(false);
                    audio.onerror = () => setIsPlaying(false);
                  }}
                  className="gap-2"
                >
                  <FileAudioIcon className="w-4 h-4" />
                  {isPlaying ? "Playing..." : "Play"}
                </Button>
              )}
            </div>
          )}

          {/* Transcription Status */}
          {transcriptionStatus !== "not_started" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              {transcriptionStatus === "uploading" && (
                <>
                  <Loader2Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Uploading recording...
                  </span>
                </>
              )}
              {transcriptionStatus === "transcribing" && (
                <>
                  <Loader2Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Transcribing audio...
                  </span>
                </>
              )}
              {transcriptionStatus === "extracting_info" && (
                <>
                  <Loader2Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Extracting medical information...
                  </span>
                </>
              )}
              {transcriptionStatus === "completed" && (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Processing Complete
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-6 px-2 text-xs border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
                    onClick={() => setShowTranscriptionView(true)}
                  >
                    <EyeIcon className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </>
              )}
              {transcriptionStatus === "error" && (
                <>
                  <AlertCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                    Processing Failed
                  </span>
                </>
              )}
            </div>
          )}

          <Button
            onClick={async (e) => {
              e.preventDefault();
              await handleEndConsultation();
              navigate("/doctor-workstation");
            }}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircleIcon className="w-4 h-4" />
            End Consultation
          </Button>
          {!isRecording && !audioBlob && recordingUrl && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPlaying}
                onClick={() => {
                  const audio = new Audio(recordingUrl);
                  setIsPlaying(true);
                  audio.play();
                  audio.onended = () => setIsPlaying(false);
                  audio.onerror = () => setIsPlaying(false);
                }}
                className="gap-2"
              >
                <FileAudioIcon className="w-4 h-4" />
                {isPlaying ? "Playing..." : "Play"}
              </Button>
            </div>
          )}
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
          allergies={displayPatient.allergies}
          medications={displayPatient.medications}
          condition={displayPatient.condition}
          carePlanSummary={displayPatient.carePlanSummary}
          followUpPlan={displayPatient.followUpPlan}
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

      {/* Transcription Viewer Dialog */}
      <Dialog open={showTranscriptionView} onOpenChange={setShowTranscriptionView}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileAudioIcon className="w-5 h-5 text-emerald-600" />
              Consultation Transcription
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  Transcription Complete
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {displayPatient.fullName} - {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            <ScrollArea className="h-[400px] w-full border rounded-lg p-4 bg-muted/30">
              {transcriptionText ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {transcriptionText}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <FileAudioIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No transcription text available</p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {structuredNotes && (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30">
                <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                  AI-Generated Structured Notes
                </h4>
                <div className="space-y-2 text-sm">
                  {structuredNotes.chiefComplaint && (
                    <div>
                      <span className="font-medium">Chief Complaint:</span> {structuredNotes.chiefComplaint}
                    </div>
                  )}
                  {structuredNotes.assessment && (
                    <div>
                      <span className="font-medium">Assessment:</span> {structuredNotes.assessment}
                    </div>
                  )}
                  {structuredNotes.plan && (
                    <div>
                      <span className="font-medium">Plan:</span> {structuredNotes.plan}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTranscriptionView(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
