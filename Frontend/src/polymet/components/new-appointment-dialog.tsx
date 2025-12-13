import { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchIcon, CalendarIcon, ClockIcon, AlertCircleIcon, Loader2 } from "lucide-react";
import { post, get, put } from "@/lib/api-client";
import type { BillingItem } from "@/polymet/pages/admin-billing";
import { useToast } from "@/hooks/use-toast";
import { MediEaseLoader } from "@/polymet/components/mediease-loader";

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
  age: string;
  gender: string;
  phone: string;
  email?: string;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  speciality?: string;
}

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAppointment?: any;
  onAppointmentUpdated?: () => void;
}

export function NewAppointmentDialog({
  open,
  onOpenChange,
  editingAppointment,
  onAppointmentUpdated,
}: NewAppointmentDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [bookingKind, setBookingKind] = useState<"doctor" | "lab-test">("doctor");
  const [appointmentType, setAppointmentType] = useState("");
  const [notes, setNotes] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce search query for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient._id === selectedPatientId) ?? null,
    [patients, selectedPatientId]
  );
  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId]
  );

  // Fetch patients and doctors when dialog opens
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          setError(null);

          // Fetch patients
          const patientsResponse = await get<Patient[]>("/api/patients?limit=100");
          if (patientsResponse.success && Array.isArray(patientsResponse.data)) {
            const normalizedPatients = patientsResponse.data.map((patient) => ({
              ...patient,
              _id: String((patient as any)._id ?? (patient as any).id ?? patient.patientId ?? ""),
              patientId:
                patient.patientId ??
                (patient as any).patientId ??
                String((patient as any)._id ?? (patient as any).id ?? ""),
            }));

            setPatients(
              [...normalizedPatients].sort((a, b) => a.fullName.localeCompare(b.fullName))
            );
          }

          // Fetch doctors
          const doctorsResponse = await get<Doctor[]>("/api/doctors?limit=50");
          if (doctorsResponse.success && Array.isArray(doctorsResponse.data)) {
            const normalizedDoctors = doctorsResponse.data.map((doctor) => ({
              ...doctor,
              _id: String((doctor as any)._id ?? (doctor as any).id ?? ""),
            }));

            setDoctors(
              [...normalizedDoctors].sort((a, b) =>
                `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
              )
            );
          }

          // Fetch billing items
          const billingResponse = await get<{ items: BillingItem[] }>("/api/admin/billing-items");
          if (billingResponse.success && billingResponse.data?.items) {
            setBillingItems(billingResponse.data.items);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to load data";
          setError(message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else {
      // Reset form when dialog closes
      setSelectedPatientId("");
      setSelectedDoctorId("");
      setAppointmentDate("");
      setAppointmentTime("");
      setBookingKind("doctor");
      setAppointmentType("");
      setNotes("");
      setSearchQuery("");
      setError(null);
    }
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (editingAppointment && open) {
      setSelectedPatientId(editingAppointment.patientId || "");
      setSelectedDoctorId(editingAppointment.doctorId || "");
      setAppointmentDate(editingAppointment.date || "");
      setAppointmentTime(editingAppointment.time || "");
      setBookingKind(editingAppointment.doctorId ? "doctor" : "lab-test");
      setAppointmentType(editingAppointment.type || "");
      setNotes(editingAppointment.notes || editingAppointment.reason || "");
    }
  }, [editingAppointment, open]);

  const appointmentPricingItems = useMemo(
    () => billingItems.filter((item) => item.category === "appointmentType" && item.isActive),
    [billingItems]
  );

  const labTestPricingItems = useMemo(
    () => billingItems.filter((item) => item.category === "test" && item.isActive),
    [billingItems]
  );

  // Search patients from API when query changes
  useEffect(() => {
    // Require minimum 2 characters before searching to prevent expensive queries
    if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    
    const searchPatients = async () => {
      setIsSearching(true);
      try {
        const response = await get<{ patients: Patient[] }>(
          `/api/patients/search?q=${encodeURIComponent(debouncedSearchQuery)}`
        );
        if (!cancelled && response.success && response.data?.patients) {
          const normalizedResults = response.data.patients.map((patient: any) => ({
            ...patient,
            _id: String(patient._id ?? patient.id ?? patient.patientId ?? ""),
            patientId: patient.patientId ?? String(patient._id ?? patient.id ?? ""),
            fullName: patient.fullName || `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
            age: patient.age || "",
            gender: patient.gender || "",
            phone: patient.phone || "",
            email: patient.email || "",
          }));
          setSearchResults(normalizedResults);
        }
      } catch (err) {
        console.error("Patient search error:", err);
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    };

    searchPatients();
    
    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery]);

  const filteredPatients = useMemo(() => {
    // If there's a search query, use search results
    if (searchQuery.trim()) {
      return searchResults;
    }
    // Otherwise show first 10 patients from initial load
    return patients.slice(0, 10);
  }, [patients, searchQuery, searchResults]);

  const handleSubmit = async () => {
    if (!selectedPatientId || !appointmentDate || !appointmentTime) {
      setError("Please fill in all required fields");
      return;
    }

    if (bookingKind === "doctor" && !selectedDoctorId) {
      setError("Please select a doctor for this appointment");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        patientId: selectedPatientId,
        date: appointmentDate,
        time: appointmentTime,
        type: appointmentType,
        reason:
          bookingKind === "doctor"
            ? appointmentPricingItems.find((i) => i.key === appointmentType)?.label ||
              "Doctor appointment"
            : labTestPricingItems.find((i) => i.key === appointmentType)?.label ||
              "Lab test appointment",
        notes: notes || "",
        bookingKind: bookingKind,
      };

      // Handle doctorId based on booking kind
      if (bookingKind === "doctor" && selectedDoctorId) {
        payload.doctorId = selectedDoctorId;
      } else if (bookingKind === "lab-test") {
        // Explicitly clear doctorId when switching to lab test
        payload.doctorId = null;
      }

      let response;
      if (editingAppointment) {
        // Update existing appointment
        response = await put<{ appointment: unknown }>(
          `/api/appointments/${editingAppointment._id || editingAppointment.id}`,
          payload
        );
      } else {
        // Create new appointment
        response = await post<{ appointment: unknown }>(
          "/api/appointments",
          payload
        );
      }

      if (response.success && response.data?.appointment) {
        setError(null);
        onOpenChange(false);
        if (onAppointmentUpdated) {
          onAppointmentUpdated();
        }
      } else {
        setError(response.message ?? "Failed to create appointment");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create appointment";
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
            {editingAppointment ? "Edit Appointment" : "New Appointment"}
          </DialogTitle>
        </DialogHeader>

        {isSubmitting ? (
          <MediEaseLoader>
            <div className="min-h-[400px] p-6">
              {/* Keep the form visible but dimmed */}
              <div className="opacity-50 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Patient</label>
                    <div className="p-2 border rounded">
                      {patients.find(p => p._id === selectedPatientId)?.fullName}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Doctor</label>
                    <div className="p-2 border rounded">
                      {selectedDoctor
                        ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}`.trim()
                        : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MediEaseLoader>
        ) : (

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
              {isLoading || isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {isSearching ? "Searching..." : "Loading patients..."}
                  </span>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {searchQuery ? "No patients found matching your search" : "No patients found"}
                  </p>
                  {searchQuery && (
                    <p className="text-xs mt-1">Try searching by name, ID, or email</p>
                  )}
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div
                    key={patient._id}
                    onClick={() => setSelectedPatientId(patient._id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPatientId === patient._id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-emerald-500 text-white">
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

          {/* Right Side - Appointment Details */}
          <div className="w-80 flex flex-col">
            <div className="space-y-4 flex-1 overflow-y-auto">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {selectedPatientId && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-muted-foreground mb-1">
                    Selected Patient
                  </p>
                  <p className="font-semibold">{patients.find(p => p._id === selectedPatientId)?.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {patients.find(p => p._id === selectedPatientId)?.patientId}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Booking For
                </Label>
                <Select
                  value={bookingKind}
                  onValueChange={(value: "doctor" | "lab-test") => {
                    setBookingKind(value);
                    setSelectedDoctorId("");
                    setAppointmentType("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor Appointment</SelectItem>
                    <SelectItem value="lab-test">Lab Test Appointment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bookingKind === "doctor" && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Select Doctor
                  </Label>
                  <Select
                    value={selectedDoctorId}
                    onValueChange={(value) => setSelectedDoctorId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor._id} value={doctor._id}>
                          {doctor.firstName} {doctor.lastName} - {doctor.speciality || "General Medicine"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Appointment Date
                </Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                  <Input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Appointment Time
                </Label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                  <Input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {bookingKind === "doctor" ? "Appointment Type" : "Lab Test Type"}
                </Label>
                <Select
                  value={appointmentType}
                  onValueChange={setAppointmentType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${bookingKind === "doctor" ? "appointment type" : "lab test"}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {bookingKind === "doctor"
                      ? appointmentPricingItems.map((item) => (
                          <SelectItem key={item._id} value={item.key}>
                            {item.label}
                          </SelectItem>
                        ))
                      : labTestPricingItems.map((item) => (
                          <SelectItem key={item._id} value={item.key}>
                            {item.label}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Notes (Optional)
                </Label>
                <Textarea
                  placeholder="Add any notes or special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  !selectedPatientId ||
                  (bookingKind === "doctor" && !selectedDoctorId) ||
                  !appointmentDate ||
                  !appointmentTime ||
                  !appointmentType ||
                  isSubmitting
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingAppointment ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingAppointment ? "Update Appointment" : "Create Appointment"
                )}
              </Button>
            </div>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
