const STORAGE_KEY = "mediease:pendingConsultationUploads";

export type PendingConsultationStatus = "uploading" | "error";

export interface PendingConsultationUpload {
  id: string;
  doctorId: string;
  patientId: string;
  patientFriendlyId?: string;
  patientName?: string;
  appointmentId?: string;
  appointmentType?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status: PendingConsultationStatus;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

function readPendingUploads(): PendingConsultationUpload[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => typeof entry === "object" && entry !== null);
    }
  } catch (err) {
    console.warn("Failed to read pending consultation uploads", err);
  }
  return [];
}

function writePendingUploads(entries: PendingConsultationUpload[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn("Failed to persist pending consultation uploads", err);
  }
}

export function addPendingConsultationUpload(entry: PendingConsultationUpload) {
  const entries = readPendingUploads();
  entries.push(entry);
  writePendingUploads(entries);
}

export function updatePendingConsultationUpload(
  id: string,
  update: Partial<PendingConsultationUpload>
) {
  const entries = readPendingUploads();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return;

  entries[index] = {
    ...entries[index],
    ...update,
    updatedAt: update.updatedAt ?? new Date().toISOString(),
  };
  writePendingUploads(entries);
}

export function removePendingConsultationUpload(id: string) {
  const entries = readPendingUploads().filter((entry) => entry.id !== id);
  writePendingUploads(entries);
}

export function getPendingConsultationUploadsByDoctor(
  doctorId: string
): PendingConsultationUpload[] {
  return readPendingUploads().filter((entry) => entry.doctorId === doctorId);
}

export function clearPendingConsultationUploads() {
  writePendingUploads([]);
}
