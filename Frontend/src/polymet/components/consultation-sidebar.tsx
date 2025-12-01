import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileTextIcon,
  PillIcon,
  FlaskConicalIcon,
} from "lucide-react";
import { useState } from "react";

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
  prescription?: string;
  prescribedTest?: string;
  onNotesChange: (notes: string) => void;
  onDiagnosisChange: (diagnosis: string) => void;
  onTreatmentChange: (treatment: string) => void;
  onFollowUpChange: (followUp: string) => void;
  onPrescriptionChange: (prescription: string) => void;
  onPrescribedTestChange?: (prescribedTest: string) => void;
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
  prescription = "",
  prescribedTest = "",
  onNotesChange,
  onDiagnosisChange,
  onTreatmentChange,
  onFollowUpChange,
  onPrescriptionChange,
  onPrescribedTestChange,
  className = "",
}: ConsultationSidebarProps) {
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [testsOpen, setTestsOpen] = useState(false);

  return (
    <div className={`space-y-6 ${className}`}>
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
              {condition}
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

      {/* Prescription and Tests Section */}
      <Card className="border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Consultation Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buttons Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Write Prescription Button */}
            <button
              type="button"
              onClick={() => setPrescriptionOpen(!prescriptionOpen)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                prescriptionOpen
                  ? "bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700"
                  : "bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800"
              }`}
            >
              <PillIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                Write Prescription
              </span>
            </button>

            {/* Prescribe Tests Button */}
            <button
              type="button"
              onClick={() => setTestsOpen(!testsOpen)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                testsOpen
                  ? "bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700"
                  : "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
              }`}
            >
              <FlaskConicalIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                Prescribe Tests
              </span>
            </button>
          </div>

          {/* Prescription Text Box */}
          {prescriptionOpen && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Prescription Details
              </Label>
              <Textarea
                placeholder="Enter prescription details..."
                value={prescription}
                onChange={(e) => onPrescriptionChange(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
          )}

          {/* Tests Text Box - only show prescribed tests */}
          {testsOpen && onPrescribedTestChange && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Prescribed Tests
              </Label>
              <Textarea
                placeholder="Enter prescribed tests..."
                value={prescribedTest}
                onChange={(e) => onPrescribedTestChange(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
          )}
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
