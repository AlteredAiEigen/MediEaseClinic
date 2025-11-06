import { useState } from "react";
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
} from "lucide-react";
import { patients } from "@/polymet/data/healthcare-data";
import { PatientVisitHistory } from "@/polymet/components/patient-visit-history";
import { ConsultationSidebar } from "@/polymet/components/consultation-sidebar";
import { LabResultsCard } from "@/polymet/components/lab-results-card";

export function ConsultationSession() {
  const { patientId } = useParams();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState("00:00");
  const [finalRecordingDuration, setFinalRecordingDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [recordingInterval, setRecordingInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Find patient data
  const patient = patients.find((p) => p.id === patientId) || patients[0];

  // Mock appointment timeline data
  const appointmentTimeline = [
    {
      id: "1",
      date: "Today",
      time: "09:00 AM",
      type: "current" as const,
      title: "Hypertension Management",
      description:
        "Regular follow-up for blood pressure monitoring and medication adjustment",
      doctor: "Dr. Robert Smith",
      status: "active" as const,
      prescription: [
        "Lisinopril 10mg - Once daily",
        "Atorvastatin 20mg - Once daily at bedtime",
      ],

      clinicalNotes:
        "Patient reports occasional headaches. Blood pressure reading: 145/95 mmHg. Discussed lifestyle modifications including reduced sodium intake and regular exercise. Medication dosage maintained. Follow-up in 2 weeks.",
    },
    {
      id: "2",
      date: "Dec 20, 2023",
      time: "10:30 AM",
      type: "past" as const,
      title: "Hypertension Follow-up",
      description: "Blood pressure monitoring and medication review",
      doctor: "Dr. Robert Smith",
      status: "completed" as const,
      relativeTime: "3 weeks ago",
      prescription: [
        "Lisinopril 10mg - Once daily",
        "Metformin 500mg - Twice daily",
      ],

      clinicalNotes:
        "BP: 142/92 mmHg. Patient showing good compliance with medication. Discussed importance of regular monitoring. Continue current medication regimen.",
    },
    {
      id: "3",
      date: "Nov 15, 2023",
      time: "02:00 PM",
      type: "past" as const,
      title: "Routine Checkup",
      description: "Annual physical examination and health assessment",
      doctor: "Dr. Robert Smith",
      status: "completed" as const,
      relativeTime: "2 months ago",
      prescription: ["Multivitamin - Once daily"],
      clinicalNotes:
        "Complete physical examination performed. All vitals within normal range. Lab work ordered for cholesterol and glucose levels. Patient advised to maintain healthy lifestyle.",
    },
    {
      id: "4",
      date: "Oct 10, 2023",
      time: "11:00 AM",
      type: "past" as const,
      title: "Lab Work Review",
      description: "Review of blood test results and cholesterol levels",
      doctor: "Dr. Emily Davis",
      status: "completed" as const,
      relativeTime: "3 months ago",
      prescription: ["Atorvastatin 20mg - Once daily"],
      clinicalNotes:
        "Lab results show elevated cholesterol (245 mg/dL). Started patient on Atorvastatin. Discussed dietary modifications and exercise recommendations. Recheck labs in 3 months.",
    },
    {
      id: "5",
      date: "Sep 5, 2023",
      time: "09:30 AM",
      type: "past" as const,
      title: "Medication Adjustment",
      description: "Review and adjustment of current medications",
      doctor: "Dr. Robert Smith",
      status: "completed" as const,
      relativeTime: "4 months ago",
      prescription: ["Lisinopril 10mg - Once daily (increased from 5mg)"],
      clinicalNotes:
        "Patient's blood pressure not adequately controlled on current dose. Increased Lisinopril from 5mg to 10mg. Advised to monitor BP at home and report any side effects.",
    },
  ];

  // Mock AI analysis data
  const aiAnalysis = {
    riskLevel: "moderate",
    keyFindings: [
      "Blood pressure trending upward over last 3 visits",
      "Patient compliance with medication: 85%",
      "Recent lab results show elevated cholesterol",
      "No significant weight changes in past 6 months",
    ],

    recommendations: [
      "Consider adjusting hypertension medication dosage",
      "Schedule follow-up lipid panel in 3 months",
      "Recommend dietary consultation",
      "Monitor blood pressure daily for next 2 weeks",
    ],

    similarCases: 12,
    successRate: "87%",
  };

  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording
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
    } else {
      // Stop recording
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      setFinalRecordingDuration(recordingDuration);
    }
  };

  const handleEndConsultation = () => {
    // Set flag to indicate consultation completed
    sessionStorage.setItem("consultationCompleted", "true");
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header with Patient Info and Controls */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-border">
            <AvatarImage src={patient.avatar} alt={patient.name} />

            <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {patient.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-muted-foreground">
                {patient.age} years • {patient.gender} • ID: {patient.id}
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
            onClick={toggleRecording}
            className="gap-2"
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
          {!isRecording && finalRecordingDuration && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />

              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Recorded: {finalRecordingDuration}
              </span>
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
        <ConsultationSidebar notes={notes} onNotesChange={setNotes} />
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
