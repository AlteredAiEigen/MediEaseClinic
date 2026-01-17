import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { RequireAuth } from "@/components/require-auth";

// Lazy load all page components for better performance
const HealthcareLanding = lazy(() => import("@/polymet/pages/healthcare-landing").then(module => ({ default: module.HealthcareLanding })));
const FeaturesPage = lazy(() => import("@/polymet/pages/features-page").then(module => ({ default: module.FeaturesPage })));
const SolutionsPage = lazy(() => import("@/polymet/pages/solutions-page").then(module => ({ default: module.SolutionsPage })));
const SecurityPage = lazy(() => import("@/polymet/pages/security-page").then(module => ({ default: module.SecurityPage })));
const RoadmapPage = lazy(() => import("@/polymet/pages/roadmap-page").then(module => ({ default: module.RoadmapPage })));
const ContactPage = lazy(() => import("@/polymet/pages/contact-page").then(module => ({ default: module.ContactPage })));
const AboutUsPage = lazy(() => import("@/polymet/pages/about-us-page").then(module => ({ default: module.AboutUsPage })));
const RoleSelection = lazy(() => import("@/polymet/pages/role-selection").then(module => ({ default: module.RoleSelection })));
const AuthPage = lazy(() => import("@/polymet/pages/auth-page").then(module => ({ default: module.AuthPage })));
const AdminDashboard = lazy(() => import("@/polymet/pages/admin-dashboard").then(module => ({ default: module.AdminDashboard })));
const AdminCredentials = lazy(() => import("@/polymet/pages/admin-credentials").then(module => ({ default: module.AdminCredentials })));
const AdminUserProfile = lazy(() => import("@/polymet/pages/admin-user-profile").then(module => ({ default: module.AdminUserProfile })));
const AdminPatients = lazy(() => import("@/polymet/pages/admin-patients").then(module => ({ default: module.AdminPatients })));
const AdminAppointments = lazy(() => import("@/polymet/pages/admin-appointments").then(module => ({ default: module.AdminAppointments })));
const AdminSettings = lazy(() => import("@/polymet/pages/admin-settings").then(module => ({ default: module.AdminSettings })));
const AdminBilling = lazy(() => import("@/polymet/pages/admin-billing").then(module => ({ default: module.AdminBilling })));
const DoctorDashboard = lazy(() => import("@/polymet/pages/doctor-dashboard").then(module => ({ default: module.DoctorDashboard })));
const DoctorPatients = lazy(() => import("@/polymet/pages/doctor-patients").then(module => ({ default: module.DoctorPatients })));
const DoctorWorkstation = lazy(() => import("@/polymet/pages/doctor-workstation").then(module => ({ default: module.DoctorWorkstation })));
const DoctorAppointments = lazy(() => import("@/polymet/pages/doctor-appointments").then(module => ({ default: module.DoctorAppointments })));
const DoctorSettings = lazy(() => import("@/polymet/pages/doctor-settings").then(module => ({ default: module.DoctorSettings })));
const ReceptionistDashboardNew = lazy(() => import("@/polymet/pages/receptionist-dashboard-new").then(module => ({ default: module.ReceptionistDashboardNew })));
const ReceptionistPatients = lazy(() => import("@/polymet/pages/receptionist-patients").then(module => ({ default: module.ReceptionistPatients })));
const ReceptionistAppointments = lazy(() => import("@/polymet/pages/receptionist-appointments").then(module => ({ default: module.ReceptionistAppointments })));
const ReceptionistSettings = lazy(() => import("@/polymet/pages/receptionist-settings").then(module => ({ default: module.ReceptionistSettings })));
const ReceptionistWorkstation = lazy(() => import("@/polymet/pages/receptionist-workstation").then(module => ({ default: module.ReceptionistWorkstation })));
const RegisterPatient = lazy(() => import("@/polymet/pages/register-patient").then(module => ({ default: module.RegisterPatient })));
const WhatsAppMessages = lazy(() => import("@/polymet/pages/whatsapp-messages").then(module => ({ default: module.WhatsAppMessages })));
const PatientOverview = lazy(() => import("@/polymet/pages/patient-overview").then(module => ({ default: module.PatientOverview })));
const PatientDashboard = lazy(() => import("@/polymet/pages/patient-dashboard").then(module => ({ default: module.PatientDashboard })));
const ConsultationSession = lazy(() => import("@/polymet/pages/consultation-session-new").then(module => ({ default: module.ConsultationSession })));
const HealthcareLayout = lazy(() => import("@/polymet/layouts/healthcare-layout").then(module => ({ default: module.HealthcareLayout })));
const LoaderShowcasePage = lazy(() => import("@/polymet/pages/loader-showcase-page").then(module => ({ default: module.LoaderShowcasePage })));
const ResetPasswordPage = lazy(() => import("@/polymet/pages/reset-password").then(module => ({ default: module.ResetPasswordPage })));
const TermsOfServicePage = lazy(() => import("@/polymet/pages/terms-of-service-page").then(module => ({ default: module.TermsOfServicePage })));
const PrivacyPolicyPage = lazy(() => import("@/polymet/pages/privacy-policy-page").then(module => ({ default: module.PrivacyPolicyPage })));

