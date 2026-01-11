import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlusIcon, ArrowLeftIcon, SaveIcon, Loader2Icon, ShieldCheckIcon, CheckCircle2Icon, MailIcon, CheckCircleIcon, RefreshCwIcon, XCircleIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { post, get } from "@/lib/api-client";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RegisterPatient() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",  // Mandatory field
    dateOfBirth: "",  // Optional - month/year only (YYYY-MM format)
    gender: "",
    phone: "",
    email: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    bloodGroup: "",
    allergies: "",
    medicalHistory: "",
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [communicationConsents, setCommunicationConsents] = useState({
    whatsapp: false,
    email: false,
    sms: false,
    phoneCall: false,
  });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<{ name: string; patientId?: string } | null>(null);
  
  // Email verification state
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<"pending" | "verified" | "not_sent">("not_sent");
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [lastVerifiedEmail, setLastVerifiedEmail] = useState<string>("");
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Verification status dialog
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationDialogMessage, setVerificationDialogMessage] = useState("");
  const [verificationDialogType, setVerificationDialogType] = useState<"success" | "error" | "info">("info");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      setVerificationDialogMessage("Please confirm that you agree to the data security terms before registering the patient.");
      setVerificationDialogType("error");
      setShowVerificationDialog(true);
      return;
    }
    if (!formData.email.trim()) {
      setVerificationDialogMessage("Email address is required.");
      setVerificationDialogType("error");
      setShowVerificationDialog(true);
      return;
    }
    
    // Check if consent has been approved
    if (emailVerificationStatus !== "verified") {
      setVerificationDialogMessage("Please approve consent before registering. Click 'Send Verification' below the email field to receive the consent link.");
      setVerificationDialogType("error");
      setShowVerificationDialog(true);
      return;
    }
    
    // Ensure the email being registered matches the email that consent was approved for
    if (formData.email.trim().toLowerCase() !== lastVerifiedEmail) {
      setVerificationDialogMessage("Email address has been changed. Please send a new consent link and approve it before registering.");
      setVerificationDialogType("error");
      setShowVerificationDialog(true);
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Calculate dateOfBirth from age if provided and dateOfBirth not set
      // Format: YYYY-MM (month/year only) or calculate from age
      let dateOfBirthValue: string | undefined = undefined;
      
      if (formData.dateOfBirth) {
        // User provided month/year (YYYY-MM format)
        dateOfBirthValue = formData.dateOfBirth;
      } else if (formData.age) {
        // Calculate dateOfBirth from age (use January 1st as default)
        const age = parseInt(formData.age);
        if (!isNaN(age) && age > 0) {
          const today = new Date();
          const birthYear = today.getFullYear() - age;
          dateOfBirthValue = `${birthYear}-01-01`;  // Use January 1st as default
        }
      }

      // Prepare the data for the API
      const patientData = {
        firstName: formData.firstName,
        lastName: formData.lastName || undefined,  // Optional
        gender: formData.gender,
        dateOfBirth: dateOfBirthValue,  // Optional - can be calculated from age
        age: formData.age,  // Mandatory
        phone: `+91 ${formData.phone.replace(/\s/g, '')}`.trim(),
        email: formData.email.trim(),
        address: formData.address,
        bloodGroup: formData.bloodGroup || "A+", // Default to A+ if not selected
        allergies: formData.allergies || "",
        emergencyContact: formData.emergencyContact || undefined,  // Optional
        emergencyContactPhone: formData.emergencyPhone ? `+91 ${formData.emergencyPhone.replace(/\s/g, '')}`.trim() : undefined,  // Optional
        agreedToDataStorage: true, // Patient has agreed via checkbox
        // Communication consent preferences
        consentWhatsApp: communicationConsents.whatsapp,
        consentEmail: communicationConsents.email,
        consentSMS: communicationConsents.sms,
        consentPhoneCall: communicationConsents.phoneCall,
      };

      // Call the real backend API
      const response = await post("/api/patients", patientData);
      
      if (!response.success) {
        throw new Error(response.message || "Failed to register patient");
      }

      // Store registered patient info for success dialog
      const patientName = `${formData.firstName} ${formData.lastName}`;
      const patientId = response.data?.patient?.patientId || response.data?.patient?.patient_id || response.data?.patientId;
      setRegisteredPatient({ name: patientName, patientId });

      // Reset form on success
      setFormData({
        firstName: "",
        lastName: "",
        age: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        email: "",
        address: "",
        emergencyContact: "",
        emergencyPhone: "",
        bloodGroup: "",
        allergies: "",
        medicalHistory: "",
      });
      setAgreedToTerms(false);
      setCommunicationConsents({
        whatsapp: false,
        email: false,
        sms: false,
        phoneCall: false,
      });

      // Show success dialog
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error registering patient:", error);
      setVerificationDialogMessage("Failed to register patient. Please try again.");
      setVerificationDialogType("error");
      setShowVerificationDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Reset email verification status if email changes (but preserve if same email is verified)
    if (field === "email") {
      const emailValue = value.trim().toLowerCase();
      // Only reset if email changed AND it's not the verified email
      if (emailValue !== lastVerifiedEmail && emailVerificationStatus === "verified") {
        setEmailVerificationStatus("not_sent");
        setVerificationEmailSent(false);
        setLastVerifiedEmail("");
        // Stop any active polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (emailValue !== lastVerifiedEmail) {
        // Email changed but wasn't verified, just reset
        setEmailVerificationStatus("not_sent");
        setVerificationEmailSent(false);
        // Stop any active polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
      // If email matches lastVerifiedEmail and status is verified, keep it verified
    }
  };
  
  // Check email verification status (consent approval status)
  // Store in ref to ensure it's always accessible
  const checkEmailVerificationRef = useRef<((email: string, showLoading?: boolean) => Promise<void>) | null>(null);
  
  const checkEmailVerification = useCallback(async (email: string, showLoading = false) => {
    if (!email || !email.trim()) {
      return;
    }
    
    const emailLower = email.trim().toLowerCase();
    console.log("checkEmailVerification called for:", emailLower, "showLoading:", showLoading);
    
    if (showLoading) {
      setIsCheckingVerification(true);
    }
    
    try {
      console.log("Calling API to check verification status for:", emailLower);
      const response = await get(`/api/consent/check-pre-registration-verification?email=${encodeURIComponent(emailLower)}`);
      console.log("Verification check response:", response);
      if (response.success && response.data?.verified) {
        console.log("Email verified! Stopping polling.");
        // Stop polling first
        if (pollingIntervalRef.current) {
          console.log("Clearing polling interval:", pollingIntervalRef.current);
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Use functional updates to check current state before updating
        setEmailVerificationStatus((currentStatus) => {
          setLastVerifiedEmail((currentVerifiedEmail) => {
            // Only update if not already verified for this email
            if (currentStatus !== "verified" || currentVerifiedEmail !== emailLower) {
              return emailLower;
            }
            return currentVerifiedEmail;
          });
          // Only update if not already verified
          if (currentStatus !== "verified") {
            return "verified";
          }
          return currentStatus;
        });
        
        // Show success dialog if manually checking and consent approved
        if (showLoading) {
          setVerificationDialogMessage("Consent has been approved successfully! You can now complete registration.");
          setVerificationDialogType("success");
          setShowVerificationDialog(true);
        }
      } else {
        // Only update to pending if not already verified
        setEmailVerificationStatus((currentStatus) => {
          if (currentStatus !== "verified") {
            return "pending";
          }
          return currentStatus;
        });
        // Show info dialog if manually checking and consent not approved
        if (showLoading) {
          setVerificationDialogMessage("Consent approval is still pending. Please check your inbox and click the approval link in the email.");
          setVerificationDialogType("info");
          setShowVerificationDialog(true);
        }
      }
    } catch (error) {
      console.error("Error checking email verification:", error);
      // Don't change status if already verified
      setEmailVerificationStatus((currentStatus) => {
        if (currentStatus !== "verified") {
          return "pending";
        }
        return currentStatus;
      });
      if (showLoading) {
        setVerificationDialogMessage("Failed to check verification status. Please try again.");
        setVerificationDialogType("error");
        setShowVerificationDialog(true);
      }
    } finally {
      if (showLoading) {
        setIsCheckingVerification(false);
      }
    }
  }, []);
  
  // Store check function in ref so it's always accessible
  useEffect(() => {
    checkEmailVerificationRef.current = checkEmailVerification;
    console.log("checkEmailVerification stored in ref");
  }, [checkEmailVerification]);
  
  // Manual refresh verification status (check if consent was approved)
  const handleRefreshVerificationStatus = async () => {
    const email = formData.email.trim();
    if (!email) {
      setVerificationDialogMessage("Please enter an email address");
      setVerificationDialogType("error");
      setShowVerificationDialog(true);
      return;
    }
    await checkEmailVerification(email, true);
  };
  
  // Send consent email (consent link)
  const handleSendVerification = async () => {
    const email = formData.email.trim();
    if (!email) {
      setVerificationDialogMessage("Please enter an email address");
      setVerificationDialogType("error");
      setShowVerificationDialog(true);
      return;
    }
    
    setIsSendingVerification(true);
    try {
      const patientName = `${formData.firstName} ${formData.lastName}`.trim() || "Patient";
      const response = await post("/api/consent/send-pre-registration-verification", {
        email: email,
        patientName: patientName || "Patient"
      });
      
      if (response.success) {
        const emailLower = email.trim().toLowerCase();
        setVerificationEmailSent(true);
        
        // Set to pending if not already verified
        setEmailVerificationStatus((currentStatus) => {
          if (currentStatus !== "verified" || lastVerifiedEmail !== emailLower) {
            return "pending";
          }
          return currentStatus;
        });
        
        setVerificationDialogMessage("Consent email sent! Please check your inbox and click the approval link to grant consent.");
        setVerificationDialogType("success");
        setShowVerificationDialog(true);
        
        // Clear any existing polling interval first
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Start polling for verification status - check every 2 seconds
        console.log("Starting polling for email:", emailLower);
        
        // Clear any existing polling first
        if (pollingIntervalRef.current) {
          console.log("Clearing existing polling interval:", pollingIntervalRef.current);
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Ensure the ref is set before starting polling
        checkEmailVerificationRef.current = checkEmailVerification;
        console.log("checkEmailVerification stored in ref before polling starts");
        
        // Create the polling interval - capture email in closure
        // Use a wrapper function to ensure the email is captured correctly
        const pollFunction = () => {
          const currentEmail = emailLower; // Capture email in closure
          console.log("🔵 Polling check executing for email:", currentEmail, "at", new Date().toISOString());
          
          // Use ref to call the function (more reliable than direct call)
          if (checkEmailVerificationRef.current) {
            console.log("Calling checkEmailVerification via ref");
            checkEmailVerificationRef.current(currentEmail, false).catch((err) => {
              console.error("Error in polling check:", err);
            });
          } else {
            console.error("❌ checkEmailVerificationRef.current is null! Cannot check verification.");
            // Fallback: try direct call
            console.log("Attempting direct call as fallback");
            checkEmailVerification(currentEmail, false).catch((err) => {
              console.error("Error in fallback polling check:", err);
            });
          }
        };
        
        // Test immediate execution to verify it works
        console.log("Testing immediate execution...");
        pollFunction();
        
        // Now set up the interval
        const pollInterval = setInterval(pollFunction, 2000);
        
        pollingIntervalRef.current = pollInterval;
        console.log("✅ Polling interval set:", pollInterval, "for email:", emailLower, "will check every 2 seconds");
        
        // Stop polling after 5 minutes
        setTimeout(() => {
          console.log("Stopping polling after 5 minutes for email:", emailLower);
          if (pollingIntervalRef.current === pollInterval) {
            clearInterval(pollInterval);
            pollingIntervalRef.current = null;
          }
        }, 300000);
      } else {
        setVerificationDialogMessage(response.message || "Failed to send verification email. Please try again.");
        setVerificationDialogType("error");
        setShowVerificationDialog(true);
        setVerificationEmailSent(false);
      }
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      setVerificationDialogMessage(error.message || "Failed to send verification email. Please try again.");
      setVerificationDialogType("error");
      setShowVerificationDialog(true);
    } finally {
      setIsSendingVerification(false);
    }
  };
  
  // Cleanup polling when verified
  useEffect(() => {
    if (emailVerificationStatus === "verified" && pollingIntervalRef.current) {
      console.log("Stopping polling because email is verified");
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, [emailVerificationStatus]);
  
  // Cleanup polling on unmount only (separate useEffect to avoid clearing on status changes)
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        console.log("Cleaning up polling interval on component unmount");
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10);
    // Format as: 98765 43210 (5 digits space 5 digits)
    if (limitedDigits.length <= 5) {
      return limitedDigits;
    }
    return `${limitedDigits.slice(0, 5)} ${limitedDigits.slice(5)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  const handleEmergencyPhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData((prev) => ({ ...prev, emergencyPhone: formatted }));
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <UserPlusIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Register New Patient</h1>
            <p className="text-sm text-muted-foreground">
              Add a new patient to the system
            </p>
          </div>
        </div>
        <Link to="/receptionist-dashboard">
          <Button variant="outline">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border border-border shadow-md">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>
              Please fill in all required fields marked with *
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Enter last name (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">
                    Age (in years) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    max="150"
                    required
                    value={formData.age}
                    onChange={(e) => {
                      // Only update the age value while typing
                      handleChange("age", e.target.value);
                    }}
                    onBlur={(e) => {
                      // Calculate dateOfBirth when user leaves the age field
                      // Always recalculate if age is provided, regardless of existing dateOfBirth
                      const ageValue = e.target.value;
                      if (ageValue) {
                        const age = parseInt(ageValue);
                        if (!isNaN(age) && age > 0) {
                          const today = new Date();
                          const birthYear = today.getFullYear() - age;
                          // Use January as default month (or preserve existing month if dateOfBirth already set)
                          let monthYear = `${birthYear}-01`;
                          if (formData.dateOfBirth) {
                            // Preserve the month from existing dateOfBirth if it exists
                            const existingMonth = formData.dateOfBirth.substring(5, 7);
                            monthYear = `${birthYear}-${existingMonth}`;
                          }
                          setFormData((prev) => ({ ...prev, dateOfBirth: monthYear }));
                        }
                      }
                    }}
                    placeholder="Enter age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">
                    Date of Birth (Month/Year)
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="month"
                    value={formData.dateOfBirth}
                    onChange={(e) => {
                      setFormData({ ...formData, dateOfBirth: e.target.value });
                      // Recalculate age if dateOfBirth changes
                      if (e.target.value) {
                        const [year, month] = e.target.value.split('-');
                        const birthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                        const today = new Date();
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                          age--;
                        }
                        setFormData((prev) => ({ ...prev, age: age > 0 ? age.toString() : prev.age, dateOfBirth: e.target.value }));
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Optional - Month and year only</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleChange("gender", value)}
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
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-muted-foreground px-3 py-2 border border-input rounded-md bg-muted">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="98765 43210"
                      maxLength={11}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="patient@example.com"
                      className={emailVerificationStatus === "verified" ? "border-green-500" : ""}
                    />
                    {formData.email && formData.email.trim() && (
                      <div className="space-y-2">
                        {emailVerificationStatus === "verified" ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Email verified</span>
                          </div>
                        ) : emailVerificationStatus === "pending" ? (
                          <div className="flex items-center gap-2 text-sm text-amber-600">
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                            <span>Waiting for email verification...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MailIcon className="h-4 w-4" />
                            <span>Email verification required</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSendVerification}
                            disabled={isSendingVerification || emailVerificationStatus === "verified" || !formData.email.trim() || verificationEmailSent}
                            className="flex-1"
                          >
                            {isSendingVerification ? (
                              <>
                                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : emailVerificationStatus === "verified" ? (
                              <>
                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                Email Verified
                              </>
                            ) : verificationEmailSent ? (
                              <>
                                <MailIcon className="h-4 w-4 mr-2" />
                                Consent Pending
                              </>
                            ) : (
                              <>
                                <MailIcon className="h-4 w-4 mr-2" />
                                Send Consent Link
                              </>
                            )}
                          </Button>
                          {(verificationEmailSent || emailVerificationStatus === "pending") && emailVerificationStatus !== "verified" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleRefreshVerificationStatus}
                              disabled={isCheckingVerification || !formData.email.trim()}
                              className="px-3"
                              title="Check consent approval status"
                            >
                              {isCheckingVerification ? (
                                <Loader2Icon className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCwIcon className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Enter full address"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Emergency Contact (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">
                    Contact Name
                  </Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      handleChange("emergencyContact", e.target.value)
                    }
                    placeholder="Emergency contact name (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">
                    Contact Phone
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-muted-foreground px-3 py-2 border border-input rounded-md bg-muted">
                      +91
                    </span>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => handleEmergencyPhoneChange(e.target.value)}
                      placeholder="98765 43210"
                      maxLength={11}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Medical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select
                    value={formData.bloodGroup}
                    onValueChange={(value) => handleChange("bloodGroup", value)}
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
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Input
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => handleChange("allergies", e.target.value)}
                    placeholder="e.g., Penicillin, Peanuts"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <Textarea
                    id="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={(e) =>
                      handleChange("medicalHistory", e.target.value)
                    }
                    placeholder="Any relevant medical history, chronic conditions, previous surgeries, etc."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Communication Consent */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Communication Preferences
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Please select how you would like to receive healthcare communications:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="consentWhatsApp"
                          checked={communicationConsents.whatsapp}
                          onCheckedChange={(checked) =>
                            setCommunicationConsents((prev) => ({
                              ...prev,
                              whatsapp: checked === true,
                            }))
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="consentWhatsApp"
                          className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer leading-tight"
                        >
                          WhatsApp Messages
                        </label>
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="consentEmail"
                          checked={communicationConsents.email}
                          onCheckedChange={(checked) =>
                            setCommunicationConsents((prev) => ({
                              ...prev,
                              email: checked === true,
                            }))
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="consentEmail"
                          className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer leading-tight"
                        >
                          Email Communications
                        </label>
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="consentSMS"
                          checked={communicationConsents.sms}
                          onCheckedChange={(checked) =>
                            setCommunicationConsents((prev) => ({
                              ...prev,
                              sms: checked === true,
                            }))
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="consentSMS"
                          className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer leading-tight"
                        >
                          SMS Messages
                        </label>
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="consentPhoneCall"
                          checked={communicationConsents.phoneCall}
                          onCheckedChange={(checked) =>
                            setCommunicationConsents((prev) => ({
                              ...prev,
                              phoneCall: checked === true,
                            }))
                          }
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="consentPhoneCall"
                          className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer leading-tight"
                        >
                          Phone Calls
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                      You can update these preferences at any time. These consents are stored for compliance purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Security Confirmation */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-teal-900 dark:text-teal-100">
                      Data Security Confirmation
                    </h4>
                    <p className="text-sm text-teal-800 dark:text-teal-200">
                      We protect your information by:
                    </p>
                    <ul className="space-y-1.5 text-sm text-teal-700 dark:text-teal-300 ml-4 list-disc">
                      <li>Encrypting all personal and medical data in our secure, all-in-one platform.</li>
                      <li>Enabling instant doctor access to your history for better, faster care.</li>
                      <li>Storing data securely with controlled sharing options as per regulations.</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="agreeToTerms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="agreeToTerms"
                    className="text-sm font-medium text-teal-900 dark:text-teal-100 cursor-pointer leading-tight"
                  >
                    I confirm that the patient has been informed about how we protect their data and agrees to the terms above.
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Link to="/receptionist-dashboard">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={isSubmitting || !agreedToTerms || emailVerificationStatus !== "verified"}
              >
                {isSubmitting ? (
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? "Registering..." : "Register Patient"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Verification Status Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              {verificationDialogType === "success" ? (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <CheckCircleIcon className="w-10 h-10 text-white" />
                </div>
              ) : verificationDialogType === "error" ? (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <XCircleIcon className="w-10 h-10 text-white" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <MailIcon className="w-10 h-10 text-white" />
                </div>
              )}
              <DialogTitle className={`text-xl font-bold ${
                verificationDialogType === "success" ? "text-teal-700" :
                verificationDialogType === "error" ? "text-red-700" :
                "text-blue-700"
              }`}>
                {verificationDialogType === "success" ? "Verification Email Sent!" :
                 verificationDialogType === "error" ? "Verification Failed" :
                 "Verification Status"}
              </DialogTitle>
              <DialogDescription className="text-base">
                <p className="text-gray-700">
                  {verificationDialogMessage}
                </p>
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setShowVerificationDialog(false)}
              className={`flex-1 text-white ${
                verificationDialogType === "success" ? "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600" :
                verificationDialogType === "error" ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" :
                "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              }`}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle2Icon className="w-12 h-12 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Patient Registered Successfully!
              </DialogTitle>
              <DialogDescription className="text-base">
                <div className="space-y-2">
                  <p className="font-semibold text-gray-700">
                    {registeredPatient?.name}
                  </p>
                  {registeredPatient?.patientId && (
                    <p className="text-sm text-gray-600">
                      Patient ID: <span className="font-mono font-semibold text-teal-600">{registeredPatient.patientId}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-4">
                    The patient has been successfully added to the system and can now be scheduled for appointments.
                  </p>
                </div>
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
            >
              Continue
            </Button>
            <Link to="/receptionist-dashboard" className="flex-1">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowSuccessDialog(false)}
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
