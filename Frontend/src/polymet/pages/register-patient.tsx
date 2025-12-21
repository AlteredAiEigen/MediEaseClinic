import { useState } from "react";
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
import { UserPlusIcon, ArrowLeftIcon, SaveIcon, Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { post } from "@/lib/api-client";
import { Checkbox } from "@/components/ui/checkbox";

export function RegisterPatient() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
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

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      alert("Please confirm that you agree to the data security terms before registering the patient.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Calculate age from date of birth
      const calculateAge = (dateOfBirth: string) => {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age.toString();
      };

      // Prepare the data for the API
      const patientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        age: calculateAge(formData.dateOfBirth),
        phone: `+91 ${formData.phone.replace(/\s/g, '')}`.trim(),
        email: formData.email || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@example.com`,
        address: formData.address,
        bloodGroup: formData.bloodGroup || "A+", // Default to A+ if not selected
        allergies: formData.allergies || "",
        emergencyContact: formData.emergencyContact,
        emergencyContactPhone: formData.emergencyPhone ? `+91 ${formData.emergencyPhone.replace(/\s/g, '')}`.trim() : "",
        agreedToDataStorage: true, // Patient has agreed via checkbox
      };

      // Call the real backend API
      const response = await post("/api/patients", patientData);
      
      if (!response.success) {
        throw new Error(response.message || "Failed to register patient");
      }

      // Reset form on success
      setFormData({
        firstName: "",
        lastName: "",
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

      // Show success message
      alert("Patient registered successfully!");
    } catch (error) {
      console.error("Error registering patient:", error);
      alert("Failed to register patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleChange("dateOfBirth", e.target.value)
                    }
                  />
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
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="patient@example.com"
                  />
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
              <h3 className="text-lg font-semibold">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">
                    Contact Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emergencyContact"
                    required
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      handleChange("emergencyContact", e.target.value)
                    }
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">
                    Contact Phone <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-muted-foreground px-3 py-2 border border-input rounded-md bg-muted">
                      +91
                    </span>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      required
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
                disabled={isSubmitting || !agreedToTerms}
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
    </div>
  );
}
