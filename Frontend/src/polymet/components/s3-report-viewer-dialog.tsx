import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileTextIcon,
  DownloadIcon,
  PrinterIcon,
  CalendarIcon,
  UserIcon,
  ActivityIcon,
  AlertCircleIcon,
  MessageSquareIcon,
  SaveIcon,
  HistoryIcon,
  FileDownIcon,
  SparklesIcon,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface ParsedLabTestRow {
  name?: string;
  result?: string;
  unit?: string;
  normalRange?: string;
  status?: string;
  flag?: string;
}

interface ParsedLabReportPayload {
  reportType?: string;
  labName?: string;
  collectedDate?: string;
  reportedDate?: string;
  interpretation?: string;
  notes?: string;
  tests?: ParsedLabTestRow[];
  summaryText?: string;
}

interface S3Report {
  _id: string;
  patientId: string;
  patientMongoId: string;
  patientEmail: string;
  documentName: string;
  s3Key: string;
  s3Url: string;
  presignedUrl?: string;
  createdAt: string;
  updatedAt: string;
  parseStatus?: "pending" | "processing" | "success" | "failed";
  parseError?: string | null;
  parsedAt?: string;
  parsedLabReport?: ParsedLabReportPayload | null;
  metadata?: Record<string, unknown>;
}

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  age?: string;
}

interface DoctorComment {
  id: string;
  doctorName: string;
  comment: string;
  timestamp: string;
}

interface S3ReportViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: S3Report | null;
  patient: Patient | null;
}

function formatCommentAuthorName(user: {
  firstName?: string;
  lastName?: string;
} | null): string {
  if (!user) return "Doctor";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name ? `Dr. ${name}` : "Doctor";
}

