import { AlertCircleIcon } from "lucide-react";

// DEPRECATED: This file is no longer in use.
// Please use @/polymet/pages/consultation-session-new instead.

export function ConsultationSession() {
  return (
    <div className="p-8 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <AlertCircleIcon className="w-16 h-16 mx-auto text-amber-500" />

        <h1 className="text-2xl font-bold mb-4">Page Deprecated</h1>
        <p className="text-muted-foreground">
          This page is no longer in use. Please use consultation-session-new
          instead.
        </p>
      </div>
    </div>
  );
}
