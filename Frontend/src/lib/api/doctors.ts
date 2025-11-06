import { get } from "@/lib/api-client";

export interface DoctorSummary {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  speciality?: string;
  licenceNumber?: string;
  experienceYears?: number;
  patientsCount?: number;
  profileImage?: string;
  isActive?: boolean;
}

export interface DoctorListParams {
  page?: number;
  limit?: number;
  speciality?: string;
  isActive?: boolean;
}

export interface DoctorListResponse {
  doctors: DoctorSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface DoctorStats {
  totalDoctors: number;
  activeDoctors: number;
  doctorsBySpeciality: Record<string, number>;
  averageAppointmentsPerDoctor: number;
}

export async function fetchDoctors(
  params: DoctorListParams = {}
): Promise<DoctorListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.speciality) searchParams.set("speciality", params.speciality);
  if (typeof params.isActive === "boolean") {
    searchParams.set("isActive", String(params.isActive));
  }

  const response = await get<DoctorSummary[]>(
    `/api/doctors?${searchParams.toString()}`
  );

  return {
    doctors: response.data ?? [],
    total: response.pagination?.total ?? response.data?.length ?? 0,
    page: response.pagination?.page ?? params.page ?? 1,
    limit: response.pagination?.limit ?? params.limit ?? 10,
  };
}

export async function fetchDoctorStats(): Promise<DoctorStats> {
  const response = await get<{ stats: DoctorStats }>("/api/doctors/stats");
  return (
    response.data ?? {
      totalDoctors: 0,
      activeDoctors: 0,
      doctorsBySpeciality: {},
      averageAppointmentsPerDoctor: 0,
    }
  );
}

