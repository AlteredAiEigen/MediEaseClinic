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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserIcon, PhoneIcon, MailIcon, MapPinIcon, Loader2Icon } from "lucide-react";
import { post } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { MediEaseLoader } from "@/polymet/components/mediease-loader";

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientAdded?: () => void;
}

export function AddPatientDialog({
  open,
  onOpenChange,
  onPatientAdded,
}: AddPatientDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    bloodGroup: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    } else if (!["male", "female", "other"].includes(formData.gender.toLowerCase())) {
      newErrors.gender = "Please select a valid gender";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.bloodGroup) {
      newErrors.bloodGroup = "Blood group is required";
    } else if (!/^(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)$/.test(formData.bloodGroup)) {
      newErrors.bloodGroup = "Please select a valid blood group";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateAge = (dateOfBirth: string): string => {
    if (!dateOfBirth) return "";
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleSubmit = async () => {
    // Validate form before submission
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Capitalize gender: Male, Female, Other
      const genderMap: Record<string, string> = {
        male: "Male",
        female: "Female",
        other: "Other",
      };
      const capitalizedGender = genderMap[formData.gender.toLowerCase()] || formData.gender;

      // Prepare the data for the API
      const patientData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: capitalizedGender,
        dateOfBirth: formData.dateOfBirth,
        age: calculateAge(formData.dateOfBirth),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        bloodGroup: formData.bloodGroup,
        medicalHistory: formData.medicalHistory.trim() || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        emergencyContactPhone: formData.emergencyPhone.trim() || undefined,
      };

      // Call the backend API
      const response = await post("/api/patients", patientData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Patient added successfully!",
        });
        
        // Reset form and close dialog
        setFormData({
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          gender: "",
          phone: "",
          email: "",
          address: "",
          bloodGroup: "",
          emergencyContact: "",
          emergencyPhone: "",
          medicalHistory: "",
        });
        setErrors({});

        // Close dialog
        onOpenChange(false);

        // Refresh patient list if callback provided
        if (onPatientAdded) {
          onPatientAdded();
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add patient",
          variant: "destructive",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add patient";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      console.error("Error adding patient:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form and errors when dialog closes
  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form when closing
      setFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        email: "",
        address: "",
        bloodGroup: "",
        emergencyContact: "",
        emergencyPhone: "",
        medicalHistory: "",
      });
      setErrors({});
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Add New Patient
          </DialogTitle>
        </DialogHeader>

        {isSubmitting ? (
          <MediEaseLoader>
            <div className="flex gap-6 flex-1 overflow-hidden min-h-[400px]">
              {/* Keep the form visible but dimmed */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-border pr-6 overflow-y-auto opacity-50">
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">First Name</Label>
                      <Input value={formData.firstName} disabled />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Last Name</Label>
                      <Input value={formData.lastName} disabled />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MediEaseLoader>
        ) : (
          <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Left Side - Basic Information */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-border pr-6 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    <Input
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleChange("firstName", e.target.value)
                      }
                      className={`pl-9 ${errors.firstName ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleChange("dateOfBirth", e.target.value)
                    }
                    className={errors.dateOfBirth ? "border-red-500" : ""}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleChange("gender", value)}
                  >
                    <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    <Input
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className={`pl-9 ${errors.phone ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    <Input
                      type="email"
                      placeholder="john.doe@email.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={`pl-9 ${errors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

                  <Textarea
                    placeholder="Street address, city, state, zip code"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    rows={2}
                    className={`pl-9 ${errors.address ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.address && (
                  <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Blood Group <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.bloodGroup}
                  onValueChange={(value) => handleChange("bloodGroup", value)}
                >
                  <SelectTrigger className={errors.bloodGroup ? "border-red-500" : ""}>
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
                {errors.bloodGroup && (
                  <p className="text-xs text-red-500 mt-1">{errors.bloodGroup}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Emergency & Medical Info */}
          <div className="w-80 flex flex-col overflow-y-auto">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
              Emergency Contact
            </h3>
            <div className="space-y-4 flex-1">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Contact Name
                </Label>
                <Input
                  placeholder="Emergency contact name"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    handleChange("emergencyContact", e.target.value)
                  }
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Contact Phone
                </Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                  <Input
                    placeholder="+1 (555) 000-0000"
                    value={formData.emergencyPhone}
                    onChange={(e) =>
                      handleChange("emergencyPhone", e.target.value)
                    }
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Medical History
                </Label>
                <Textarea
                  placeholder="Known allergies, chronic conditions, previous surgeries..."
                  value={formData.medicalHistory}
                  onChange={(e) =>
                    handleChange("medicalHistory", e.target.value)
                  }
                  rows={6}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => handleDialogChange(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.dateOfBirth ||
                  !formData.gender ||
                  !formData.phone ||
                  !formData.email ||
                  !formData.address ||
                  !formData.bloodGroup
                }
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Patient"
                )}
              </Button>
            </div>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
