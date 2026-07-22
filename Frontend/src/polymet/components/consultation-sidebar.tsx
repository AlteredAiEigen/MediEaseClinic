import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileTextIcon,
  PillIcon,
  FlaskConicalIcon,
  UploadIcon,
  Loader2Icon,
  AlertCircleIcon,
  CheckCircleIcon,
  XIcon,
} from "lucide-react";
import { useState, useRef } from "react";

type MedicationLike =
  | string
  | {
      name?: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
      startDate?: string;
      endDate?: string;
    };

interface ConsultationSidebarProps {
  notes: string;
  diagnosis: string;
  treatment: string;
  followUp: string;
  transcriptionStatus?: string;
  transcriptionText?: string;
  structuredNotes?: any;
  allergies?: string[];
  medications?: MedicationLike[];
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
  onPrescriptionFileUpload?: (file: File) => void;
  isUploadingPrescription?: boolean;
  appointmentId?: string | null;
  patientName?: string;
  patientId?: string;
  prescriptionFileName?: string | null;
  onDeletePrescriptionFile?: () => void;
  isDeletingPrescription?: boolean;
  /** Opens the digital prescription writer panel. Optionally for a specific Rx. */
  onOpenDigitalPrescription?: (prescriptionId?: string) => void;
  /** Draft / sent prescriptions for this consultation visit. */
  digitalPrescriptions?: Array<{
    _id: string;
    diagnosis?: string;
    isActive?: boolean;
    medicationCount?: number;
    updatedAt?: string;
    prescribedAt?: string;
    createdAt?: string;
    statusLabel?: string;
  }>;
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
  onPrescriptionFileUpload,
  isUploadingPrescription = false,
  appointmentId,
  patientName,
  patientId,
  prescriptionFileName = null,
  onDeletePrescriptionFile,
  isDeletingPrescription = false,
  onOpenDigitalPrescription,
  digitalPrescriptions = [],
  className = "",
}: ConsultationSidebarProps) {
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [testsOpen, setTestsOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSizeBytes) {
        alert("File size must be less than 10MB. Please select a smaller file.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      // Allow file selection even if one exists (will replace it)
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (selectedFile && onPrescriptionFileUpload) {
      const fileToUpload = selectedFile;
      
      // Upload the file - this will update prescriptionFileName in parent
      await onPrescriptionFileUpload(fileToUpload);
      
      // Clear selected file and close dialog after successful upload
      setSelectedFile(null);
      setUploadDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      // Clear selected file when closing
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    setUploadDialogOpen(open);
  };

  const handleRemovePendingFile = () => {
    // Clear selected file (cancel selection before upload)
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
                (med, idx) => {
                  let label: string;

                  if (typeof med === "string") {
                    label = med;
                  } else if (med && typeof med === "object") {
                    const parts: string[] = [];
                    if (med.name) parts.push(med.name);
                    if (med.dosage) parts.push(med.dosage);
                    if (med.frequency) parts.push(`x${med.frequency}`);
                    if (med.duration) parts.push(med.duration);
                    if (!parts.length && med.instructions) {
                      parts.push(med.instructions);
                    }
                    label = parts.join(" • ") || "Medication";
                  } else {
                    label = "Medication";
                  }

                  const keyBase =
                    typeof med === "string" ? med : med?.name || "medication";

                  return (
                    <div
                      key={`${keyBase}-${idx}`}
                      className="text-xs text-foreground"
                    >
                      • {label}
                    </div>
                  );
                }
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
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Consultation Actions</CardTitle>
            {/* Common Upload Button for Prescription and Tests */}
            {appointmentId && onPrescriptionFileUpload && (
                <div className="flex flex-col items-end gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadDialogOpen(true)}
                    disabled={isUploadingPrescription}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/40"
                  >
                    {isUploadingPrescription ? (
                      <>
                        <Loader2Icon className="w-3 h-3 mr-1.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-3 h-3 mr-1.5" />
                        Upload Prescription
                      </>
                    )}
                  </Button>
                  {prescriptionFileName && (
                    <span className="text-xs text-muted-foreground font-normal">
                      1 file uploaded
                    </span>
                  )}
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buttons Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Write Prescription — opens digital prescription app in a new window when wired */}
            <button
              type="button"
              onClick={() => {
                if (onOpenDigitalPrescription) {
                  onOpenDigitalPrescription();
                  return;
                }
                setPrescriptionOpen(!prescriptionOpen);
              }}
              className={`relative flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                prescriptionOpen && !onOpenDigitalPrescription
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

          {digitalPrescriptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Prescriptions ({digitalPrescriptions.length})
              </p>
              <div className="space-y-1.5">
                {digitalPrescriptions.map((rx, index) => {
                  const when = rx.updatedAt || rx.prescribedAt || rx.createdAt;
                  const labelDate = when
                    ? new Date(when).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : `Prescription ${index + 1}`;
                  const status =
                    rx.statusLabel ||
                    (rx.isActive === false ? "Sent / archived" : "Draft");
                  return (
                    <button
                      key={rx._id}
                      type="button"
                      onClick={() => onOpenDigitalPrescription?.(rx._id)}
                      className="w-full text-left rounded-md border border-border px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground truncate">
                          {labelDate}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${
                            status.toLowerCase().includes("draft")
                              ? "border-sky-300 text-sky-700"
                              : "border-amber-300 text-amber-800"
                          }`}
                        >
                          {status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {(rx.medicationCount ?? 0) > 0
                          ? `${rx.medicationCount} medicine${(rx.medicationCount ?? 0) === 1 ? "" : "s"}`
                          : "No medicines"}
                        {rx.diagnosis ? ` · ${rx.diagnosis}` : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {onOpenDigitalPrescription && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto py-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setPrescriptionOpen((o) => !o)}
            >
              {prescriptionOpen ? "Hide" : "Add"} chart prescription notes (free text)
            </Button>
          )}

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

      {/* Upload Prescription Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Prescription</DialogTitle>
            <DialogDescription>
              Upload the prescription file (if available) for this patient.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(patientName || patientId) && (
              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium text-sm">
                  {patientName || "Patient"}
                </p>
                {patientId && (
                  <p className="text-xs text-muted-foreground">
                    ID: {patientId}
                  </p>
                )}
              </div>
            )}
            <Alert className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertCircleIcon className="h-5 w-5" />
              <AlertTitle>Upload the prescription if possible</AlertTitle>
              <AlertDescription>
                Keeping a copy of the prescription ensures better continuity of care. Maximum 1 file, 10MB. The file will be saved securely.
              </AlertDescription>
            </Alert>

            {/* Show existing uploaded file */}
            {prescriptionFileName && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Uploaded File</Label>
                <div className="relative p-3 rounded-lg border-2 border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700">
                  <button
                    type="button"
                    onClick={onDeletePrescriptionFile}
                    disabled={isDeletingPrescription || isUploadingPrescription}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400 text-xs font-bold z-10"
                    title="Remove file"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                  <div className="flex items-center gap-2 pr-6">
                    <FileTextIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400 truncate">
                        {prescriptionFileName}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                        ✓ File uploaded
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </div>
            )}

            <div className="space-y-2">
              <Label>Select Prescription File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={isUploadingPrescription}
                className="hidden"
                id="prescription-upload-input"
              />
              <label htmlFor="prescription-upload-input">
                <div className="cursor-pointer">
                  {selectedFile ? (
                    <div className="p-4 rounded-lg border-2 border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FileTextIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          File Selected
                        </span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-auto py-6 px-4 rounded-lg border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-700 dark:hover:border-purple-600 dark:hover:bg-purple-950/30 transition-colors flex flex-col items-center justify-center gap-2">
                      <UploadIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      <div className="text-center">
                        <span className="text-sm font-semibold text-purple-700 dark:text-purple-400 block">
                          Select Prescription File
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Click to upload or scan prescription file
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, PNG supported (Max 10MB)
                      </span>
                    </div>
                  )}
                </div>
              </label>
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePendingFile}
                  disabled={isUploadingPrescription}
                  className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Cancel selection
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, JPG, PNG (Max 1 file, 10MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUploadingPrescription}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploadingPrescription}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isUploadingPrescription ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Upload Prescription
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
