import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HealthcareLayout } from "@/polymet/layouts/healthcare-layout";
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
import { RegisterPatient } from "@/polymet/pages/register-patient";
import { PatientOverview } from "@/polymet/pages/patient-overview";
import { PatientDetails } from "@/polymet/pages/patient-details";
import { ConsultationSession } from "@/polymet/pages/consultation-session-new";

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
            <HealthcareLayout
              userRole="admin"
              userName="Ravi Shankar"
              userAvatar="https://github.com/yusufhilmi.png"
            >
              <AdminDashboard />
            </HealthcareLayout>
          }
        />

        <Route
          path="/admin-credentials"
          element={
            <HealthcareLayout
              userRole="admin"
              userName="Ravi Shankar"
              userAvatar="https://github.com/yusufhilmi.png"
            >
              <AdminCredentials />
            </HealthcareLayout>
          }
        />

        <Route
          path="/admin/user-profile/:userId"
          element={
            <HealthcareLayout
              userRole="admin"
              userName="Ravi Shankar"
              userAvatar="https://github.com/yusufhilmi.png"
            >
              <AdminUserProfile />
            </HealthcareLayout>
          }
        />

        <Route
          path="/admin-patients"
          element={
            <HealthcareLayout
              userRole="admin"
              userName="Ravi Shankar"
              userAvatar="https://github.com/yusufhilmi.png"
            >
              <AdminPatients />
            </HealthcareLayout>
          }
        />

        <Route
          path="/admin-appointments"
          element={
            <HealthcareLayout
              userRole="admin"
              userName="Ravi Shankar"
              userAvatar="https://github.com/yusufhilmi.png"
            >
              <AdminAppointments />
            </HealthcareLayout>
          }
        />

        <Route
          path="/admin-settings"
          element={
            <HealthcareLayout
              userRole="admin"
              userName="Ravi Shankar"
              userAvatar="https://github.com/yusufhilmi.png"
            >
              <AdminSettings />
            </HealthcareLayout>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor-dashboard"
          element={
            <HealthcareLayout
              userRole="doctor"
              userName="Dr. Amit Patel"
              userAvatar="https://github.com/denizbuyuktas.png"
            >
              <DoctorDashboard />
            </HealthcareLayout>
          }
        />

        <Route
          path="/doctor-patients"
          element={
            <HealthcareLayout
              userRole="doctor"
              userName="Dr. Amit Patel"
              userAvatar="https://github.com/denizbuyuktas.png"
            >
              <DoctorPatients />
            </HealthcareLayout>
          }
        />

        <Route
          path="/doctor-workstation"
          element={
            <HealthcareLayout
              userRole="doctor"
              userName="Dr. Amit Patel"
              userAvatar="https://github.com/denizbuyuktas.png"
            >
              <DoctorWorkstation />
            </HealthcareLayout>
          }
        />

        <Route
          path="/doctor-appointments"
          element={
            <HealthcareLayout
              userRole="doctor"
              userName="Dr. Amit Patel"
              userAvatar="https://github.com/denizbuyuktas.png"
            >
              <DoctorAppointments />
            </HealthcareLayout>
          }
        />

        <Route
          path="/doctor-settings"
          element={
            <HealthcareLayout
              userRole="doctor"
              userName="Dr. Amit Patel"
              userAvatar="https://github.com/denizbuyuktas.png"
            >
              <DoctorSettings />
            </HealthcareLayout>
          }
        />

        <Route
          path="/patient-overview/:patientId"
          element={
            <HealthcareLayout
              userRole="doctor"
              userName="Dr. Amit Patel"
              userAvatar="https://github.com/denizbuyuktas.png"
            >
              <PatientOverview />
            </HealthcareLayout>
          }
        />

        <Route
          path="/patient-details/:patientId"
          element={
            <HealthcareLayout
              userRole="doctor"
              userName="Dr. Amit Patel"
              userAvatar="https://github.com/denizbuyuktas.png"
            >
              <PatientDetails />
            </HealthcareLayout>
          }
        />

        <Route
          path="/consultation/:patientId"
          element={
            <HealthcareLayout
              userRole="doctor"
              userName="Dr. Amit Patel"
              userAvatar="https://github.com/denizbuyuktas.png"
            >
              <ConsultationSession />
            </HealthcareLayout>
          }
        />

        {/* Admin Patient Details Route */}
        <Route
          path="/admin/patient-details/:patientId"
          element={
            <HealthcareLayout
              userRole="admin"
              userName="Ravi Shankar"
              userAvatar="https://github.com/yusufhilmi.png"
            >
              <PatientDetails />
            </HealthcareLayout>
          }
        />

        {/* Receptionist Routes */}
        <Route
          path="/receptionist-dashboard"
          element={
            <HealthcareLayout
              userRole="receptionist"
              userName="Meera Krishnan"
              userAvatar="https://github.com/kdrnp.png"
            >
              <ReceptionistDashboardNew />
            </HealthcareLayout>
          }
        />

        <Route
          path="/receptionist-patients"
          element={
            <HealthcareLayout
              userRole="receptionist"
              userName="Meera Krishnan"
              userAvatar="https://github.com/kdrnp.png"
            >
              <ReceptionistPatients />
            </HealthcareLayout>
          }
        />

        <Route
          path="/receptionist-appointments"
          element={
            <HealthcareLayout
              userRole="receptionist"
              userName="Meera Krishnan"
              userAvatar="https://github.com/kdrnp.png"
            >
              <ReceptionistAppointments />
            </HealthcareLayout>
          }
        />

        <Route
          path="/register-patient"
          element={
            <HealthcareLayout
              userRole="receptionist"
              userName="Meera Krishnan"
              userAvatar="https://github.com/kdrnp.png"
            >
              <RegisterPatient />
            </HealthcareLayout>
          }
        />

        <Route
          path="/receptionist/patient-details/:patientId"
          element={
            <HealthcareLayout
              userRole="receptionist"
              userName="Meera Krishnan"
              userAvatar="https://github.com/kdrnp.png"
            >
              <PatientDetails />
            </HealthcareLayout>
          }
        />

        <Route
          path="/receptionist-settings"
          element={
            <HealthcareLayout
              userRole="receptionist"
              userName="Meera Krishnan"
              userAvatar="https://github.com/kdrnp.png"
            >
              <ReceptionistSettings />
            </HealthcareLayout>
          }
        />
      </Routes>
    </Router>
  );
}
