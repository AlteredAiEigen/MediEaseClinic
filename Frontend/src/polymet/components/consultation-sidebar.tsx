import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ActivityIcon,
  HeartPulseIcon,
  ThermometerIcon,
  WindIcon,
  FileTextIcon,
} from "lucide-react";

interface ConsultationSidebarProps {
  notes: string;
  diagnosis: string;
  treatment: string;
  followUp: string;
  transcriptionStatus?: string;
  transcriptionText?: string;
  structuredNotes?: any;
  allergies?: string[];
  medications?: string[];
  condition?: string;
  carePlanSummary?: string;
  followUpPlan?: string;
  onNotesChange: (notes: string) => void;
  onDiagnosisChange: (diagnosis: string) => void;
  onTreatmentChange: (treatment: string) => void;
  onFollowUpChange: (followUp: string) => void;
  className?: string;
}

export function ConsultationSidebar({
  notes,
  diagnosis,
  treatment,
  followUp,
  transcriptionStatus,
  transcriptionText,
  structuredNotes,
  allergies = [],
  medications = [],
  condition,
  carePlanSummary,
  followUpPlan,
  onNotesChange,
  onDiagnosisChange,
  onTreatmentChange,
  onFollowUpChange,
  className = "",
}: ConsultationSidebarProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Vitals - Compact Version */}
      <Card className="border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Current Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {/* Blood Pressure */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-1.5 mb-1">
                <HeartPulseIcon className="w-3 h-3 text-red-600 dark:text-red-400" />

                <p className="text-[10px] font-medium text-red-700 dark:text-red-400">
                  BP
                </p>
              </div>
              <p className="text-base font-bold text-red-700 dark:text-red-400">
                145/95
              </p>
              <p className="text-[9px] text-red-600 dark:text-red-400">High</p>
            </div>

            {/* Heart Rate */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20 border border-pink-200 dark:border-pink-800">
              <div className="flex items-center gap-1.5 mb-1">
                <HeartPulseIcon className="w-3 h-3 text-pink-600 dark:text-pink-400" />

                <p className="text-[10px] font-medium text-pink-700 dark:text-pink-400">
                  HR
                </p>
              </div>
              <p className="text-base font-bold text-pink-700 dark:text-pink-400">
                78
              </p>
              <p className="text-[9px] text-pink-600 dark:text-pink-400">bpm</p>
            </div>

            {/* Temperature */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-1.5 mb-1">
                <ThermometerIcon className="w-3 h-3 text-orange-600 dark:text-orange-400" />

                <p className="text-[10px] font-medium text-orange-700 dark:text-orange-400">
                  Temp
                </p>
              </div>
              <p className="text-base font-bold text-orange-700 dark:text-orange-400">
                98.6°F
              </p>
              <p className="text-[9px] text-orange-600 dark:text-orange-400">
                Normal
              </p>
            </div>

            {/* Oxygen Saturation */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-1.5 mb-1">
                <WindIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />

                <p className="text-[10px] font-medium text-blue-700 dark:text-blue-400">
                  SpO2
                </p>
              </div>
              <p className="text-base font-bold text-blue-700 dark:text-blue-400">
                98%
              </p>
              <p className="text-[9px] text-blue-600 dark:text-blue-400">
                Normal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Medical Info */}
      <Card className="border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Allergies */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Allergies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(allergies.length ? allergies : ["None"]).map((item, index) => (
                <Badge
                  key={`${item}-${index}`}
                  variant="outline"
                  className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Current Medications */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Current Medications
            </p>
            <div className="space-y-1.5">
              {(medications.length ? medications : ["No medications recorded"]).map(
                (med, idx) => (
                  <div key={`${med}-${idx}`} className="text-xs text-foreground">
                    • {med}
                  </div>
                )
              )}
            </div>
          </div>

          <Separator />

          {/* Current Condition */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Current Condition
            </p>
            <div className="text-sm text-foreground font-semibold">
              {condition || "Under Observation"}
            </div>
            {carePlanSummary && (
              <p className="text-xs text-muted-foreground mt-1.5">{carePlanSummary}</p>
            )}
            {followUpPlan && (
              <p className="text-xs text-muted-foreground mt-1.5">
                <span className="font-semibold text-foreground">Follow-up:</span>{" "}
                {followUpPlan}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Transcription Results */}
      {transcriptionStatus === "completed" && transcriptionText && (
        <Card className="border-border shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileTextIcon className="w-5 h-5 text-[#00C4B3]" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Raw Transcription */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Transcription</Label>
              <div className="p-3 bg-muted/50 rounded-lg max-h-24 overflow-y-auto">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {transcriptionText}
                </p>
              </div>
            </div>

            {/* Structured Notes */}
            {structuredNotes && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Extracted Notes</Label>
                <div className="space-y-2">
                  {structuredNotes.chiefComplaint && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
                      <span className="font-medium text-blue-700 dark:text-blue-400">Chief Complaint: </span>
                      <span className="text-blue-800 dark:text-blue-300">{structuredNotes.chiefComplaint}</span>
                    </div>
                  )}
                  {structuredNotes.assessment && (
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded text-xs">
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">Assessment: </span>
                      <span className="text-emerald-800 dark:text-emerald-300">{structuredNotes.assessment}</span>
                    </div>
                  )}
                  {structuredNotes.plan && (
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded text-xs">
                      <span className="font-medium text-purple-700 dark:text-purple-400">Plan: </span>
                      <span className="text-purple-800 dark:text-purple-300">{structuredNotes.plan}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Clinical Notes */}
      <Card className="border-border shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Clinical Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diagnosis */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis" className="text-sm font-medium">
              Diagnosis
            </Label>
            <Input
              id="diagnosis"
              placeholder="Primary diagnosis..."
              value={diagnosis}
              onChange={(e) => onDiagnosisChange(e.target.value)}
            />
          </div>

          {/* Treatment Plan */}
          <div className="space-y-2">
            <Label htmlFor="treatment" className="text-sm font-medium">
              Treatment Plan
            </Label>
            <Textarea
              id="treatment"
              placeholder="Treatment recommendations and medications..."
              value={treatment}
              onChange={(e) => onTreatmentChange(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Follow-up */}
          <div className="space-y-2">
            <Label htmlFor="followUp" className="text-sm font-medium">
              Follow-up Instructions
            </Label>
            <Input
              id="followUp"
              placeholder="When to follow up, what to monitor..."
              value={followUp}
              onChange={(e) => onFollowUpChange(e.target.value)}
            />
          </div>

          {/* Detailed Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Detailed Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional observations, patient concerns, and clinical details..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {notes.length + diagnosis.length + treatment.length + followUp.length} characters total
            </p>
            <Button size="sm" variant="outline">
              Save Draft
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
