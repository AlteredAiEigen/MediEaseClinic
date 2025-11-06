import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ActivityIcon,
  HeartPulseIcon,
  ThermometerIcon,
  WindIcon,
} from "lucide-react";

interface ConsultationSidebarProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  className?: string;
}

export function ConsultationSidebar({
  notes,
  onNotesChange,
  className = "",
}: ConsultationSidebarProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Vitals - Compact Version */}
      <Card className="border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Current Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {/* Blood Pressure */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-1.5 mb-1">
                <HeartPulseIcon className="w-3 h-3 text-red-600 dark:text-red-400" />

                <p className="text-[10px] font-medium text-red-700 dark:text-red-400">
                  BP
                </p>
              </div>
              <p className="text-base font-bold text-red-700 dark:text-red-400">
                145/95
              </p>
              <p className="text-[9px] text-red-600 dark:text-red-400">High</p>
            </div>

            {/* Heart Rate */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20 border border-pink-200 dark:border-pink-800">
              <div className="flex items-center gap-1.5 mb-1">
                <HeartPulseIcon className="w-3 h-3 text-pink-600 dark:text-pink-400" />

                <p className="text-[10px] font-medium text-pink-700 dark:text-pink-400">
                  HR
                </p>
              </div>
              <p className="text-base font-bold text-pink-700 dark:text-pink-400">
                78
              </p>
              <p className="text-[9px] text-pink-600 dark:text-pink-400">bpm</p>
            </div>

            {/* Temperature */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-1.5 mb-1">
                <ThermometerIcon className="w-3 h-3 text-orange-600 dark:text-orange-400" />

                <p className="text-[10px] font-medium text-orange-700 dark:text-orange-400">
                  Temp
                </p>
              </div>
              <p className="text-base font-bold text-orange-700 dark:text-orange-400">
                98.6°F
              </p>
              <p className="text-[9px] text-orange-600 dark:text-orange-400">
                Normal
              </p>
            </div>

            {/* Oxygen Saturation */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-1.5 mb-1">
                <WindIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />

                <p className="text-[10px] font-medium text-blue-700 dark:text-blue-400">
                  SpO2
                </p>
              </div>
              <p className="text-base font-bold text-blue-700 dark:text-blue-400">
                98%
              </p>
              <p className="text-[9px] text-blue-600 dark:text-blue-400">
                Normal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <Badge
                variant="outline"
                className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
              >
                Penicillin
              </Badge>
              <Badge
                variant="outline"
                className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
              >
                Sulfa drugs
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Current Medications */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Current Medications
            </p>
            <div className="space-y-1.5">
              <div className="text-xs text-foreground">• Lisinopril 10mg</div>
              <div className="text-xs text-foreground">• Atorvastatin 20mg</div>
              <div className="text-xs text-foreground">• Metformin 500mg</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultation Notes */}
      <Card className="border-border shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Consultation Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter consultation notes, observations, and treatment plan..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="min-h-[200px] resize-none"
          />

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">
              {notes.length} characters
            </p>
            <Button size="sm" variant="outline">
              Save Draft
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
