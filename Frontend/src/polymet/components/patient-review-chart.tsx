import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  rating: "excellent" | "great" | "good" | "average" | "poor";
  count: number;
}

interface PatientReviewChartProps {
  reviews: Review[];
  className?: string;
}

export function PatientReviewChart({
  reviews,
  className,
}: PatientReviewChartProps) {
  const totalReviews = reviews.reduce((sum, review) => sum + review.count, 0);

  const ratingConfig = {
    excellent: { label: "Excellent", color: "bg-[#24B173]", stars: 5 },
    great: { label: "Great", color: "bg-[#10b981]", stars: 4 },
    good: { label: "Good", color: "bg-[#00C4B3]", stars: 3 },
    average: { label: "Average", color: "bg-[#F7B731]", stars: 2 },
    poor: { label: "Poor", color: "bg-[#FF4F6E]", stars: 1 },
  };

  return (
    <Card className={cn("border-border shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <StarIcon className="w-5 h-5 text-[#F7B731] fill-[#F7B731]" />
          Patient Reviews
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: {totalReviews} reviews
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review) => {
          const config = ratingConfig[review.rating];
          const percentage = (review.count / totalReviews) * 100;

          return (
            <div key={review.rating} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground w-20">
                    {config.label}
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        className={cn(
                          "w-3 h-3",
                          i < config.stars
                            ? "text-[#F7B731] fill-[#F7B731]"
                            : "text-muted stroke-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-muted-foreground font-medium">
                  {review.count}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    config.color
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
