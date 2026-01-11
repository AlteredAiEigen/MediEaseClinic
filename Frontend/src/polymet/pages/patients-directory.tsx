import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircleIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FilterIcon,
  HeartPulseIcon,
  MailIcon,
  PhoneIcon,
  SearchIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { get, post } from "@/lib/api-client";
import { MediEaseLoader } from "@/components/mediease-loader";
import { fetchPatients, PatientSummary } from "@/lib/api/patients";

// Custom hook for debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

type PatientsDirectoryMode = "admin" | "doctor" | "receptionist";

type PatientStatus = "in-clinic" | "remote";

interface UiPatient {
  recordId: string;
  patientId: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  personalEmail: string;
  medieaseEmail: string;
  status: PatientStatus;
  avatar: string;
  createdAt?: string;
}

interface PatientsDirectoryProps {
  mode?: PatientsDirectoryMode;
}

const createAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random&color=ffffff`;

const generateMediEaseEmailForPatient = (patient: PatientSummary, fullName: string) => {
  const safePart = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");

  const first =
    patient.firstName?.trim() ||
    (fullName.split(" ").filter(Boolean)[0] ?? "").trim();
  const last =
    patient.lastName?.trim() ||
    (fullName.split(" ").filter(Boolean).slice(1).join(" ") ?? "").trim();

  const local =
    [safePart(first), safePart(last)].filter(Boolean).join(".") ||
    safePart(patient.patientId || patient._id || "patient");

  return `${local}@mediease.com`;
};

const mapApiPatientToUi = (patient: PatientSummary): UiPatient => {
  const status: PatientStatus = patient.presentInClinic ? "in-clinic" : "remote";
  const name =
    patient.fullName?.trim() ||
    [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
    "Unknown";

  const personalEmail =
    (patient.email && patient.email.trim()) ? patient.email.trim() : "Not provided";
  const medieaseEmail =
    ((patient as any)?.medieaseClinicEmail && String((patient as any).medieaseClinicEmail).trim())
      ? String((patient as any).medieaseClinicEmail).trim()
      : generateMediEaseEmailForPatient(patient, name);

  return {
    recordId: patient._id,
    patientId: patient.patientId || patient._id,
    name,
    age: patient.age || "—",
    gender: patient.gender || "—",
    phone: patient.phone || "Not provided",
    personalEmail,
    medieaseEmail,
    status,
    avatar: createAvatarUrl(name),
    createdAt: (patient as any)?.createdAt,
  };
};

type NewPatientForm = {
  name: string;
  age: string;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  bloodGroup: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  address: string;
  dateOfBirth: string;
};

const emptyNewPatientState: NewPatientForm = {
  name: "",
  age: "",
  gender: "Male",
  phone: "",
  email: "",
  bloodGroup: "O+",
  address: "",
  dateOfBirth: "",
};

const statusLabels: Record<PatientStatus, string> = {
  "in-clinic": "In Clinic",
  remote: "Remote Follow-up",
};

export function PatientsDirectory({ mode = "doctor" }: PatientsDirectoryProps) {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [phoneFilter, setPhoneFilter] = useState("");
  const [dateOfBirthFilter, setDateOfBirthFilter] = useState("");
  const [addressFilter, setAddressFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const debouncedAddressFilter = useDebounce(addressFilter, 300);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [patientsList, setPatientsList] = useState<UiPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const [totalPatients, setTotalPatients] = useState(0);
  const [inClinicToday, setInClinicToday] = useState(0);
  const [newPatientsThisWeek, setNewPatientsThisWeek] = useState(0);
  const [appointmentsThisWeek, setAppointmentsThisWeek] = useState(0);
  const [appointmentsToday, setAppointmentsToday] = useState(0);

  const [newPatient, setNewPatient] = useState({ ...emptyNewPatientState });
  const [statsTotalPatients, setStatsTotalPatients] = useState<number | null>(null);

  const canAddPatientInline = mode === "admin";
  const canRegisterPatient = mode === "receptionist";
  const canConsult = mode === "doctor";

  const appointmentsPath =
    mode === "receptionist"
      ? "/receptionist-appointments"
      : mode === "doctor"
      ? "/doctor-appointments"
      : "/admin-appointments";

  // Helper function to check if phone number is complete (10 digits minimum)
  const isPhoneComplete = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, "");
    const normalized =
      digits.startsWith("91") && digits.length > 10 ? digits.slice(2) : digits;
    return normalized.length >= 10;
  };

  // Helper function to check if date of birth is complete (YYYY-MM-DD format)
  const isDateOfBirthComplete = (dob: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}$/.test(dob.trim());
  };

  // Helper function to check if email is complete/valid
  const isEmailComplete = (email: string): boolean => {
    const trimmed = email.trim();
    if (!trimmed) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
  };

  // Only use phone filter if it's complete (10+ digits)
  const effectivePhoneFilter = isPhoneComplete(phoneFilter) ? phoneFilter : "";
  const debouncedPhoneFilter = useDebounce(effectivePhoneFilter, 500);

  // Only use date of birth filter if it's complete (YYYY-MM-DD format)
  const effectiveDateOfBirthFilter = isDateOfBirthComplete(dateOfBirthFilter)
    ? dateOfBirthFilter
    : "";
  const debouncedDateOfBirthFilter = useDebounce(effectiveDateOfBirthFilter, 500);

  // Only use email filter if it's complete/valid
  const effectiveEmailFilter = isEmailComplete(emailFilter) ? emailFilter.trim() : "";
  const debouncedEmailFilter = useDebounce(effectiveEmailFilter, 500);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearchQuery,
    filterStatus,
    debouncedPhoneFilter,
    debouncedDateOfBirthFilter,
    debouncedAddressFilter,
    debouncedEmailFilter,
  ]);

  useEffect(() => {
    let ignore = false;

    const fetchPatientsList = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const presentInClinic =
          filterStatus === "all"
            ? undefined
            : filterStatus === "in-clinic"
            ? true
            : false;

        const response = await fetchPatients({
          limit: pageSize,
          page,
          search: debouncedSearchQuery.trim() ? debouncedSearchQuery.trim() : undefined,
          phone: debouncedPhoneFilter || undefined,
          dateOfBirth: debouncedDateOfBirthFilter || undefined,
          address: debouncedAddressFilter.trim() ? debouncedAddressFilter.trim() : undefined,
          email: debouncedEmailFilter || undefined,
          presentInClinic,
        });

        if (ignore) return;

        const total = response.total ?? response.patients.length;
        const totalPagesCalc =
          pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

        setTotalPages(totalPagesCalc);
        setPatientsList(response.patients.map(mapApiPatientToUi));

        // Calculate new patients this week from returned page (best-effort)
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        const newThisWeek = response.patients.filter((p) => {
          const createdAt = (p as any)?.createdAt;
          if (!createdAt) return false;
          try {
            const createdDate = new Date(createdAt);
            return createdDate >= weekAgo && !isNaN(createdDate.getTime());
          } catch {
            return false;
          }
        }).length;

        setNewPatientsThisWeek(newThisWeek);

        if (!debouncedSearchQuery.trim()) {
          setTotalPatients(total);
          setStatsTotalPatients(total);
        }
      } catch (error) {
        if (ignore) return;
        const message = error instanceof Error ? error.message : "Unable to load patients.";
        setFetchError(message);
        setPatientsList([]);
        setTotalPages(1);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchPatientsList();

    return () => {
      ignore = true;
    };
  }, [
    debouncedSearchQuery,
    page,
    pageSize,
    filterStatus,
    debouncedPhoneFilter,
    debouncedDateOfBirthFilter,
    debouncedAddressFilter,
    debouncedEmailFilter,
  ]);

  // Helper to extract list from API response
  const extractList = <T,>(rawData: any): T[] => {
    if (Array.isArray(rawData)) return rawData as T[];
    if (rawData && Array.isArray(rawData.data)) return rawData.data as T[];
    if (rawData && Array.isArray(rawData.items)) return rawData.items as T[];
    if (rawData && Array.isArray(rawData.patients)) return rawData.patients as T[];
    if (rawData && Array.isArray(rawData.queue)) return rawData.queue as T[];
    return [];
  };

  // Fetch queue entries for "In Clinic Today" and appointments for stats
  useEffect(() => {
    let ignore = false;

    const fetchQueueAndAppointments = async () => {
      try {
        const formatDateLocal = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const today = new Date();
        const weekStart = new Date(today);
        const dayOfWeek = today.getDay(); // Sunday = 0
        weekStart.setDate(today.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const todayStr = formatDateLocal(today);
        const weekStartStr = formatDateLocal(weekStart);
        const weekEndStr = formatDateLocal(weekEnd);

        // Use trailing slash to avoid 307 redirects that can interfere with some proxies/caches.
        const queueResponse = await get<any>("/api/queue/");
        if (!ignore && queueResponse.success) {
          const queueList = extractList<any>(queueResponse.data);

          const todayQueueEntries = queueList.filter((entry: any) => {
            const checkedInAt = entry.checked_in_at || entry.checkedInAt;
            if (!checkedInAt) return false;

            const entryDate = new Date(checkedInAt);
            const entryDateStr = entryDate.toISOString().split("T")[0];
            const isToday = entryDateStr === todayStr;

            const status = String(entry.status || "").toLowerCase();
            const isInClinic = ["waiting", "in-consultation", "completed"].includes(
              status
            );

            return isToday && isInClinic;
          });

          const uniquePatients = new Set(
            todayQueueEntries
              .map((entry: any) => {
                const patientId =
                  entry.patient?._id || entry.patient || entry.patientId;
                return patientId ? String(patientId) : null;
              })
              .filter((id: string | null) => id !== null)
          );
          setInClinicToday(uniquePatients.size);
        }

        // Fetch appointments with best-effort pagination
        let allAppointments: any[] = [];
        let pageNum = 1;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          const appointmentsResponse = await get<any>(
            `/api/appointments?limit=${limit}&page=${pageNum}`
          );

          if (!appointmentsResponse.success) break;

          const appointments = Array.isArray(appointmentsResponse.data)
            ? appointmentsResponse.data
            : extractList<any>(appointmentsResponse.data);

          allAppointments = allAppointments.concat(appointments);

          const pagination = (appointmentsResponse as any).pagination;
          if (pagination?.totalPages) {
            hasMore = pageNum < pagination.totalPages;
            pageNum++;
          } else {
            hasMore = appointments.length === limit;
            pageNum++;
          }

          if (pageNum > 10) break; // safety
        }

        if (ignore) return;

        const todayCount = allAppointments.filter((apt: any) => apt.date === todayStr)
          .length;
        const weekCount = allAppointments.filter((apt: any) => {
          if (!apt.date) return false;
          const aptDate = String(apt.date);
          return aptDate >= weekStartStr && aptDate <= weekEndStr;
        }).length;

        setAppointmentsToday(todayCount);
        setAppointmentsThisWeek(weekCount);
      } catch {
        if (ignore) return;
        setAppointmentsToday(0);
        setAppointmentsThisWeek(0);
        setInClinicToday(0);
      }
    };

    fetchQueueAndAppointments();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredPatients = useMemo(() => patientsList, [patientsList]);

  const getStatusBadge = (status: PatientStatus) => {
    switch (status) {
      case "in-clinic":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "remote":
      default:
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400";
    }
  };

  const handleAddPatient = async () => {
    setSubmissionError(null);
    if (!newPatient.name.trim()) {
      setSubmissionError("Please provide the patient's full name.");
      return;
    }
    if (!newPatient.email.trim()) {
      setSubmissionError("Email address is required.");
      return;
    }
    if (!newPatient.phone.trim()) {
      setSubmissionError("Phone number is required.");
      return;
    }
    if (!newPatient.dateOfBirth) {
      setSubmissionError("Date of birth is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const [firstName, ...rest] = newPatient.name.trim().split(" ");
      const lastName = rest.length > 0 ? rest.join(" ") : firstName;

      const payload = {
        firstName,
        lastName: lastName || firstName,
        gender: newPatient.gender,
        age: newPatient.age || "0",
        bloodGroup: newPatient.bloodGroup,
        dateOfBirth: newPatient.dateOfBirth,
        email: newPatient.email,
        phone: newPatient.phone,
        address: newPatient.address,
      };

      const response = await post<{ patient: any }>("/api/patients", payload);

      if (response.success && response.data?.patient) {
        setPatientsList((prev) => [
          mapApiPatientToUi(response.data.patient as PatientSummary),
          ...prev,
        ]);
        setAddPatientDialogOpen(false);
        setNewPatient({ ...emptyNewPatientState });
        setSubmissionError(null);
      } else {
        setSubmissionError(response.message ?? "Unable to add patient. Please try again.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add patient. Please try again.";
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-border bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Patients
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {statsTotalPatients ?? totalPatients}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-teal-500 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Clinic Today
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {inClinicToday}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                <HeartPulseIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  New This Week
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {newPatientsThisWeek}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Appointments This Week
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {appointmentsThisWeek}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Today: {appointmentsToday}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-[#00C4B3]" />
            Patient Records
          </CardTitle>

          {canAddPatientInline ? (
            <Dialog
              open={addPatientDialogOpen}
              onOpenChange={(open) => {
                setAddPatientDialogOpen(open);
                if (!open) {
                  setSubmissionError(null);
                  setIsSubmitting(false);
                  setNewPatient({ ...emptyNewPatientState });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white">
                  <UserPlusIcon className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                  <DialogTitle>Add New Patient</DialogTitle>
                  <DialogDescription>
                    Register a new patient in the system
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={newPatient.name}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter age"
                      value={newPatient.age}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, age: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={newPatient.gender}
                      onValueChange={(value) =>
                        setNewPatient({
                          ...newPatient,
                          gender: value as NewPatientForm["gender"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={newPatient.dateOfBirth}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select
                      value={newPatient.bloodGroup}
                      onValueChange={(value) =>
                        setNewPatient({
                          ...newPatient,
                          bloodGroup: value as NewPatientForm["bloodGroup"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="Enter phone number"
                      value={newPatient.phone}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                    <Input
                      id="email"
                      type="email"
                    required
                      placeholder="Enter email"
                      value={newPatient.email}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter address"
                      value={newPatient.address}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, address: e.target.value })
                      }
                    />
                  </div>
                </div>
                {submissionError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {submissionError}
                  </div>
                )}
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddPatientDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddPatient}
                    className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding..." : "Add Patient"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : canRegisterPatient ? (
            <Button
              className="bg-gradient-to-r from-[#00C4B3] to-[#10b981] hover:from-[#009C8F] hover:to-[#059669] text-white"
              onClick={() => navigate("/register-patient")}
            >
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Register Patient
            </Button>
          ) : null}
        </CardHeader>

        <CardContent>
          {fetchError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {fetchError}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-clinic">In Clinic</SelectItem>
                  <SelectItem value="remote">Remote Follow-up</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="whitespace-nowrap"
              >
                {showAdvancedFilters ? (
                  <>
                    <ChevronUpIcon className="w-4 h-4 mr-2" />
                    Hide Filters
                  </>
                ) : (
                  <>
                    <FilterIcon className="w-4 h-4 mr-2" />
                    More Filters
                  </>
                )}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-filter">Phone Number</Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone-filter"
                      placeholder="Enter full 10-digit number"
                      value={phoneFilter}
                      onChange={(e) => setPhoneFilter(e.target.value)}
                      className="pl-10"
                      maxLength={15}
                    />
                    {phoneFilter && (
                      <button
                        type="button"
                        onClick={() => setPhoneFilter("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                    {phoneFilter && !isPhoneComplete(phoneFilter) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter at least 10 digits to search
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob-filter">Date of Birth</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Input
                      id="dob-filter"
                      type="date"
                      value={dateOfBirthFilter}
                      onChange={(e) => setDateOfBirthFilter(e.target.value)}
                      className="pl-10"
                    />
                    {dateOfBirthFilter && (
                      <button
                        type="button"
                        onClick={() => setDateOfBirthFilter("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                    {dateOfBirthFilter && !isDateOfBirthComplete(dateOfBirthFilter) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Please select a complete date
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address-filter">Address</Label>
                  <div className="relative">
                    <Input
                      id="address-filter"
                      placeholder="Enter address..."
                      value={addressFilter}
                      onChange={(e) => setAddressFilter(e.target.value)}
                    />
                    {addressFilter && (
                      <button
                        type="button"
                        onClick={() => setAddressFilter("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-filter">Email Address</Label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Input
                      id="email-filter"
                      type="email"
                      placeholder="Enter complete email"
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value)}
                      className="pl-10"
                    />
                    {emailFilter && (
                      <button
                        type="button"
                        onClick={() => setEmailFilter("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                    {emailFilter && !isEmailComplete(emailFilter) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter a complete email address to search
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <MediEaseLoader message="Loading patient records..." />
          ) : (
            <>
              {/* Patients Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredPatients.map((patient) => {
                  return (
                    <div
                      key={patient.recordId}
                      className="border border-border/70 bg-white dark:bg-background shadow-sm hover:shadow-md transition-all hover:border-[#00C4B3]/40 rounded-2xl h-full"
                    >
                      <CardContent className="p-6 flex flex-col h-full space-y-4">
                        <div className="flex items-start gap-3">
                          {/* Small avatar on the left */}
                          <Avatar className="w-10 h-10 border border-[#00C4B3]/30 shadow-xs flex-shrink-0">
                            <AvatarImage src={patient.avatar} alt={patient.name} />
                            <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white text-xs">
                              {patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-foreground leading-tight line-clamp-1 break-words">
                                  {patient.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  ID: {patient.patientId}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 space-y-2 text-[11px] leading-snug text-muted-foreground">
                              <div className="flex items-center gap-2 min-w-0">
                                <UserIcon className="w-3 h-3 shrink-0" />
                                <span className="whitespace-nowrap">
                                  Gender:{" "}
                                  <span className="text-foreground/80">{patient.gender}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 min-w-0">
                                <CalendarIcon className="w-3 h-3 shrink-0" />
                                <span className="whitespace-nowrap">
                                  Age:{" "}
                                  <span className="text-foreground/80">{patient.age} years</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 min-w-0">
                                <PhoneIcon className="w-3 h-3 shrink-0" />
                                <span className="break-all whitespace-normal">
                                  {patient.phone}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 min-w-0">
                                <MailIcon className="w-3 h-3 shrink-0" />
                                <span className="break-all whitespace-normal">
                                  Email: {patient.personalEmail}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 min-w-0">
                                <MailIcon className="w-3 h-3 shrink-0" />
                                <span className="break-all whitespace-normal">
                                  MediEase: {patient.medieaseEmail}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border/60 mt-auto">
                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full max-w-[220px] border-[#00C4B3] text-[#0f766e] hover:bg-[#00C4B3]/10"
                              onClick={() => {
                                // Open the same "New Appointment" form from the appointments page,
                                // with the patient preselected via ?patientId=
                                navigate(
                                  `${appointmentsPath}?patientId=${encodeURIComponent(
                                    patient.recordId
                                  )}`
                                );
                              }}
                            >
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              Schedule
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {filteredPatients.length === 0 && !fetchError && (
                <div className="text-center py-12">
                  <AlertCircleIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No patients found</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


