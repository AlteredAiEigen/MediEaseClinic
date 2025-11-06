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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchIcon, FileTextIcon, DownloadIcon, EyeIcon, AlertCircleIcon, Loader2 } from "lucide-react";
import { get } from "@/lib/api-client";

interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
  age: string;
  gender: string;
  phone: string;
  email?: string;
}

interface LabReport {
  _id: string;
  reportId: string;
  patientId: string;
  patientName: string;
  reportType: string;
  category: string;
  reportedDate: string;
  labName: string;
  tests: Array<{
    name: string;
    result: string;
    unit: string;
    normalRange: string;
    status: string;
  }>;
  clinicalNotes?: string;
  interpretation?: string;
}

interface ViewReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewReport?: (reportData: any) => void;
}

export function ViewReportsDialog({
  open,
  onOpenChange,
  onViewReport,
}: ViewReportsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientReports, setPatientReports] = useState<LabReport[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch patients when dialog opens
  useEffect(() => {
    if (open) {
      const fetchPatients = async () => {
        try {
          setIsLoadingPatients(true);
          setError(null);

          const response = await get<{ data: Patient[] }>("/api/patients?limit=100");
          if (response.success && response.data?.data) {
            setPatients(response.data.data);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to load patients";
          setError(message);
        } finally {
          setIsLoadingPatients(false);
        }
      };

      fetchPatients();
    } else {
      // Reset form when dialog closes
      setSelectedPatient(null);
      setPatientReports([]);
      setSearchQuery("");
      setError(null);
    }
  }, [open]);

  // Fetch reports when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const fetchReports = async () => {
        try {
          setIsLoadingReports(true);

          const response = await get<{ reports: LabReport[] }>(`/api/lab-reports/patient/${selectedPatient._id}`);
          if (response.success && response.data?.reports) {
            setPatientReports(response.data.reports);
          } else {
            setPatientReports([]);
          }
        } catch (err) {
          console.error("Failed to load lab reports:", err);
          setPatientReports([]);
        } finally {
          setIsLoadingReports(false);
        }
      };

      fetchReports();
    } else {
      setPatientReports([]);
    }
  }, [selectedPatient]);

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

  const handleViewReport = (reportData: any) => {
    if (onViewReport) {
      onViewReport(reportData);
    }
  };

  const handleDownloadReport = (reportData: any) => {
    // Simulate PDF download
    const reportContent = `
===========================================
${reportData.reportType}
===========================================

Patient: ${reportData.patientName}
Patient ID: ${reportData.patientId}
Report ID: ${reportData.reportId}
Date: ${reportData.reportedDate}

Test Results:
${reportData.tests
  .map(
    (test: any) => `
${test.name}: ${test.result} ${test.unit}
Normal Range: ${test.normalRange}
Status: ${test.status.toUpperCase()}
`
  )
  .join("\n")}

${reportData.clinicalNotes ? `Clinical Notes:\n${reportData.clinicalNotes}\n\n` : ""}
${reportData.interpretation ? `Interpretation:\n${reportData.interpretation}` : ""}
    `;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportData.reportId}_${reportData.patientName.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">View Reports</DialogTitle>
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
              {isLoadingPatients ? (
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
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white">
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

          {/* Right Side - Reports List */}
          <div className="w-96 flex flex-col">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {selectedPatient ? (
              <>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Patient Reports
                  </p>
                  <p className="font-semibold">{selectedPatient.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPatient.patientId} • {patientReports.length} reports
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {isLoadingReports ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading reports...</span>
                    </div>
                  ) : patientReports.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No lab reports available for this patient
                    </div>
                  ) : (
                    patientReports.map((report) => (
                      <div
                        key={report._id}
                        className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30">
                              <FileTextIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                {report.reportType}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {report.reportId} • {report.reportedDate}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400"
                          >
                            {report.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex-1 text-xs text-muted-foreground">
                            {report.tests.length} tests • {report.labName}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 hover:bg-teal-100 dark:hover:bg-teal-900/30"
                            onClick={() => handleViewReport(report)}
                          >
                            <EyeIcon className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                            onClick={() => handleDownloadReport(report)}
                          >
                            <DownloadIcon className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <FileTextIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />

                  <p className="text-sm text-muted-foreground">
                    Select a patient to view their reports
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
