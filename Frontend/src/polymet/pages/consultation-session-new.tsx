import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
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
  UserRound,
  SendHorizontal,
  FileAudioIcon,
  EyeIcon,
  UploadIcon,
} from "lucide-react";
import { PatientVisitHistory } from "@/polymet/components/patient-visit-history";
import { ConsultationSidebar } from "@/polymet/components/consultation-sidebar";
import { LabResultsCard } from "@/polymet/components/lab-results-card";
import { get, post, put, patch, del } from "@/lib/api-client";
import { todayLocalYYYYMMDD } from "@/lib/date";
import { MedicalHistoryRecord } from "@/lib/api/patients";
import {
  addPendingConsultationUpload,
  removePendingConsultationUpload,
  updatePendingConsultationUpload,
} from "@/polymet/utils/pending-consultation-uploads";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/use-toast";

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
  medicalHistory?: Array<string | MedicalHistoryRecord>;
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

interface LabResultDisplay {
  name: string;
  value: string;
  date: string;
  status: "normal" | "high" | "low";
  url?: string;
}

interface VisitHistoryItem {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  doctor: string;
  relativeTime: string;
}

export function ConsultationSession() {
  const { patientId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const queueIdParam = searchParams.get("queueId");
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [resolvedPatientObjectId, setResolvedPatientObjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<{
    consentStatus: string;
    patientEmail: string;
    message: string;
  } | null>(null);
  const [labResults, setLabResults] = useState<LabResultDisplay[]>([]);
  const [visitHistory, setVisitHistory] = useState<VisitHistoryItem[]>([]);
  const [latestVitals, setLatestVitals] = useState<any>(null);

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
  const pendingUploadIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const recordingBlobRef = useRef<Blob | null>(null);

  // Clinical notes
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [prescription, setPrescription] = useState("");
  const [prescribedTest, setPrescribedTest] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [prescriptionFileName, setPrescriptionFileName] = useState<string | null>(null); // Track uploaded file name
  const [isUploadingPrescription, setIsUploadingPrescription] = useState(false);
  const [isDeletingPrescription, setIsDeletingPrescription] = useState(false);

  // AI Chat (patient-grounded RAG + conversation persistence)
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiConversationId, setAiConversationId] = useState<string | null>(null);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const aiChatEndRef = useRef<HTMLDivElement | null>(null);
  const [insightsRefreshing, setInsightsRefreshing] = useState(false);

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

  const aiAnalysis = useMemo(() => {
    const insights = (patient as any)?.insights as Record<string, unknown> | undefined;
    const disclaimer =
      (insights?.disclaimer as string) ||
      "This is AI-assisted decision support, not a diagnosis.";

    if (!insights) {
      return {
        insightsSource: "none" as const,
        riskLevel: "—",
        successRate: "—",
        riskAssessment: "",
        keyFindings: [] as string[],
        recommendations: [] as string[],
        clinicalPearls: [] as string[],
        suggestedQuestions: [] as string[],
        redFlags: [] as string[],
        disclaimer,
      };
    }

    const keyFindings = Array.isArray(insights.keyFindings)
      ? (insights.keyFindings as string[]).filter(Boolean)
      : [];
    const recommendations = Array.isArray(insights.recommendations)
      ? (insights.recommendations as string[]).filter(Boolean)
      : [];
    const clinicalPearls = Array.isArray(insights.clinicalPearls)
      ? (insights.clinicalPearls as string[]).filter(Boolean)
      : [];
    const suggestedQuestions = Array.isArray(insights.suggestedQuestionsForClinician)
      ? (insights.suggestedQuestionsForClinician as string[]).filter(Boolean)
      : [];
    const redFlags = Array.isArray(insights.redFlagsToConsider)
      ? (insights.redFlagsToConsider as string[]).filter(Boolean)
      : [];

    const riskAssessment =
      typeof insights.riskAssessment === "string" ? insights.riskAssessment.trim() : "";

    const hasLists = keyFindings.length > 0 || recommendations.length > 0;
    const hasAnyBody =
      hasLists ||
      !!riskAssessment ||
      clinicalPearls.length > 0 ||
      suggestedQuestions.length > 0 ||
      redFlags.length > 0;

    if (!hasAnyBody) {
      return {
        insightsSource: "empty" as const,
        riskLevel: (insights.riskLevel as string) || "—",
        successRate: (insights.successRate as string) || "—",
        riskAssessment: "",
        keyFindings,
        recommendations,
        clinicalPearls,
        suggestedQuestions,
        redFlags,
        disclaimer,
      };
    }

    return {
      insightsSource: "backend" as const,
      riskLevel: (insights.riskLevel as string) || "medium",
      successRate: (insights.successRate as string) || "N/A",
      riskAssessment,
      keyFindings,
      recommendations,
      clinicalPearls,
      suggestedQuestions,
      redFlags,
      disclaimer,
    };
  }, [patient]);

  const insightsMeta = (patient as any)?.insightsMeta as
    | { status?: string; lastGeneratedAt?: string; error?: string }
    | undefined;

  const consultationIdentifiers = useMemo(
    () => ({
      mongoId: resolvedPatientObjectId || patient?._id || null,
      friendlyId: patient?.patientId || null,
      queueId: queueEntryId,
    }),
    [resolvedPatientObjectId, patient?._id, patient?.patientId, queueEntryId]
  );

  useEffect(() => {
    setAiConversationId(null);
    setAiChatMessages([]);
    setAiQuery("");
  }, [resolvedPatientObjectId]);

  useEffect(() => {
    if (!aiChatOpen) return;
    aiChatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [aiChatMessages, isAiLoading, aiChatOpen]);

  // Fetch patient data and queue entry on component mount
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId && !queueIdParam) return;

      setIsLoading(true);
      setError(null);
      setConsentError(null);

      const fetchPatientByMongoId = async (id?: string | null) => {
        if (!id) return null;
        try {
          const response = await get<{ patient: Patient }>(`/api/patients/${id}`);
          if (response.success && response.data?.patient) {
            return response.data.patient;
          }
        } catch (err: any) {
          console.warn(`Failed to fetch patient by ID ${id}:`, err);
          // Check if it's a consent error
          if (err?.status === 403) {
            const errorData = err?.data || {};
            if (errorData.error === "CONSENT_NOT_GRANTED" || errorData.detail?.error === "CONSENT_NOT_GRANTED") {
              setConsentError({
                consentStatus: errorData.consentStatus || errorData.detail?.consentStatus || "pending",
                patientEmail: errorData.patientEmail || errorData.detail?.patientEmail || "",
                message: errorData.message || errorData.detail?.message || "Consent not granted",
              });
              setIsLoading(false);
              return null;
            }
          }
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
        } catch (err: any) {
          console.warn(`Failed to fetch patient by patientId ${id}:`, err);
          // Check if it's a consent error
          if (err?.status === 403) {
            const errorData = err?.data || {};
            if (errorData.error === "CONSENT_NOT_GRANTED" || errorData.detail?.error === "CONSENT_NOT_GRANTED") {
              setConsentError({
                consentStatus: errorData.consentStatus || errorData.detail?.consentStatus || "pending",
                patientEmail: errorData.patientEmail || errorData.detail?.patientEmail || "",
                message: errorData.message || errorData.detail?.message || "Consent not granted",
              });
              setIsLoading(false);
              return null;
            }
          }
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
        
        // Fetch latest vitals for the patient
        try {
          const vitalsResponse = await get<any>(`/api/patient-vitals/${resolvedPatientId}/latest`);
          if (vitalsResponse.success && vitalsResponse.data) {
            setLatestVitals(vitalsResponse.data);
          }
        } catch (err) {
          console.warn("Failed to fetch vitals:", err);
        }
        
        if (localAppointmentId) {
          setAppointmentId(localAppointmentId);
          
          // Fetch appointment to check for existing prescription file
          try {
            const appointmentResponse = await get<any>(`/api/appointments/${localAppointmentId}`);
            if (appointmentResponse.success && appointmentResponse.data?.appointment) {
              const appointment = appointmentResponse.data.appointment;
              if (appointment.prescriptionFileName) {
                setPrescriptionFileName(appointment.prescriptionFileName);
              }
            }
          } catch (err) {
            console.warn("Failed to fetch appointment for prescription file:", err);
          }
        }
        if (localQueueEntryId) {
          setQueueEntryId(localQueueEntryId);
          // Load prescription details from queue entry
          if (queueInfo?.entry) {
            setPrescription(queueInfo.entry.prescription || "");
            // No longer loading generic tests; only prescribed tests are used
            if (queueInfo.entry.prescribedTest) {
              setPrescribedTest(queueInfo.entry.prescribedTest || "");
            }
          }
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

  // Fetch lab results (S3 reports) and recent visits (appointments) for the patient
  useEffect(() => {
    const fetchLabResultsAndVisits = async () => {
      if (!patientId) return;

      // Lab results from S3 reports (best-effort)
      try {
        const s3Response = await get(`/api/s3-reports?patient_id=${patientId}&limit=5`);
        if (s3Response.success) {
          const reports = (s3Response.data as any)?.reports ?? s3Response.data ?? [];
          const mapped = Array.isArray(reports)
            ? reports.map((r: any) => {
                const created = r.createdAt || r.reportedDate || r.collectedDate;
                const d = created ? new Date(created) : null;
                const dateStr = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : "—";
                return {
                  name: r.reportType || r.category || r.title || r.filename || "Lab Report",
                  value: r.summary || r.status || "View",
                  date: dateStr,
                  status: "normal" as const,
                  url: r.fileUrl || r.url,
                };
              })
            : [];
          setLabResults(mapped.slice(0, 5));
        } else {
          setLabResults([]);
        }
      } catch {
        setLabResults([]);
      }

      // Recent visit history from appointments (best-effort)
      try {
        const apptResponse = await get(`/api/appointments?limit=5&patient_id=${patientId}`);
        if (apptResponse.success) {
          const list =
            (apptResponse.data as any)?.appointments ??
            (Array.isArray(apptResponse.data) ? apptResponse.data : []);
          const mapped: VisitHistoryItem[] = Array.isArray(list)
            ? list.map((a: any) => {
                const start = a.startTime || a.date || a.appointmentDate || a.createdAt;
                const d = start ? new Date(start) : null;
                const dateStr = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : "—";
                const timeStr =
                  d && !Number.isNaN(d.getTime())
                    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "—";
                return {
                  id: a._id || a.appointmentId || Math.random().toString(36).slice(2),
                  date: dateStr,
                  time: timeStr,
                  title: a.title || a.type || "Appointment",
                  description: a.reason || a.notes || a.status || "",
                  doctor: a.doctorName || a.doctor?.name || "Doctor",
                  relativeTime: "",
                };
              })
            : [];
          setVisitHistory(mapped.slice(0, 5));
        } else {
          setVisitHistory([]);
        }
      } catch {
        setVisitHistory([]);
      }
    };

    fetchLabResultsAndVisits();
  }, [patientId]);

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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
        recordingBlobRef.current = audioBlob; // Store in ref for immediate access
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
    if (!mediaRecorderRef.current || !isRecording) return;

    await new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      const previousOnStop = recorder.onstop;

      recorder.onstop = async (event: Event) => {
        previousOnStop?.call(recorder, event as any);

        if (recordingInterval) {
          clearInterval(recordingInterval);
          setRecordingInterval(null);
        }

        setIsRecording(false);
        setFinalRecordingDuration(recordingDuration);

        setTimeout(async () => {
          try {
            await uploadRecording();
          } finally {
            resolve();
          }
        }, 150);
      };

      recorder.stop();
    });
  };

  const stopRecordingWithoutUpload = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    await new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      const previousOnStop = recorder.onstop;

      recorder.onstop = async (event: Event) => {
        previousOnStop?.call(recorder, event as any);

        if (recordingInterval) {
          clearInterval(recordingInterval);
          setRecordingInterval(null);
        }

        setIsRecording(false);
        setFinalRecordingDuration(recordingDuration);
        
        // Don't upload - just resolve after a short delay to ensure blob is ready
        setTimeout(() => {
          resolve();
        }, 150);
      };

      recorder.stop();
    });
  };

  const uploadRecording = async () => {
    if (!isMountedRef.current) return;

    const targetPatientId =
      resolvedPatientObjectId ||
      patient?._id ||
      patient?.patientId ||
      consultationIdentifiers.mongoId ||
      consultationIdentifiers.friendlyId ||
      autoRecordingIntent?.patientId ||
      patientId ||
      "";

    const doctorId = user?._id || "";

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

    const nowIso = new Date().toISOString();
    const patientFullName =
      patient?.fullName ||
      [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") ||
      "Patient";
    const patientFriendlyId = patient?.patientId;

    let resolvedAppointmentId = appointmentId ?? "";
    let appointmentType: string | undefined;
    let appointmentDate: string | undefined;
    let appointmentTime: string | undefined;

    if (!resolvedAppointmentId) {
      try {
        const today = todayLocalYYYYMMDD();
        const appointmentsResponse = await get<any>(
          `/api/appointments?patientId=${targetPatientId}&date=${today}&status=checked-in`
        );
        const appointmentPayload = appointmentsResponse.data?.data;
        if (appointmentsResponse.success && appointmentPayload) {
          const appointments = Array.isArray(appointmentPayload)
            ? appointmentPayload
            : Array.isArray(appointmentPayload?.data)
            ? appointmentPayload.data
            : [];
          const activeAppointment = (appointments as any[]).find(
            (apt) => apt?.status === "checked-in" || apt?.status === "in-progress"
          );
          if (activeAppointment?._id) {
            resolvedAppointmentId = activeAppointment._id;
            appointmentType = activeAppointment.type;
            appointmentDate = activeAppointment.date;
            appointmentTime = activeAppointment.time;
            if (isMountedRef.current) {
              setAppointmentId((prev) => prev || activeAppointment._id);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch appointment:", err);
      }
    }

    const ensurePendingUpload = () => {
      if (!user?._id || pendingUploadIdRef.current) return;
      const pendingId = `pending-${Date.now()}`;
      addPendingConsultationUpload({
        id: pendingId,
        doctorId: user._id,
        patientId: targetPatientId,
        patientFriendlyId,
        patientName: patientFullName,
        appointmentId: resolvedAppointmentId || undefined,
        appointmentType,
        appointmentDate,
        appointmentTime,
        status: "uploading",
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      pendingUploadIdRef.current = pendingId;
    };

    try {
      if (!isMountedRef.current) return;

      setTranscriptionStatus("uploading");
      setIsUploading(true);

      ensurePendingUpload();

      const formData = new FormData();
      formData.append("file", audioBlob, "consultation-recording.wav");
      formData.append("patient_id", targetPatientId);
      formData.append("doctor_id", doctorId);
      formData.append("duration", duration.toString());

      if (resolvedAppointmentId) {
        formData.append("appointment_id", resolvedAppointmentId);
      }

      const response = await post<any>("/api/recordings/", formData);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to upload recording");
      }

      if (!isMountedRef.current) {
        if (pendingUploadIdRef.current) {
          removePendingConsultationUpload(pendingUploadIdRef.current);
          pendingUploadIdRef.current = null;
        }
        return;
      }

      console.log("Recording uploaded and transcribed successfully:", response.data);
      const recording = response.data.recording;
      const recordingId = recording.recordingId || recording.id;
      setUploadedRecordingId(recordingId);
      setAudioBlob(null);
      if (recording.presignedUrl || recording.fileUrl) {
        setRecordingUrl(recording.presignedUrl || recording.fileUrl);
      }

      if (pendingUploadIdRef.current) {
        removePendingConsultationUpload(pendingUploadIdRef.current);
        pendingUploadIdRef.current = null;
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload recording";
      console.error("Error uploading recording:", err);
      if (isMountedRef.current) {
        setTranscriptionStatus("error");
      }

      if (pendingUploadIdRef.current) {
        updatePendingConsultationUpload(pendingUploadIdRef.current, {
          status: "error",
          errorMessage: message,
        });
        pendingUploadIdRef.current = null;
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
      }
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

    // Only save clinical notes if there's meaningful content
    const hasContent = notes?.trim() || diagnosis?.trim() || treatment?.trim() || followUp?.trim();
    
    if (!hasContent) {
      console.log("No clinical notes content to save, skipping");
      return;
    }

    try {
      // Get current user info for clinical notes
      const currentTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      const noteContent = [
        notes?.trim() || "",
        diagnosis?.trim() ? `Diagnosis: ${diagnosis.trim()}` : "",
        treatment?.trim() ? `Treatment: ${treatment.trim()}` : "",
        followUp?.trim() ? `Follow-up: ${followUp.trim()}` : "",
      ].filter(Boolean).join("\n\n") || "No clinical notes added";

      const doctorId = user?._id || (user as any)?.id || "";
      if (!doctorId) {
        console.warn("No doctor ID available, skipping clinical notes save");
        return;
      }

      const response = await post("/api/clinical-notes", {
        patient: patientId,
        doctor: String(doctorId),
        type: "general",
        title: `Consultation Note - ${new Date().toLocaleDateString()}`,
        content: noteContent,
        timestamp: currentTime,
        category: "consultation",
      });

      if (response.success) {
        console.log("Clinical notes saved successfully");
        setSessionCompleted(true);
      }
    } catch (err) {
      console.error("Error saving clinical notes:", err);
      // Don't fail the entire consultation if clinical notes save fails
    }
  };

  // Autosave consultation details to appointment
  const saveConsultationDetails = async () => {
    const targetQueueId = queueEntryId || queueIdParam;
    if (!targetQueueId) return;

    try {
      // Build structured AI recommendations payload from AI analysis card
      const aiRecommendationsPayload = aiAnalysis
        ? {
            riskAssessment: {
              level: aiAnalysis.riskLevel,
              successRate: aiAnalysis.successRate,
              similarCases: aiAnalysis.similarCases,
            },
            keyFindings: aiAnalysis.keyFindings,
            recommendations: aiAnalysis.recommendations,
          }
        : aiRecommendations;

      await put(`/api/queue/${targetQueueId}/consultation`, {
        prescription: prescription || null,
        prescribedTest: prescribedTest || null,
        diagnosis: diagnosis || null,
        treatmentPlan: treatment || null,
        followUpInstructions: followUp || null,
        detailedNotes: notes || null,
        aiRecommendations: aiRecommendationsPayload || null,
      });
      console.log("Consultation details autosaved");
    } catch (err) {
      console.error("Error autosaving consultation details:", err);
    }
  };

  // Upload prescription file
  const handlePrescriptionUpload = async (file: File) => {
    if (!appointmentId) {
      console.warn("No appointment ID available for prescription upload");
      return;
    }

    // Check file size (10MB limit)
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB. Please select a smaller file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingPrescription(true);
      
      // If there's an existing file, delete it first (replace operation)
      if (prescriptionFileName) {
        try {
          await del(`/api/appointments/${appointmentId}/prescription`);
        } catch (deleteErr) {
          console.warn("Failed to delete existing prescription file:", deleteErr);
          // Continue with upload even if delete fails
        }
      }
      
      const formData = new FormData();
      formData.append("file", file);
      if (prescription) {
        formData.append("notes", prescription);
      }

      const response = await post(`/api/appointments/${appointmentId}/prescription-upload`, formData);
      
      if (response.success) {
        // Update prescription file name
        setPrescriptionFileName(file.name);
        toast({
          title: "Prescription uploaded successfully",
          description: prescriptionFileName ? "File replaced successfully." : "File uploaded and saved.",
        });
      } else {
        console.error("Prescription upload failed:", response.message);
        toast({
          title: "Upload failed",
          description: response.message || "Failed to upload prescription. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error uploading prescription:", err);
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to upload prescription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPrescription(false);
    }
  };

  // Delete prescription file from backend
  const handleDeletePrescriptionFile = async () => {
    if (!appointmentId || !prescriptionFileName) return;

    try {
      setIsDeletingPrescription(true);
      const response = await del(`/api/appointments/${appointmentId}/prescription`);
      
      if (response.success) {
        setPrescriptionFileName(null);
        toast({
          title: "Prescription deleted successfully",
          description: "File removed from records.",
        });
      } else {
        toast({
          title: "Delete failed",
          description: response.message || "Failed to delete prescription. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting prescription:", err);
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Failed to delete prescription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingPrescription(false);
    }
  };


  // Debounced autosave for consultation details
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Skip autosave on initial mount
    }
    
    if (!queueEntryId && !queueIdParam) return;
    
    const timeoutId = setTimeout(() => {
      saveConsultationDetails();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescription, prescribedTest, diagnosis, treatment, followUp, notes, aiRecommendations, queueEntryId, queueIdParam]);

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
        const transcriptionStatus = response.data.transcription.transcriptionStatus;
        setTranscriptionStatus(transcriptionStatus === "empty" ? "empty" : status);

        if (status === "processed" && transcriptionStatus !== "empty") {
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
    if (!aiQuery.trim() || isAiLoading) return;

    const mongoPatientId = resolvedPatientObjectId || (patient as any)?._id;
    if (!mongoPatientId) {
      toast({
        title: "Patient not loaded",
        description: "Cannot run AI chat without a patient context.",
        variant: "destructive",
      });
      return;
    }

    const userMsg = aiQuery.trim();
    setAiQuery("");
    setAiChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsAiLoading(true);

    try {
      const response = await post<{
        response: string;
        conversationId?: string;
      }>("/api/ai/chat", {
        query: userMsg,
        patientId: mongoPatientId,
        appointmentId: appointmentId || undefined,
        conversationId: aiConversationId || undefined,
        context: JSON.stringify({
          sessionNotes: notes,
          workingDiagnosis: diagnosis,
          treatmentPlanDraft: treatment,
        }),
      });

      if (response.success && response.data) {
        const answer = response.data.response || "";
        if (response.data.conversationId) {
          setAiConversationId(response.data.conversationId);
        }
        setAiChatMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      } else {
        setAiChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry — no response from the assistant. Please try again.",
          },
        ]);
      }
    } catch (err) {
      console.error("Error getting AI response:", err);
      setAiChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Request failed. Check your connection and try again, or open the browser console for details.",
        },
      ]);
      toast({
        title: "AI chat failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const refreshAiInsights = async () => {
    const mongoPatientId = resolvedPatientObjectId || (patient as any)?._id;
    if (!mongoPatientId) return;
    try {
      setInsightsRefreshing(true);
      const res = await post<{ insights: Record<string, unknown> }>("/api/ai/insights/refresh", {
        patientId: mongoPatientId,
      });
      if (res.success && res.data?.insights && patient) {
        setPatient({ ...patient, insights: res.data.insights as any });
        toast({ title: "Insights updated", description: "Latest cumulative analysis is ready." });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not refresh insights",
        description: e instanceof Error ? e.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setInsightsRefreshing(false);
    }
  };

  const handleEndConsultation = async () => {
    try {
      // Save clinical notes first (these are separate from consultation details)
      await saveClinicalNotes();

      // Prepare recording blob if available
      let recordingBlob: Blob | null = null;
      let recordingDurationSeconds: number | undefined = undefined;
      
      // Always stop recording if it's active before ending consultation
      if (isRecording && mediaRecorderRef.current) {
        console.log("🛑 Stopping recording before ending consultation...");
        
        const recorder = mediaRecorderRef.current;
        
        // Create promise that resolves when recording stops and blob is ready
        const stopPromise = new Promise<Blob | null>((resolve) => {
          const originalOnStop = recorder.onstop;
          
          recorder.onstop = async (event: Event) => {
            // Call original handler to clean up state
            if (originalOnStop) {
              originalOnStop.call(recorder, event);
            }
            
            // Clear interval
            if (recordingInterval) {
              clearInterval(recordingInterval);
              setRecordingInterval(null);
            }
            
            setIsRecording(false);
            setFinalRecordingDuration(recordingDuration);
            
            // Wait a moment for state updates
            await new Promise(r => setTimeout(r, 100));
            
            // Get blob from ref (set by original handler) or create from chunks
            let blob = recordingBlobRef.current;
            if (!blob && audioChunksRef.current.length > 0) {
              blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
              recordingBlobRef.current = blob;
              setAudioBlob(blob);
            }
            
            resolve(blob);
          };
          
          // Stop the recorder
          try {
            recorder.stop();
          } catch (err) {
            console.error("Error stopping recorder:", err);
            resolve(null);
          }
        });
        
        // Wait for recording to stop and blob to be ready
        recordingBlob = await stopPromise;
        
        // Final check - try ref and state again
        if (!recordingBlob) {
          recordingBlob = recordingBlobRef.current || audioBlob;
        }
        
        // Last resort: create from chunks if still no blob
        if (!recordingBlob && audioChunksRef.current.length > 0) {
          recordingBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          recordingBlobRef.current = recordingBlob;
          setAudioBlob(recordingBlob);
          console.log("✅ Created blob from chunks as fallback");
        }
        
        if (recordingBlob) {
          console.log("✅ Recording blob available, size:", recordingBlob.size, "bytes");
        } else {
          console.error("❌ Recording blob not available after stopping recording");
        }
        
        // Calculate duration
        const durationStringToUse = finalRecordingDuration || recordingDuration || "00:00";
        const parts = durationStringToUse.split(":");
        recordingDurationSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1] || "0");
        
        console.log("📊 Recording stopped - Blob:", recordingBlob ? "Available" : "Not available", "Duration:", recordingDurationSeconds, "seconds");
      } else if (audioBlob && !uploadedRecordingId) {
        // Use existing blob if recording was stopped earlier
        recordingBlob = recordingBlobRef.current || audioBlob;
        if (finalRecordingDuration) {
          const parts = finalRecordingDuration.split(":");
          recordingDurationSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1] || "0");
        } else if (recordingDuration) {
          // Use current recordingDuration state if finalRecordingDuration not yet set
          const durationParts = recordingDuration.split(":");
          recordingDurationSeconds = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1] || "0");
        }
      }

      // If we have appointment ID, use the new complete-consultation endpoint
      // This handles everything in one call: consultation data + recording upload (in background)
      if (appointmentId) {
        const formData = new FormData();
        
        // Add consultation details
        const targetQueueId = queueEntryId || queueIdParam;
        if (targetQueueId) {
          formData.append("queue_id", targetQueueId);
        }
        // Always append fields, use empty string or default if not provided
        formData.append("prescribed_test", prescribedTest || "");
        formData.append("diagnosis", diagnosis || "");
        formData.append("treatment_plan", treatment || "");
        formData.append("follow_up_instructions", followUp || "");
        formData.append("detailed_notes", notes || "");
        if (aiRecommendations) {
          const aiRecStr = typeof aiRecommendations === 'string' 
            ? aiRecommendations 
            : JSON.stringify(aiRecommendations);
          formData.append("ai_recommendations", aiRecStr);
        }
        formData.append("prescription", prescription || "");
        
        // Add recording if available
        if (recordingBlob && recordingDurationSeconds && recordingDurationSeconds > 0) {
          console.log("📤 Adding recording to formData - Size:", recordingBlob.size, "bytes, Duration:", recordingDurationSeconds, "seconds");
          formData.append("recording_file", recordingBlob, "consultation-recording.wav");
          formData.append("recording_duration", recordingDurationSeconds.toString());
        } else {
          console.warn("⚠️ Recording not included - Blob:", !!recordingBlob, "Duration:", recordingDurationSeconds);
        }

        try {
          await post(`/api/appointments/${appointmentId}/complete-consultation`, formData);
          // Success - recording upload happens in background, user can navigate away
        } catch (err) {
          console.error("Failed to complete consultation:", err);
          // Still allow navigation - consultation details are saved
        }
      } else {
        // Fallback: if no appointment ID, use old method
        await saveConsultationDetails();

        const targetQueueId = queueEntryId || queueIdParam;
        if (targetQueueId) {
          try {
            await put(`/api/queue/${targetQueueId}/status`, {
              status: "checkout-pending",
            });
          } catch (err) {
            console.error("Failed to update queue status:", err);
          }
        }
        
        // Also update appointment status if we have appointmentId
        if (appointmentId) {
          try {
            await patch(`/api/appointments/${appointmentId}/status`, {
              status: "checkout-pending",
            });
          } catch (err) {
            console.error("Failed to update appointment status:", err);
          }
        }

        // Upload recording separately if available
        if (recordingBlob && !uploadedRecordingId) {
          // Upload in background without blocking
          void uploadRecording().catch((err) =>
            console.error("Failed to upload recording:", err)
          );
        }
      }

      // Set flag to indicate consultation completed
      sessionStorage.setItem("consultationCompleted", "true");
    } catch (err) {
      console.error("Error completing consultation:", err);
      // Still set the flag so user can navigate away
      sessionStorage.setItem("consultationCompleted", "true");
    }
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

  // Show consent error popup
  if (consentError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Blurred background */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
          onClick={() => navigate("/doctor-workstation")}
        />
        
        {/* Consent popup */}
        <div 
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 z-10 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
              <AlertCircleIcon className="w-10 h-10 text-yellow-600 dark:text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Consent Not Granted
            </h2>
            <div className="space-y-3 mb-6">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {consentError.message}
              </p>
              {consentError.patientEmail && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Consent request was sent to:
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">
                    {consentError.patientEmail}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/doctor-workstation");
              }}
              className="flex-1 bg-[#00C4B3] hover:bg-[#00a896] text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Back to Work Station
            </Button>
          </div>
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
    // Active medications: from patient record (currentMedications). patient_medical_history
    // stores medicalHistory/familyHistory/previousSurgeries; medications live on the patient.
    medications: (() => {
      const p = patient as any;
      const raw =
        Array.isArray(p.currentMedications)
          ? p.currentMedications
          : Array.isArray(p.currentMedication)
          ? p.currentMedication
          : Array.isArray(p.medications)
          ? p.medications
          : typeof p.currentMedication === "string" && p.currentMedication.trim()
          ? p.currentMedication.split(",").map((e: string) => e.trim()).filter(Boolean)
          : [];
      return raw.map((entry: unknown) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const o = entry as Record<string, unknown>;
          const name =
            (o.name as string) ??
            (o.medicationName as string) ??
            (o.medicine as string) ??
            (o.drug as string) ??
            "Medication";
          const dosage = o.dosage as string | undefined;
          const frequency = o.frequency as string | undefined;
          const duration = o.duration as string | undefined;
          if (!dosage && !frequency && !duration) return name;
          return { name, dosage, frequency, duration };
        }
        return "Medication";
      });
    })(),
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

        {/* HIPAA: Patient details link only available during active consultation */}
        {Boolean(queueEntryId || queueIdParam) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!(queueEntryId || queueIdParam)) return;
                setPatientDetailsOpen(true);
              }}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        )}
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-3">
          {!isRecording && !audioBlob && (
            <Button
              onClick={startRecording}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isUploading}
            >
              <CheckCircleIcon className="w-4 h-4" />
              Start Consultation
            </Button>
          )}

          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono text-red-700 dark:text-red-400">
                Recording: {recordingDuration}
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
              {transcriptionStatus === "empty" && (
                <>
                  <AlertCircleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Nothing to transcribe
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    (No speech detected)
                  </span>
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

          {(isRecording || audioBlob) && (
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
          )}
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

      {/* Patient details bottom-sheet (keeps consultation mounted so recording continues) */}
      <Dialog open={patientDetailsOpen} onOpenChange={setPatientDetailsOpen}>
        <DialogContent className="p-0 w-[100vw] sm:w-[95vw] max-w-6xl h-[92vh] fixed bottom-0 top-auto left-1/2 -translate-x-1/2 translate-y-0 rounded-t-2xl rounded-b-none overflow-hidden data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom">
          <DialogHeader className="px-4 py-3 border-b">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-base">
                Patient Details
                {patient?.fullName ? (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    • {patient.fullName}
                  </span>
                ) : null}
              </DialogTitle>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#00C4B3] to-cyan-500 text-white shadow-sm hover:from-[#009C8F] hover:to-cyan-600 focus-visible:ring-2 focus-visible:ring-[#00C4B3]/40"
                  onClick={() => setPatientDetailsOpen(false)}
                >
                  Back to Consultation
                </Button>
                <Button
                  size="icon"
                  className="h-9 w-9 border border-[#00C4B3]/50 text-[#00C4B3] bg-[#00C4B3]/10 hover:bg-[#00C4B3]/20 hover:text-[#0f766e] shadow-sm focus-visible:ring-2 focus-visible:ring-[#00C4B3]/40"
                  onClick={() => setPatientDetailsOpen(false)}
                  aria-label="Close patient details"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="h-[calc(92vh-56px)] bg-background">
            <iframe
              title="Patient Overview"
              className="w-full h-full"
              src={(() => {
                const qid = queueEntryId || queueIdParam || "";
                const idForOverview = resolvedPatientObjectId || patientId || "";
                const params = new URLSearchParams();
                if (qid) params.set("queueId", qid);
                if (appointmentId) params.set("appointmentId", appointmentId);
                params.set("embedded", "1");
                return `/embedded/patient-overview/${encodeURIComponent(
                  idForOverview
                )}?${params.toString()}`;
              })()}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - AI Analysis & Lab Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Analysis Section - Main Focus */}
          <Card className="border-border shadow-md bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex flex-wrap items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  AI Health Analysis
                  <Badge
                    variant="outline"
                    className="text-xs bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700"
                  >
                    Cumulative history
                  </Badge>
                  {insightsMeta?.status === "pending" && (
                    <Badge variant="secondary" className="text-xs">
                      Updating…
                    </Badge>
                  )}
                  {insightsMeta?.status === "failed" && (
                    <Badge variant="destructive" className="text-xs">
                      Last refresh failed
                    </Badge>
                  )}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={insightsRefreshing || !resolvedPatientObjectId}
                  onClick={() => void refreshAiInsights()}
                >
                  {insightsRefreshing ? (
                    <>
                      <Loader2Icon className="w-4 h-4 mr-1 animate-spin" />
                      Refreshing
                    </>
                  ) : (
                    "Refresh insights"
                  )}
                </Button>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-2">{aiAnalysis.disclaimer}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(aiAnalysis.insightsSource === "none" || aiAnalysis.insightsSource === "empty") && (
                <div className="rounded-lg border border-dashed border-purple-300/80 bg-purple-50/40 dark:bg-purple-950/20 p-4 text-sm text-muted-foreground">
                  {aiAnalysis.insightsSource === "none"
                    ? "No AI insights yet for this patient. They are generated when an appointment is booked or after check-in. Use Refresh insights to run them now."
                    : "Insights are still empty or pending. Try Refresh insights, or wait for the background job to finish after booking/check-in."}
                </div>
              )}

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
                    {typeof aiAnalysis.riskLevel === "string"
                      ? aiAnalysis.riskLevel.toUpperCase()
                      : "—"}
                  </Badge>
                </div>
                {aiAnalysis.riskAssessment ? (
                  <p className="text-sm text-amber-900 dark:text-amber-100/90">{aiAnalysis.riskAssessment}</p>
                ) : null}
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {aiAnalysis.insightsSource === "backend"
                    ? `Model-estimated success outlook: ${aiAnalysis.successRate}`
                    : "Run insights to see risk summary from cumulative records."}
                </p>
              </div>

              {/* Key Findings */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Key Findings
                </h4>
                {aiAnalysis.keyFindings.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-1">
                    {aiAnalysis.insightsSource === "backend"
                      ? "No key findings returned."
                      : "—"}
                  </p>
                ) : (
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
                )}
              </div>

              <Separator />

              {/* AI Recommendations */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  AI Recommendations
                </h4>
                {aiAnalysis.recommendations.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-1">
                    {aiAnalysis.insightsSource === "backend"
                      ? "No recommendations returned."
                      : "—"}
                  </p>
                ) : (
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
                )}
              </div>

              {aiAnalysis.redFlags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                      Red flags to consider
                    </h4>
                    <ul className="space-y-2">
                      {aiAnalysis.redFlags.map((f, i) => (
                        <li
                          key={i}
                          className="text-sm p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {aiAnalysis.clinicalPearls.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Clinical pearls</h4>
                    <ul className="space-y-2">
                      {aiAnalysis.clinicalPearls.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {aiAnalysis.suggestedQuestions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      Suggested questions for the patient
                    </h4>
                    <ul className="space-y-2">
                      {aiAnalysis.suggestedQuestions.map((q, i) => (
                        <li key={i} className="text-sm text-muted-foreground list-disc list-inside">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Lab Results */}
          <LabResultsCard results={labResults} />
        </div>

        {/* Right Column - Quick Info & Consultation Actions */}
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
          prescription={prescription}
          prescribedTest={prescribedTest}
          onNotesChange={setNotes}
          onDiagnosisChange={setDiagnosis}
          onTreatmentChange={setTreatment}
          onFollowUpChange={setFollowUp}
          onPrescriptionChange={setPrescription}
          onPrescribedTestChange={setPrescribedTest}
          onPrescriptionFileUpload={handlePrescriptionUpload}
          isUploadingPrescription={isUploadingPrescription}
          appointmentId={appointmentId}
          patientName={displayPatient.fullName}
          patientId={displayPatient.patientId}
          prescriptionFileName={prescriptionFileName}
          onDeletePrescriptionFile={handleDeletePrescriptionFile}
          isDeletingPrescription={isDeletingPrescription}
        />
      </div>

      {/* Patient Visit History Section - Bottom */}
      <div className="mt-8">
        <PatientVisitHistory
          visits={visitHistory}
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
        <div
          className="fixed bottom-6 right-6 z-50 flex h-[min(100vh-5rem,36rem)] w-[min(100vw-1.5rem,26rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35)] dark:border-slate-700/80 dark:bg-slate-950"
          role="dialog"
          aria-label="AI Medical Assistant chat"
        >
          <div className="relative shrink-0 border-b border-white/10 bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-700 px-4 py-3.5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_55%)]" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 shadow-inner ring-1 ring-white/20">
                  <BotIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white">Chart assistant</h3>
                  <p className="text-[11px] text-white/80">Patient chart &amp; visit history</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiChatOpen(false)}
                className="h-8 w-8 shrink-0 rounded-lg p-0 text-white hover:bg-white/15"
                aria-label="Close chat"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1 bg-gradient-to-b from-slate-50/90 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-950">
            <div className="space-y-3 p-4 pb-2">
              <div className="flex gap-2.5 rounded-xl border border-violet-200/60 bg-white/90 p-3 shadow-sm dark:border-violet-900/40 dark:bg-slate-900/50">
                <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Answers use <span className="font-medium text-slate-800 dark:text-slate-100">retrieved records</span>{" "}
                  for this patient. Undocumented items will be called out.
                </p>
              </div>

              {aiChatMessages.map((m, idx) => (
                <div
                  key={`${m.role}-${idx}`}
                  className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {m.role === "assistant" ? (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md ring-2 ring-white dark:ring-slate-900">
                      <BotIcon className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md ring-2 ring-white dark:ring-slate-900">
                      <UserRound className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "rounded-br-md bg-gradient-to-br from-teal-600 to-cyan-700 text-white"
                        : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                </div>
              ))}

              {isAiLoading && (
                <div className="flex gap-2">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md ring-2 ring-white dark:ring-slate-900">
                    <BotIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200/80 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <span className="sr-only">Assistant is typing</span>
                    <span className="flex gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500" />
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Searching chart…</span>
                  </div>
                </div>
              )}
              <div ref={aiChatEndRef} />
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Ask about history, labs, meds…"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void askAI();
                  }
                }}
                disabled={isAiLoading}
                className="min-h-[52px] max-h-[120px] resize-none rounded-xl border-slate-200 bg-slate-50/80 text-sm focus-visible:ring-violet-500 dark:border-slate-700 dark:bg-slate-900/50"
                rows={2}
              />
              <Button
                type="button"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md transition hover:from-violet-600 hover:to-indigo-700 disabled:opacity-50"
                disabled={isAiLoading || !aiQuery.trim()}
                onClick={() => void askAI()}
                aria-label="Send message"
              >
                {isAiLoading ? (
                  <Loader2Icon className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <SendHorizontal className="h-5 w-5 text-white" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
              Shift+Enter for new line · Enter to send
            </p>
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
