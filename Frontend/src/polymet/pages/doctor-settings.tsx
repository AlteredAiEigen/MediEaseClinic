import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  UserIcon,
  BellIcon,
  ClockIcon,
  SaveIcon,
  PlusIcon,
  XIcon,
  ActivityIcon,
} from "lucide-react";
import { useState } from "react";

export function DoctorSettings() {
  const [availabilitySlots, setAvailabilitySlots] = useState([
    { day: "Monday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Tuesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Wednesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Thursday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Friday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Saturday", startTime: "10:00", endTime: "14:00", enabled: false },
    { day: "Sunday", startTime: "10:00", endTime: "14:00", enabled: false },
  ]);

  const toggleDay = (index: number) => {
    setAvailabilitySlots((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
  };

  const updateTime = (
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setAvailabilitySlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                <AvatarImage src="https://github.com/denizbuyuktas.png" />

                <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-2xl">
                  AP
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline">Change Photo</Button>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG. Max 2MB
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input defaultValue="Dr. Amit Patel" />
              </div>
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Input defaultValue="MD, General Physician" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" defaultValue="amit.patel@mediease.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" defaultValue="+91 98765 43210" />
              </div>
            </div>

            <Separator />

            {/* Availability Time Section */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Availability Schedule
                </h4>
                <p className="text-xs text-muted-foreground">
                  Set your weekly availability for appointments
                </p>
              </div>

              <div className="space-y-3">
                {availabilitySlots.map((slot, index) => (
                  <div
                    key={slot.day}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    <Switch
                      checked={slot.enabled}
                      onCheckedChange={() => toggleDay(index)}
                    />

                    <div className="flex-1 grid grid-cols-3 gap-3 items-center">
                      <Label
                        className={
                          slot.enabled
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {slot.day}
                      </Label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateTime(index, "startTime", e.target.value)
                        }
                        disabled={!slot.enabled}
                        className="text-sm"
                      />

                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateTime(index, "endTime", e.target.value)
                        }
                        disabled={!slot.enabled}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellIcon className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Email Notifications</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>SMS Alerts</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Appointment Reminders</Label>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
