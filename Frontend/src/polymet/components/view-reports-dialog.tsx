import { useState } from "react";
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
import { SearchIcon, FileTextIcon, DownloadIcon, EyeIcon } from "lucide-react";
import { patients } from "@/polymet/data/healthcare-data";
import { getLabReportsForPatient } from "@/polymet/data/lab-reports-data";

interface Report {
  id: string;
  type: string;
  date: string;
  status: "pending" | "reviewed" | "completed";
  priority: "high" | "normal" | "low";
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
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get actual lab reports for selected patient
  const patientReports = selectedPatient
    ? getLabReportsForPatient(selectedPatient.id)
    : [];

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
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPatient?.id === patient.id
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={`https://github.com/${patient.id}.png`}
                      alt={patient.name}
                    />

                    <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {patient.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {patient.id} • Age {patient.age}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Reports List */}
          <div className="w-96 flex flex-col">
            {selectedPatient ? (
              <>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Patient Reports
                  </p>
                  <p className="font-semibold">{selectedPatient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPatient.id} • {patientReports.length} reports
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {patientReports.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No lab reports available for this patient
                    </div>
                  ) : (
                    patientReports.map((report) => (
                      <div
                        key={report.id}
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
