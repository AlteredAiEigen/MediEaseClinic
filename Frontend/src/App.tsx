import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HealthcareLanding } from "@/polymet/pages/healthcare-landing";
import { FeaturesPage } from "@/polymet/pages/features-page";
import { SolutionsPage } from "@/polymet/pages/solutions-page";
import { SecurityPage } from "@/polymet/pages/security-page";
import { RoadmapPage } from "@/polymet/pages/roadmap-page";
import { RoleSelection } from "@/polymet/pages/role-selection";
import { AuthPage } from "@/polymet/pages/auth-page";
import { AdminDashboard } from "@/polymet/pages/admin-dashboard";
import { AdminCredentials } from "@/polymet/pages/admin-credentials";
import { AdminUserProfile } from "@/polymet/pages/admin-user-profile";
import { AdminPatients } from "@/polymet/pages/admin-patients";
import { AdminAppointments } from "@/polymet/pages/admin-appointments";
import { AdminSettings } from "@/polymet/pages/admin-settings";
import { DoctorDashboard } from "@/polymet/pages/doctor-dashboard";
import { DoctorPatients } from "@/polymet/pages/doctor-patients";
import { DoctorWorkstation } from "@/polymet/pages/doctor-workstation";
import { DoctorAppointments } from "@/polymet/pages/doctor-appointments";
import { DoctorSettings } from "@/polymet/pages/doctor-settings";
import { ReceptionistDashboardNew } from "@/polymet/pages/receptionist-dashboard-new";
import { ReceptionistPatients } from "@/polymet/pages/receptionist-patients";
import { ReceptionistAppointments } from "@/polymet/pages/receptionist-appointments";
import { ReceptionistSettings } from "@/polymet/pages/receptionist-settings";
import { ReceptionistWorkstation } from "@/polymet/pages/receptionist-workstation";
import { RegisterPatient } from "@/polymet/pages/register-patient";
import { PatientOverview } from "@/polymet/pages/patient-overview";
import { ConsultationSession } from "@/polymet/pages/consultation-session-new";
import { HealthcareLayout } from "@/polymet/layouts/healthcare-layout";
import { RequireAuth } from "@/components/require-auth";

export default function MediEaseClinicPrototype() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HealthcareLanding />} />

        <Route path="/features" element={<FeaturesPage />} />

        <Route path="/solutions" element={<SolutionsPage />} />

        <Route path="/security" element={<SecurityPage />} />

        <Route path="/roadmap" element={<RoadmapPage />} />

        <Route path="/role-selection" element={<RoleSelection />} />

        <Route path="/auth" element={<AuthPage />} />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <RequireAuth role="admin">
              <HealthcareLayout>
                <AdminDashboard />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin-credentials"
          element={
            <RequireAuth role="admin">
              <HealthcareLayout>
                <AdminCredentials />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/user-profile/:userId"
          element={
            <RequireAuth role="admin">
              <HealthcareLayout>
                <AdminUserProfile />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin-patients"
          element={
            <RequireAuth role="admin">
              <HealthcareLayout>
                <AdminPatients />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin-appointments"
          element={
            <RequireAuth role="admin">
              <HealthcareLayout>
                <AdminAppointments />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin-settings"
          element={
            <RequireAuth role="admin">
              <HealthcareLayout>
                <AdminSettings />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor-dashboard"
          element={
            <RequireAuth role="doctor">
              <HealthcareLayout>
                <DoctorDashboard />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/doctor-patients"
          element={
            <RequireAuth role="doctor">
              <HealthcareLayout>
                <DoctorPatients />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/doctor-workstation"
          element={
            <RequireAuth role="doctor">
              <HealthcareLayout>
                <DoctorWorkstation />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/doctor-appointments"
          element={
            <RequireAuth role="doctor">
              <HealthcareLayout>
                <DoctorAppointments />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/doctor-settings"
          element={
            <RequireAuth role="doctor">
              <HealthcareLayout>
                <DoctorSettings />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/patient-overview/:patientId"
          element={
            <RequireAuth role={["doctor", "admin", "receptionist"]}>
              <HealthcareLayout>
                <PatientOverview />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/consultation/:patientId"
          element={
            <RequireAuth role="doctor">
              <HealthcareLayout>
                <ConsultationSession />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        {/* Receptionist Routes */}
        <Route
          path="/receptionist-dashboard"
          element={
            <RequireAuth role="receptionist">
              <HealthcareLayout>
                <ReceptionistDashboardNew />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/receptionist-patients"
          element={
            <RequireAuth role="receptionist">
              <HealthcareLayout>
                <ReceptionistPatients />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/receptionist-appointments"
          element={
            <RequireAuth role="receptionist">
              <HealthcareLayout>
                <ReceptionistAppointments />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/register-patient"
          element={
            <RequireAuth role="receptionist">
              <HealthcareLayout>
                <RegisterPatient />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/receptionist-settings"
          element={
            <RequireAuth role="receptionist">
              <HealthcareLayout>
                <ReceptionistSettings />
              </HealthcareLayout>
            </RequireAuth>
          }
        />

      </Routes>
    </Router>
  );
}
