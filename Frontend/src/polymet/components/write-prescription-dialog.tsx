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

          const response = await get<{ data: Patient[] }>("/api/patients?limit=100");
          if (response.success && response.data?.data) {
            setPatients(response.data.data);
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
    if (!searchQuery.trim()) return patients.slice(0, 10); // Show first 10 if no search

    const query = searchQuery.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.fullName.toLowerCase().includes(query) ||
        patient.patientId.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  const addMedication = () => {
    if (currentMed.name && currentMed.dosage) {
      setMedications([
        ...medications,
        { ...currentMed, id: Date.now().toString() },
      ]);
      setCurrentMed({ name: "", dosage: "", frequency: "", duration: "" });
    }
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !diagnosis || medications.length === 0) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const prescriptionData = {
        patientId: selectedPatient._id,
        diagnosis,
        medications: medications.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
        })),
        instructions,
      };

      const response = await post<{ prescription: any }>("/api/prescriptions", prescriptionData);

      if (response.success) {
        onOpenChange(false);
      } else {
        setError(response.message ?? "Failed to create prescription");
      }
    } catch (err) {
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
                    variant="outline"
                    size="sm"
                    onClick={addMedication}
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
                onClick={handleSubmit}
                disabled={
                  !selectedPatient || !diagnosis || medications.length === 0 || isSubmitting
                }
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
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
