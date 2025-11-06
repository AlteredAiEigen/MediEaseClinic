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
import { UserIcon, PhoneIcon, MailIcon, MapPinIcon } from "lucide-react";

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPatientDialog({
  open,
  onOpenChange,
}: AddPatientDialogProps) {
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Adding patient:", formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Add New Patient
          </DialogTitle>
        </DialogHeader>

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
                    First Name *
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    <Input
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleChange("firstName", e.target.value)
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Last Name *
                  </Label>
                  <Input
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Date of Birth *
                  </Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleChange("dateOfBirth", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Gender *
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleChange("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Phone Number *
                  </Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    <Input
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Email
                  </Label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    <Input
                      type="email"
                      placeholder="john.doe@email.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Address
                </Label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

                  <Textarea
                    placeholder="Street address, city, state, zip code"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    rows={2}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Blood Group
                </Label>
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
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.dateOfBirth ||
                  !formData.gender ||
                  !formData.phone
                }
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Add Patient
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