// Import MediEase loader
import { MediEaseLoader } from "@/components/mediease-loader";

// Loading component for Suspense fallback
const LoadingFallback = () => <MediEaseLoader message="Loading page..." fullScreen />;

const prefetchModules = () => {
  const modules = [
    import("@/polymet/layouts/healthcare-layout"),
    import("@/polymet/pages/doctor-dashboard"),
    import("@/polymet/pages/doctor-appointments"),
    import("@/polymet/pages/doctor-workstation"),
    import("@/polymet/pages/doctor-patients"),
  ];

  modules.forEach((promise) => {
    promise.catch(() => {
      // Ignore prefetch failures; chunks will load on demand.
    });
  });
};

function usePrefetchDoctorRoutes() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const win = window as unknown as {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
      setTimeout: typeof window.setTimeout;
      clearTimeout: typeof window.clearTimeout;
    };

    if (win.requestIdleCallback) {
      const idleId = win.requestIdleCallback(prefetchModules);
      return () => {
        if (win.cancelIdleCallback) {
          win.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = win.setTimeout(prefetchModules, 1500);
    return () => win.clearTimeout(timeoutId);
  }, []);
}

export default function MediEaseClinicPrototype() {
  usePrefetchDoctorRoutes();

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HealthcareLanding />} />

          <Route path="/features" element={<FeaturesPage />} />

          <Route path="/pricing" element={<SolutionsPage />} />

          <Route path="/security" element={<SecurityPage />} />

          <Route path="/roadmap" element={<RoadmapPage />} />

          <Route path="/contact" element={<ContactPage />} />

          <Route path="/about-us" element={<AboutUsPage />} />

          <Route path="/role-selection" element={<RoleSelection />} />

          <Route path="/auth" element={<AuthPage />} />

          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/terms-of-service" element={<TermsOfServicePage />} />

          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

          <Route path="/loader" element={<LoaderShowcasePage />} />

          {/* Admin Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <RequireAuth role="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <AdminDashboard />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/admin-credentials"
            element={
              <RequireAuth role="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <AdminCredentials />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/admin/user-profile/:userId"
            element={
              <RequireAuth role="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <AdminUserProfile />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/admin-patients"
            element={
              <RequireAuth role="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <AdminPatients />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/admin-appointments"
            element={
              <RequireAuth role="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <AdminAppointments />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/admin-settings"
            element={
              <RequireAuth role="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <AdminSettings />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/admin-billing"
            element={
              <RequireAuth role="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <AdminBilling />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/admin/patient-details/:patientId"
            element={
              <RequireAuth role="admin">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <PatientOverview />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor-dashboard"
            element={
              <RequireAuth role="doctor">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <DoctorDashboard />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/doctor-patients"
            element={
              <RequireAuth role="doctor">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <DoctorPatients />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/doctor-workstation"
            element={
              <RequireAuth role="doctor">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <DoctorWorkstation />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/doctor-appointments"
            element={
              <RequireAuth role="doctor">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <DoctorAppointments />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/doctor-settings"
            element={
              <RequireAuth role="doctor">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <DoctorSettings />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/patient-overview/:patientId"
            element={
              <RequireAuth role="doctor">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <PatientOverview />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          {/* Embedded patient overview (no sidebar/header layout) - used inside consultation bottom-sheet */}
          <Route
            path="/embedded/patient-overview/:patientId"
            element={
              <RequireAuth role="doctor">
                <Suspense fallback={<LoadingFallback />}>
                  <PatientOverview />
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/consultation/:patientId"
            element={
              <RequireAuth role="doctor">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <ConsultationSession />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          {/* Receptionist Routes */}
          <Route
            path="/receptionist-dashboard"
            element={
              <RequireAuth role="receptionist">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <ReceptionistDashboardNew />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/receptionist-patients"
            element={
              <RequireAuth role="receptionist">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <ReceptionistPatients />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/receptionist-appointments"
            element={
              <RequireAuth role="receptionist">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <ReceptionistAppointments />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/register-patient"
            element={
              <RequireAuth role="receptionist">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <RegisterPatient />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/receptionist-settings"
            element={
              <RequireAuth role="receptionist">
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <ReceptionistSettings />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          {/* WhatsApp Messages - Available for all roles */}
          <Route
            path="/whatsapp-messages"
            element={
              <RequireAuth role={["admin", "doctor", "receptionist"]}>
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <WhatsAppMessages />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

          {/* Patient Dashboard - Available for all roles */}
          <Route
            path="/patient-dashboard/:patientId"
            element={
              <RequireAuth role={["admin", "doctor", "receptionist"]}>
                <Suspense fallback={<LoadingFallback />}>
                  <HealthcareLayout>
                    <PatientDashboard />
                  </HealthcareLayout>
                </Suspense>
              </RequireAuth>
            }
          />

        </Routes>
      </Suspense>
    </Router>
  );
}
