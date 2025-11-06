import { get } from "@/lib/api-client";

export interface AdminMetricsSummary {
  patients: {
    total: number;
    activeInClinic: number;
  };
  appointments: {
    total: number;
    upcoming: number;
    completed: number;
  };
  doctors: {
    total: number;
    active: number;
  };
  queue: {
    totalWaiting: number;
    averageWaitTime: number;
    inConsultation: number;
  };
}

export interface RevenueMetricPoint {
  month: string;
  appointments: number;
  completed: number;
  revenue: number;
}

export interface AdminDashboardStats {
  totalPatients: number;
  totalAppointments: number;
  totalDoctors: number;
  totalReceptionists: number;
  totalClinicalNotes: number;
  totalRecordings: number;
  appointmentsToday: number;
  patientsThisMonth: number;
  recentActivity: {
    type: string;
    description: string;
    date: string;
    user: string;
  }[];
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const response = await get<{ data: AdminDashboardStats }>("/api/admin/dashboard");
  return (
    (response.data as unknown as AdminDashboardStats) ?? {
      totalPatients: 0,
      totalAppointments: 0,
      totalDoctors: 0,
      totalReceptionists: 0,
      totalClinicalNotes: 0,
      totalRecordings: 0,
      appointmentsToday: 0,
      patientsThisMonth: 0,
      recentActivity: [],
    }
  );
}

export async function fetchAdminSummary(): Promise<AdminMetricsSummary> {
  const response = await get<AdminMetricsSummary>("/api/admin/metrics/summary");
  return (
    response.data ?? {
      patients: { total: 0, activeInClinic: 0 },
      appointments: { total: 0, upcoming: 0, completed: 0 },
      doctors: { total: 0, active: 0 },
      queue: { totalWaiting: 0, averageWaitTime: 0, inConsultation: 0 },
    }
  );
}

export async function fetchRevenueSeries(): Promise<RevenueMetricPoint[]> {
  const response = await get<{ series: RevenueMetricPoint[] }>(
    "/api/admin/metrics/revenue"
  );
  return response.data?.series ?? [];
}

