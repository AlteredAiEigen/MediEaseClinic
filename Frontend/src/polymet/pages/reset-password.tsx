import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockIcon, ArrowLeftIcon } from "lucide-react";
import { post } from "@/lib/api-client";
import { MediEaseLogo } from "@/polymet/components/mediease-logo";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError("Reset link is missing or invalid. Please request a new link.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await post("/api/auth/password-reset/confirm", {
        token,
        newPassword: password,
      }, { auth: false });

      setSuccessMessage("Password updated successfully. Redirecting to login…");
      setTimeout(() => navigate("/auth"), 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset password.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5FAFF] via-white to-[#A7F5EB]/10 dark:from-background dark:via-background dark:to-[#00C4B3]/5 py-10 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <MediEaseLogo size="lg" />
          </Link>
          <Link to="/auth" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to login
          </Link>
        </div>

        <Card className="shadow-lg border-border/70">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-[#00C4B3]/10 text-[#00C4B3] flex items-center justify-center">
              <LockIcon className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl">Set your password</CardTitle>
            <CardDescription>
              Choose a secure password to access your MediEase account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-type password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
              )}

              {successMessage && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {successMessage}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