export function S3ReportViewerDialog({
  open,
  onOpenChange,
  report,
  patient,
}: S3ReportViewerDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("results");
  const [doctorComment, setDoctorComment] = useState("");
  const [savedComments, setSavedComments] = useState<DoctorComment[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!report) return null;

  const handleSaveComment = () => {
    if (doctorComment.trim()) {
      const newComment: DoctorComment = {
        id: Date.now().toString(),
        doctorName: formatCommentAuthorName(user),
        comment: doctorComment,
        timestamp: new Date().toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
      setSavedComments([newComment, ...savedComments]);
      setDoctorComment("");
    }
  };

  const handleGeneratePDF = () => {
    setIsGeneratingPDF(true);
    // Simulate PDF generation
    setTimeout(() => {
      setIsGeneratingPDF(false);
      // In a real app, this would trigger actual PDF generation
      alert("PDF generated successfully! Download will start shortly.");
    }, 2000);
  };

  const handleDownload = () => {
    if (report.presignedUrl) {
      window.open(report.presignedUrl, '_blank');
    }
  };

  const isPDF = report.documentName.toLowerCase().endsWith('.pdf');
  const reportDate = new Date(report.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const parsed = report.parsedLabReport;
  const hasParsedTests = Boolean(parsed?.tests && parsed.tests.length > 0);
  const sourceLabel = report.metadata?.uploadedByUserId ? "Manual upload" : "Email upload";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg shadow-lg">
                <FileTextIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl mb-2">
                  {report.documentName}
                </DialogTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {reportDate}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-teal-50 text-teal-700 border-teal-200"
                  >
                    Lab Report
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.print()}
              >
                <PrinterIcon className="w-4 h-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleDownload}
                disabled={!report.presignedUrl}
              >
                <DownloadIcon className="w-4 h-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 hover:from-teal-600 hover:to-emerald-600"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <>
                    <SparklesIcon className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDownIcon className="w-4 h-4" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator className="flex-shrink-0" />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-6 pt-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="results" className="gap-2">
                <ActivityIcon className="w-4 h-4" />
                Test Results
              </TabsTrigger>
              <TabsTrigger value="comparison" className="gap-2">
                <HistoryIcon className="w-4 h-4" />
                Compare Results
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquareIcon className="w-4 h-4" />
                Doctor Comments ({savedComments.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <TabsContent value="results" className="p-6 space-y-6 mt-0">
                {/* Patient Information */}
                {patient && (
                  <div className="bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border border-teal-100 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-teal-900">
                      <UserIcon className="w-4 h-4" />
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Name</p>
                        <p className="font-medium">{patient.fullName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Patient ID</p>
                        <p className="font-medium">{patient.patientId}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Age/Gender</p>
                        <p className="font-medium">
                          {patient.age || "N/A"} {patient.age && "yrs"} / {patient.gender || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Report ID</p>
                        <p className="font-medium">{report._id.slice(-8)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Report Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Document Name</p>
                    <p className="font-medium">{report.documentName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Upload Date</p>
                    <p className="font-medium">{reportDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Source</p>
                    <p className="font-medium">{sourceLabel}</p>
                  </div>
                  {report.parseStatus && (
                    <div>
                      <p className="text-muted-foreground mb-1">AI parse</p>
                      <Badge
                        variant="outline"
                        className={
                          report.parseStatus === "success"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : report.parseStatus === "failed"
                              ? "border-red-200 text-red-700"
                              : ""
                        }
                      >
                        {report.parseStatus}
                      </Badge>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Report Display */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Test Results</h3>

                  {report.parseStatus === "failed" && report.parseError && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      Structured parse failed: {report.parseError}
                    </div>
                  )}

                  {(report.parseStatus === "pending" || report.parseStatus === "processing") && (
                    <div className="mb-4 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                      AI is extracting lab values from this PDF… Refresh this dialog in a few seconds.
                    </div>
                  )}

                  {report.parseStatus === "success" && parsed && (
                    <div className="mb-6 space-y-3 rounded-lg border border-teal-100 bg-teal-50/40 p-4">
                      <div className="flex flex-wrap gap-2 text-sm">
                        {parsed.reportType && (
                          <Badge variant="secondary">{parsed.reportType}</Badge>
                        )}
                        {parsed.labName && (
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">Lab: </span>
                            {parsed.labName}
                          </span>
                        )}
                      </div>
                      {(parsed.collectedDate || parsed.reportedDate) && (
                        <p className="text-xs text-muted-foreground">
                          {parsed.collectedDate && <>Collected: {parsed.collectedDate} </>}
                          {parsed.reportedDate && <>· Reported: {parsed.reportedDate}</>}
                        </p>
                      )}
                      {hasParsedTests && (
                        <div className="overflow-x-auto rounded-md border bg-background">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50 text-left">
                                <th className="p-2 font-medium">Test</th>
                                <th className="p-2 font-medium">Result</th>
                                <th className="p-2 font-medium">Unit</th>
                                <th className="p-2 font-medium">Ref</th>
                                <th className="p-2 font-medium">Flag</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsed.tests!.map((t, idx) => (
                                <tr key={idx} className="border-b border-border/60">
                                  <td className="p-2">{t.name || "—"}</td>
                                  <td className="p-2 font-medium">{t.result ?? "—"}</td>
                                  <td className="p-2 text-muted-foreground">{t.unit || "—"}</td>
                                  <td className="p-2 text-xs text-muted-foreground">{t.normalRange || "—"}</td>
                                  <td className="p-2 text-xs">{t.flag || t.status || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {parsed.interpretation && (
                        <div>
                          <p className="text-xs font-semibold text-teal-900">Interpretation</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{parsed.interpretation}</p>
                        </div>
                      )}
                      {parsed.notes && (
                        <div>
                          <p className="text-xs font-semibold text-teal-900">Notes</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{parsed.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {report.presignedUrl ? (
                    <div className="w-full border rounded-lg overflow-hidden bg-muted/20">
                      {isPDF ? (
                        <iframe
                          src={report.presignedUrl}
                          className="w-full h-[600px]"
                          title={report.documentName}
                        />
                      ) : (
                        <div className="flex items-center justify-center p-8">
                          <img
                            src={report.presignedUrl}
                            alt={report.documentName}
                            className="max-w-full max-h-[600px] object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <AlertCircleIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Unable to load report. Please try again later.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <Separator />
                <div className="text-xs text-muted-foreground text-center">
                  <p>
                    This report is stored securely in AWS S3 ({sourceLabel.toLowerCase()})
                  </p>
                  <p className="mt-1">
                    Upload Date: {reportDate} | Report ID: {report._id.slice(-8)}
                  </p>
                </div>
              </TabsContent>

              {/* Comparison Tab */}
              <TabsContent value="comparison" className="p-6 space-y-6 mt-0">
                <div className="text-center py-12">
                  <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Compare Results</h3>
                  <p className="text-muted-foreground">
                    {hasParsedTests
                      ? "Trend comparison across visits is not implemented yet. Use Test Results for the parsed table and PDF."
                      : "Comparison requires structured lab data. After AI parsing completes, open this report again."}
                  </p>
                </div>
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments" className="p-6 space-y-6 mt-0">
                {/* Add Comment Section */}
                <div className="bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border border-teal-100 rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-teal-900">
                    <MessageSquareIcon className="w-4 h-4" />
                    Add Doctor Comment
                  </h3>
                  <Textarea
                    placeholder="Add your clinical observations, recommendations, or follow-up instructions..."
                    value={doctorComment}
                    onChange={(e) => setDoctorComment(e.target.value)}
                    className="min-h-[100px] mb-3"
                  />

                  <Button
                    onClick={handleSaveComment}
                    disabled={!doctorComment.trim()}
                    className="gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                  >
                    <SaveIcon className="w-4 h-4" />
                    Save Comment
                  </Button>
                </div>

                {/* Saved Comments */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Previous Comments ({savedComments.length})
                  </h3>
                  {savedComments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquareIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No comments yet. Add your first comment above.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {comment.doctorName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">
                                  {comment.doctorName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {comment.timestamp}
                                </p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed mt-3">
                            {comment.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

