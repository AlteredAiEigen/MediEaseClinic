import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediEaseLoader } from "@/polymet/components/mediease-loader";

export function LoaderShowcasePage() {
  return (
    <div className="max-w-4xl mx-auto py-16 space-y-10">
      <Card className="border-border shadow-md">
        <CardHeader>
          <CardTitle>MediEase Loader Showcase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <p className="text-muted-foreground">
            This page demonstrates the branded loader used throughout the application.
            Use it to verify styling, messages, and animations.
          </p>

          <MediEaseLoader
            message="Syncing healthcare intelligence…"
            subtext="Pulling the most recent patient records and AI insights"
            minHeight="min-h-[360px]"
          />

          <div className="text-xs text-muted-foreground">
            <p>
              Note: The loader automatically adapts to light and dark themes, and the
              message/subtext are configurable via props.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
