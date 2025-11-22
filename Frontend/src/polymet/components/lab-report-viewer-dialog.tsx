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
  CheckCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MessageSquareIcon,
  SaveIcon,
  HistoryIcon,
  FileDownIcon,
  SparklesIcon,
} from "lucide-react";

interface LabTest {
  name: string;
  result: string;
  unit: string;
  normalRange: string;
  status: "normal" | "high" | "low" | "critical";
  flag?: string;
}

export interface LabReportData {
  reportId: string;
  patientName: string;
  patientId: string;
  age: number;
  gender: string;
  reportType: string;
  category: string;
  orderedBy: string;
  collectedDate: string;
  reportedDate: string;
  labName: string;
  tests: LabTest[];
  clinicalNotes?: string;
  interpretation?: string;
  previousResults?: LabTest[];
  previousDate?: string;
}

interface DoctorComment {
  id: string;
  doctorName: string;
  comment: string;
  timestamp: string;
}

interface LabReportViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: LabReportData | null;
}

export function LabReportViewerDialog({
  open,
  onOpenChange,
  reportData,
}: LabReportViewerDialogProps) {
  const [activeTab, setActiveTab] = useState("results");
  const [doctorComment, setDoctorComment] = useState("");
  const [savedComments, setSavedComments] = useState<DoctorComment[]>([
    {
      id: "1",
      doctorName: "Dr. Amit Patel",
      comment:
        "Patient showing good progress. Continue current medication regimen and monitor levels in 4 weeks.",
      timestamp: "January 20, 2024 10:30 AM",
    },
  ]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!reportData) return null;

  const handleSaveComment = () => {
    if (doctorComment.trim()) {
      const newComment: DoctorComment = {
        id: Date.now().toString(),
        doctorName: "Dr. Amit Patel",
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

  const calculateTrend = (current: string, previous: string) => {
    const currentVal = parseFloat(current);
    const previousVal = parseFloat(previous);
    if (isNaN(currentVal) || isNaN(previousVal)) return null;
    const diff = currentVal - previousVal;
    const percentChange = ((diff / previousVal) * 100).toFixed(1);
    return { diff, percentChange, isIncrease: diff > 0 };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
        return <CheckCircleIcon className="w-4 h-4" />;

      case "high":
        return <TrendingUpIcon className="w-4 h-4" />;

      case "low":
        return <TrendingDownIcon className="w-4 h-4" />;

      case "critical":
        return <AlertCircleIcon className="w-4 h-4" />;

      default:
        return <ActivityIcon className="w-4 h-4" />;
    }
  };

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
                  {reportData.reportType}
                </DialogTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />

                    {reportData.reportedDate}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-teal-50 text-teal-700 border-teal-200"
                  >
                    {reportData.category}
                  </Badge>
                  {reportData.previousResults && (
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"
                    >
                      <HistoryIcon className="w-3 h-3" />
                      Historical Data Available
                    </Badge>
                  )}
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
              <TabsTrigger
                value="comparison"
                className="gap-2"
                disabled={!reportData.previousResults}
              >
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
                <div className="bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border border-teal-100 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-teal-900">
                    <UserIcon className="w-4 h-4" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Name</p>
                      <p className="font-medium">{reportData.patientName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Patient ID</p>
                      <p className="font-medium">{reportData.patientId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Age/Gender</p>
                      <p className="font-medium">
                        {reportData.age} yrs / {reportData.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Report ID</p>
                      <p className="font-medium">{reportData.reportId}</p>
                    </div>
                  </div>
                </div>

                {/* Report Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Ordered By</p>
                    <p className="font-medium">{reportData.orderedBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">
                      Collection Date
                    </p>
                    <p className="font-medium">{reportData.collectedDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Lab Name</p>
                    <p className="font-medium">{reportData.labName}</p>
                  </div>
                </div>

                <Separator />

                {/* Test Results */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Test Results</h3>
                  <div className="space-y-3">
                    {reportData.tests.map((test, index) => (
                      <div
                        key={index}
                        className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">
                              {test.name}
                            </h4>
                            {test.flag && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                              >
                                {test.flag}
                              </Badge>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(test.status)} flex items-center gap-1`}
                          >
                            {getStatusIcon(test.status)}
                            {test.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="bg-muted/30 p-3 rounded">
                            <p className="text-muted-foreground mb-1">Result</p>
                            <p className="font-bold text-lg">
                              {test.result}{" "}
                              <span className="text-sm font-normal text-muted-foreground">
                                {test.unit}
                              </span>
                            </p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded">
                            <p className="text-muted-foreground mb-1">
                              Normal Range
                            </p>
                            <p className="font-medium">{test.normalRange}</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded">
                            <p className="text-muted-foreground mb-1">Unit</p>
                            <p className="font-medium">{test.unit}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Notes */}
                {reportData.clinicalNotes && (
                  <>
                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Clinical Notes
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900 leading-relaxed">
                          {reportData.clinicalNotes}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Interpretation */}
                {reportData.interpretation && (
                  <>
                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Interpretation
                      </h3>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-900 leading-relaxed">
                          {reportData.interpretation}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Footer */}
                <Separator />

                <div className="text-xs text-muted-foreground text-center">
                  <p>
                    This report is electronically generated and verified by{" "}
                    {reportData.labName}
                  </p>
                  <p className="mt-1">
                    Report Date: {reportData.reportedDate} | Report ID:{" "}
                    {reportData.reportId}
                  </p>
                </div>
              </TabsContent>

              {/* Comparison Tab */}
              <TabsContent value="comparison" className="p-6 space-y-6 mt-0">
                {reportData.previousResults && reportData.previousDate ? (
                  <>
                    <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-purple-100 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-purple-900">
                        <HistoryIcon className="w-4 h-4" />
                        Comparing Results
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Current: {reportData.reportedDate} vs Previous:{" "}
                        {reportData.previousDate}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {reportData.tests.map((test, index) => {
                        const previousTest =
                          reportData.previousResults?.[index];
                        if (!previousTest) return null;
                        const trend = calculateTrend(
                          test.result,
                          previousTest.result
                        );

                        return (
                          <div
                            key={index}
                            className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                          >
                            <h4 className="font-semibold text-foreground mb-4">
                              {test.name}
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                              {/* Current Result */}
                              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-teal-700">
                                    Current Result
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`${getStatusColor(test.status)} text-xs`}
                                  >
                                    {test.status.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-2xl font-bold text-teal-900">
                                  {test.result}{" "}
                                  <span className="text-sm font-normal">
                                    {test.unit}
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {reportData.reportedDate}
                                </p>
                              </div>

                              {/* Previous Result */}
                              <div className="bg-muted/30 border border-border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Previous Result
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`${getStatusColor(previousTest.status)} text-xs`}
                                  >
                                    {previousTest.status.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-2xl font-bold">
                                  {previousTest.result}{" "}
                                  <span className="text-sm font-normal">
                                    {previousTest.unit}
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {reportData.previousDate}
                                </p>
                              </div>
                            </div>

                            {/* Trend Analysis */}
                            {trend && (
                              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  {trend.isIncrease ? (
                                    <TrendingUpIcon className="w-5 h-5 text-purple-600" />
                                  ) : (
                                    <TrendingDownIcon className="w-5 h-5 text-purple-600" />
                                  )}
                                  <div>
                                    <p className="text-sm font-semibold text-purple-900">
                                      {trend.isIncrease
                                        ? "Increased"
                                        : "Decreased"}{" "}
                                      by{" "}
                                      {Math.abs(
                                        parseFloat(trend.percentChange)
                                      )}
                                      %
                                    </p>
                                    <p className="text-xs text-purple-700">
                                      Change: {trend.isIncrease ? "+" : ""}
                                      {trend.diff.toFixed(2)} {test.unit}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="mt-3 text-xs text-muted-foreground">
                              <span className="font-medium">Normal Range:</span>{" "}
                              {test.normalRange} {test.unit}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

                    <p className="text-muted-foreground">
                      No previous results available for comparison
                    </p>
                  </div>
                )}
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
                </div>
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
