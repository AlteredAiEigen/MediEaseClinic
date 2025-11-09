import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  SearchIcon,
  UserPlusIcon,
  UsersIcon,
  ActivityIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
} from "lucide-react";
import { get, post } from "@/lib/api-client";

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

type ApiPatient = {
  _id: string;
  patientId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  phone: string;
  email?: string;
  presentInClinic: boolean;
  chiefComplaint?: string | null;
};

type PatientStatus = "in-clinic" | "remote";

interface UiPatient {
  recordId: string;
  patientId: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  chiefComplaint?: string | null;
  status: PatientStatus;
  avatar: string;
}

const createAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=ffffff`;

const mapApiPatientToUi = (patient: ApiPatient): UiPatient => {
  const status: PatientStatus = patient.presentInClinic ? "in-clinic" : "remote";
  return {
    recordId: patient._id,
    patientId: patient.patientId,
    name: patient.fullName,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email ?? "Not provided",
    chiefComplaint: patient.chiefComplaint,
    status,
    avatar: createAvatarUrl(patient.fullName),
  };
};

type NewPatientForm = {
  name: string;
  age: string;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  bloodGroup:
    | "A+"
    | "A-"
    | "B+"
    | "B-"
    | "AB+"
    | "AB-"
    | "O+"
    | "O-";
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

export function AdminPatients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 150); // 150ms debounce
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [patientsList, setPatientsList] = useState<UiPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const [newPatient, setNewPatient] = useState({ ...emptyNewPatientState });

  useEffect(() => {
    let ignore = false;

    const fetchPatients = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await get<ApiPatient[]>("/api/patients?limit=50");
        if (ignore) return;

        if (response.success && Array.isArray(response.data)) {
          setPatientsList(response.data.map(mapApiPatientToUi));
        } else {
          setFetchError(response.message ?? "Unable to load patients right now.");
        }
      } catch (error) {
        if (ignore) return;
        const message =
          error instanceof Error ? error.message : "Unable to load patients.";
        setFetchError(message);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchPatients();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    return patientsList.filter((patient) => {
      const matchesSearch =
        query.length === 0 ||
        patient.name.toLowerCase().includes(query) ||
        patient.patientId.toLowerCase().includes(query) ||
        patient.email.toLowerCase().includes(query);
      const matchesStatus =
        filterStatus === "all" || patient.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [patientsList, debouncedSearchQuery, filterStatus]);

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

      const response = await post<{ patient: ApiPatient }>("/api/patients", payload);

      if (response.success && response.data?.patient) {
        setPatientsList((prev) => [mapApiPatientToUi(response.data!.patient), ...prev]);
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

  const getStatusBadge = (status: PatientStatus) => {
    switch (status) {
      case "in-clinic":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "remote":
      default:
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400";
    }
  };

const statusLabels: Record<PatientStatus, string> = {
  "in-clinic": "In Clinic",
  remote: "Remote Follow-up",
};

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Total Patients
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mt-1">
                  {patientsList.length}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <UsersIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  In Clinic Today
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mt-1">
                  {patientsList.filter((p) => p.status === "in-clinic").length}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <CheckCircleIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                  Remote Follow-ups
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mt-1">
                  {patientsList.filter((p) => p.status === "remote").length}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Patients completing care virtually or not currently in clinic.
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <MailIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Active Complaints
                </p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent mt-1">
                  {
                    patientsList.filter(
                      (p) => typeof p.chiefComplaint === "string" && p.chiefComplaint.trim().length > 0
                    ).length
                  }
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                <AlertCircleIcon className="w-7 h-7 text-white" />
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
                      setNewPatient({ ...newPatient, dateOfBirth: e.target.value })
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
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
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
        </CardHeader>
        <CardContent>
          {fetchError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {fetchError}
            </div>
          )}
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
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
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center gap-4 text-muted-foreground">
              <span className="h-10 w-10 rounded-full border-4 border-transparent border-t-[#00C4B3] animate-spin" />
              <p className="text-sm">Loading patient records…</p>
            </div>
          ) : (
            <>
              {/* Patients Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.recordId}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(`/patient-overview/${patient.recordId}`)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/patient-overview/${patient.recordId}`);
                      }
                    }}
                    className="border-border hover:shadow-lg transition-all hover:border-[#00C4B3]/30 cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C4B3] bg-card"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16 border-2 border-[#00C4B3]/20">
                          <AvatarImage src={patient.avatar} alt={patient.name} />

                          <AvatarFallback className="bg-gradient-to-br from-[#00C4B3] to-[#10b981] text-white">
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {patient.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                ID: {patient.patientId}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={getStatusBadge(patient.status)}
                            >
                              {statusLabels[patient.status]}
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarIcon className="w-3 h-3" />

                              <span>Age: {patient.age} years</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <PhoneIcon className="w-3 h-3" />

                              <span className="truncate">{patient.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MailIcon className="w-3 h-3" />

                              <span className="truncate">{patient.email}</span>
                            </div>
                            {patient.chiefComplaint && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ActivityIcon className="w-3 h-3" />

                                <span className="truncate">
                                  Complaint: {patient.chiefComplaint}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 dark:hover:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/patient-overview/${patient.recordId}`);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate("/admin-appointments");
                          }}
                        >
                          Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                ))}
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
