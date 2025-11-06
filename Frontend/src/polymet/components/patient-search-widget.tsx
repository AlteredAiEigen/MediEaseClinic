import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, UserIcon } from "lucide-react";
import { patients } from "@/polymet/data/healthcare-data";

interface PatientSearchWidgetProps {
  userRole?: "admin" | "doctor";
  className?: string;
}

export function PatientSearchWidget({
  userRole = "doctor",
  className,
}: PatientSearchWidgetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const filteredPatients = searchQuery
    ? patients
        .filter(
          (patient) =>
            patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const getPatientDetailsPath = (patientId: string) => {
    return userRole === "admin"
      ? `/admin/patient-details/${patientId}`
      : `/patient-details/${patientId}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <SearchIcon className="w-5 h-5 text-teal-600" />
          Quick Patient Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <Input
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="pl-10"
          />

          {showResults && filteredPatients.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {filteredPatients.map((patient) => {
                const patientPath = getPatientDetailsPath(patient.id);
                return (
                  <Link
                    key={patient.id}
                    to={patientPath}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 block"
                  >
                    <Avatar className="w-10 h-10 border border-border">
                      <AvatarImage src={patient.avatar} alt={patient.name} />

                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {patient.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {patient.id}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs bg-teal-50 text-teal-700 border-teal-200"
                    >
                      View
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}

          {showResults && searchQuery && filteredPatients.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-4 text-center">
              <UserIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />

              <p className="text-sm text-muted-foreground">No patients found</p>
            </div>
          )}
        </div>

        {!searchQuery && (
          <p className="text-xs text-muted-foreground mt-3">
            Search for patients by name or ID to view their details
          </p>
        )}
      </CardContent>
    </Card>
  );
}
