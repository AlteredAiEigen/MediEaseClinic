import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchIcon, PlusIcon, XIcon, PillIcon, AlertCircleIcon, Loader2 } from "lucide-react";
import { post, get } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";

interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
  age: string;
  gender: string;
  phone: string;
  email?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface WritePrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WritePrescriptionDialog({
  open,
  onOpenChange,
}: WritePrescriptionDialogProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [currentMed, setCurrentMed] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
  });
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch patients when dialog opens
  useEffect(() => {
    if (open) {
      const fetchPatients = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const response = await get<Patient[] | { data: Patient[] }>("/api/patients?limit=100");
          let patientList: Patient[] = [];
          
          if (response.success) {
            // Handle different response formats
            if (Array.isArray(response.data)) {
              patientList = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
              patientList = response.data.data;
            } else if (response.data && Array.isArray((response.data as any)?.items)) {
              patientList = (response.data as any).items;
            }
            
            // Normalize patient data to ensure consistent structure
            const normalizedPatients = patientList.map((patient: any) => ({
              ...patient,
              _id: String(patient._id ?? patient.id ?? patient.patientId ?? ""),
              patientId: patient.patientId ?? patient._id ?? String(patient.id ?? ""),
              fullName: patient.fullName ?? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ?? "Unknown",
              age: patient.age ?? "",
              gender: patient.gender ?? "",
              phone: patient.phone ?? "",
              email: patient.email,
            }));
            
            setPatients(
              [...normalizedPatients].sort((a, b) => a.fullName.localeCompare(b.fullName))
            );
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to load patients";
          setError(message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPatients();
    } else {
      // Reset form when dialog closes
      setSelectedPatient(null);
      setMedications([]);
      setCurrentMed({ name: "", dosage: "", frequency: "", duration: "" });
      setDiagnosis("");
      setInstructions("");
      setSearchQuery("");
      setError(null);
    }
  }, [open]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show all patients if no search, sorted alphabetically
      return patients.slice().sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    const query = searchQuery.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.fullName.toLowerCase().includes(query) ||
        patient.patientId.toLowerCase().includes(query) ||
        patient.phone?.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query)
    ).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [patients, searchQuery]);

  const addMedication = () => {
    if (!currentMed.name || !currentMed.name.trim()) {
      setError("Please enter a medication name");
      return;
    }
    if (!currentMed.dosage || !currentMed.dosage.trim()) {
      setError("Please enter a dosage");
      return;
    }
    
    setMedications([
      ...medications,
      { 
        ...currentMed, 
        id: Date.now().toString(),
        name: currentMed.name.trim(),
        dosage: currentMed.dosage.trim(),
        frequency: currentMed.frequency.trim() || "",
        duration: currentMed.duration.trim() || "",
      },
    ]);
    setCurrentMed({ name: "", dosage: "", frequency: "", duration: "" });
    setError(null); // Clear any previous errors
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  const handleSubmit = async () => {
    console.log("handleSubmit called");
    console.log("Selected patient:", selectedPatient);
    console.log("Diagnosis:", diagnosis);
    console.log("Medications:", medications);
    console.log("User:", user);
    
    // Validate required fields first
    if (!selectedPatient) {
      setError("Please select a patient");
      console.error("Validation failed: No patient selected");
      return;
    }
    
    if (!diagnosis || !diagnosis.trim()) {
      setError("Please enter a diagnosis");
      console.error("Validation failed: No diagnosis");
      return;
    }
    
    if (medications.length === 0) {
      setError("Please add at least one medication");
      console.error("Validation failed: No medications");
      return;
    }

    // Check authentication before submitting
    if (!user?._id && !user?.id) {
      setError("User not authenticated. Please log in again.");
      console.error("Validation failed: No user ID");
      return;
    }

    // All validations passed, proceed with submission
    console.log("All validations passed, submitting...");
    setIsSubmitting(true);
    setError(null);

    try {
      // Ensure doctorId is a string
      const doctorId = String(user._id || user.id || "");
      if (!doctorId) {
        setError("Unable to get doctor ID. Please log in again.");
        setIsSubmitting(false);
        return;
      }

      // Validate and prepare medications - backend requires all fields
      const validatedMedications = medications.map((med, index) => {
        const name = med.name.trim();
        const dosage = med.dosage.trim();
        const frequency = med.frequency.trim() || "Once daily";
        const duration = med.duration.trim() || "30 days";
        
        if (!name) {
          throw new Error(`Medication #${index + 1} is missing a name`);
        }
        if (!dosage) {
          throw new Error(`Medication "${name}" is missing dosage`);
        }
        
        return {
          name,
          dosage,
          frequency,
          duration,
          instructions: instructions.trim() || "",
        };
      });

      const prescriptionData = {
        patientId: String(selectedPatient._id),
        doctorId: doctorId,
        diagnosis: diagnosis.trim(),
        medications: validatedMedications,
        notes: instructions.trim() || "",
      };

      console.log("Submitting prescription:", prescriptionData);

      const response = await post<{ prescription: any }>("/api/prescriptions", prescriptionData);

      console.log("Prescription response:", response);

      if (response.success) {
        // Show success message briefly before closing
        setError(null);
        // Close dialog and reset form
        onOpenChange(false);
        // Optionally show success toast here
      } else {
        const errorMsg = response.message ?? response.errors ?? "Failed to create prescription";
        setError(typeof errorMsg === "string" ? errorMsg : "Failed to create prescription");
      }
    } catch (err) {
      console.error("Error creating prescription:", err);
      const message = err instanceof Error ? err.message : "Failed to create prescription";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Write Prescription
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Left Side - Patient Search */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-border pr-6">
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">
                Search Patient
              </Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading patients...</span>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No patients found</p>
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div
                    key={patient._id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPatient?._id === patient._id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-emerald-500 text-white">
                        {patient.fullName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {patient.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {patient.patientId} • Age {patient.age}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Prescription Details */}
          <div className="w-96 flex flex-col overflow-y-auto">
            <div className="space-y-4 flex-1">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {selectedPatient && (
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-muted-foreground mb-1">
                    Selected Patient
                  </p>
                  <p className="font-semibold">{selectedPatient.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPatient.patientId}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Diagnosis
                </Label>
                <Textarea
                  placeholder="Enter diagnosis..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Medications
                </Label>
                {medications.length === 0 && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Add at least one medication below and click "Add Medication"
                  </p>
                )}
                <div className="space-y-2 mb-3">
                  {medications.map((med) => (
                    <div
                      key={med.id}
                      className="flex items-start gap-2 p-3 rounded-lg bg-muted"
                    >
                      <PillIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{med.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {med.dosage} • {med.frequency} • {med.duration}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(med.id)}
                        className="h-6 w-6 p-0"
                      >
                        <XIcon className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 p-3 rounded-lg border border-dashed border-border">
                  <Input
                    placeholder="Medication name"
                    value={currentMed.name}
                    onChange={(e) =>
                      setCurrentMed({ ...currentMed, name: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && currentMed.name && currentMed.dosage) {
                        e.preventDefault();
                        addMedication();
                      }
                    }}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Dosage"
                      value={currentMed.dosage}
                      onChange={(e) =>
                        setCurrentMed({ ...currentMed, dosage: e.target.value })
                      }
                    />

                    <Input
                      placeholder="Frequency"
                      value={currentMed.frequency}
                      onChange={(e) =>
                        setCurrentMed({
                          ...currentMed,
                          frequency: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Input
                    placeholder="Duration"
                    value={currentMed.duration}
                    onChange={(e) =>
                      setCurrentMed({ ...currentMed, duration: e.target.value })
                    }
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      addMedication();
                    }}
                    disabled={!currentMed.name.trim() || !currentMed.dosage.trim()}
                    className="w-full"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Instructions
                </Label>
                <Textarea
                  placeholder="Special instructions for the patient..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Button clicked - calling handleSubmit");
                  await handleSubmit();
                }}
                disabled={
                  !selectedPatient || 
                  !diagnosis || 
                  !diagnosis.trim() || 
                  medications.length === 0 || 
                  isSubmitting || 
                  (!user?._id && !user?.id)
                }
                title={
                  !selectedPatient ? "Please select a patient" :
                  !diagnosis?.trim() ? "Please enter a diagnosis" :
                  medications.length === 0 ? "Please add at least one medication" :
                  (!user?._id && !user?.id) ? "User not authenticated" :
                  isSubmitting ? "Creating prescription..." :
                  "Create prescription"
                }
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Prescription"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
